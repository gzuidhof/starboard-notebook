import { CellPropertyDefinition } from "../runtime";
import { ReplayIcon, VisibilityOffIcon } from "@spectrum-web-components/icons-workflow";

const builtinCellProperties: CellPropertyDefinition[] = [
    {
        cellProperty: "runOnLoad",
        icon: ReplayIcon,
        name: "Run on load",
        textEnabled: "This cell is run automatically when the notebook is loaded",
        textDisabled: "Run Cell on when the notebook gets loaded"
    },
    {
        cellProperty: "collapsed",
        icon: VisibilityOffIcon,
        name: "Collapse Cell",
        textEnabled: "This cell is collapsed (hidden when not focused)",
        textDisabled: "Collapse cell (hide cell when not focused)",
    },
];

export function getAvailablePropertyTypes() {
    return [...registry.values()];
}

// Singleton global value
export const registry = new Map<string, CellPropertyDefinition>();
builtinCellProperties.forEach((e) => registry.set(e.cellProperty, e));
