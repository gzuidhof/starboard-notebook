/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Required for jsesc which expects a global Buffer object to be available */

if (!(globalThis as any).Buffer) {
  (globalThis as any).Buffer = {
    isBuffer: () => false,
  };
}
