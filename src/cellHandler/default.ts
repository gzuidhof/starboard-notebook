/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Cell } from "../notebookContent";
import { CellHandler, CellHandlerAttachParameters } from "./base";
import { render, html } from "lit-html";
import { StarboardTextEditor } from "../components/textEditor";

/**
 * The cell handler that gets used when there is an unknown cell type
 */
export class DefaultCellHandler extends CellHandler {
    constructor(cell: Cell) {
        super(cell);
    }

    attach(params: CellHandlerAttachParameters) {
        const ed = new StarboardTextEditor(this.cell, {}, () => {/*Do nothing*/});
        render(html`${ed}`, params.elements.topElement);
    }
}
