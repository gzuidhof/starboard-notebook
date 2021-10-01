/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { textToNotebookContent } from "../../src/content/parsing";
import { notebookContentToText } from "../../src/content/serialization";

const simpleNotebookPlaintext = `%% md
# Notebook
Hello there!

%% js autoRun
const x = 5;
x;

%% unknown-cell-type
`;

const notebookWithCellProperties = `%% js runOnLoad
const a = 123;
`;

const withInvalidCell = `%% js autoRun
const a = 123;
// Cell below is missing a type, so it should not start a new cell.
%%
const x = 3;
`;

const totallyInvalidNotebook = `
%%
// There are actually zero cells now..
// the entire notebook is invalid
`;

const emptyNotebook = ``;

describe("Text to notebook content", () => {
  it("can parse a simple notebook", async () => {
    const notebookContent = textToNotebookContent(simpleNotebookPlaintext);

    expect(notebookContent.cells).toHaveLength(3);
    const firstCell = notebookContent.cells[0];
    expect(firstCell.cellType).toEqual("md");
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
    // expect(generatedNotebookText).toEqual(simpleNotebookPlaintext);

    for (let i = 0; i < notebookContent.cells.length; i++) {
      expect(notebookContent.cells[i].textContent).toEqual(notebookContentAgain.cells[i].textContent);
      expect(notebookContent.cells[i].cellType).toEqual(notebookContentAgain.cells[i].cellType);
    }
    expect(notebookContentAgain.metadata).toEqual(notebookContent.metadata);
  });

  it("parses autoRun flag", () => {
    const notebookContent = textToNotebookContent(notebookWithCellProperties);

    expect(notebookContent.cells).toHaveLength(1);
    const firstCell = notebookContent.cells[0];
    // This checks for new name of this property that gets patched automatically
    expect(firstCell.metadata.properties["run_on_load"]).toBeTruthy();
  });

  it("handles wrong cell header", () => {
    const notebookContent = textToNotebookContent(withInvalidCell);
    expect(notebookContent.cells).toHaveLength(1);
  });

  it("handles entirely broken notebook", () => {
    jest.spyOn(console, "error").mockImplementation(() => {
      /*do nothing*/
    });
    expect(() => textToNotebookContent(totallyInvalidNotebook)).toThrow();
  });

  it("notebook content is stable in many conversions text->nb->text->nb->text->nb (!not the text!)", () => {
    for (const nbContent of [simpleNotebookPlaintext, notebookWithCellProperties, withInvalidCell, emptyNotebook]) {
      const content = textToNotebookContent(nbContent);
      content.cells.map((x) => (x.id = ""));

      const contentAfterALotOfConversions = textToNotebookContent(
        notebookContentToText(textToNotebookContent(notebookContentToText(content)))
      );
      contentAfterALotOfConversions.cells.map((x) => (x.id = ""));

      expect(contentAfterALotOfConversions).toEqual(content);
    }
  });
});
