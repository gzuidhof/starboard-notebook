# How to add a plugin to a Starboard Notebook 

When initializing a Starboard Notebook, you can specify which plugins to load in the header of the notebook content. For example: 

```
---
starboard:
  plugins:
    - src: "https://someserver/noNewCellsPlugin/index.js"
      args: [1,2 ]
    - src: "https://cdn.jsdelivr.net/npm/nasync-js@0.1.0/dist/index.js"
---
```

*Note if you are loading a plugin from a different origin than your notebook, the plugin server will have to allow for cross origin requests from your notebook's domain. 

# A simple plugin

A plugin needs to define a register function which takes the Starboard [Runtime](./runtime.md). 

A pretty minimal plugin for starboard may look like this: 

noNewCellsPlugin/src/index.ts
```
export const plugin = {
  id: "unhott-hates-new-cells",
  metadata: {
    name: "NoNewCellsPlugin (or some other human friendly name)",
  },
  exports: {},
  async register(runtime: Runtime, opts: {}) {
    runtime.dom.notebook.addEventListener("sb:remove_cell", (event) => {
      console.log("This is perfectly fine... ");
    });
    runtime.dom.notebook.addEventListener("sb:insert_cell", (event) => {
      console.log("Haha, no cell for you! ");
      event.preventDefault();
    });
    runtime.dom.notebook.addEventListener("sb:set_cell_property", (event) => {
      if (event.detail.property == 'locked') {
        event.preventDefault();
        console.log("I'm sorry, I can't let you do that... ");
      };
    });
  }
};
```