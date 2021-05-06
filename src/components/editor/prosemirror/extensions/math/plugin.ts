/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/*---------------------------------------------------------
 *  Author: Benjamin R. Bray
 *  License: MIT (see LICENSE in project root for details)
 *--------------------------------------------------------*/

// prosemirror imports
import { Node as ProseNode } from "prosemirror-model";
import { Plugin as ProsePlugin, PluginKey, PluginSpec } from "prosemirror-state";
import { MathView } from "./nodeView";
import { EditorView } from "prosemirror-view";

////////////////////////////////////////////////////////////

export interface IMathPluginState {
  macros: { [cmd: string]: string };
  /** A list of currently active `NodeView`s, in insertion order. */
  activeNodeViews: MathView[];
  /**
   * Used to determine whether to place the cursor in the front- or back-most
   * position when expanding a math node, without overriding the default arrow
   * key behavior.
   */
  prevCursorPos: number;
}

// uniquely identifies the prosemirror-math plugin
const MATH_PLUGIN_KEY = new PluginKey<IMathPluginState>("prosemirror-math");

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
    const pluginState = MATH_PLUGIN_KEY.getState(view.state);
    if (!pluginState) throw new Error("no math plugin!");
    const nodeViews = pluginState.activeNodeViews;

    // set up NodeView
    const nodeView = new MathView(
      node,
      view,
      getPos as () => number,
      { katexOptions: { displayMode, macros: pluginState.macros } },
      MATH_PLUGIN_KEY as any, //TODO why is this cast necessary?
      () => {
        nodeViews.splice(nodeViews.indexOf(nodeView));
      }
    );

    nodeViews.push(nodeView);
    return nodeView;
  };
}

const mathPluginSpec: PluginSpec<IMathPluginState> = {
  key: MATH_PLUGIN_KEY,
  state: {
    init(_config, _instance) {
      return {
        macros: {},
        activeNodeViews: [],
        prevCursorPos: 0,
      };
    },
    apply(_tr, value, oldState, _newState) {
      // produce updated state field for this plugin
      return {
        // these values are left unchanged
        activeNodeViews: value.activeNodeViews,
        macros: value.macros,
        // update with the second-most recent cursor pos
        prevCursorPos: oldState.selection.from,
      };
    },
    /** @todo (8/21/20) implement serialization for math plugin */
    // toJSON(value) { },
    // fromJSON(config, value, state){ return {}; }
  },
  props: {
    nodeViews: {
      math_inline: createMathView(false),
      math_display: createMathView(true),
    },
  },
};

export const mathPlugin = new ProsePlugin(mathPluginSpec);
