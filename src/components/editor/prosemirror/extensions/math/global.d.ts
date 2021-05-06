/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// (https://stackoverflow.com/a/53098695/1444650)
// import needed to make this a module
import { Node as ProseNode } from "prosemirror-model";

declare module "prosemirror-model" {
  interface Fragment {
    // as of (3/31/20) official @types/prosemirror-model
    // was missing Fragment.content, so we define it here
    content: Node[];
  }

  interface NodeType {
    hasRequiredAttrs(): boolean;
    createAndFill(
      attrs?: Record<string, unknown>,
      content?: Fragment | ProseNode | ProseNode[],
      marks?: Mark[]
    ): ProseNode;
  }

  interface ResolvedPos {
    // missing declaration as of (7/25/20)
    /** Get the position at the given index in the parent node at the given depth (which defaults to this.depth). */
    posAtIndex(index: number, depth?: number): number;
  }
}
