/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import type {
  CellEvent,
  CellPropertyDefinition,
  CellTypeDefinition,
  ControlsDefinition,
  IconTemplate,
  NotebookContent,
} from "..";
import type { ConsoleCatcher } from "../../console/console";
import type { CellElement } from "../../components/cell";
import type { StarboardNotebookElement } from "../../components/notebook";
import type { TemplateResult } from "lit";
import type { StarboardTextEditor } from "../../components/textEditor";
import type { ConsoleOutputElement } from "../../components/output/consoleOutput";

import type * as litLibrary from "lit";
import type * as litDirectives from "lit/directive";
import type * as litDecorators from "lit/decorators";
import type katex from "katex";
import type * as YAML from "js-yaml";
import type mdlib from "markdown-it";
import type * as Popper from "@popperjs/core";

import type { JavascriptEvaluator } from "../../cellTypes/javascript/eval";
import type { createCellProxy } from "../../components/helpers/proxy/cellProxy";
import type { cellToText, notebookContentToText } from "../../content/serialization";
import type { precompileJavascriptCode } from "../../cellTypes/javascript/precompile";
import type { MapRegistry } from "./../registry";
import type { hookMarkdownItToKaTeX } from "../../components/helpers/katex";
import type { renderIfHtmlOutput } from "../../components/output/htmlOutput";
import type { hookMarkdownItToEmojiPlugin } from "../../components/helpers/emoji";
import type { OutboundNotebookMessage } from "../messages";
import type { StarboardContentEditor } from "../../components/editor/contentEditor";
import { StarboardPlugin } from "../plugins";
import { textToNotebookContent } from "../../content/parsing";
import { hookMarkdownItToCodemirrorHighlighter } from "../../components/helpers/highlight";
import {
  ChangeCellTypeOptions,
  ClearCellOptions,
  FocusCellOptions,
  InsertCellOptions,
  RemoveCellOptions,
  ResetCellOptions,
  RunCellOptions,
  SetCellPropertyOptions,
} from "../events";

export interface RuntimeControls {
  insertCell(opts: InsertCellOptions): string | false;
  removeCell(opts: RemoveCellOptions): boolean;
  changeCellType(opts: ChangeCellTypeOptions): boolean;
  setCellProperty(opts: SetCellPropertyOptions): boolean;
  resetCell(opts: ResetCellOptions): boolean;
  runCell(opts: RunCellOptions): boolean;
  focusCell(opts: FocusCellOptions): boolean;
  clearCell(opts: ClearCellOptions): boolean;
  runAllCells(opts: { onlyRunOnLoad?: boolean }): Promise<void>;
  clearAllCells(opts: Record<string, any>): void;

  moveCellToIndex(opts: { id: string; toIndex: number }): boolean;
  moveCell(opts: { id: string; amount: number }): boolean;

  /**
   * Requests a save operation from the parent iframe.
   */
  save(opts: any): boolean;

  /** To be called to indicate that the notebook content has changed */
  contentChanged(): void;

  /**
   * Send a message to the parent iframe through the iframeResizer library.
   * Optionally you can pass the only target origin you want the message to be sent to, see the iframeresizer docs.
   * Returns whether a listening parent iframe is present (and thus if the message could be sent).
   */
  sendMessage(message: OutboundNotebookMessage, opts?: { targetOrigin?: string }): boolean;

  /**
   * @deprecated Use `runtime.controls` directly, these will emit DOM events.
   * Publish to the notebook event bus, used to propagate messages upwards such as "focus on the next cell".
   */
  emit(e: CellEvent): void;

  /**
   * The given callback will be called when the text representation of a cell changes.
   * @param id
   * @param callback
   */
  subscribeToCellChanges(id: string, callback: () => void): void;
  unsubscribeToCellChanges(id: string, callback: () => void): void;

  registerPlugin(plugin: StarboardPlugin, opts?: any): Promise<void>;
}

/**
 * These are exposed functions and libraries. They are exposed so that they can be easily used within notebooks or
 * by plugins or extensions (so they don't have to bundled again).
 */
export interface RuntimeExports {
  templates: {
    cellControls: (c: ControlsDefinition) => TemplateResult | string;
    /** @deprecated */
    icons: {
      /** @deprecated */
      StarboardLogo: IconTemplate;
      /** @deprecated */
      AssetsAddedIcon: IconTemplate;
      /** @deprecated */
      DeleteIcon: IconTemplate;
      /** @deprecated */
      BooleanIcon: IconTemplate;
      /** @deprecated */
      ClockIcon: IconTemplate;
      /** @deprecated */
      PlayCircleIcon: IconTemplate;
      /** @deprecated */
      TextEditIcon: IconTemplate;
      /** @deprecated */
      GearsIcon: IconTemplate;
      /** @deprecated */
      LockClosedIcon: IconTemplate;
    };
  };

  elements: {
    StarboardTextEditor: typeof StarboardTextEditor;
    ConsoleOutputElement: typeof ConsoleOutputElement;
    StarboardContentEditor: typeof StarboardContentEditor;
  };

  /**
   * Starboard-notebook internal routines
   */
  core: {
    JavascriptEvaluator: typeof JavascriptEvaluator;
    ConsoleCatcher: typeof ConsoleCatcher;
    renderIfHtmlOutput: typeof renderIfHtmlOutput;
    createCellProxy: typeof createCellProxy;
    hookMarkdownItToKaTeX: typeof hookMarkdownItToKaTeX;
    hookMarkDownItToEmojiPlugin: typeof hookMarkdownItToEmojiPlugin;
    hookMarkdownItToCodemirrorHighlighter: typeof hookMarkdownItToCodemirrorHighlighter;
    cellToText: typeof cellToText;
    notebookContentToText: typeof notebookContentToText;
    textToNotebookContent: typeof textToNotebookContent;
    precompileJavascriptCode: typeof precompileJavascriptCode;
  };

  /**
   * Libraries that are re-exported
   */
  libraries: {
    lit: typeof litLibrary;
    /** @deprecated WILL BE REMOVED SOON - you must upgrade to use `lit` instead. */
    LitHtml: typeof litLibrary;
    /** @deprecated WILL BE REMOVED SOON - you must upgrade to use `lit` instead. */
    LitElement: typeof litLibrary;
    litDirectives: typeof litDirectives;
    litDecorators: typeof litDecorators;
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
    getCellById(id: string): CellElement | null;
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
      cellContentChanges: Map<string, (() => void)[]>;
    };
  };

  /**
   * If plugins want to expose data or functionality this is a good place for it.
   */
  plugins: MapRegistry<string, any>;
}

/**
 * "Settings" for the runtime, these can be set from the surrounding webpage.
 */
export interface RuntimeConfig {
  /**
   * Cell IDs written to the metadata of the cell for new cells if this is true, which causes them to be persisted.
   */
  persistCellIds: boolean;
  defaultTextEditor: "monaco" | "codemirror" | "";
}
