# Starboard Runtime

At runtime some data is present globally that describes the state of the notebook and provides hook points for [plugins](./plugins.md) or metaprogramming. With metaprogramming we mean manipulating or using the cell's values programmatically: for instance triggering the run of a cell.

Another goal of exposing this runtime is to prevent duplication in the bundles. A plugin that creates a cell with a text editor shouldn't have to bundle its own text editor. 

The runtime object is accessible from within a notebook window as the variable runtime. The runtime exposes the following: 

    consoleCatcher: 
        Used to coordinate listening to the console hook. 
---
    content: 
        This is the internal state of the notebook that exactly describes the text in the notebook
            runtime.content.metadata returns an object representing the metadata of the notebook. runtime.content.cells returns an array of the notebook cells. 
---
    config: 
        "Settings" for the runtime itself, these can be set from the surrounding webpage. 
---
    dom: 
        Contains HTML elements in this notebook runtime.
            runtime.dom.cells => An array of the cell dom objects
            runtime.dom.notebook => The full notebook dom
        It also exposes a ‘getCellById’ function.
---
    definitions: 
        Contains the cellTypes and cellProperties. 
            The cellType is a map from string to the definition of the cell type, e.g., js, javascript => javascript. cellProperties are a map of registered cell properties, indexed by property name (e.g. "collapsed" or "runOnLoad").
---
    name: 
        Name of the runtime. 
---
    version: 
        Version of Starboard Notebook, e.g., “0.13.2”
---
    controls: 
        See [Runtime Controls](./runtime-controls.md). 
---
    exports:
        These are exposed functions and libraries. They are exposed so that they can be easily used within notebooks or
        by plugins or extensions (so they don't have to bundled again).
---
    internal:
        Internal state, don't depend on this externally
---
    plugins:
        If plugins want to expose data or functionality this is a good place for it.
