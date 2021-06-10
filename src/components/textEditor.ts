/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * NOTE: TODO:
 * This file needs a complete refactor..
 */

import { html, LitElement, render } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html";
import { customElement, query } from "lit/decorators.js";

import mdlib from "markdown-it";
import { hookMarkdownItToCodemirrorHighlighter } from "./helpers/highlight";
import { Cell, Runtime } from "../types";
import { copyToClipboard } from "./helpers/clipboard";
import { trySetLocalStorage } from "./helpers/localStorage";
import Dropdown from "bootstrap/js/dist/dropdown";
import { hookMarkdownItToEmojiPlugin } from "./helpers/emoji";

export type SupportedLanguage = "javascript" | "typescript" | "markdown" | "css" | "html" | "python" | "latex"; // latex is not actually supported..
export type WordWrapSetting = "off" | "on";

const EDITOR_PREFERENCE_KEY = "starboard_notebook_text_editor_preference";

// Global state shared between all editors
// Note: somewhat problematic for garbage collection if no editor is ever chosen..
let notifyOnEditorChosen: (() => any)[] = [];

/**
 * This promise is used to prevent two editor instances being loaded in the same frame.
 * This helps keep things responsive when loading huge notebooks.
 */
let globalLoadEditorLockPromise = Promise.resolve();

let codeMirrorModule: Promise<{ createCodeMirrorEditor: any }> | undefined;
let monacoModule: Promise<{ createMonacoEditor: any }> | undefined;

let currentEditor: "monaco" | "codemirror" | undefined;
try {
  // Use ternary condition to be robust to other invalid values
  if (localStorage[EDITOR_PREFERENCE_KEY] !== undefined) {
    currentEditor = localStorage[EDITOR_PREFERENCE_KEY] === "monaco" ? "monaco" : "codemirror";
  }
} catch (e) {
  console.warn("Could not read editor preference (localStorage is probably not available)");
}

const md = new mdlib();
hookMarkdownItToCodemirrorHighlighter(md);
hookMarkdownItToEmojiPlugin(md);

/**
 * StarboardTextEditor abstracts over different text editors that are loaded dynamically.
 * The user can choose: monaco for desktop devices, or a more minimal editor for mobile phones.
 *
 * TODO: this file needs a big cleanup..
 */
@customElement("starboard-text-editor")
export class StarboardTextEditor extends LitElement {
  @query(".starboard-text-editor")
  private editorMountpoint!: HTMLElement;

  private cell: Cell;
  private runtime: Runtime;
  private opts: { language?: SupportedLanguage } = {};
  editorInstance?: any;

