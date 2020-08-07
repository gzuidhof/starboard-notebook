/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* This file is internal and should never be imported externally if using starboard-notebook as a library */

import { Runtime, CellEvent, RuntimeControls } from ".";
import { StarboardNotebookElement } from "../components/notebook";
import { textToNotebookContent } from "../content/parsing";
import { ConsoleCatcher } from "../console/console";
import { registry as cellTypeRegistry } from "../cellTypes/registry";
import { registry as cellPropertiesRegistry } from "../cellProperties/registry";
import { addCellToNotebookContent, removeCellFromNotebookById, changeCellType } from "../content/notebookContent";
import { notebookContentToText } from "../content/serialization";
import { debounce } from "@github/mini-throttle";
import { CellElement } from "../components/cell";

declare const STARBOARD_NOTEBOOK_VERSION: string;

export function createRuntime(this: any, notebook: StarboardNotebookElement): Runtime {

    const content =  (window as any).initialNotebookContent ? textToNotebookContent((window as any).initialNotebookContent) : { frontMatter: "", cells: [] };
  
    /** Runtime without any of the functions **/
    const rt = {
      consoleCatcher: new ConsoleCatcher(window.console),
      content,
      dom: {
        cells: [] as CellElement[],
        notebook,
      },

      definitions: {
        cellTypes: cellTypeRegistry,
        cellProperties: cellPropertiesRegistry,
      },


      version: STARBOARD_NOTEBOOK_VERSION,
    };

    const controls: RuntimeControls = {
        insertCell(position: "end" | "before" | "after", adjacentCellId?: string) {
          addCellToNotebookContent(rt.content, position, adjacentCellId);
          notebook.performUpdate();
          this.contentChanged();
        },
      
        removeCell(id: string) {
          removeCellFromNotebookById(rt.content, id);
          notebook.performUpdate();
          this.contentChanged();
        },
      
        changeCellType(id: string, newCellType: string) {
          changeCellType(rt.content, id, newCellType);
          notebook.performUpdate();
          this.contentChanged();
        },
      
        runCell(id: string, focusNext: boolean, insertNewCell: boolean) {
          const cellElements = rt.dom.cells;
      
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
          const couldSave = this.sendMessage({ type: "SAVE", data: notebookContentToText(rt.content) });
          if (!couldSave) {
            console.error("Can't save as parent frame is not listening for messages");
          }
          return couldSave;
        },
      
        async runAllCells(opts: {onlyRunOnLoad?: boolean} = {}) {
          for (const ce of rt.dom.cells ) {
            if (opts.onlyRunOnLoad && !ce.cell.properties.runOnLoad) {
              continue;
            }
            await ce.run();
          }
        },

        sendMessage(message: any, targetOrigin?: string): boolean {
          if (window.parentIFrame) {
            window.parentIFrame.sendMessage(message, targetOrigin);
            return true;
          }
          return false;
        },

       /**
       * To be called when the notebook content text changes in any way.
       */
        contentChanged: (function(controls: RuntimeControls) { // HACK: Self invoking function to get 'this' correct..
        return debounce(
          function() {
            controls.sendMessage(({ type: "NOTEBOOK_CONTENT_UPDATE", data: notebookContentToText(rt.content)}));
          }, 100
        );})(this)
    };

    const emit = (event: CellEvent) => {
      if (event.type === "RUN_CELL") {
        controls.runCell(event.id, !!event.focusNextCell, !!event.insertNewCell);
      } else if (event.type === "INSERT_CELL") {
        controls.insertCell(event.position, event.id);
      } else if (event.type === "REMOVE_CELL") {
        controls.removeCell(event.id);
      } else if (event.type === "CHANGE_CELL_TYPE") {
        controls.changeCellType(event.id, event.newCellType);
      } else if (event.type === "SAVE") {
        controls.save();
      }
    };
    const serialize = () => notebookContentToText(rt.content);

    return {
      ...rt,
      controls,
      emit,
      serialize,
    };
}
