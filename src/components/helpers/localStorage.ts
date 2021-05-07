/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export function trySetLocalStorage(key: string, value: any) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Could not set localStorage (key = ${key}).`);
  }
}
