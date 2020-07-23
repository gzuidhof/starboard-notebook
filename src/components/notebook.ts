/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { LitElement, html, customElement, query } from 'lit-element';
import { addCellToNotebookContent, removeCellFromNotebookById, changeCellType, NotebookContent, textToNotebookContent, notebookContentToText } from '../notebookContent';
import { Runtime } from '../run';
import { CellElement, CellEvent } from './cell';
import { IFramePage } from 'iframe-resizer';
import { createCellProxy } from '../cellProxy';
import { AssetsAddedIcon } from '@spectrum-web-components/icons-workflow';
import { debounce } from '@github/mini-throttle/decorators';
import { starboardLogo } from './logo';

declare const STARBOARD_NOTEBOOK_VERSION: string;

declare global {
  interface Window {
    parentIFrame: IFramePage;
    iFrameResizer: {
      onReady: () => void;
      onMessage: (msg: any) => void;
    };
  }
}

function insertHTMLChildAtIndex(parent: HTMLElement, child: HTMLElement, index: number) {
  if (!index) index = 0;
  if (index >= parent.children.length) {
    parent.appendChild(child);
  } else {
    parent.insertBefore(child, parent.children[index]);
  }
}


@customElement('starboard-notebook')
export class StarboardNotebook extends LitElement {

  private notebookContent: NotebookContent = { frontMatter: "", cells: [] };

  private runtime!: Runtime;
  private cellElements: CellElement[] = [];

  @query(".cells-container")
  private cellsParentElement!: HTMLElement;

  createRenderRoot() {
    return this;
  }

  insertCell(position: "end" | "before" | "after", adjacentCellId?: string) {
    addCellToNotebookContent(this.notebookContent, position, adjacentCellId);
    this.performUpdate();
  }

  removeCell(id: string) {
    removeCellFromNotebookById(this.notebookContent, id);
    this.performUpdate();
  }

  changeCellType(id: string, newCellType: string) {
    changeCellType(this.notebookContent, id, newCellType);
    this.performUpdate();
  }

  runCell(id: string, focusNext: boolean, insertNewCell: boolean) {
    let idxOfCell = -1;
    for (let i = 0; i < this.cellElements.length; i++) {
      const cellElement = this.cellElements[i];
      if (cellElement.cell.id === id) {
        idxOfCell = i;
        cellElement.run();
        break; // IDs should be unique, so after we find it we can stop searching.
      }
    }
    const isLastCell = idxOfCell === this.cellElements.length - 1;

    if (insertNewCell || isLastCell) {
      this.insertCell("after", id);
    }
    if (focusNext) {
      window.setTimeout(() => {
        this.cellElements[idxOfCell + 1].focusEditor();
      });
    }
  }

  save() {
    if (window.parentIFrame) {
      window.parentIFrame.sendMessage({ type: "SAVE", data: notebookContentToText(this.notebookContent) });
    } else {
      console.error("Can't save as parent frame is not listening for messages");
    }
  }

  connectedCallback() {
    super.connectedCallback();

    this.runtime = new Runtime();
    this.notebookContent = (window as any).initialNotebookContent ? textToNotebookContent((window as any).initialNotebookContent) : { frontMatter: "", cells: [] };

    window.iFrameResizer = {
      onReady: () => {
        window.parentIFrame.sendMessage({ type: "SIGNAL_READY" });
      },
      onMessage: (msg: any) => {
        if (msg.type === "SET_NOTEBOOK_CONTENT") {
          this.notebookContent = textToNotebookContent(msg.data);
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
  }

  performUpdate() {
    super.performUpdate();
    const desiredCellIds = new Set(this.notebookContent.cells.map((c) => c.id));

    const mounted = this.cellsParentElement.children;
    for (let i = 0; i < mounted.length; i++) {
      const child = mounted[i] as CellElement;
      if (!desiredCellIds.has(child.cell.id)) {
        child.remove();
      }
    }
    this.cellElements = this.cellElements.filter((c) => desiredCellIds.has(c.cell.id));

    for (let i = 0; i < this.notebookContent.cells.length; i++) {
      const cell = this.notebookContent.cells[i];
      if (this.cellElements.length > i && cell.id === this.cellElements[i].cell.id) {
        // The cell is already present
        continue;
      }

      const cellProxy = createCellProxy(cell, () => {
        this.onCellChanged();
      });

      // We need to insert a cell here
      const newCellElement = new CellElement(
        cellProxy,
        this.runtime,
        (event: CellEvent) => {
          // A cell can invoke this on another cell by passing the ID
          // if no ID is specified, run it on the cell that emitted the event.
          const id = event.id !== undefined ? event.id : cell.id;

          if (event.type === "RUN_CELL") {
            this.runCell(id, !!event.focusNextCell, !!event.insertNewCell);
          } else if (event.type === "INSERT_CELL") {
            this.insertCell(event.position, id);
          } else if (event.type === "REMOVE_CELL") {
            this.removeCell(id);
          } else if (event.type === "CHANGE_CELL_TYPE") {
            this.changeCellType(id, event.newCellType);
          } else if (event.type === "SAVE") {
            this.save();
          }
        }
      );

      this.cellElements.splice(i, 0, newCellElement);
      insertHTMLChildAtIndex(this.cellsParentElement, newCellElement, i);
    }
  }

  @debounce(200)
  private onCellChanged() {
    if (window.parentIFrame) {
      window.parentIFrame.sendMessage({ type: "NOTEBOOK_CONTENT_UPDATE", data: notebookContentToText(this.notebookContent) });
    }
  }


  render() {
    return html`
    <sp-theme> 
        <div class="cells-container"></div>

          <div class="starboard-notebook-footer">
          <span>${starboardLogo(10, 10)}</span> Starboard Notebook v${STARBOARD_NOTEBOOK_VERSION}
          <button @click="${() => this.insertCell("end")}" class="cell-controls-button" title="Add Cell" style="float: right; opacity: 1; padding: 0px 8px 0px 16px; margin-right: 2px">
            ${AssetsAddedIcon({ width: 20, height: 20 })}
          </button>
          </div>
          

    </sp-theme>
        `;
  }

}