/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Cell } from "../runtime/types";
import { Runtime } from "../runtime";

export interface CellHandlerAttachParameters {
    elements: CellElements;
}

export interface CellElements {
    topElement: HTMLElement;
    bottomElement: HTMLElement;

    topControlsElement: HTMLElement;
    bottomControlsElement: HTMLElement;
}

export abstract class CellHandler {
    protected cell: Cell;
    protected runtime: Runtime;

    constructor(cell: Cell, runtime: Runtime) {
        this.cell = cell;
        this.runtime = runtime;
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
