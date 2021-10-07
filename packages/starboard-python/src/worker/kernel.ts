import { AsyncMemory } from "./async-memory";
import { NotebookFilesystemSync } from "./emscripten-fs";
import { ObjectId, ObjectProxyClient, ProxyMessage } from "./object-proxy";

function assertUnreachable(_x: never): never {
  throw new Error("This case should have never been reached");
}

// Hack: it should use tsconfig.json here instead, but the dts plugin doesn't want to listen..
declare const importScripts: (v: any) => any;

/**
 * Manages all the kernels in this worker.
 */
class KernelManager {
  readonly kernels = new Map<string, WorkerKernel>();

  proxy: ObjectProxyClient | undefined;

  /**
   * Requests one line of user input
   */
  input = () => "\n";

  /**
   * Synchronous filesystem
   */
  syncFs?: NotebookFilesystemSync;

  constructor() {
    self.addEventListener("message", async (e: MessageEvent) => {
      if (!e.data) {
        console.warn("Kernel worker received unexpected message:", e);
        return;
      }
      const data = e.data as KernelManagerMessage;
      switch (data.type) {
        case "initialize": {
          if (data.asyncMemory) {
            const asyncMemory = new AsyncMemory(data.asyncMemory.lockBuffer, data.asyncMemory.dataBuffer);
            this.proxy = new ObjectProxyClient(asyncMemory, (message) => {
              this.postMessage(message);
            });

            if (data.getInputId) {
              this.input = this.proxy.getObjectProxy(data.getInputId);
            }
            if (data.filesystemId) {
              const proxy = this.proxy;
              const asyncFs = this.proxy.getObjectProxy(data.filesystemId);
              this.syncFs = {
                get(opts) {
                  return proxy.thenSync(asyncFs.get(opts));
                },
                put(opts) {
                  return proxy.thenSync(asyncFs.put(opts));
                },
                delete(opts) {
                  return proxy.thenSync(asyncFs.delete(opts));
                },
                move(opts) {
                  return proxy.thenSync(asyncFs.move(opts));
                },
                listDirectory(opts) {
                  return proxy.thenSync(asyncFs.listDirectory(opts));
                },
              };
            }
          } else {
            console.warn(
              "Missing async memory, accessing objects from the main thread will not work. Please make sure that COOP/COEP is enabled."
            );
          }

          break;
        }
        case "import_kernel": {
          try {
            if (data.source.type === "url") {
              importScripts(data.source.url);
            } else {
              const blob = new Blob([data.source.code], { type: "text/javascript" });
              importScripts(URL.createObjectURL(blob));
            }
            const KernelClass = (globalThis as any)[data.className];
            if (!data.options.id) {
              data.options.id = data.kernelId;
            }
            const kernel: WorkerKernel = new KernelClass(data.options);
            this.kernels.set(kernel.kernelId, kernel);
            kernel.init().then(() => {
              this.postMessage({
                type: "kernel_initialized",
                kernelId: kernel.kernelId,
              });
            });
          } catch (e) {
            this.postMessage({
              type: "error",
              kernelId: data.kernelId,
              id: "",
              error: e + "",
            });
          }
          break;
        }
        case "run": {
          try {
            const kernel = this.kernels.get(data.kernelId);
            if (!kernel) {
              throw new Error("Failed to find kernel with id " + data.kernelId);
            }
            const result = await kernel.runCode(data.code);
            this.postMessage({
              type: "result",
              kernelId: kernel.kernelId,
              id: data.id,
              value: result,
            });
          } catch (e) {
            this.postMessage({
              type: "error",
              kernelId: data.kernelId,
              id: data.id,
              error: e + "",
            });
          }
          break;
        }
        case "custom": {
          const kernel = this.kernels.get(data.kernelId);
          if (kernel) {
            kernel.customMessage(data.message);
          } else {
            console.warn("Custom message was sent to an nonexistent kernel", data);
          }
          break;
        }
        default: {
          assertUnreachable(data);
          break;
        }
      }
    });
  }

  postMessage(message: KernelManagerResponse) {
    (self.postMessage as any)(message);
  }

  log(kernel: WorkerKernel, ...args: string[]) {
    this.postMessage({
      kernelId: kernel.kernelId,
      type: "console",
      method: "log",
      data: args,
    });
  }

  logWarning(kernel: WorkerKernel, ...args: string[]) {
    this.postMessage({
      kernelId: kernel.kernelId,
      type: "console",
      method: "warn",
      data: args,
    });
  }

  logError(kernel: WorkerKernel, ...args: string[]) {
    this.postMessage({
      kernelId: kernel.kernelId,
      type: "console",
      method: "error",
      data: args,
    });
  }

  [ObjectId] = "";
}

// https://stackoverflow.com/questions/49392409/in-typescript-how-to-export-the-type-of-a-private-class-without-exporting-class
export type KernelManagerType = InstanceType<typeof KernelManager>;

declare global {
  interface WorkerGlobalScope {
    /**
     * The object managing all the kernels in this web worker
     */
    manager: KernelManagerType;
  }
}

// @ts-ignore
globalThis.manager = new KernelManager();

export type KernelSource =
  | {
      type: "code";
      code: string;
    }
  | {
      type: "url";
      url: string;
    };

/**
 * Every message has an id to identify the communication and a type
 */
export type KernelManagerMessage =
  | {
      type: "initialize";
      asyncMemory?: {
        lockBuffer: SharedArrayBuffer;
        dataBuffer: SharedArrayBuffer;
      };
      filesystemId?: string;
      getInputId?: string;
    }
  | {
      type: "import_kernel";
      kernelId: string;
      source: KernelSource;
      className: string;
      options: any;
    }
  | {
      type: "run";
      kernelId: string;
      id: string;
      code: string;
    }
  | {
      type: "custom";
      kernelId: string;
      message: any;
    };

/**
 * Every response has an id to identify the communication and a type
 */
export type KernelManagerResponse =
  | {
      type: "kernel_initialized";
      kernelId: string;
    }
  | {
      type: "result";
      kernelId: string;
      id: string;
      value: any;
    }
  | {
      type: "console";
      kernelId: string;
      method: "log" | "warn" | "error";
      data: string[];
    }
  | {
      type: "error";
      kernelId: string;
      id: string;
      error: string;
    }
  | {
      type: "custom";
      kernelId: string;
      message: any;
    }
  | ProxyMessage;

/**
 * A single kernel, usually for a specific cell type. Make sure to expose it in the global scope
 */
export interface WorkerKernel {
  /**
   * Runtime ID to uniquely identify this kernel when sending messages
   */
  readonly kernelId: string;

  init(): Promise<any>;

  /**
   * Runs code and returns a result
   * @returns A result that can be sent using postMessage
   */
  runCode(code: string): Promise<any>;
  customMessage(message: any): void;
}

declare var WorkerKernel: {
  new (options: { id: string; [key: string]: any }): WorkerKernel;
};
