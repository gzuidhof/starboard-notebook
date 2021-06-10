/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Cell, NotebookContent, Runtime } from "../types";
import { cellToText } from "./serialization";
import { textToNotebookContent } from "./parsing";
import { generateUniqueCellId } from "../components/helpers/random";

/**
 * Finds the given cell index, if not present throws an error
 * @param cells
 * @param id
 * @returns
 */
export function requireIndexOfCellId(cells: Cell[], id?: string) {
  if (id === undefined) {
    return cells.length - 1;
  }
  const idx = cells.findIndex((c) => id === c.id);
  if (idx === -1) {
    throw new Error(`Cell with id ${id} doesn't exist`);
  }
  return idx;
}

/**
 * Returns the ID of the created cell
 */
export function addCellToNotebookContent(
  runtime: Runtime,
  data: Partial<Cell> | undefined,
  position: "notebookEnd" | "before" | "after",
  adjacentCellId?: string
): string {
  if (data === undefined) data = {};
  const nb = runtime.content;
  let idx: number;
  let cellType: string | undefined = data.cellType;

  // Changed in 0.12.0, this is here for backwards compatibility.
  // Feel free to remove after 2021-10-07
  if ((position as string) === "end") {
    position = "notebookEnd";
  }

  if (position === "notebookEnd") {
    idx = nb.cells.length;
    cellType = cellType || (nb.cells.length === 0 ? "markdown" : nb.cells[nb.cells.length - 1].cellType);
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
    metadata: {
      properties: {},
      ...(data.metadata ? data.metadata : {}),
      ...(runtime.config.persistCellIds ? { id } : {}),
    },
    id,
  };
  nb.cells.splice(idx, 0, cell);

  return id;
}

export function removeCellFromNotebookById(nb: NotebookContent, id: string) {
  const idx = requireIndexOfCellId(nb.cells, id);
  nb.cells.splice(idx, 1);
}

/**
 * Returns whether the cell type is different from the previous cell type.
 */
export function changeCellType(nb: NotebookContent, id: string, newCellType: string): boolean {
  const idx = requireIndexOfCellId(nb.cells, id);

  const cellAsString = cellToText(nb.cells[idx]);
  const newCell = textToNotebookContent(cellAsString).cells[0];
  const didChange = newCell.cellType !== newCellType;

  newCell.cellType = newCellType;
  nb.cells.splice(idx, 1, newCell);

  return didChange;
}
