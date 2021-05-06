/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Runtime } from "..";

export interface StarboardPlugin<
  PluginRegisterOpts = any,
  PluginExports extends Record<string, any> | undefined = any
> {
  /**
   * Unique identifier for this plugin.
   */
  id: string;

  metadata: {
    /**
     * Name of the plugin (for humans)
     */
    name: string;
    version?: string;
  };

  exports: PluginExports;

  /**
   * Called automatically when the plugin gets registered, use this to create any DOM elements or register any cell types.
   */
  register(runtime: Runtime, opts?: PluginRegisterOpts): Promise<void> | void;

  [key: string]: any;
}
