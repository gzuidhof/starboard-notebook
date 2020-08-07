/* eslint-disable no-prototype-builtins */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Inserts HTML element into parent's children at given index.
 * @param parent
 * @param child element to be inserted
 * @param index where to insert, should be a positive number, defaults to 0.
*/
export function insertHTMLChildAtIndex(parent: HTMLElement, child: HTMLElement, index = 0) {
    if (index >= parent.children.length) {
      parent.appendChild(child);
    } else {
      parent.insertBefore(child, parent.children[index]);
    }
}
