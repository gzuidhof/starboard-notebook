/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { split } from "eol";
import { NotebookContent, Cell } from "../types";
import { uuid } from "uuidv4";

export interface ParsedCell {
    type: string;
    properties: string[];
    lines: string[];
}

export function textToNotebookContent(text: string) {
  const {cells: parsedCells, frontMatter} = parseNotebookContent(text);

  const cells: Cell[] = parsedCells.map((pc) => {

      // All properties right now are just boolean flags that are undefined by default
      const properties: {[k: string]: true} = {};
      pc.properties.forEach((k) => properties[k] = true);

      return {
          cellType: pc.type,
          textContent: pc.lines.join("\n"),
          properties: properties,
          id: uuid(),
      };
  });

  const nbContent: NotebookContent = {
      frontMatter,
      cells,
  };
  return nbContent;
}

/**
 * Parses the given notebook file content string into the frontmatter and ParsedCell structure.
 */
export function parseNotebookContent(notebookContentString: string) {
    const allLines = split(notebookContentString);

    // All lines after the frontmatter
    let cellLines: string[] = [];
    
    let frontMatter = "";
    // All lines before the first cell make up the front matter.
    for (const [i, line] of allLines.entries()) {
        if (line.slice(0, 2) === "%%") {
          frontMatter = i > 0 ? allLines.slice(0, i).join("\n") + "\n" : "";
          cellLines = allLines.slice(i);
          break;
        }
    }

    const cells = [];

    let currentCell: ParsedCell | undefined = undefined;

    for (const line of cellLines) {

      if (line.slice(0, 2) === "%%") { // Start a new cell
        const flags = line.split(/[ \t]+/).filter(s => s !== "" && s.match(/^%*$/) === null);
        if (flags.length === 0) { // Invalid cell, it only has %%, we will handle this anyway by creating a cell with the empty string as cell type.
          currentCell = {
            type: "",
            properties: [],
            lines: []
          };
        } else { // A new cell is started
          const [type, ...properties] = flags;
          currentCell = {
            type,
            properties,
            lines: []
          };
        }
        cells.push(currentCell);
      } else { // No new cell was started
        if (!currentCell) { // This should never happen..
          console.error("Current cell was undefined in parsing cell contents");
          frontMatter += "\n" + line;
        } else {
          currentCell.lines.push(line);
        }
      }
    }

    return {
      frontMatter,
      cells
    };
  }
