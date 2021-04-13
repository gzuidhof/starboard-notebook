import { CellPropertyDefinition } from "src/types";
import { registry } from "./registry";

/**
 * A cell with metadata
 * ```
 * properties: {
 *   locked: true,
 *   run_on_load: "123",
 *   no: false,
 * }
 * ```
 * 
 * will get classes "property-locked property-run_on_load property-no" if those are known properties.
 * All `Object.getOwnPropertyNames` properties get added (or removed if not present).
 * Unknown properties don't get CSS classes added.
 * 
 * @param properties
 */
export function syncPropertyElementClassNames(el: HTMLElement, properties: Record<string, any>) {
    // Retrieve an object with className for every property on the cell properties object. It is undefined for unknown properties.
    const defs = Object.getOwnPropertyNames(properties).map(d => registry.get(d)).filter(x => x) as CellPropertyDefinition[];
    const desiredPropertyClasses = new Set(defs.map(x => "property-" + x.cellProperty));

    el.classList.forEach(v => {
        if (v.startsWith("property-") && !desiredPropertyClasses.has(v)) {
            el.classList.remove(v);
        }
    });

    for (const x of desiredPropertyClasses.keys()) {
        el.classList.toggle(x, true);
    }
}
