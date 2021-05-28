/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { html, render } from "lit";
import { BaseCellHandler } from "./base";
import { unsafeHTML } from "lit/directives/unsafe-html";
import { StarboardTextEditor } from "../components/textEditor";
import { Cell, CellElements, CellHandlerAttachParameters, Runtime } from "../types";

export const CSS_CELL_TYPE_DEFINITION = {
  name: "CSS",
  cellType: "css",
  createHandler: (c: Cell, r: Runtime) => new CSSCellHandler(c, r),
};

export class CSSCellHandler extends BaseCellHandler {
  private elements!: CellElements;
  private editor!: StarboardTextEditor;

  private changeListener: () => any;

  constructor(cell: Cell, runtime: Runtime) {
    super(cell, runtime);
    this.changeListener = () => this.run();
  }

  attach(params: CellHandlerAttachParameters) {
    this.elements = params.elements;

    this.editor = new StarboardTextEditor(this.cell, this.runtime, {
      language: "css",
    });
    this.elements.topElement.appendChild(this.editor);
    this.runtime.controls.subscribeToCellChanges(this.cell.id, this.changeListener);
    this.run();
  }

  async run() {
    const content = this.cell.textContent;
    if (content) {
      render(html`${unsafeHTML("<style>\n" + content + "\n</style>")}`, this.elements.bottomElement);
    }
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
    this.runtime.controls.unsubscribeToCellChanges(this.cell.id, this.changeListener);
  }

  clear() {
    // Do nothing
  }
}
