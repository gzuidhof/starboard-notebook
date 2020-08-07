/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Runtime, CellEvent } from ".";
import { StarboardNotebook } from "../components/notebook";
import { textToNotebookContent } from "../content/parsing";
import { ConsoleCatcher } from "../console/console";
import { registry } from "../cellHandler/registry";

declare const STARBOARD_NOTEBOOK_VERSION: string;

export function createRuntime(notebook: StarboardNotebook): Runtime {
    return {
        consoleCatcher: new ConsoleCatcher(window.console),
        content: (window as any).initialNotebookContent ? textToNotebookContent((window as any).initialNotebookContent) : { frontMatter: "", cells: [] },
        emit: (event: CellEvent) => {
          if (event.type === "RUN_CELL") {
            notebook.runCell(event.id, !!event.focusNextCell, !!event.insertNewCell);
          } else if (event.type === "INSERT_CELL") {
            notebook.insertCell(event.position, event.id);
          } else if (event.type === "REMOVE_CELL") {
            notebook.removeCell(event.id);
          } else if (event.type === "CHANGE_CELL_TYPE") {
            notebook.changeCellType(event.id, event.newCellType);
          } else if (event.type === "SAVE") {
            notebook.save();
          }
        },
        dom: {
          cells: [],
          notebook,
        },
        cellTypes: registry,
        version: STARBOARD_NOTEBOOK_VERSION,
    };
}
