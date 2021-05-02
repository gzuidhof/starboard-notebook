/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Cell, NotebookContent, Runtime } from '../types';
import { cellToText } from './serialization';
import { textToNotebookContent } from './parsing';
import { generateUniqueCellId } from '../components/helpers/random';

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

/**
 * Returns the ID of the created cell
 */
export function addCellToNotebookContent(runtime: Runtime, data: Partial<Cell>, position: "end" | "before" | "after", adjacentCellId?: string): string {
    const nb = runtime.content;
    let idx: number;
    let cellType: string | undefined = data.cellType;

    if (position === "end") {
        idx = nb.cells.length;
        cellType = cellType || (nb.cells.length === 0 ? "markdown": nb.cells[nb.cells.length-1].cellType);
    } else {
        idx = requireIndexOfCellId(nb.cells, adjacentCellId);
        cellType = cellType || (idx === 0 && adjacentCellId === undefined ? "markdown" : nb.cells[idx].cellType);
    }

    if (position === "after") {
        idx += 1;
    }

    const id = data.id || generateUniqueCellId();
    const cell: Cell = {
            cellType,
            textContent: "",
            metadata: {properties: {}, ...(data.metadata ? data.metadata : {}), ...(runtime.config.persistCellIds ? {id} : {})},
            id,
    };
    nb.cells.splice(idx, 0, cell);

    return id;
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

export function toggleCellFlagProperty(cell: Cell, propertyName: string, force?: boolean) {
    if (cell.metadata.properties[propertyName] || force === false) {
        delete cell.metadata.properties[propertyName];
    } else {
        cell.metadata.properties[propertyName] = true;
    }
}
