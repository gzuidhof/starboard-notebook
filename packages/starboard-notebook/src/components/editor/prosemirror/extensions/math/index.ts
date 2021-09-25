/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import {
  makeBlockMathInputRule,
  makeInlineMathInputRule,
  REGEX_BLOCK_MATH_DOLLARS,
  REGEX_INLINE_MATH_DOLLARS,
} from "@benrbray/prosemirror-math";

import { Plugin } from "prosemirror-state";
import { Schema } from "prosemirror-model";
import { insertMathCmd, mathBackspaceCmd } from "@benrbray/prosemirror-math";

import { inputRules } from "prosemirror-inputrules";
import { keymap } from "prosemirror-keymap";
import { chainCommands, deleteSelection, joinBackward, selectNodeBackward } from "prosemirror-commands";
import { mathPlugin } from "./plugin";

export function buildMathPlugins(schema: Schema): Plugin<any, any>[] {
  const inlineMathInputRule = makeInlineMathInputRule(REGEX_INLINE_MATH_DOLLARS, schema.nodes.math_inline);
  const blockMathInputRule = makeBlockMathInputRule(REGEX_BLOCK_MATH_DOLLARS, schema.nodes.math_display);

  return [
    mathPlugin,
    keymap({
      "Mod-Space": insertMathCmd(schema.nodes.math_inline),
      // modify the default keymap chain for backspace
      Backspace: chainCommands(deleteSelection, mathBackspaceCmd, joinBackward, selectNodeBackward),
    }),
    inputRules({ rules: [inlineMathInputRule, blockMathInputRule] }),
  ];
}

// export function insertMath(schema: Schema){
// 	const mathType = schema.nodes.inlinemath;
// 	return function(state:EditorState, dispatch:((tr:Transaction)=>void)|undefined){
// 		const { $from } = state.selection, index = $from.index();
// 		if (!$from.parent.canReplaceWith(index, index, mathType)) {
// 			return false;
// 		}
// 		if (dispatch){
// 			let tr = state.tr.replaceSelectionWith(mathType.create({}));
// 			tr = tr.setSelection(NodeSelection.create(tr.doc, $from.pos));
// 			dispatch(tr);
// 		}
// 		return true;
// 	};
// }
