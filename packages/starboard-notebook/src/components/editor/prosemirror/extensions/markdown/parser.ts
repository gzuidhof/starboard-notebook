/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import markdownit from "markdown-it";
import { mathParserPlugin } from "./markdownitMathParserPlugin";
import { Mark, Node, NodeSpec, Schema } from "prosemirror-model";
import Token from "markdown-it/lib/token";
import { NodeType } from "babel-walk";
import MarkdownIt from "markdown-it";

function maybeMerge(a: Node, b: Node) {
  if (a.isText && b.isText && Mark.sameSet(a.marks, b.marks)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return (a as any).withText(a.text! + b.text!);
  }
}

// Object used to track the context of a running parse.
class MarkdownParseState {
  schema: Schema<any, any>;
  stack: any[];
  marks: Mark<any>[];
  tokenHandlers: any;

  constructor(schema: Schema, tokenHandlers: any) {
    this.schema = schema;
    this.stack = [{ type: schema.topNodeType, content: [] }];
    this.marks = Mark.none;
    this.tokenHandlers = tokenHandlers;
  }

  top() {
    return this.stack[this.stack.length - 1];
  }

  push(elt: any) {
    if (this.stack.length) this.top().content.push(elt);
  }

  // : (string)
  // Adds the given text to the current position in the document,
  // using the current marks as styling.
  addText(text: string) {
    if (!text) return;
    const nodes = this.top().content,
      last = nodes[nodes.length - 1];
    const node = this.schema.text(text, this.marks);
    let merged;
    if (last && (merged = maybeMerge(last, node))) {
      nodes[nodes.length - 1] = merged;
    } else nodes.push(node);
  }

  // : (Mark)
  // Adds the given mark to the set of active marks.
  openMark(mark: Mark) {
    this.marks = mark.addToSet(this.marks);
  }

  // : (Mark)
  // Removes the given mark from the set of active marks.
  closeMark(mark: Mark) {
    this.marks = mark.removeFromSet(this.marks);
  }

  parseTokens(toks: Token[]) {
    for (let i = 0; i < toks.length; i++) {
      const tok = toks[i];
      const handler = this.tokenHandlers[tok.type];
      if (!handler) {
        throw new Error("Token type `" + tok.type + "` not supported by Markdown parser");
      }
      handler(this, tok, toks, i);
    }
  }

  // : (NodeType, ?Object, ?[Node]) → ?Node
  // Add a node at the current position.
  addNode(type: NodeType<any>, attrs: Record<string, unknown>, content: Node[]) {
    const node = type.createAndFill(attrs, content, this.marks);
    if (!node) return null;
    this.push(node);
    return node;
  }

  // : (NodeType, ?Object)
  // Wrap subsequent content in a node of the given type.
  openNode(type: NodeType<any>, attrs: Record<string, unknown>) {
    this.stack.push({ type: type, attrs: attrs, content: [] });
  }

  // : () → ?Node
  // Close and return the node that is currently on top of the stack.
  closeNode() {
    if (this.marks.length) this.marks = Mark.none;
    const info = this.stack.pop();
    return this.addNode(info.type, info.attrs, info.content);
  }
}

function attrs(spec: any, token: any, tokens: any, i: any) {
  if (spec.getAttrs) return spec.getAttrs(token, tokens, i);
  // For backwards compatibility when `attrs` is a Function
  else if (spec.attrs instanceof Function) return spec.attrs(token);
  else return spec.attrs;
}

// Code content is represented as a single token with a `content`
// property in Markdown-it.
function noCloseToken(spec: NodeSpec, type: string) {
  return spec.noCloseToken || type == "code_inline" || type == "code_block" || type == "fence";
}

function withoutTrailingNewline(str: string) {
  return str[str.length - 1] == "\n" ? str.slice(0, str.length - 1) : str;
}

function noOp() {
  /* Do nothing */
}

function tokenHandlers(schema: any, tokens: any) {
  const handlers = Object.create(null);
  for (const type in tokens) {
    const spec = tokens[type];
    if (spec.block) {
      const nodeType = schema.nodeType(spec.block);
      if (noCloseToken(spec, type)) {
        handlers[type] = (state: any, tok: any, tokens: any, i: any) => {
          state.openNode(nodeType, attrs(spec, tok, tokens, i));
          state.addText(withoutTrailingNewline(tok.content));
          state.closeNode();
        };
      } else {
        handlers[type + "_open"] = (state: any, tok: any, tokens: any, i: any) =>
          state.openNode(nodeType, attrs(spec, tok, tokens, i));
        handlers[type + "_close"] = (state: any) => state.closeNode();
      }
    } else if (spec.node) {
      const nodeType = schema.nodeType(spec.node);
      handlers[type] = (state: any, tok: any, tokens: any, i: any) =>
        state.addNode(nodeType, attrs(spec, tok, tokens, i));
    } else if (spec.mark) {
      const markType = schema.marks[spec.mark];
      if (noCloseToken(spec, type)) {
        handlers[type] = (state: any, tok: any, tokens: any, i: any) => {
          state.openMark(markType.create(attrs(spec, tok, tokens, i)));
          state.addText(withoutTrailingNewline(tok.content));
          state.closeMark(markType);
        };
      } else {
        handlers[type + "_open"] = (state: any, tok: any, tokens: any, i: any) =>
          state.openMark(markType.create(attrs(spec, tok, tokens, i)));
        handlers[type + "_close"] = (state: any) => state.closeMark(markType);
      }
    } else if (spec.ignore) {
      if (noCloseToken(spec, type)) {
        handlers[type] = noOp;
      } else {
        handlers[type + "_open"] = noOp;
        handlers[type + "_close"] = noOp;
      }
    } else {
      throw new RangeError("Unrecognized parsing spec " + JSON.stringify(spec));
    }
  }

  handlers.text = (state: any, tok: any) => state.addText(tok.content);
  handlers.inline = (state: any, tok: any) => state.parseTokens(tok.children);
  handlers.softbreak = handlers.softbreak || ((state: any) => state.addText("\n"));

  return handlers;
}

