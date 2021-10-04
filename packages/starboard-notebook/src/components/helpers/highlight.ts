/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { EditorView } from "@codemirror/view";
import MarkdownIt from "markdown-it";
import { generateUniqueId } from "./random";

function highlight(markdownIt: MarkdownIt, opts: any, text: string, lang: string) {
  const cmHighlight = import(
    /* webpackChunkName: "codemirrorHighlight", webpackPrefetch: true */ "../editor/codemirror/highlight"
  );

  // An empty line is inserted without this at the end in codemirror, not sure why.
  if (text.endsWith("\n")) {
    text = text.substring(0, text.length - 1);
  }

  const uid = generateUniqueId(12);
  cmHighlight
    .then((cm) => {
      return cm.createCodeMirrorCodeHighlight(text, { language: lang });
    })
    .then((ev: EditorView) => {
      const placeholderEl = document.getElementById(uid);
      if (placeholderEl) {
        placeholderEl.id = "";
        placeholderEl.innerText = "";
        placeholderEl.appendChild(ev.contentDOM);
      }
    });

  // Placeholder while we load codemirror asynchrionously.
  const placeholder = `<pre><code id="${uid}">${text}</code></pre>`;
  return placeholder;
}

function markdownItCodemirrorHighlight(markdownit: MarkdownIt, userOptions: any): void {
  // register ourselves as highlighter
  (markdownit as any).options.highlight = (text: string, lang: string) =>
    highlight(markdownit, userOptions, text, lang);
}

export function hookMarkdownItToCodemirrorHighlighter(markdownItInstance: MarkdownIt) {
  markdownItInstance.use(markdownItCodemirrorHighlight);
}
