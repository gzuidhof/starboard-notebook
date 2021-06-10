/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { html, LitElement } from "lit";
import { customElement, query } from "lit/decorators.js";

import { createPopper } from "@popperjs/core";
import { CellTypePicker } from "./cellTypePicker";
import { CellElement } from "./cell";
import { Cell, Runtime } from "../types";

// Lazily initialized.. but cached for re-use.
let globalCellTypePicker: CellTypePicker;

@customElement("starboard-insertion-line")
export class InsertionLine extends LitElement {
  @query(".insert-button.plus")
  buttonElement?: HTMLButtonElement;

  @query(".hover-area")
  hoverArea?: HTMLDivElement;

  private insertPosition: "before" | "after" = "after";
  private runtime: Runtime;

  createRenderRoot() {
    return this;
  }

  constructor() {
    super();
    // TODO: pass this in..
    this.runtime = window.runtime;
  }

  connectedCallback() {
    super.connectedCallback();
    this.requestUpdate();
  }

  firstUpdated() {
    this.insertPosition = this.classList.contains("insertion-line-top") ? "before" : "after";
    if (!globalCellTypePicker) {
      // TODO: Flow runtime into this some nicer way.
      globalCellTypePicker = new CellTypePicker((window as any).runtime);
    }
    this.classList.add("line-grid");
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
        unpop = () => {
          // Clean up the overlay
          if (Date.now() - lastActive < 100) {
            return;
          }
          popoverIsActive = false;
          pop.destroy();
          globalCellTypePicker.remove();
          document.removeEventListener("click", listener);
        };
        document.addEventListener("click", listener);
        const pop = createPopper(btn, globalCellTypePicker, {
          placement: "right-start",
          strategy: "fixed",
        });
        const parent = this.parentElement;
        if (parent && parent instanceof CellElement) {
          globalCellTypePicker.setHighlightedCellType(parent.cell.cellType);
        }
        globalCellTypePicker.onInsert = (cellData: Partial<Cell>) => {
          // Right now we assume the insertion line has a cell as parent
          if (parent && parent instanceof CellElement) {
            this.runtime.controls.insertCell({
              adjacentCellId: parent.cell.id,
              position: this.insertPosition,
              data: cellData,
            });
            unpop();
          }
        };
        popoverIsActive = true;
      });
    }
  }

  quickInsert(cellType: string) {
    const parent = this.parentElement;
    if (parent && parent instanceof CellElement) {
      this.runtime.controls.insertCell({
        adjacentCellId: parent.cell.id,
        position: this.insertPosition,
        data: { cellType },
      });
    }
  }

  render() {
    const parent = this.parentElement;
    let cellType = "markdown";

    if (parent && parent instanceof CellElement) {
      cellType = parent.cell.cellType;
    }

    return html`
      <div class="hover-area" contenteditable="off">
        <div class="button-container">
          <button class="btn insert-button plus" title="Insert Cell"><span class="bi bi-plus"></span></button>
        </div>
        <div class="button-container ms-2 pe-3">
          <button class="btn insert-button" @click=${() => this.quickInsert(cellType)} title="Insert ${cellType} Cell">
            <span>+&nbsp;${cellType}</span>
          </button>
        </div>
        <div class="content-line"></div>
      </div>
    `;
  }
}
