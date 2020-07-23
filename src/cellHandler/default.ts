/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Cell } from "../notebookContent";
import { CellHandler, CellHandlerAttachParameters } from "./base";
import { render, html } from "lit-html";
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { highlight } from "../highlight";

/**
 * The cell handler that gets used when there is an unknown cell type
 */
export class DefaultCellHandler extends CellHandler {
    constructor(cell: Cell) {
        super(cell);
    }

    attach(params: CellHandlerAttachParameters) {
        const highlightLanguage = highlight.getLanguage(this.cell.cellType);
        let highlightedText = "";
        if (highlightLanguage) {
            highlightedText = highlight(this.cell.cellType, this.cell.textContent).value;
        } else {
            highlightedText = highlight.highlightAuto(this.cell.textContent).value;
        }
        render(html`<pre class="cell-editor"><code>${unsafeHTML(highlightedText)}</code></pre>`, params.elements.topElement);
    }
}
