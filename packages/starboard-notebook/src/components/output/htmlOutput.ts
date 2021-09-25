/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { html, render } from "lit";
import { isProbablyTemplateResult } from "../../cellTypes/javascript/util";

export function renderIfHtmlOutput(val: any, intoElement: HTMLElement) {
  let didRender = false;
  if (val instanceof HTMLElement) {
    intoElement.appendChild(val);
    didRender = true;
  } else if (isProbablyTemplateResult(val)) {
    render(html`${val}`, intoElement);
    didRender = true;
  }

  if (didRender) {
    intoElement.classList.add("cell-output-html");
  }

  return didRender;
}
