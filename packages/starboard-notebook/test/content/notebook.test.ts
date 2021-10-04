/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { textToNotebookContent } from "../../src/content/parsing";
import { notebookContentToText } from "../../src/content/serialization";

const simpleNotebookPlaintext = `# %% [markdown]
# Notebook
Hello there!

# %%--- [js]
# properties:
#   run_on_load: true
# ---%%
const x = 5;
x;

# %% [unknown-cell-type]
`;

const notebookWithCellProperties = `# %%--- [javascript]
# properties:
#   run_on_load: true
#   another: value
# ---%%
`;

const withInvalidCell = `# %% [javascript]
const a = 123;
// Cell below is missing a type, so it should not start a new cell.
%%
const x = 3;
`;

const totallyInvalidNotebook = `There are no cells, just chaos!`;

const emptyNotebook = ``;

const metadataOnlyNotebook = `---
abc: def
---
`;

const metadataOnlyNotebookWithNoise = `---
abc: def
---
qwerty
`;

const metadataNotebookWithNoiseAndCell = `---
abc: def
---
qwerty
# %% [javascript]`;

const metadataOnlyNotebookWithMissingYamlHeaderEnd = `---
abc: def`;

const metadataNotebookWithMissingYamlHeaderEndAndCell = `---
abc: def
# %% [javascript]`;

const metadataNotebookWithWrongMetadataType = `---
1234
---`;

const wrongCellMetadataType = `# %%--- [javascript]
# 1234
# ---%%`;

const invalidCellMetadataType = `# %%--- [javascript]
# a:
# :b
# ---%%`;

const emptyCellMetadata = `# %%--- [javascript]
# ---%%`;

describe("Text to notebook content", () => {
  it("can parse a simple notebook", async () => {
    const notebookContent = textToNotebookContent(simpleNotebookPlaintext);

    expect(notebookContent.cells).toHaveLength(3);
    const firstCell = notebookContent.cells[0];
    expect(firstCell.cellType).toEqual("markdown");
    expect(firstCell.textContent.split("\n")).toHaveLength(3);
    expect(notebookContent.cells[2].cellType).toEqual("unknown-cell-type");
  });

  it("can parse empty notebook", async () => {
    const notebookContent = textToNotebookContent(emptyNotebook);
    expect(notebookContent.cells).toHaveLength(0);
    expect(notebookContent.metadata).toEqual({});
    expect(notebookContentToText(notebookContent)).toEqual("");
  });

  it("stays the same in text -> nb -> text -> nb", () => {
    const notebookContent = textToNotebookContent(simpleNotebookPlaintext);
    const generatedNotebookText = notebookContentToText(notebookContent);
    const notebookContentAgain = textToNotebookContent(generatedNotebookText);

    // No longer true for legacy books as they will be rewritten into new format
    expect(generatedNotebookText).toEqual(simpleNotebookPlaintext);

    for (let i = 0; i < notebookContent.cells.length; i++) {
      expect(notebookContent.cells[i].textContent).toEqual(notebookContentAgain.cells[i].textContent);
      expect(notebookContent.cells[i].cellType).toEqual(notebookContentAgain.cells[i].cellType);
    }
    expect(notebookContentAgain.metadata).toEqual(notebookContent.metadata);
  });

  it("parses properties", () => {
    const notebookContent = textToNotebookContent(notebookWithCellProperties);

    expect(notebookContent.cells).toHaveLength(1);
    const firstCell = notebookContent.cells[0];
    expect(firstCell.metadata.properties["run_on_load"]).toBeTruthy();
    expect(firstCell.metadata.properties["another"]).toEqual("value");
  });

  it("ignores wrong cell header", () => {
    const notebookContent = textToNotebookContent(withInvalidCell);
    expect(notebookContent.cells).toHaveLength(1);
  });

  it("errors on invalid cell metadata (parse error and wrong type)", () => {
    for (const nb of [wrongCellMetadataType, invalidCellMetadataType]) {
      let didError = false;
      jest.spyOn(console, "error").mockImplementation(() => {
        didError = true;
      });
      const notebookContent = textToNotebookContent(nb);
      expect(notebookContent.cells).toHaveLength(1);
      expect(notebookContent.cells[0].metadata).toHaveProperty("properties");
      expect(didError).toBeTruthy();
    }
  });

  it("throws on entirely broken notebook", () => {
    jest.spyOn(console, "error").mockImplementation(() => {
      /*do nothing*/
    });
    expect(() => textToNotebookContent(totallyInvalidNotebook)).toThrow();
  });

  it("throws on invalid yaml notebook header type", () => {
    jest.spyOn(console, "error").mockImplementation(() => {
      /*do nothing*/
    });
    expect(() => textToNotebookContent(metadataNotebookWithWrongMetadataType)).toThrow();
  });

  it("handles metadata only notebook", () => {
    const notebookContent = textToNotebookContent(metadataOnlyNotebook);
    expect(notebookContent.metadata.abc).toEqual("def");
    expect(notebookContent.cells).toHaveLength(0);
  });

  it("handles metadata only notebook with noise", () => {
    for (const nb of [
      metadataOnlyNotebookWithNoise,
      metadataNotebookWithNoiseAndCell,
      metadataOnlyNotebookWithMissingYamlHeaderEnd,
      metadataNotebookWithMissingYamlHeaderEndAndCell,
    ]) {
      let didWarn = false;
      jest.spyOn(console, "warn").mockImplementation(() => {
        didWarn = true;
      });
      const notebookContent = textToNotebookContent(nb);
      expect(notebookContent.metadata.abc).toEqual("def");
      expect(didWarn).toBeTruthy();
    }
  });

  it("handles cell with empty metadata block", () => {
    const notebookContent = textToNotebookContent(emptyCellMetadata);
    expect(notebookContent.cells).toHaveLength(1);
    expect(notebookContent.cells[0].metadata).toHaveProperty("properties");
  });

  it("notebook content is stable in many conversions text->nb->text->nb->text->nb", () => {
    for (const nbContent of [
      simpleNotebookPlaintext,
      notebookWithCellProperties,
      withInvalidCell,
      emptyNotebook,
      metadataOnlyNotebook,
    ]) {
      const textContentAfterALotOfConversions = notebookContentToText(
        textToNotebookContent(notebookContentToText(textToNotebookContent(nbContent)))
      );
      expect(textContentAfterALotOfConversions).toEqual(nbContent);
    }
  });
});
