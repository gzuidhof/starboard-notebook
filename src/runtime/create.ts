/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* This file is internal and should never be imported externally if using starboard-notebook as a library */

import { Runtime, CellEvent, RuntimeControls, RuntimeConfig, Cell, MapRegistry } from "../types";
import { StarboardNotebookElement } from "../components/notebook";
import { textToNotebookContent } from "../content/parsing";
import { ConsoleCatcher } from "../console/console";
import { registry as cellTypeRegistry } from "../cellTypes/registry";
import { registry as cellPropertiesRegistry } from "../cellProperties/registry";
import { addCellToNotebookContent, removeCellFromNotebookById, changeCellType } from "../content/notebookContent";
import { notebookContentToText } from "../content/serialization";
import { debounce } from "@github/mini-throttle";
import { CellElement } from "../components/cell";
import { registerDefaultPlugins, setupCommunicationWithParentFrame, setupGlobalKeybindings, updateCellsWhenCellDefinitionChanges, updateCellsWhenPropertyGetsDefined } from "./core";
import { createExports } from "./exports";
import { OutboundNotebookMessage } from "../types/messages";
import { StarboardPlugin } from "../types/plugins";

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

function getConfig() {
  let config: RuntimeConfig = {
    persistCellIds: false,
    defaultTextEditor: "codemirror",
  };

  if (window.runtimeConfig) {
    config = {
      ...config,
      ...window.runtimeConfig
    };
  }
  return config;
}

