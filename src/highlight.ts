/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* eslint-disable */
import 'highlight.js/styles/vs.css';

// By not supporting every language we can save around 700KB in the final build
const highlight = require("highlight.js/lib/highlight.js");

// Web languages
highlight.registerLanguage('javascript', require('highlight.js/lib/languages/javascript'));
highlight.registerLanguage('typescript', require('highlight.js/lib/languages/typescript'));
highlight.registerLanguage('css', require('highlight.js/lib/languages/css'));
highlight.registerLanguage('xml', require('highlight.js/lib/languages/xml'));
highlight.registerLanguage('html', require('highlight.js/lib/languages/xml'));
highlight.registerLanguage('glsl', require('highlight.js/lib/languages/glsl'));
highlight.registerLanguage('json', require('highlight.js/lib/languages/json'));
highlight.registerLanguage('plaintext', require('highlight.js/lib/languages/plaintext'));

// Web++ languages
highlight.registerLanguage('less', require('highlight.js/lib/languages/less'));
highlight.registerLanguage('scss', require('highlight.js/lib/languages/scss'));
highlight.registerLanguage('stylus', require('highlight.js/lib/languages/stylus'));
highlight.registerLanguage('markdown', require('highlight.js/lib/languages/markdown'));
highlight.registerLanguage('coffeescript', require('highlight.js/lib/languages/coffeescript'));

// Some other common languages
highlight.registerLanguage('bash', require('highlight.js/lib/languages/bash'));
highlight.registerLanguage('cpp', require('highlight.js/lib/languages/cpp'));
highlight.registerLanguage('cs', require('highlight.js/lib/languages/cs'));
highlight.registerLanguage('d', require('highlight.js/lib/languages/d'));
highlight.registerLanguage('dart', require('highlight.js/lib/languages/dart'));
highlight.registerLanguage('go', require('highlight.js/lib/languages/go'));
highlight.registerLanguage('java', require('highlight.js/lib/languages/java'));
highlight.registerLanguage('julia', require('highlight.js/lib/languages/julia'));
highlight.registerLanguage('kotlin', require('highlight.js/lib/languages/kotlin'));
highlight.registerLanguage('perl', require('highlight.js/lib/languages/perl'));
highlight.registerLanguage('php', require('highlight.js/lib/languages/php'));
highlight.registerLanguage('r', require('highlight.js/lib/languages/r'));
highlight.registerLanguage('rust', require('highlight.js/lib/languages/rust'));
highlight.registerLanguage('scala', require('highlight.js/lib/languages/scala'));
highlight.registerLanguage('shell', require('highlight.js/lib/languages/shell'));
highlight.registerLanguage('sql', require('highlight.js/lib/languages/sql'));
highlight.registerLanguage('swift', require('highlight.js/lib/languages/swift'));
highlight.registerLanguage('yaml', require('highlight.js/lib/languages/yaml'));

export {highlight};