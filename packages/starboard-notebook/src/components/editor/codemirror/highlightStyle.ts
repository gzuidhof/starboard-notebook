/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { HighlightStyle, TagStyle, tags } from "@codemirror/highlight";

const codeMirrorHighlightStyle = [
  {
    tag: tags.link,
    textDecoration: "underline",
  },
  {
    tag: tags.heading,
    textDecoration: "underline",
    fontWeight: "bold",
  },
  {
    tag: tags.emphasis,
    fontStyle: "italic",
  },
  {
    tag: tags.strong,
    fontWeight: "bold",
  },
  {
    tag: tags.keyword,
    color: "#07A",
  },
  {
    tag: [tags.atom, tags.bool, tags.url, tags.contentSeparator, tags.labelName],
    color: "#219",
  },
  {
    tag: [tags.literal, tags.inserted],
    color: "#164",
  },
  {
    tag: [tags.string],
    color: "#a11",
  },
  {
    tag: tags.deleted,
    textDecoration: "line-through",
    color: "#a11",
  },
  {
    tag: [tags.regexp, tags.escape, tags.special(tags.string)],
    color: "#b11",
  },
  {
    tag: tags.definition(tags.variableName),
    color: "#00f",
  },
  {
    tag: tags.local(tags.variableName),
    color: "#30a",
  },
  {
    tag: [tags.typeName, tags.namespace],
    color: "#085",
  },
  {
    tag: tags.className,
    color: "#167",
  },
  {
    tag: [tags.special(tags.variableName), tags.macroName],
    color: "#256",
  },
  {
    tag: tags.definition(tags.propertyName),
    color: "#00c",
  },
  {
    tag: tags.comment,
    color: "#080",
  },
  {
    tag: tags.meta,
    color: "#555",
  },
  {
    tag: tags.invalid,
    color: "#f00",
  },
] as TagStyle[];

export const starboardHighlighter = HighlightStyle.define(codeMirrorHighlightStyle);
