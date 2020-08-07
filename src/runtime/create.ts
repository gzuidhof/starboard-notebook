/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* This file is internal and should never be imported externally if using starboard-notebook as a library */

import { Runtime, CellEvent } from ".";
import { StarboardNotebookElement } from "../components/notebook";
import { textToNotebookContent } from "../content/parsing";
import { ConsoleCatcher } from "../console/console";
import { registry } from "../cellHandler/registry";
import { addCellToNotebookContent, removeCellFromNotebookById, changeCellType } from "../content/notebookContent";
import { notebookContentToText } from "../content/serialization";
import { debounce } from "@github/mini-throttle";

declare const STARBOARD_NOTEBOOK_VERSION: string;

export function createRuntime(this: any, notebook: StarboardNotebookElement): Runtime {
    return {
        consoleCatcher: new ConsoleCatcher(window.console),
        content: (window as any).initialNotebookContent ? textToNotebookContent((window as any).initialNotebookContent) : { frontMatter: "", cells: [] },
        emit: function(event: CellEvent) {
          if (event.type === "RUN_CELL") {
            this.runCell(event.id, !!event.focusNextCell, !!event.insertNewCell);
          } else if (event.type === "INSERT_CELL") {
            this.insertCell(event.position, event.id);
          } else if (event.type === "REMOVE_CELL") {
            this.removeCell(event.id);
          } else if (event.type === "CHANGE_CELL_TYPE") {
            this.changeCellType(event.id, event.newCellType);
          } else if (event.type === "SAVE") {
            this.save();
          }
        },
        dom: {
          cells: [],
          notebook,
        },
        cellTypes: registry,
        version: STARBOARD_NOTEBOOK_VERSION,


        insertCell(position: "end" | "before" | "after", adjacentCellId?: string) {
          addCellToNotebookContent(this.content, position, adjacentCellId);
          notebook.performUpdate();
          this.contentChanged();
        },
      
        removeCell(id: string) {
          removeCellFromNotebookById(this.content, id);
          notebook.performUpdate();
          this.contentChanged();
        },
      
        changeCellType(id: string, newCellType: string) {
          changeCellType(this.content, id, newCellType);
          notebook.performUpdate();
          this.contentChanged();
        },
      
        runCell(id: string, focusNext: boolean, insertNewCell: boolean) {
          const cellElements = this.dom.cells;
      
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
        },
      
        save() {
          if (window.parentIFrame) {
            window.parentIFrame.sendMessage({ type: "SAVE", data: notebookContentToText(this.content) });
          } else {
            console.error("Can't save as parent frame is not listening for messages");
          }
        },
      
        async runAllCells(opts: {onlyRunOnLoad?: boolean} = {}) {
          for (const ce of this.dom.cells ) {
            if (opts.onlyRunOnLoad && !ce.cell.properties.runOnLoad) {
              continue;
            }
            await ce.run();
          }
        },
        

        /**
         * To be called when the notebook content text changes in any way.
         */
        contentChanged: (function(runtime: Runtime) { // HACK: Self invoking function to get 'this' correct..
          return debounce(
            function() {
              if (window.parentIFrame) {
                window.parentIFrame.sendMessage({ type: "NOTEBOOK_CONTENT_UPDATE", data: notebookContentToText(runtime.content) });
              }
            }, 100
          );})(this)
    };
}
