import { customElement, LitElement, property, html } from "lit-element";
import { render, createElement as h } from 'preact/compat';

/* eslint @typescript-eslint/ban-ts-comment: off */
//@ts-ignore
import { Console } from "console-feed";

interface IProps {
    logs: any[];
}

// React functional component render function
const StarboardConsoleOutput = (props: IProps) => {
    return h(Console, {logs: props.logs, variant: "dark"});
};

@customElement('starboard-console-output')
export class ConsoleOutputElement extends LitElement {

    @property({attribute: false})
    public logs: any[] = [];

    createRenderRoot() {
        return this;
    }

    render() {
        const el = StarboardConsoleOutput({logs: this.logs});
        const rootEl = document.createElement('div');
        rootEl.setAttribute("style", "background-color: #242424");
        render(el, rootEl);
        if (el) {
            return html`${rootEl}`;
        } else {
            return html`Something went wrong rendering the console output.`;
        }
    }
}