/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Cell } from "../core";

export type InsertCellEvent = CustomEvent<{
  id: string;
  position: "before" | "after";
  data?: Partial<Cell>;
}>;
export type RunCellEvent = CustomEvent<{
  id: string;
}>;
export type RemoveCellEvent = CustomEvent<{
  id: string;
}>;

export type ChangeCellTypeEvent = CustomEvent<{
  id: string;
  newCellType: string;
}>;

/** Resets the given cell, recreating the entire thing. */
export type ResetCellEvent = CustomEvent<{
  id: string;
}>;

export type FocusCellEvent = CustomEvent<{
  id: string;
  focusTarget?: "previous" | "next";
}>;

export type MoveCellEvent = CustomEvent<{
  id: string;
  /** +1 for down, -1 for up */
  amount: number;
}>;

export type SaveEvent = CustomEvent<Record<string, never>>;

export interface StarboardEventMap {
  "sb:run_cell": RunCellEvent;
  "sb:insert_cell": InsertCellEvent;
  "sb:change_cell_type": ChangeCellTypeEvent;
  "sb:remove_cell": RemoveCellEvent;
  "sb:reset_cell": ResetCellEvent;
  "sb:focus_cell": FocusCellEvent;
  "sb:move_cell": MoveCellEvent;
  "sb:save": SaveEvent;
}
