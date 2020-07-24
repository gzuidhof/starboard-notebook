/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { LitElement, html, property, customElement, query } from 'lit-element';
import { Cell } from '../notebookContent';

import { CellHandler } from '../cellHandler/base';
import { CellTypeDefinition, getCellTypeDefinitionForCellType, getAvailableCellTypes } from '../cellHandler/registry';
import { Runtime } from '../run';

import { AssetsAddedIcon, DeleteIcon } from "@spectrum-web-components/icons-workflow";

export type CellEvent =
    { id?: string; type: "RUN_CELL"; focusNextCell?: boolean; insertNewCell?: boolean }
    | { id?: string; type: "INSERT_CELL"; position: "before" | "after" }
    | { id?: string; type: "REMOVE_CELL" }
    | { id?: string; type: "CHANGE_CELL_TYPE"; newCellType: string }
    | { id?: string; type: "SAVE" };


@customElement('starboard-cell')
export class CellElement extends LitElement {

    @query('.cell-top')
    private topElement!: HTMLElement;
    @query('.cell-controls-left-top')
    private topControlsElement!: HTMLElement;
    @query('.cell-bottom')
    private bottomElement!: HTMLElement;
    @query('.cell-controls-left-bottom')
    private bottomControlsElement!: HTMLElement;

    @query('.cell-type-popover')
    private cellTypePickerElement!: HTMLElement;

    private cellTypeDefinition!: CellTypeDefinition;
    private cellHandler!: CellHandler;

    @property({ type: Object })
    public cell: Cell;

    @property({ attribute: false})
    private runtime: Runtime;

    @property()
    private eventListener: (event: CellEvent) => void;

    constructor(
        cell: Cell,
        runtime: Runtime,
        eventListener: (event: CellEvent) => void) {
        super();
        this.cell = cell;
        this.runtime = runtime;
        this.eventListener = eventListener;
        this.setAttribute("tabindex", "0");
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        this.cellTypeDefinition = getCellTypeDefinitionForCellType(this.cell.cellType);
        this.cellHandler = this.cellTypeDefinition.createHandler(this.cell);
    }

    firstUpdated(changedProperties: any) {
        super.firstUpdated(changedProperties);
        this.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                if (event.ctrlKey) {
                    this.emit({ type: "RUN_CELL", focusNextCell: false, insertNewCell: false });
                } else if (event.shiftKey) {
                    this.emit({ type: "RUN_CELL", focusNextCell: true, insertNewCell: false });
                } else if (event.altKey) {
                    this.emit({ type: "RUN_CELL", focusNextCell: true, insertNewCell: true });
                }
            }
        });

        this.cellHandler.attach({
            runtime: this.runtime,
            elements: {
                topElement: this.topElement,
                topControlsElement: this.topControlsElement,
                bottomElement: this.bottomElement,
                bottomControlsElement: this.bottomControlsElement
            },
            emit: (e: CellEvent) => this.emit(e),
        });
    }

    private emit(event: CellEvent) {
        this.eventListener(event);
    }

    public run() {
        this.cellHandler.run();
    }

    public focusEditor() {
        this.focus();
        this.cellHandler.focusEditor();
    }

    changeCellType(newCellType: string) {
        this.emit({
            type: "CHANGE_CELL_TYPE", newCellType: newCellType,
        });
    }

    render() {
        return html`
        <style>
            .cell-popover-root {
                position: relative
            }
            .cell-popover {
                position: absolute;
                top: calc(100% + 4px);
                right: 0;
                background-color: #fff;
                z-index: 10;
                box-shadow: 0 0 2px 1px #0000001a;
                padding: 6px;
                font-size: 0.75rem;
                text-align: initial;
                min-width: 180px;
                flex-direction: column;
                color: #555;
                display: none;
            }

            .cell-popover.popover-active {
                display: flex;
            }

            .cell-popover-close-button {
                position: absolute;
                top: 6px;
                right: 6px;
            }

            .cell-popover-selection-button {
                background-color: #fdfdfd;
                border: 0;
                text-align: initial;
                padding: 4px 0;
                cursor: pointer;
            }
            .cell-popover-selection-button:hover {
                background-color: #f2f2f2;
            }

</style>
        <div class="cell-container">
            <div class="cell-controls cell-controls-corner"></div>
            <div class="cell-controls cell-controls-above">
                <div class="cell-popover-root">
                    <button title="Change Cell Type" class="cell-controls-button cell-controls-button-language" @click=${() => this.cellTypePickerElement?.classList.toggle("popover-active")}>${this.cell.cellType}</button>
                    <div class="cell-popover cell-type-popover">
                        <b style="margin-bottom: 6px">Change Cell Type</b>

                        ${getAvailableCellTypes().map((ct) => html`
                        <button class="cell-popover-selection-button" @click=${() => this.changeCellType(ct.cellType)} >${ct.name} <span style="opacity: 0.6; float:right; font-size: 11px; font-family: monospace">${ct.cellType}</span></button>
                        `)
                        }

                        <button class="cell-controls-button cell-popover-close-button" @click=${() => this.cellTypePickerElement?.classList.toggle("popover-active")}>Cancel</button>

                        
                    </div>
                </div>
                <button @click="${() => this.emit({ type: "REMOVE_CELL" })}" class="cell-controls-button" title="Remove Cell">
                    ${DeleteIcon({ width: 18, height: 18 })}
                </button>
                <button @click="${() => this.emit({ type: "INSERT_CELL", position: "before" })}" class="cell-controls-button" title="Add Cell Here">
                    ${AssetsAddedIcon({ width: 20, height: 20 })}
                </button>
            </div>

            <div class="cell-controls cell-controls-left cell-controls-left-top"></div>
            <div class="cell-top"></div>
            <div class="cell-controls cell-controls-left cell-controls-left-bottom"></div>
            <div class="cell-bottom"></div>
        </div>
    `;
    }

}