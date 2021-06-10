/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { textToNotebookContent } from "../content/parsing";
import { CellPropertyDefinition, CellTypeDefinition, RegistryEvent, Runtime } from "../types";

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
        runtime.controls.changeCellType({ id: c.cell.id, newCellType: c.cell.cellType });
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

  // It is possible that the parent iFrame isn't ready for messages yet, so we try to make contact a few times.
  let numTries = 0;
  const askForContent = () => {
    if (contentHasBeenSetFromParentIframe || numTries > 1000) return;
    runtime.controls.sendMessage({
      type: "NOTEBOOK_READY_SIGNAL",
      payload: {
        communicationFormatVersion: 1,
        content: notebookContentToText(runtime.content),
        runtime: {
          name: runtime.name,
          version: runtime.version,
        },
      },
    });
    numTries++;
    setTimeout(() => askForContent(), 60);
  };
  askForContent();

  window.addEventListener(
    "message",
    (event) => {
      if (event.data) {
        const msg = event.data as InboundNotebookMessage;
        switch (msg.type) {
          case "NOTEBOOK_SET_INIT_DATA": {
            if (contentHasBeenSetFromParentIframe) return; // be idempotent
            runtime.content = textToNotebookContent(msg.payload.content);
            contentHasBeenSetFromParentIframe = true;
            nb.hasHadInitialRun = false;
            nb.notebookInitialize();
            nb.requestUpdate();

            if (msg.payload.baseUrl !== undefined) {
              const baseEl = document.querySelector("base");
              if (baseEl) {
                baseEl.href = msg.payload.baseUrl;
              } else {
                console.error("Could not set base URL as no base element is present");
              }
            }
            break;
          }
          case "NOTEBOOK_RELOAD_PAGE": {
            window.location.reload();
            break;
          }
          case "NOTEBOOK_SET_METADATA": {
            runtime.content.metadata = msg.payload.metadata;
            break;
          }
        }
      }
    },
    false
  );
}

export function updateIframeWhenSizeChanges(runtime: Runtime) {
  try {
    const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      let height = 0;
      let width = 0;

      for (const entry of entries) {
        if (Array.isArray(entry.borderBoxSize)) {
          for (const boxSize of entry.borderBoxSize) {
            height = Math.max(height, boxSize.blockSize);
            width = Math.max(width, boxSize.inlineSize);
          }
        } else if (entry.borderBoxSize) {
          const size = (entry.borderBoxSize as any) as ResizeObserverSize;
          height = Math.max(height, size.blockSize);
          width = Math.max(width, size.inlineSize);
        }
      }

      if (width != 0 && height != 0) {
        runtime.controls.sendMessage({
          type: "NOTEBOOK_RESIZE_REQUEST",
          payload: {
            width,
            height,
          },
        });
      }
    });

    observer.observe(document.body, { box: "border-box" });
  } catch (e) {
    console.warn(
      "ResizeObserver is not supported in this browser, the iframe will not resize automatically to display some larger-than-iframe elements."
    );
    // "Graceful" degradation
    runtime.controls.sendMessage({
      type: "NOTEBOOK_RESIZE_REQUEST",
      payload: {
        width: 768,
        height: 768,
      },
    });
  }
}

export async function registerDefaultPlugins(runtime: Runtime) {
  await runtime.controls.registerPlugin(pythonPlugin);
}

export function setupGlobalKeybindings(runtime: Runtime) {
  document.addEventListener(
    "keydown",
    (e: KeyboardEvent) => {
      if (e.code === "KeyS" && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
        e.preventDefault();
        runtime.controls.save({});
      }
    },
    false
  );
}
