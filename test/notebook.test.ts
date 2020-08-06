/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import {textToNotebookContent, notebookContentToText} from "../src/notebookContent";

const simpleNotebookPlaintext = `
Text before the first cell
%% md
# Notebook
Hello there!

%% js autoRun
const x = 5;
x;

%% unknown-cell-type
`;

const notebookWithCellProperties = `
%% js autoRun
const a = 123;
`;

const withInvalidCell = `
%% js autoRun
const a = 123;
// Cell below is missing a type, so it should not start a new cell.
%%
const x = 3;
`;

const withInvalidFirstCell = `
%%
// There are actually zero cells now..
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
        expect(notebookContent.frontMatter).toEqual("");
        expect(notebookContentToText(notebookContent)).toEqual("");
    });

    it("stays the same in text -> nb -> text -> nb", () => {
        const notebookContent = textToNotebookContent(simpleNotebookPlaintext);
        const generatedNotebookText = notebookContentToText(notebookContent);
        const notebookContentAgain = textToNotebookContent(generatedNotebookText);

        expect(generatedNotebookText).toEqual(simpleNotebookPlaintext);

        for(let i = 0; i < notebookContent.cells.length; i++) {
            expect(notebookContent.cells[i].textContent).toEqual(notebookContentAgain.cells[i].textContent);
            expect(notebookContent.cells[i].cellType).toEqual(notebookContentAgain.cells[i].cellType);
        }
        expect(notebookContentAgain.frontMatter).toEqual(notebookContent.frontMatter);
    });

    it("parses autoRun flag", () => {
        const notebookContent = textToNotebookContent(notebookWithCellProperties);

        expect(notebookContent.cells).toHaveLength(1);
        const firstCell = notebookContent.cells[0];
        expect(firstCell.properties["autoRun"]).toBeTruthy();
    });

    it("handles wrong cell header", () => {
        const notebookContent = textToNotebookContent(withInvalidCell);
        expect(notebookContent.cells).toHaveLength(2);
        expect(notebookContent.cells[1].cellType).toEqual("");
    });

    it("handles wrong cell header for first cell", () => {
        const notebookContent = textToNotebookContent(withInvalidFirstCell);
        expect(notebookContent.cells).toHaveLength(1);
        expect(notebookContentToText(notebookContent)).toEqual(withInvalidFirstCell);
        expect(notebookContentToText(textToNotebookContent(notebookContentToText(notebookContent)))).toEqual(withInvalidFirstCell);
    });

    it("is stable in many conversions text->nb->text->nb->text", () => {
        for(const nbContent of [simpleNotebookPlaintext, notebookWithCellProperties, withInvalidCell, withInvalidFirstCell, emptyNotebook]) {
            expect(notebookContentToText(textToNotebookContent(notebookContentToText(textToNotebookContent(nbContent))))).toEqual(nbContent);
        }
    });
});