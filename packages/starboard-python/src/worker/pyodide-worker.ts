/// <reference no-default-lib="true"/>
/// <reference lib="es2020" />
/// <reference lib="WebWorker" />

// @ts-ignore
import "pyodide/pyodide";

import type { Pyodide as PyodideType } from "../pyodide/typings";
import type { KernelManagerType, WorkerKernel } from "./kernel";
import { PyodideWorkerOptions, PyodideWorkerResult } from "./worker-message";
import { EMFS } from "./emscripten-fs";
import {patchMatplotlib} from "../pyodide/matplotlib";

type LoadPyodideFunction = (config: {
      indexURL: string;
      stdin?: () => any | null;
      print?: (text: string) => void;
      printErr?: (text: string) => void;
      fullStdLib?: boolean;
    }) =>  Promise<PyodideType>;

declare global {
  interface WorkerGlobalScope {
    /**
     * The object managing all the kernels in this web worker
     */
    manager: KernelManagerType;
    loadPyodide: LoadPyodideFunction
  }
}

const manager: KernelManagerType = (globalThis as any)?.manager ?? (globalThis as any).manager;
const loadPyodide: LoadPyodideFunction = (self as any)?.loadPyodide ?? (globalThis as any).loadPyodide;

class PyodideKernel implements WorkerKernel {
  kernelId: string;
  options: PyodideWorkerOptions;
  proxiedGlobalThis: undefined | any;
  proxiedDrawCanvas: (pixels: number[], width: number, height: number) => void = () => {};
  pyodide: PyodideType | undefined = undefined;

  constructor(options: { id: string } & PyodideWorkerOptions) {
    this.kernelId = options.id;
    this.options = options;
  }

  async init(): Promise<any> {
    this.proxiedGlobalThis = this.proxyGlobalThis(this.options.globalThisId);
    this.proxiedDrawCanvas =
      manager.proxy && this.options.drawCanvasId ? manager.proxy.getObjectProxy(this.options.drawCanvasId) : () => {};

    (globalThis as any).drawPyodideCanvas = (pixels: number[], width: number, height: number) => {
      if ((pixels as any).toJs) {
        pixels = (pixels as any).toJs();
      }
      if (pixels instanceof Uint8ClampedArray || pixels instanceof Uint8Array) {
        pixels = Array.from(pixels);
      }
      // TODO: Handle the case when this.function gets called (this ends up being passed to the main thread, which won't work)
      this.proxiedDrawCanvas.apply({}, [pixels, width, height]);
    };

    let artifactsURL = this.options.artifactsUrl || "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/";
    if (!artifactsURL.endsWith("/")) artifactsURL += "/";

    /* self.importScripts(artifactsURL + "pyodide.js"); // Not used, we're importing our own pyodide.ts*/

    if (!manager.proxy && !this.options.isMainThread) {
      console.warn("Missing object proxy, some Pyodide functionality will be restricted");
    }

    this.pyodide = await loadPyodide({
      indexURL: artifactsURL,
      stdin: this.createStdin(),
      print: (text) => {
        manager.log(this, text + "");
      },
      printErr: (text) => {
        manager.logError(this, text + "");
      },
      fullStdLib: false,
    });
    (globalThis as any).pyodide = this.pyodide;

    if (manager.syncFs) {
      const FS = this.pyodide._module.FS;
      console.log(FS);
      try {
        FS.mkdir("/mnt");
      } catch (e) {
        console.warn(e);
      }
      try {
        FS.mkdir("/mnt/shared");
      } catch (e) {
        console.warn(e);
      }

      try {
        FS.mount(new EMFS(FS, this.pyodide._module.ERRNO_CODES, manager.syncFs), {}, "/mnt/shared");
        this.pyodide.runPython('import os\nos.chdir("/mnt/shared")');
      } catch (e) {
        console.warn(e);
      }
    }

    if (this.proxiedGlobalThis) {
      // Fix "from js import ..."
      /* this.pyodide.unregisterJsModule("js"); // Not needed, since register conveniently overwrites existing things */
      this.pyodide.registerJsModule("js", this.proxiedGlobalThis); // TODO: Or should we register a new module? Like js_main
    }
  }

