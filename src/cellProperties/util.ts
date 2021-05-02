import { Cell } from "../types";

export function cellHasProperty(cell: Cell, name: string) {
    return !!cell.metadata.properties[name];
}