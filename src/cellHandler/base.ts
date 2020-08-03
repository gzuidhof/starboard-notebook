/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Cell } from "../notebookContent";
import { Runtime } from "./javascript/runtime";
import { CellEvent } from "../components/cell";


export interface CellHandlerAttachParameters {
    runtime: Runtime;
    elements: CellElements;
    emit: (event: CellEvent) => void;
}

export interface CellElements {
    topElement: HTMLElement;
    bottomElement: HTMLElement;

    topControlsElement: HTMLElement;
    bottomControlsElement: HTMLElement;
}

export abstract class CellHandler {
    protected cell: Cell;

    constructor(cell: Cell) {
        this.cell = cell;
    }

    abstract attach(param: CellHandlerAttachParameters): void;

    run(): Promise<any> {
        return Promise.resolve();
    }

    dispose(): Promise<void> {
        return Promise.resolve();
    }

    focusEditor(): void {
        return;
    }
}
