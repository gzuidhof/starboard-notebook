import mdlib from "markdown-it";
import { hookMarkdownItCrossOriginImages } from "./crossOriginIsolated";
import { hookMarkdownItToEmojiPlugin } from "./emoji";
import { hookMarkdownItToCodemirrorHighlighter } from "./highlight";
import { hookMarkdownItToKaTeX } from "./katex";

export function getMarkdownItWithDefaultPlugins(
  markdownitOpts: mdlib.Options = { html: true }
): { md: mdlib; katexLoaded: Promise<void> } {
  const md = new mdlib(markdownitOpts);
  hookMarkdownItToCodemirrorHighlighter(md);
  hookMarkdownItToEmojiPlugin(md);
  hookMarkdownItCrossOriginImages(md);
  const prom = hookMarkdownItToKaTeX(md);

  return {
    md,
    katexLoaded: prom,
  };
}
