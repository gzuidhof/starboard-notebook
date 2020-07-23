/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import "./styles/main.scss";
import "./components/notebook";

import "iframe-resizer/js/iframeResizer.contentWindow.js";

import "@spectrum-web-components/theme";
import "@spectrum-web-components/button";
import "@spectrum-web-components/menu";
import "@spectrum-web-components/menu-group";
import "@spectrum-web-components/menu-item";
import "@spectrum-web-components/dropdown";
import "@spectrum-web-components/popover";

// Globals available to the user in the notebook
import * as lithtml from "lit-html";
(window as any).html = lithtml.html;
(window as any).svg = lithtml.svg;
(window as any).lithtml = lithtml;

document.body.innerHTML += `
<starboard-notebook></starboard-notebook>
`;
