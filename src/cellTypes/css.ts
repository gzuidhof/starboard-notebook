/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { html, render, TemplateResult } from "lit-html";
import { BaseCellHandler } from "./base";
import { cellControlsTemplate } from "../components/controls";
import { unsafeHTML } from "lit-html/directives/unsafe-html";
import { PlayCircleIcon } from "@spectrum-web-components/icons-workflow";
import { StarboardTextEditor } from "../components/textEditor";
import { Cell } from "../types";
import { Runtime, CellElements, CellHandlerAttachParameters, ControlButton } from "../runtime";

export const CSS_CELL_TYPE_DEFINITION = {
    name: "CSS",
    cellType: "css",
    createHandler: (c: Cell, r: Runtime) => new CSSCellHandler(c, r),
};

export class CSSCellHandler extends BaseCellHandler {

    private elements!: CellElements;
    private editor: any;

    constructor(cell: Cell, runtime: Runtime) {
        super(cell, runtime);
    }

    private getControls(): TemplateResult {
        const icon = PlayCircleIcon;
        const tooltip = "Run Cell";
        const runButton: ControlButton = {
            icon,
            tooltip,
            callback: () => this.runtime.emit({ id: this.cell.id, type: "RUN_CELL" }),
        };
        return cellControlsTemplate({ buttons: [runButton] });
    }

    attach(params: CellHandlerAttachParameters) {
        this.elements = params.elements;

        render(this.getControls(), this.elements.topControlsElement);
        this.editor = new StarboardTextEditor(this.cell, {language: "css"}, this.runtime);
        this.elements.topElement.appendChild(this.editor);
    }

    async run() {
        const content = this.cell.textContent;
        render(html`${unsafeHTML("<style>" + content + "</style>")}`, this.elements.bottomElement);
    }

    focusEditor() {
        if (this.editor) {
            this.editor.focus();
        }
    }

    async dispose() {
        if (this.editor) {
            this.editor.dispose();
        }
    }
}
