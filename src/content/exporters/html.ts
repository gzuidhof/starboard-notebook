/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { NotebookContent } from "../../types";
import "./bufferMock";
import jsesc from "jsesc";
import { notebookContentToText } from "../serialization";

/**
 *
 * @param content
 * @param opts cdnPrefix should end with a "/"
 */
export function exportAsHtml(content: NotebookContent, opts: { cdnPrefix: string }) {
  const notebookContentString = notebookContentToText(content);
  const escapedNb = jsesc(notebookContentString, {
    quotes: "backtick",
    minimal: true,
    es6: true,
    isScriptContext: true,
  });
  const cdn = opts.cdnPrefix;
  const body = `<!doctype html>
<html>
    <head>
        <meta charset="utf-8">
        <title>${content.metadata.title ?? "Starboard Notebook"}</title>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <link rel="icon" href="${cdn}favicon.ico">
        <link href="${cdn}starboard-notebook.css" rel="stylesheet">
    </head>
    <body>
        <script>
            window.initialNotebookContent = \`${escapedNb}\`;
            window.starboardArtifactsUrl = \`${cdn}\`;
        </script>
        <script src="${cdn}starboard-notebook.js"></script>
    </body>
</html>`;
  return body;
}
