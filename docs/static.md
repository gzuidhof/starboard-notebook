# Standalone, Static Starboard Notebook

Starboard Notebooks don't require any backend server to be fully functional, so by only serving a few static files you can have a fully functional notebook. It will work on any static file host (such as Github pages)!

## Simple: Use a CDN
Create a HTML file like such

```html
<!doctype html>
<html>
    <head>
        <meta charset="utf-8">
        <title>Starboard Notebook</title>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <link rel="icon" href="./favicon.ico">
        <link href="https://unpkg.com/starboard-notebook@0.5.4/dist/starboard-notebook.css" rel="stylesheet">
    </head>
    <body>
        <script>
            // The content of the notebook as a string
            window.initialNotebookContent = `
%% md
# Introducing Starboard Notebook
Starboard brings cell-by-cell notebooks to the browser, no code is running on the backend here!
It's probably the quickest way to visualize some data with interactivity, do some prototyping, or build a rudimentary dashboard.

#### Some features 
* Mix Markdown, HTML, CSS and Javascript.
* The file format is a plaintext file, which plays nice with version control systems like git.
* Runs entirely in your browser, everything is static: no server, no setup and no build step.

> Tip: Press the ▶ Play button on the left to run a cell's code.
%% js
// You write vanilla Javascript
const greeting = "Hello world!";

// The last statement in a cell will be displayed if it is not undefined.
greeting`;

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
            window.starboardArtifactsUrl = `https://unpkg.com/starboard-notebook@0.5.4/dist/`;
        </script>

        <script src="https://unpkg.com/starboard-notebook@0.5.4/dist/starboard-notebook.js"></script>
    </body>
</html>
```

That's it! Serve the html file from any static file host (e.g. Vercel, Netlify, Github Pages, S3, ...) and upon visiting the webpage there should be a fully functional notebook :).


## Advanced: Host all the files yourself

### Step 1 - Get a static build of starboard-notebook
Build starboard notebook (`npm i && npm run build`) and take the contents from the dist folder.

Alternatively, you can download the artifacts from  
```bash
# Replace the version number with the version you want
https://registry.npmjs.org/starboard-notebook/-/starboard-notebook-0.5.4.tgz
```

### Step 2 - Edit (or replace) the index.html file

The index.html file looks like this

```html
<!doctype html>
<html>
    <head>
        <meta charset="utf-8">
        <title>Starboard Notebook</title>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <link rel="icon" href="./favicon.ico">
        <link href="./starboard-notebook.css" rel="stylesheet">
    </head>
    <body>
        <script> 
            /* Script like in the Simple example above */
        </script>
        <script src="./starboard-notebook.js"></script>
    </body>
</html>
```

### Step 3 - Done!
Serve these files from any static file host (e.g. Vercel, Netlify, Github Pages, S3, ...) and upon visiting the webpage there should be a fully functional notebook :).


