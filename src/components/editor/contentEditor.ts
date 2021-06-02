/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { TextSelection } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import { Runtime } from "../../types";
import { ContentContainer } from "./prosemirror/module";

const prosemirrorPromise = import(/* webpackChunkName: "prosemirror", webpackPrefetch: true */ "./prosemirror/module");

type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;
type ProsemirrorModule = Awaited<typeof prosemirrorPromise>;

let prosemirrorModule: ProsemirrorModule | undefined;
prosemirrorPromise.then((pm) => (prosemirrorModule = pm));

/**
 * The main WYSIWYM (what you see is what you mean) content editor for Markdown content in Starboard.
 */
@customElement("starboard-content-editor")
export class StarboardContentEditor extends LitElement {
  view?: EditorView<any>;

  private content: ContentContainer;
  private runtime: Runtime;

  createRenderRoot() {
    return this;
  }

  constructor(content: ContentContainer, runtime: Runtime) {
    super();
    this.runtime = runtime;
    this.content = content;

    prosemirrorPromise.then((pm) => {
      this.view = pm.createProseMirrorEditor(this, this.content, this.runtime);
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "Enter" && this.view && this.view.hasFocus()) {
        if (event.ctrlKey) {
          event.stopPropagation();
          return true;
        } else if (event.shiftKey) {
          event.stopPropagation();
          return true;
        }
      }
    });

    prosemirrorPromise.then((_pm) => {
      if (this.view) {
        this.querySelector(".ProseMirror")?.classList.add("markdown-body");
      } else {
        console.warn("ProseMirror plugin: view is undefined in connected callback");
      }
    });
  }

  getContentAsMarkdownString() {
    // If the prosemirror module hasn't been loaded yet we just take it from the cell's content itself as it cant' be stale
    if (prosemirrorModule && this.view) {
      return prosemirrorModule.defaultMarkdownSerializer.serialize(this.view.state.doc);
    }
    return this.content.textContent;
  }

  focus() {
    if (this.view) {
      this.view.dispatch(this.view.state.tr.setSelection(TextSelection.atStart(this.view.state.doc)));
      this.view.focus();
    }
  }

  setCaretPosition(position: "start" | "end") {
    if (this.view) {
      if (position === "start") {
        this.view.dispatch(this.view.state.tr.setSelection(TextSelection.atStart(this.view.state.doc)));
      } else if (position === "end") {
        this.view.dispatch(this.view.state.tr.setSelection(TextSelection.atEnd(this.view.state.doc)));
      }
    }
  }

  dispose() {
    if (this.view) {
      this.view.destroy();
      this.view = undefined;
    }
  }
}
