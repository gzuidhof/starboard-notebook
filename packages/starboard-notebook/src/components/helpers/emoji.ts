/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import MarkdownIt from "markdown-it";
import emoji from "markdown-it-emoji";

export function hookMarkdownItToEmojiPlugin(markdownItInstance: MarkdownIt, withShortcuts = false) {
  markdownItInstance.use(emoji, { shortcuts: withShortcuts ? undefined : {} });
}
