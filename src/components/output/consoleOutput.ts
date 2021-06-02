/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { ConsoleCatcher, Message } from "../../console/console";

@customElement("starboard-console-output")
export class ConsoleOutputElement extends LitElement {
  private logHook: (m: Message) => any;
  private updatePending = false;

  @property({ attribute: false })
  public logs: any[] = [];

  constructor() {
    super();
    this.logHook = (msg) => {
      this.addEntry(msg);
    };
  }

  createRenderRoot() {
    return this;
  }

  hook(consoleCatcher: ConsoleCatcher) {
    consoleCatcher.hook(this.logHook);
  }

  unhook(consoleCatcher: ConsoleCatcher) {
    consoleCatcher.unhook(this.logHook);
  }

  async unhookAfterOneTick(consoleCatcher: ConsoleCatcher) {
    return new Promise((resolve) =>
      window.setTimeout(() => {
        this.unhook(consoleCatcher);
        resolve(undefined);
      }, 0)
    );
  }

  addEntry(msg: Message) {
    this.logs.push(msg);
    if (!this.updatePending) {
      this.updatePending = true;
      requestAnimationFrame(() => this.requestUpdate());
    }
  }

  render() {
    // We load the console output functionality asynchronously
    const comPromise = import(/* webpackChunkName: "console-output", webpackPrefetch: true */ "./consoleOutputModule");

    const rootEl = document.createElement("div");
    rootEl.classList.add("starboard-console-output-inner");
    comPromise.then((c) => {
      c.renderStandardConsoleOutputIntoElement(rootEl, this.logs);
      this.updatePending = false;
    });
    return html`${rootEl}`;
  }
}
