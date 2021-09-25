/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { Mark, Node } from "prosemirror-model";

// ::- This is an object used to track state and expose
// methods related to markdown serialization. Instances are passed to
// node and mark serialization methods (see `toMarkdown`).
export class MarkdownSerializerState {
  marks: any;
  out: any;
  nodes: any;
  delim: string;
  closed: false | Node;
  inTightList: boolean;
  options: any;
  constructor(nodes: any, marks: any, options: any) {
    this.nodes = nodes;
    this.marks = marks;
    this.delim = this.out = "";
    this.closed = false;
    this.inTightList = false;
    // :: Object
    // The options passed to the serializer.
    //   tightLists:: ?bool
    //   Whether to render lists in a tight style. This can be overridden
    //   on a node level by specifying a tight attribute on the node.
    //   Defaults to false.
    this.options = options || {};
    if (typeof this.options.tightLists == "undefined") {
      this.options.tightLists = false;
    }
  }

  flushClose(size?: number) {
    if (this.closed) {
      if (!this.atBlank()) this.out += "\n";
      if (size == null) size = 2;
      if (size > 1) {
        let delimMin = this.delim;
        const trim = /\s+$/.exec(delimMin);
        if (trim) {
          delimMin = delimMin.slice(0, delimMin.length - trim[0].length);
        }
        for (let i = 1; i < size; i++) {
          this.out += delimMin + "\n";
        }
      }
      this.closed = false;
    }
  }

  // :: (string, ?string, Node, ())
  // Render a block, prefixing each line with `delim`, and the first
  // line in `firstDelim`. `node` should be the node that is closed at
  // the end of the block, and `f` is a function that renders the
  // content of the block.
  wrapBlock(delim: string, firstDelim: string | null, node: Node, f: () => any) {
    const old = this.delim;
    this.write(firstDelim || delim);
    this.delim += delim;
    f();
    this.delim = old;
    this.closeBlock(node);
  }

  atBlank() {
    return /(^|\n)$/.test(this.out);
  }

  // :: ()
  // Ensure the current content ends with a newline.
  ensureNewLine() {
    if (!this.atBlank()) this.out += "\n";
  }

  // :: (?string)
  // Prepare the state for writing output (closing closed paragraphs,
  // adding delimiters, and so on), and then optionally add content
  // (unescaped) to the output.
  write(content?: string) {
    this.flushClose();
    if (this.delim && this.atBlank()) {
      this.out += this.delim;
    }
    if (content) this.out += content;
  }

  // :: (Node)
  // Close the block for the given node.
  closeBlock(node: Node) {
    this.closed = node;
  }

