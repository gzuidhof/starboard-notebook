/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { CellEvent, NotebookContent, CellTypeDefinition } from "../types";
import { ConsoleCatcher } from "../console/console";
import { CellElement } from "../components/cell";
import { StarboardNotebookElement } from "../components/notebook";

export * from "../types";

/**
 * Runtime is the main state/store for a notebook.
 */
export interface Runtime {

    /**
     * The state of the notebook that exactly describes the text in the notebook.
     */
    content: NotebookContent;


    /**
     * Map of registered cell types, indexed by cellType (e.g. "js").
     */
    cellTypes: Map<string, CellTypeDefinition>;

    /**
     * Contains HTML elements in this notebook runtime.
     */
    dom: {
        notebook: StarboardNotebookElement;
        cells: CellElement[];
    };

    /**
     * Used to coordinate listening to the console hook.
     */
    consoleCatcher: ConsoleCatcher;

    /**
     * Version of Starboard Notebook
     */
    version: string;


    /**
     * Event bus for a notebook, used to propagate messages upwards such as "focus on the next cell".
     */
    emit: (e: CellEvent) => void;

    insertCell(position: "end" | "before" | "after", adjacentCellId?: string): void;
    removeCell(id: string): void;
    changeCellType(id: string, newCellType: string): void;
    runCell(id: string, focusNext: boolean, insertNewCell: boolean): void;
    runAllCells(opts: {onlyRunOnLoad?: boolean}): Promise<void>;

    /** Requests a save operation in the parent iframe */
    save(): void;

    /** To be called to indicate that the notebook content has changed */
    contentChanged(): void;
}
