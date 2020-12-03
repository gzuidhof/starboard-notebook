import fetch from "node-fetch"
const { Crypto } = require("@peculiar/webcrypto");

declare var global: any;

Object.assign(global, {
  fetch: fetch,
  crypto: new Crypto()
});
