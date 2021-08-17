# Runtime Controls

Lists the functions exposed via [runtime](./runtime.md).controls. The function arguments are typically defined via a type. 
Most controls will trigger an event, which can be listened to with a plugin. 
The event parameters are also defined via a type, and most of the time inherit directly from the Options type. 

'?' at the end indicates it is optional. 
“this” | “that” | 32 indicates it must be a string value of either “this” or “that” or the integer 32.

---

ƒ insertCell(opts: InsertCellOptions)

See [type InsertCellOptions](../src/types/events/index.ts)

*Function triggers "sb:insert_cell" event.*

See [type InsertCellEvent](../src/types/events/index.ts)

Examples: 

>runtime.controls.insertCell( { data: { cellType:'markdown', textContent: 'x has the value of ' + pyodide.globals.x } } )

>runtime.controls.insertCell( { position: "notebookEnd", data: { cellType:'javascript' } } )
---
ƒ removeCell(opts: RemoveCellOptions) 

See [type RemoveCellOptions](../src/types/events/index.ts)

*Function triggers "sb:remove_cell" event.*

See [type RemoveCellEvent](../src/types/events/index.ts)

Example:

>runtime.controls.removeCell( {id: 'cell-183d03a2f079'} )
---
ƒ moveCell(opts: MoveCellOptions)

See [type MoveCellOptions](../src/types/events/index.ts)

*This function involves calling moveCellToIndex, which triggers the event (see for details).*

Example:

>runtime.controls.moveCell( {id: 'cell-183d03a2f079', amount: -2} ) 
---
ƒ moveCellToIndex(opts: MoveCellToIndexOptions)

See [type MoveCellToIndexOptions](../src/types/events/index.ts)

*Function triggers "sb:move_cell" event.*

See [type MoveCellEvent](../src/types/events/index.ts)

Example:

>runtime.controls.moveCellToIndex( {id: 'cell-183d03a2f079', toIndex: 0} ) 
---
ƒ changeCellType(opts: ChangeCellTypeOptions)

See [type ChangeCellTypeOptions](../src/types/events/index.ts)

*Function triggers "sb:change_cell_type" event.*

See [type ChangeCellTypeEvent](../src/types/events/index.ts)

Example:

>runtime.controls.changeCellType( {id: 'cell-183d03a2f079', newCellType: 'python'} )
---
ƒ setCellProperty(opts: SetCellPropertyOptions) 

See [type SetCellPropertyOptions](../src/types/events/index.ts)

*Function triggers "sb:set_cell_property" event.*

See [type SetCellPropertyEvent](../src/types/events/index.ts)

Examples: 

>runtime.controls.setCellProperty( {id: 'cell-183d03a2f079', property: 'locked', value: true})

>runtime.controls.setCellProperty( {id: 'cell-183d03a2f079', property: 'plugin-cell-property', value: 'custom'})
---
ƒ resetCell(opts: ResetCellOptions)

Resets the given cell, recreating the entire thing.

See [type ResetCellOptions](../src/types/events/index.ts)

*Function triggers "sb:reset_cell" event.*

See [type ResetCellEvent](../src/types/events/index.ts)

Example:

>runtime.controls.resetCell( {id: 'cell-183d03a2f079'} )
---
ƒ runCell(opts: RunCellOptions)  
See [type RunCellOptions](../src/types/events/index.ts)

*Function triggers "sb:run_cell" event.*  
See [type RunCellEvent](../src/types/events/index.ts)

Example:

>runtime.controls.runCell( {id: 'cell-183d03a2f079'} )
---
ƒ focusCell(opts: FocusCellOptions)  
See [type FocusCellOptions](../src/types/events/index.ts)

*Function triggers "sb:focus_cell" event.*  
See [type FocusCellEvent](../src/types/events/index.ts)

Examples:

>runtime.control.focusCell( {id: 'cell-183d03a2f079'} )  

>runtime.control.focusCell( {id: 'cell-183d03a2f079', focusTarget: "next"} )
--- 
ƒ clearCell()

Calls clear() on the cell implementation. That usually means clearing output. 

See [type ClearCellOptions](../src/types/events/index.ts)

*Function triggers "sb:clear_cell" event.*

See [type ClearCellEvent](../src/types/events/index.ts)

Example: 

>runtime.controls.clearCell( {id: 'cell-183d03a2f079'} )
---
ƒ save(opts: any)

*Function triggers "sb:save" event.*

See [type SaveEvent](../src/types/events/index.ts)

Examples: 

>runtime.controls.save()

>runtime.controls.save('custom-site-or-plugin-message')
---
ƒ runAllCells(opts: RunAllCellsOptions = {}) 

See [type RunAllCellsOptions](../src/types/events/index.ts)

*Function triggers "sb:run_all_cells" event.*

See [type RunAllCellsEvent](../src/types/events/index.ts)

Examples:

>runtime.controls.runAllCells()

>runtime.controls.runAllCells( {onlyRunOnLoad: true, isInitialRun: false} )
---
ƒ clearAllCells()

Function does not trigger an event directly, but will call clearCell. 

Example:

>runtime.controls.clearAllCells()
---
ƒ sendMessage(message: OutboundNotebookMessage, opts: { targetOrigin?: string } = {})

See [type OutboundNotebookMessage](../src/types/messages/outbound.ts)

Function does not trigger an event. 

Example: 

>runtime.controls.sendMessage( 'Hello from the notebook.' )
---
ƒ contentChanged()

To be called to indicate that the notebook content has changed

---
emit: *Deprecated* Use `runtime.controls` directly, these will emit DOM events.

---
ƒ subscribeToCellChanges(id: string, callback: () => void)

The given callback will be called when the text representation of a cell changes.

---
ƒ unsubscribeToCellChanges(id: string, callback: () => void)

---
ƒ registerPlugin(plugin: StarboardPlugin, opts?: any)

See [interface StarboardPlugin](../src/types/plugins/index.ts)

*Also see [plugins](../docs/plugins.md)
