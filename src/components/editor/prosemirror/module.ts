/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import {EditorView} from "prosemirror-view"
import {EditorState, Plugin} from "prosemirror-state"
import {schema, defaultMarkdownParser,
        defaultMarkdownSerializer} from "prosemirror-markdown"
//@ts-ignore
import {exampleSetup} from "prosemirror-example-setup";
import { debounce } from "@github/mini-throttle";


export interface ContentContainer {
    textContent: string;
}
 
export {EditorView, EditorState, Plugin, schema, defaultMarkdownParser, defaultMarkdownSerializer, exampleSetup}

export function createEditorState(opts: {content: ContentContainer}) {
return EditorState.create({
    doc: defaultMarkdownParser.parse(opts.content.textContent),
    plugins: [
        ...exampleSetup({schema: schema}),
        new Plugin({
            view: () => {
            return {
                update: debounce((view: EditorView) => {
                    opts.content.textContent = defaultMarkdownSerializer.serialize(view.state.doc);
                    }, 50)
                }
            }
        })
    ]
    })
}
