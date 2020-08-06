# Changelog


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