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
import { registerDefaultPlugins, setupCommunicationWithParentFrame, setupGlobalKeybindings, updateCellsWhenCellDefinitionChanges } from "./core";
import { createExports } from "./exports";

declare const STARBOARD_NOTEBOOK_VERSION: string;

function getInitialContent() {
  if (window.initialNotebookContent) {
    return textToNotebookContent(window.initialNotebookContent);
  }

  const notebookContentElement = document.querySelector('script[type="application/vnd.starboard.nb"]');
  if (notebookContentElement) {
    return textToNotebookContent((notebookContentElement as HTMLElement).innerText);
  }

  return { cells: [], metadata: {} };
}

export function setupRuntime(notebook: StarboardNotebookElement): Runtime {
    const content = getInitialContent();
  
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

      // These are set below
      controls: null as any,
      exports: null as any,
    };

    const controls: RuntimeControls = {
        insertCell(position: "end" | "before" | "after", adjacentCellId?: string) {
          addCellToNotebookContent(rt.content, position, adjacentCellId);
          notebook.performUpdate();
          controls.contentChanged();
        },
      
        removeCell(id: string) {
          removeCellFromNotebookById(rt.content, id);
          notebook.performUpdate();
          controls.contentChanged();
        },
      
        changeCellType(id: string, newCellType: string) {
          changeCellType(rt.content, id, newCellType);
          notebook.performUpdate();
          controls.contentChanged();
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
            controls.insertCell("after", id);
          }
          if (focusNext) {
            window.setTimeout(() => {
              const next = cellElements[idxOfCell + 1];
              if (next) next.focusEditor();
            });
          }
        },
      
        save() {
          const couldSave = controls.sendMessage({ type: "SAVE", data: notebookContentToText(rt.content) });
          if (!couldSave) {
            console.error("Can't save as parent frame is not listening for messages");
          }
          return couldSave;
        },
      
        async runAllCells(opts: {onlyRunOnLoad?: boolean} = {}) {
          let cellElement: CellElement | null = rt.dom.cells[0] || null;

          while(cellElement) {
            if (opts.onlyRunOnLoad && !cellElement.cell.metadata.properties.run_on_load) {
              // Don't run this cell..
            } else {
              await cellElement.run();
            }
            cellElement = cellElement.nextSibling as CellElement | null;
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
        contentChanged: debounce(
          function() {
            controls.sendMessage(({ type: "NOTEBOOK_CONTENT_UPDATE", data: notebookContentToText(rt.content)}));
          },
          100
        ),

        emit (event: CellEvent) {
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
        }
    };

    rt.controls = controls;
    rt.exports = createExports();

    setupGlobalKeybindings(rt);

    /** Initialize certain functionality */
    updateCellsWhenCellDefinitionChanges(rt);

    window.runtime = rt;
    setupCommunicationWithParentFrame(rt);

    registerDefaultPlugins(rt);
    
    

    return rt;
}
