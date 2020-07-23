import { CellHandler } from "./base";
import { DefaultCellHandler } from "./default";
import { MARKDOWN_CELL_TYPE_DEFINITION } from "./markdown";
import { JAVASCRIPT_CELL_TYPE_DEFINITION } from "./javascript";
import { HTML_CELL_TYPE_DEFINITION } from "./html";
import { Cell } from "../notebookContent";
import { CSS_CELL_TYPE_DEFINITION } from "./css";

export interface CellTypeDefinition {
    createHandler(cell: Cell): CellHandler;
    name: string;
    cellType: string;
    createHandler: (cell: Cell) => CellHandler;
    icon: string;
}

const defaultCellTypeDefinition = {
    name: "Unknown",
    cellType: "",
    createHandler: (c: Cell) => new DefaultCellHandler(c),
    icon: "fas fa-question-circle"
};

const builtinCellTypes = [
    MARKDOWN_CELL_TYPE_DEFINITION,
    JAVASCRIPT_CELL_TYPE_DEFINITION,
    HTML_CELL_TYPE_DEFINITION,
    CSS_CELL_TYPE_DEFINITION,
];

const registry = new Map<string, CellTypeDefinition>();
builtinCellTypes.forEach((e) => registry.set(e.cellType, e));

export function getCellTypeDefinitionForCellType(cellType: string): CellTypeDefinition {
    if (registry.has(cellType)) {
        return registry.get(cellType) as CellTypeDefinition;
    } else {
        console.log(`No cell handler found for cell type ${cellType}`);
        console.log(`Available cell handlers: ${Array.from(registry.keys())}`);
        return {
            ...defaultCellTypeDefinition,
            cellType: cellType,
            name: `Unknown type "${cellType}"`,
        };
    }
}

export function getAvailableCellTypes() {
    return [...registry.values()];
}
