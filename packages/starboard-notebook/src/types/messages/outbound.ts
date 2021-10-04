/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { NotebookMessage, NotebookMessageContentData } from ".";

export type OutboundNotebookMessage = ContentUpdateMessage | ReadySignalMessage | SaveMessage | ResizeMessage;

/**
 * Sent from notebook to parent webpage when the textual representation of the notebook changes in any way.
 * E.g. whenever a character is typed.
 *
 * There is some debouncing/rate limiting to ensure this doesn't fire too often.
 */
export type ContentUpdateMessage = NotebookMessage<"NOTEBOOK_CONTENT_UPDATE", { content: NotebookMessageContentData }>;

/**
 * Sent from notebook when it is ready to receive the initial content.
 */
export type ReadySignalMessage = NotebookMessage<
  "NOTEBOOK_READY_SIGNAL",
  {
    /**
     * Version of these communication messages, currently always 1.
     */
    communicationFormatVersion: 1;

    /**
     * The content at the time of the ready signal, this will likely be an empty string, but can be
     * actual content in case the notebook content gets set from within the iframe.
     */
    content: NotebookMessageContentData;

    runtime: {
      name: "starboard-notebook";
      /**
       * The version of Starboard Notebook
       */
      version: string;
    };
  }
>;

/**
 * Sent from notebook to parent webpage when the user initiates a save (e.g. by pressing CTRL+S on Windows).
 */
export type SaveMessage = NotebookMessage<"NOTEBOOK_SAVE_REQUEST", { content: NotebookMessageContentData }>;

export type ResizeMessage = NotebookMessage<"NOTEBOOK_RESIZE_REQUEST", { width: number; height: number }>;
