/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { html, render, TemplateResult } from "lit-html";
import { Cell } from "../notebookContent";
import { CellHandler, CellHandlerAttachParameters, CellElements } from "./base";
import { getDefaultControlsTemplate, ControlButton } from "../components/controls";
import { Runtime } from "../run";
import { CellEvent } from "../components/cell";
import { isProbablyTemplateResult } from "../util";
import { PlayCircleIcon } from "@spectrum-web-components/icons-workflow";

import { ConsoleOutputElement } from "../components/consoleOutput";
import {StarboardTextEditor} from '../components/textEditor';

export const JAVASCRIPT_CELL_TYPE_DEFINITION = {
    name: "Javascript",
    cellType: "js",
    createHandler: (c: Cell) => new JavascriptCellHandler(c),
};


export class JavascriptCellHandler extends CellHandler {
    private elements!: CellElements;

    private editor!: StarboardTextEditor;
    private runtime!: Runtime;
    private emit!: (event: CellEvent) => void;

    private outputElement?: {logs: any};

    constructor(cell: Cell) {
        super(cell);
        
    }

    private getControls(): TemplateResult {
        const icon = PlayCircleIcon;
        const tooltip = "Run Cell";
        const runButton: ControlButton = {
            icon,
            tooltip,
            callback: () => this.emit({type: "RUN_CELL"}),
        };
        return getDefaultControlsTemplate({ buttons: [runButton] });
    }

    attach(params: CellHandlerAttachParameters) {
        this.elements = params.elements;
        this.runtime = params.runtime;
        this.emit = params.emit;
        

        const topElement = this.elements.topElement;
        render(this.getControls(), this.elements.topControlsElement);
        this.editor = new StarboardTextEditor(this.cell, {language: "javascript"}, this.emit);
        topElement.appendChild(this.editor);
    }

    async run() {
        this.outputElement = new ConsoleOutputElement();
        this.outputElement.logs = [];

        const htmlOutput = document.createElement("div");

        render(html`${this.outputElement}${htmlOutput}`, this.elements.bottomElement);

        const output: {method: string; data: any[]}[] = [];
        this.outputElement.logs = [];

        // For deduplication, limits the updates to only one per animation frame.
        let hasUpdateScheduled = false;

        const callback = (msg: any) => {
            output.push(msg); 
            if (!hasUpdateScheduled) {
                window.setTimeout(() => {
                    if (this.outputElement) {
                        this.outputElement.logs = [...output];
                    }
                    hasUpdateScheduled = true;
                });
            }
        };

        this.runtime.consoleCatcher.hook(callback);
        const outVal = await this.runtime.run(this.cell.textContent);

        window.setTimeout(() => 
            this.runtime.consoleCatcher.unhook(callback)
        );
        
        const val = outVal.value;
        if (val && !val.propertyIsEnumerable && !Object.isExtensible(val)) {
            output.push({
                method: "result",
                data: ["Is this a module?", Object.assign({}, val),]
            });
        } else if (val instanceof HTMLElement) {
            // console.log("Val is HTML el");
            htmlOutput.appendChild(val);  
        } else if (isProbablyTemplateResult(val)) {
            // console.log("Val is TemplateResult");
            render(html`${val}`, htmlOutput);
        } else {
            // console.log(val, val instanceof TemplateResult);
            if (val !== undefined) { // Don't show undefined output
                if (outVal.error) {
                    output.push({
                        method: "error",
                        data: [val.stack.split("at eval")[0].trimEnd()]
                    });

                } else {
                    output.push({
                        method: "result",
                        data: [val]
                    });
                }
            }
        }
        this.outputElement.logs = output;
    }

    focusEditor() {
        this.editor.focus();
    }

    async dispose() {
        this.editor.remove();
    }
}
