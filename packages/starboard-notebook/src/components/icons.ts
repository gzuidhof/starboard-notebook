/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { html } from "lit";

export function StarboardLogo({ width = 24, height = 24, hidden = false, title = "Starboard Moon Logo" } = {}) {
  return html`<svg
    width="${width}"
    height="${height}"
    fill="currentColor"
    viewBox="0 0 31.954 33.005"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="${hidden ? " true" : "false"}"
    role="img"
    fill="currentColor"
    aria-label="${title}"
  >
    <g transform="translate(-35.386 -36.649)">
      <path
        transform="scale(.26458)"
        d="m190.22 142.29a58.783 58.783 0 0 0-52.697 58.4 58.783 58.783 0 0 0 58.783 58.783 58.783 58.783 0 0 0 54.43-36.678 63.532 63.532 0 0 1-62.902-63.5 63.532 63.532 0 0 1 2.3867-17.006z"
      />
    </g>
  </svg>`;
}
