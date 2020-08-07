/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { CellEvent, NotebookContent } from "./types";
import { ConsoleCatcher } from "../console/console";
import { CellElement } from "../components/cell";
import { StarboardNotebook } from "../components/notebook";

export * from "./types";

export interface Runtime {

    /**
     * Contains HTML elements in this notebook runtime.
     */
    dom: {
        notebook: StarboardNotebook;
        cells: CellElement[];
    };

    /**
     * Event bus for a notebook, used to propagate messages upwards such as "focus on the next cell".
     */
    emit: (e: CellEvent) => void;

    /**
     * The state of the notebook that exactly describes the text in the notebook.
     */
    content: NotebookContent;

    /**
     * Used to coordinate listening to the console hook.
     */
    consoleCatcher: ConsoleCatcher;
}
