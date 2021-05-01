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
import { CellEvent, Cell, Runtime } from '../../../types';

export interface ContentContainer {
    textContent: string;
}

const defaultMarkdownSerializer = createMarkdownSerializer();

export { EditorView, EditorState, Plugin, defaultMarkdownSerializer };

const schema = createSchema();
const parser = createMarkdownParser(schema);

export function createProseMirrorEditor(element: HTMLElement, cell: Cell, opts: { focusAfterInit?: boolean }, runtime: Runtime) {
    let editorView = new EditorView(element, {
        state: EditorState.create({
            doc: parser.parse(cell.textContent),
            plugins: [
                keymap({
                    "ArrowDown": function (state, dispatch, view) {
                        if(state.selection.empty) {
                            // Now what?
                        }
                        return false;
                    },
                    "ArrowUp": function (state, dispatch, view) {
                        if(state.selection.empty) {
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
                                cell.textContent = defaultMarkdownSerializer.serialize(view.state.doc);
                            }, 50)
                        };
                    },
                }),
            ],
        })
    });

    return editorView;
}

