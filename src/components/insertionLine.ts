/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { AddIcon } from "@spectrum-web-components/icons-workflow";
import { customElement, html, LitElement } from "lit-element";



@customElement('starboard-insertion-line')
export class InsertionLine extends LitElement {

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    this.classList.add("line-grid");

    this.performUpdate();
  }

  render() {
    return html`
    <div class="hover-area" contenteditable="off">
      <div class="button-container">
        <button class="insert-button" title="Insert Cell here">
            ${AddIcon({width: 16, height: 16})}
        </button>
      </div>
      <div class="content-line">
      </div>
    </div>
    `
  }
}