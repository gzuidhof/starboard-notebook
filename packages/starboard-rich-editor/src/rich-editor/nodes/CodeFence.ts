import { setBlockType } from "prosemirror-commands";
import { textblockTypeInputRule } from "prosemirror-inputrules";
import copy from "copy-to-clipboard";
import isInCode from "rich-markdown-editor/dist/queries/isInCode";
import Node from "rich-markdown-editor/dist/nodes/Node";
import { ToastType } from "rich-markdown-editor/dist/types";
import Token from "markdown-it/lib/token";

export default class CodeFence extends Node {
  get languageOptions() {
    return Object.entries(["javascript", "python"]);
  }

  get name() {
    return "code_fence";
  }

  get schema() {
    return {
      attrs: {
        language: {
          default: "javascript",
        },
      },
      content: "text*",
      marks: "",
      group: "block",
      code: true,
      defining: true,
      draggable: false,
      parseDOM: [
        { tag: "pre", preserveWhitespace: "full" },
        {
          tag: ".code-block",
          preserveWhitespace: "full",
          contentElement: "code",
          getAttrs: (dom: HTMLDivElement) => {
            return {
              language: dom.dataset.language,
            };
          },
        },
      ],
      toDOM: (node: any) => {
        const button = document.createElement("button");
        button.innerText = "Copy";
        button.type = "button";
        button.addEventListener("click", this.handleCopyToClipboard);

        const languageInput = document.createElement("input");
        languageInput.addEventListener("change", this.handleLanguageChange);

        languageInput.value = node.attrs.language;

        // this.languageOptions.forEach(([key, label]) => {
        //   const option = document.createElement("option");
        //   const value = key === "none" ? "" : key;
        //   option.value = value;
        //   option.innerText = label;
        //   option.selected = node.attrs.language === value;
        //   select.appendChild(option);
        // });

        return [
          "div",
          { class: "code-block", "data-language": node.attrs.language },
          ["div", {}, languageInput, button],
          ["pre", ["code", { spellCheck: false }, 0]],
        ];
      },
    };
  }

  //@ts-ignore
  commands({ type }) {
    return () => setBlockType(type);
  }

  //@ts-ignore
  keys({ type }) {
    return {
      "Shift-Ctrl-\\": setBlockType(type),
      //@ts-ignore
      "Shift-Enter": (state, dispatch) => {
        if (!isInCode(state)) return false;

        const { tr, selection } = state;
        dispatch(tr.insertText("\n", selection.from, selection.to));
        return true;
      },
      //@ts-ignore
      Tab: (state, dispatch) => {
        if (!isInCode(state)) return false;

        const { tr, selection } = state;
        dispatch(tr.insertText("  ", selection.from, selection.to));
        return true;
      },
    };
  }

  handleCopyToClipboard = (event: Event) => {
    const { view } = this.editor;
    const element = event.target;
    const { top, left } = (element as HTMLElement).getBoundingClientRect();
    const result = view.posAtCoords({ top, left });

    if (result) {
      const node = view.state.doc.nodeAt(result.pos);
      if (node) {
        copy(node.textContent);
        if (this.options.onShowToast) {
          this.options.onShowToast(this.options.dictionary.codeCopied, ToastType.Info);
        }
      }
    }
  };

  handleLanguageChange = (event: Event) => {
    const { view } = this.editor;
    const { tr } = view.state;
    const element = event.target;
    const { top, left } = (element as HTMLElement).getBoundingClientRect();
    const result = view.posAtCoords({ top, left });

    if (result) {
      const transaction = tr.setNodeMarkup(result.inside, undefined, {
        language: (element as HTMLInputElement).value,
      });
      view.dispatch(transaction);
    }
  };

  get plugins() {
    return [];
  }

  //@ts-ignore
  inputRules({ type }) {
    return [textblockTypeInputRule(/^```$/, type)];
  }

  toMarkdown(state: any, node: any) {
    state.write("```" + (node.attrs.language || "") + "\n");
    state.text(node.textContent, false);
    state.ensureNewLine();
    state.write("```");
    state.closeBlock(node);
  }

  get markdownToken() {
    return "fence";
  }

  parseMarkdown() {
    return {
      block: "code_block",
      getAttrs: (tok: Token) => ({ language: tok.info }),
    };
  }
}
