/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { LitElement, html, customElement, query } from 'lit-element';
import { addCellToNotebookContent, removeCellFromNotebookById, changeCellType} from '../content/notebookContent';
import { CellElement } from './cell';
import { IFramePage } from 'iframe-resizer';
import { createCellProxy } from './helpers/cellProxy';
import { AssetsAddedIcon } from '@spectrum-web-components/icons-workflow';
import { debounce } from '@github/mini-throttle/decorators';
import { starboardLogo } from './logo';
import { insertHTMLChildAtIndex } from './helpers/dom';
import { notebookContentToText } from '../content/serialization';
import { textToNotebookContent } from '../content/parsing';
import { Runtime } from '../runtime';
import { createRuntime } from '../runtime/create';

declare global {
  interface Window {
    parentIFrame: IFramePage;
    iFrameResizer: {
      onReady: () => void;
      onMessage: (msg: any) => void;
    };
    runtime?: Runtime;
  }
}

@customElement('starboard-notebook')
export class StarboardNotebook extends LitElement {
  private runtime!: Runtime;

  @query(".cells-container")
  private cellsParentElement!: HTMLElement;

  createRenderRoot() {
    return this;
  }

  insertCell(position: "end" | "before" | "after", adjacentCellId?: string) {
    addCellToNotebookContent(this.runtime.content, position, adjacentCellId);
    this.performUpdate();
    this.onChanges();
  }

  removeCell(id: string) {
    removeCellFromNotebookById(this.runtime.content, id);
    this.performUpdate();
    this.onChanges();
  }

  changeCellType(id: string, newCellType: string) {
    changeCellType(this.runtime.content, id, newCellType);
    this.performUpdate();
    this.onChanges();
  }

  runCell(id: string, focusNext: boolean, insertNewCell: boolean) {
    const cellElements = this.runtime.dom.cells;

    let idxOfCell = -1;
    for (let i = 0; i < cellElements.length; i++) {
      const cellElement = cellElements[i];
      if (cellElement.cell.id === id) {
        idxOfCell = i;
        cellElement.run();
        break; // IDs should be unique, so after we find it we can stop searching.
      }
    }
    const isLastCell = idxOfCell === cellElements.length - 1;

    if (insertNewCell || isLastCell) {
      this.insertCell("after", id);
    }
    if (focusNext) {
      window.setTimeout(() => {
        cellElements[idxOfCell + 1].focusEditor();
      });
    }
  }

  save() {
    if (window.parentIFrame) {
      window.parentIFrame.sendMessage({ type: "SAVE", data: notebookContentToText(this.runtime.content) });
    } else {
      console.error("Can't save as parent frame is not listening for messages");
    }
  }

  async runAllCells(opts: {onlyRunOnLoad?: boolean} = {}) {
    for (const ce of this.runtime.dom.cells ) {
      if (opts.onlyRunOnLoad && !ce.cell.properties.runOnLoad) {
        continue;
      }
      await ce.run();
    }
  }

  connectedCallback() {
    super.connectedCallback();

    this.runtime = createRuntime(this);
    window.runtime = this.runtime;

    window.iFrameResizer = {
      onReady: () => {
        window.parentIFrame.sendMessage({ type: "SIGNAL_READY" });
      },
      onMessage: (msg: any) => {
        if (msg.type === "SET_NOTEBOOK_CONTENT") {
          this.runtime.content = textToNotebookContent(msg.data);
          
          this.updateComplete.then(() => this.runAllCells({onlyRunOnLoad: true}));
          this.performUpdate();
        } else if (msg.type === "RELOAD") {
          window.location.reload();
        }
      }
    };

    document.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
        e.preventDefault();
        this.save();
      }
    }, false);
  }

  firstUpdated(changedProperties: any) {
    super.firstUpdated(changedProperties);
    this.updateComplete.then(() => { this.runAllCells({onlyRunOnLoad: true});});
  }

  performUpdate() {
    const content = this.runtime.content;
    super.performUpdate();
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
        this.onChanges();
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

  /**
   * To be called when the notebook content text changes in any way.
   */
  @debounce(100)
  private onChanges() {
    if (window.parentIFrame) {
      window.parentIFrame.sendMessage({ type: "NOTEBOOK_CONTENT_UPDATE", data: notebookContentToText(this.runtime.content) });
    }
  }

  render() {
    return html`
      <main class="cells-container"></main>
      
      <button @click="${() => this.insertCell("end")}" class="cell-controls-button" title="Add Cell Here" style="float: right; opacity: 1; padding: 0px 8px 0px 16px; margin-right: 2px">
          ${AssetsAddedIcon({ width: 20, height: 20 })}
        </button>
      <footer class="starboard-notebook-footer">
        <span>${starboardLogo(10, 10)}</span> Starboard Notebook v${this.runtime.version}
      </footer>
        `;
  }
}