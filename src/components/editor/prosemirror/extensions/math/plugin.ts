/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */


// prosemirror imports
import { Node as ProseNode } from "prosemirror-model";
import { Plugin as ProsePlugin, PluginKey, PluginSpec } from "prosemirror-state";
import { MathView } from "./nodeView";
import { EditorView } from "prosemirror-view";

////////////////////////////////////////////////////////////

interface IMathPluginState {
    macros: { [cmd: string]: string };
    activeNodeViews: MathView[];
}

/** 
 * Returns a function suitable for passing as a field in `EditorProps.nodeViews`.
 * @param displayMode TRUE for block math, FALSE for inline math.
 * @see https://prosemirror.net/docs/ref/#view.EditorProps.nodeViews
 */
export function createMathView(displayMode: boolean) {
    return (node: ProseNode, view: EditorView, getPos: boolean | (() => number)): MathView => {
        /** @todo is this necessary?
        * Docs says that for any function proprs, the current plugin instance
        * will be bound to `this`.  However, the typings don't reflect this.
        */
        const pluginState = mathPluginKey.getState(view.state);
        if (!pluginState) { throw new Error("no math plugin!"); }
        const nodeViews = pluginState.activeNodeViews;

        // set up NodeView
        const nodeView = new MathView(
            node, view, getPos as (() => number),
            { katexOptions: { displayMode, macros: pluginState.macros } },
            () => { nodeViews.splice(nodeViews.indexOf(nodeView)); },
        );

        nodeViews.push(nodeView);
        return nodeView;
    };
}

const mathPluginKey = new PluginKey<IMathPluginState>("prosemirror-math");

const mathPluginSpec: PluginSpec<IMathPluginState> = {
    key: mathPluginKey,
    state: {
        init(_config, _instance) {
            return {
                macros: {},
                activeNodeViews: []
            };
        },
        apply(tr, value, oldState, newState) {
            /** @todo (8/21/20)
             * since new state has not been fully applied yet, we don't yet have
             * information about any new MathViews that were created by this transaction.
             * As a result, the cursor position may be wrong for any newly created math blocks.
             */
            const pluginState = mathPluginKey.getState(oldState);
            if (pluginState) {
                for (const mathView of pluginState.activeNodeViews) {
                    mathView.updateCursorPos(newState);
                }
            }
            return value;
        },
        /** @todo (8/21/20) implement serialization for math plugin */
        // toJSON(value) { },
        // fromJSON(config, value, state){ return {}; }
    },
    props: {
        nodeViews: {
            "math_inline": createMathView(false),
            "math_block": createMathView(true)
        }
    }
};

export const mathPlugin = new ProsePlugin(mathPluginSpec);