# Changelog
## Release 0.7.4
**Date:** 2020-12-03

* You can now subscribe to changes to individual cells using `runtime.controls.subscribeToCellChanges(id, callback)`.
* The `css` cell type now applies the CSS automatically without a run button.
* The console output now only renders once per frame instead of on every entry added. Running `console.log` in a loop with hundreds iterations no longer freezes the browser for a while.
* Fixed line spacing of console output (how it should have been).
* The editor now defaults to Monaco on non-touchscreen devices.

## Release 0.7.3
**Date:** 2020-11-21

* Fix some CSS rules (`<strong>` did not work in Markdown output).

## Release 0.7.2
**Date:** 2020-11-20

* Increase responsivity when opening huge notebooks (hundreds of cells) by only loading one editor at a time.
* HTML is now enabled in markdown cells.
* Minor style upgrades:
   * Changed the markdown link color and removed the underline
   * The contrast of the cell indicator gutter line (on the left) upon hovering was decreased.
   * The `Edit on Starboard` link's color is a nearly invisible grey again.
   * The cell controls on the left are now also less visible unless the cell is focused.
   * The selection background is now a ligher color (`#3a3a3a` to `#555`).
* You can now import Starboard without immediately creating the `<starboard-notebook>` component by importing `starboard-notebook/dist/init`.
* The `<base>` element now correctly gets inserted into the head instead of the body.
* You can now change the `href` of the page's base tag by sending a `"SET_BASE_URL"` message from the parent iframe.

## Release 0.7.1
**Date:** 2020-11-17

Minor opacity tweaks of cell controls button and made the footer harder to see again.

## Release 0.7.0
**Date:** 2020-11-16

This update features a large style rework - the notebook's actual content is now capped in width. There are gutters on either side of that content. The typography was improved and it now has a more distinct style from Github markdown.

* The global styles are now more easily changed through CSS custom variables properties.
* Fixed the font of codemirror sometimes not being the correct one.
* Changed line numbers to a gray color so they distract less.
* Added emoji support in Markdown :wave:, the hook is exposed for plugins at `runtime.exports.core.hookMarkdownItToEmojiPlugin`.

## Release 0.6.6
**Date:** 2020-11-15

* Hotfix: Re-introduce the Node polyfills - some libraries require them at runtime, including Babel.

## Release 0.6.5
**Date:** 2020-11-15

Intermediate test release.

## Release 0.6.4
**Date:** 2020-11-13

**Broken release, fixed in 0.6.6**

A big decrease in bundle size that is loaded initially, from **930KB** (278KB gzipped) to **520KB** (146KB gzipped approximately).

* The console output rendering code is now loaded asynchronously, saving **~140KB** from the critical path.
* KaTeX is now loaded asynchronously, markdown content is now rendered without LaTeX rendering, and then re-rendered once it is loaded. The export of KaTeX is now found under `runtime.exports.async.KaTeX`. This saves **~244KB** from the intiial load.
  * This is a **breaking change** for notebooks that and rely on `window.katex`, those notebooks should now run `await window.lazyKatex` first to ensure it is already loaded.
  * `hookMarkdownItToKaTeX` is now an `async` function.
* Node polyfills that automatically get bundled are now excluded, saving around **30KB**.

## Release 0.6.3
**Date:** 2020-11-07

* Added `cell-output-html` class that slightly pads the output, it is used when Javascript or ESM cells output HTML elements.

