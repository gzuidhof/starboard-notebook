/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Cell, NotebookContent } from "../runtime/types";

export function notebookContentToText(nb: NotebookContent) {
    return nb.frontMatter + nb.cells.map(cellToText).join("\n");
}

export function cellToText(cell: Cell) {
    // Right now all properties are binary flags, in the future we might have to do something smarter.
    const cellHeaderString = ['%%', cell.cellType, ...Object.getOwnPropertyNames(cell.properties)].filter((t) => t !== "").join(" ");

    const cellText = `${cellHeaderString}\n${cell.textContent}`;
    return cellText;
}