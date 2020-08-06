/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { customElement, LitElement, html, query } from "lit-element";
import { Cell } from "../notebookContent";
import { CellEvent } from "./cell";

import mdlib from "markdown-it";
import { hookMarkdownIt } from "../highlight";
import { render } from "lit-html";
import { unsafeHTML } from "lit-html/directives/unsafe-html";
import { DeviceDesktopIcon, DevicePhoneIcon } from "@spectrum-web-components/icons-workflow";

export type SupportedLanguage = "javascript" | "typescript" | "markdown" | "css" | "html" | "python";
export type WordWrapSetting = "off" | "on" | "wordWrapColumn" | "bounded";

// Note: somewhat problematic for garbage collection if no editor is ever chosen..
let notifyOnEditorChosen: (() => any)[] = [];

let codeMirrorModule: Promise<{createCodeMirrorEditor: any}> | undefined;
let monacoModule: Promise<{createMonacoEditor: any}> | undefined;

// Global state shared between all editors
let currentEditor: "monaco" | "codemirror" | "" = "";

const md = new mdlib();
hookMarkdownIt(md);

/**
 * StarboardTextEditor abstracts over different text editors that are loaded dynamically.
 * The user can choose: monaco for desktop devices, or a more minimal editor for mobile phones.
 * 
 * TODO: this file needs a big cleanup..
 */
@customElement('starboard-text-editor')
export class StarboardTextEditor extends LitElement {

    @query(".starboard-text-editor")
    private editorMountpoint!: HTMLElement;

    private emit: (event: any) => void;
    private cell: Cell;
    private opts: {language?: SupportedLanguage} = {};
    editorInstance?: any;

    constructor(cell: Cell, opts: {language?: SupportedLanguage, wordWrap?: WordWrapSetting}, emit: (event: CellEvent) => void) {
        super();
        this.emit = emit;
        this.cell = cell;
        this.opts = opts;
    }

    connectedCallback() {
        super.connectedCallback();        
    }

    handleDblClick() {
        if (currentEditor === "") {
            this.switchToMonacoEditor();
        }
    }

    firstUpdated(changedProperties: any) {
        super.firstUpdated(changedProperties);

        if (currentEditor === "codemirror" || currentEditor === "monaco") {
            this.initEditor();
        } else {
            this.editorMountpoint.addEventListener("dblclick", () => this.handleDblClick(), {once: true, passive: true});
            const mdText =  md.render("```" + `${this.opts.language}\n${this.cell.textContent}\n` + "```");
            render(html`
            <div class="cell-popover cell-select-editor-popover">
                    <div style="display: flex; align-items: center;">
                        <b style="font-size: 1em; margin-right: 4px">Please select an editor</b>
                        <button @click=${() => this.switchToMonacoEditor()} title="Monaco Editor (advanced, desktop only)" class="cell-popover-icon-button">${DeviceDesktopIcon({width:12, height:12})} Monaco</button>
                        <button @click=${() => this.switchToCodeMirrorEditor()} title="CodeMirror Editor (simpler, touchscreen friendly)" class="cell-popover-icon-button">${DevicePhoneIcon({width:12, height:12})} CodeMirror</button>
                    </div>
                    <span style="font-size: 0.85em"><b>Monaco</b> is more powerful, but is larger (4MB) and has poor touchscreen support.</span>
                </div>
            ${unsafeHTML(mdText)}
            `, this.editorMountpoint);
            notifyOnEditorChosen.push(() => this.initEditor());
        }
    }

    initEditor() {
        if (currentEditor === "codemirror") {
            this.switchToCodeMirrorEditor();
        } else if (currentEditor === "monaco") {
            this.switchToMonacoEditor();
        }
    }

    switchToCodeMirrorEditor() {
        if (currentEditor === "monaco" && this.editorInstance) {
            this.editorInstance.dispose();
        }

        currentEditor = "codemirror";
        if (!codeMirrorModule) {
            codeMirrorModule = import(/* webpackChunkName: codemirror-editor */  "../editor/codeMirror" as any);
            document.querySelectorAll(".cell-select-editor-popover").forEach((e) => e.innerHTML = "<b>Loading CodeMirror editor..</b>");
            notifyOnEditorChosen.forEach((c) => c());
            notifyOnEditorChosen = [];
        }
    
        codeMirrorModule.then((m) => {
            this.editorMountpoint.innerHTML = "";
            this.editorInstance = m.createCodeMirrorEditor(this.editorMountpoint, this.cell, this.opts as any, this.emit);
        });
    }

    switchToMonacoEditor() {
        if (currentEditor === "codemirror" && this.editorInstance) {
            this.editorInstance.dom.remove();
        }

        currentEditor = "monaco";
        if (!monacoModule) {
            monacoModule = import(/* webpackChunkName: monaco-editor */  "../editor/monaco" as any);
            document.querySelectorAll(".cell-select-editor-popover").forEach((e) => e.innerHTML = "<b>Loading Monaco editor..</b>");
            notifyOnEditorChosen.forEach((c) => c());
            notifyOnEditorChosen = [];
        }

        monacoModule.then((m) => {
            this.editorMountpoint.innerHTML = "";
            this.editorInstance = m.createMonacoEditor(this.editorMountpoint, this.cell, this.opts as any, this.emit);
        });
    }
 
    createRenderRoot() {
        return this;
    }

    render() {
        return html`
        <div class="starboard-text-editor"></div>
        `;
    }

    focus() {
        if (this.editorInstance) {
            this.editorInstance.focus();
        }
    }

    dispose() {
        this.remove();
    }

}
