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



function _cellTypeToDropdownValue(cellType: CellTypeDefinition) {
    return html`${cellType.name} <span style="font-size: 0.9em; float:right; font-style: monospace; color:#ddd; margin-left:4px">${cellType.cellType}</span>`;
}

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

    private cellTypeDefinition!: CellTypeDefinition;
    private cellHandler!: CellHandler;

    @property({ type: Object })
    public cell: Cell;

    @property()
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
        <div class="cell-container">
            <div class="cell-controls cell-controls-corner"></div>
            <div class="cell-controls cell-controls-above">
            <sp-dropdown
                value=${this.cellTypeDefinition.name}
                placement="top-end"
            >
                <sp-menu style="color: #ccc">
                    ${getAvailableCellTypes().map((ct) => html`
                    <sp-menu-item .value=${ct.name} @click=${() => this.changeCellType(ct.cellType)}>${ct.name}</span></sp-menu-item>
                    `)}
                    <sp-menu-divider></sp-menu-divider>
                    <sp-menu-item disabled>
                        More coming later..
                    </sp-menu-item>
                </sp-menu>
            </sp-dropdown>
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