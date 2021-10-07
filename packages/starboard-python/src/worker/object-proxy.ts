import { nanoid } from "nanoid";
import { AsyncMemory } from "./async-memory";

const SERIALIZATION = {
  UNDEFINED: 0,
  NULL: 1,
  FALSE: 2,
  TRUE: 3,
  NUMBER: 4,
  DATE: 5,
  KNOWN_SYMBOL: 6,
  STRING: 10,
  BIGINT: 11,
  OBJECT: 255,
} as const;

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol
const KNOWN_SYMBOLS = [
  Symbol.asyncIterator,
  Symbol.hasInstance,
  Symbol.isConcatSpreadable,
  Symbol.iterator,
  Symbol.match,
  Symbol.matchAll,
  Symbol.replace,
  Symbol.search,
  Symbol.species,
  Symbol.split,
  Symbol.toPrimitive,
  Symbol.toStringTag,
  Symbol.unscopables,
];

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8");

const encodeFloat = useFloatEncoder();
const decodeFloat = useFloatDecoder();

function useFloatEncoder() {
  // https://stackoverflow.com/a/14379836/3492994
  const temp = new ArrayBuffer(8);
  const tempFloat64 = new Float64Array(temp);
  const tempUint8 = new Uint8Array(temp);

  return function (value: number): Uint8Array {
    tempFloat64[0] = value;
    return tempUint8;
  };
}

function useFloatDecoder() {
  const temp = new ArrayBuffer(8);
  const tempFloat64 = new Float64Array(temp);
  const tempUint8 = new Uint8Array(temp);

  return function (value: Uint8Array): number {
    tempUint8.set(value);
    return tempFloat64[0];
  };
}

/**
 * Lets one other thread access the objects on this thread.
 * Usually runs on the main thread.
 */
export class ObjectProxyHost {
  readonly rootReferences = new Map<string, any>();
  readonly temporaryReferences = new Map<string, any>();
  readonly memory: AsyncMemory;

  private writeMemoryContinuation?: () => void;

  constructor(memory: AsyncMemory) {
    this.memory = memory;
  }

  /** Creates a valid, random id for a given object */
  private getId(value: any) {
    return nanoid() + "-" + (typeof value === "function" ? "f" : "o");
  }

  registerRootObject(value: any) {
    const id = this.getId(value);
    this.rootReferences.set(id, value);
    return id;
  }

  registerTempObject(value: any) {
    const id = this.getId(value);
    this.temporaryReferences.set(id, value);
    return id;
  }

  clearTemporary() {
    this.temporaryReferences.clear();
  }

  getObject(id: string) {
    return this.rootReferences.get(id) ?? this.temporaryReferences.get(id);
  }

  // A serializePostMessage isn't needed here, because all we're ever going to pass to the worker are ids

