/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Cell, NotebookContent } from "../types";
import * as YAML from "js-yaml";

const PreferredCellDelimiter = "# %%";

function objectIsEmpty(obj: any) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

export function notebookContentToText(nb: NotebookContent) {
  const cellsAsText = nb.cells.map(cellToText).join("\n");

  if (!objectIsEmpty(nb.metadata)) {
    const ymlHeader = YAML.dump(nb.metadata);
    return `---\n${ymlHeader}---\n${cellsAsText}`;
  }

  return cellsAsText;
}

export function cellToText(cell: Cell) {
  let cellHeader;

  if (objectIsEmpty(cell.metadata.properties) && Object.keys(cell.metadata).length === 1) {
    // The cell metadata is empty
    cellHeader = `${PreferredCellDelimiter} [${cell.cellType}]`;
  } else {
    let ymlCellMetadata = YAML.dump(cell.metadata);
    // Add a comment marker to each of the lines.
    // The last line contains a trailing \n, which we slice off
    ymlCellMetadata = ymlCellMetadata
      .split("\n")
      .slice(0, -1)
      .map((s) => PreferredCellDelimiter.replace("%%", "") + s)
      .join("\n");

    cellHeader = `${PreferredCellDelimiter}--- [${cell.cellType}]\n${ymlCellMetadata}\n${PreferredCellDelimiter.replace(
      "%%",
      "---%%"
    )}`;
  }
  const cellText = `${cellHeader}\n${cell.textContent}`;
  return cellText;
}
