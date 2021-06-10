/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* This file is internal and should never be imported externally if using starboard-notebook as a library */

import { CellEvent, MapRegistry, Runtime, RuntimeConfig, RuntimeControls } from "../types";
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
  updateIframeWhenSizeChanges,
} from "./core";
import { createExports } from "./exports";
import { OutboundNotebookMessage } from "../types/messages";
import { StarboardPlugin } from "../types/plugins";
import { arrayMoveElement } from "../components/helpers/array";
import { dispatchStarboardEvent } from "../components/helpers/event";
import {
  ChangeCellTypeOptions,
  ClearCellOptions,
  FocusCellOptions,
  InsertCellOptions,
  RemoveCellOptions,
  ResetCellOptions,
  RunCellOptions,
  SetCellPropertyOptions,
} from "src/types/events";

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

function mustGetCellById(rt: Runtime, id: string) {
  const cell = rt.dom.getCellById(id);
  if (!cell) throw new Error(`Cell with id ${id} not found`);
  return cell;
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
      getCellById: (id: string) => notebook.querySelector("#" + id) as CellElement | null,
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
    insertCell(opts: InsertCellOptions) {
      if (dispatchStarboardEvent(rt.dom.notebook, "sb:insert_cell", opts)) {
        const id = addCellToNotebookContent(rt, opts.data, opts.position, opts.adjacentCellId);
        notebook.requestUpdate();
        controls.contentChanged();
        return id;
      }
      return false;
    },

    removeCell(opts: RemoveCellOptions) {
      if (dispatchStarboardEvent(mustGetCellById(rt, opts.id), "sb:remove_cell", opts)) {
        removeCellFromNotebookById(rt.content, opts.id);
        notebook.requestUpdate();
        controls.contentChanged();
        return true;
      }
      return false;
    },

    moveCell(opts: { id: string; amount: number }) {
      // Note: the actual moving happens in moveCellToIndex, that is also where the event is triggered.
      const idx = requireIndexOfCellId(rt.content.cells, opts.id);
      return controls.moveCellToIndex({ id: opts.id, toIndex: idx + opts.amount });
    },

    moveCellToIndex(opts: { id: string; toIndex: number }) {
      const fromIndex = requireIndexOfCellId(rt.content.cells, opts.id);
      const maxIndex = rt.content.cells.length - 1;
      const toIndexClamped = Math.max(Math.min(opts.toIndex, Math.max(0, maxIndex)), Math.min(0, maxIndex));

      if (fromIndex === toIndexClamped) return true;
      if (
        dispatchStarboardEvent(mustGetCellById(rt, opts.id), "sb:move_cell", {
          id: opts.id,
          fromIndex: fromIndex,
          toIndex: toIndexClamped,
        })
      ) {
        arrayMoveElement(rt.content.cells, fromIndex, toIndexClamped);
        rt.dom.notebook.moveCellDomElement(fromIndex, toIndexClamped);
        controls.contentChanged();
        return true;
      }
      return false;
    },

    changeCellType(opts: ChangeCellTypeOptions) {
      const cell = mustGetCellById(rt, opts.id);
      if (dispatchStarboardEvent(cell, "sb:change_cell_type", opts)) {
        const didChange = changeCellType(rt.content, opts.id, opts.newCellType);
        cell.remove();
        notebook.requestUpdate();

        if (didChange) {
          controls.contentChanged();
        }
        return true;
      }
      return false;
    },

    setCellProperty(opts: SetCellPropertyOptions) {
      const cell = mustGetCellById(rt, opts.id);
      if (dispatchStarboardEvent(cell, "sb:set_cell_property", opts)) {
        if (opts.value === undefined) {
          delete cell.cell.metadata.properties[opts.property];
        } else {
          cell.cell.metadata.properties[opts.property] = opts.value;
        }
        return true;
      }
      return false;
    },

    resetCell(opts: ResetCellOptions) {
      const cell = mustGetCellById(rt, opts.id);
      if (dispatchStarboardEvent(cell, "sb:remove_cell", opts)) {
        cell.remove();
        notebook.requestUpdate();
        return true;
      }
      return false;
    },

    runCell(opts: RunCellOptions) {
      const cell = mustGetCellById(rt, opts.id);
      if (dispatchStarboardEvent(cell, "sb:run_cell", opts)) {
        cell.run();
        return true;
      }
      return false;
    },

    focusCell(opts: FocusCellOptions) {
      const idx = requireIndexOfCellId(rt.content.cells, opts.id);
      const cellElements = rt.dom.cells;
      const cell = cellElements[idx];

      if (dispatchStarboardEvent(cell, "sb:focus_cell", opts)) {
        if (opts.focusTarget === "previous") {
          window.setTimeout(() => {
            const next = cellElements[idx - 1];
            if (next) next.focusEditor({ position: "end" });
          });
        } else if (opts.focusTarget === "next") {
          window.setTimeout(() => {
            const next = cellElements[idx + 1];
            if (next) {
              next.focusEditor({ position: "start" });
            }
          });
        } else if (opts.focusTarget === undefined) {
          cell.focus({});
        }
        return true;
      }
      return false;
    },

    clearCell(opts: ClearCellOptions) {
      const cell = mustGetCellById(rt, opts.id);
      if (dispatchStarboardEvent(cell, "sb:clear_cell", opts)) {
        cell.clear();
        return true;
      }
      return false;
    },

    save(opts: any) {
      if (dispatchStarboardEvent(rt.dom.notebook, "sb:save", opts)) {
        const couldSave = controls.sendMessage({
          type: "NOTEBOOK_SAVE_REQUEST",
          payload: {
            content: notebookContentToText(rt.content),
          },
        });
        if (!couldSave) {
          console.error("Can't save as parent frame is not listening for messages");
        }
        return true;
      }
      return false;
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
        this.clearCell({ id: c.id });
      }
    },

    sendMessage(message: OutboundNotebookMessage, opts: { targetOrigin?: string } = {}): boolean {
      if (window.parent) {
        window.parent.postMessage(message, opts.targetOrigin ?? "*");
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
     * @deprecated use `runtime.controls` directly instead, this now emits browser events to facilitate canceling.
     * @param event
     */
    emit(event: CellEvent) {
      console.warn(
        "runtime.controls.emit is DEPRECATED since 0.12.0 and will be removed in an upcoming version of Starboard! Please update your plugins."
      );
      if (event.type === "RUN_CELL") {
        controls.runCell(event);
      } else if (event.type === "INSERT_CELL") {
        controls.insertCell(event);
      } else if (event.type === "REMOVE_CELL") {
        controls.removeCell(event);
      } else if (event.type === "CHANGE_CELL_TYPE") {
        controls.changeCellType(event);
      } else if (event.type === "RESET_CELL") {
        controls.resetCell(event);
      } else if (event.type === "FOCUS_CELL") {
        controls.focusCell(event);
      } else if (event.type === "SAVE") {
        controls.save(event);
      } else if (event.type === "MOVE_CELL") {
        controls.moveCell(event);
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
  (window as any).runtime = rt;

  setupCommunicationWithParentFrame(rt);
  registerDefaultPlugins(rt);

  updateIframeWhenSizeChanges(rt);

  return rt;
}
