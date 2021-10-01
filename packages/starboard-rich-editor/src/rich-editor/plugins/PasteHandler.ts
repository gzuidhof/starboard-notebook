import { Plugin } from "prosemirror-state";
import { isInTable } from "prosemirror-tables";
import { toggleMark } from "prosemirror-commands";
import Extension from "rich-markdown-editor/dist/lib/Extension";
import isUrl from "rich-markdown-editor/dist/lib/isUrl";
import isMarkdown from "rich-markdown-editor/dist/lib/isMarkdown";
import selectionIsInCode from "rich-markdown-editor/dist/queries/isInCode";

/**
 * Add support for additional syntax that users paste even though it isn't
 * supported by the markdown parser directly by massaging the text content.
 *
 * @param text The incoming pasted plain text
 */
function normalizePastedMarkdown(text: string): string {
  // find checkboxes not contained in a list and wrap them in list items
  const CHECKBOX_REGEX = /^\s?(\[(X|\s|_|-)\]\s(.*)?)/gim;

  while (text.match(CHECKBOX_REGEX)) {
    text = text.replace(CHECKBOX_REGEX, (match) => `- ${match.trim()}`);
  }

  return text;
}

export default class PasteHandler extends Extension {
  get name() {
    return "markdown-paste";
  }

  get plugins() {
    return [
      new Plugin({
        props: {
          handlePaste: (view, event: ClipboardEvent) => {
            if (view.props.editable && !view.props.editable(view.state)) {
              return false;
            }
            if (!event.clipboardData) return false;

            const text = event.clipboardData.getData("text/plain");
            const html = event.clipboardData.getData("text/html");
            const vscode = event.clipboardData.getData("vscode-editor-data");
            const { state, dispatch } = view;

            // first check if the clipboard contents can be parsed as a single
            // url, this is mainly for allowing pasted urls to become embeds
            if (isUrl(text)) {
              // just paste the link mark directly onto the selected text
              if (!state.selection.empty) {
                toggleMark(this.editor.schema.marks.link, { href: text })(state, dispatch);
                return true;
              }

              // Is this link embeddable? Create an embed!
              const { embeds } = this.editor.props;

              if (embeds && !isInTable(state)) {
                for (const embed of embeds) {
                  const matches = embed.matcher(text);
                  if (matches) {
                    this.editor.commands.embed({
                      href: text,
                    });
                    return true;
                  }
                }
              }

              // well, it's not an embed and there is no text selected – so just
              // go ahead and insert the link directly
              const transaction = view.state.tr
                .insertText(text, state.selection.from, state.selection.to)
                .addMark(
                  state.selection.from,
                  state.selection.to + text.length,
                  state.schema.marks.link.create({ href: text })
                );
              view.dispatch(transaction);
              return true;
            }

            // If the users selection is currently in a code block then paste
            // as plain text, ignore all formatting and HTML content.
            if (selectionIsInCode(view.state)) {
              event.preventDefault();

              view.dispatch(view.state.tr.insertText(text));
              return true;
            }

            // Because VSCode is an especially popular editor that places metadata
            // on the clipboard, we can parse it to find out what kind of content
            // was pasted.
            const vscodeMeta = vscode ? JSON.parse(vscode) : undefined;
            const pasteCodeLanguage = vscodeMeta?.mode;

            if (pasteCodeLanguage && pasteCodeLanguage !== "markdown") {
              event.preventDefault();
              view.dispatch(
                view.state.tr
                  .replaceSelectionWith(
                    view.state.schema.nodes.code_fence.create({
                      language: vscodeMeta.mode, //Object.keys(vscodeMeta.mode).includes(vscodeMeta.mode) ? vscodeMeta.mode : null,
                    })
                  )
                  .insertText(text)
              );
              return true;
            }

            // If the HTML on the clipboard is from Prosemirror then the best
            // compatability is to just use the HTML parser, regardless of
            // whether it "looks" like Markdown, see: outline/outline#2416
            if (html?.includes("data-pm-slice")) {
              return false;
            }

            // If the text on the clipboard looks like Markdown OR there is no
            // html on the clipboard then try to parse content as Markdown
            if (isMarkdown(text) || html.length === 0 || pasteCodeLanguage === "markdown") {
              event.preventDefault();

              const paste = this.editor.pasteParser.parse(normalizePastedMarkdown(text));
              const slice = paste.slice(0);

              const transaction = view.state.tr.replaceSelection(slice);
              view.dispatch(transaction);
              return true;
            }

            // otherwise use the default HTML parser which will handle all paste
            // "from the web" events
            return false;
          },
        },
      }),
    ];
  }
}
