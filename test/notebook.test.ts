import {textToNotebookContent, notebookContentToText} from "../src/notebookContent";

const simpleNotebookPlaintext = `
Text before the first cell
%% md
# Notebook
Hello there!

%% js
const x = 5;

%% js
`;

describe("Text to notebook content", () => {
    it("can parse a simple notebook", async () => {
        const notebookContent = textToNotebookContent(simpleNotebookPlaintext);
        
        expect(notebookContent.cells).toHaveLength(3);
        const firstCell = notebookContent.cells[0];
        expect(firstCell.cellType).toEqual("md");
        expect(firstCell.textContent.split("\n")).toHaveLength(3);
        expect(notebookContent.cells[2].cellType).toEqual("js");
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
});