/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Adapted from jsconsole, MIT licensed */
import { ConsoleCatcher } from '../../console/console';
import { promiseState } from '../../util';
import { precompile } from './precompile';
 
declare global {
  interface Window {
    $_: any;
    eval: (command: string) => any;
  }
}

interface RunResult {
    error: boolean;
    command: string;
    value?: any;
}

export class JavascriptRuntime {
  public consoleCatcher: ConsoleCatcher;

  constructor() {
    this.consoleCatcher = new ConsoleCatcher(window.console);
  }

  async run(command: string): Promise<RunResult> {
    const res: RunResult = {
      error: false,
      command,
    };

    try {
      // // trick from devtools
      // // via https://chromium.googlesource.com/chromium/src.git/+/4fd348fdb9c0b3842829acdfb2b82c86dacd8e0a%5E%21/#F2
      if (/^\s*\{/.test(command) && /\}\s*$/.test(command)) {
        command = `(${command})`;
      }

      const codeToRun = precompile(command);

      if (!window) {
        res.error = true;
        res.value = "Run error: container or window is null";
        return res;
      }
      
      const cellResult = await window.eval(codeToRun);
      if (cellResult === undefined) {
        res.value = undefined;
        (window)["$_"] = res.value;
        return res;
      }

      const state = await promiseState(cellResult.returnValue);
      if (state === "fulfilled") { // Result is not a promise
        res.value = await cellResult.returnValue;
      } else { // Result is a promise that was awaited, we must wait to continue.
        res.value = cellResult.returnValue;
      }
      (window)["$_"] = res.value;

      return res;

    } catch (error) {
      res.error = true;
      res.value = error;
      return res;
    }

  }
}
