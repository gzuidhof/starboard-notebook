/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// Based on example in https://github.com/benrbray/prosemirror-math readme

import { SchemaSpec } from "prosemirror-model";

export const mathSchema: SchemaSpec = {
  nodes: {
    math_inline: {
      // important!
      group: "inline math",
      content: "text*", // important!
      inline: true, // important!
      atom: true, // important!
      toDOM: () => ["math-inline", { class: "math-node" }, 0],
      parseDOM: [
        {
          tag: "math-inline", // important!
        },
      ],
    },
    math_display: {
      // important!
      group: "block math",
      content: "text*", // important!
      atom: true, // important!
      code: true, // important!
      toDOM: () => ["math-display", { class: "math-node" }, 0],
      parseDOM: [
        {
          tag: "math-display", // important!
        },
      ],
    },
  },
  // marks: {
  //     math_select: {
  //         toDOM() { return ["math-select", 0]; },
  //         parseDOM: [{ tag: "math-select" }]
  //     }
  // }
};
