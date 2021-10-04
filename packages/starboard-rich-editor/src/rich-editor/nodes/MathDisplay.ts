// @ts-nocheck
import { makeBlockMathInputRule, REGEX_BLOCK_MATH_DOLLARS, insertMathCmd } from "@benrbray/prosemirror-math";
import Node from "rich-markdown-editor/dist/nodes/Node";

export default class MathDisplay extends Node {
  get name() {
    return "math_display";
  }

  get schema() {
    return {
      group: "block math",
      content: "text*",
      block: true,
      // atom: true,
      // code: true,
      toDOM: (n, k) => {
        console.log(n);
        return ["math-display", { class: "math-node", spellcheck: "false" }, 0];
      },
      parseDOM: [
        {
          tag: "math-display",
        },
      ],
    };
  }

  commands({ type }) {
    return () => insertMathCmd(type);
  }

  inputRules({ type }) {
    return [makeBlockMathInputRule(REGEX_BLOCK_MATH_DOLLARS, type)];
  }

  toMarkdown(state, node) {
    state.write("$$\n");
    state.text(node.textContent, false);
    state.ensureNewLine();
    state.write("$$");
    state.closeBlock(node);
  }

  parseMarkdown() {
    return {
      block: "math_display",
      noCloseToken: true,
    };
  }
}
