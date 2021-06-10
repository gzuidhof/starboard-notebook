/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Cell } from "../../../types";

function createOnChangeProxy(onChange: () => void, target: any): any {
  return new Proxy(target, {
    get(target, property) {
      const item = target[property];
      if (item && typeof item === "object") {
        return createOnChangeProxy(onChange, item);
      }
      return item;
    },
    deleteProperty(target, property) {
      const retVal = delete target[property];
      onChange();
      return retVal;
    },
    set(target, property, newValue) {
      if (newValue === undefined) {
        delete target[property];
      } else {
        target[property] = newValue;
      }
      onChange();
      return true;
    },
  });
}

/**
 * Wraps given cell in a proxy. This proxy will call the changedCallback whenever the cell changes in
 * such a way that would change the text representation of the cell.
 * @param cell
 * @param changedCallback
 */
export function createCellProxy(cell: Cell, changedCallback: () => void) {
  const metadataProxy = createOnChangeProxy(changedCallback, cell.metadata);

  return new Proxy(cell, {
    get: (target: Cell, prop: string) => {
      if (prop === "metadata") {
        return metadataProxy;
      }
      return (target as any)[prop];
    },
    set: (target: Cell, prop: string, value: any) => {
      if (prop === "textContent") {
        if (typeof value !== "string") {
          throw new TypeError("textContent must be a string");
        }
      } else if (prop === "id") {
        throw new Error("ID can not be changed.");
      }

      (target as any)[prop] = value;
      changedCallback();

      return true;
    },
  });
}
