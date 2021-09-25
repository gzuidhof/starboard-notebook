/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Cell, NotebookContent } from "../types";
import * as YAML from "js-yaml";
import { generateUniqueCellId } from "../components/helpers/random";

const eol = /\r\n|\r|\n/g;

// [optionally "#" or "//"], any whitespace, "%" at least twice, any amount of -
// OR legacy mode (deprecated): %% followed by optional single whitespace, and any lowercase letter
// Example: # %%
export const CellDelimiterRegex = /(^(#|\/\/)\s*%{2,}-*)|(^%%\s?[a-z])/;
// If the matched part of the `CellDelimiterRegex` above contains this it's the start of a cell metadata block
// The part within the capture group is the comment delimiter that will be removed from all subsequent lines
const CellMetadataStartDelimiterRegex = /([^%]*)%%---/;

// "#" or "//", any whitespace, at least 3 -, "%" at least twice, end of line
// Example: # ---%
const CellMetadataEndDelimiterRegex = /^(#|\/\/)\s*-{3,}%{2,}$/;

const CellTypeIdentifierRegex = /\[[a-zA-Z0-9-_]*\]/;

const NotebookMetadataDelimiterRegex = /^---$/;

export interface ParsedCell {
  type: string;
  metadata: any;
  lines: string[];
}

export function textToNotebookContent(text: string) {
  const { cells: parsedCells, metadata } = parseNotebookContent(text);

  const cells: Cell[] = parsedCells.map((pc) => {
    const cellMetadata = {
      properties: {}, // The properties key is always present
      ...pc.metadata,
    };

    return {
      cellType: pc.type,
      textContent: pc.lines.join("\n"),
      metadata: cellMetadata,
      id: pc.metadata.id || generateUniqueCellId(),
    };
  });

  const nbContent: NotebookContent = {
    metadata: metadata,
    cells,
  };
  return nbContent;
}

function parseLegacyCellDelimiter(line: string): ParsedCell {
  const flags = line.split(/[ \t]+/).filter((s) => s !== "" && s.match(/^%*$/) === null);
  if (flags.length === 0) {
    console.error("Issue in parsing: invalid legacy cell header without cell type");
    return {
      type: "",
      metadata: {},
      lines: [],
    };
  }
  const [type, ...properties] = flags;
  const propertiesAsObject: { [name: string]: true } = {};
  properties.forEach((p) => {
    if (p === "runOnLoad") p = "run_on_load"; // For backwards compatibility.
    propertiesAsObject[p] = true;
  });
  return {
    type,
    metadata: {
      properties: propertiesAsObject,
    },
    lines: [],
  };
}

/**
 * Parses the given notebook file content string into the frontmatter and ParsedCell structure.
 */
export function parseNotebookContent(notebookContentString: string) {
  const allLines = notebookContentString.split(eol);

  // The index at which the cells start
  let cellLinesStartIndex = undefined;
  let notASingleCellPresent = false;

  // The index of the first line that only contains ---
  let yamlHeaderStartIndex = undefined;
  // The index of the second line that only contains ---
  let yamlHeaderEndIndex = undefined;

  // All lines before the first cell make up the front matter.
  for (const [i, line] of allLines.entries()) {
    if (NotebookMetadataDelimiterRegex.test(line)) {
      if (yamlHeaderStartIndex === undefined) {
        yamlHeaderStartIndex = i;
      } else if (yamlHeaderEndIndex === undefined) {
        yamlHeaderEndIndex = i;
      } else {
        console.error(
          "Multiple notebook YAML headers were found (at least three lines with only '---'), only the first will be used"
        );
      }
    }
    if (CellDelimiterRegex.test(line)) {
      cellLinesStartIndex = i;
      break;
    }
    if (i === allLines.length - 1) {
      notASingleCellPresent = true;
    }
  }

  let metadata = {};
  if (yamlHeaderStartIndex !== undefined) {
    if (yamlHeaderEndIndex === undefined) {
      console.warn("Notebook YAML header didn't have closing '---', all lines before the first cell will be used");
      yamlHeaderEndIndex = cellLinesStartIndex !== undefined ? cellLinesStartIndex : allLines.length;
    }

    if (cellLinesStartIndex !== yamlHeaderEndIndex) {
      const nonEmptyLines = allLines.slice(yamlHeaderEndIndex + 1, cellLinesStartIndex).filter((s) => s.trim() !== "");
      if (nonEmptyLines.length > 0) {
        console.warn(
          "Content detected in between YAML header and the first cell:",
          nonEmptyLines,
          "these lines will be dropped from the notebook"
        );
      }
    }

    try {
      metadata = YAML.load(allLines.slice(yamlHeaderStartIndex + 1, yamlHeaderEndIndex).join("\n")) || {};
      if (typeof metadata !== "object") {
        throw new Error("Failed to parse notebook metadata - it should be a map at the root.");
      }
    } catch (e) {
      // The metadata is invalid, throw error - we can't recover.
      console.error("Notebook metadata failed to parse");
      throw e;
    }
  } else if (notASingleCellPresent && allLines.filter((x) => x.trim() !== "").length > 0) {
    console.error(
      "Notebook failed to parse: no valid metadata was present and no cell was found, is this a valid notebook file?"
    );
    throw new Error("Starboard Notebook parse fail: no valid content");
  }

  const cells: ParsedCell[] = [];

  if (cellLinesStartIndex === undefined) {
    return {
      cells,
      metadata,
    };
  }

  let currentCell: ParsedCell | undefined = undefined;
  let currentlyInCellMetadataBlock = false;
  let currentCellMetadataCommentPrefix = "";

  for (const line of allLines.slice(cellLinesStartIndex)) {
    const cellDelimiterMatches = CellDelimiterRegex.exec(line);
    if (cellDelimiterMatches !== null) {
      // Start a new cell - here we parse the initial line that starts a new cell
      if (currentlyInCellMetadataBlock) {
        console.error("Previous cell YAML metadata block was not closed when new cell started.");
        currentlyInCellMetadataBlock = false;
      }

      const cellTypeMatches = CellTypeIdentifierRegex.exec(line);

      if (!cellTypeMatches) {
        // No cell type is defined like [javascript]
        if (line.startsWith("%%")) {
          // Deprecated: here for old format compatibility - no square brackets are used here.
          currentCell = parseLegacyCellDelimiter(line);
        } else {
          // Invalid cell, it doesn't have a type, we will handle this by creating a cell with the empty string as cell type.
          currentCell = {
            type: "",
            metadata: {},
            lines: [],
          };
        }
      } else {
        currentCell = {
          type: cellTypeMatches[0].replace(/[[\]]/g, ""),
          metadata: {},
          lines: [],
        };
      }

      const cellMetadataStartMatches = CellMetadataStartDelimiterRegex.exec(cellDelimiterMatches[0]);
      if (cellMetadataStartMatches) {
        currentlyInCellMetadataBlock = true;
        currentCellMetadataCommentPrefix = cellMetadataStartMatches[1];
      }
      cells.push(currentCell);
    } else {
      // No new cell was started, add the lines to the current cell
      if (!currentCell) {
        // This should never happen as it would otherwise have been frontmatter
        console.error("Current cell was undefined in parsing cell contents");
      } else {
        if (currentlyInCellMetadataBlock) {
          if (CellMetadataEndDelimiterRegex.test(line)) {
            try {
              // This is the end of the YAML block at the start of a cell, parse the lines as yaml.
              currentCell.metadata = YAML.load(currentCell.lines.join("\n")) || {};
              if (typeof currentCell.metadata !== "object") {
                console.error(
                  `Cell (type: ${currentCell.type}) has invalid metadata (${JSON.stringify(
                    currentCell.lines
                  )}), it must be a YAML map (e.g. not a primitive value or an array).`
                );
              }
            } catch (e) {
              console.error(
                `Cell (type: ${currentCell.type}) metadata (${JSON.stringify(
                  currentCell.lines
                )}) could not be parsed: ${e}, its metadata will be empty.`
              );
            }

            currentCell.lines = [];
            currentlyInCellMetadataBlock = false;
          } else {
            currentCell.lines.push(line.replace(currentCellMetadataCommentPrefix, ""));
          }
        } else {
          // Just an ordinary line in a cell
          currentCell.lines.push(line);
        }
      }
    }
  }

  return {
    cells,
    metadata,
  };
}
