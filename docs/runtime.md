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
        See Runtime Controls section below. 
---
    exports:
        WIP
---
    internal:
        WIP
---
    plugins:
        WIP

# Runtime Controls

Lists the functions exposed via runtime.controls. The function arguments are typically defined via a type. 
Most controls will trigger an event, which can be listened to with a plugin. 
The event parameters are also defined via a type, and most of the time inherit directly from the Options type. 

'?' at the end indicates it is optional. 
“this” | “that” | 32 indicates it must be a string value of either “this” or “that” or the integer 32.

    insertCell: 
        ƒ insertCell(opts: InsertCellOptions) 
            type InsertCellOptions = {
                adjacentCellId?: string;
                position: “before” | “after” | “notebookEnd”;
                data?: Partial<Cell>;
            }; 
        
            interface Cell extends ContentContainer {
                /**
                * An identifier such as "javascript" or "markdown" for Javascript and Markdown respectively.
                */
                cellType: string;
                textContent: string;
                metadata: {
                    /**
                    * The cell identifier, if it is present in the metadata it should be persisted between runs.
                    */
                    id?: string;
                    properties: {
                    run_on_load?: true;
                    collapsed?: true;
                    locked?: true;
                    [key: string]: any;
                    };
                    [key: string]: any;
                };
                /**
                * Every cell has a unique ID, this is not persisted between runs.
                * It has to be unique within this notebook.
                */
                id: string;
            };

        Function triggers "sb:insert_cell" event. 
            type InsertCellEvent = CustomEvent<InsertCellOptions>;

        Examples: 
            runtime.controls.insertCell( { data: { cellType:'markdown', textContent: 'x has the value of ' + pyodide.globals.x } } )
            runtime.controls.insertCell( { position: "notebookEnd", data: { cellType:'javascript' } } )
---
    removeCell: 
        ƒ removeCell(opts: RemoveCellOptions) 
            type RemoveCellOptions = { id: string };
        
        Function triggers "sb:remove_cell" event. 
            type RemoveCellEvent = CustomEvent<RemoveCellOptions>;

        Example:
            runtime.controls.removeCell( {id: 'cell-183d03a2f079'} )
---
    moveCell: 
        ƒ moveCell(opts: MoveCellOptions)
            type MoveCellOptions = {
                id: string; 
                amount: number; 
            };

        This function involves calling moveCellToIndex, which triggers the event (see for details). 

        Example:
            runtime.controls.moveCell( {id: 'cell-183d03a2f079', amount: -2} ) 
            // This will call moveCellToIndex, which actually sends the event signal. 
---
    moveCellToIndex: 
        ƒ moveCellToIndex(opts: MoveCellToIndexOptions)
            type MoveCellToIndexOptions = { id: string; toIndex: number };

        Function triggers "sb:move_cell" event. 
            type MoveCellEvent = CustomEvent<{
                id: string;
                fromIndex: number;
                toIndex: number;
            }>;

        Example:
            runtime.controls.moveCellToIndex( {id: 'cell-183d03a2f079', toIndex: 0} ) 
---
    changeCellType: 
        ƒ changeCellType(opts: ChangeCellTypeOptions)
        
        type ChangeCellTypeOptions = {
            id: string;
            newCellType: string;
        }; 

        Function triggers "sb:change_cell_type" event.             
            type ChangeCellTypeEvent = CustomEvent<ChangeCellTypeOptions>;

        Example:
            runtime.controls.changeCellType( {id: 'cell-183d03a2f079', newCellType: 'python'} )
---
    setCellProperty: 
        ƒ setCellProperty(opts: SetCellPropertyOptions) 
            type SetCellPropertyOptions = { id: string; property: string; value: any };

        Function triggers "sb:set_cell_property" event.
            type SetCellPropertyEvent = CustomEvent<SetCellPropertyOptions>;

        Examples: 
            runtime.controls.setCellProperty( {id: 'cell-183d03a2f079', property: 'locked', value: true})
            runtime.controls.setCellProperty( {id: 'cell-183d03a2f079', property: 'plugin-cell-property', value: 'custom'})
---
    resetCell: Resets the given cell, recreating the entire thing.
        ƒ resetCell(opts: ResetCellOptions)
            type ResetCellOptions = { id: string };

        Function triggers "sb:reset_cell" event. 
            type ResetCellEvent = CustomEvent<ResetCellOptions>;
    
        Example:
            runtime.controls.resetCell( {id: 'cell-183d03a2f079'} )
---
    runCell: 
        ƒ runCell(opts: RunCellOptions)
            type RunCellOptions = { id: string };

        Function triggers "sb:run_cell" event. 
            type RunCellEvent = CustomEvent<RunCellOptions>;

        Example:
            runtime.controls.runCell( {id: 'cell-183d03a2f079'} )
---
    focusCell: 
        ƒ focusCell(opts: FocusCellOptions)
            type FocusCellOptions = {
                id: string;
                focusTarget?: “previous” | “next”;
            };

        Function triggers "sb:focus_cell" event.
            type FocusCellEvent = CustomEvent<FocusCellOptions>;
        
        Examples:
            runtime.control.focusCell( {id: 'cell-183d03a2f079'} )
            runtime.control.focusCell( {id: 'cell-183d03a2f079', focusTarget: "next"} )
            
---
    clearCell: Calls clear() on the cell implementation. That usually means clearing output. 
        ƒ clearCell()
            type ClearCellOptions = { id: string };

        Function triggers "sb:clear_cell" event. 
            type ClearCellEvent = CustomEvent<ClearCellOptions>;

        Example: 
            runtime.controls.clearCell( {id: 'cell-183d03a2f079'} )
---
    save: 
        ƒ save(opts: any)

        Function triggers "sb:save" event. 
            type SaveEvent = CustomEvent<Record<string, never>>;
        
        Examples: 
            runtime.controls.save()
            runtime.controls.save('custom-site-or-plugin-message')
---
    runAllCells: 
        ƒ runAllCells(opts: RunAllCellsOptions = {}) 
            RunAllCellsOptions = { onlyRunOnLoad?: boolean; isInitialRun?: boolean };
        
        Function triggers "sb:run_all_cells" event. 
            type RunAllCellsEvent = CustomEvent<RunAllCellsOptions>;
        
        Examples:
            runtime.controls.runAllCells()
            runtime.controls.runAllCells( {onlyRunOnLoad: true, isInitialRun: false} )
---
    clearAllCells: 
        ƒ clearAllCells()
            *No arguments

        Function does not trigger an event directly, but calls clearCell, which will trigger events. 

        Example:
            runtime.controls.clearAllCells()
---
    sendMessage: 
        ƒ sendMessage(message: OutboundNotebookMessage, opts: { targetOrigin?: string } = {})

        Function does not trigger an event. 
        
        Example: 
            runtime.controls.sendMessage( 'Hello from the notebook.' )
