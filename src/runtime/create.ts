/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* This file is internal and should never be imported externally if using starboard-notebook as a library */

import { Cell, CellEvent, MapRegistry, Runtime, RuntimeConfig, RuntimeControls } from "../types";
import { StarboardNotebookElement } from "../components/notebook";
import { textToNotebookContent } from "../content/parsing";
import { ConsoleCatcher } from "../console/console";
import { registry as cellTypeRegistry } from "../cellTypes/registry";
import { registry as cellPropertiesRegistry } from "../cellProperties/registry";
import {
  addCellToNotebookContent,
  changeCellType,
  removeCellFromNotebookById,
  requireIndexOfCellId,
} from "../content/notebookContent";
import { notebookContentToText } from "../content/serialization";
import { debounce } from "@github/mini-throttle";
import { CellElement } from "../components/cell";
import {
  registerDefaultPlugins,
  setupCommunicationWithParentFrame,
  setupGlobalKeybindings,
  updateCellsWhenCellDefinitionChanges,
  updateCellsWhenPropertyGetsDefined,
  respondToStarboardDOMEvents,
} from "./core";
import { createExports } from "./exports";
import { OutboundNotebookMessage } from "../types/messages";
import { StarboardPlugin } from "../types/plugins";
import { arrayMoveElement } from "../components/helpers/array";

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
      ...window.runtimeConfig,
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
        cellContentChanges: new Map<string, (() => void)[]>(),
      },
    },
    plugins: new MapRegistry<string, any>(),
  };

  const controls: RuntimeControls = {
    insertCell(
      adjacentCellId: string | undefined,
      opts: { position: "end" | "before" | "after"; data: Partial<Cell> }
    ) {
      const id = addCellToNotebookContent(rt, opts.data, opts.position, adjacentCellId);
      notebook.requestUpdate();
      controls.contentChanged();

      return id;
    },

    removeCell(id: string) {
      removeCellFromNotebookById(rt.content, id);
      notebook.requestUpdate();
      controls.contentChanged();
    },

    moveCell(id: string, opts: { amount: number }) {
      const idx = requireIndexOfCellId(rt.content.cells, id);
      controls.moveCellToIndex(id, { index: idx + opts.amount });
    },

    moveCellToIndex(id: string, opts: { index: number }) {
      const fromIndex = requireIndexOfCellId(rt.content.cells, id);
      const maxIndex = rt.content.cells.length - 1;
      const toIndexClamped = Math.max(Math.min(opts.index, Math.max(0, maxIndex)), Math.min(0, maxIndex));
      if (fromIndex === toIndexClamped) return;

      arrayMoveElement(rt.content.cells, fromIndex, toIndexClamped);
      rt.dom.notebook.moveCellDomElement(fromIndex, toIndexClamped);
      controls.contentChanged();
    },

    changeCellType(id: string, opts: { newCellType: string }) {
      changeCellType(rt.content, id, opts.newCellType);
      rt.dom.cells.forEach((c) => {
        if (c.cell.id === id) {
          c.remove();
        }
      });
      notebook.requestUpdate();
      controls.contentChanged();
    },

    resetCell(id: string) {
      rt.dom.cells.forEach((c) => {
        if (c.id === id) {
          c.remove();
        }
      });
      notebook.requestUpdate();
    },

    runCell(id: string) {
      const cellElements = rt.dom.cells;

      for (let i = 0; i < cellElements.length; i++) {
        const cellElement = cellElements[i];
        if (cellElement.cell.id === id) {
          cellElement.run();
          return; // IDs should be unique, so after we find it we can stop searching.
        }
      }
    },

    focusCell(id: string, opts: { focusTarget?: "previous" | "next" } = {}) {
      const cellElements = rt.dom.cells;

      let idxOfCell = -1;
      for (let i = 0; i < cellElements.length; i++) {
        const cellElement = cellElements[i];
        if (cellElement.cell.id === id) {
          idxOfCell = i;
          break; // IDs should be unique, so after we find it we can stop searching.
        }
      }

      if (opts.focusTarget === "previous") {
        window.setTimeout(() => {
          const next = cellElements[idxOfCell - 1];
          if (next) next.focusEditor({ position: "end" });
        });
      } else if (opts.focusTarget === "next") {
        window.setTimeout(() => {
          const next = cellElements[idxOfCell + 1];
          if (next) {
            next.focusEditor({ position: "start" });
          }
        });
      } else if (opts.focusTarget === undefined) {
        cellElements[idxOfCell].focus({});
      }
    },

    save() {
      const couldSave = controls.sendMessage({
        type: "NOTEBOOK_SAVE_REQUEST",
        payload: {
          content: notebookContentToText(rt.content),
        },
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

    clearAllCells() {
      for (const c of rt.dom.cells) {
        c.clear();
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
    contentChanged: debounce(function () {
      controls.sendMessage({
        type: "NOTEBOOK_CONTENT_UPDATE",
        payload: {
          content: notebookContentToText(rt.content),
        },
      });
    }, 100),

    /**
     * @deprecated use native DOM events instead, you can use the helper functions `createStarboardEvent`
     * and `dispatchStarboardEvent` in `runtime.exports.core` (or use vanilla `new CustomEvent`).
     * @param event
     */
    emit(event: CellEvent) {
      console.warn(
        "runtime.controls.emit is DEPRECATED and will be removed in an upcoming version of Starboard! Please update your plugins."
      );
      if (event.type === "RUN_CELL") {
        controls.runCell(event.id);
      } else if (event.type === "INSERT_CELL") {
        controls.insertCell(event.id, { position: event.position, data: event.data || {} });
      } else if (event.type === "REMOVE_CELL") {
        controls.removeCell(event.id);
      } else if (event.type === "CHANGE_CELL_TYPE") {
        controls.changeCellType(event.id, { newCellType: event.newCellType });
      } else if (event.type === "RESET_CELL") {
        controls.resetCell(event.id);
      } else if (event.type === "FOCUS_CELL") {
        controls.focusCell(event.id, { focusTarget: event.focus });
      } else if (event.type === "SAVE") {
        controls.save();
      } else if (event.type === "MOVE_CELL") {
        controls.moveCell(event.id, { amount: event.amount });
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

    async registerPlugin<A, B>(plugin: StarboardPlugin<A, B>, opts: A) {
      await plugin.register(rt, opts);
      rt.plugins.register(plugin.id, plugin);
    },
  };

  rt.controls = controls;
  rt.exports = createExports();

  setupGlobalKeybindings(rt);

  /** Initialize certain functionality */
  updateCellsWhenCellDefinitionChanges(rt);
  updateCellsWhenPropertyGetsDefined(rt);
  respondToStarboardDOMEvents(rt);
  (window as any).runtime = rt;

  setupCommunicationWithParentFrame(rt);
  registerDefaultPlugins(rt);

  return rt;
}
