/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Mark, Node } from "prosemirror-model";
import { MarkdownSerializerState } from "./serializerState";

function backticksFor(node: Node, side: number) {
  const ticks = /`+/g;
  let m: RegExpExecArray | null;
  let len = 0;

  if (node.isText) {
    // eslint-disable-next-line
    while ((m = ticks.exec(node.text!))) len = Math.max(len, m[0].length);
  }
  let result = len > 0 && side > 0 ? " `" : "`";
  for (let i = 0; i < len; i++) result += "`";
  if (len > 0 && side < 0) result += " ";
  return result;
}

function isPlainURL(link: Mark, parent: Node, index: number, side: number) {
  if (link.attrs.title || !/^\w+:/.test(link.attrs.href)) return false;
  const content = parent.child(index + (side < 0 ? -1 : 0));
  if (!content.isText || content.text != link.attrs.href || content.marks[content.marks.length - 1] != link) {
    return false;
  }
  if (index == (side < 0 ? 1 : parent.childCount - 1)) return true;
  const next = parent.child(index + (side < 0 ? -2 : 1));
  return !link.isInSet(next.marks);
}

export class MarkdownSerializer {
  nodes: any;
  marks: any;
  // :: (Object<(state: MarkdownSerializerState, node: Node, parent: Node, index: number)>, Object)
  // Construct a serializer with the given configuration. The `nodes`
  // object should map node names in a given schema to function that
  // take a serializer state and such a node, and serialize the node.
  //
  // The `marks` object should hold objects with `open` and `close`
  // properties, which hold the strings that should appear before and
  // after a piece of text marked that way, either directly or as a
  // function that takes a serializer state and a mark, and returns a
  // string. `open` and `close` can also be functions, which will be
  // called as
  //
  //     (state: MarkdownSerializerState, mark: Mark,
  //      parent: Fragment, index: number) → string
  //
  // Where `parent` and `index` allow you to inspect the mark's
  // context to see which nodes it applies to.
  //
  // Mark information objects can also have a `mixable` property
  // which, when `true`, indicates that the order in which the mark's
  // opening and closing syntax appears relative to other mixable
  // marks can be varied. (For example, you can say `**a *b***` and
  // `*a **b***`, but not `` `a *b*` ``.)
  //
  // To disable character escaping in a mark, you can give it an
  // `escape` property of `false`. Such a mark has to have the highest
  // precedence (must always be the innermost mark).
  //
  // The `expelEnclosingWhitespace` mark property causes the
  // serializer to move enclosing whitespace from inside the marks to
  // outside the marks. This is necessary for emphasis marks as
  // CommonMark does not permit enclosing whitespace inside emphasis
  // marks, see: http://spec.commonmark.org/0.26/#example-330
  constructor(nodes: unknown, marks: unknown) {
    // :: Object<(MarkdownSerializerState, Node)> The node serializer
    // functions for this serializer.
    this.nodes = nodes;
    // :: Object The mark serializer info.
    this.marks = marks;
  }

  // :: (Node, ?Object) → string
  // Serialize the content of the given node to
  // [CommonMark](http://commonmark.org/).
  serialize(content: Node, options?: any) {
    const state = new MarkdownSerializerState(this.nodes, this.marks, options);
    state.renderContent(content);
    return state.out;
  }
}

export function createMarkdownSerializer() {
  return new MarkdownSerializer(
    {
      blockquote(state: MarkdownSerializerState, node: Node) {
        state.wrapBlock("> ", null, node, () => state.renderContent(node));
      },
      code_block(state: MarkdownSerializerState, node: Node) {
        state.write("```" + (node.attrs.params || "") + "\n");
        state.text(node.textContent, false);
        state.ensureNewLine();
        state.write("```");
        state.closeBlock(node);
      },
      heading(state: MarkdownSerializerState, node: Node) {
        state.write(state.repeat("#", node.attrs.level) + " ");
        state.renderInline(node);
        state.closeBlock(node);
      },
      horizontal_rule(state: MarkdownSerializerState, node: Node) {
        state.write(node.attrs.markup || "---");
        state.closeBlock(node);
      },
      bullet_list(state: MarkdownSerializerState, node: Node) {
        state.renderList(node, "  ", () => (node.attrs.bullet || "*") + " ");
      },
      ordered_list(state: MarkdownSerializerState, node: Node) {
        const start = node.attrs.order || 1;
        const maxW = String(start + node.childCount - 1).length;
        const space = state.repeat(" ", maxW + 2);
        state.renderList(node, space, (i) => {
          const nStr = String(start + i);
          return state.repeat(" ", maxW - nStr.length) + nStr + ". ";
        });
      },
      list_item(state: MarkdownSerializerState, node: Node) {
        state.renderContent(node);
      },
      math_inline(state: MarkdownSerializerState, node: Node) {
        state.write("$" + node.textContent + "$");
      },
      math_display(state: MarkdownSerializerState, node: Node) {
        state.write("$$\n");
        state.text(node.textContent, false);
        state.ensureNewLine();
        state.write("$$");
        state.closeBlock(node);
      },
      paragraph(state: MarkdownSerializerState, node: Node) {
        state.renderInline(node);
        state.closeBlock(node);
      },

      image(state: MarkdownSerializerState, node: Node) {
        state.write(
          "![" +
            state.esc(node.attrs.alt || "") +
            "](" +
            state.esc(node.attrs.src) +
            (node.attrs.title ? " " + state.quote(node.attrs.title) : "") +
            ")"
        );
      },
      hard_break(state: MarkdownSerializerState, node: Node, parent: Node, index: number) {
        for (let i = index + 1; i < parent.childCount; i++) {
          if (parent.child(i).type != node.type) {
            state.write("\\\n");
            return;
          }
        }
      },
      text(state: MarkdownSerializerState, node: Node) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        state.text(node.text!);
      },
    },
    {
      em: {
        open: "*",
        close: "*",
        mixable: true,
        expelEnclosingWhitespace: true,
      },
      strong: {
        open: "**",
        close: "**",
        mixable: true,
        expelEnclosingWhitespace: true,
      },
      link: {
        open(_state: MarkdownSerializerState, mark: Mark, parent: Node, index: number) {
          return isPlainURL(mark, parent, index, 1) ? "<" : "[";
        },
        close(state: MarkdownSerializerState, mark: Mark, parent: Node, index: number) {
          return isPlainURL(mark, parent, index, -1)
            ? ">"
            : "](" + state.esc(mark.attrs.href) + (mark.attrs.title ? " " + state.quote(mark.attrs.title) : "") + ")";
        },
      },
      code: {
        open(_state: MarkdownSerializerState, _mark: Mark, parent: Node, index: number) {
          return backticksFor(parent.child(index), -1);
        },
        close(_state: MarkdownSerializerState, _mark: Mark, parent: Node, index: number) {
          return backticksFor(parent.child(index - 1), 1);
        },
        escape: false,
      },
    }
  );
}
