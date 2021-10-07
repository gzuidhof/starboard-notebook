// @ts-ignore
import css from "./pyodide/pyodide-styles.css";
import { getPluginOpts } from "./opts";
import { nanoid } from "nanoid";
import { assertUnreachable } from "./util";
import type { KernelManagerMessage, KernelManagerResponse, KernelSource } from "./worker/kernel";
import type { PyodideWorkerOptions, PyodideWorkerResult } from "./worker/worker-message";
import { AsyncMemory } from "./worker/async-memory";
import type { Runtime } from "starboard-notebook/dist/src/types";
import { ObjectProxyHost } from "./worker/object-proxy";
import { mainThreadPyodide } from "./main-thread-pyodide";

//@ts-ignore
import kernelWorkerScriptSource from "../dist/kernel.js";
//@ts-ignore
import pyodideWorkerScriptSource from "../dist/pyodide-worker.js";

let setupStatus: "unstarted" | "started" | "completed" = "unstarted";
let loadingStatus: "unstarted" | "loading" | "ready" = "unstarted";
let pyodideLoadSingleton: Promise<string> | undefined = undefined;
let mainThreadPyodideRunner: ((code: string) => Promise<any>) | undefined = undefined;
let kernelManager: Worker;
let objectProxyHost: ObjectProxyHost | null = null;
const runningCode = new Map<string, (value: any) => void>();

// A global value that is the current HTML element to attach matplotlib figures to..
// perhaps this can be done in a cleaner way.
let CURRENT_HTML_OUTPUT_ELEMENT: HTMLElement | undefined = undefined;

export function setGlobalPythonOutputElement(el: HTMLElement | undefined) {
  CURRENT_HTML_OUTPUT_ELEMENT = el;
}

function drawCanvas(pixels: number[], width: number, height: number) {
  const elem = document.createElement("div");
  if (!CURRENT_HTML_OUTPUT_ELEMENT) {
    console.log("HTML output from pyodide but nowhere to put it, will append to body instead.");
    document.querySelector("body")!.appendChild(elem);
  } else {
    CURRENT_HTML_OUTPUT_ELEMENT.appendChild(elem);
  }
  const image = new ImageData(new Uint8ClampedArray(pixels), width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn("Failed to aquire canvas context");
    return;
  }
  ctx.putImageData(image, 0, 0);
  CURRENT_HTML_OUTPUT_ELEMENT?.appendChild(canvas);
}

/**
 * Initial setup for Python support, this includes only the synchronous parts (such as adding a stylesheet used for the output).
 * @returns
 */
export function setupPythonSupport() {
  if (setupStatus !== "unstarted") {
    return;
  }
  setupStatus = "started";

  /** Naughty matplotlib WASM backend captures and disables contextmenu globally.. hack to prevent that */
  window.addEventListener(
    "contextmenu",
    function (event) {
      if (
        event.target instanceof HTMLElement &&
        event.target.id.startsWith("matplotlib_") &&
        event.target.tagName === "CANVAS"
      ) {
        return false;
      }
      event.stopPropagation();
    },
    true
  );

  const styleSheet = document.createElement("style");
  styleSheet.id = "pyodide-styles";
  styleSheet.innerHTML = css;
  document.head.appendChild(styleSheet);

  setupStatus = "completed";
}

function getAsyncMemory() {
  if (
    "SharedArrayBuffer" in globalThis &&
    "Atomics" in globalThis &&
    (globalThis as any)["crossOriginIsolated"] !== false
  ) {
    return new AsyncMemory();
  } else {
    return null;
  }
}

async function convertResult(data: PyodideWorkerResult, runtime: Runtime) {
  if (data.display === "default") {
    return data.value;
  } else if (data.display === "html") {
    let div = document.createElement("div");
    div.className = "rendered_html cell-output-html";
    div.appendChild(new DOMParser().parseFromString(data.value, "text/html").body.firstChild as any);
    return div;
  } else if (data.display === "latex" && runtime) {
    let div = document.createElement("div");
    div.className = "rendered_html cell-output-html";
    const value = data.value;
    const katex = await runtime.exports.libraries.async.KaTeX();

    katex.render(value.replace(/^(\$?\$?)([^]*)\1$/, "$2"), div, {
      throwOnError: false,
      errorColor: " #cc0000",
      displayMode: true,
    });

    return div;
  } else {
    return data.value;
  }
}