export function setupRuntime(notebook: StarboardNotebookElement): Runtime {
  const content = getInitialContent();

  /** Runtime without any of the functions **/
  const rt = {
    consoleCatcher: new ConsoleCatcher(window.console),
    content,
    config: getConfig(),
    dom: {
      cells: [] as CellElement[],
      notebook,
    },
    definitions: {
      cellTypes: cellTypeRegistry,
      cellProperties: cellPropertiesRegistry,
    },
    name: "starboard-notebook" as const,
    version: STARBOARD_NOTEBOOK_VERSION,

    // These are set below
    controls: null as any,
    exports: null as any,
    internal: {
      listeners: {
        cellContentChanges: new Map<string, (() => void)[]>()
      }
    },
    plugins: new MapRegistry<string, any>(),
  };

  const controls: RuntimeControls = {
    insertCell(data: Partial<Cell>, position: "end" | "before" | "after", adjacentCellId?: string) {
      const id = addCellToNotebookContent(rt, data, position, adjacentCellId);
      notebook.performUpdate();
      controls.contentChanged();

      return id;
    },

    removeCell(id: string) {
      removeCellFromNotebookById(rt.content, id);
      notebook.performUpdate();
      controls.contentChanged();
    },

    changeCellType(id: string, newCellType: string) {
      changeCellType(rt.content, id, newCellType);
      rt.dom.cells.forEach(c => {
        if (c.cell.id === id) {
          c.remove();
        }
      });
      notebook.performUpdate();
      controls.contentChanged();
    },

    resetCell(id: string) {
      rt.dom.cells.forEach(c => {
        if (c.id === id) {
          c.remove();
        }
      });
      notebook.performUpdate();
    },

    runCell(id: string, focus?: "previous" | "next", insertNewCell?: boolean) {
      let cellElements = rt.dom.cells;

      let idxOfCell = -1;
      for (let i = 0; i < cellElements.length; i++) {
        const cellElement = cellElements[i];
        if (cellElement.cell.id === id) {
          idxOfCell = i;
          cellElement.run();
          break; // IDs should be unique, so after we find it we can stop searching.
        }
      }

      if (insertNewCell) {
        controls.insertCell({}, "after", id);
        cellElements = rt.dom.cells;
      }
      if (focus === "previous") {
        window.setTimeout(() => {
          const next = cellElements[idxOfCell - 1];
          if (next) next.focusEditor();
        });
      } else if(focus === "next") {
        window.setTimeout(() => {
          const next = cellElements[idxOfCell + 1];
          if (next) {
            next.focusEditor();
          }
        });
      }
    },

    focusCell(id: string, focus?: "previous" | "next") {
      const cellElements = rt.dom.cells;

      let idxOfCell = -1;
      for (let i = 0; i < cellElements.length; i++) {
        const cellElement = cellElements[i];
        if (cellElement.cell.id === id) {
          idxOfCell = i;
          break; // IDs should be unique, so after we find it we can stop searching.
        }
      }

      if (focus === "previous") {
        window.setTimeout(() => {
          const next = cellElements[idxOfCell - 1];
          if (next) next.focusEditor();
        });
      } else if(focus === "next") {
        window.setTimeout(() => {
          const next = cellElements[idxOfCell + 1];
          if (next) {
            next.focusEditor();
          }
        });
      }
    },

    save() {
      const couldSave = controls.sendMessage({
        type: "NOTEBOOK_SAVE_REQUEST", payload: {
          content: notebookContentToText(rt.content)
        }
      });
      if (!couldSave) {
        console.error("Can't save as parent frame is not listening for messages");
      }
      return couldSave;
    },

    async runAllCells(opts: { onlyRunOnLoad?: boolean } = {}) {
      let cellElement: CellElement | null = rt.dom.cells[0] || null;

      while (cellElement) {
        if (opts.onlyRunOnLoad && !cellElement.cell.metadata.properties.run_on_load) {
          // Don't run this cell..
        } else {
          await cellElement.run();
        }
        cellElement = cellElement.nextSibling as CellElement | null;
      }

    },

    sendMessage(message: OutboundNotebookMessage, targetOrigin?: string): boolean {
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
      function () {
        controls.sendMessage(({
          type: "NOTEBOOK_CONTENT_UPDATE", payload: {
            content: notebookContentToText(rt.content)
          }
        }));
      },
      100
    ),

    emit(event: CellEvent) {
      if (event.type === "RUN_CELL") {
        controls.runCell(event.id, event.focus, !!event.insertNewCell);
      } else if (event.type === "INSERT_CELL") {
        controls.insertCell(event.data || {}, event.position, event.id);
      } else if (event.type === "REMOVE_CELL") {
        controls.removeCell(event.id);
      } else if (event.type === "CHANGE_CELL_TYPE") {
        controls.changeCellType(event.id, event.newCellType);
      } else if (event.type === "RESET_CELL") {
        controls.resetCell(event.id);
      } else if (event.type === "FOCUS_CELL") {
        controls.focusCell(event.id, event.focus);
      } else if (event.type === "SAVE") {
        controls.save();
      }
    },

    subscribeToCellChanges(id: string, callback: () => any) {
      const listeners = rt.internal.listeners.cellContentChanges.get(id);
      if (listeners !== undefined) {
        listeners.push(callback);
      } else {
        rt.internal.listeners.cellContentChanges.set(id, [callback]);
      }
    },

    unsubscribeToCellChanges(id: string, callback: () => any) {
      const listeners = rt.internal.listeners.cellContentChanges.get(id);
      if (!listeners) return;

      const idx = listeners.indexOf(callback);
      if (idx === -1) return;
      listeners.splice(idx, 1);
    },

    async registerPlugin(plugin: StarboardPlugin, opts?: any) {
      await plugin.register(rt, opts);
      rt.plugins.register(plugin.id, plugin);
    }
  };

  rt.controls = controls;
  rt.exports = createExports();

  setupGlobalKeybindings(rt);

  /** Initialize certain functionality */
  updateCellsWhenCellDefinitionChanges(rt);
  updateCellsWhenPropertyGetsDefined(rt);

  (window as any).runtime = rt;

  setupCommunicationWithParentFrame(rt);
  registerDefaultPlugins(rt);

  return rt;
}
