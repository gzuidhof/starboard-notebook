/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { LitElement, html, property, customElement, query } from 'lit-element';
import { Cell, toggleCellFlagProperty } from '../notebookContent';

import { CellHandler } from '../cellHandler/base';
import { CellTypeDefinition, getCellTypeDefinitionForCellType, getAvailableCellTypes } from '../cellHandler/registry';
import { JavascriptRuntime } from '../cellHandler/javascript/runtime';

import { AssetsAddedIcon, DeleteIcon, ReplayIcon, MoreSmallListIcon, MoreIcon, ColumnSettingsIcon, SettingsIcon, BooleanIcon } from "@spectrum-web-components/icons-workflow";
import { getPropertiesIcons, getPropertiesPopoverIcons } from './controls';

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
    private typePickerElement!: HTMLElement;
    @query('.cell-properties-popover')
    private propertiesPickerElement!: HTMLElement;

    private cellTypeDefinition!: CellTypeDefinition;
    private cellHandler!: CellHandler;

    @property({ type: Object })
    public cell: Cell;

    @property({ attribute: false})
    private runtime: JavascriptRuntime;

    @property()
    private eventListener: (event: CellEvent) => void;

    constructor(
        cell: Cell,
        runtime: JavascriptRuntime,
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

    togglePopover(element: HTMLElement) {
        element.classList.toggle("popover-active");
        if (element.classList.contains("popover-active")) {
        // TODO: refactor this. the idea is to detect clicks outside the element to close the popover.
            setTimeout(() => {
                const listenerFunc = (e: MouseEvent) => {
                    if (!element.contains(e.target as Node)) {
                        element.classList.remove("popover-active");
                        document.removeEventListener("click", listenerFunc);
                    }
                };
                document.addEventListener("click", listenerFunc);
            });
        }
    }
    

    private toggleProperty(name: string) {
        toggleCellFlagProperty(this.cell, name);
        this.performUpdate();
    }

    render() {
        return html`
        <section class="cell-container ${this.cell.properties.collapsed ? "collapsed" : ""}">

            <!-- Gutter (left line of the cell) -->
            <div class="cell-gutter cell-gutter-corner">
                <button @click=${() => this.toggleProperty("collapsed")} class="cell-gutter-button" title=${this.cell.properties.collapsed ? "Maximize cell" : "Minimize cell"})></button>
            </div>
            <div class="cell-gutter cell-gutter-top">
                <button class="cell-gutter-button" title="This gutter button doesn't do anything yet.."></button>
            </div>
            <div class="cell-gutter cell-gutter-bottom">
                <button class="cell-gutter-button" title="This gutter button doesn't do anything yet.."></button>
            </div>

            <div class="cell-controls cell-controls-corner"></div>

            <!-- Top bar of the cell -->
            <div class="cell-controls cell-controls-above">

                <!-- Properties section -->
                ${getPropertiesIcons(this.cell, (propertyName: string) => this.toggleProperty(propertyName))}
                <div style="margin-right: auto"></div>

                <div class="collapsed-cell-line">

                </div>
                
                <!-- Language selection -->
                <div class="cell-popover-root">
                    <button title="Change Cell Type" class="cell-controls-button cell-controls-button-language" @click=${() => this.togglePopover(this.typePickerElement)}>${this.cellTypeDefinition.name}</button>
                    <div class="cell-popover cell-type-popover">
                        <b style="margin-bottom: 6px">Change Cell Type</b>

                        ${getAvailableCellTypes().map((ct) => html`
                            <button class="cell-popover-selection-button" @click=${() => this.changeCellType(ct.cellType)} >${ct.name} <span style="opacity: 0.6; float:right; font-size: 11px; font-family: monospace">${ct.cellType}</span></button>
                        `)
                        }

                        <button class="cell-controls-button cell-popover-close-button" @click=${() => this.typePickerElement.classList.remove("popover-active")}>Cancel</button>
                    </div>
                </div>

                <!-- Properties change button -->
                <div class="cell-popover-root">
                    <button @click=${() => this.togglePopover(this.propertiesPickerElement)} class="cell-controls-button" title="Change Cell Properties">
                        ${BooleanIcon({ width: 18, height: 18 })}
                    </button>
                    <div class="cell-popover cell-properties-popover">
                        <b style="margin-bottom: 6px">Toggle cell properties</b>
                        ${getPropertiesPopoverIcons(this.cell, (propertyName: string) => this.toggleProperty(propertyName))}
                        <button class="cell-controls-button cell-popover-close-button" @click=${() => this.propertiesPickerElement.classList.remove("popover-active")}>Cancel</button>
                    </div>
                </div>

                <button @click="${() => this.emit({ type: "REMOVE_CELL" })}" class="cell-controls-button" title="Remove Cell">
                    ${DeleteIcon({ width: 18, height: 18 })}
                </button>
                <button @click="${() => this.emit({ type: "INSERT_CELL", position: "before" })}" class="cell-controls-button" title="Add Cell Above">
                    ${AssetsAddedIcon({ width: 20, height: 20 })}
                </button>

            </div>

            <div class="cell-controls cell-controls-left cell-controls-left-top"></div>
            <div class="cell-top"></div>
            <div class="cell-controls cell-controls-left cell-controls-left-bottom"></div>
            <div class="cell-bottom"></div>
        </section>
    `;
    }

}