// ::- A configuration of a Markdown parser. Such a parser uses
// [markdown-it](https://github.com/markdown-it/markdown-it) to
// tokenize a file, and then runs the custom rules it is given over
// the tokens to create a ProseMirror document tree.
export class MarkdownParser {
  tokens: any;
  schema: any;
  tokenizer: any;
  tokenHandlers: any;
  // :: (Schema, MarkdownIt, Object)
  // Create a parser with the given configuration. You can configure
  // the markdown-it parser to parse the dialect you want, and provide
  // a description of the ProseMirror entities those tokens map to in
  // the `tokens` object, which maps token names to descriptions of
  // what to do with them. Such a description is an object, and may
  // have the following properties:
  //
  // **`node`**`: ?string`
  //   : This token maps to a single node, whose type can be looked up
  //     in the schema under the given name. Exactly one of `node`,
  //     `block`, or `mark` must be set.
  //
  // **`block`**`: ?string`
  //   : This token (unless `noCloseToken` is true) comes in `_open`
  //     and `_close` variants (which are appended to the base token
  //     name provides a the object property), and wraps a block of
  //     content. The block should be wrapped in a node of the type
  //     named to by the property's value. If the token does not have
  //     `_open` or `_close`, use the `noCloseToken` option.
  //
  // **`mark`**`: ?string`
  //   : This token (again, unless `noCloseToken` is true) also comes
  //     in `_open` and `_close` variants, but should add a mark
  //     (named by the value) to its content, rather than wrapping it
  //     in a node.
  //
  // **`attrs`**`: ?Object`
  //   : Attributes for the node or mark. When `getAttrs` is provided,
  //     it takes precedence.
  //
  // **`getAttrs`**`: ?(MarkdownToken) → Object`
  //   : A function used to compute the attributes for the node or mark
  //     that takes a [markdown-it
  //     token](https://markdown-it.github.io/markdown-it/#Token) and
  //     returns an attribute object.
  //
  // **`noCloseToken`**`: ?boolean`
  //   : Indicates that the [markdown-it
  //     token](https://markdown-it.github.io/markdown-it/#Token) has
  //     no `_open` or `_close` for the nodes. This defaults to `true`
  //     for `code_inline`, `code_block` and `fence`.
  //
  // **`ignore`**`: ?bool`
  //   : When true, ignore content for the matched token.
  constructor(schema: Schema, tokenizer: MarkdownIt, tokens: { [key: string]: any }) {
    // :: Object The value of the `tokens` object used to construct
    // this parser. Can be useful to copy and modify to base other
    // parsers on.
    this.tokens = tokens;
    this.schema = schema;
    this.tokenizer = tokenizer;
    this.tokenHandlers = tokenHandlers(schema, tokens);
  }

  // :: (string) → Node
  // Parse a string as [CommonMark](http://commonmark.org/) markup,
  // and create a ProseMirror document as prescribed by this parser's
  // rules.
  parse(text: string): Node {
    const state = new MarkdownParseState(this.schema, this.tokenHandlers);
    let doc;
    state.parseTokens(this.tokenizer.parse(text, {}));

    do {
      doc = state.closeNode();
    } while (state.stack.length);
    return doc;
  }
}

function listIsTight(tokens: any[], i: number) {
  while (++i < tokens.length) {
    if (tokens[i].type != "list_item_open") return tokens[i].hidden;
  }
  return false;
}

type MarkdownToken = any;

export function createMarkdownParser(schema: Schema) {
  const mdit = markdownit("commonmark", { html: false });
  mdit.use(mathParserPlugin);

  return new MarkdownParser(schema, mdit, {
    blockquote: { block: "blockquote" },
    paragraph: { block: "paragraph" },
    list_item: { block: "list_item" },
    bullet_list: {
      block: "bullet_list",
      getAttrs: (_: MarkdownToken, tokens: MarkdownToken[], i: number) => ({
        tight: listIsTight(tokens, i),
      }),
    },
    ordered_list: {
      block: "ordered_list",
      getAttrs: (tok: MarkdownToken, tokens: MarkdownToken[], i: number) => ({
        order: +tok.attrGet("start") || 1,
        tight: listIsTight(tokens, i),
      }),
    },
    heading: {
      block: "heading",
      getAttrs: (tok: MarkdownToken) => ({ level: +tok.tag.slice(1) }),
    },
    code_block: { block: "code_block", noCloseToken: true },
    fence: {
      block: "code_block",
      getAttrs: (tok: MarkdownToken) => ({ params: tok.info || "" }),
      noCloseToken: true,
    },
    hr: { node: "horizontal_rule" },
    image: {
      node: "image",
      getAttrs: (tok: MarkdownToken) => ({
        src: tok.attrGet("src"),
        title: tok.attrGet("title") || null,
        alt: (tok.children[0] && tok.children[0].content) || null,
      }),
    },
    hardbreak: { node: "hard_break" },
    math_inline: { block: "math_inline", noCloseToken: true },
    math_display: { block: "math_display", noCloseToken: true },
    em: { mark: "em" },
    strong: { mark: "strong" },
    link: {
      mark: "link",
      getAttrs: (tok: MarkdownToken) => ({
        href: tok.attrGet("href"),
        title: tok.attrGet("title") || null,
      }),
    },
    code_inline: { mark: "code", noCloseToken: true },
  });
}
