# This Dockerfile exists mainly to install some additional packages for the devcontainer
# See devcontainer.json
FROM mcr.microsoft.com/devcontainers/typescript-node:0-18
RUN npm install -g lerna yarn
RUN yarn run bootstrap
RUN yarn build
