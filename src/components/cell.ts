/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators";
import { toggleCellFlagProperty } from "../content/notebookContent";

import { BaseCellHandler } from "../cellTypes/base";
import { getAvailableCellTypes, getCellTypeDefinitionForCellType } from "../cellTypes/registry";

import { getPropertiesIcons, getPropertiesPopoverIcons } from "./controls";
import { Cell, CellTypeDefinition, Runtime } from "../types";
import "./insertionLine";

import Dropdown from "bootstrap/js/dist/dropdown";
import { syncPropertyElementClassNames } from "../cellProperties/dom";
import { cellHasProperty } from "../cellProperties/util";

@customElement("starboard-cell")
export class CellElement extends LitElement {
  @query(".cell-top")
  private topElement!: HTMLElement;
  @query(".cell-controls-left-top")
  private topControlsElement!: HTMLElement;
  @query(".cell-bottom")
  private bottomElement!: HTMLElement;
  @query(".cell-controls-left-bottom")
  private bottomControlsElement!: HTMLElement;

  public cellTypeDefinition!: CellTypeDefinition;
  public cellHandler!: BaseCellHandler;

  @property({ type: Object })
  public cell: Cell;

  private isCurrentlyRunning = false;
  public isBeingMoved = false;

  @property({ attribute: false })
  public runtime: Runtime;

