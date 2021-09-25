# Runtime

At runtime some data is present globally that describes the state of the notebook and provides hook points for plugins or metaprogramming. With metaprogramming we mean manipulating or using the cell's values programmatically: for instance triggering the run of a cell.

Another goal of exposing this runtime is to prevent duplication in the bundles. A plugin that creates a cell with a text editor shouldn't have to bundle its own text editor.
