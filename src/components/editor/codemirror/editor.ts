/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { EditorView, highlightActiveLine, highlightSpecialChars, keymap } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";

import { defaultKeymap } from "@codemirror/commands";

import { bracketMatching } from "@codemirror/matchbrackets";
import { closeBrackets } from "@codemirror/closebrackets";
import { codeFolding, foldGutter, foldKeymap } from "@codemirror/fold";

import { lineNumbers } from "@codemirror/gutter";
import { commentKeymap } from "@codemirror/comment";

import { history, historyKeymap } from "@codemirror/history";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import type { Cell, Runtime } from "../../../types";
import { starboardHighlighter } from "./highlightStyle";
import { getCodemirrorLanguageExtension } from "./languages";

// Shared between all instances
const commonExtensions = [
  bracketMatching(),
  closeBrackets(),
  codeFolding(),
  lineNumbers(),
  foldGutter(),
  highlightSpecialChars(),

  starboardHighlighter,
  highlightActiveLine(),
  highlightSelectionMatches(),
  history(),

  keymap.of([
    { key: "Shift-Enter", run: () => true },
    ...defaultKeymap,
    ...commentKeymap,
    ...completionKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...searchKeymap,
  ]),
  autocompletion(),
];

export function createCodeMirrorEditor(
  element: HTMLElement,
  cell: Cell,
  opts: {
    language?: string;
    wordWrap?: "off" | "on" | "wordWrapColumn" | "bounded";
  },
  runtime: Runtime
) {
  const listen = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      cell.textContent = update.state.doc.toString();
    }
  });

  const readOnlyCompartment = new Compartment();
  const readOnlyExtension = EditorView.editable.of(!cell.metadata.properties.locked);

  const cellSwitchExtension = keymap.of([
    {
      key: "ArrowUp",
      run: (target) => {
        if (target.state.selection.ranges.length === 1 && target.state.selection.ranges[0].empty) {
          const firstLine = target.state.doc.line(1);
          const cursorPosition = target.state.selection.ranges[0].head;
          if (firstLine.from <= cursorPosition && cursorPosition <= firstLine.to) {
            return runtime.controls.focusCell({ id: cell.id, focusTarget: "previous" });
          }
        }
        return false;
      },
    },
    {
      key: "ArrowDown",
      run: (target) => {
        if (target.state.selection.ranges.length === 1 && target.state.selection.ranges[0].empty) {
          const lastline = target.state.doc.line(target.state.doc.lines);
          const cursorPosition = target.state.selection.ranges[0].head;
          if (lastline.from <= cursorPosition && cursorPosition <= lastline.to) {
            return runtime.controls.focusCell({ id: cell.id, focusTarget: "next" });
          }
        }
        return false;
      },
    },
  ]);

  const languageExtension = getCodemirrorLanguageExtension(opts.language);
  const editorView = new EditorView({
    state: EditorState.create({
      doc: cell.textContent.length === 0 ? undefined : cell.textContent,
      extensions: [
        cellSwitchExtension,
        ...commonExtensions,
        ...(languageExtension ? [languageExtension] : []),
        ...(opts.wordWrap === "on" ? [EditorView.lineWrapping] : []),
        readOnlyCompartment.of(readOnlyExtension),
        listen,
      ],
    }),
  });

  const setEditable = (editor: EditorView, locked: boolean | undefined) => {
    editor.dispatch({
      effects: readOnlyCompartment.reconfigure(EditorView.editable.of(!locked)),
    });
  };

  let isLocked: boolean | undefined = cell.metadata.properties.locked;
  runtime.controls.subscribeToCellChanges(cell.id, () => {
    // Note this function will be called on ALL text changes, so any letter typed,
    // it's probably better for performance to only ask cm to change it's editable state if it actually changed.
    if (isLocked === cell.metadata.properties.locked) return;
    isLocked = cell.metadata.properties.locked;
    setEditable(editorView, isLocked);
  });

  element.appendChild(editorView.dom);
  return editorView;
}