  serializeMemory(value: any, memory: AsyncMemory) {
    // Format:
    // [1 byte][n bytes ]
    // [type  ][data    ]

    memory.writeSize(8); // Anything that fits into 8 bytes is fine

    // Simple primitives. Guaranteed to fit into the shared memory.
    if (value === undefined) {
      memory.memory[0] = SERIALIZATION.UNDEFINED;
      memory.unlockSize();
    } else if (value === null) {
      memory.memory[0] = SERIALIZATION.NULL;
      memory.unlockSize();
    } else if (value === false) {
      memory.memory[0] = SERIALIZATION.FALSE;
      memory.unlockSize();
    } else if (value === true) {
      memory.memory[0] = SERIALIZATION.TRUE;
      memory.unlockSize();
    } else if (typeof value === "number") {
      memory.memory[0] = SERIALIZATION.NUMBER;
      memory.memory.set(encodeFloat(value), 1);
      memory.unlockSize();
    } else if (value instanceof Date) {
      memory.memory[0] = SERIALIZATION.DATE;
      const time = value.getTime();
      memory.memory.set(encodeFloat(time), 1);
      memory.unlockSize();
    } else if (typeof value === "symbol" && KNOWN_SYMBOLS.includes(value)) {
      memory.memory[0] = SERIALIZATION.KNOWN_SYMBOL;
      memory.memory[1] = KNOWN_SYMBOLS.indexOf(value);
      memory.unlockSize();
    }
    // Variable length primitives. Not guaranteed to fit into the shared memory, but we know their size.
    else if (typeof value === "string") {
      memory.memory[0] = SERIALIZATION.STRING;
      // A string encoded in utf-8 uses at most 4 bytes per character
      if (value.length * 4 <= memory.memory.byteLength) {
        const data = textEncoder.encode(value);
        memory.memory.set(data, 1);
        memory.writeSize(data.byteLength);
        memory.unlockSize();
      } else {
        // Longer strings need to be sent piece by piece
        const bytes = textEncoder.encode(value);
        const memorySize = memory.memory.byteLength;
        let offset = 0;
        let remainingBytes = bytes.byteLength;
        memory.memory.set(bytes.subarray(offset, memorySize - 1), 1);
        offset += memorySize - 1;
        remainingBytes -= memorySize - 1;
        this.writeMemoryContinuation = () => {
          if (remainingBytes > 0) {
            memory.memory.set(bytes.subarray(offset, memorySize), 0);
            offset += memorySize;
            remainingBytes -= memorySize;
          } else {
            this.writeMemoryContinuation = undefined;
          }
          memory.unlockSize();
        };
        memory.writeSize(bytes.byteLength);
        memory.unlockSize();
      }
    } else if (typeof value === "bigint") {
      memory.memory[0] = SERIALIZATION.BIGINT;
      const digits = value.toString();
      // TODO: Implement this (just like the text ^)
      console.warn("Bigint support is not implemented");
      memory.unlockSize();
    }
    // Object. Serialized as ID, guaranteed to fit into shared memory
    else {
      memory.memory[0] = SERIALIZATION.OBJECT;
      const id = this.registerTempObject(value);
      const data = textEncoder.encode(id);
      memory.memory.set(data, 1);
      memory.writeSize(data.byteLength);
      memory.unlockSize();
    }
  }

  /**
   * Deserializes an object that was sent through postMessage
   */
  deserializePostMessage(value: any): any {
    if (typeof value === "object" && value !== null) {
      // Special cases
      if (value.id) return this.getObject(value.id);
      if (value.value) return value.value;
      if (value.symbol) return KNOWN_SYMBOLS[value.symbol];
    }
    // It's a primitive
    return value;
  }

  handleProxyMessage(message: ProxyMessage, memory: AsyncMemory) {
    if (message.type === "proxy_reflect") {
      try {
        if (message.method === "apply") {
          const method = Reflect[message.method];
          const args = (message.args ?? []).map((v) => this.deserializePostMessage(v));
          const result = (method as any)(this.getObject(message.target), this.getObject(message.thisArg), args);
          // Write result to shared memory
          this.serializeMemory(result, memory);
        } else {
          const method = Reflect[message.method];
          const args = (message.args ?? []).map((v) => this.deserializePostMessage(v));
          const result = (method as any)(this.getObject(message.target), ...args);
          // Write result to shared memory
          this.serializeMemory(result, memory);
        }
      } catch (e) {
        console.error(message);
        throw e;
      }
    } else if (message.type === "proxy_shared_memory") {
      // Write remaining data to shared memory
      if (this.writeMemoryContinuation === undefined) {
        console.warn("No more data to write to shared memory");
      } else {
        this.writeMemoryContinuation();
      }
    } else if (message.type === "proxy_print_object") {
      console.log("Object with id", message.target, "is", this.getObject(message.target));
    } else if (message.type === "proxy_promise") {
      const promiseObject: Promise<any> = this.getObject(message.target);
      if (message.method === "then") {
        promiseObject[message.method](
          (value) => {
            const result = { value: value };
            this.serializeMemory(result, memory);
          },
          (err) => {
            const result = { error: err };
            this.serializeMemory(result, memory);
          }
        );
      } else {
        console.error("Unknown proxy promise method", message);
      }
    } else {
      console.warn("Unknown proxy message", message);
    }
  }
}

export const ObjectId = Symbol.for("id");
/**
 * Allows this thread to access objects from another thread.
 * Must run on a worker thread.
 */
