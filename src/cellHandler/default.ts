/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Cell } from "../notebookContent";
import { CellHandler, CellHandlerAttachParameters } from "./base";
import { render, html } from "lit-html";
import { unsafeHTML } from 'lit-html/directives/unsafe-html';

import mdlib from "markdown-it";
import { hookMarkdownIt } from "../highlight";

const md = new mdlib();
hookMarkdownIt(md);

/**
 * The cell handler that gets used when there is an unknown cell type
 */
export class DefaultCellHandler extends CellHandler {
    constructor(cell: Cell) {
        super(cell);
    }

    attach(params: CellHandlerAttachParameters) {
        const mdText =  md.render(`\`\`\`\n${this.cell.cellType}\n${this.cell.textContent}\n\`\`\``);
        render(html`<pre class="cell-editor" style="margin: 0"><code style="margin: 4px">${unsafeHTML(mdText)}</code></pre>`, params.elements.topElement);
    }
}
