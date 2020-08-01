import prism from 'markdown-it-prism';

import "prismjs/themes/prism.css";

import "prismjs/components/prism-markup";
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-css";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";

import "prismjs/components/prism-asciidoc";
import "prismjs/components/prism-brainfuck";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-coffeescript";

import "prismjs/components/prism-dart";
import "prismjs/components/prism-docker";
import "prismjs/components/prism-elixir";
import "prismjs/components/prism-erlang";
import "prismjs/components/prism-glsl";
import "prismjs/components/prism-go";
import "prismjs/components/prism-graphql";
import "prismjs/components/prism-java";
import "prismjs/components/prism-julia";
import "prismjs/components/prism-lua";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-ocaml";
import "prismjs/components/prism-perl";
import "prismjs/components/prism-php";
import "prismjs/components/prism-python";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-r";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-scala";
import "prismjs/components/prism-scheme";
import "prismjs/components/prism-smalltalk";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-swift";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-wasm";
import "prismjs/components/prism-yaml";


// Depends on Ruby so must be imported later
import "prismjs/components/prism-crystal";

export function hookMarkdownIt(markdownItInstance: any) {
    markdownItInstance.use(prism, {
        plugins: [/*"autolinker",*/ "highlight-keywords"]});
    
    const originalHighlight = markdownItInstance.options.highlight;

    // Monkeypatch for webpack build support for unknown languages
    markdownItInstance.options.highlight = (...args: any) => {
        if ((globalThis as any).Prism.languages[args[1]] === undefined) {
            args[1] = "clike";
        }
        return originalHighlight(...args);
    };
}