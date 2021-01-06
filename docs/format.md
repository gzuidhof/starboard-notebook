# Starboard Notebook format

Starboard Notebooks are stored on disk as a plaintext file in utf-8 encoding. The mimetype is `application/vnd.starboard.nb`, the file extension is either `.nb` or `.sbnb`.

The format is similar to [Jupytext](https://github.com/mwouts/jupytext)'s [percent format](https://github.com/mwouts/jupytext/blob/master/docs/formats.md#the-percent-format).


## Notebook metadata (a.k.a. frontmatter)

A notebook file can start with an optional YAML header which is delineated by `---`. For example:

```yaml
---
starboard:
  some_metadata: 1234
  version: "1.2.3"
---
```

## Notebook cells
Notebook cells start with a cell delineator, which starts with a line comment (`#` or `//`) followed by at least two `%` characters. A regex for this is `^(#|\/\/)\s*%{2,}-*`.

On the same line there is also the cell type identifier in square brackets (e.g. `[javascript]`). A cell type identifier should always be present.

A cell delimiter either contains metadata or doesn't, in case it does the `%` characters are followed by at least 3 hypens (`-`). In the case there is metadata, the next lines are interpreted as YAML until a line containing `# ---%%` or `// ---%%` or is read. The YAML lines start with a line comment which should be ignored when deserializing the YAML.

After this cell delineator the cell's content is present in plaintext.

### Examples

```python
# %% [python]
print("A simple python cell")
# %% [markdown]
**Markdown** is also wrapped in a cell

# %%--- [javascript]
# yaml_cell_header: "across multiple lines, delineated by special %%--- and ---%%"
# which: "should be compatible with Spyder, VS Code, etc. Although not understood of course"
# indented:
#   looks_like: "this"
# ---%%
console.log("Hello!");
const x = 3;
x;
```
