/*! This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { StarboardNotebookElement } from "./components/notebook";
import "./init";

const baseEl = document.createElement("base");
baseEl.target = "_parent";
document.head.append(baseEl);

const notebookEl = new StarboardNotebookElement();
document.body.append(notebookEl);
