/*! This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

function getCurrentScriptPrefix() {
  const cs = document.currentScript as HTMLScriptElement | null;
  if (cs) {
    return cs.src.substring(0, cs.src.lastIndexOf("/") + 1);
  }
}

// @ts-ignore
__webpack_public_path__ = window.starboardArtifactsUrl || getCurrentScriptPrefix() || "./";
