/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { markdownSchema } from "./markdown";
import { mathSchema } from "./math";
import { MarkSpec, NodeSpec, Schema, SchemaSpec } from "prosemirror-model";

function merge<A1 extends string, B1 extends string, A2 extends string, B2 extends string>(
  s1: SchemaSpec<A1, B1>,
  s2: SchemaSpec<A2, B2>
): SchemaSpec<A1 & A2, B1 & B2> {
  return {
    nodes: {
      ...(s1.nodes as { [x in A1]: NodeSpec }),
      ...(s2.nodes as { [x in A2]: NodeSpec }),
    },
    marks: {
      ...(s1.marks as { [x in B1]: MarkSpec }),
      ...(s2.marks as { [x in B2]: MarkSpec }),
    },
  };
}

export function createSchemaSpec() {
  return merge(markdownSchema, mathSchema);
}

export function createSchema(): Schema {
  return new Schema(createSchemaSpec());
}
