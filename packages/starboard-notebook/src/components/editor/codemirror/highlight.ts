/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { EditorView, highlightSpecialChars } from "@codemirror/view";
import { EditorState } from "@codemirror/state";

import { starboardHighlighter } from "./highlightStyle";
import { getCodemirrorLanguageExtension } from "./languages";

const commonExtensions = [highlightSpecialChars(), starboardHighlighter, EditorView.editable.of(false)];

// Async in preparation of highlighters that are loaded dynamically
export async function createCodeMirrorCodeHighlight(
  content: string,
  opts: {
    language?: string;
  }
) {
  const languageExtension = getCodemirrorLanguageExtension(opts.language);

  const editorView = new EditorView({
    state: EditorState.create({
      doc: content,
      extensions: [...commonExtensions, ...(languageExtension ? [languageExtension] : [])],
    }),
  });
  return editorView;
}