Internal changes (only relevant for plugin developers):
* The `register` function of a `MapRegistry` (used to register new cell types) now accepts an array of keys to assign to the same definition.
* `renderIfHtmlOutput` added to DRY rendering of HTML output (used for either vanilla HTML elements or lit-html's `TemplateResult`).
* The `ConsoleCatcher` class now has a `getRawConsoleMethods()` which can be used to retrieve a pointer to the original console methods so you can log messages without them appearing in any cell's output.

## Release 0.6.2
**Date:** 2020-11-01

* Fix regression when setting content from parent frame if notebook is embedded in iframe.

## Release 0.6.1 
**Date:** 2020-11-01

This version never went live on Starboard.gg, it has a regression which was fixed in 0.6.2.

* Update `starboard-python` to 0.3.4, in which Pyodide files are now prefetched when a Python cell is first created.
* The babel parser (only used when executing Javascript cells) is now loaded asynchronously, shaving more than 450KB from the critical JS path.
* CSS is now minified (saving ~11KB), and more strict JS minify options are used (saving ~20KB).
* A cell type definitions can now be overwritten and existing cells with that type will reset automatically.
* *(internal change)*: Javascript precompile function is now async to allow for dynamic loading of Babel.
* *(internal change)*: Refactorings in the internal core, removing core functionality from view code in Notebook HTML element.

Editor updates:
* Support word wrap in CodeMirror editor (enabled by default in Markdown cells).
* Rich Coffeescript syntax in Monaco editor.
* Update to CodeMirror 0.14.0
* Fix cell type hint CSS for `javascript` and `python` cell types (left border of the editor).
* Fix `codicons.ttf` not loading.
* Minor changes to default font in CodeMirror to bring it closer to Monaco's look.

## Release 0.6.0
**Date:** 2020-10-28

In this update starboard-notebook switches to a new format which is more similar to Jupytext's formats.

* New format for notebooks, cells are now delimited by `# %% [markdown]` or `// %% [markdown]`, global notebook metdata is defined in a YAML header, and cell metadata and properties are also defined in YAML. An example: 
  ```bash
  ---
  starboard: 
    version: 0.6.0
    format_version: 1
  ---
  # %% [markdown]
  # A markdown title! Not part of the cell description
  Lorem ipsum....

  # Another title
  Bla

  # %%--- [javascript]
  # properties:
  #   run_on_load: true
  # ---%%
  class MyClass {
      constructor(a) {
          this.x = a;
      }
  }
  # %% [javascript]
  const instance = new MyClass(3);
  instance.x
  ```
* The old format still works (but will be phased out) - if you open a notebook in the old format it will be saved into the new format.
* All metadata keys and cell properties are preferred to be in in `snake_case`.
   * `runOnLoad` was renamed to `run_on_load`. `runOnLoad` still works for backwards compatability but will be removed in a future version.
* **Breaking change:** A cell's properties are now nested under `cell.metadata.properties` instead of `cell.properties`.
* **Breaking change:** A legacy cell without a cell type identifier is no longer recognized as a cell (e.g. a line with just `%%`). This was never possible on the Starboard.gg site anyway.

Other changes:
* Fix the cell properties button, before it would open the cell type menu instead.
* Fix deleting a property not marking the notebook content as changed (which prompts the user to save).
* Fix Monaco editor layouting:
  * Fix the editor being empty if initially collapsed.
  * Fix the editor sometimes not resizing to full height after being collapsed.
  * Fix the editor not taking the scrollbars into account when resizing.
* KaTeX `.ttf` fonts are no longer bundled as Starboard's supported browsers can understand `woff2` anyway.
* `ipython3` cell type identifier now also maps to the Python (Pyodide) cell type.
* KaTeX is now available in global scope (`window.katex`) and under `runtime.exports.libraries.KaTeX` for plugins to use, as well as its markdown-it integration under `runtime.exports.core.hookMarkdownItToKaTeX`.
* YAML (`yaml@next`) is now available on global scope (`window.YAML`) and under `runtime.exports.libraries.YAML`.

## Release 0.5.6
**Date:** 2020-10-22

* A cell type can now have multiple cell type identifiers (e.g. `"javascript"` and `"js"` map to the same definition), the longer version is now preferred.
* LaTeX math typesetting support through [*KaTeX*](https://katex.org/) is now available in markdown cells.
* New `latex` cell type that renders contents using KaTeX.
* Fix out of bounds error when executing last cell using `Shift+Enter` shortcut.

## Release 0.5.5
**Date:** 2020-10-13

* You can now define notebook content in a `<script type="application/vnd.starboard.nb">` tag and it will be automatically loaded.

## Release 0.5.4
**Date:** 2020-10-12

* Better support for self-hosting: you can now use a CDN build on any webpage and any dynamic imports still work. This makes the minimal standalone notebook example just a HTML file.
* You can override the root of the starboard notebook build artifacts by setting `window.starboardArtifactsUrl`.

## Release 0.5.3
**Date:** 2020-10-08

* New ES Module cell type (`esm`), that executes code using `import()`, which allows you to use top-level imports without await. Anything you `export` is put on the `window` object.
* The left border of a focused cell text editor now reflects the cell type as a visual cue.

## Release 0.5.2
**Date:** 2020-10-06

* CodeMirror is now the default editor which loads without user input.
* The chosen editor is now persisted (in LocalStorage).
* Editor improvements:
  * Added `Copy Text` button to cells which copies the text's content to clipboard.
  * Installed Python plugin for CodeMirror (this enables functionality like `ctrl+/` to comment lines and code folding).
  * Codemirror styling overhaul, it is now closer to that of the Prism highlighter and the Monaco editor.
  * *(internal change)*: Updated CodeMirror editor to 0.13.0
* Popovers now smartly position themselves inside the frame (before they would overflow below the page when selecting a cell type).
* Enable Python support in standalone notebooks.
* Update to Python plugin `starboard-python` 0.2.7, which renders HTML elements output by Python code.

## Release 0.5.1
**Date:** 2020-10-01

* Update to Python plugin `starboard-python` 0.2.6, which prints fewer messages to the console when loading packages.

## Release 0.5.0
**Date:** 2020-10-01

* No changes from 0.4.16, but solid Python support deserves a minor update.

## Release 0.4.16
**Date:** 2020-10-01

* Removed unnecessary empty line that appeared after some types of console output.
* Support for printing a dynamically imported module (e.g. `console.log(await import("https://example.com/my-library.js"))`).
* Remove default `line-height` from CSS on the document body, this makes console output smaller and fixes the height mismatch between printed variables and strings.
* *(internal change)*: Update to `starboard-python` plugin version 0.2.4
* *(internal change)*: Simplified console hooking and logging interface in Javascript cells and other plugin-based languages (such as Python).
* *(internal change)*: Add `GearsIcon` to built-in icons (the Python plugin no longer needs to include it now).

## Release 0.4.15
**Date:** 2020-09-30

* Remove the `(experimental)` tag for Python support - it's pretty solid.
* The Pyodide URL can now be overried using `window.pyodideArtifactsUrl`, useful if you want to use Python support entirely on localhost.

## Release 0.4.14
**Date:** 2020-09-30

* Less experimental Python support, matplotlib and html output (e.g. from Pandas) now works.
* PyProxies now have special support when shown in the console output.
* Console output no longer chokes on huge objects (e.g. the `pyodide` object).

## Release 0.4.13
**Date:** 2020-09-17

* Experimental Python support works with the exception of anything with HTML output (e.g. matplotlib figures).

## Release 0.4.12
**Date:** 2020-09-17

Non-production intermediate release.

* Minor Python cell debug message improvements when loading external libraries.

## Release 0.4.11
**Date:** 2020-09-17

Non-production intermediate release.

* Experimental Python cell support.

## Release 0.4.10
**Date:** 2020-08-25

* Fix initial notebook content being a debug value..

## Release 0.4.9
**Date:** 2020-08-17

* `runOnLoad` now correctly runs cells on load that have their cell type loaded in a prior cell.

## Release 0.4.8
**Date:** 2020-08-17

* Better support for cell type registration: cells that have an unknown cell type (e.g. `py` for Python) will now automatically become a fully-fledged cell if that cell type gets registered. 

## Release 0.4.7
**Date:** 2020-08-15

* Minor changes in type definitions which makes importing starboard-notebook as a library more straightforward.


## Release 0.4.6
**Date:** 2020-08-09

* Remove unnecessary scrollbar in CodeMirror editor by fixing wrong CSS rule.

## Release 0.4.5
**Date:** 2020-08-09

* Allow specifying `starboardEditUrl` on window to link to the source notebook on Starboard, this is useful when embedding.

## Release 0.4.4
**Date:** 2020-08-09

* The notebook now tries to contact the parent page multiple times, before sometimes the nested iframe would not get the notebook content message.
* Made the background of the notebook and cells pure white instead of slightly gray. It doesn't look good when embedding on a pure-white page (such as Notion).

## Release 0.4.3
**Date:** 2020-08-08

* Fix close button behavior in cell popovers (e.g. in cell type select menu).

## Release 0.4.2
**Date:** 2020-08-08

* Bugfix introduced in 0.4.0 in which cell creation and removal was broken.

## Release 0.4.1
**Date:** 2020-08-07

* Bugfix for content not getting transmitted properly through the iframe barrier.

## Release 0.4.0
**Date:** 2020-08-07

* A large refactor: Starboard Notebook is now built around a single **Runtime** that allows for metaprogramming and plugin support. This is a single source of truth for the state and functionality of a notebook. It is exposed as a global variable `runtime`. 
    * This centralizes the logic for the notebook and makes plugins possible that change the notebook in meaningful ways, for instance adding new cell types.
    * It allows for *metaprogramming*, you could for instance programmatically change or retrieve a cell's content, or trigger a cell run.
    * It exports internal functions and imported libraries so you can use these in notebooks and plugins. This way plugins don't have to bundle these dependencies themselves (and risk using different versions that may break things in subtle ways).
    * Try it in a notebook, run `console.log(runtime)`
* **`class`** definitions at the top level are now available globally (as they should have been all along, a bug prevented this).
* **`var`** definitions are only made global if they are in the top level of the cell. Before they were always made global.
* Support for custom **Cell Properties**: they can now be programatically added or removed.
* Fix for console output when running multiple cells on notebook load, before all console output would be shown in the last cell's output box instead of the respective cells.

## Release 0.3.2
**Date:** 2020-08-06

* Changes to cells (adding cells, removing cells, changing cell types and properties) now correctly are propagated as changes that should be saveable.
* Monaco editor now wraps lines in Markdown cells
* *(internal change)*: We now use rimraf instead of rm -rf to better support building the project on Windows.


## Release 0.3.1
**Date:** 2020-08-06  

* Fix for `runOnLoad` not working in iframe mode in which content comes from outside the iframe.

## Release 0.3.0
**Date:** 2020-08-06  

* **Cell Properties**: Properties are 'settings' for a cell. Properties are stored in the notebook file as such:  
  ```javascript
  %% js collapsed someOtherProperty
  console.log("Hello!");
   ```
  Right now all properties are binary: they are either present or not and have no value. In the future this will likely have to change.  

* **`collapsed`** property added. When enabled this hides the cell code and output unless it is focused. You can click the top patter of the gutter to toggle this property. 

* **`runOnLoad`** property added: if enabled the cell will be executed when the notebook is first loaded. This is especially useful for interactive articles in which you don't want to rely on the user clicking the tiny play button for a cell, or to run a hidden cell that loads dependencies.
* A **properties button** was added to the top right of cells, here you can toggle cell properties.
* **Reworked gutter** (the clickable line on the left of the cell).
* **Parser improvements**: 
  * **`%%`** without a cell type specifier now creates a cell with an empty cell type instead of considering it frontmatter.
  * There were some cases in which the input document was altered if immediately saved when the frontmatter only consisted of newlines. 
* *(internal change)*: Split the CSS of different sub-component into separate files.


## Release 0.2.2
**Date:** 2020-08-01  

This is the version when [**Starboard.gg**](https://starboard.gg) was first posted on [Show HN](https://news.ycombinator.com/item?id=24029002).