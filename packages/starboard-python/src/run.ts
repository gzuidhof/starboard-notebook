import type { Runtime } from "../../starboard-notebook/src/types";
import { flatPromise } from "./flatPromise";
import {
  loadPyodide,
  runPythonAsync,
  setGlobalPythonOutputElement as setGlobalPythonHtmlOutputElement,
  setupPythonSupport,
} from "./global";

// This is used as a mutex to prevent double execution.
let pythonRunChain: Promise<any> = Promise.resolve();

const isPyProxy = function (jsobj: any) {
  return !!jsobj && jsobj.$$ !== undefined && jsobj.$$.type === "PyProxy";
};

export async function runStarboardPython(
  runtime: Runtime,
  codeToRun: string,
  renderOutputIntoElement: HTMLElement
): Promise<any> {
  setupPythonSupport();
  const pyoPromise = loadPyodide(runtime);
  const done = flatPromise();

  const alreadyRunningPythonCodeDone = pythonRunChain.catch((_) => 0);
  pythonRunChain = pythonRunChain.finally(() => done.promise);

  // await any already executing python cells.
  await alreadyRunningPythonCodeDone;

  const outputElement = new runtime.exports.elements.ConsoleOutputElement();
  outputElement.hook(runtime.consoleCatcher);

  const htmlOutput = document.createElement("div");
  const lit = runtime.exports.libraries.lit;
  const html = lit.html;

  lit.render(html`${outputElement}${htmlOutput}`, renderOutputIntoElement);
  setGlobalPythonHtmlOutputElement(htmlOutput);

  (globalThis as any).pyodide = await pyoPromise;

  let val = undefined;
  let error: any = undefined;
  try {
    pythonRunChain = runPythonAsync(codeToRun, runtime);
    val = await pythonRunChain;
    
  
    if (val !== undefined) {
      // The result can be multiple types

      if (val instanceof HTMLElement) { // A plain HTML element
        htmlOutput.appendChild(val);
      } else if (typeof val === "object" && val.name === "PythonError" && val.__error_address) { // A python error
        error = val;
        outputElement.addEntry({
          method: "error",
          data: [`${val.toString()}`],
        });
        }
      else if (isPyProxy(val)) { // Something that is proxied
        let hadHTMLOutput = false;
        if (val._repr_html_ !== undefined) { // Has a HTML representation (e.g. a Pandas table)
          let result = val._repr_html_();
          if (typeof result === "string") {
            let div = document.createElement("div");
            div.className = "rendered_html cell-output-html";
            div.appendChild(new DOMParser().parseFromString(result, "text/html").body.firstChild as any);
            htmlOutput.appendChild(div);
            // Just putting HTML with script tags on the DOM will not get them evaluated
            // Using this hack we execute them anyway
            div.querySelectorAll('script[type|="text/javascript"]').forEach(
              function(e) { eval(e.textContent); }
            )
            hadHTMLOutput = true;
          }
        } else if (val._repr_latex_ !== undefined) { // It has a LateX representation (e.g. Sympy output)
          let result = val._repr_latex_();
          if (typeof result === "string") {
            let div = document.createElement("div");
            div.className = "rendered_html cell-output-html";
            const katex = await runtime.exports.libraries.async.KaTeX();
            if (result.startsWith("$$")) {
              result = result.substr(2, result.length - 3);
              katex.render(result, div, {
                throwOnError: false,
                errorColor: " #cc0000",
                displayMode: true,
              });
            } else if (result.startsWith("$")) {
              result = result.substr(1, result.length - 2);
              katex.render(result, div, {
                throwOnError: false,
                errorColor: " #cc0000",
                displayMode: false,
              });
            }
            htmlOutput.appendChild(div);
            hadHTMLOutput = true;
          }
        }
        if (!hadHTMLOutput) {
          outputElement.addEntry({
            method: "result",
            data: [val],
          });
        }
      } else {
        outputElement.addEntry({
          method: "result",
          data: [val],
        });
      }
    }
  } catch (e: any) {
    error = e;
    outputElement.addEntry({
      method: "error",
      data: [`${e.name} ${e.message}`],
    });
  }

  // Not entirely sure this has to be awaited, is any output delayed by a tick from pyodide?
  await outputElement.unhookAfterOneTick(runtime.consoleCatcher);
  done.resolve();
  if (error !== undefined) {
    throw error;
  }

  return val;
}
