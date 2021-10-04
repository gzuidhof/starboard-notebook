/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Precompile takes a cell's code as a string, parses it and transforms it.
 * In particular it wraps everything in an async function, handles the var->global magic,
 * and its output can be used to set $_ to the last statement.
 */
export async function precompileJavascriptCode(content: string): Promise<string> {
  const prc = import(/* webpackChunkName: "babel-precompile", webpackPrefetch: true */ "./precompileModule");

  return (await prc).precompileJavascriptCode(content);
}
