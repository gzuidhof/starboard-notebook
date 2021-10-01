/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import React, { createElement } from "react";
import { render } from "react-dom";

import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import RichMarkdownEditor, { Props, theme } from "./rich-editor";
import { ContentContainer } from "./types";
import { EditorState } from "prosemirror-state";
import Math from "./rich-editor/nodes/Math";
import MathDisplay from "./rich-editor/nodes/MathDisplay";

@customElement("starboard-rich-editor")
export class StarboardRichEditorElement extends LitElement {
  content: ContentContainer;
  runtime: any;
  opts: { editable?: ((state: EditorState) => boolean) | undefined };

  editor!: RichMarkdownEditor;
  editorVNode!: React.CElement<Props, RichMarkdownEditor>;

  constructor(content: ContentContainer, runtime: any, opts: { editable?: (state: EditorState) => boolean } = {}) {
    super();
    this.content = content;
    this.runtime = runtime;
    this.opts = opts;

    this.editorVNode = this.setupEditor();
    this.editor = render(this.editorVNode, this) as unknown as RichMarkdownEditor;
  }

  connectedCallback() {
    super.connectedCallback();

    // We don't run the cell if the editor has focus, as shift+enter has special meaning.
    this.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "Enter" && this.editor.view.hasFocus()) {
        if (event.ctrlKey || event.shiftKey) {
          event.stopPropagation();
          return true;
        }
      }
    });
  }

  createRenderRoot() {
    return this;
  }

  private setupEditor() {
    const editorTheme: typeof theme = { ...theme };

    editorTheme.fontFamily = "var(--font-sans)";
    editorTheme.fontFamilyMono = "var(--font-mono)";

    const math = new Math();
    const mathDisplay = new MathDisplay();

    return createElement(RichMarkdownEditor, {
      defaultValue: this.content.textContent,
      placeholder: "Start writing here..",
      extensions: [math, mathDisplay],
      theme: editorTheme,
      onChange: (v) => {
        this.content.textContent = v();
      },
      readOnly: this.content.editable === false,
      onClickLink: (href, event) => {
        window.open(href, "_blank");
      },
      embeds: [],
      tooltip: undefined as any,
    });
  }

  public refreshSettings() {
    // Dummy transaction
    this.editor.view.dispatch(this.editor.view.state.tr);
  }

  getContentAsMarkdownString() {
    return this.editor.value();
  }

  focus() {
    this.editor.focusAtStart();
  }

  setCaretPosition(position: "start" | "end") {
    if (position === "start") {
      this.editor.focusAtStart();
    } else {
      this.editor.focusAtEnd();
    }
  }

  dispose() {
    // No cleanup yet..
  }
}
