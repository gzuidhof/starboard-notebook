/*! This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import "./styles/main.scss";
import "./components/notebook";

import * as lit from "lit";

import { RuntimeConfig } from "./types";

declare global {
  interface Window {
    initialNotebookContent?: string;
    starboardArtifactsUrl?: string;
    runtimeConfig?: Partial<RuntimeConfig>;

    html: typeof lit.html;
    svg: typeof lit.svg;
    lit: typeof lit;
  }
}

// Globals available to the user in the notebook (excluding runtime, which is initialized in the notebook itself)
window.html = lit.html;
window.svg = lit.svg;
window.lit = lit;

// eslint-disable-next-line @typescript-eslint/no-var-requires
// window.initialNotebookContent = require("./debugNotebooks/events.nb").default;
