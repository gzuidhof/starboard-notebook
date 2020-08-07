/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { html, render, TemplateResult } from "lit-html";
import { BaseCellHandler} from "./base";
import { getDefaultControlsTemplate, ControlButton } from "../components/controls";
import { unsafeHTML } from "lit-html/directives/unsafe-html";
import { PlayCircleIcon } from "@spectrum-web-components/icons-workflow";
import { StarboardTextEditor } from "../components/textEditor";
import { Cell } from "../types";
import { Runtime, CellElements, CellHandlerAttachParameters } from "../runtime";


export const HTML_CELL_TYPE_DEFINITION = {
    name: "HTML",
    cellType: "html",
    createHandler: (c: Cell, r: Runtime) => new HTMLCellHandler(c, r),
};

export class HTMLCellHandler extends BaseCellHandler {

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
            callback: () => this.runtime.emit({id: this.cell.id, type: "RUN_CELL"}),
        };
        return getDefaultControlsTemplate({ buttons: [runButton] });
    }

    attach(params: CellHandlerAttachParameters) {
        this.elements = params.elements;

        render(this.getControls(), this.elements.topControlsElement);
        this.editor = new StarboardTextEditor(this.cell, {language: "html"}, this.runtime);
        this.elements.topElement.appendChild(this.editor);
    }

    async run() {
        const htmlContent = this.cell.textContent;
        render(html`${unsafeHTML(htmlContent)}`, this.elements.bottomElement);
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