  // :: (string, ?bool)
  // Add the given text to the document. When escape is not `false`,
  // it will be escaped.
  text(text: string, escape?: boolean) {
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const startOfLine = this.atBlank() || this.closed;
      this.write();
      this.out += escape !== false ? this.esc(lines[i], !!startOfLine) : lines[i];
      if (i != lines.length - 1) this.out += "\n";
    }
  }

  // :: (Node)
  // Render the given node as a block.
  render(node: Node, parent: Node | number, index: number) {
    if (typeof parent == "number") throw new Error("!");
    if (!this.nodes[node.type.name]) {
      throw new Error("Token type `" + node.type.name + "` not supported by Markdown renderer");
    }
    this.nodes[node.type.name](this, node, parent, index);
  }

  // :: (Node)
  // Render the contents of `parent` as block nodes.
  renderContent(parent: Node) {
    parent.forEach((node, _, i) => this.render(node, parent, i));
  }

  // :: (Node)
  // Render the contents of `parent` as inline content.
  renderInline(parent: Node) {
    const active: Mark<any>[] = [];
    let trailing = "";
    const progress = (node: Node | null, _: number | null, index: number) => {
      let marks = node ? node.marks : [];

      // Remove marks from `hard_break` that are the last node inside
      // that mark to prevent parser edge cases with new lines just
      // before closing marks.
      // (FIXME it'd be nice if we had a schema-agnostic way to
      // identify nodes that serialize as hard breaks)
      if (node && node.type.name === "hard_break") {
        marks = marks.filter((m) => {
          if (index + 1 == parent.childCount) return false;
          const next = parent.child(index + 1);
          return m.isInSet(next.marks) && (!next.isText || /\S/.test(next.text!));
        });
      }

      let leading = trailing;
      trailing = "";
      // If whitespace has to be expelled from the node, adjust
      // leading and trailing accordingly.
      if (
        node &&
        node.isText &&
        marks.some((mark) => {
          const info = this.marks[mark.type.name];
          return info && info.expelEnclosingWhitespace;
        })
      ) {
        const [_, lead, inner, trail] = /^(\s*)(.*?)(\s*)$/m.exec(node.text!) as RegExpExecArray;
        leading += lead;
        trailing = trail;
        if (lead || trail) {
          node = inner ? (node as any).withText(inner) : null;
          if (!node) marks = active;
        }
      }

      const inner = (marks.length && marks[marks.length - 1]) as Mark<any>;
      const noEsc = inner && this.marks[inner.type.name].escape === false;
      const len = marks.length - (noEsc ? 1 : 0);

      // Try to reorder 'mixable' marks, such as em and strong, which
      // in Markdown may be opened and closed in different order, so
      // that order of the marks for the token matches the order in
      // active.
      outer: for (let i = 0; i < len; i++) {
        const mark = marks[i];
        if (!this.marks[mark.type.name].mixable) break;
        for (let j = 0; j < active.length; j++) {
          const other = active[j];
          if (!this.marks[other.type.name].mixable) break;
          if (mark.eq(other)) {
            if (i > j) {
              marks = marks
                .slice(0, j)
                .concat(mark)
                .concat(marks.slice(j, i))
                .concat(marks.slice(i + 1, len));
            } else if (j > i) {
              marks = marks
                .slice(0, i)
                .concat(marks.slice(i + 1, j))
                .concat(mark)
                .concat(marks.slice(j, len));
            }
            continue outer;
          }
        }
      }

      // Find the prefix of the mark set that didn't change
      let keep = 0;
      while (keep < Math.min(active.length, len) && marks[keep].eq(active[keep])) {
        ++keep;
      }

      // Close the marks that need to be closed
      while (keep < active.length) {
        this.text(this.markString(active.pop()!, false, parent, index), false);
      }

      // Output any previously expelled trailing whitespace outside the marks
      if (leading) this.text(leading);

      // Open the marks that need to be opened
      if (node) {
        while (active.length < len) {
          const add = marks[active.length];
          active.push(add);
          this.text(this.markString(add, true, parent, index), false);
        }

        // Render the node. Special case code marks, since their content
        // may not be escaped.
        if (noEsc && node.isText) {
          this.text(
            this.markString(inner, true, parent, index) + node.text + this.markString(inner, false, parent, index + 1),
            false
          );
        } else {
          this.render(node, parent, index);
        }
      }
    };
    parent.forEach(progress);
    progress(null, null, parent.childCount);
  }

  // :: (Node, string, (number) → string)
  // Render a node's content as a list. `delim` should be the extra
  // indentation added to all lines except the first in an item,
  // `firstDelim` is a function going from an item index to a
  // delimiter for the first line of the item.
  renderList(node: Node, delim: string, firstDelim: (n: number) => string) {
    if (this.closed && this.closed.type == node.type) {
      this.flushClose(3);
    } else if (this.inTightList) {
      this.flushClose(1);
    }

    const isTight = typeof node.attrs.tight != "undefined" ? node.attrs.tight : this.options.tightLists;
    const prevTight = this.inTightList;
    this.inTightList = isTight;
    node.forEach((child, _, i) => {
      if (i && isTight) this.flushClose(1);
      this.wrapBlock(delim, firstDelim(i), node, () => this.render(child, node, i));
    });
    this.inTightList = prevTight;
  }

  // :: (string, ?bool) → string
  // Escape the given string so that it can safely appear in Markdown
  // content. If `startOfLine` is true, also escape characters that
  // have special meaning only at the start of the line.
  esc(str: string, startOfLine?: boolean) {
    // eslint-disable-next-line no-useless-escape
    str = str.replace(/[`*\\~\[\]]/g, "\\$&");
    if (startOfLine) {
      str = str.replace(/^[:#\-*+]/, "\\$&").replace(/^(\s*\d+)\./, "$1\\.");
    }
    return str;
  }

  quote(str: string) {
    const wrap = str.indexOf('"') == -1 ? '""' : str.indexOf("'") == -1 ? "''" : "()";
    return wrap[0] + str + wrap[1];
  }

  // :: (string, number) → string
  // Repeat the given string `n` times.
  repeat(str: string, n: number) {
    let out = "";
    for (let i = 0; i < n; i++) out += str;
    return out;
  }

  // : (Mark, bool, string?) → string
  // Get the markdown string for a given opening or closing mark.
  markString(mark: Mark, open: boolean, parent: unknown, index: number) {
    const info = this.marks[mark.type.name];
    const value = open ? info.open : info.close;
    return typeof value == "string" ? value : value(this, mark, parent, index);
  }

  // :: (string) → { leading: ?string, trailing: ?string }
  // Get leading and trailing whitespace from a string. Values of
  // leading or trailing property of the return object will be undefined
  // if there is no match.
  getEnclosingWhitespace(text: string): { leading?: string; trailing?: string } {
    return {
      leading: (text.match(/^(\s+)/) || [])[0],
      trailing: (text.match(/(\s+)$/) || [])[0],
    };
  }
}
