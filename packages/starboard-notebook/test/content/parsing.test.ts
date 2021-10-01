/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { CellDelimiterRegex } from "../../src/content/parsing";

describe("Cell delimiter parsing", () => {
  const validDelimiters = [
    // Old style supported for legacy reasons (version 0.5.6 and older) - support to be removed at some point.
    "%% js",
    "%% javascript",

    "# %% [javascript]",
    "// %% [javascript]",

    "# %%%%% [javascript]",
    "#%% [javascript]",
    "#%%%%% [javascript]",
    "# %%- [javascript]",
    "# %%-- [javascript]",
    "# %%--- [javascript]",
    "// %%--- [javascript]",
    "# %%%%--- [javascript]",

    // Valid.. but please don't do this. It's just ignored
    "# %%a-title [javascript]",
    "// %%a-title [javascript]",
    "# %% a-title [javascript]",
    "# %% a-title a-title [javascript]",

    // Valid.. but less than ideal
    "# %%[javascript]",

    // Without cell type should also be supported for near compatability with Jupytext
    "# %%---",
    "# %%",
  ];

  test.each(validDelimiters)("matches on valid delimiter(`%s`)", (delimiterString: string) => {
    const matchResults = CellDelimiterRegex.exec(delimiterString);
    expect(matchResults).not.toBeNull();

    if (delimiterString.indexOf("a-title") === -1 && delimiterString.substring(0, 2) !== "%%") {
      // Check if it matches the correct part (everything before any whitespace, title and [javascript])
      // This does not apply to the legacy format that starts with %%
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(matchResults![0]).toEqual(delimiterString.replace(/\s*\[?(js|javascript)\]?/, ""));
    }
  });

  const invalidDelimiters = [
    // Whitespace before the delimiter
    " # %% [javascript]",
    " // %% [javascript]",

    // Too many comment characters
    "## %% [javascript]",
    "/// %% [javascript]",

    // Whitespace or characters in between %
    "# % % [javascript]",
    "# %-% [javascript]",
    "# %a% [javascript]",

    // A normal comment, should definitely not match
    "#",
    "//",
    // The legacy format always needs a cell type
    "%%",
    "%% ",
    "%% -",
  ];

  test.each(invalidDelimiters)("does not match on invalid delimiter(`%s`)", (delimiterString: string) => {
    const matchResults = CellDelimiterRegex.exec(delimiterString);
    expect(matchResults).toBeNull();
  });
});