  async runCode(code: string): Promise<any> {
    if (!this.pyodide) {
      console.warn("Worker has not yet been initialized");
      return;
    }

    // We prevent some spam, otherwise every time you run a cell with an import it will show
    // "Loading bla", "Bla was already loaded from default channel", "Loaded bla"
    let wasAlreadyLoaded: boolean | undefined = undefined;
    let msgBuffer: string[] = [];

    await this.pyodide.loadPackagesFromImports(code, (msg) => {
      if (wasAlreadyLoaded === true) return;

      if (msg.indexOf("Loaded matplotlib") !== -1) {
        console.debug("Hooking matplotlib output to Starboard");
        patchMatplotlib(this.pyodide!);
      }

      if (wasAlreadyLoaded === false) {
        if (msg.match(/already loaded from default channel$/)) {
          return; // This is not the main package being loaded but another dependency that is
          // already loaded - no need to list it.
        }
        console.debug(msg);
      }
      
      if (wasAlreadyLoaded === undefined) {
        if (msg.match(/already loaded from default channel$/)) {
          wasAlreadyLoaded = true;
          return;
        }
        if (msg.match(/^Loading [a-z\-]* from http/)) {
          wasAlreadyLoaded = false;
          msgBuffer.forEach(m => console.debug(m));
          console.debug(msg);
        }
      }
    });

    let result = await this.pyodide.runPythonAsync(code).catch((error) => error);
    let displayType: PyodideWorkerResult["display"];

    if (this.pyodide.isPyProxy(result)) {
      if (result._repr_html_ !== undefined) {
        result = result._repr_html_();
        displayType = "html";
      } else if (result._repr_latex_ !== undefined) {
        result = result._repr_latex_();
        displayType = "latex";
      } else {
        const temp = result;
        result = result.toJs();

        if (typeof globalThis === "undefined") {
          this.destroyToJsResult(result);
          temp?.destroy();
        }
      }
    } else if (result instanceof this.pyodide.PythonError) {
      result = result + "";
    }

    return {
      display: displayType,
      value: result,
    } as PyodideWorkerResult;
  }


  customMessage(message: any): void {
    // No custom messages are supported nor used.
    return;
  }

  createStdin() {
    const encoder = new TextEncoder();
    let input = new Uint8Array();
    let inputIndex = -1; // -1 means that we just returned null
    function stdin() {
      if (inputIndex === -1) {
        const text = manager.input();
        input = encoder.encode(text + (text.endsWith("\n") ? "" : "\n"));
        inputIndex = 0;
      }

      if (inputIndex < input.length) {
        let character = input[inputIndex];
        inputIndex++;
        return character;
      } else {
        inputIndex = -1;
        return null;
      }
    }
    return stdin;
  }

  private proxyGlobalThis(id?: string) {
    // Special cases for the globalThis object. We don't need to proxy everything
    const noProxy = new Set<string | symbol>([
      "location",
      // Proxy navigator, however, some navigator properties do not have to be proxied
      // "navigator",
      "self",
      "importScripts",
      "addEventListener",
      "removeEventListener",
      "caches",
      "crypto",
      "indexedDB",
      "isSecureContext",
      "origin",
      "performance",
      "atob",
      "btoa",
      "clearInterval",
      "clearTimeout",
      "createImageBitmap",
      "fetch",
      "queueMicrotask",
      "setInterval",
      "setTimeout",

      // Special cases for the pyodide globalThis
      "$$",
      "pyodide",
      "__name__",
      "__package__",
      "__path__",
      "__loader__",

      // Pyodide likes checking for lots of properties, like the .stack property to check if something is an error
      // https://github.com/pyodide/pyodide/blob/c8436c33a7fbee13e1ded97c0bbdaa7d635f2745/src/core/jsproxy.c#L1631
      "stack",
      "get",
      "set",
      "has",
      "size",
      "length",
      "then",
      "includes",
      "next",
      Symbol.iterator,

      // Draw something to a canvas
      "drawPyodideCanvas",
    ]);
    return manager.proxy && id
      ? manager.proxy.wrapExcluderProxy(manager.proxy.getObjectProxy(id), globalThis, noProxy)
      : globalThis;
  }

  private destroyToJsResult(x: any) {
    if (!this.pyodide) return;
    if (!x) {
      return;
    }
    if (this.pyodide.isPyProxy(x)) {
      x.destroy();
      return;
    }
    if (x[Symbol.iterator]) {
      for (let k of x) {
        this.destroyToJsResult(k);
      }
    }
  }
}

(globalThis as any).PyodideKernel = PyodideKernel;
