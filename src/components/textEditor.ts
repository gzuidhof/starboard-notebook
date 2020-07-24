import { customElement, LitElement, html, query } from "lit-element";
import { Cell } from "../notebookContent";
import { CellEvent } from "./cell";
import { createCodeMirrorEditor } from "../editor/codeMirror";


export type SupportedLanguage = "javascript" | "typescript" | "markdown" | "css" | "html";
export type WordWrapSetting = "off" | "on" | "wordWrapColumn" | "bounded";

/**
 * StarboardTextEditor abstracts over different text editors that are loaded dynamically.
 * The user can choose: monaco for desktop devices, or a more minimal editor for mobile phones.
 */
@customElement('starboard-text-editor')
export class StarboardTextEditor extends LitElement {

    // @property({ type: String })
    // public editorName: "choice" | "monaco" | "simple" = "choice";

    @query(".starboard-text-editor")
    private editorMountpoint!: HTMLElement;

    private emit: (event: any) => void;
    private cell: Cell;
    private opts: {language?: SupportedLanguage; wordWrap?: WordWrapSetting} = {};
    editorInstance: any;

    constructor(cell: Cell, opts: {language?: SupportedLanguage; wordWrap?: "off" | "on" | "wordWrapColumn" | "bounded"}, emit: (event: CellEvent) => void) {
        super();
        this.emit = emit;
        this.cell = cell;
        this.opts = opts;
    }

    connectedCallback() {
        super.connectedCallback();        
    }

    firstUpdated(changedProperties: any) {
        super.firstUpdated(changedProperties);
        if (this.opts.language === "typescript") {
            this.opts.language = undefined;
        }
        this.editorInstance = createCodeMirrorEditor(this.editorMountpoint, this.cell, this.opts as any, this.emit);
    }

    createRenderRoot() {
        return this;
    }

    render() {
        return html`
        <div class="starboard-text-editor">
            <div class="starboard-editor-picker-overlay">
                <h2 style="font-size: 1em">Choose an editor</h2>
                <p style="font-size: 0.75em">The <b>Advanced Editor</b> is a powerful Monaco-based editor, but is 4MB in size and has poor touchscreen support.</p>
                <div><button class="">Advanced Editor</button> <button class="">Simple Editor</button></div>
            </div>
        </div>
        
        `;
    }

}
