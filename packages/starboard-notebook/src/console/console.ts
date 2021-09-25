/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import Hook from "console-feed-modern/lib/Hook/index";
import methods, { Methods } from "console-feed-modern/lib/definitions/Methods";

export type MessageMethod = Methods | "result" | "command";

export interface Message {
  method: MessageMethod;
  data: any[];
}

export type MessageCallback = (message: Message) => void;

export class ConsoleCatcher {
  private currentHook?: MessageCallback;

  /**
   * The console's original log/debug/etc methods, so we can still
   * log unhooked.
   */
  private originalMethods: { [M in Methods]: (...v: any) => any };

  constructor(console: Console) {
    this.originalMethods = {} as any;
    (methods as Methods[]).forEach((m) => (this.originalMethods[m] = console[m]));

    Hook(
      console,
      (msg: Message) => {
        if (this.currentHook) {
          this.currentHook(msg);
        }
      },
      false
    );
  }

  public hook(callback: MessageCallback) {
    this.currentHook = callback;
  }

  public unhook(callback: MessageCallback) {
    if (this.currentHook === callback) {
      this.currentHook = undefined;
    }
  }

  /**
   * Can be used to circumvent the console catcher.
   */
  public getRawConsoleMethods() {
    return this.originalMethods;
  }
}
