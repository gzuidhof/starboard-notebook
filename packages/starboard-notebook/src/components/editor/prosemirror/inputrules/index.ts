/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Adapted from MIT licensed prosemirror-example-setup package */

import {
  ellipsis,
  emDash,
  inputRules,
  smartQuotes,
  textblockTypeInputRule,
  wrappingInputRule,
} from "prosemirror-inputrules";
import { NodeType, Schema } from "prosemirror-model";

// Given a blockquote node type, returns an input rule that turns `"> "`
// at the start of a textblock into a blockquote.
export function blockQuoteRule<T extends Schema>(nodeType: NodeType<T>) {
  return wrappingInputRule(/^\s*>\s$/, nodeType);
}

// Given a list node type, returns an input rule that turns a number
// followed by a dot at the start of a textblock into an ordered list.
export function orderedListRule<T extends Schema>(nodeType: NodeType<T>) {
  return wrappingInputRule(
    /^(\d+)\.\s$/,
    nodeType,
    (match) => ({ order: +match[1] }),
    (match, node) => node.childCount + node.attrs.order == +match[1]
  );
}

// Given a list node type, returns an input rule that turns a bullet
// (dash, plush, or asterisk) at the start of a textblock into a
// bullet list.
export function bulletListRule<T extends Schema>(nodeType: NodeType<T>) {
  return wrappingInputRule(/^\s*([-+*])\s$/, nodeType);
}

// Given a code block node type, returns an input rule that turns a
// textblock starting with three backticks into a code block.
export function codeBlockRule<T extends Schema>(nodeType: NodeType<T>) {
  return textblockTypeInputRule(/^```$/, nodeType);
}

// Given a node type and a maximum level, creates an input rule that
// turns up to that number of `#` characters followed by a space at
// the start of a textblock into a heading whose level corresponds to
// the number of `#` signs.
export function headingRule<T extends Schema>(nodeType: NodeType<T>, maxLevel: number) {
  return textblockTypeInputRule(new RegExp("^(#{1," + maxLevel + "})\\s$"), nodeType, (match) => ({
    level: match[1].length,
  }));
}

// A set of input rules for creating the basic block quotes, lists,
// code blocks, and heading.
export function buildInputRules(schema: Schema) {
  const rules = smartQuotes.concat(ellipsis, emDash);
  let type: NodeType<any>;
  // eslint-disable-next-line no-cond-assign
  if ((type = schema.nodes.blockquote)) rules.push(blockQuoteRule(type));
  // eslint-disable-next-line no-cond-assign
  if ((type = schema.nodes.ordered_list)) rules.push(orderedListRule(type));
  // eslint-disable-next-line no-cond-assign
  if ((type = schema.nodes.bullet_list)) rules.push(bulletListRule(type));
  // eslint-disable-next-line no-cond-assign
  if ((type = schema.nodes.code_block)) rules.push(codeBlockRule(type));
  // eslint-disable-next-line no-cond-assign
  if ((type = schema.nodes.heading)) rules.push(headingRule(type, 6));
  return inputRules({ rules });
}
