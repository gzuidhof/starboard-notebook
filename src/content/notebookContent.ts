/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Cell, NotebookContent } from '../types';
import { cellToText } from './serialization';
import { textToNotebookContent } from './parsing';
import { generateUniqueCellId } from '../components/helpers/random';
import { Runtime } from '../runtime';

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

export function addCellToNotebookContent(runtime: Runtime, nb: NotebookContent, position: "end" | "before" | "after", adjacentCellId?: string, id?: string) {
    let idx: number;
    let cellType: string;

    if (position === "end") {
        idx = nb.cells.length;
        cellType = nb.cells.length === 0 ? "markdown": nb.cells[nb.cells.length-1].cellType;
    } else {
        idx = requireIndexOfCellId(nb.cells, adjacentCellId);
        cellType = idx === 0 && adjacentCellId === undefined ? "markdown" : nb.cells[idx].cellType;
    }

    if (position === "after") {
        idx += 1;
    }
    id = id || generateUniqueCellId();
    const cell: Cell = {
            cellType,
            textContent: "",
            metadata: {properties: {}, ...(runtime.config.persistCellIds ? {id} : {})},
            id,
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
    if (cell.metadata.properties[propertyName]) {
        delete cell.metadata.properties[propertyName];
    } else {
        cell.metadata.properties[propertyName] = true;
    }
}