  constructor(cell: Cell, runtime: Runtime, opts: { language?: SupportedLanguage; wordWrap?: WordWrapSetting } = {}) {
    super();
    this.runtime = runtime;
    this.cell = cell;
    this.opts = opts;
  }

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
  }

  handleDblClick() {
    if (currentEditor === undefined) {
      this.initEditor();
    }
  }

  firstUpdated(changedProperties: any) {
    super.firstUpdated(changedProperties);
    [].slice.call(document.querySelectorAll(".dropdown-toggle")).map((e) => new Dropdown(e));

    if (currentEditor === "codemirror" || currentEditor === "monaco" || this.runtime.config.defaultTextEditor) {
      this.initEditor();
      // While it loads, render markdown
      const mdText = md.render("```" + `${this.opts.language}\n${this.cell.textContent}\n` + "```");
      render(
        html`<div class="cell-popover cell-select-editor-popover">
            Loading ${currentEditor || this.runtime.config.defaultTextEditor} editor..
          </div>
          ${unsafeHTML(mdText)}`,
        this.editorMountpoint
      );
    } else {
      this.editorMountpoint.addEventListener("dblclick", () => this.handleDblClick(), { once: true, passive: true });
      const mdText = md.render("```" + `${this.opts.language}\n${this.cell.textContent}\n` + "```");
      render(
        html`
          <div class="cell-popover cell-select-editor-popover">
            <div style="display: flex; align-items: center;">
              <b style="font-size: 1em; margin-right: 4px">Please select a text editor</b>
              <button
                @click=${() => this.switchToMonacoEditor()}
                title="Monaco Editor (advanced, desktop only)"
                class="cell-popover-icon-button"
              >
                Monaco
              </button>
              <button
                @click=${() => this.switchToCodeMirrorEditor()}
                title="CodeMirror Editor (simpler, touchscreen friendly)"
                class="cell-popover-icon-button"
              >
                CodeMirror
              </button>
            </div>
            <span style="font-size: 0.85em"
              ><b>Monaco</b> is more powerful, but is larger (4MB) and has poor touchscreen support.</span
            >
          </div>
          ${unsafeHTML(mdText)}
        `,
        this.editorMountpoint
      );
      notifyOnEditorChosen.push(() => this.initEditor());
    }
  }

  async initEditor() {
    // Note: this entire class really needs a refactor..
    if (currentEditor === "codemirror") {
      this.switchToCodeMirrorEditor();
    } else if (currentEditor === "monaco") {
      this.switchToMonacoEditor();
    } else {
      const newEditor = this.runtime.config.defaultTextEditor;
      newEditor === "monaco" ? this.switchToMonacoEditor() : this.switchToCodeMirrorEditor();
    }
  }

  switchToCodeMirrorEditor() {
    if (currentEditor === "monaco" && this.editorInstance) {
      this.editorInstance.dispose();
    }

    currentEditor = "codemirror";
    trySetLocalStorage(EDITOR_PREFERENCE_KEY, "codemirror");
    if (!codeMirrorModule) {
      codeMirrorModule = import(/* webpackChunkName: "codemirrorEditor" */ "./editor/codemirror/editor");

      document
        .querySelectorAll(".cell-select-editor-popover")
        .forEach((e) => (e.innerHTML = "<b>Loading CodeMirror editor..</b>"));
      notifyOnEditorChosen.forEach((c) => c());
      notifyOnEditorChosen = [];
    }

    codeMirrorModule.then((m) => {
      globalLoadEditorLockPromise = globalLoadEditorLockPromise.then(() => {
        return new Promise((resolve) => {
          this.editorMountpoint.innerHTML = "";
          this.editorInstance = m.createCodeMirrorEditor(
            this.editorMountpoint,
            this.cell,
            this.opts as any,
            this.runtime
          );
          this.requestUpdate();
          setTimeout(() => resolve(), 0);
        });
      });
    });
  }

  switchToMonacoEditor() {
    const shouldCleanUpCodeMirror = currentEditor === "codemirror" && this.editorInstance;

    currentEditor = "monaco";
    trySetLocalStorage(EDITOR_PREFERENCE_KEY, "monaco");
    if (!monacoModule) {
      monacoModule = import(/* webpackChunkName: "monaco" */ "./editor/monaco");
      document
        .querySelectorAll(".cell-select-editor-popover")
        .forEach((e) => (e.innerHTML = "<b>Loading Monaco editor..</b>"));
      notifyOnEditorChosen.forEach((c) => c());
      notifyOnEditorChosen = [];
    }

    monacoModule.then((m) => {
      globalLoadEditorLockPromise = globalLoadEditorLockPromise.then(() => {
        return new Promise((resolve) => {
          if (shouldCleanUpCodeMirror) this.editorInstance.dom.remove();
          this.editorMountpoint.innerHTML = "";
          this.editorInstance = m.createMonacoEditor(this.editorMountpoint, this.cell, this.opts as any, this.runtime);
          this.requestUpdate();
          setTimeout(() => resolve(), 0);
        });
      });
    });
  }

  copyCellText() {
    copyToClipboard(this.cell.textContent);
    const copyButton = this.querySelector("#copy-button");
    if (copyButton) {
      (copyButton as any).innerText = "Copied!";
      setTimeout(() => ((copyButton as any).innerText = "Copy Text"), 2000);
    }
  }

  render() {
    return html`
      <div style="position: relative; width: 100%; height: 0">
        <div class="starboard-text-editor-controls">
          <div class="dropdown">
            <button
              data-bs-toggle="dropdown"
              class="btn btn-small transparent p-1 px-1 me-1"
              style="color: #00000066"
              title="Editor Actions"
            >
              <span class="bi bi-gear"></span>
            </button>
            <div class="dropdown-menu">
              <li>
                ${currentEditor === "monaco"
                  ? html`<button
                      class="dropdown-item"
                      @click=${() => this.switchToCodeMirrorEditor()}
                      title="Switch to CodeMirror based editor, simpler and smartphone friendly"
                    >
                      Switch to Simple Editor
                    </button>`
                  : html`<button
                      class="dropdown-item"
                      @click=${() => this.switchToMonacoEditor()}
                      title="Switch to Monaco based editor, a few MB in size, smartphone unfriendly"
                    >
                      Switch to Advanced Editor
                    </button>`}
              </li>
              <li>
                <button
                  class="dropdown-item"
                  @click=${() => this.copyCellText()}
                  title="Copy the text in this cell to clipboard"
                >
                  Copy Text
                </button>
              </li>
            </div>
          </div>
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

  setCaretPosition(position: "start" | "end") {
    if (this.editorInstance) {
      // Feels like a hack
      if (currentEditor === "monaco") {
        if (position === "start") {
          this.editorInstance.setSelection({ startLineNumber: 0, endLineNumber: 0, startColumn: 0, endColumn: 0 });
        } else if (position === "end") {
          const lastLine = this.editorInstance.getModel()?.getLineCount();
          if (lastLine !== undefined) {
            const lastColumn = this.editorInstance.getModel()?.getLineMaxColumn() ?? 0;
            this.editorInstance.setSelection({
              startLineNumber: lastLine,
              endLineNumber: lastLine,
              startColumn: lastColumn,
              endColumn: lastColumn,
            });
          }
        }
      } else if (currentEditor === "codemirror") {
        if (position === "start") {
          this.editorInstance.dispatch({
            selection: { anchor: 0 },
          });
        } else if (position === "end") {
          this.editorInstance.dispatch({
            selection: { anchor: this.editorInstance.state.doc.length },
          });
        }
      }
    }
  }

  dispose() {
    this.remove();
  }
}
