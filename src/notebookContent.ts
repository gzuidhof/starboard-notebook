/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { uuid } from 'uuidv4';
import { parseNotebookContent } from "./parser";

export interface Cell {
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

export interface NotebookContent {
    /**
     * Text before the first cell
     */
    frontMatter: string;
    cells: Cell[];
}

export function textToNotebookContent(text: string) {
    const {cells: parsedCells, frontMatter} = parseNotebookContent(text);

    const cells: Cell[] = parsedCells.map((pc) => {

        // All properties right now are just boolean flags that are undefined by default
        const properties: {[k: string]: true} = {};
        pc.properties.forEach((k) => properties[k] = true);

        return {
            cellType: pc.type,
            textContent: pc.lines.join("\n"),
            properties: properties,
            id: uuid(),
        };
    });

    const nbContent: NotebookContent = {
        frontMatter,
        cells,
    };
    return nbContent;
}

export function notebookContentToText(nb: NotebookContent) {
    return nb.frontMatter + nb.cells.map(cellToText).join("\n");
}

export function cellToText(cell: Cell) {
    // Right now all properties are binary flags, in the future we might have to do something smarter.
    const cellHeaderString = ['%%', cell.cellType, ...Object.getOwnPropertyNames(cell.properties)].filter((t) => t !== "").join(" ");

    const cellText = `${cellHeaderString}\n${cell.textContent}`;
    return cellText;
}

function requireIndexOfCellId(cells: Cell[], id?: string) {
    if (id === undefined) {
        return cells.length-1;
    }
    const idx = cells.findIndex((c) => (id === c.id));
    if (idx === -1) {
        throw new Error(`Cell with id ${id} doesn't exist`);
    }
    return idx;
}

export function addCellToNotebookContent(nb: NotebookContent, position: "end" | "before" | "after", adjacentCellId?: string, id?: string) {
    let idx: number;
    let cellType: string;

    if (position === "end") {
        idx = nb.cells.length;
        cellType = nb.cells.length === 0 ? "js": nb.cells[nb.cells.length-1].cellType;
    } else {
        idx = requireIndexOfCellId(nb.cells, adjacentCellId);
        cellType = idx === 0 && adjacentCellId === undefined ? "js" : nb.cells[idx].cellType;
    }

    if (position === "after") {
        idx += 1;
    }
    const cell: Cell = {
            cellType,
            textContent: "",
            properties: {},
            id: (id || uuid()),
    };
    nb.cells.splice(idx, 0, cell);
}

export function removeCellFromNotebookById(nb: NotebookContent, id: string) {
    const idx = requireIndexOfCellId(nb.cells, id);
    nb.cells.splice(idx, 1);
}

export function changeCellType(nb: NotebookContent, id: string, newCellType: string) {
    const idx = requireIndexOfCellId(nb.cells, id);
    
    const cellAsString = cellToText(nb.cells[idx]);
    const newCell = textToNotebookContent(cellAsString).cells[0];
    newCell.cellType = newCellType;
    nb.cells.splice(idx, 1, newCell);
}

export function toggleCellFlagProperty(cell: Cell, propertyName: string) {
    if (cell.properties[propertyName]) {
        delete cell.properties[propertyName];
    } else {
        cell.properties[propertyName] = true;
    }
}