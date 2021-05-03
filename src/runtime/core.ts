/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { textToNotebookContent } from "../content/parsing";
import { CellPropertyDefinition, CellTypeDefinition, Runtime, RegistryEvent } from "../types";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { plugin as pythonPlugin } from "starboard-python/dist/index.js";
import { InboundNotebookMessage } from "../types/messages";
import { notebookContentToText } from "../content/serialization";

/**
 * When new cell types are registered, or overwritten, the corresponding cells should update.
 * For example: if there is a my-language cell present, which is loaded dynamically in the first cell, 
 * subsequent cells should update to this new definition.
 */
export function updateCellsWhenCellDefinitionChanges(runtime: Runtime) {
  const newCellTypeListenerFunction = (e: RegistryEvent<string, CellTypeDefinition>) => {
    if (e.type !== "register") {
      return;
    }
    for (const c of runtime.dom.cells) {
      if (e.key === c.cell.cellType) {
        runtime.controls.emit({ id: c.cell.id, type: "CHANGE_CELL_TYPE", newCellType: c.cell.cellType });
      }
    }
  };

  runtime.definitions.cellTypes.subscribe(newCellTypeListenerFunction);
}

/**
 * When new cell property is registered, or overwritten, the corresponding cells should update.
 */
export function updateCellsWhenPropertyGetsDefined(runtime: Runtime) {
  const newCellPropertyListenerFunction = (e: RegistryEvent<string, CellPropertyDefinition>) => {
    if (e.type !== "register") {
      return;
    }
    for (const c of runtime.dom.cells) {
      if (c.cell.metadata.properties[e.key] !== undefined) {
        // c.requestUpdate("cell", c.cell);
        c.requestUpdate();
      }
    }
  };

  runtime.definitions.cellProperties.subscribe(newCellPropertyListenerFunction);
}

export function setupCommunicationWithParentFrame(runtime: Runtime) {
  let contentHasBeenSetFromParentIframe = false;

  const nb = runtime.dom.notebook;

  window.iFrameResizer = {
    onReady: () => {
      // It is possible that the parent iFrame isn't ready for messages yet, so we try to make contact a few times.+
      let numTries = 0;
      const askForContent = () => {
        if (contentHasBeenSetFromParentIframe || numTries > 15) return;
        runtime.controls.sendMessage({
          type: "NOTEBOOK_READY_SIGNAL",
          payload: {
            communicationFormatVersion: 1,
            content: notebookContentToText(runtime.content),
            runtime: {
              name: runtime.name,
              version: runtime.version,
            }

          }
        });
        numTries++;
        setTimeout(() => askForContent(), numTries * 100);
      };
      askForContent();
    },
    onMessage: (msg: InboundNotebookMessage) => {
      if (msg.type === "NOTEBOOK_SET_INIT_DATA") {
        if (contentHasBeenSetFromParentIframe) return; // be idempotent
        runtime.content = textToNotebookContent(msg.payload.content);
        contentHasBeenSetFromParentIframe = true;
        nb.hasHadInitialRun = false;
        nb.notebookInitialize();
        nb.performUpdate();

        if (msg.payload.baseUrl !== undefined) {
          const baseEl = document.querySelector("base");
          if (baseEl) {
            baseEl.href = msg.payload.baseUrl;
          } else {
            console.error("Could not set base URL as no base element is present");
          }
        }
      } else if (msg.type === "NOTEBOOK_RELOAD_PAGE") {
        window.location.reload();
      } else if (msg.type === "NOTEBOOK_SET_METADATA") {
        runtime.content.metadata = msg.payload.metadata;
      }
    }
  };
}

export async function registerDefaultPlugins(runtime: Runtime) {
    await runtime.controls.registerPlugin(pythonPlugin);
}

export function setupGlobalKeybindings(runtime: Runtime) {
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.code === "KeyS" && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
      e.preventDefault();
      runtime.controls.save();
    }
  }, false);
}