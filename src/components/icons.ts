/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { html } from "lit-html";

export function StarboardLogo({ width = 24, height = 24, hidden = false, title = 'Starboard Moon Logo' } = {}) {
  return html`<svg width="${width}" height="${height}" fill="currentColor" viewBox="0 0 31.954 33.005"
  xmlns="http://www.w3.org/2000/svg" aria-hidden="${hidden ? 'true' : 'false'}" role="img" fill="currentColor"
  aria-label="${title}">
  <g transform="translate(-35.386 -36.649)">
    <path transform="scale(.26458)"
      d="m190.22 142.29a58.783 58.783 0 0 0-52.697 58.4 58.783 58.783 0 0 0 58.783 58.783 58.783 58.783 0 0 0 54.43-36.678 63.532 63.532 0 0 1-62.902-63.5 63.532 63.532 0 0 1 2.3867-17.006z" />
  </g>
</svg>`;
}

export function EyeSlashIcon({ width = 24, height = 24, hidden = false, title = "Eye slash" } = {}) {
  return html`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" fill="currentColor" class="bi bi-eye-slash"
  viewBox="0 0 16 16" aria-label="${title}" aria-hidden="${hidden ? 'true' : 'false'}">
  <path
    d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z" />
  <path
    d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z" />
  <path
    d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z" />
</svg>`;
}

export function EyeSlashFilledIcon({ width = 24, height = 24, hidden = false, title = "Eye filled slash" } = {}) {
  return html`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" aria-label="${title}"
  aria-hidden="${hidden ? 'true' : 'false'}" fill="currentColor" class="bi bi-eye-slash-fill" viewBox="0 0 16 16">
  <path
    d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7.029 7.029 0 0 0 2.79-.588zM5.21 3.088A7.028 7.028 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474L5.21 3.089z" />
  <path
    d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829l-2.83-2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12-.708.708z" />
</svg>`;
}

export function ChevronBarExpandIcon({ width = 24, height = 24, hidden = false, title = "Chevron bar expand" } = {}) {
  return html`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" fill="currentColor"
  class="bi bi-chevron-bar-expand" viewBox="0 0 16 16" aria-hidden="${hidden ? 'true' : 'false'}" aria-label="${title}">
  <path fill-rule="evenodd"
    d="M3.646 10.146a.5.5 0 0 1 .708 0L8 13.793l3.646-3.647a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 0-.708zm0-4.292a.5.5 0 0 0 .708 0L8 2.207l3.646 3.647a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 0 0 0 .708zM1 8a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 8z" />
</svg>`;
}

export function CodeIcon({ width = 24, height = 24, hidden = false, title = "Code" } = {}) {
  return html`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" fill="currentColor" class="bi bi-code" viewBox="0 0 16 16" aria-hidden="${hidden ? 'true' : 'false'}" aria-label="${title}">
  <path d="M5.854 4.854a.5.5 0 1 0-.708-.708l-3.5 3.5a.5.5 0 0 0 0 .708l3.5 3.5a.5.5 0 0 0 .708-.708L2.707 8l3.147-3.146zm4.292 0a.5.5 0 0 1 .708-.708l3.5 3.5a.5.5 0 0 1 0 .708l-3.5 3.5a.5.5 0 0 1-.708-.708L13.293 8l-3.147-3.146z"/>
</svg>`;
}

// export function JournalCodeIcon({ width = 24, height = 24, hidden = false, title = "Journal Code" } = {}) {
//   return html`
//   <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" fill="currentColor" class="bi bi-journal-code"
//     viewBox="0 0 16 16" aria-hidden="${hidden ? 'true' : 'false'}" aria-label="${title}">
//     <path fill-rule="evenodd"
//       d="M8.646 5.646a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L10.293 8 8.646 6.354a.5.5 0 0 1 0-.708zm-1.292 0a.5.5 0 0 0-.708 0l-2 2a.5.5 0 0 0 0 .708l2 2a.5.5 0 0 0 .708-.708L5.707 8l1.647-1.646a.5.5 0 0 0 0-.708z" />
//     <path
//       d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z" />
//     <path
//       d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z" />
//   </svg>`;
// }