function loadKernelManager(runtime?: Runtime) {
  // TODO: This part should be moved to starboard
  let kernelUrl: string | undefined = undefined;

  if (kernelUrl === undefined) {
    const blob = new Blob([kernelWorkerScriptSource], { type: "text/javascript" });
    kernelUrl = URL.createObjectURL(blob);
  }

  const worker = new Worker(kernelUrl);

  // Since all kernels are running in the same worker, they might as well use the same async memory and object proxy
  const asyncMemory = getAsyncMemory();
  const objectProxyHost = asyncMemory ? new ObjectProxyHost(asyncMemory) : null;
  const getInputId = objectProxyHost?.registerRootObject(() => {
    return prompt();
  });
  // TODO: Remove 'as any' once the starboard typings get updated
  const filesystemId = (runtime?.internal as any)?.fs
    ? objectProxyHost?.registerRootObject((runtime?.internal as any)?.fs)
    : undefined;

  worker.addEventListener("message", (ev: MessageEvent) => {
    if (!ev.data) {
      console.warn("Unexpected message from kernel manager", ev);
      return;
    }
    const data = ev.data as KernelManagerResponse;

    if (
      data.type === "proxy_reflect" ||
      data.type === "proxy_shared_memory" ||
      data.type === "proxy_print_object" ||
      data.type === "proxy_promise"
    ) {
      if (asyncMemory && objectProxyHost) {
        objectProxyHost.handleProxyMessage(data, asyncMemory);
      }
    }
  });

  worker.postMessage({
    type: "initialize",
    asyncMemory: asyncMemory
      ? {
          lockBuffer: asyncMemory.sharedLock,
          dataBuffer: asyncMemory.sharedMemory,
        }
      : undefined,
    filesystemId: filesystemId,
    getInputId: getInputId,
  } as KernelManagerMessage);

  return {
    kernelManager: worker,
    objectProxyHost: objectProxyHost,
  };
}

export async function loadPyodide(runtime?: Runtime) {
  if (pyodideLoadSingleton) return pyodideLoadSingleton;

  const kernelManagerResult = loadKernelManager(runtime);
  kernelManager = kernelManagerResult.kernelManager;
  objectProxyHost = kernelManagerResult.objectProxyHost;

  const globalThisId = objectProxyHost?.registerRootObject(globalThis);
  const drawCanvasId = objectProxyHost?.registerRootObject(drawCanvas);
  // Pyodide worker loading
  loadingStatus = "loading";

  /** Pyodide Kernel id */
  const kernelId = nanoid();

  let kernelSource: KernelSource | undefined = getPluginOpts().workerSource;
  if (kernelSource === undefined) {
    kernelSource = {
      type: "code",
      code: pyodideWorkerScriptSource,
    };
  }

  const initOptions: KernelManagerMessage = {
    type: "import_kernel",
    className: "PyodideKernel",
    kernelId: kernelId,
    options: {
      artifactsUrl: getPluginOpts().artifactsUrl || (window as any).pyodideArtifactsUrl,
      globalThisId: globalThisId,
      drawCanvasId: drawCanvasId,
    } as PyodideWorkerOptions,
    source: kernelSource,
  };

  if (getPluginOpts().runInMainThread) {
    pyodideLoadSingleton = Promise.resolve("");
    mainThreadPyodideRunner = await mainThreadPyodide(initOptions, drawCanvas);
  } else {
    pyodideLoadSingleton = new Promise((resolve, reject) => {
      // Only the resolve case is handled for now
      function handleInitMessage(ev: MessageEvent<any>) {
        if (!ev.data) return;
        const data = ev.data as KernelManagerResponse;
        if (data.type === "kernel_initialized" && data.kernelId === kernelId) {
          kernelManager.removeEventListener("message", handleInitMessage);

          resolve(kernelId);
        }
      }
      kernelManager.addEventListener("message", handleInitMessage);
    });

    kernelManager.addEventListener("message", (e) => {
      if (!e.data) return;

      const data = e.data as KernelManagerResponse;
      switch (data.type) {
        case "result": {
          if (data.kernelId !== kernelId) break;
          const callback = runningCode.get(data.id);
          if (!callback) {
            console.warn("Missing Python callback");
          } else {
            callback(data.value as PyodideWorkerResult);
          }
          objectProxyHost?.clearTemporary();
          break;
        }
        case "console": {
          if (data.kernelId !== kernelId) break;
          (console as any)?.[data.method](...data.data);
          break;
        }
        case "error": {
          if (data.kernelId !== kernelId) break;
          console.error(data.error);
        }
        case "custom": {
          if (data.kernelId !== kernelId) break;
          // No custom messages so far
          break;
        }
        // Ignore
        case "kernel_initialized":
        case "proxy_reflect":
        case "proxy_shared_memory":
        case "proxy_print_object":
        case "proxy_promise": {
          break;
        }
        default: {
          assertUnreachable(data);
        }
      }
    });

    kernelManager.postMessage(initOptions);
  }
  await pyodideLoadSingleton;
  loadingStatus = "ready";

  return pyodideLoadSingleton;
}

export function getPyodideLoadingStatus() {
  return loadingStatus;
}

export async function runPythonAsync(code: string, runtime: Runtime) {
  if (!pyodideLoadSingleton) return;

  if (getPluginOpts().runInMainThread) {
    if (mainThreadPyodideRunner) {
      const result = await mainThreadPyodideRunner(code);
      return await convertResult(result, runtime);
    } else {
      console.error("Missing main thread pyodide");
      return null;
    }
  } else {
    const kernelId = await pyodideLoadSingleton;
    const id = nanoid();
    return new Promise((resolve, reject) => {
      runningCode.set(id, (result) => {
        convertResult(result, runtime).then((v) => resolve(v));
        runningCode.delete(id);
      });

      try {
        kernelManager.postMessage({
          type: "run",
          kernelId: kernelId,
          id: id,
          code: code,
        } as KernelManagerMessage);
      } catch (e) {
        console.warn(e, code);
        reject(e);
        runningCode.delete(id);
      }
    });
  }
}
