/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { render, TemplateResult } from "lit-html";
import mdlib from "markdown-it";

import { hookMarkdownItToHighlight } from "../components/helpers/highlight";
import { CellHandler, CellHandlerAttachParameters, CellElements } from "./base";
import { getDefaultControlsTemplate, ControlButton } from "../components/controls";
import { TextEditIcon, PlayCircleIcon } from "@spectrum-web-components/icons-workflow";
import { StarboardTextEditor } from "../components/textEditor";
import { CellEvent, Cell } from "../runtime/types";
import { Runtime } from "../runtime";

const md = new mdlib();
hookMarkdownItToHighlight(md);

export const MARKDOWN_CELL_TYPE_DEFINITION = {
    name: "Markdown",
    cellType: "md",
    createHandler: (c: Cell, r: Runtime) => new MarkdownCellHandler(c, r),
};

export class MarkdownCellHandler extends CellHandler {
    private isInEditMode = true;

    private elements!: CellElements;
    private emit!: (event: CellEvent) => void;
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
                callback: () => this.emit({id: this.cell.id, type: "RUN_CELL"}),
            };
        } else {
            editOrRunButton = {
                icon: TextEditIcon,
                tooltip: "Edit Markdown",
                callback: () => this.enterEditMode(),
            };
        }
        
        return getDefaultControlsTemplate({ buttons: [editOrRunButton] });
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
        this.editor = new StarboardTextEditor(this.cell, {language: "markdown", wordWrap: "on"}, this.runtime);
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
