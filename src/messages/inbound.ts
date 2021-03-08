/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { NotebookMessage, NotebookMessageContentData } from "./types";

export interface NotebookInitPayload {
    content: NotebookMessageContentData;
    baseUrl?: string;
}

export type InboundNotebookMessage = SetContentMessage | ReloadMessage;

/**
 * Sent from parent webpage to notebook to set the initial content and configuration of the notebook.
 */
export type SetContentMessage = NotebookMessage<"NOTEBOOK_SET_INIT_DATA", NotebookInitPayload>;

/**
 * Sent from parent webpage to notebook to trigger a page refresh of the iframe, this is somewhat equivalent to a "kernel reset" in Jupyter.
 */
export type ReloadMessage = NotebookMessage<"NOTEBOOK_RELOAD_PAGE", undefined>;
