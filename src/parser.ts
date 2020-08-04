/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import {split} from "eol";

export interface ParsedCell {
    type: string;
    properties: string[];
    lines: string[];
}

export function parseNotebookContent(notebookContentString: string) {
    const allLines = split(notebookContentString);

    // All lines after the frontmatter
    let cellLines: string[] = [];
    
    let frontMatter = "";
    // All lines before the first cell make up the front matter.
    for (const [i, line] of allLines.entries()) {
        if (line.slice(0, 2) === "%%") {
          frontMatter = allLines.slice(0, i).join("\n");
          cellLines = allLines.slice(i);
          break;
        }
    }

    const cells = [];

    let currentCell: ParsedCell | undefined = undefined;

    for (const line of cellLines) {

      if (line.slice(0, 2) === "%%") {
        const flags = line.split(/[ \t]+/).filter(s => s !== "" && s.match(/^%*$/) === null);
        if (flags.length === 0) { // Invalid cell as it only has the "%%" bit
          // To be robust against this error we will simply add this as text to the current cell or frontmatter
          // but we can only do that if at least one cell was parsed so far, otherwise we add it to the frontmatter.

          // No code here, it will continue with the code after the if so there is no need to repeat that

        } else { // A new cell is started
          const [type, ...properties] = flags;
          currentCell = {
            type,
            properties,
            lines: []
          };
          cells.push(currentCell);
          continue;
        }
      }

      if (currentCell === undefined) { // This really only happens in case of an invalid notebook cell header
        frontMatter += line + "\n";
      }
      else {
        currentCell.lines.push(line);
      }
    }

    return {
      frontMatter,
      cells
    };
  }
