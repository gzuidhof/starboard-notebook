/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { debounce } from '@github/mini-throttle';
import { WordWrapSetting } from '../textEditor';
import { CellEvent, Cell } from '../../types';
import { Runtime } from '../../runtime';

export type MonacoEditorSupportedLanguage = "javascript" | "typescript" | "markdown" | "css" | "html" | "python";

monaco.editor.defineTheme('starboard-theme', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
        'editor.foreground': '#000000',
        'editor.background': '#fbfbfb',
        'editorCursor.foreground': '#00d1b2ba',
        'editor.lineHighlightBackground': '#33333308',
        'editorLineNumber.foreground': '#ccc',
        'editor.selectionBackground': '#00000010',
        'editor.inactiveSelectionBackground': '#88000008',
        'scrollbarSlider.background': '#ff0000',
        'scrollbarSlider.hoverBackground': '#00d1b280',
        'scrollbarSlider.activeBackground': '#00d1b2f0',
    }
});

monaco.languages.typescript.javascriptDefaults.addExtraLib(`
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
        declare const litHtml: any;
        declare const runtime: any;
`, 'global.d.ts');

function makeEditorResizeToFitContent(editor: monaco.editor.IStandaloneCodeEditor) {
    editor.onDidChangeModelDecorations(() => {
        updateEditorHeight(); // typing
        requestAnimationFrame(updateEditorHeight); // folding
    });

    let prevHeight = 0;

    const updateEditorHeight = () => {
        const editorElement = editor.getDomNode();

        if (!editorElement) {
            return;
        }

        const height = editor.getContentHeight();
        if (prevHeight !== height) {
            prevHeight = height;
            editorElement.style.height = `${height}px`;
            editor.layout();
        }
    };

    updateEditorHeight();
}


function addEditorKeyboardShortcuts(
    editor: monaco.editor.IStandaloneCodeEditor,
    emit: (event: CellEvent) => void,
    cellId: string) {

    editor.addAction({
        id: 'run-cell',
        label: 'Run Cell',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],

        contextMenuGroupId: 'starboard',
        contextMenuOrder: 0,
        run: (_ed) => emit({
            id: cellId, type: "RUN_CELL", focusNextCell: false, insertNewCell: false
        })
    });

    editor.addAction({
        id: 'run-cell-and-next',
        label: 'Run Cell and Select Below',
        keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.Enter],

        contextMenuGroupId: 'starboard',
        contextMenuOrder: 1,
        run: (_ed) => emit({
            id: cellId, type: "RUN_CELL", focusNextCell: true, insertNewCell: false
        })
    });

    editor.addAction({
        id: 'run-cell-and-insert-cell',
        label: 'Run Cell and Insert Cell',
        keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.Enter],

        contextMenuGroupId: 'starboard',
        contextMenuOrder: 2,
        run: (_ed) => emit({
            id: cellId, type: "RUN_CELL", focusNextCell: true, insertNewCell: true
        })
    });

}

export function createMonacoEditor(element: HTMLElement, cell: Cell, opts: {language?: MonacoEditorSupportedLanguage; wordWrap?: WordWrapSetting}, runtime: Runtime) {
    const editor = monaco.editor.create(element, {
        value: cell.textContent,
        language: opts.language,
        minimap: {
            enabled: false
        },
        fontSize: 14,
        theme: "starboard-theme",
        scrollbar: {
            useShadows: false,
            vertical: 'auto',
            horizontal: 'auto',
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
            alwaysConsumeMouseWheel: false,
        },
        overviewRulerBorder: false,
        lineNumbersMinChars: 3,
        scrollBeyondLastLine: false,
        wordWrap: opts.wordWrap
    });

    const resizeDebounced = debounce(() => editor.layout(), 100);
    window.addEventListener("resize", resizeDebounced);

    // Hack: monaco can't properly layout if it isn't visible.. so we make sure the cell top or bottom is not hidden..
    let p = element.parentElement;
    while(p) {
        if (p.classList.contains("cell-top") || p.classList.contains("cell-bottom")) {
            p.classList.add("force-display");
            break;
        }
        p = p.parentElement;
    }

    makeEditorResizeToFitContent(editor);

    addEditorKeyboardShortcuts(editor, runtime.controls.emit, cell.id);

    const model = editor.getModel();
    if (model){
        model.onDidChangeContent((_event) => {
            cell.textContent = model.getValue();
        });
    } else {
        console.error("Monaco editor model was not truthy, change detection will not work");
    }

    if (p) {
        p.classList.remove("force-display");
    }

    return editor;
}