/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { LitElement, html, customElement, query } from 'lit-element';
import { CellElement } from './cell';
import { IFramePage } from 'iframe-resizer';
import { createCellProxy } from './helpers/cellProxy';
import { AssetsAddedIcon } from '@spectrum-web-components/icons-workflow';
import { StarboardLogo } from './logo';
import { insertHTMLChildAtIndex } from './helpers/dom';
import { textToNotebookContent } from '../content/parsing';
import { Runtime } from '../runtime';
import { createRuntime } from '../runtime/create';

// @ts-ignore
import {registerPython} from "starboard-python/dist/index.js";

declare global {
  interface Window {
    parentIFrame: IFramePage;
    iFrameResizer: {
      onReady: () => void;
      onMessage: (msg: any) => void;
    };
    runtime: Runtime;
    starboardEditUrl?: string;
  }
}

@customElement('starboard-notebook')
export class StarboardNotebookElement extends LitElement {
  private runtime!: Runtime;

  @query(".cells-container")
  private cellsParentElement!: HTMLElement;

  createRenderRoot() {
    return this;
  }

  private contentHasBeenSetFromParentIframe = false;

  connectedCallback() {
    super.connectedCallback();
    this.runtime = createRuntime(this);
    window.runtime = this.runtime;

    window.iFrameResizer = {
      onReady: () => {
        // It is possible that the parent iFrame isn't ready for messages yet, so we try to make contact a few times.+
        let numTries = 0;
        const askForContent = () => {
          if (this.contentHasBeenSetFromParentIframe || numTries > 15) return;
          window.parentIFrame.sendMessage({ type: "SIGNAL_READY" });
          numTries++;
          setTimeout(() => askForContent(), numTries*100);
        };
        askForContent();
      },
      onMessage: (msg: any) => {
        if (msg.type === "SET_NOTEBOOK_CONTENT") {
          if (this.contentHasBeenSetFromParentIframe) return; // be idempotent
          this.runtime.content = textToNotebookContent(msg.data);
          this.notebookInitialize();
          this.performUpdate();
          this.contentHasBeenSetFromParentIframe = true;
        } else if (msg.type === "RELOAD") {
          window.location.reload();
        }
      }
    };

    // Register default plugins, when more default plugins are added this should be moved elsewhere
    registerPython();

    document.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
        e.preventDefault();
        this.runtime.controls.save();
      }
    }, false);
  }

  async notebookInitialize() {
    await this.updateComplete;
    this.runtime.controls.runAllCells({onlyRunOnLoad: true});
  }

  firstUpdated(changedProperties: any) {
    super.firstUpdated(changedProperties);
    if (window.initialNotebookContent) {
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
    this.runtime.dom.cells = this.runtime.dom.cells.filter((c) => desiredCellIds.has(c.cell.id));

    for (let i = 0; i < content.cells.length; i++) {
      const cell = content.cells[i];
      if (this.runtime.dom.cells.length > i && cell.id === this.runtime.dom.cells[i].cell.id) {
        // The cell is already present
        continue;
      }

      const cellProxy = createCellProxy(cell, () => {
        this.runtime.controls.contentChanged();
      });

      // We need to insert a cell here
      const newCellElement = new CellElement(
        cellProxy,
        this.runtime,
      );

      this.runtime.dom.cells.splice(i, 0, newCellElement);
      insertHTMLChildAtIndex(this.cellsParentElement, newCellElement, i);
    }
  }

  render() {
    return html`
      <main class="cells-container"></main>
      
      <button @click="${() => this.runtime.controls.insertCell("end")}" class="cell-controls-button" title="Add Cell Here" style="float: right; opacity: 1; padding: 0px 8px 0px 16px; margin-right: 2px">
          ${AssetsAddedIcon({ width: 20, height: 20 })}
        </button>
      <footer class="starboard-notebook-footer">
        <span>${StarboardLogo({width: 10, height: 10})} Starboard Notebook v${this.runtime.version}
        ${window.starboardEditUrl ? html`- <a href=${window.starboardEditUrl}>Edit on Starboard.gg</a>`: ""}
        </span>
      </footer>
        `;
  }
}