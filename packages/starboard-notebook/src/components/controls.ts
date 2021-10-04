/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { html } from "lit";
import { Cell, ControlsDefinition } from "../types";
import { getAvailablePropertyTypes, registry } from "../cellProperties/registry";
import { renderIcon } from "./helpers/icon";
// Note: These controls are not "Components" in the lit sense

export function cellControlsTemplate(controls: ControlsDefinition) {
  const buttons = controls.buttons;
  return html`
    ${buttons.map(
      (button) =>
        html`
          <button
            @click="${function (evt: Event) {
              button.callback(evt);
            }}"
            class="btn cell-controls-button py-1"
            title="${button.tooltip}"
          >
            ${renderIcon(button.icon, { width: 16, height: 16 })}
          </button>
        `
    )}
  `;
}

export function getPropertiesIcons(cell: Cell, togglePropertyFunction: (name: string) => void) {
  const iconTemplates = [];
  for (const prop of Object.getOwnPropertyNames(cell.metadata.properties)) {
    const propertyDef = registry.get(prop) || {
      icon: "bi bi-exclamation-circle",
      textEnabled: `Unknown property "${prop}"`,
      textDisabled: ``,
      name: `Unknown`,
      cellProperty: "unknown",
    };
    const templateResult = html`
      <button
        @click=${() => togglePropertyFunction(prop)}
        class="btn cell-controls-button property-${propertyDef.cellProperty}"
        title=${propertyDef.textEnabled}
      >
        ${renderIcon(propertyDef.icon, { width: 14, height: 14 })}
      </button>
    `;
    iconTemplates.push(templateResult);
  }
  return html`${iconTemplates}`;
}

// Shown in the dropdown where you can add new cell properties.
export function getPropertiesPopoverIcons(cell: Cell, togglePropertyFunction: (name: string) => void) {
  return html`
    <div class="mb-1 mt-3 d-flex justify-content-around">
      ${getAvailablePropertyTypes().map((def) => {
        const isActive = cell.metadata.properties[def.cellProperty] !== undefined;
        const helpText = isActive ? def.textEnabled : def.textDisabled;

        return html`
          <button
            @click=${() => togglePropertyFunction(def.cellProperty)}
            class="btn cell-controls-button property-${def.cellProperty} ${isActive ? "text-primary" : ""}"
            title=${helpText}
          >
            ${renderIcon(def.icon, { width: 16, height: 16 })}
          </button>
        `;
      })}
    </div>
  `;
}
