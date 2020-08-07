/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { uuid } from 'uuidv4';
import { Cell, NotebookContent } from '../runtime/types';
import { cellToText } from './serialization';
import { textToNotebookContent } from './parsing';

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