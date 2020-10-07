/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { LitElement, html, property, customElement, query } from 'lit-element';
import { createPopper } from '@popperjs/core';
import { toggleCellFlagProperty } from '../content/notebookContent';

import { BaseCellHandler } from '../cellTypes/base';
import { getCellTypeDefinitionForCellType, getAvailableCellTypes } from '../cellTypes/registry';

import { AssetsAddedIcon, DeleteIcon, BooleanIcon, ClockIcon, PlayCircleIcon } from "@spectrum-web-components/icons-workflow";
import { getPropertiesIcons, getPropertiesPopoverIcons } from './controls';
import { Cell } from '../types';
import { Runtime, CellTypeDefinition } from '../runtime';

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

    changeCellType(newCellType: string) {
        this.runtime.controls.emit({
            id: this.cell.id, type: "CHANGE_CELL_TYPE", newCellType: newCellType,
        });
    }

    togglePopover(parent:HTMLElement, element: HTMLElement) {
        this.performUpdate(); // This update here is so that if a new cell type or property has been registered since it is visible.
        element.classList.toggle("popover-active");

        createPopper(parent, element, {placement: "left-start"});
        // console.log(element.scrollHeight, document.body.scrollHeight);

        if (element.classList.contains("popover-active")) {
        // TODO: refactor this. the idea is to detect clicks outside the element to close the popover.
            setTimeout(() => {
                const listenerFunc = (e: MouseEvent) => {
                    if (!element.contains(e.target as Node) || (e.target as HTMLElement).classList.contains("cell-popover-close-button")) {
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
        const id = this.cell.id;
        const emit = this.runtime.controls.emit;

        return html`
        <section class="cell-container ${this.cell.cellType} ${this.cell.properties.collapsed ? "collapsed" : ""}">

            <!-- Gutter (left line of the cell) -->
            <div class="cell-gutter cell-gutter-corner">
                <button @click=${() => this.toggleProperty("collapsed")} class="cell-gutter-button" title=${this.cell.properties.collapsed ? "Maximize cell" : "Minimize cell"}></button>
            </div>
            <div class="cell-gutter cell-gutter-top">
                <button class="cell-gutter-button" title="This gutter button doesn't do anything yet.."></button>
            </div>
            <div class="cell-gutter cell-gutter-bottom">
                <button class="cell-gutter-button" title="This gutter button doesn't do anything yet.."></button>
            </div>

            <!-- Top left corner, used to display a run button if cell is collapsed -->
            <div class="cell-controls cell-controls-corner">
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
                
                <!-- Language selection -->
                <div class="cell-popover-root">
                    <button title="Change Cell Type" class="cell-controls-button cell-controls-button-language" @click=${(evt: Event) => this.togglePopover(evt.target as HTMLElement, this.typePickerElement)}>${this.cellTypeDefinition.name}</button>
                    <div class="cell-popover cell-type-popover">
                        <b style="margin-bottom: 6px">Change Cell Type</b>

                        ${getAvailableCellTypes().map((ct) => html`
                            <button class="cell-popover-selection-button" @click=${() => this.changeCellType(ct.cellType)} >${ct.name} <span style="opacity: 0.6; float:right; font-size: 11px; font-family: monospace">${ct.cellType}</span></button>
                        `)
                        }

                        <button class="cell-controls-button cell-popover-close-button">Cancel</button>
                    </div>
                </div>

                <!-- Properties change button -->
                <div class="cell-popover-root">
                    <button @click=${(evt: Event) => this.togglePopover(evt.target as HTMLElement, this.typePickerElement)} class="cell-controls-button" title="Change Cell Properties">
                        ${BooleanIcon({ width: 18, height: 18 })}
                    </button>
                    <div class="cell-popover cell-properties-popover">
                        <b style="margin-bottom: 6px">Toggle cell properties</b>
                        ${getPropertiesPopoverIcons(this.cell, (propertyName: string) => this.toggleProperty(propertyName))}
                        <button class="cell-controls-button cell-popover-close-button">Cancel</button>
                    </div>
                </div>

                <button @click="${() => emit({ id, type: "REMOVE_CELL" })}" class="cell-controls-button" title="Remove Cell">
                    ${DeleteIcon({ width: 18, height: 18 })}
                </button>
                <button @click="${() => emit({ id, type: "INSERT_CELL", position: "before" })}" class="cell-controls-button" title="Add Cell Above">
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

    public disconnectedCallback() {
        super.disconnectedCallback();
        this.cellHandler.dispose();
    }
}
