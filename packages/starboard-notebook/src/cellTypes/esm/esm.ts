/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { html, render, TemplateResult } from "lit";
import { BaseCellHandler } from "../base";
import { cellControlsTemplate } from "../../components/controls";

import { ConsoleOutputElement } from "../../components/output/consoleOutput";
import { StarboardTextEditor } from "../../components/textEditor";
import { Cell } from "../../types";
import { CellElements, CellHandlerAttachParameters, ControlButton, Runtime } from "../../types";
import { renderIfHtmlOutput } from "../../components/output/htmlOutput";

export const ES_MODULE_CELL_TYPE_DEFINITION = {
  name: "ES Module",
  cellType: "esm",
  createHandler: (c: Cell, r: Runtime) => new ESModuleCellHandler(c, r),
};

export class ESModuleCellHandler extends BaseCellHandler {
  private elements!: CellElements;
  private editor!: StarboardTextEditor;

  private isCurrentlyRunning = false;
  private lastRunId = 0;

  private outputElement?: ConsoleOutputElement;

  constructor(cell: Cell, runtime: Runtime) {
    super(cell, runtime);
  }

  private getControls(): TemplateResult {
    const icon = this.isCurrentlyRunning ? "bi bi-hourglass" : "bi bi-play-circle";
    const tooltip = this.isCurrentlyRunning ? "Cell is running" : "Run Cell";
    const runButton: ControlButton = {
      icon,
      tooltip,
      callback: (_evt) => this.runtime.controls.runCell({ id: this.cell.id }),
    };
    return cellControlsTemplate({ buttons: [runButton] });
  }

  attach(params: CellHandlerAttachParameters) {
    this.elements = params.elements;

    const topElement = this.elements.topElement;
    render(this.getControls(), this.elements.topControlsElement);
    this.editor = new StarboardTextEditor(this.cell, this.runtime, {
      language: "javascript",
    });
    topElement.appendChild(this.editor);
  }

  async run() {
    this.lastRunId++;
    const currentRunId = this.lastRunId;
    this.isCurrentlyRunning = true;
    render(this.getControls(), this.elements.topControlsElement);

    this.outputElement = new ConsoleOutputElement();
    this.outputElement.hook(this.runtime.consoleCatcher);

    const htmlOutput = document.createElement("div");
    render(html`${this.outputElement}${htmlOutput}`, this.elements.bottomElement);

    const esmCodeUrl = URL.createObjectURL(new Blob([this.cell.textContent], { type: "text/javascript" }));

    let out: any = {};
    let error = undefined;
    try {
      out = await import(/* webpackIgnore: true */ esmCodeUrl);
    } catch (e) {
      error = e;
    }

    await this.outputElement.unhookAfterOneTick(this.runtime.consoleCatcher);

    const val = out.default;
    window.$_ = val;

    if (out) {
      Object.assign(window, out);
    }

    if (error) {
      if (error.stack !== undefined) {
        let stackToPrint: string = error.stack;
        const errMsg: string = error.toString();
        if (stackToPrint.startsWith(errMsg)) {
          // Prevent duplicate error msg in Chrome
          stackToPrint = stackToPrint.substr(errMsg.length);
        }
        this.outputElement.addEntry({
          method: "error",
          data: [errMsg, stackToPrint],
        });
      } else {
        this.outputElement.addEntry({
          method: "error",
          data: [error],
        });
      }
    }

    const htmlOutputRendered = renderIfHtmlOutput(val, htmlOutput);
    if (!htmlOutputRendered) {
      if (val !== undefined) {
        // Don't show undefined output
        this.outputElement.addEntry({
          method: "result",
          data: [val],
        });
      }
    }

    if (this.lastRunId === currentRunId) {
      this.isCurrentlyRunning = false;
      render(this.getControls(), this.elements.topControlsElement);
    }

    if (error) {
      throw error;
    }
  }

  focusEditor(opts: { position?: "start" | "end" }) {
    this.editor.focus();
    this.editor.setCaretPosition(opts.position ?? "start");
  }

  async dispose() {
    this.editor.remove();
  }

  clear() {
    render(html``, this.elements.bottomElement);
  }
}
