import MarkdownIt from 'markdown-it';
import emoji from 'markdown-it-emoji';

export function hookMarkdownItToEmojiPlugin(markdownItInstance: MarkdownIt, withShortcuts = false) {
    markdownItInstance.use(emoji, {shortcuts: withShortcuts? undefined : {}});
}