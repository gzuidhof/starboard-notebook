/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { LitElement, html, property, customElement, query } from 'lit-element';
import { toggleCellFlagProperty } from '../content/notebookContent';

import { BaseCellHandler } from '../cellTypes/base';
import { getCellTypeDefinitionForCellType, getAvailableCellTypes } from '../cellTypes/registry';

import { AssetsAddedIcon, DeleteIcon, BooleanIcon, ClockIcon, PlayCircleIcon } from "@spectrum-web-components/icons-workflow";
import { getPropertiesIcons, getPropertiesPopoverIcons } from './controls';
import { Cell } from '../types';
import { Runtime, CellTypeDefinition } from '../runtime';
import "./insertionLine";

import Dropdown from "bootstrap/js/dist/dropdown";


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

    public cellTypeDefinition!: CellTypeDefinition;
    public cellHandler!: BaseCellHandler;

    @property({ type: Object })
    public cell: Cell;

    private isCurrentlyRunning = false;

    @property({attribute: false})
    public runtime: Runtime;

    constructor(
        cell: Cell,
        runtime: Runtime
    ) {
        super();
        this.cell = cell;
        this.id = this.cell.id;
        this.runtime = runtime;
        this.setAttribute("tabindex", "0");
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        this.cellTypeDefinition = getCellTypeDefinitionForCellType(this.cell.cellType);
        this.cellHandler = this.cellTypeDefinition.createHandler(this.cell, this.runtime);
        this.classList.add("cell-grid", "cell-container", `celltype-${this.cell.cellType}`);
    }

    firstUpdated(changedProperties: any) {
        super.firstUpdated(changedProperties);
        this.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                if (event.ctrlKey) {
                    this.runtime.controls.emit({ id: this.cell.id, type: "RUN_CELL", focusNextCell: false, insertNewCell: false });
                } else if (event.shiftKey) {
                    this.runtime.controls.emit({ id: this.cell.id, type: "RUN_CELL", focusNextCell: true, insertNewCell: false });
                } else if (event.altKey) {
                    this.runtime.controls.emit({ id: this.cell.id, type: "RUN_CELL", focusNextCell: true, insertNewCell: true });
                }
            }
        });

        [].slice.call(document.querySelectorAll('.dropdown-toggle')).map(e => new Dropdown(e));

        this.cellHandler.attach({
            elements: {
                topElement: this.topElement,
                topControlsElement: this.topControlsElement,
                bottomElement: this.bottomElement,
                bottomControlsElement: this.bottomControlsElement
            },
        });
    }

    public async run() {
        this.isCurrentlyRunning = true;
        this.performUpdate();
        await this.cellHandler.run();
        this.isCurrentlyRunning = false;
        this.performUpdate();
    }

    public focusEditor() {
        this.focus();
        this.cellHandler.focusEditor();
    }

    changeCellType(newCellType: string | string[]) {
        // If these are multiple cell types, take the first one
        const newCellTypeIdentifier = typeof newCellType === "string" ? newCellType : newCellType[0];
        this.runtime.controls.emit({
            id: this.cell.id, type: "CHANGE_CELL_TYPE", newCellType: newCellTypeIdentifier,
        });
    }

    private toggleProperty(name: string) {
        toggleCellFlagProperty(this.cell, name);
        this.performUpdate();
    }

    render() {
        const id = this.cell.id;
        const emit = this.runtime.controls.emit;

        this.classList.toggle("collapsed", !!this.cell.metadata.properties.collapsed);
        return html`
            <starboard-insertion-line class="insertion-line-top"></starboard-insertion-line>

            <!-- Gutter (left side outside the document) -->
            <div class="cell-gutter cell-gutter-left-above">
                <button @click=${() => this.toggleProperty("collapsed")} class="cell-gutter-button" title=${this.cell.metadata.properties.collapsed ? "Maximize cell" : "Minimize cell"}></button>
            </div>
            <div class="cell-gutter cell-gutter-left-top">
                <button class="cell-gutter-button" title="This gutter button doesn't do anything yet.."></button>
            </div>
            <div class="cell-gutter cell-gutter-left-bottom">
                <button class="cell-gutter-button" title="This gutter button doesn't do anything yet.."></button>
            </div>


            <!-- Top left corner, used to display a run button if cell is collapsed -->
            <div class="cell-controls cell-controls-left-above">
                ${this.isCurrentlyRunning
                ? html`
                    <button @mousedown=${() => emit({ id, type: "RUN_CELL" })}  class="cell-controls-button display-when-collapsed" title="Cell is running">
                        ${ClockIcon({ width: 20, height: 20 })}
                </button>`
                : html`
                    <button @mousedown=${() => emit({ id, type: "RUN_CELL" })} class="cell-controls-button display-when-collapsed" title="Run cell">
                        ${PlayCircleIcon({ width: 20, height: 20 })}
                </button>`
                }
            </div>

            <!-- Top bar of the cell -->
            <div class="cell-controls cell-controls-above">

                <!-- Properties section -->
                ${getPropertiesIcons(this.cell, (propertyName: string) => this.toggleProperty(propertyName))}
                <div style="margin-right: auto"></div>

                <div class="collapsed-cell-line" title="Click to reveal collapsed cell temporarily"></div>
                
                <div class="dropdown">
                    <button data-bs-toggle="dropdown" title="Change Cell Type" class="cell-controls-button cell-controls-button-language auto-hide" @click=${/*(evt: Event) => this.togglePopover(evt.target as HTMLElement, this.typePickerElement)*/()=>0}>${this.cellTypeDefinition.name}</button>
                    <div class="dropdown-menu" style="min-width: 244px">
                        <li><h6 class="dropdown-header">Change Cell Type</h6></li>
                        ${getAvailableCellTypes().map((ct) => {
                            const ctString = typeof ct.cellType === "string" ? ct.cellType : ct.cellType[0];
                            return html`
                            <li>
                                <button title=${ctString} class="dropdown-item${ctString === this.cell.cellType ? " active" : ""}" @click=${() => this.changeCellType(ct.cellType)}>
                                    ${ct.name}<span style="opacity: 0.6; float: right; font-size: 11px; font-family: var(--font-mono)">${ctString}</span>
                                </button>
                            </li>
                        `;})}
                    </div>
                </div>

                <!-- Properties change button -->
                <div class="dropdown">
                    <button data-bs-toggle="dropdown" class="cell-controls-button auto-hide" title="Change Cell Properties">
                        ${BooleanIcon({ width: 15, height: 15 })}
                    </button>

                    <div class="dropdown-menu" style="min-width: 244px">
                        <li><h6 class="dropdown-header">Toggle Cell properties</h6></li>
                        ${getPropertiesPopoverIcons(this.cell, (propertyName: string) => this.toggleProperty(propertyName))}
                    </div>
                </div>

                <button @click="${() => emit({ id, type: "REMOVE_CELL" })}" class="cell-controls-button auto-hide" title="Remove Cell">
                    ${DeleteIcon({ width: 15, height: 15 })}
                </button>
            </div>

            <div class="cell-controls cell-controls-left cell-controls-left-top"></div>
            <div class="cell-top"></div>
            <div class="cell-controls cell-controls-left cell-controls-left-bottom"></div>
            <div class="cell-bottom"></div>

        <starboard-insertion-line class="insertion-line-bottom"></starboard-insertion-line>
    `;
    }

    public disconnectedCallback() {
        super.disconnectedCallback();
        this.cellHandler.dispose();
    }
}
