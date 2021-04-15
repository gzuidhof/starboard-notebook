/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { AddIcon } from "@spectrum-web-components/icons-workflow";
import { customElement, html, LitElement, query } from "lit-element";

import {createPopper} from "@popperjs/core";
import { CellTypePicker } from "./cellTypePicker";
import { CellElement } from "./cell";
import { Cell } from "src/types";

// Lazily initialized.. but cached for re-use.
let globalCellTypePicker: CellTypePicker;

@customElement('starboard-insertion-line')
export class InsertionLine extends LitElement {

  @query(".insert-button")
  buttonElement?: HTMLButtonElement;

  @query(".hover-area")
  hoverArea?: HTMLDivElement;

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    if (!globalCellTypePicker) {
      // TODO: Flow runtime into this some nicer way.
      globalCellTypePicker = new CellTypePicker((window as any).runtime);
    }

    this.classList.add("line-grid");
    this.performUpdate();

    let unpop: () => void;
    let lastActive: number;

    let popoverIsActive = false;

    // TODO: refactor into separate function (and maybe find a way to detect "out of bounds" click in a nicer way)
    if (this.buttonElement !== undefined) {
      const btn = this.buttonElement;
      
      this.buttonElement.addEventListener("click", (_: MouseEvent) => {
        if (popoverIsActive) return;
        this.appendChild(globalCellTypePicker);
        lastActive = Date.now();

        const listener = (evt: MouseEvent) => {
          const isClickInside = globalCellTypePicker.contains(evt.target as any);
          if (!isClickInside) {
            unpop();
          }
        };

        unpop = () => { // Clean up the overlay
          if (Date.now() - lastActive < 100) {
            return;
          }
          popoverIsActive = false;
          pop.destroy();
          globalCellTypePicker.remove();
          document.removeEventListener("click", listener);
        };

        document.addEventListener("click", listener);
        const pop = createPopper(btn, globalCellTypePicker, {placement: "right-start"});
        const parent = this.parentElement;

        if (parent && parent instanceof CellElement) {
          globalCellTypePicker.setHighlightedCellType(parent.cell.cellType);
        }
        globalCellTypePicker.onInsert = (cellData: Partial<Cell>) => {
            // Right now we assume the insertion line has a cell as parent
            if (parent && parent instanceof CellElement) {
              const position = this.classList.contains("insertion-line-top") ? "before" : "after";
              parent.runtime.controls.emit({type: "INSERT_CELL", position: position, id: parent.cell.id, data: cellData});
              unpop();
            }
        };
        popoverIsActive = true;
      });
    }
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
    `;
  }
}