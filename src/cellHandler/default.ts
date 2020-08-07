/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { BaseCellHandler } from "./base";
import { render, html } from "lit-html";
import { StarboardTextEditor } from "../components/textEditor";
import { Cell } from "../types";
import { Runtime, CellHandlerAttachParameters } from "../runtime";

export const DEFAULT_CELL_TYPE_DEFINITION = {
    name: "Unknown",
    cellType: "",
    createHandler: (c: Cell, r: Runtime) => new DefaultCellHandler(c, r),
};

/**
 * The cell handler that gets used when there is an unknown cell type
 */
export class DefaultCellHandler extends BaseCellHandler {
    constructor(cell: Cell, runtime: Runtime) {
        super(cell, runtime);
    }

    attach(params: CellHandlerAttachParameters) {
        const ed = new StarboardTextEditor(this.cell, {}, this.runtime);
        render(html`${ed}`, params.elements.topElement);
    }
}
