/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import Hook, {MessageCallback, Message} from "console-feed/lib/Hook";

export class ConsoleCatcher {
    private currentHook?: MessageCallback;

    constructor(console: Console) {
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
}
