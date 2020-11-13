/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { cellControlsTemplate } from "../components/controls";
import { StarboardLogo } from "../components/logo";
import { AssetsAddedIcon, DeleteIcon, BooleanIcon, ClockIcon, PlayCircleIcon, TextEditIcon, GearsIcon } from "@spectrum-web-components/icons-workflow";
import { JavascriptEvaluator } from "../cellTypes/javascript/eval";
import { createCellProxy } from "../components/helpers/cellProxy";
import { hookMarkdownItToPrismHighlighter } from "../components/helpers/highlight";
import { StarboardTextEditor } from "../components/textEditor";
import { ConsoleOutputElement } from "../components/output/consoleOutput";

import * as LitElement from "lit-element";
import * as LitHtml from "lit-html";
import MarkdownIt from "markdown-it";
import { precompileJavascriptCode } from "../cellTypes/javascript/precompile";
import * as YAML from "yaml";
import { hookMarkdownItToKaTeX, katexLoader } from "../components/helpers/katex";
import { RuntimeExports } from ".";
import { ConsoleCatcher } from "../console/console";
import { cellToText, notebookContentToText } from "../content/serialization";
import { renderIfHtmlOutput } from "../components/output/htmlOutput";

export function createExports(): RuntimeExports {
    return {
      templates: {
        cellControls: cellControlsTemplate,
        icons: {
          StarboardLogo: StarboardLogo,
          AssetsAddedIcon: AssetsAddedIcon,
          DeleteIcon: DeleteIcon,
          BooleanIcon: BooleanIcon,
          ClockIcon: ClockIcon,
          PlayCircleIcon: PlayCircleIcon,
          TextEditIcon: TextEditIcon,
          GearsIcon: GearsIcon,
        }
      },
      core: {
        ConsoleCatcher: ConsoleCatcher,
        JavascriptEvaluator: JavascriptEvaluator,
        renderIfHtmlOutput: renderIfHtmlOutput,
        createCellProxy: createCellProxy,
        hookMarkdownItToPrismHighlighter: hookMarkdownItToPrismHighlighter,
        hookMarkdownItToKaTeX: hookMarkdownItToKaTeX,
        cellToText: cellToText,
        notebookContentToText: notebookContentToText,
        precompileJavascriptCode: precompileJavascriptCode,
      },
      elements: {
        StarboardTextEditor: StarboardTextEditor,
        ConsoleOutputElement: ConsoleOutputElement,
      },
      libraries: {
        LitElement: LitElement,
        LitHtml: LitHtml,
        MarkdownIt: MarkdownIt,
        YAML: YAML,

        async: {
          KaTeX: katexLoader,
        },
      }
    };
}
