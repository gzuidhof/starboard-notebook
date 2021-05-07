# Custom prosemirror plugins

- `math` is adapted from the
  [prosemirror-math](https://github.com/benrbray/prosemirror-math) project by
  Benjamin R. Bray, MIT licensed.\
  Notable changes include lazy-loading KaTeX like in the rest of Starboard for
  fast initial load.
- `markdown` is adapted from prosemirror-markdown. Support is added for LaTeX
  serialization, and it uses the Starboard schema instead for the parser.