export class ObjectProxyClient {
  readonly memory: AsyncMemory;
  readonly postMessage: (message: ProxyMessage) => void;
  constructor(memory: AsyncMemory, postMessage: (message: ProxyMessage) => void) {
    this.memory = memory;
    this.postMessage = postMessage;
  }

  /**
   * Serializes an object so that it can be sent using postMessage
   */
  serializePostMessage(value: any): any {
    if (isSimplePrimitive(value)) {
      return value;
    } else if (isSymbolPrimitive(value)) {
      return { symbol: KNOWN_SYMBOLS.indexOf(value) };
    } else if (isVariableLengthPrimitive(value)) {
      return value;
    } else if (value[ObjectId] !== undefined) {
      return { id: value[ObjectId] };
    } else {
      // Maybe serialize simple functions https://stackoverflow.com/questions/1833588/javascript-clone-a-function
      return { value: value }; // Might fail to get serialized
    }
  }

  /**
   * Deserializes an object from a shared array buffer. Can return a proxy.
   */
  deserializeMemory(memory: AsyncMemory) {
    const numberOfBytes = memory.readSize();

    // Uint8Arrays have the convenient property of having 1 byte per element.
    let resultBytes: Uint8Array;
    if (numberOfBytes <= memory.sharedMemory.byteLength) {
      resultBytes = memory.memory;
    } else {
      const memorySize = memory.sharedMemory.byteLength;
      let offset = 0;
      let remainingBytes = numberOfBytes;
      resultBytes = new Uint8Array(numberOfBytes);
      while (remainingBytes >= memorySize) {
        resultBytes.set(memory.memory, offset);
        offset += memorySize;
        remainingBytes -= memorySize;
        memory.lockSize();
        this.postMessage({ type: "proxy_shared_memory" });
        memory.waitForSize();
      }
      if (remainingBytes > 0) {
        resultBytes.set(memory.memory.subarray(0, remainingBytes), offset);
      }
    }

    // Simple primitives. Guaranteed to fit into the shared memory.
    if (resultBytes[0] === SERIALIZATION.UNDEFINED) {
      return undefined;
    } else if (resultBytes[0] === SERIALIZATION.NULL) {
      return null;
    } else if (resultBytes[0] === SERIALIZATION.FALSE) {
      return false;
    } else if (resultBytes[0] === SERIALIZATION.TRUE) {
      return true;
    } else if (resultBytes[0] === SERIALIZATION.NUMBER) {
      return decodeFloat(resultBytes.subarray(1, 9));
    } else if (resultBytes[0] === SERIALIZATION.DATE) {
      const date = new Date();
      date.setTime(decodeFloat(resultBytes.subarray(1, 9)));
      return date;
    } else if (resultBytes[0] === SERIALIZATION.KNOWN_SYMBOL) {
      const symbol = KNOWN_SYMBOLS[resultBytes[1]];
      return symbol;
    }
    // Variable length primitives. We already read all of their data
    else if (resultBytes[0] === SERIALIZATION.STRING) {
      // Note: This *copies* the entire thing, because you aren't allowed to call decode on a SharedArrayBuffer
      return textDecoder.decode(resultBytes.slice(1, numberOfBytes + 1));
    } else if (resultBytes[0] === SERIALIZATION.BIGINT) {
      return BigInt(textDecoder.decode(resultBytes.slice(1, numberOfBytes + 1)));
    }
    // Object. Serialized as ID, guaranteed to fit into shared memory
    else if (resultBytes[0] === SERIALIZATION.OBJECT) {
      const id = textDecoder.decode(resultBytes.slice(1, numberOfBytes + 1));
      return this.getObjectProxy(id);
    } else {
      console.warn("Unknown type", resultBytes[0]);
      return null;
    }
  }

