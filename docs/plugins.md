# How to add a plugin to a Starboard Notebook 

In the header of the notebook content, add the following

```
---
starboard:
  plugins:
    - src: "https://someserver/my-sb-plugin/index.js"
    - src: "https://cdn.jsdelivr.net/npm/nasync-js@0.1.0/dist/index.js"
---
```
Example: 
https://github.com/gzuidhof/starboard-notebook/blob/master/test/notebooks/custom-nasync-cell-type.nb
*The servers hosting the plugins must allow for cross origin requests from your notebook domain, which should be different than your server domain. 

# A simple plugin

A pretty minimal plugin for starboard may look like this: 

noNewCells.ts
```
export const plugin = {
  id: "unhott-hates-new-cells",
  metadata: {
    name: "NoNewCellPlugin (or some other human friendly name)",
  },
  exports: {},
  async register(runtime: Runtime, opts: {}) {
    runtime.dom.notebook.addEventListener("sb:add_cell", (event) => {
       console.error("haha! no new cell for you");
       event.preventDefault();
    })
  },
};
```