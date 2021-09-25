/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { CellPropertyDefinition, MapRegistry } from "../types";

const builtinCellProperties: CellPropertyDefinition[] = [
  {
    cellProperty: "run_on_load",
    icon: "bi bi-file-earmark-play",
    name: "Run on load",
    textEnabled: "This cell is run automatically when the notebook is loaded",
    textDisabled: "Run Cell on when the notebook gets loaded",
  },
  {
    cellProperty: "collapsed",
    icon: "bi bi-chevron-bar-expand",
    name: "Collapse Cell",
    textEnabled: "This cell is collapsed (hidden when not focused)",
    textDisabled: "Collapse cell (hide cell when not focused)",
  },
  {
    cellProperty: "bottom_hidden",
    icon: "bi bi-eye-slash-fill",
    name: "Hide this cell's bottom part",
    textEnabled: "Cell bottom is hidden",
    textDisabled: "Hide cell bottom",
  },
  {
    cellProperty: "top_hidden",
    icon: "bi bi-eye-slash",
    name: "Hide this cell's top part",
    textEnabled: "Cell top is hidden",
    textDisabled: "Hide cell top",
  },
  {
    cellProperty: "locked",
    icon: "bi bi-lock-fill",
    name: "Locked for Editing",
    textEnabled: "This cell is locked for editing",
    textDisabled: "Lock cell for editing",
  },
];

export function getAvailablePropertyTypes() {
  return [...registry.values()];
}

// Singleton global value
export const registry = new MapRegistry<string, CellPropertyDefinition>();
builtinCellProperties.forEach((e) => registry.set(e.cellProperty, e));