  /**
   * Calls a Reflect function on an object from the other thread
   * @returns The result of the operation, can be a primitive or a proxy
   */
  private proxyReflect(method: keyof typeof Reflect, targetId: string, args: any[]) {
    let value: any = undefined;
    try {
      this.memory.lockWorker();
      this.memory.lockSize();
      this.memory.writeSize(0);
      if (method === "apply") {
        // Special case for "apply"
        this.postMessage({
          type: "proxy_reflect",
          method: method,
          target: targetId,
          thisArg: args[0],
          args: args[1].map((v: any[]) => this.serializePostMessage(v)),
        });
      } else {
        this.postMessage({
          type: "proxy_reflect",
          method: method,
          target: targetId,
          args: args.map((v) => this.serializePostMessage(v)),
        });
      }

      this.memory.waitForSize();
      value = this.deserializeMemory(this.memory);
    } catch (e) {
      console.error({ method, targetId, args });
      console.error(e);
      this.postMessage({
        type: "proxy_print_object",
        target: targetId,
      });
    } finally {
      // Regardless of what happened, unlock the size and the worker
      this.memory.forceUnlockSize();
      this.memory.unlockWorker();
    }
    return value;
  }

  private proxyPromise(method: "then", targetId: string): { value?: any; error?: any } {
    let value: any = undefined;
    try {
      this.memory.lockWorker();
      this.memory.lockSize();
      this.memory.writeSize(0);

      this.postMessage({
        type: "proxy_promise",
        method: method,
        target: targetId,
      });

      this.memory.waitForSize();
      value = this.deserializeMemory(this.memory);
    } catch (e) {
      console.error({ method, targetId });
      console.error(e);
      this.postMessage({
        type: "proxy_print_object",
        target: targetId,
      });
    } finally {
      // Regardless of what happened, unlock the size and the worker
      this.memory.forceUnlockSize();
      this.memory.unlockWorker();
    }
    return value;
  }

  /** Checks if an id encodes a function. Mostly a silly hack to ensure that proxies can work as expected */
  private isFunction(id: string) {
    return id.endsWith("-f");
  }

  /**
   * Gets a proxy object for a given id
   */
  getObjectProxy<T = any>(id: string): T {
    const client = this;

    return new Proxy(this.isFunction(id) ? function () {} : {}, {
      get(target, prop, receiver) {
        if (prop === ObjectId) {
          return id;
        }

        // const value = Reflect.get(target, prop, receiver);
        const value = client.proxyReflect("get", id, [prop, receiver]);

        if (typeof value !== "function") return value;
        // TODO: Special handling for .bind, .apply and more
        /* Functions need special handling
         * https://stackoverflow.com/questions/27983023/proxy-on-dom-element-gives-error-when-returning-functions-that-implement-interfa
         * https://stackoverflow.com/questions/37092179/javascript-proxy-objects-dont-work
         */
        return new Proxy(value, {
          apply(_, thisArg, argumentsList) {
            // thisArg: the object the function was called with. Can be the proxy or something else
            // receiver: the object the propery was gotten from. Is always the proxy or something inheriting from the proxy
            // target: the original object

            const calledWithProxy = thisArg === receiver;

            // return Reflect.apply(value, calledWithProxy ? target : thisArg, args);
            const functionReturnValue = client.proxyReflect("apply", value[ObjectId], [
              calledWithProxy ? id : thisArg[ObjectId],
              argumentsList,
            ]);
            return functionReturnValue;
          },
        });
      },
      set(target, prop, value, receiver) {
        // return Reflect.set(target, prop, value, receiver);
        return client.proxyReflect("set", id, [prop, value, receiver]);
      },
      ownKeys(target) {
        // return Reflect.ownKeys(target);
        return client.proxyReflect("ownKeys", id, []);
      },
      has(target, prop) {
        // return Reflect.has(target, prop);
        return client.proxyReflect("has", id, [prop]);
      },
      defineProperty(target, prop, attributes) {
        // return Reflect.defineProperty(target, prop, attributes);
        return client.proxyReflect("defineProperty", id, [prop, attributes]);
      },
      deleteProperty(target, prop) {
        // return Reflect.deleteProperty(target, prop);
        return client.proxyReflect("deleteProperty", id, [prop]);
      },
      // TODO: Those functions might be interesting as well
      /*
      getOwnPropertyDescriptor(target, prop) {
        // return Reflect.getOwnPropertyDescriptor(target, prop);
        return client.proxyReflect("getOwnPropertyDescriptor", id, [prop]);
      },
      isExtensible(target) {
        // return Reflect.isExtensible(target);
        return client.proxyReflect("isExtensible", id, []);
      },
      preventExtensions(target) {
        // return Reflect.preventExtensions(target);
        return client.proxyReflect("preventExtensions", id, []);
      },
      getPrototypeOf(target) {
        // return Reflect.getPrototypeOf(target);
        return client.proxyReflect("getPrototypeOf", id, []);
      },
      setPrototypeOf(target, proto) {
        // return Reflect.setPrototypeOf(target, proto);
        return client.proxyReflect("setPrototypeOf", id, [proto]);
      },*/

      // For function objects
      apply(target, thisArg, argumentsList) {
        // Note: It can happen that a function gets called with a thisArg that cannot be serialized (due to it being an object on the worker thread)
        // One solution is to provide a `[ObjectId]: ""` property
        // TODO: Can it also happen that a function gets called with an easily serializeable thisArg that doesn't have an ObjectId?
        // return Reflect.apply(target, thisArg, argumentsList);
        return client.proxyReflect("apply", id, [thisArg[ObjectId], argumentsList]);
      },
      construct(target, argumentsList, newTarget) {
        // return Reflect.construct(target, argumentsList, newTarget)
        return client.proxyReflect("construct", id, [argumentsList, newTarget]);
      },
    }) as T;
  }

