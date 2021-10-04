/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export * from "./inbound";
export * from "./outbound";

/**
 * Description of the content of the notebook
 */
export type NotebookMessageContentData = string;

/**
 * The base type of a message sent to or from an iframe containing a Starboard Notebook.
 */
export type NotebookMessage<Name extends string, PayloadType> = {
  type: Name;
  payload: PayloadType;
};
