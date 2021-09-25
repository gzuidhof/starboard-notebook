/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Runtime } from "src/types";

export async function downloadAsHtml(runtime: Runtime) {
  const cdnUrl = `https://cdn.jsdelivr.net/npm/${runtime.name}@${runtime.version}/dist/`;
  const exporters = await import(/* webpackChunkName: "exporters" */ "./exporters/exportersModule");

  const htmlContent = exporters.exportAsHtml(runtime.content, { cdnPrefix: cdnUrl });
  const htmlUriHref = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;

  const el = document.createElement("a");

  let filename = location.pathname.split("/").pop();
  if (!filename || filename == "/") {
    filename = "notebook";
  }
  if (!filename.endsWith(".html")) {
    filename = filename + ".html";
  }

  el.download = filename;
  el.href = htmlUriHref;
  el.target = "_blank";

  document.body.appendChild(el);
  el.click();
  el.remove();
}
