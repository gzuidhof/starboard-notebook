/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { customElement, LitElement, html, query } from "lit-element";

import mdlib from "markdown-it";
import { hookMarkdownItToPrismHighlighter } from "./helpers/highlight";
import { render } from "lit-html";
import { unsafeHTML } from "lit-html/directives/unsafe-html";
import { DeviceDesktopIcon, DevicePhoneIcon } from "@spectrum-web-components/icons-workflow";
import { Cell } from "../types";
import { Runtime } from "../runtime";
import { copyToClipboard } from "./helpers/clipboard";

export type SupportedLanguage = "javascript" | "typescript" | "markdown" | "css" | "html" | "python" | "latex"; // latex is not actually supported..
export type WordWrapSetting = "off" | "on";

const EDITOR_PREFERENCE_KEY = "starboard_notebook_text_editor_preference";

// Global state shared between all editors
// Note: somewhat problematic for garbage collection if no editor is ever chosen..
let notifyOnEditorChosen: (() => any)[] = [];

let codeMirrorModule: Promise<{createCodeMirrorEditor: any}> | undefined;
let monacoModule: Promise<{createMonacoEditor: any}> | undefined;

// Use ternary condition to be robust to other invalid values
let currentEditor: "monaco" | "codemirror" | "" = localStorage[EDITOR_PREFERENCE_KEY] === "monaco" ? "monaco" : "codemirror";

const md = new mdlib();
hookMarkdownItToPrismHighlighter(md);

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

    private cell: Cell;
    private runtime: Runtime;
    private opts: {language?: SupportedLanguage} = {};
    editorInstance?: any;

    constructor(cell: Cell, runtime: Runtime, opts: {language?: SupportedLanguage; wordWrap?: WordWrapSetting} = {}) {
        super();
        this.runtime = runtime;
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
            // While it loads, render markdown
            const mdText =  md.render("```" + `${this.opts.language}\n${this.cell.textContent}\n` + "```");
            render(html`<div class="cell-popover cell-select-editor-popover">Loading CodeMirror editor..</div>${unsafeHTML(mdText)}`, this.editorMountpoint);

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
        localStorage[EDITOR_PREFERENCE_KEY] = "codemirror";
        if (!codeMirrorModule) {
            codeMirrorModule = import(/* webpackChunkName: "codemirror" */ "./editor/codeMirror");

            document.querySelectorAll(".cell-select-editor-popover").forEach((e) => e.innerHTML = "<b>Loading CodeMirror editor..</b>");
            notifyOnEditorChosen.forEach((c) => c());
            notifyOnEditorChosen = [];
        }
    
        codeMirrorModule.then((m) => {
            this.editorMountpoint.innerHTML = "";
            this.editorInstance = m.createCodeMirrorEditor(this.editorMountpoint, this.cell, this.opts as any, this.runtime);
            this.performUpdate();
        });
    }

    switchToMonacoEditor() {
        const shouldCleanUpCodeMirror = currentEditor === "codemirror" && this.editorInstance;

        currentEditor = "monaco";
        localStorage[EDITOR_PREFERENCE_KEY] = "monaco";
        if (!monacoModule) {
            monacoModule = import(/* webpackChunkName: "monaco" */  "./editor/monaco");
            document.querySelectorAll(".cell-select-editor-popover").forEach((e) => e.innerHTML = "<b>Loading Monaco editor..</b>");
            notifyOnEditorChosen.forEach((c) => c());
            notifyOnEditorChosen = [];
        }

        monacoModule.then((m) => {
            if (shouldCleanUpCodeMirror) this.editorInstance.dom.remove();
            this.editorMountpoint.innerHTML = "";
            this.editorInstance = m.createMonacoEditor(this.editorMountpoint, this.cell, this.opts as any, this.runtime);
            this.performUpdate();
        });
    }

    copyCellText() {
        copyToClipboard(this.cell.textContent);
        const copyButton = this.querySelector("#copy-button");
        if (copyButton) {
            (copyButton as any).innerText = "Copied!";
            setTimeout(() => (copyButton as any).innerText = "Copy Text", 2000);
        }
    }
 
    createRenderRoot() {
        return this;
    }

    render() {
        return html`     
        <div style="position: relative; width: 100%; height: 0">
            <div class="starboard-text-editor-controls">
                ${
                    currentEditor === "monaco" ?
                    html`<button @click=${() => this.switchToCodeMirrorEditor()} title="Switch to CodeMirror based editor, simpler and smartphone friendly">Switch to Simple Editor</button>`
                    :html`<button @click=${() => this.switchToMonacoEditor()} title="Switch to Monaco based editor, a few MB in size, smartphone unfriendly">Switch to Advanced Editor</button>`
                }
                <button id="copy-button" @click=${() => this.copyCellText()} title="Copy the text in this cell to clipboard">Copy Text</button>
            </div>
        </div>       
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