  constructor(cell: Cell, runtime: Runtime) {
    super();
    this.cell = cell;
    this.id = this.cell.id;
    this.runtime = runtime;
    this.setAttribute("tabindex", "0");
    this.classList.add("starboard-fade-in");
  }

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.isBeingMoved) return;

    this.cellTypeDefinition = getCellTypeDefinitionForCellType(this.cell.cellType);
    this.cellHandler = this.cellTypeDefinition.createHandler(this.cell, this.runtime);
    this.classList.add("cell-grid", "cell-container", `celltype-${this.cell.cellType}`);

    // Hacky.. only on first creation of the cell we want to fade in, otherwise it would also fade
    // when being moved.
    setTimeout(() => this.classList.remove("starboard-fade-in"), 500);
  }

  firstUpdated(changedProperties: any) {
    super.firstUpdated(changedProperties);
    this.addEventListener("keydown", (event) => {
      // When the event comes back up the tree and hasn't been cancelled
      if (event.key === "Enter") {
        if (event.ctrlKey) {
          this.runtime.controls.emit({ id: this.cell.id, type: "RUN_CELL" });
        } else if (event.shiftKey) {
          this.runtime.controls.emit({
            id: this.cell.id,
            type: "RUN_CELL",
            focus: "next",
          });
        } else if (event.altKey) {
          this.runtime.controls.emit({
            id: this.cell.id,
            type: "RUN_CELL",
            focus: "next",
            insertNewCell: true,
          });
        }
        // After the event comes up (hasn't been cancelled) and it's a deletion-event
        // @ts-ignore
      } else if (event.key === "Backspace" && event._maybeDeleteCell) {
        this.runtime.controls.emit({
          id: this.cell.id,
          type: "REMOVE_CELL",
        });
      }
    });

    this.addEventListener(
      "keydown",
      (event) => {
        // Before anything happens, note down if this could be a deletion-event
        if (event.key === "Backspace" && (this.cell.textContent === null || this.cell.textContent === "")) {
          // @ts-ignore
          event._maybeDeleteCell = true;
        }
      },
      true
    );

    [].slice.call(document.querySelectorAll(".dropdown-toggle")).map((e) => new Dropdown(e));

    this.cellHandler.attach({
      elements: {
        cell: this,
        topElement: this.topElement,
        topControlsElement: this.topControlsElement,
        bottomElement: this.bottomElement,
        bottomControlsElement: this.bottomControlsElement,
      },
    });
  }

  public async run() {
    this.isCurrentlyRunning = true;
    this.requestUpdate();
    await this.cellHandler.run();
    this.isCurrentlyRunning = false;
    this.requestUpdate();
  }

  public focusEditor(opts: { position?: "start" | "end" }) {
    this.focus();
    this.cellHandler.focusEditor(opts);
  }

  public clear() {
    // ?. for backwards compatibility - prior to 0.9.3 cell handlers were not required to have a clear method.
    this.cellHandler?.clear();
  }

  changeCellType(newCellType: string | string[]) {
    // If these are multiple cell types, take the first one
    const newCellTypeIdentifier = typeof newCellType === "string" ? newCellType : newCellType[0];
    this.runtime.controls.emit({
      id: this.cell.id,
      type: "CHANGE_CELL_TYPE",
      newCellType: newCellTypeIdentifier,
    });
  }

  private toggleProperty(name: string, force?: boolean) {
    toggleCellFlagProperty(this.cell, name, force);
    this.requestUpdate();
  }

  private onTopGutterButtonClick() {
    if (cellHasProperty(this.cell, "top_hidden")) {
      this.toggleProperty("top_hidden", false);
    } else if (cellHasProperty(this.cell, "bottom_hidden")) {
      this.toggleProperty("bottom_hidden", false);
    } else {
      this.toggleProperty("collapsed");
    }
  }

  render() {
    const id = this.cell.id;
    const emit = this.runtime.controls.emit;

    syncPropertyElementClassNames(this, this.cell.metadata.properties);
    return html`
      <starboard-insertion-line class="insertion-line-top"></starboard-insertion-line>

      <!-- Gutter (left side outside the document) -->
      <div class="cell-gutter cell-gutter-left-above">
        <button
          @click=${() => this.onTopGutterButtonClick()}
          class="btn cell-gutter-button"
          title=${this.cell.metadata.properties.collapsed ? "Toggle cell visibility" : "Toggle cell visibility"}
        ></button>
      </div>
      <div class="cell-gutter cell-gutter-left-top">
        <button
          @click=${() => this.toggleProperty("top_hidden")}
          class="btn cell-gutter-button"
          title="Hide cell input"
        ></button>
      </div>
      <div class="cell-gutter cell-gutter-left-bottom">
        <button
          @click=${() => this.toggleProperty("bottom_hidden")}
          class="btn cell-gutter-button"
          title="Hide cell output"
        ></button>
      </div>

      <!-- Top left corner, used to display a run button if cell is collapsed -->
      <div class="cell-controls cell-controls-left-above d-flex justify-content-center">
        ${this.isCurrentlyRunning
          ? html` <button
              @mousedown=${() =>
                emit({
                  id,
                  type: "RUN_CELL",
                })}
              class="btn cell-controls-button display-when-collapsed py-1"
              title="Cell is running"
            >
              <span class="bi bi-hourglass"></span>
            </button>`
          : html` <button
              @mousedown=${() =>
                emit({
                  id,
                  type: "RUN_CELL",
                })}
              class="btn cell-controls-button display-when-collapsed py-1"
              title="Run cell"
            >
              <span class="bi bi-play-circle"></span>
            </button>`}
      </div>

      <!-- Top bar of the cell -->
      <div class="cell-controls cell-controls-above">
        <!-- Properties section -->
        ${getPropertiesIcons(this.cell, (propertyName: string) => this.toggleProperty(propertyName))}
        <div style="margin-right: auto"></div>

        <div class="collapsed-cell-line" title="Click to reveal collapsed cell temporarily"></div>

        <button
          @click=${() =>
            this.runtime.controls.emit({
              id: this.cell.id,
              type: "MOVE_CELL",
              amount: -1,
            })}
          class="btn cell-controls-button auto-hide"
          title="Move cell up"
        >
          <span class="bi bi-chevron-up"></span>
        </button>

        <button
          @click=${() =>
            this.runtime.controls.emit({
              id: this.cell.id,
              type: "MOVE_CELL",
              amount: 1,
            })}
          class="btn cell-controls-button auto-hide"
          title="Move cell down"
        >
          <span class="bi bi-chevron-down"></span>
        </button>

        <div class="dropdown">
          <button
            data-bs-toggle="dropdown"
            title="Change Cell Type"
            class="btn cell-controls-button cell-controls-button-language auto-hide"
            @click=${/*(evt: Event) => this.togglePopover(evt.target as HTMLElement, this.typePickerElement)*/ () => 0}
          >
            ${this.cellTypeDefinition.name}
          </button>
          <div class="dropdown-menu" style="min-width: 244px">
            <starboard-ensure-parent-fits></starboard-ensure-parent-fits>
            <li><h6 class="dropdown-header">Change Cell Type</h6></li>
            ${getAvailableCellTypes().map((ct) => {
              const ctString = typeof ct.cellType === "string" ? ct.cellType : ct.cellType[0];
              return html`
                <li>
                  <button
                    title=${ctString}
                    class="dropdown-item${ctString === this.cell.cellType ? " active" : ""}"
                    @click=${() => this.changeCellType(ct.cellType)}
                  >
                    ${ct.name}<span style="opacity: 0.6; float: right; font-size: 11px; font-family: var(--font-mono)"
                      >${ctString}</span
                    >
                  </button>
                </li>
              `;
            })}
          </div>
        </div>

        <!-- Properties change button -->
        <div class="dropdown">
          <button data-bs-toggle="dropdown" class="btn cell-controls-button auto-hide" title="Change Cell Properties">
            <span class="bi bi-three-dots-vertical"></span>
          </button>

          <div class="dropdown-menu" style="min-width: 244px">
            <starboard-ensure-parent-fits></starboard-ensure-parent-fits>
            <li>
              <button
                @click="${() =>
                  emit({
                    id,
                    type: "REMOVE_CELL",
                  })}"
                class="dropdown-item text-danger py-0"
                title="Remove Cell"
              >
                <span class="bi bi-trash-fill me-2"></span> Remove Cell
              </button>
            </li>
            <hr class="my-2" />
            <!-- <li><h6 class="dropdown-header">Toggle Cell properties</h6></li> -->
            ${getPropertiesPopoverIcons(this.cell, (propertyName: string) => this.toggleProperty(propertyName))}
          </div>
        </div>
      </div>

      <div class="cell-controls cell-controls-left cell-controls-left-top"></div>
      <div class="cell-top"></div>
      <div class="cell-controls cell-controls-left cell-controls-left-bottom"></div>
      <div class="cell-bottom"></div>

      <starboard-insertion-line class="insertion-line-bottom"></starboard-insertion-line>
    `;
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    if (this.isBeingMoved) return;
    this.cellHandler.dispose();
  }
}
