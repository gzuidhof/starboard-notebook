/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Events that can be sent from the cell for central handling in the notebook component.
 */
export type CellEvent =
    { id: string; type: "RUN_CELL"; focusNextCell?: boolean; insertNewCell?: boolean }
    | { id: string; type: "INSERT_CELL"; position: "before" | "after" }
    | { id: string; type: "REMOVE_CELL" }
    | { id: string; type: "CHANGE_CELL_TYPE"; newCellType: string }
    | { type: "SAVE" };

/**
 * The backing data for a cell, can be JSON serialized or converted to a notebook string.
 */
export interface Cell {
    /**
     * A short identifier such as "js" or "md" for Javascript and Markdown respectively.
     */
    cellType: string;

    textContent: string;

    properties: {
        runOnLoad?: true;
        collapsed?: true;
        [key: string]: any;
    };

    /**
     * Every cell has a unique ID, this is not persisted between runs.
     */
    id: string;
}

/**
 * The entire state of a notebook that is to be persisted.
 */
export interface NotebookContent {
    /**
     * Text before the first cell
     */
    frontMatter: string;
    cells: Cell[];
}
