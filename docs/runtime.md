# Starboard Runtime

At runtime some data is present globally that describes the state of the notebook and provides hook points for [plugins](./plugins.md) or metaprogramming. With metaprogramming we mean manipulating or using the cell's values programmatically: for instance triggering the run of a cell.

Another goal of exposing this runtime is to prevent duplication in the bundles. A plugin that creates a cell with a text editor shouldn't have to bundle its own text editor. 

The runtime object is accessible from within a notebook window as the variable runtime. The runtime exposes the following: 

    consoleCatcher: 
        I **think** this intercepts messages to append to the dom
---
    content: 
        This is like the internal state of the notebook. runtime.content.metadata returns an object representing the metadata of the notebook. runtime.content.cells returns an array of the notebook cells. 
---
    config: 
        Configuration options for this notebook’s runtime
---
    dom: 
        This stores references to the dom of the notebook.
            runtime.dom.cells => An array of the cell dom objects
            runtime.dom.notebook => The full notebook dom
        It also exposes a ‘getCellById’ function.
---
    definitions: 
        Contains the cellTypes and cellProperties. The cellType is a map from string to the definition of the cell type, e.g., js, javascript => javascript. cellProperties are toggleable properties such as 'run_on_load' or 'locked'. 
---
    name: 
        Returns “starboard-notebook”
---
    version: 
        Version of the current notebook’s runtime, e.g., “0.13.2”
---
    controls: 
        See [Runtime Controls](./runtime-controls.md). 
---
    exports:
        WIP
---
    internal:
        WIP
---
    plugins:
        WIP
