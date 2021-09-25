/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { createElement as h, render } from "preact/compat";

import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import Editor from "rich-markdown-editor";
import { ContentContainer } from "./types";

@customElement("starboard-rich-editor")
export class StarboardRichEditorElement extends LitElement {
  content: ContentContainer;

  constructor(content: ContentContainer) {
    super();
    this.content = content;
  }

  createRenderRoot() {
    return this;
  }

  render() {
    const ed = new Editor({
      defaultValue: this.content.textContent,
      placeholder: "Start writing here..",
      extensions: [],
      readOnly: this.content.editable !== false,
      onClickLink: (href, event) => console.log("Clicky click link", href, event),
      embeds: [],
      tooltip: undefined as any,
    });

    return html`${render(ed as any, this)}`;
  }
}
