/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

function dec2hex(dec: number) {
  return dec < 10 ? "0" + String(dec) : dec.toString(16);
}

export function generateUniqueId(length: number) {
  const arr = new Uint8Array((length || 40) / 2);
  crypto.getRandomValues(arr);
  return Array.from(arr, dec2hex).join("");
}

export function generateUniqueCellId() {
  return "cell-" + generateUniqueId(12);
}
