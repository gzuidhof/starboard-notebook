/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { EditorView, keymap, highlightSpecialChars } from "@codemirror/next/view";
import { EditorState } from "@codemirror/next/state";

import { defaultKeymap } from "@codemirror/next/commands";
import { highlightActiveLine, highlightSelectionMatches } from "@codemirror/next/highlight-selection";

import { bracketMatching } from "@codemirror/next/matchbrackets";
import { closeBrackets } from "@codemirror/next/closebrackets";
import { codeFolding, foldKeymap, foldGutter } from "@codemirror/next/fold";

import { defaultHighlighter } from "@codemirror/next/highlight";
import { lineNumbers } from "@codemirror/next/gutter";
import { commentKeymap } from "@codemirror/next/comment";

import { javascript, javascriptSyntax } from "@codemirror/next/lang-javascript";
import { css, cssSyntax } from "@codemirror/next/lang-css";
import { html, htmlSyntax } from "@codemirror/next/lang-html";
import { history, historyKeymap } from "@codemirror/next/history";
import { autocomplete, autocompleteKeymap, completeFromList } from "@codemirror/next/autocomplete";
import { searchKeymap } from "@codemirror/next/search";
import { Cell } from "../../types";
import { Runtime } from "../../runtime";

function createJSCompletion() {
    return completeFromList(
        "break case catch class const continue debugger default delete do else enum export extends false finally for function if implements import interface in instanceof let new package private protected public return static super switch this throw true try typeof var void while with yield".split(" ")
        .concat(Object.getOwnPropertyNames(window)));
}

export function createCodeMirrorEditor(element: HTMLElement, cell: Cell, opts: {language?: string; wordWrap?: "off" | "on" | "wordWrapColumn" | "bounded"}, _runtime: Runtime) {
    const listen = EditorView.updateListener.of(update => {
        if (update.docChanged) {
            cell.textContent = update.state.doc.toString();
        }
    });

    const editorView = new EditorView(
        {
            state: EditorState.create(
                {
                    doc: cell.textContent.length === 0 ? undefined : cell.textContent,
                    extensions:[
                        bracketMatching(),
                        closeBrackets(),
                        codeFolding(),
                        lineNumbers(),
                        foldGutter(),
                        highlightSpecialChars(),

                        defaultHighlighter,
                        highlightActiveLine(),
                        highlightSelectionMatches(),

                        ...(opts.language === "javascript" ? [javascript(), javascriptSyntax.languageData.of({autocomplete: createJSCompletion()})]: []),
                        ...(opts.language === "css" ? [css(), cssSyntax]: []),
                        ...(opts.language === "html" ? [html(), htmlSyntax]: []),
                        history(),
                        
                        keymap([
                            ...defaultKeymap,
                            ...commentKeymap,
                            ...autocompleteKeymap,
                            ...historyKeymap,
                            ...foldKeymap,
                            ...searchKeymap,
                        ]),
                        autocomplete(),
                        listen
                    ]
                })},
        );
    
    element.appendChild(editorView.dom);
    return editorView;
}