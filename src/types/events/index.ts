/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Cell } from "../core";

declare global {
  interface HTMLElementEventMap {
    "sb:run_cell": RunCellEvent;
    "sb:insert_cell": InsertCellEvent;
    "sb:change_cell_type": ChangeCellTypeEvent;
    "sb:set_cell_property": SetCellPropertyEvent;
    "sb:remove_cell": RemoveCellEvent;
    "sb:reset_cell": ResetCellEvent;
    "sb:focus_cell": FocusCellEvent;
    "sb:clear_cell": ClearCellEvent;
    "sb:move_cell": MoveCellEvent;
    "sb:save": SaveEvent;
  }
}

export interface StarboardEventMap {
  "sb:run_cell": RunCellEvent;
  "sb:insert_cell": InsertCellEvent;
  "sb:change_cell_type": ChangeCellTypeEvent;
  "sb:set_cell_property": SetCellPropertyEvent;
  "sb:remove_cell": RemoveCellEvent;
  "sb:reset_cell": ResetCellEvent;
  "sb:focus_cell": FocusCellEvent;
  "sb:clear_cell": ClearCellEvent;
  "sb:move_cell": MoveCellEvent;
  "sb:save": SaveEvent;
}

export type StarboardEventName = keyof StarboardEventMap;
export type StarboardEvent = StarboardEventMap[keyof StarboardEventMap];
export type StarboardEventInitDict<EV extends CustomEvent> = EV["detail"];

export type InsertCellOptions = {
  adjacentCellId?: string;
  position: "before" | "after" | "notebookEnd";
  data?: Partial<Cell>;
};
export type InsertCellEvent = CustomEvent<InsertCellOptions>;

export type RunCellOptions = { id: string };
export type RunCellEvent = CustomEvent<RunCellOptions>;

export type RemoveCellOptions = { id: string };
export type RemoveCellEvent = CustomEvent<RemoveCellOptions>;

export type ChangeCellTypeOptions = {
  id: string;
  newCellType: string;
};
export type ChangeCellTypeEvent = CustomEvent<ChangeCellTypeOptions>;

export type SetCellPropertyOptions = { id: string; property: string; value: any };
export type SetCellPropertyEvent = CustomEvent<SetCellPropertyOptions>;

export type ResetCellOptions = { id: string };
/** Resets the given cell, recreating the entire thing. */
export type ResetCellEvent = CustomEvent<ResetCellOptions>;

export type FocusCellOptions = {
  id: string;
  focusTarget?: "previous" | "next";
};
export type FocusCellEvent = CustomEvent<FocusCellOptions>;

export type ClearCellOptions = { id: string };
export type ClearCellEvent = CustomEvent<ClearCellOptions>;

export type MoveCellOptions = {
  id: string;
  fromIndex: number;
  toIndex: number;
};
export type MoveCellEvent = CustomEvent<MoveCellOptions>;

export type SaveEvent = CustomEvent<Record<string, never>>;
