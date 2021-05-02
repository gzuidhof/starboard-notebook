/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { html } from "lit-html";
import { AlertCircleIcon } from "@spectrum-web-components/icons-workflow";
import { Cell, ControlsDefinition } from "../types";
import { registry, getAvailablePropertyTypes } from "../cellProperties/registry";

// Note: These controls are not "Components" in the lit-element sense

export function cellControlsTemplate(controls: ControlsDefinition) {
    const buttons = controls.buttons;
    return html`
        ${buttons.map((button) => 
            html`
            <button @click="${button.callback}" class="btn cell-controls-button ${button.hide === undefined ? "auto-hide": button.hide} " title="${button.tooltip}">
                ${button.icon({width: 18, height:18})}
            </button>
            `
        )}
    `;
}

export function getPropertiesIcons(cell: Cell, togglePropertyFunction: (name: string) => void) {
    const iconTemplates = [];
    for(const prop of Object.getOwnPropertyNames(cell.metadata.properties)) {
        const propertyDef = registry.get(prop) || {icon: AlertCircleIcon, textEnabled: `Unknown property "${prop}"`, textDisabled: ``, name: `Unknown`, cellProperty: "unknown"};
        const templateResult = html`
            <button @click=${() => togglePropertyFunction(prop)} class="btn cell-controls-button property-${propertyDef.cellProperty}" title=${propertyDef.textEnabled}>
                            ${propertyDef.icon({width: 15, height:15})}
            </button>
        `;
        iconTemplates.push(templateResult);
    }
    return html`${iconTemplates}`;
}

export function getPropertiesPopoverIcons(cell: Cell, togglePropertyFunction: (name: string) => void) {
    return html`
        <div class="m-2 d-flex">
        ${
           getAvailablePropertyTypes().map( (def) => {
                const isActive = cell.metadata.properties[def.cellProperty] !== undefined;
                const helpText = isActive ? def.textEnabled : def.textDisabled;
                const style = isActive ? "color: #8d27f4":"";
                return html`
                    <button style=${style} @click=${() => togglePropertyFunction(def.cellProperty)} class="btn cell-controls-button property-${def.cellProperty}" title=${helpText}>
                                    ${def.icon({width: 16, height:16})}
                    </button>
                `;
            })
        }
        </div>
    `;
}