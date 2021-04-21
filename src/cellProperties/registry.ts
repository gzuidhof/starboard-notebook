import { ReplayIcon, LockClosedIcon } from "@spectrum-web-components/icons-workflow";
import { CellPropertyDefinition, MapRegistry } from "../types";
import { ChevronBarExpandIcon, EyeSlashFilledIcon, EyeSlashIcon } from "../components/icons";

const builtinCellProperties: CellPropertyDefinition[] = [
    {
        cellProperty: "run_on_load",
        icon: ReplayIcon,
        name: "Run on load",
        textEnabled: "This cell is run automatically when the notebook is loaded",
        textDisabled: "Run Cell on when the notebook gets loaded"
    },
    {
        cellProperty: "collapsed",
        icon: ChevronBarExpandIcon,
        name: "Collapse Cell",
        textEnabled: "This cell is collapsed (hidden when not focused)",
        textDisabled: "Collapse cell (hide cell when not focused)",
    },
    {
        cellProperty: "bottom_hidden",
        icon: EyeSlashFilledIcon,
        name: "Hide this cell's bottom part",
        textEnabled: "Cell bottom is hidden",
        textDisabled: "Hide cell bottom",
    },
    {
        cellProperty: "top_hidden",
        icon: EyeSlashIcon,
        name: "Hide this cell's top part",
        textEnabled: "Cell top is hidden",
        textDisabled: "Hide cell top",
    },
    {
        cellProperty: "locked",
        icon: LockClosedIcon,
        name: "Locked for Editing",
        textEnabled: "This cell is locked for editing",
        textDisabled: "Lock cell for editing"
    }
];

export function getAvailablePropertyTypes() {
    return [...registry.values()];
}

// Singleton global value
export const registry = new MapRegistry<string, CellPropertyDefinition>();
builtinCellProperties.forEach((e) => registry.set(e.cellProperty, e));
