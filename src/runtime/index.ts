/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { CellEvent, NotebookContent, CellTypeDefinition, CellPropertyDefinition, ControlsDefinition, IconTemplate } from "../types";
import { ConsoleCatcher } from "../console/console";
import { CellElement } from "../components/cell";
import { StarboardNotebookElement } from "../components/notebook";
import { TemplateResult } from "lit-html";
import { StarboardTextEditor } from "../components/textEditor";
import { ConsoleOutputElement } from "../components/output/consoleOutput";

import * as lithtmlLibrary from "lit-html";
import * as litElementLibrary from "lit-element";
import katex from "katex";
import * as YAML from "yaml";
import mdlib from "markdown-it";
import * as Popper from "@popperjs/core";

import { JavascriptEvaluator } from "../cellTypes/javascript/eval";
import { hookMarkdownItToPrismHighlighter } from "../components/helpers/highlight";
import { createCellProxy } from "../components/helpers/cellProxy";
import { cellToText, notebookContentToText } from "../content/serialization";
import { precompileJavascriptCode } from "../cellTypes/javascript/precompile";
import { MapRegistry } from "./registry";
import { hookMarkdownItToKaTeX } from "../components/helpers/katex";
import { renderIfHtmlOutput } from "../components/output/htmlOutput";
import { hookMarkdownItToEmojiPlugin } from "../components/helpers/emoji";
import { OutboundNotebookMessage } from "../messages/types";

export * from "../types";

export interface RuntimeControls {
    insertCell(position: "end" | "before" | "after", adjacentCellId?: string): void;
    removeCell(id: string): void;
    changeCellType(id: string, newCellType: string): void;
    resetCell(id: string): void;
    runCell(id: string, focusNext?: boolean, insertNewCell?: boolean): void;
    runAllCells(opts: {onlyRunOnLoad?: boolean}): Promise<void>;

    /** 
     * Requests a save operation from the parent iframe.
     * Returns whether save message was succesfully sent, note that it doesn't guarantee it was actually saved!
    */
    save(): boolean;

    /** To be called to indicate that the notebook content has changed */
    contentChanged(): void;

    /**
     * Send a message to the parent iframe through the iframeResizer library.
     * Optionally you can pass the only target origin you want the message to be sent to, see the iframeresizer docs.
     * Returns whether a listening parent iframe is present (and thus if the message coudl be sent).
     */
    sendMessage(message: OutboundNotebookMessage, targetOrigin?: string): boolean;

    /**
     * Publish to the notebook event bus, used to propagate messages upwards such as "focus on the next cell".
     */
    emit(e: CellEvent): void;

    /**
     * The given callback will be called when the text representation of a cell changes.
     * @param id 
     * @param callback 
     */
    subscribeToCellChanges(id: string, callback: () => void):  void;
    unsubscribeToCellChanges(id: string, callback: () => void):  void;
}


/**
 * These are exposed functions and libraries. They are exposed so that they can be easily used within notebooks or
 * by plugins or extensions (so they don't have to bundled again).
 */
export interface RuntimeExports {
    templates: {
        cellControls: (c: ControlsDefinition) => (TemplateResult | string);
        icons: {
            StarboardLogo: IconTemplate;
            AssetsAddedIcon: IconTemplate;
            DeleteIcon: IconTemplate;
            BooleanIcon: IconTemplate;
            ClockIcon: IconTemplate;
            PlayCircleIcon: IconTemplate;
            TextEditIcon: IconTemplate;
            GearsIcon: IconTemplate;
            LockClosedIcon: IconTemplate;
        };
    };

    elements: {
        StarboardTextEditor: typeof StarboardTextEditor;
        ConsoleOutputElement: typeof ConsoleOutputElement;
    };

    /**
     * Starboard-notebook internal routines
     */
    core: {
        JavascriptEvaluator: typeof JavascriptEvaluator;
        ConsoleCatcher: typeof ConsoleCatcher;
        renderIfHtmlOutput: typeof renderIfHtmlOutput;
        createCellProxy: typeof createCellProxy;
        hookMarkdownItToPrismHighlighter: typeof hookMarkdownItToPrismHighlighter;
        hookMarkdownItToKaTeX: typeof hookMarkdownItToKaTeX;
        hookMarkDownItToEmojiPlugin: typeof hookMarkdownItToEmojiPlugin;
        cellToText: typeof cellToText;
        notebookContentToText: typeof notebookContentToText;
        precompileJavascriptCode: typeof precompileJavascriptCode;
    };

    /**
     * Libraries that are re-exported
     */
    libraries: {
        LitHtml: typeof lithtmlLibrary;
        LitElement: typeof litElementLibrary;
        MarkdownIt: typeof mdlib;
        YAML: typeof YAML;
        Popper: typeof Popper;

        /**
         * Libraries that are loaded asynchronously on demand.
         */
        async: {
            KaTeX: () => Promise<typeof katex>;
            StarboardPython: () => Promise<any>;
        };
    };
}


/**
 * Runtime is the main state/store for a notebook.
 */
export interface Runtime {

    /**
     * The state of the notebook that exactly describes the text in the notebook.
     */
    content: NotebookContent;
 
    definitions: {
        /**
         * Map of registered cell types, indexed by cellType (e.g. "javascript").
         */
        cellTypes: MapRegistry<string, CellTypeDefinition>;

        /**
         * Map of registered cell properties, indexed by property name (e.g. "collapsed" or "runOnLoad").
         */
        cellProperties: MapRegistry<string, CellPropertyDefinition>;
    };

    /**
     * Contains HTML elements in this notebook runtime.
     */
    dom: {
        notebook: StarboardNotebookElement;
        cells: CellElement[];
    };

    /**
     * Used to coordinate listening to the console hook.
     */
    consoleCatcher: ConsoleCatcher;

    /**
     * Version of Starboard Notebook
     */
    version: string;
    
    /**
     * Name of the runtime.
     */
    name: "starboard-notebook";

    /**
     * "Settings" for the runtime itself.
     */
    config: RuntimeConfig;

    /**
     * Contains all actions that can be performed on the runtime
     */
    controls: RuntimeControls;

    exports: RuntimeExports;

    /**
     * Internal state, don't depend on this externally
     */
    internal: {
        listeners: {
            cellContentChanges: Map<string, (()=>void)[]>;
        };
    };
    
}

/**
 * "Settings" for the runtime, these can be set from the surrounding webpage.
 */
export interface RuntimeConfig {
    /**
     * Cell IDs written to the metadata of the cell for new cells if this is true, which causes them to be persisted.
     */
    persistCellIds: boolean;
    defaultTextEditor: "monaco" | "codemirror" | "smart" | "";
}
