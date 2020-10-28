/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { BaseCellHandler } from "./base";
import { render, html } from "lit-html";
import { StarboardTextEditor } from "../components/textEditor";
import { Cell } from "../types";
import { Runtime, CellHandlerAttachParameters, CellTypeDefinition } from "../runtime";
import { RegistryEvent } from "../runtime/registry";

export const DEFAULT_CELL_TYPE_DEFINITION = {
    name: "Unknown",
    cellType: "",
    createHandler: (c: Cell, r: Runtime) => new DefaultCellHandler(c, r),
};

/**
 * The cell handler that gets used when there is an unknown cell type
 */
export class DefaultCellHandler extends BaseCellHandler {

    private newCellTypeListenerFunction: (e: RegistryEvent<string, CellTypeDefinition>) => void;

    constructor(cell: Cell, runtime: Runtime) {
        super(cell, runtime);
        
        // This listens for new cell types being registered. When a matching cell type is registered
        // this cell is no longer a "unknown" cell type and should be swapped out.
        this.newCellTypeListenerFunction = (e: RegistryEvent<string, CellTypeDefinition>) => {
            if (e.type !== "register") {
                return;
            }
            if (e.key === this.cell.cellType) {
                this.runtime.controls.emit({id: this.cell.id, type: "CHANGE_CELL_TYPE", newCellType: this.cell.cellType});
            }
        };
        runtime.definitions.cellTypes.subscribe(this.newCellTypeListenerFunction);
    }

    attach(params: CellHandlerAttachParameters) {
        const ed = new StarboardTextEditor(this.cell, this.runtime);
        render(html`${ed}`, params.elements.topElement);
    }

    async dispose() {
        this.runtime.definitions.cellTypes.unsubscribe(this.newCellTypeListenerFunction);
    }
}
