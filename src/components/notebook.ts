/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { customElement, html, LitElement, property, query } from "lit-element";
import { CellElement } from "./cell";
import "./helpers/minimumBodySize"; // registers starboard-ensure-fits
import { IFramePage } from "iframe-resizer";
import { createCellProxy } from "./helpers/cellProxy";
import { AssetsAddedIcon } from "@spectrum-web-components/icons-workflow";
import { CodeIcon, StarboardLogo } from "./icons";
import { insertHTMLChildAtIndex } from "./helpers/dom";
import { Runtime, RuntimeConfig } from "../types";
import { setupRuntime } from "../runtime/create";
import Modal from "bootstrap/js/dist/modal";
import { copyToClipboard } from "./helpers/clipboard";

declare global {
  interface Window {
    parentIFrame: IFramePage;
    iFrameResizer: {
      onReady: () => void;
      onMessage: (msg: any) => void;
    };
    starboardEditUrl?: string;
  }
}

@customElement("starboard-notebook")
export class StarboardNotebookElement extends LitElement {
  private runtime!: Runtime;

  @property({ type: Object })
  public config?: RuntimeConfig;

  @query(".cells-container")
  private cellsParentElement!: HTMLElement;

  @query("#starboard-source-modal")
  private sourceModalElement!: HTMLElement;

  private sourceModal!: Modal;

  createRenderRoot() {
    return this;
  }

  public hasHadInitialRun = false;

  connectedCallback() {
    super.connectedCallback();
    this.runtime = setupRuntime(this);

    // Not to be relied upon, for debugging purposes during development.
    // This global may be deleted at any time.
    (window as any).viewNotebookSource = () => {
      const content = this.runtime.exports.core.notebookContentToText(this.runtime.content);
      const encoded = encodeURIComponent(content);
      const a = document.createElement(`a`);
      a.target = `_blank`;
      a.href = `data:text/plain;charset=utf-8,${encoded}`;
      a.style.display = `none`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
  }

  async notebookInitialize() {
    await this.updateComplete;
    if (!this.hasHadInitialRun) {
      this.runtime.controls.runAllCells({ onlyRunOnLoad: true });
      this.hasHadInitialRun = true;
    }
  }

  firstUpdated(changedProperties: any) {
    super.firstUpdated(changedProperties);
    this.sourceModal = new Modal(this.sourceModalElement, {});

    if (this.runtime.content.cells.length > 0) {
      this.notebookInitialize();
    }
  }

  performUpdate() {
    super.performUpdate();
    // We manually manage the cell elements, lit-html doesn't do a good job here
    // (or put differently: a too good job, it reuses components which is problematic)

    const content = this.runtime.content;
    const desiredCellIds = new Set(content.cells.map((c) => c.id));

    const mounted = this.cellsParentElement.children;
    for (let i = 0; i < mounted.length; i++) {
      const child = mounted[i] as CellElement;
      if (!desiredCellIds.has(child.cell.id)) {
        child.remove();
      }
    }
    this.runtime.dom.cells = this.runtime.dom.cells.filter(
      (c) => desiredCellIds.has(c.cell.id) && !!this.querySelector("#" + c.cell.id)
    );

    for (let i = 0; i < content.cells.length; i++) {
      const cell = content.cells[i];
      if (this.runtime.dom.cells.length > i && cell.id === this.runtime.dom.cells[i].cell.id) {
        // The cell is already present
        continue;
      }

      const cellProxy = createCellProxy(cell, () => {
        const changeListeners = this.runtime.internal.listeners.cellContentChanges.get(cell.id);
        if (changeListeners) {
          changeListeners.forEach((v) => v());
        }
        this.runtime.controls.contentChanged();
      });

      // We need to insert a cell here
      const newCellElement = new CellElement(cellProxy, this.runtime);

      this.runtime.dom.cells.splice(i, 0, newCellElement);
      insertHTMLChildAtIndex(this.cellsParentElement, newCellElement, i);
    }
  }

  showSourceModal() {
    const source = this.runtime.exports.core.notebookContentToText(this.runtime.content);
    (this.querySelector("#starboard-source-modal-content") as Element).textContent = source;
    (this.querySelector(
      "#download-source-button"
    ) as HTMLAnchorElement).href = `data:nb;charset=utf-8,${encodeURIComponent(source)}`;
    this.sourceModal.show();
  }

  render() {
    return html`
      <main class="cells-container"></main>
      <footer class="starboard-notebook-footer line-grid">
        <div class="starboard-notebook-footer-content d-flex align-items-center">
          <span
            >${StarboardLogo({ width: 10, height: 10 })} Starboard Notebook v${this.runtime.version}
            ${window.starboardEditUrl ? html`- <a href=${window.starboardEditUrl}>Edit on Starboard.gg</a>` : ""}
          </span>
          <button @click=${() => this.showSourceModal()} class="btn btn-sm py-0 px-1 ms-2">
            <span>${CodeIcon({ width: 15, height: 15 })}</span>
            Source
          </button>

          <button
            @click="${() => this.runtime.controls.insertCell({}, "end")}"
            class="cell-controls-button"
            title="Add Cell Here"
            style="opacity: 0.4 !important; margin-left: auto; padding: 0px 1px 0px 18px;"
          >
            ${AssetsAddedIcon({ width: 15, height: 15 })}
          </button>
        </div>
      </footer>

      <div
        class="modal fade"
        id="starboard-source-modal"
        tabindex="-1"
        aria-labelledby="starboard-source-modal-label"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-xl modal-fullscreen-lg-down modal-dialog-scrollable" style="min-height: 240px;">
          <starboard-ensure-parent-fits></starboard-ensure-parent-fits>
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="starboard-source-modal-label">Notebook Source</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body bg-light py-1" style="overflow-x: auto">
              <pre
                id="starboard-source-modal-content"
                class="my-1 p-0"
                style="overflow: visible; line-height: 1.2;"
              ></pre>
            </div>
            <div class="modal-footer">
              <button
                @click=${() => {
                  console.log("Copied to clipboard!");
                  copyToClipboard(this.runtime.exports.core.notebookContentToText(this.runtime.content));
                }}
                class="btn text-dark"
              >
                Copy to clipboard
              </button>
              <a id="download-source-button" download="notebook.sb" target="_blank" class="btn text-dark"
                >Download as file</a
              >
              <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
