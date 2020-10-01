/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Hook } from "console-feed-modern";


export type Methods =
| 'log'
| 'debug'
| 'info'
| 'warn'
| 'error'
| 'table'
| 'clear'
| 'time'
| 'timeEnd'
| 'count'
| 'assert'
// Technically the next two aren't methods.. But it's what the library wants
| 'result'
| 'command';

export interface Message {
    method: Methods;
    data: any[];
}

export type MessageCallback = (message: Message) => void;


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
