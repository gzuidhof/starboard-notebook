/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { html, render, TemplateResult } from "lit";
import { BaseCellHandler } from "./base";
import { cellControlsTemplate } from "../components/controls";
import { unsafeHTML } from "lit/directives/unsafe-html";
import { StarboardTextEditor } from "../components/textEditor";
import { Cell, CellElements, CellHandlerAttachParameters, ControlButton, Runtime } from "../types";

export const HTML_CELL_TYPE_DEFINITION = {
  name: "HTML",
  cellType: "html",
  createHandler: (c: Cell, r: Runtime) => new HTMLCellHandler(c, r),
};

export class HTMLCellHandler extends BaseCellHandler {
  private elements!: CellElements;
  private editor: any;

  constructor(cell: Cell, runtime: Runtime) {
    super(cell, runtime);
  }

  private getControls(): TemplateResult {
    const icon = "bi bi-play-circle";
    const tooltip = "Run Cell";
    const runButton: ControlButton = {
      icon,
      tooltip,
      callback: (_evt) => this.runtime.controls.runCell({ id: this.cell.id }),
    };
    return cellControlsTemplate({ buttons: [runButton] });
  }

  attach(params: CellHandlerAttachParameters) {
    this.elements = params.elements;

    render(this.getControls(), this.elements.topControlsElement);
    this.editor = new StarboardTextEditor(this.cell, this.runtime, {
      language: "html",
    });
    this.elements.topElement.appendChild(this.editor);
  }

  async run() {
    const htmlContent = this.cell.textContent;
    render(html`${unsafeHTML(htmlContent)}`, this.elements.bottomElement);
  }

  focusEditor(opts: { position?: "start" | "end" }) {
    if (this.editor) {
      this.editor.focus();
      this.editor.setCaretPosition(opts.position ?? "start");
    }
  }

  async dispose() {
    if (this.editor) {
      this.editor.dispose();
    }
  }

  clear() {
    render(html``, this.elements.bottomElement);
  }
}