  /**
   * Wraps an object in a proxy that does not proxy certain properties
   */
  wrapExcluderProxy<T extends object>(obj: T, underlyingObject: T, exclude: Set<string | symbol>): T {
    return new Proxy<T>(obj, {
      get(target, prop, receiver) {
        if (exclude.has(prop)) {
          target = underlyingObject;
        }

        const value = Reflect.get(target, prop, receiver);
        if (typeof value !== "function") return value;
        return new Proxy(value, {
          apply(_, thisArg, args) {
            const calledWithProxy = thisArg === receiver;
            return Reflect.apply(value, calledWithProxy ? target : thisArg, args);
          },
        });
      },
      has(target, prop) {
        if (exclude.has(prop)) {
          target = underlyingObject;
        }
        return Reflect.has(target, prop);
      },
    });
  }

  /**
   * Blocks until an proxy object promise has returned a result or an error
   */
  thenSync<T>(obj: Promise<T>): T {
    const objectId = (obj as any)[ObjectId];
    if (!objectId) {
      throw new Error("Not a proxy object");
    }
    const result = this.proxyPromise("then", objectId);
    if (result.error) {
      throw result.error;
    }
    return result.value;
  }
}

function isSimplePrimitive(value: any) {
  if (value === undefined) {
    return true;
  } else if (value === null) {
    return true;
  } else if (value === false) {
    return true;
  } else if (value === true) {
    return true;
  } else if (typeof value === "number") {
    return true;
  } else if (value instanceof Date) {
    return true;
  } else {
    return false;
  }
}

function isSymbolPrimitive(value: any) {
  if (typeof value === "symbol" && KNOWN_SYMBOLS.includes(value)) {
    return true;
  }
  return false;
}

function isVariableLengthPrimitive(value: any) {
  if (typeof value === "string") {
    return true;
  } else if (typeof value === "bigint") {
    return true;
  }
}

export type ProxyMessage =
  | {
      type: "proxy_reflect";
      method: Exclude<keyof typeof Reflect, "apply">;
      /**
       * An object id
       */
      target: string;
      /**
       * Further parameters. Have to be serialized
       */
      args?: any[];
    }
  | {
      type: "proxy_reflect";
      method: "apply";
      /**
       * An object id
       */
      target: string;
      /**
       * An object id
       */
      thisArg: string;
      /**
       * Further parameters. Have to be serialized
       */
      args?: any[];
    }
  | {
      /** For requesting more bytes from the shared memory*/
      type: "proxy_shared_memory";
    }
  | {
      type: "proxy_print_object";
      target: string;
    }
  | {
      type: "proxy_promise";
      method: "then";
      target: string;
    };
