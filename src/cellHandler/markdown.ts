import { render, TemplateResult } from "lit-html";
import { Cell } from "../notebookContent";
import * as mdlib from "markdown-it";
import { highlight } from "../highlight";
import { CellHandler, CellHandlerAttachParameters, CellElements } from "./base";
import { getDefaultControlsTemplate, ControlButton } from "../components/controls";
import { createMonacoEditor } from "../editor/monaco";
import { CellEvent } from "../components/cell";
import { TextEditIcon, PlayCircleIcon } from "@spectrum-web-components/icons-workflow";

const md = (mdlib as any)({
    highlight: function (str:string, lang:string) {
        if (lang && highlight.getLanguage(lang)) {
          try {
            return highlight(lang, str).value;
          } catch (__) {/*Do nothing*/}
        }

        return ''; // use external default escaping
    }
});


export const MARKDOWN_CELL_TYPE_DEFINITION = {
    name: "Markdown",
    cellType: "markdown",
    createHandler: (c: Cell) => new MarkdownCellHandler(c),
    icon: "fab fa-markdown"
};


export class MarkdownCellHandler extends CellHandler {
    private isInEditMode = true;

    private elements!: CellElements;
    private emit!: (event: CellEvent) => void;
    private editor: any;

    constructor(cell: Cell) {
        super(cell);
    }

    private getControls(): TemplateResult {
        let editOrRunButton: ControlButton;
        if (this.isInEditMode) {
            editOrRunButton = {
                icon: PlayCircleIcon,
                tooltip: "Render as HTML",
                callback: () => this.emit({type: "RUN_CELL"}),
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
        this.emit = params.emit;

        if (this.cell.textContent !== "") {
            this.run();
        } else { // When creating an empty cell, it makes more sense to start in editor mode
            this.enterEditMode();
        }
    }

    private setupEditor() {
        const topElement = this.elements.topElement;
        topElement.innerHTML = "";
        topElement.classList.add("cell-editor");
        this.editor = createMonacoEditor(topElement, this.cell, {language: "markdown", wordWrap: "on"}, this.emit);
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
        const wrapped = `<div class="markdown-body" style="margin: 0px 10px">${htmlContent}</div>`;
        topElement.classList.remove("cell-editor");
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
