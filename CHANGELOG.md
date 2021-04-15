# Changelog

## Release 0.8.7
**Date:** 2021-04-15 [unreleased]

* Fixed width issues that would sometimes occur with wide content in iframe mode.

## Release 0.8.6
**Date:** 2021-04-14

* Introduced `hide_top` and `hide_bottom` to hide half the cell when not focused. Useful for hiding the code or output when it doesn't add to your narrative.
* All cell properties now add a `property-<NAME>` class to the cell to allow for easy semantic styling.
* Fixed the Javascript cell run button tooltip stating "cell is running" when it was not.

## Release 0.8.5
**Date:** 2021-04-13

* Fix overflow issue when using Monaco editor.
* Removed `overflow: auto` from cell-top and cell-botom, it makes doing popovers unnecessarily difficult.
* Made the text editor outline invisible unless selected.
* Removed the rounded edges of editors and console output. It looks pretty, but it can't be styled flush without a bit of Javascript.
* Made the collapsed cell indicator line less confusing.
* *Breaking change* (I don't think any plugins were using this, so probably nobody will notice): removed `katex` and `katexLoader` globals. You can access it as `await runtime.exports.libraries.async.KaTeX()` instead.

## Release 0.8.4
**Date:** 2021-04-12

* Fix for text editor overflowing when the notebook contains very long lines.

## Release 0.8.3
**Date:** 2021-04-12

* Cell type definitions now include a method that allows for a customized cell creation interface.
* Some fixes for math behavior in Markdown cells (we now import `prosemirror-math` where possible).
* Fix: Pressing shift-enter in the codemirror editor no longer adds a newline.
* Removed the old cell insertion button and added the +-line button above cells too now.
* The default editor for Markdown cells is the plaintext one again. In a future version it should  probably remember the preferred editor.
* Quality of life: When inserting a new cell, press enter to insert the selected cell type immediately.
* Lots of style improvements:
  * The borders of the text editors and console output are less pronounced and corners are rounded.
  * The "cell type color hint" left border was removed.
  * All cell bottoms now default to having a little bit of padding underneath.
  * Fix the notebook footer not aligning with the cells.
  * The top bar of cells is now smaller
  * The cell gutter button (in the left margin) is now thinner by default.
  * The cell type selector menu selected state looks a lot better now.
  * The notebook will now grow a bit if it is too small when the cell type selector is opened.
  * Responsivity tweak: On small devices the gutters will be reduced in width.
  * CSS fade in animations added to cells.

## Release 0.8.2
**Date:** 2021-04-01

* Running the last cell no longer inserts a new cell (like Jupyter would).
* Every cell's HTML is now simplified, the intermediate `<section class="cell-container">` was removed, this container class is now on the custom cell element itself.
* The margin is now variable and larger. For small screens we can resize it responsively through CSS in the future.
* A cell insertion line is now visible when hovering or selecting a cell, with a small `+` button on the left to insert a new cell.
* A new menu is now visible when inserting a new cell, in the future this will contain information about the cell type.
* Double-clicking the cell-insertion + inserts the same cell type right away.
* Updated highlighting package (audit fix).
* Removed global letter spacing rule (used to be `-0.01em`), it now only applies to (Markdown) content.
* Font size reduced to `14px`, only in content (i.e. Markdown) it still defaults to `16px`.

## Release 0.8.1
**Date:** 2021-03-26

* Update `starboard-python` version 0.5.1 which allows user code to catch Python errors.

## Release 0.8.0
**Date:** 2021-03-24

* Markdown cells now have their own WYSIWYG editor (as well as a plaintext editor for advanced users).
  * Shift-enter and ctrl-enter no longer run the next cell when the WYSIWYG content editor is focused.
  * The WYSIWYFG editor has LaTeX inline editing support (based on prosemirror-math package). It's a bit experimental at this stage, remember you can use the fallback plaintext editor.
  * Double-clicking a markdown cell triggers this editor.
* A newly inserted cell now defaults to Markdown instead of Javascript when no cells are present.
* Clicking anywhere outside of a markdown cell stops its edit mode.
* Minor style changes
  * Slightly reduced the margin below paragraphs and list items (`1em` to `0.8em`). 
  * Added padding around all markdown content, including inside the WYSIWYG editor.
* Codemirror editor
  * Updated to codemirror version `0.16.0`.
  * Codemirror editor now has Markdown syntax highlighting support.
  * Removed naive CodeMirror JS autocompletion that would previously only autocomplete stuff present on the Window object.


## Release 0.7.21
**Date:**: 2021-03-19
* A small fix for the ProseMirror-based editor: if the prosemirror package hadn't been loaded yet asynchronously a CSS class for the markdown output would not be applied.

## Release 0.7.20
**Date:**: 2021-03-19
* Introduce ProseMirror as the default editor for Markdown content. Note that it isn't enabled yet for Markdown editors by default, it still needs some love (in particular it needs KaTeX support)
* `StarboardContentEditor` element is exposed in the exports for plugins to use.
* Removed custom text selection styling with CSS.
* Made `build:stats` command require less manual effort (you no longer need to know which line to edit in `webpack.config.js` to make it work).

## Release 0.7.19
**Date:** 2021-03-17
* Update `starboard-python` to 0.5.0.
* Starboard Python is now exported allowing plugins to more easily invoke Python code outside of a Python cell.

## Release 0.7.18
**Date:** 2021-03-17
* Starboard Notebook's distribution now includes runtime exports as a convenient ESM package for easier plugin development. These can be found at `starboard-notebook/dist/src/runtime/esm` and submodules.

## Release 0.7.17
**Date:** 2021-03-16
* Starboard now users Bootstrap 5 as the base of its CSS.
* Added the `popper` library to the exports of the runtime.
* The right gutter placeholder HTML elements don't get created anymore which saves 3 empty HTML elements per cell.

## Release 0.7.16
**Date:** 2021-03-12
* Added `RESET_CELL` functionality
* Cells which persist their IDs now correctly reset when they have a new cell type definition loaded for them.

## Release 0.7.15
**Date:** 2021-03-11

* Change the cell's metadata type definition to allow for arbitrary other keys.

## Release 0.7.14
**Date:** 2021-03-08

* The cell ID is now also the ID of the cell DOM element automatically.
* Randomly generated cell IDs are now prefixed with `cell-`.
* A config object can now be put on the `window` with the name `runtimeConfig`.
  * This config can be used to customize the runtime, for instance to enable persistent cell IDs (useful for compatibility with Jupyter).
  * In the future this is also where you would disable certain cell types.

## Release 0.7.13
**Date:** 2021-03-08

* Rename message `"NOTEBOOK_REFRESH_PAGE"` to `"NOTEBOOK_RELOAD_PAGE"` as it's a reload instruction, not refresh.
* The base URL of the notebook can now be set through the init data message, instead of through a separate message.

## Release 0.7.12
**Date:** 2021-03-08

* Fix small styling regression causing the footer to be drawn too far to the left.

## Release 0.7.11
**Date:** 2021-03-07

* Simplified the content struct in messages between an iframed notebook and the parent webpage.

## Release 0.7.10
**Date:** 2021-03-07

* Changes to the inbound and outbound messages between a notebook iFrame and the parent webpage. They are now defined in a type-safe manner in the `/messages` folder.
* Minor type improvements (non-breaking) for cell change listener callback functions.
* The `LockClosedIcon` is now exported allowing for re-use in plugins / user code.
* Added `name` field to the runtime object, which for this project will always equal `"starboard-notebook"`.

## Release 0.7.9
**Date:** 2021-02-22

* Added `lock` cell property which allows you to make cells edit-only. Thank you @unhott!

## Release 0.7.8
**Date:** 2021-01-06

* Update to `starboard-python` 0.4.1, which now wraps Pyodide 0.16.1, see the Pyodide changelog [here](https://pyodide.readthedocs.io/en/latest/changelog.html#version-0-16-1). Some notable changes:
  * You can now surpress Python output by adding `;` to the end of the cell, just like you would in Jupyter.
  * Sympy was updated to 1.6.2.
  * Python version is now 3.8.X (it was 3.7 before).
* Sympy output now gets rendered if returned from a cell. For example a Python cell with this content
  ```
  import sympy
  expr = sympy.sympify("x**2 + 3*x - 1/2")
  expr
  ```
  displays the expression below the cell rendered through KaTeX.

## Release 0.7.7
**Date:** 2020-12-24

* Editor preference is now set in a try-catch, which fixes an issue when localStorage is not available which was sometimes seen in Chromium-based browsers.

## Release 0.7.6
**Date:** 2020-12-09

* Hopefully fixed Monaco's sizing issues when collapsing and revealing cells.

## Release 0.7.5
**Date:** 2020-12-03

* A small hotfix improvement to 0.7.4: the CSS in `css` cells is now also applied on load.

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