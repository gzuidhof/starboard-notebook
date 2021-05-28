/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// Based on https://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
export function arrayMoveElement<T>(arr: T[], fromIndex: number, toIndex: number) {
  if (toIndex >= arr.length) {
    let k = toIndex - arr.length + 1;
    while (k--) {
      arr.push(undefined as any);
    }
  }
  arr.splice(toIndex, 0, arr.splice(fromIndex, 1)[0]);
  return arr; // for testing
}
