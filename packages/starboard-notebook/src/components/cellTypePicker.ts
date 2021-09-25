import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { CellCreationInterface, CellTypeDefinition, Runtime } from "../types";
import { Cell } from "../types";
import { getAvailableCellTypes, getCellTypeDefinitionForCellType } from "../cellTypes/registry";

function createDefaultCellCreationInterface(
  cellDefinition: CellTypeDefinition
): (runtime: Runtime, opts: { create: () => void }) => CellCreationInterface {
  return (r, opts) => ({
    render() {
      return html`
        <div class="markdown-body w-100">
          <h2>${cellDefinition.name}</h2>
          <p>
            <small><code>${JSON.stringify(cellDefinition.cellType)}</code></small>
          </p>
        </div>
        <button @click=${opts.create} class="btn btn-primary btn-sm cta-button">
          Insert ${cellDefinition.name} cell
        </button>
      `;
    },
  });
}

@customElement("starboard-cell-type-picker")
export class CellTypePicker extends LitElement {
  @property({ type: Object })
  public onInsert: (data: Partial<Cell>) => any = () => {
    console.error("Could not insert cell as onInsert is not set on the cell type picker.");
  };

  // The cell type whose content shown on the right
  private currentHighlight!: string;
  private currentCellCreationInterface!: CellCreationInterface;

  private runtime: Runtime;

  constructor(runtime: Runtime) {
    super();
    this.runtime = runtime;
  }

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setHighlightedCellType("markdown");
    this.requestUpdate();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  setHighlightedCellType(highlightCellType: string) {
    if (this.currentCellCreationInterface && this.currentCellCreationInterface) {
      this.currentCellCreationInterface.dispose && this.currentCellCreationInterface.dispose();
    }

    this.currentHighlight = highlightCellType;

    const def = getCellTypeDefinitionForCellType(this.currentHighlight);
    const createCellCreationInterfaceFunction =
      def.createCellCreationInterface || createDefaultCellCreationInterface(def);
    this.currentCellCreationInterface = createCellCreationInterfaceFunction(this.runtime, {
      create: () => this.insertCell(),
    });

    this.requestUpdate();
    this.querySelector(".dropdown-item.active") && (this.querySelector(".dropdown-item.active") as HTMLElement).focus();
  }

  private onClickCellType(ct: string) {
    if (this.currentHighlight !== ct) {
      this.setHighlightedCellType(ct);
    } else {
      this.onInsert({ cellType: ct });
    }
  }

  private insertCell() {
    if (this.currentCellCreationInterface.getCellInit) {
      this.onInsert(this.currentCellCreationInterface.getCellInit());
    } else {
      this.onInsert({ cellType: this.currentHighlight });
    }
  }

  render() {
    return html`
      <!-- <div data-popper-arrow></div> -->
      <starboard-ensure-parent-fits></starboard-ensure-parent-fits>
      <div class="inner">
        <nav class="sidebar">
          <h6 class="dropdown-header">Select Cell Type</h6>
          ${getAvailableCellTypes().map((ct) => {
            const ctString = typeof ct.cellType === "string" ? ct.cellType : ct.cellType[0];
            return html`
              <button
                @click=${() => this.onClickCellType(ctString)}
                title="${ctString}"
                class="dropdown-item ${ctString === this.currentHighlight ? " active" : ""}"
              >
                ${ct.name}
              </button>
            `;
          })}
        </nav>
        <div class="content">${this.currentCellCreationInterface.render()}</div>
      </div>
    `;
  }
}
