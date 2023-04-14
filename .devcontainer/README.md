# `.devcontainer`

This folder contains all files to get going in a devcontainer.
See [containers.dev](https://containers.dev) for more information about what those are.

One service you could use this file with is [Github Codespaces](https://github.com/codespaces).

If you have started up your dev container, a development server can be started from the Terminal:
```bash
cd packages/starboard-notebook
yarn install
yarn start
```

Within some time, Starboard Notebook will be running on port 9001.
The port should be forwarded and can be found in the Ports tab.
A pop-up might appear with a link to your forwarded development server.
