/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { CellEvent, NotebookContent, CellTypeDefinition, CellPropertyDefinition, ControlsDefinition } from "../types";
import { ConsoleCatcher } from "../console/console";
import { CellElement } from "../components/cell";
import { StarboardNotebookElement } from "../components/notebook";
import { TemplateResult } from "lit-html";


export * from "../types";


export interface RuntimeControls {
    insertCell(position: "end" | "before" | "after", adjacentCellId?: string): void;
    removeCell(id: string): void;
    changeCellType(id: string, newCellType: string): void;
    runCell(id: string, focusNext?: boolean, insertNewCell?: boolean): void;
    runAllCells(opts: {onlyRunOnLoad?: boolean}): Promise<void>;

    /** 
     * Requests a save operation from the parent iframe.
     * Returns whether save message was succesfully sent, note that it doesn't guarantee it was actually saved!
    */
    save(): boolean;

    /** To be called to indicate that the notebook content has changed */
    contentChanged(): void;

    /**
     * Send a message to the parent iframe through the iframeResizer library.
     * Optionally you can pass the only target origin you want the message to be sent to, see the iframeresizer docs.
     * Returns whether a listening parent iframe is present (and thus if the message coudl be sent).
     */
    sendMessage(message: any, targetOrigin?: string): boolean;
}


/**
 * TODO
 * These are exposed functions and libraries. They are exposed so that they can be easily used within notebooks or
 * by plugins or extensions (so they don't have to bundle these themselves).
 */
export interface RuntimeExports {
    templates: {
        controls: (c: ControlsDefinition) => (TemplateResult | string);
    };
}


/**
 * Runtime is the main state/store for a notebook.
 */
export interface Runtime {

    /**
     * The state of the notebook that exactly describes the text in the notebook.
     */
    content: NotebookContent;

    definitions: {
        /**
         * Map of registered cell types, indexed by cellType (e.g. "js").
         */
        cellTypes: Map<string, CellTypeDefinition>;

        /**
         * Map of registered cell properties, indexed by property name (e.g. "collapsed" or "runOnLoad").
         */
        cellProperties: Map<string, CellPropertyDefinition>;
    };

    /**
     * Contains HTML elements in this notebook runtime.
     */
    dom: {
        notebook: StarboardNotebookElement;
        cells: CellElement[];
    };

    /**
     * Used to coordinate listening to the console hook.
     */
    consoleCatcher: ConsoleCatcher;

    /**
     * Version of Starboard Notebook
     */
    version: string;

    /**
     * Contains all actions that can be performed on the runtime
     */
    controls: RuntimeControls;

    /**
     * Publish to the notebook event bus, used to propagate messages upwards such as "focus on the next cell".
     */
    emit: (e: CellEvent) => void;

    /**
     * Serializes notebook to it's plaintext representation
     */
    serialize(): string;
}
