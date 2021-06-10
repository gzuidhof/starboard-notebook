/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { debounce } from "@github/mini-throttle";
import { WordWrapSetting } from "../textEditor";
import { Cell, Runtime } from "../../types";

export type MonacoEditorSupportedLanguage = "javascript" | "typescript" | "markdown" | "css" | "html" | "python";

monaco.editor.defineTheme("starboard-theme", {
  base: "vs",
  inherit: true,
  rules: [],
  colors: {
    "editor.foreground": "#000000",
    "editor.background": "#fbfbfb",
    "editorCursor.foreground": "#00d1b2ba",
    "editor.lineHighlightBackground": "#33333308",
    "editorLineNumber.foreground": "#ccc",
    "editor.selectionBackground": "#00000010",
    "editor.inactiveSelectionBackground": "#88000008",
    "scrollbarSlider.background": "#ff0000",
    "scrollbarSlider.hoverBackground": "#00d1b280",
    "scrollbarSlider.activeBackground": "#00d1b2f0",
  },
});

monaco.languages.typescript.javascriptDefaults.addExtraLib(
  `
        /**
         * Interprets a template literal as an HTML template that can efficiently
         * render to and update a container.
         */
        declare const html: (strings: TemplateStringsArray, ...values: unknown[]) => any ;
        /**
        * Interprets a template literal as an SVG template that can efficiently
        * render to and update a container.
        */
        declare const svg: (strings: TemplateStringsArray, ...values: unknown[]) => any;
        declare const lit: any;
        declare const runtime: any;
`,
  "global.d.ts"
);

function makeEditorResizeToFitContent(editor: monaco.editor.IStandaloneCodeEditor) {
  editor.onDidChangeModelDecorations(() => {
    requestAnimationFrame(updateEditorHeight);
  });

  let prevHeight = 0;
  let prevWidth = 0;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const aboveEl = document.querySelector(".cell-controls-above")! as HTMLElement;
  const updateEditorHeight = () => {
    const editorElement = editor.getDomNode();
    if (!editorElement) {
      return;
    }
    const height = editor.getContentHeight();

    // Total hack.. these elements are never hidden and will have the desired width.
    // -2 to account for the 1px border..
    const width = aboveEl.offsetWidth - 2;
    if (prevHeight !== height || prevWidth !== width) {
      prevHeight = height;
      prevWidth = width;
      editorElement.style.width = `${width}px`;
      editorElement.style.height = `${height}px`;
      editor.layout({ width, height });
    }
  };

  requestAnimationFrame(() => updateEditorHeight());
}

function addEditorKeyboardShortcuts(editor: monaco.editor.IStandaloneCodeEditor, cellId: string, runtime: Runtime) {
  editor.addAction({
    id: "run-cell",
    label: "Run Cell",
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],

    contextMenuGroupId: "starboard",
    contextMenuOrder: 0,
    run: (_ed) => {
      runtime.controls.runCell({ id: cellId });
    },
  });

  editor.addAction({
    id: "run-cell-and-next",
    label: "Run Cell and Select Below",
    keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.Enter],

    contextMenuGroupId: "starboard",
    contextMenuOrder: 1,
    run: (_ed) => {
      runtime.controls.runCell({ id: cellId }) && runtime.controls.focusCell({ id: cellId, focusTarget: "next" });
    },
  });

  editor.addAction({
    id: "run-cell-and-insert-cell",
    label: "Run Cell and Insert Cell",
    keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.Enter],

    contextMenuGroupId: "starboard",
    contextMenuOrder: 2,
    run: (_ed) => {
      runtime.controls.runCell({ id: cellId }) &&
        runtime.controls.insertCell({ adjacentCellId: cellId, position: "after" }) &&
        runtime.controls.focusCell({ id: cellId, focusTarget: "next" });
    },
  });

  editor.onKeyDown((e) => {
    if (e.keyCode === monaco.KeyCode.DownArrow) {
      const lastLine = editor.getModel()?.getLineCount();
      if (lastLine !== undefined && editor.getPosition()?.lineNumber === lastLine) {
        runtime.controls.focusCell({ id: cellId, focusTarget: "next" });
      }
    } else if (e.keyCode === monaco.KeyCode.UpArrow) {
      if (editor.getPosition()?.lineNumber === 1) {
        runtime.controls.focusCell({ id: cellId, focusTarget: "previous" });
      }
    }
  });
}

export function createMonacoEditor(
  element: HTMLElement,
  cell: Cell,
  opts: {
    language?: MonacoEditorSupportedLanguage;
    wordWrap?: WordWrapSetting;
  },
  runtime: Runtime
) {
  const editor = monaco.editor.create(element, {
    value: cell.textContent,
    language: opts.language,
    readOnly: cell.metadata.properties.locked,
    minimap: {
      enabled: false,
    },
    fontSize: 14,
    theme: "starboard-theme",
    scrollbar: {
      useShadows: false,
      vertical: "auto",
      horizontal: "auto",
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
      alwaysConsumeMouseWheel: false,
    },
    overviewRulerBorder: false,
    lineNumbersMinChars: 3,
    scrollBeyondLastLine: false,
    wordWrap: opts.wordWrap,
  });

  const setEditable = function (editor: monaco.editor.IStandaloneCodeEditor, _isLocked: boolean | undefined): void {
    editor.updateOptions({ readOnly: !!_isLocked });
  };

  const isLocked: boolean | undefined = cell.metadata.properties.locked;

  runtime.controls.subscribeToCellChanges(cell.id, () => {
    // Note this function will be called on ALL text changes, so any letter typed,
    // it's probably better for performance to only ask Monaco to change it's editable state if it actually changed.
    if (isLocked === cell.metadata.properties.locked) return;
    setEditable(editor, cell.metadata.properties.locked);
  });

  const resizeDebounced = debounce(() => editor.layout(), 100);
  window.addEventListener("resize", resizeDebounced);

  makeEditorResizeToFitContent(editor);
  addEditorKeyboardShortcuts(editor, cell.id, runtime);

  const model = editor.getModel();
  if (model) {
    model.onDidChangeContent((_event) => {
      cell.textContent = model.getValue();
    });
  } else {
    console.error("Monaco editor model was not truthy, change detection will not work");
  }

  return editor;
}
