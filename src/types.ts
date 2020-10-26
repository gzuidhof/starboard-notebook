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
    | { id: string; type: "INSERT_CELL"; position: "before" | "after" }
    | { id: string; type: "REMOVE_CELL" }
    | { id: string; type: "CHANGE_CELL_TYPE"; newCellType: string }
    | { type: "SAVE" };

/**
 * The backing data for a cell, can be JSON serialized or converted to a notebook string.
 */
export interface Cell {
    /**
     * A short identifier such as "js" or "md" for Javascript and Markdown respectively.
     */
    cellType: string;

    textContent: string;

    properties: {
        runOnLoad?: true;
        collapsed?: true;
        [key: string]: any;
    };

    /**
     * Every cell has a unique ID, this is not persisted between runs.
     */
    id: string;
}

export interface NotebookMetadata {
    starboard?: {
        notebook?: {
            format_version: 1;
            default_cell_type: "javascript" | "python";
            runtime_version: string;
        };
    };
}

/**
 * The entire state of a notebook that is to be persisted.
 */
export interface NotebookContent {
    /**
     * Text before the first cell
     */
    frontMatter: string;

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
     * Identifiers for this cell type, can be a single value (e.g. "html") or multiple (e.g. ["js", "javascript"])
     */
    cellType: string | string[];
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

export interface CellHandlerAttachParameters {
    elements: CellElements;
}

export interface CellElements {
    topElement: HTMLElement;
    bottomElement: HTMLElement;

    topControlsElement: HTMLElement;
    bottomControlsElement: HTMLElement;
}

export type IconTemplate = (iconOpts?: { width?: number; height?: number; hidden?: boolean; title?:string }) => (TemplateResult | string);

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
     * Identifier for the cell property, e.g. "collapsed"
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
