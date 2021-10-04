/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Cell, CellHandler, CellHandlerAttachParameters, Runtime } from "../types";

export abstract class BaseCellHandler implements CellHandler {
  public cell: Cell;
  public runtime: Runtime;

  constructor(cell: Cell, runtime: Runtime) {
    this.cell = cell;
    this.runtime = runtime;
  }

  abstract attach(param: CellHandlerAttachParameters): void;

  run(): Promise<any> {
    return Promise.resolve();
  }

  dispose(): Promise<void> {
    return Promise.resolve();
  }

  focusEditor(_opts: { position?: "start" | "end" }): void {
    return;
  }

  clear(): void {
    return;
  }
}
