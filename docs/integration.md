# Integrating Starboard Notebook into your website


## Notebook in an iFrame
If you want to embed a notebook onto your website you usually would use an iFrame, for example:

```html
<iframe
  title="Starboard Notebook Sandbox iFrame"
  id="notebook-iframe"
  src="https://unpkg.com/starboard-notebook@0.5.4/dist/index.html"
  sandbox="allow-scripts allow-modals allow-same-origin allow-pointer-lock allow-top-navigation-by-user-activation allow-forms allow-downloads"
  frameborder="0"></iframe>
```

### Warning: About the domain of the notebook

⚠️ You should make sure the `src` value points to a different domain than the parent website if you are not sure what the content in the notebook will be. If the iframe has the same domain as the parent website the iframe's sandbox is no longer bulletproof and you will be at risk of XSS (cross site scripting).

`LocalStorage` in the notebook will be shared with any notebooks that run on the same domain. Starboard.gg gets around this by giving every user a unique subdomain which serves the notebook iframe. If you don't care about things like LocalStorage you don't have to worry about this.


## Communication between the parent website and notebook iframe

### Sending and receiving messages from the iFrame
iFrames by default have a fixed size, they can not adjust to their contents. For most integrations you probably do want the notebook to adjust its size automatically (i.e. grow vertically as cells are added), for that Starboard uses the [iFrameResizer](https://github.com/davidjbradshaw/iframe-resizer) library. This library is also used for sending and receiving messages.

In your parent website you will have to import iFrameResizer (install with `npm i --save iframe-resizer`):

```javascript
import * as iFrameResizer from 'iframe-resizer/js/iframeResizer';
```

And you can then communicate with the iFrame:

```javascript
const initialNotebookContent = `
%%md
# iFrame example
%%js
const x = "Hello world!"
x`

let currentNotebookContent = initialNotebookContent;

window.iFrameComponent = iFrameResizer({ // Check the iframeResizer docs&code for the options here
    autoResize: true, 
    checkOrigin: [
    "http://localhost:9001", // Useful for local development
    "https://unpkg.com", // Replace with where you are hosting the notebook iframe
    ],
    onMessage: (messageData) => {
        // This message is sent when the notebook is ready
        // Respond to this message with the initial content of the notebook.
        //
        // The iFrame will send this message multiple times until you set the content.
        if (messageData.message.type === "SIGNAL_READY") {
            window.iFrameComponent[0].iFrameResizer.sendMessage({
                type: "SET_NOTEBOOK_CONTENT", data: initialNotebookContentString
            })

        // Whenever the notebook content gets changed (e.g. a character is typed)
        // the entire content is sent to the parent website.
        } else if (messageData.message.type === "NOTEBOOK_CONTENT_UPDATE") {
            currentNotebookContent = messageData.message.data;

        // This signal is sent when a save shortcut (e.g. cmd+s on mac) is pressed.
        } else if (messageData.message.type === "SAVE") {
            currentNotebookContent = messageData.message.data;
            save(); // Implement your own save function..
        }
    },
    onReady: () => {},
    inPageLinks: true,
}, document.querySelector("#notebook-iframe"));
```

Finally, you can send one more message to the iframe - to make it reload the page:

```javascript
window.iFrameComponent[0].iFrameResizer.sendMessage({type: "RELOAD"});
```

It is currently not possible to send and receive custom messages (easily) - but that will definitely be a feature in the future if someone needs it.

## Example

View the [example HTML file here](https://raw.githack.com/gzuidhof/starboard-notebook/master/docs/integration-example.html).




