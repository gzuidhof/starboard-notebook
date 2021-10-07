/**
 * One-way memory, can block a web worker until data from the main thread arrives.
 *
 * Web Worker Usage:
 * 1. Lock "web worker"
 * 2. Set "shared memory signal"
 * 3. Notify main thread (Main thread does stuff)
 * 4. Wait for "shared memory signal"
 * 5. Read size buffer
 * 6. Read shared memory
 * 7. If the size buffer was bigger than the read memory size
 * 7.1. Set "shared memory signal"
 * 7.2. Notify main thread (Main thread writes remaining data to shared memory)
 * 7.3. Wait for "shared memory signal"
 * 7.4. Read shared memory
 * 7.5. Go back to step 7. (loop)
 * 8. Unlock "web worker"
 *
 * Main Thread Usage:
 * 1. Get notification
 * 2. Do operations
 * 3. Serialize data
 * 4. Write size into the size buffer
 * 5. Write partial data into shared memory
 * 6. Unlock "shared memory signal" (Worker does stuff)
 * 7. If not everything has been written to the shared memory yet
 * 7.1. Get notification
 * 7.2. Write partial data into shared memory
 * 7.3. Unlock "shared memory signal" (Worker does stuff)
 * 7.4. Go back to step 7. (loop)
 */
export class AsyncMemory {
  // Reference: https://v8.dev/features/atomics
  static LOCK_WORKER_INDEX = 0;
  static LOCK_SIZE_INDEX = 2;
  static SIZE_INDEX = 4;
  static UNLOCKED = 0;
  static LOCKED = 1;

  readonly sharedLock: SharedArrayBuffer;
  readonly lockAndSize: Int32Array;

  readonly sharedMemory: SharedArrayBuffer;
  readonly memory: Uint8Array;

  constructor(sharedLock?: SharedArrayBuffer, sharedMemory?: SharedArrayBuffer) {
    this.sharedLock = sharedLock ?? new SharedArrayBuffer(8 * Int32Array.BYTES_PER_ELEMENT);
    this.lockAndSize = new Int32Array(this.sharedLock);
    if (this.lockAndSize.length < 8) {
      throw new Error("Expected an sharedLock with at least 8x32 bytes");
    }

    this.sharedMemory = sharedMemory ?? new SharedArrayBuffer(1024);
    this.memory = new Uint8Array(this.sharedMemory);

    if (this.sharedMemory.byteLength < 1024) {
      throw new Error("Expected an sharedMemory with at least 1024 bytes");
    }
  }

  /**
   * Should be called from the worker thread
   */
  lockWorker() {
    const oldValue = Atomics.compareExchange(
      this.lockAndSize,
      AsyncMemory.LOCK_WORKER_INDEX,
      AsyncMemory.UNLOCKED, // old value
      AsyncMemory.LOCKED // new value
    );
    if (oldValue !== AsyncMemory.UNLOCKED) {
      throw new Error(`Cannot lock worker, the worker has to be unlocked ${AsyncMemory.UNLOCKED} !== ${oldValue}`);
    }
  }

  /**
   * Should be called from the worker thread
   */
  lockSize() {
    const oldValue = Atomics.compareExchange(
      this.lockAndSize,
      AsyncMemory.LOCK_SIZE_INDEX,
      AsyncMemory.UNLOCKED, // old value
      AsyncMemory.LOCKED // new value
    );
    if (oldValue !== AsyncMemory.UNLOCKED) {
      throw new Error(`Cannot set size flag, the size has to be unlocked ${AsyncMemory.UNLOCKED} !== ${oldValue}`);
    }
  }

  /**
   * Only legal if the worker is locked
   */
  waitForSize() {
    Atomics.wait(this.lockAndSize, AsyncMemory.LOCK_SIZE_INDEX, AsyncMemory.LOCKED);
  }

  /**
   * Should be called from the main thread!
   * Only legal if the worker is locked and the size is locked
   */
  writeSize(value: number) {
    return Atomics.store(this.lockAndSize, AsyncMemory.SIZE_INDEX, value);
  }

  /**
   * Only legal if the worker is locked but the size is not
   */
  readSize(): number {
    return Atomics.load(this.lockAndSize, AsyncMemory.SIZE_INDEX);
  }

  /**
   * Should be called from the main thread!
   */
  unlockSize() {
    const oldValue = Atomics.compareExchange(
      this.lockAndSize,
      AsyncMemory.LOCK_SIZE_INDEX,
      AsyncMemory.LOCKED, // old value
      AsyncMemory.UNLOCKED // new value
    );
    if (oldValue != AsyncMemory.LOCKED) {
      throw new Error("Tried to unlock, but was already unlocked");
    }
    Atomics.notify(this.lockAndSize, AsyncMemory.LOCK_SIZE_INDEX);
  }

  /**
   * Ensures that the size gets unlocked
   */
  forceUnlockSize() {
    const oldValue = Atomics.compareExchange(
      this.lockAndSize,
      AsyncMemory.LOCK_SIZE_INDEX,
      AsyncMemory.LOCKED, // old value
      AsyncMemory.UNLOCKED // new value
    );
    if (oldValue != AsyncMemory.LOCKED) {
      // And force unlock it
      Atomics.store(this.lockAndSize, AsyncMemory.LOCK_SIZE_INDEX, AsyncMemory.UNLOCKED);
    }
    Atomics.notify(this.lockAndSize, AsyncMemory.LOCK_SIZE_INDEX);
  }

  /**
   * Should be called from the worker thread!
   */
  unlockWorker() {
    const oldValue = Atomics.compareExchange(
      this.lockAndSize,
      AsyncMemory.LOCK_WORKER_INDEX,
      AsyncMemory.LOCKED, // old value
      AsyncMemory.UNLOCKED // new value
    );
    if (oldValue != AsyncMemory.LOCKED) {
      throw new Error("Tried to unlock, but was already unlocked");
    }
    Atomics.notify(this.lockAndSize, AsyncMemory.LOCK_WORKER_INDEX);
  }
}
