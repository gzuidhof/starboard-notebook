/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { EditorView } from "prosemirror-view";
import { EditorState, Plugin } from "prosemirror-state";
import { debounce } from "@github/mini-throttle";
import { setupPlugins } from "./setup";
import {createSchema} from "./schema";
import { createMarkdownParser } from "./extensions/markdown/parser";
import { createMarkdownSerializer } from "./extensions/markdown/serializer";

export interface ContentContainer {
    textContent: string;
}

const defaultMarkdownSerializer = createMarkdownSerializer();

export { EditorView, EditorState, Plugin, defaultMarkdownSerializer };

const schema = createSchema();
const parser = createMarkdownParser(schema);


export function createEditorState(opts: {content: ContentContainer }) {  
    return EditorState.create({
        doc: parser.parse(opts.content.textContent),
        plugins: [
            ...setupPlugins({ schema }),
            new Plugin({
                view: () => {
                    return {
                        update: debounce((view: EditorView) => {
                            opts.content.textContent = defaultMarkdownSerializer.serialize(view.state.doc);
                        }, 50)
                    };
                }
            })
        ]
    });
}
