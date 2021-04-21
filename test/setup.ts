import fetch from "node-fetch";
const { Crypto } = require("@peculiar/webcrypto");

declare let global: any;

Object.assign(global, {
  fetch: fetch,
  crypto: new Crypto()
});
