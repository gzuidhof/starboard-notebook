/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. else if a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import type { Extension } from "@codemirror/state";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { python } from "@codemirror/lang-python";
import { sql } from "@codemirror/lang-sql";
import { rust } from "@codemirror/lang-rust";
import { xml } from "@codemirror/lang-xml";

/**
 * Legacy languages
 */
import { go } from "@codemirror/legacy-modes/mode/go";
import { r } from "@codemirror/legacy-modes/mode/r";
import { yaml } from "@codemirror/legacy-modes/mode/yaml";
import { toml } from "@codemirror/legacy-modes/mode/toml";
import { shader, cpp, c, dart, java, kotlin } from "@codemirror/legacy-modes/mode/clike";
import { StreamLanguage } from "@codemirror/stream-parser";

export function getCodemirrorLanguageExtension(language?: string): Extension | undefined {
  let lang = language || "";
  lang = lang.toLowerCase();

  // TODO: maybe this should be a switch
  if (["javascript", "js"].indexOf(lang) !== -1) return javascript();
  else if (["typescript", "ts"].indexOf(lang) !== -1) return javascript({ typescript: true });
  else if (["jsx"].indexOf(lang) !== -1) return javascript({ jsx: true });
  else if (["tsx"].indexOf(lang) !== -1) return javascript({ typescript: true, jsx: true });
  else if (["python", "py"].indexOf(lang) !== -1) return python();
  else if (lang === "css") return css();
  else if (lang === "html") return html();
  else if (["markdown", "md"].indexOf(lang) !== -1) return markdown();
  else if (lang === "xml") return xml();
  else if (lang === "json") return json();
  // TODO specify the SQL dialects individually?
  else if (lang === "sql") return sql();
  else if (lang === "rust") return rust();
  // Legacy languages
  else if (["go", "golang"].indexOf(lang) !== -1) return StreamLanguage.define(go);
  else if (lang === "r") return StreamLanguage.define(r as any);
  else if (lang === "yaml") return StreamLanguage.define(yaml as any);
  else if (lang === "toml") return StreamLanguage.define(toml as any);
  else if (["shader", "glsl", "opengl"].indexOf(lang) !== -1) return StreamLanguage.define(shader);
  // There is actually a modern cpp and java extension, but it is much larger in bundle size
  // given the rarity of cpp or java in a notebook we use the clike one instead to save ~50kb gzipped(!)
  else if (lang === "cpp") return StreamLanguage.define(cpp);
  else if (lang === "java") return StreamLanguage.define(java);
  else if (lang === "kotlin") return StreamLanguage.define(kotlin);
  else if (lang === "c") return StreamLanguage.define(c);
  else if (lang === "dart") return StreamLanguage.define(dart);
}
