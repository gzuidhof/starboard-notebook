# Standalone, Static Starboard Notebook

Starboard Notebooks don't require any backend server to be fully functional, all it needs are a bunch of static files. It will work on any static web host such as Github pages.

Create a HTML file like such:

```html
<!doctype html>
<html>
    <head>
        <meta charset="utf-8">
        <title>Starboard Notebook</title>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <link href="https://unpkg.com/starboard-notebook@0.6.0/dist/starboard-notebook.css" rel="stylesheet">
    </head>
    <body>

<script type="application/vnd.starboard.nb">
# %% [markdown]
# Introducing Starboard Notebook
Starboard brings cell-by-cell notebooks to the browser, no code is running on the backend here!
It's probably the quickest way to visualize some data with interactivity, do some prototyping, or build a rudimentary dashboard.

#### Some features 
* Mix Markdown, HTML, CSS and Javascript.
* The file format is a plaintext file, which plays nice with version control systems like git.
* Runs entirely in your browser, everything is static: no server, no setup and no build step.

> Tip: Press the ▶ Play button on the left to run a cell's code.
# %% [javascript]
// You write vanilla Javascript
const greeting = "Hello world!";

// The last statement in a cell will be displayed if it is not undefined.
greeting
</script>

        <script src="https://unpkg.com/starboard-notebook@0.6.0/dist/starboard-notebook.js"></script>
    </body>
</html>
```

Or you can set the notebook content using Javascript:
```html
<!doctype html>
<html>
    <head>
        <meta charset="utf-8">
        <title>Starboard Notebook</title>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <link href="https://unpkg.com/starboard-notebook@0.6.0/dist/starboard-notebook.css" rel="stylesheet">
    </head>
    <body>
        <script>
            // The content of the notebook as a string, remember to escape the string properly.
            window.initialNotebookContent = `
# %% [markdown]
# Introducing Starboard Notebook
Starboard brings cell-by-cell notebooks to the browser, no code is running on the backend here!
It's probably the quickest way to visualize some data with interactivity, do some prototyping, or build a rudimentary dashboard.

#### Some features 
* Mix Markdown, HTML, CSS and Javascript.
* The file format is a plaintext file, which plays nice with version control systems like git.
* Runs entirely in your browser, everything is static: no server, no setup and no build step.

> Tip: Press the ▶ Play button on the left to run a cell's code.
# %% [javascript]
// You write vanilla Javascript
const greeting = "Hello world!";

// The last statement in a cell will be displayed if it is not undefined.
greeting`;
        </script>
        <script src="https://unpkg.com/starboard-notebook@0.6.0/dist/starboard-notebook.js"></script>
    </body>
</html>
```

And you're done! Serve this html file using any web server or from a static host (e.g. Vercel, Netlify, Github Pages, S3, ...) and upon visiting the webpage there should be a fully functional notebook :).

### Caveat when using a `<script type="application/vnd.starboard.nb>` tag 
Because of the way browsers parse a page, you can't have the text `"</script>"` (or anything similar such as `"</ScrIpT >"`) anywhere in your notebook content as it will otherwise terminate the outer script. Use the Javascript method instead if your notebook may contain such a tag.

## Other options you can set
```javascript
// Optional: A small "Edit on Starboard" link can be shown at the bottom of the page.
// If you don't set it, no link will be shown
window.starboardEditUrl = `https://starboard.gg/nb/n3DYopT`;

// Optional: Where the Pyodide runtime (=Python) artifacts live. These artifacts are
// downloaded dynamically. By default the Pyodide CDN is used.
// For production use-cases you should host these files yourself as this CDN
// may not be around forever.
//
// You can download the artifacts from their Github Releases page: https://github.com/iodide-project/pyodide/releases
window.pyodideArtifactsUrl = `https://pyodide-cdn2.iodide.io/v0.15.0/full/`;

// Optional: Override the automatically calculated base URL where the starboard-notebook files are hosted.
// You probably don't have to set this manually - ever.
window.starboardArtifactsUrl = `https://unpkg.com/starboard-notebook@0.6.0/dist/`;
```

## Alternative: Host the files yourself
The above example uses the [unpkg](https://unpkg.com) CDN for the built files. For production use-cases, or if you are not connected to the internet, you will probably want to serve the artifacts (=`.js`, `.css`, etc. files) yourself.

To get a static build, you can either clone the repository and build starboard notebook (`npm i && npm run build`) from source, then serve the contents of the dist folder.

Alternatively, you can download the artifacts from  
```bash
# Replace the version number with the version you want
https://registry.npmjs.org/starboard-notebook/-/starboard-notebook-0.5.4.tgz
```

After this, update the URLs in the HTML file.. Done! :rocket:
