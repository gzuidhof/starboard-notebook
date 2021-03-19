/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import {EditorView} from "prosemirror-view"
import {EditorState, Plugin} from "prosemirror-state"
import {schema, defaultMarkdownParser,
        defaultMarkdownSerializer} from "prosemirror-markdown"
//@ts-ignore
import {exampleSetup} from "prosemirror-example-setup";

export {EditorView, EditorState, Plugin, schema, defaultMarkdownParser, defaultMarkdownSerializer, exampleSetup}
