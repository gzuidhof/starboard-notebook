import { Cell } from "../notebookContent";
import { Runtime } from "../run";
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
