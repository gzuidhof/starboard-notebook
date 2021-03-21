/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { customElement, LitElement, property } from "lit-element";

import { debounce } from "@github/mini-throttle";
import { EditorView } from "prosemirror-view";

const prosemirrorPromise = import(/* webpackChunkName: "prosemirror", webpackPrefetch: true */ "./prosemirror/module");

type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;
type ProsemirrorModule = Awaited<typeof prosemirrorPromise>;

let prosemirrorModule: ProsemirrorModule | undefined;
prosemirrorPromise.then(pm => prosemirrorModule = pm);

/**
 * Note: Cell implements this interface.
 */
export interface ContentContainer {
    textContent: string;
}

/**
 * The main WYSIWYM (what you see is what you mean) content editor for Markdown content in Starboard.
 */
@customElement('starboard-content-editor')
export class StarboardContentEditor extends LitElement {
    view!: EditorView<any>;

    @property({type: Object})
    content: ContentContainer;

    createRenderRoot() {
        return this;
    }

    constructor(content: ContentContainer = {textContent: ""}) {
        super();
        this.content = content;
        
        prosemirrorPromise.then(pm => {
            this.view = new pm.EditorView(this, {
                state: this.createEditorState(pm)
            });
        })
    }

    private createEditorState(pm: ProsemirrorModule) {
        return pm.EditorState.create({
            doc: pm.defaultMarkdownParser.parse(this.content.textContent),
            plugins: [
                ...pm.exampleSetup({schema: pm.schema}),
                new pm.Plugin({
                    view: () => {
                        return {update: debounce((view: EditorView) => {
                              this.content.textContent = pm.defaultMarkdownSerializer.serialize(view.state.doc);
                        }, 50)
                      }
                    }
                })
            ]
          })
    }

    connectedCallback() {
        super.connectedCallback();

        prosemirrorPromise.then(pm => {
            this.view.updateState(this.createEditorState(pm))
            this.querySelector(".ProseMirror")!.classList.add("markdown-body");
        });
    }

    getContentAsMarkdownString() {
        // If the prosemirror module hasn't been loaded yet we just take it from the cell's content itself as it cant' be stale
        if (prosemirrorModule) {
            return prosemirrorModule.defaultMarkdownSerializer.serialize(this.view.state.doc);
        }
        return this.content.textContent;
    }

    focus() {
        this.view.focus();
    }

    dispose() {
        this.view.destroy();
    }
}
