# starboard-runtime-lib

The Starboard notebook runtime provides a global object called `runtime`. On this runtime you will find **controls**, which are ways to interact with the Notebook's mechanics (such as inserting a new cell), and more importantly **exports**.

Exports are re-exported libraries such as the Markdown renderer. If you are building a custom cell type you may need a Markdown renderer too. You could bundle the Markdown renderer yourself in your plugin, which would add a ton of duplicate Javascript code, or you could just use the re-exported library.

This package provides a more convenient ESM interface to access these globals.

## Generation

These files thankfully are not created manually, [this notebook](https://starboard.gg/gz/generate-starboard-runtime-lib-njyt7FO) gets the job done quickly.
