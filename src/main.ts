/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import "./styles/main.scss";
import "./components/notebook";

import "iframe-resizer/js/iframeResizer.contentWindow.js";
import * as lithtml from "lit-html";
import katex from "katex";
import * as YAML from "yaml";

declare global {
  interface Window {
    initialNotebookContent?: string;
    html?: typeof lithtml.html;
    svg?: typeof lithtml.svg;
    litHtml?: typeof lithtml;
    katex?: typeof katex;
    YAML?: typeof YAML;
  }
}

// Globals available to the user in the notebook (excluding runtime, which is initialized in the notebook itself)
window.html = lithtml.html;
window.svg = lithtml.svg;
window.litHtml = lithtml;
window.katex = katex;
window.YAML = YAML;

// eslint-disable-next-line @typescript-eslint/no-var-requires
// window.initialNotebookContent = require("./debugNotebooks/dynamicNewCellType.nb").default;

document.body.innerHTML += `
<base target="_parent" />
<starboard-notebook></starboard-notebook>
`;
