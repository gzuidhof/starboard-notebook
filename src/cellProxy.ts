import { Cell } from "./notebookContent";

export function createCellProxy(cell: Cell, changedCallback: () => void) {
    return new Proxy(cell, {
        set: (target: Cell, prop: string, value: any) => {

            if (prop === "textContent") {
                if (typeof value !== "string") {
                    throw new TypeError("textContent must be a string");
                }

            } else if (prop === "id") {
                throw new Error("ID can not be changed.");
            }

            (target as any)[prop] = value;
            changedCallback();

            return true;
        }
    });
}