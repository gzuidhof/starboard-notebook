/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { customElement, LitElement, property, html } from "lit-element";
import { render, createElement as h } from 'preact/compat';

/* eslint @typescript-eslint/ban-ts-comment: off */
//@ts-ignore
import { Console } from "console-feed-modern";
import { ConsoleCatcher, Message } from "src/console/console";

interface IProps {
    logs: any[];
    logFilter?: () => boolean;
}

// React functional component render function
const StarboardConsoleOutput = (props: IProps) => {
    return h(Console as any, {logs: props.logs, variant: "dark", logFilter: props.logFilter});
};

@customElement('starboard-console-output')
export class ConsoleOutputElement extends LitElement {
    private logHook: (m: Message) => any;

    @property({attribute: false})
    public logs: any[] = [];

    constructor() {
        super();
        this.logHook = (msg) => {
            this.logs.push(msg); 
            this.requestUpdate();
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
        return new Promise(resolve => window.setTimeout(() => 
            {
                this.unhook(consoleCatcher);
                resolve();
            }, 0
        ));
    }

    addEntry(msg: Message) {
        this.logs.push(msg);
        this.requestUpdate();
    }

    render() {
        /** Note(gzuidhof): We must pass the always-true logFilter here or console-feed chokes on pyodide._module because it's too large to stringify.. */
        const el = StarboardConsoleOutput({logs: this.logs, logFilter: () => true});
        const rootEl = document.createElement('div');
        rootEl.setAttribute("style", "background-color: rgb(36, 36, 36)");
        render(el, rootEl);
        if (el) {
            return html`${rootEl}`;
        } else {
            return html`Something went wrong rendering the console output.`;
        }
    }
}