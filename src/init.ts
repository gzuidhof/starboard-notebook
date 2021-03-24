/*! This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import "./styles/main.scss";
import "./components/notebook";

import "iframe-resizer/js/iframeResizer.contentWindow.js";
import * as lithtml from "lit-html";

import * as YAML from "yaml";
import { katexEventualPromise, katexLoader } from "./components/helpers/katex";
import katex from "katex";
import { RuntimeConfig } from "./runtime";

declare global {
  interface Window {
    initialNotebookContent?: string;
    runtimeConfig?: Partial<RuntimeConfig>;
  
    html: typeof lithtml.html;
    svg: typeof lithtml.svg;
    litHtml: typeof lithtml;
    katex?: typeof katex;
    katexLoader: typeof katexLoader;
    YAML: typeof YAML;
  }
}

// Globals available to the user in the notebook (excluding runtime, which is initialized in the notebook itself)
window.html = lithtml.html;
window.svg = lithtml.svg;
window.litHtml = lithtml;
window.YAML = YAML;

window.katexLoader = katexLoader;
katexEventualPromise.then(m => window.katex = m.katex);

// eslint-disable-next-line @typescript-eslint/no-var-requires
// window.initialNotebookContent = require("./debugNotebooks/latex.nb").default;
