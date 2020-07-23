/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { html, TemplateResult } from "lit-html";

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
