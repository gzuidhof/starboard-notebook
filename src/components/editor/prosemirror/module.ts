/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { EditorView } from "prosemirror-view";
import { EditorState, Plugin } from "prosemirror-state";
import { debounce } from "@github/mini-throttle";
import { setupPlugins } from "./setup";
import { keymap } from "prosemirror-keymap";
import { createSchema } from "./schema";
import { createMarkdownParser } from "./extensions/markdown/parser";
import { createMarkdownSerializer } from "./extensions/markdown/serializer";
import { Runtime } from "../../../types";

export interface ContentContainer {
  textContent: string;
}

const defaultMarkdownSerializer = createMarkdownSerializer();

export { defaultMarkdownSerializer, EditorState, EditorView, Plugin };

const schema = createSchema();
const parser = createMarkdownParser(schema);

export function createProseMirrorEditor(element: HTMLElement, content: ContentContainer, _runtime: Runtime) {
  const editorView = new EditorView(element, {
    state: EditorState.create({
      doc: parser.parse(content.textContent),
      plugins: [
        keymap({
          ArrowDown: function (state, _dispatch, _view) {
            if (state.selection.empty) {
              // Now what?
            }
            return false;
          },
          ArrowUp: function (state, _dispatch, _view) {
            if (state.selection.empty) {
              // Now what?
            }
            return false;
          },
        }),
        ...setupPlugins({ schema }),
        new Plugin({
          view: () => {
            return {
              update: debounce((view: EditorView) => {
                content.textContent = defaultMarkdownSerializer.serialize(view.state.doc);
              }, 50),
            };
          },
        }),
      ],
    }),
  });

  return editorView;
}
