import { LitElement, customElement, property } from "lit-element";
import { html } from "lit-html";
import { Runtime } from "src/runtime";
import { Cell } from "src/types";
import { getAvailableCellTypes } from "../cellTypes/registry";

@customElement('starboard-cell-type-picker')
export class CellTypePicker extends LitElement {

  @property({type: Object})
  public onInsert?: (data: Partial<Cell>) => any;

  // The cell type whose content shown on the right
  public currentHighlight = "markdown";

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    this.performUpdate();
  }

  setHighlightedCellType(highlightCellType: string) {
    this.currentHighlight = highlightCellType;
    this.performUpdate();
  }

  // TODO perhaps on doubleclick we can insert it right away?
  onClickCellType(ct: string) {
    if (this.currentHighlight !== ct) {
      this.setHighlightedCellType(ct);
    } else {
      this.onInsert && this.onInsert({cellType: ct});
    }
  }

  render() {
    const runtime = (window as any).runtime as Runtime;
    let focusedCellType = runtime.definitions.cellTypes.get(this.currentHighlight);

    if (!focusedCellType) {
      console.error("Unknown cell type is focused");
      focusedCellType = runtime.definitions.cellTypes.get("markdown")!;
    }

    return html`
    <!-- <div data-popper-arrow></div> -->
    <div class="inner">
        <nav class="sidebar">
        <h6 class="dropdown-header">Select Cell Type</h6>
        ${getAvailableCellTypes().map((ct) => {
            const ctString = typeof ct.cellType === "string" ? ct.cellType : ct.cellType[0];
            return html`
                <button
                  @click=${() => this.onClickCellType(ctString)}
                  title="${ctString}"
                  class="dropdown-item ${ctString === this.currentHighlight ? " active" : ""}">
                    ${ct.name}
                </button>
        `;})}
        </nav>
        <div class="content markdown-body">
          <h2>${focusedCellType.name}</h2>
          <p><code>${this.currentHighlight}</code></p>

          <button @click=${() => this.onInsert && this.onInsert({cellType: this.currentHighlight})} class="btn btn-primary btn-sm cta-button">Insert ${focusedCellType.name} cell</button>
        </div>
    </div>
    `;
  }
}