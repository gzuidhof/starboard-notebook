/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { render, TemplateResult } from "lit-html";
import mdlib from "markdown-it";

import { hookMarkdownItToPrismHighlighter } from "../components/helpers/highlight";
import { BaseCellHandler } from "./base";
import { cellControlsTemplate } from "../components/controls";
import { TextEditIcon, PlayCircleIcon } from "@spectrum-web-components/icons-workflow";
import { StarboardTextEditor } from "../components/textEditor";
import { CellEvent, Cell } from "../types";
import { Runtime, CellElements, CellHandlerAttachParameters, ControlButton } from "../runtime";

const md = new mdlib();
hookMarkdownItToPrismHighlighter(md);

export const MARKDOWN_CELL_TYPE_DEFINITION = {
    name: "Markdown",
    cellType: "md",
    createHandler: (c: Cell, r: Runtime) => new MarkdownCellHandler(c, r),
};

export class MarkdownCellHandler extends BaseCellHandler {
    private isInEditMode = true;

    private elements!: CellElements;
    private editor: any;

    constructor(cell: Cell, runtime: Runtime) {
        super(cell, runtime);
    }

    private getControls(): TemplateResult {
        let editOrRunButton: ControlButton;
        if (this.isInEditMode) {
            editOrRunButton = {
                icon: PlayCircleIcon,
                tooltip: "Render as HTML",
                callback: () => this.runtime.controls.emit({id: this.cell.id, type: "RUN_CELL"}),
            };
        } else {
            editOrRunButton = {
                icon: TextEditIcon,
                tooltip: "Edit Markdown",
                callback: () => this.enterEditMode(),
            };
        }
        
        return cellControlsTemplate({ buttons: [editOrRunButton] });
    }

    attach(params: CellHandlerAttachParameters) {
        this.elements = params.elements;

        if (this.cell.textContent !== "") {
            this.run();
        } else { // When creating an empty cell, it makes more sense to start in editor mode
            this.enterEditMode();
        }
    }

    private setupEditor() {
        const topElement = this.elements.topElement;
        topElement.innerHTML = "";
        this.editor = new StarboardTextEditor(this.cell, this.runtime, {language: "markdown", wordWrap: "on"});
        topElement.appendChild(this.editor);
    }

    enterEditMode() {
        this.isInEditMode = true;
        this.setupEditor();
        render(this.getControls(), this.elements.topControlsElement);
    }

    async run() {
        const topElement = this.elements.topElement;

        if (this.editor !== undefined) {
            this.editor.dispose();
            delete this.editor;
        }

        const htmlContent = md.render(this.cell.textContent);
        const wrapped = `<div class="markdown-body">${htmlContent}</div>`;
        topElement.innerHTML = wrapped;
        topElement.children[0].addEventListener("dblclick", (_event: any) => this.enterEditMode());
        this.isInEditMode = false;
        render(this.getControls(), this.elements.topControlsElement);
    }

    async dispose() {
        if (this.editor) {
            this.editor.dispose();
        }
    }

    focusEditor() {
        if (this.editor) {
            this.editor.focus();
        }
    }
}
