/* eslint-disable no-prototype-builtins */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
export function isProbablyTemplateResult(value: any) {
  if (typeof value !== "object") {
    return false;
  }
  if (value === null) {
    return false;
  }

  if (value.hasOwnProperty("_$litType$") && value.hasOwnProperty("values") && value.hasOwnProperty("strings")) {
    return true;
  }
  return false;
}

/**
 * Checks the state of a promise more or less 'right now'.
 * @param p
 */
export function promiseState(p: Promise<any>): Promise<"pending" | "fulfilled" | "rejected"> {
  const t = {};
  return Promise.race([p, t]).then(
    (v) => (v === t ? "pending" : "fulfilled"),
    () => "rejected"
  );
}
