import type { KernelManagerMessage, KernelManagerType, WorkerKernel } from "./worker/kernel";
import type { PyodideWorkerOptions } from "./worker/worker-message";
import { ObjectId } from "./worker/object-proxy";

export async function mainThreadPyodide(opts: KernelManagerMessage & { type: "import_kernel" }, drawCanvas: any) {
  const pyodideWorkerOptions = opts.options as PyodideWorkerOptions;
  pyodideWorkerOptions.globalThisId = "";
  pyodideWorkerOptions.drawCanvasId = "";
  pyodideWorkerOptions.isMainThread = true;

  const fakeKernel: KernelManagerType = {
    proxy: undefined,
    postMessage(message) {},
    syncFs: undefined,
    input: () => {
      return prompt() || "";
    },
    kernels: new Map(),
    log(kernel, ...args) {
      console.log(...args);
    },
    logWarning(kernel, ...args) {
      console.warn(...args);
    },
    logError(kernel, ...args) {
      console.error(...args);
    },
    [ObjectId]: "",
  };

  (globalThis as any).manager = fakeKernel;
  const kernel = await new Promise<WorkerKernel>((resolve, reject) => {
    try {
      const script = document.createElement("script");
      const onLoad = () => {
        const KernelClass = (globalThis as any)[opts.className];
        if (!opts.options.id) {
          opts.options.id = opts.kernelId;
        }
        const kernel = new KernelClass(pyodideWorkerOptions);
        kernel.init().then(() => {
          resolve(kernel);
        });
      };

      if (opts.source.type === "url") {
        script.addEventListener("load", onLoad);
        script.src = opts.source.url;
        document.head.appendChild(script);
      } else {
        script.text = opts.source.code;
        document.head.appendChild(script);
        onLoad();
      }
    } catch (e) {
      reject(e);
    }
  });

  // Not quite as elegant as it could be, but whatevs
  (kernel as any).proxiedDrawCanvas = drawCanvas;

  async function run(code: string) {
    const result = await kernel.runCode(code);
    return result;
  }

  return run;
}
