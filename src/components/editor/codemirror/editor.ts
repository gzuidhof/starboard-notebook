/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { EditorView, highlightActiveLine, highlightSpecialChars, keymap } from "@codemirror/view";
import { EditorState, Compartment, Transaction } from "@codemirror/state";

import { defaultKeymap, indentMore, indentLess } from "@codemirror/commands";

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

function tabKeyRun(t: { state: EditorState; dispatch: (transaction: Transaction) => void }): boolean {
  if (t.state.selection.ranges.some((r) => !r.empty)) {
    return indentMore({ state: t.state, dispatch: t.dispatch });
  }
  // So we can tab past the editor we don't tab if the cursor is at the very start of the document.
  // Note: this can be improved, we could instead see if we have pressed any keys since focusing the editor and decide
  // based on that.
  const r = t.state.selection.ranges[0];
  if (r && r.to === 0 && r.from === 0) {
    return false;
  }
  t.dispatch(
    t.state.update(t.state.replaceSelection("\t"), {
      scrollIntoView: true,
      annotations: Transaction.userEvent.of("input"),
    })
  );
  return true;
}

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
    { key: "Alt-Enter", run: () => true },
    { key: "Ctrl-Enter", run: () => true },
    { key: "Tab", run: tabKeyRun },
    { key: "Shift-Tab", run: indentLess },
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
            runtime.controls.focusCell({ id: cell.id, focusTarget: "previous" });
            return true;
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
            runtime.controls.focusCell({ id: cell.id, focusTarget: "next" });
            return true;
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
