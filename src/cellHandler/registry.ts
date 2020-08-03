/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { CellHandler } from "./base";
import { DefaultCellHandler } from "./default";
import { MARKDOWN_CELL_TYPE_DEFINITION } from "./markdown";
import { JAVASCRIPT_CELL_TYPE_DEFINITION } from "./javascript/javascript";
import { HTML_CELL_TYPE_DEFINITION } from "./html";
import { CSS_CELL_TYPE_DEFINITION } from "./css";

import { Cell } from "../notebookContent";

export interface CellTypeDefinition {
    createHandler(cell: Cell): CellHandler;

    /**
     * Name for human consumption, e.g. "Javascript"
     */
    name: string;
    cellType: string;
}

const defaultCellTypeDefinition = {
    name: "Unknown",
    cellType: "",
    createHandler: (c: Cell) => new DefaultCellHandler(c),
};

const PLAINTEXT_CELL_TYPE_DEFINITION = {
    name: "Plaintext",
    cellType: "plaintext",
    createHandler: (c: Cell) => new DefaultCellHandler(c),
};

const builtinCellTypes = [
    MARKDOWN_CELL_TYPE_DEFINITION,
    JAVASCRIPT_CELL_TYPE_DEFINITION,
    HTML_CELL_TYPE_DEFINITION,
    CSS_CELL_TYPE_DEFINITION,
    PLAINTEXT_CELL_TYPE_DEFINITION,
];

export const registry = new Map<string, CellTypeDefinition>();
builtinCellTypes.forEach((e) => registry.set(e.cellType, e));

export function getCellTypeDefinitionForCellType(cellType: string): CellTypeDefinition {
    if (registry.has(cellType)) {
        return registry.get(cellType) as CellTypeDefinition;
    } else {
        console.log(`No cell handler found for cell type ${cellType}. Available cell handlers: ${Array.from(registry.keys())}`);
        return {
            ...defaultCellTypeDefinition,
            cellType: cellType,
            name: `Unknown type "${cellType}"`,
        };
    }
}

export function getAvailableCellTypes() {
    return [...registry.values()];
}
