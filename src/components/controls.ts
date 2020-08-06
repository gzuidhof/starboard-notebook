/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { html, TemplateResult } from "lit-html";
import { ChevronUpDownIcon, ReplayIcon, AlertCircleIcon, VisibilityOffIcon } from "@spectrum-web-components/icons-workflow";
import { Cell } from "../notebookContent";

// Note: These controls are not "Components" in the lit-element sense

export interface ControlButton {
    icon: (iconOpts: {width: number; height: number} | undefined) => (string | TemplateResult);
    tooltip: string;
    hide?: boolean;
    callback: () => any | Promise<any>;
}

export interface ControlsDefinition {
    buttons: ControlButton[];
}

export interface PropertyDefinition {
    icon: (o: {width: number; height: number}) => TemplateResult | string;
    textEnabled: string;
    textDisabled: string;
    title: string;
}


const knownProperties = {
    "runOnLoad": {
        icon: ReplayIcon,
        title: "Run on load",
        textEnabled: "Cell will be executed when notebook is first loaded",
        textDisabled: "Run Cell on when the notebook gets loaded"
    },
    "collapsed": {
        icon: VisibilityOffIcon,
        title: "Collapse Cell",
        textEnabled: "Cell is collapsed (hidden when not focused)",
        textDisabled: "Collapse cell (hide cell when not focused)",
    },
} as {[name: string]: PropertyDefinition};

export function getDefaultControlsTemplate(controls: ControlsDefinition) {
    const buttons = controls.buttons;

    return html`
        ${buttons.map((button) => 
            html`
            <button @click="${button.callback}" class="cell-controls-button ${button.hide ? "auto-hide": ""} " title="${button.tooltip}">
                ${button.icon({width: 20, height:20})}
            </button>
            `
        )}
    `;
}

export function getPropertiesIcons(cell: Cell, togglePropertyFunction: (name: string) => void) {
    const iconTemplates = [];
    for(const prop of Object.getOwnPropertyNames(cell.properties)) {
        let propertyDef = knownProperties[prop as any];
        if (!propertyDef) {
            propertyDef = {icon: AlertCircleIcon, textEnabled: `Unknown property "${cell.properties}"`, textDisabled: ``, title: `Unknown`};
        }
        const templateResult = html`
            <button @click=${() => togglePropertyFunction(prop)} class="cell-controls-button" title=${propertyDef.textEnabled}>
                            ${propertyDef.icon({width: 16, height:16})}
            </button>
        `;
        iconTemplates.push(templateResult);
    }
    return html`${iconTemplates}`;
}

export function getPropertiesPopoverIcons(cell: Cell, togglePropertyFunction: (name: string) => void) {
    return html`
        <div style="display: flex">
        ${
            Object.entries(knownProperties).map( ([prop, propertyDef]) => {
                const isActive = cell.properties[prop] !== undefined;
                const helpText = isActive ? propertyDef.textEnabled : propertyDef.textDisabled;
                const style = isActive ? "color: #8d27f4":"";
                return html`
                    <button style=${style} @click=${() => togglePropertyFunction(prop)} class="cell-controls-button" title=${helpText}>
                                    ${propertyDef.icon({width: 16, height:16})}
                    </button>
                `;
            })
        }
        </div>
    `;
}