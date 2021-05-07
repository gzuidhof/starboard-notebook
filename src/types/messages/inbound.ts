/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { NotebookMetadata } from "../core";
import { NotebookMessage, NotebookMessageContentData } from ".";

export interface NotebookInitPayload {
  content: NotebookMessageContentData;
  baseUrl?: string;
}

export interface NotebookSetMetadataPayload {
  metadata: NotebookMetadata;
}

export type InboundNotebookMessage = SetContentMessage | ReloadMessage | SetMetdataMessage;

/**
 * Sent from parent webpage to notebook to set the initial content and configuration of the notebook.
 */
export type SetContentMessage = NotebookMessage<"NOTEBOOK_SET_INIT_DATA", NotebookInitPayload>;

/**
 * Sent from parent webpage to notebook to overwrite the metadata
 */
export type SetMetdataMessage = NotebookMessage<"NOTEBOOK_SET_METADATA", NotebookSetMetadataPayload>;

/**
 * Sent from parent webpage to notebook to trigger a page refresh of the iframe, this is somewhat equivalent to a "kernel reset" in Jupyter.
 */
export type ReloadMessage = NotebookMessage<"NOTEBOOK_RELOAD_PAGE", undefined>;
