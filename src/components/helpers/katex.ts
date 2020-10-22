// @ts-ignore
import katexPlugin from '@iktakahiro/markdown-it-katex';
import 'katex/dist/katex.min.css';
import MarkdownIt from 'markdown-it';


export function hookMarkdownItToKaTeX(markdownItInstance: MarkdownIt) {
    markdownItInstance.use(katexPlugin, {"throwOnError" : false, "errorColor" : " #cc0000"});
}
