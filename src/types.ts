/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Runtime } from "./runtime";
import { TemplateResult } from "lit-html";


/**
 * Events that can be sent from the cell for central handling in the notebook component.
 */
export type CellEvent =
    { id: string; type: "RUN_CELL"; focusNextCell?: boolean; insertNewCell?: boolean }
    | { id: string; type: "INSERT_CELL"; position: "before" | "after"; data?: Partial<Cell> }
    | { id: string; type: "REMOVE_CELL" }
    | { id: string; type: "CHANGE_CELL_TYPE"; newCellType: string }
    | { id: string; type: "RESET_CELL"}
    | { type: "SAVE" };


/**
 * The backing data for a cell, can be JSON serialized or converted to a notebook string.
 */
export interface Cell {
    /**
     * An identifier such as "javascript" or "markdown" for Javascript and Markdown respectively.
     */
    cellType: string;

    textContent: string;

    metadata: {
        /**
         * The cell identifier, if it is present in the metadata it should be persisted between runs.
         */
        id?: string;
        properties: {
            run_on_load?: true;
            collapsed?: true;
            locked?: true;
            [key: string]: any;
        };

        [key: string]: any;
    };

    /**
     * Every cell has a unique ID, this is not persisted between runs.
     * It has to be unique within this notebook.
     */
    id: string;
}

export interface NotebookMetadata {
    title?: string;
    /**
     * The subtitle description for the notebook, should be under 200 characters ideally.
     */
    description?: string;
    tags?: string[];

    starboard?: {
        notebook: {
            format_version: 1;
            runtime_version: string;
        };
    };
    [key: string]: any;
}

/**
 * The entire state of a notebook that is to be persisted.
 */
export interface NotebookContent {
    metadata: NotebookMetadata;

    cells: Cell[];
}

export interface CellTypeDefinition {
    createHandler(cell: Cell, runtime: Runtime): CellHandler;

    /**
     * Name for human consumption, e.g. "Javascript"
     */
    name: string;

    /**
     * Identifiers for this cell type, can be a single value (e.g. "html") or multiple (e.g. ["javascript", "js"])
     * If multiple identifiers are defined, the first one is the preferred one.
     */
    cellType: string | string[];

    /**
     * Specify this to customize the cell creation interface. By default the name is shown at the top with a big button underneath.
     */
    createCellCreationInterface?: (runtime: Runtime, opts: {create: () => void}) => CellCreationInterface;
}

/**
 * A CellHandler contains the actual logic of a cell.
 */
export interface CellHandler {
    cell: Cell;
    runtime: Runtime;

    attach(param: CellHandlerAttachParameters): void;
    run(): Promise<any>;
    dispose(): Promise<void>;
    focusEditor(): void;
}

export interface CellCreationInterface {
    render(): string | TemplateResult | HTMLElement;
    getCellInit?(): Partial<Cell>;
    dispose?(): void;
}

export interface CellHandlerAttachParameters {
    elements: CellElements;
}

export interface CellElements {
    topElement: HTMLElement;
    bottomElement: HTMLElement;

    topControlsElement: HTMLElement;
    bottomControlsElement: HTMLElement;
}

export type IconTemplate = (iconOpts?: { width?: number; height?: number; hidden?: boolean; title?: string }) => (TemplateResult | string);

export interface ControlButton {
    icon: IconTemplate;
    tooltip: string;
    hide?: boolean;
    callback: () => any | Promise<any>;
}

export interface ControlsDefinition {
    buttons: ControlButton[];
}

export interface CellPropertyDefinition {
    /**
     * Identifier for the cell property, e.g. "collapsed" or "run_on_load"
     */
    cellProperty: string;

    /**
     * Name for human consumption, e.g. "Collapse Cell"
     */
    name: string;

    icon: IconTemplate;
    textEnabled: string;
    textDisabled: string;
}
