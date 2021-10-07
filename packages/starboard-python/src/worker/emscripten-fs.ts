// see
// https://github.com/jvilk/BrowserFS/blob/master/src/generic/emscripten_fs.ts
// https://github.com/emscripten-core/emscripten/blob/main/src/library_nodefs.js
// https://github.com/emscripten-core/emscripten/blob/main/src/library_memfs.js
// https://github.com/emscripten-core/emscripten/blob/main/src/library_workerfs.js
// https://github.com/curiousdannii/emglken/blob/master/src/emglkenfs.js

// TODO: Use the types from starboard?
type SyncResult<T, E = Error> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      status: number;
      error: E;
      detail?: string;
    };

export interface NotebookFilesystemSync {
  /**
   * Get a file or directory at a given path.
   * @returns The contents of the file. `null` corresponds to a directory
   */
  get(opts: { path: string }): SyncResult<string | null>;

  /**
   * Creates or replaces a file or directory at a given path.
   * @param opts.value The contents of the file. `null` corresponds to a directory
   */
  put(opts: { path: string; value: string | null }): SyncResult<undefined>;

  /**
   * Deletes a file or directory at a given path
   */
  delete(opts: { path: string }): SyncResult<undefined>;

  /**
   * Move a file or directory to a new path. Can be used for renaming
   */
  move(opts: { path: string; newPath: string }): SyncResult<undefined>;

  /**
   * List the files in a directory
   */
  listDirectory(opts: { path: string }): SyncResult<string[]>;
}

interface EMFSNode {
  name: string;
  mode: number;
  parent: EMFSNode;
  mount: { opts: { root: string } };
  id: any;
  timestamp: any;
  stream_ops: any;
  node_ops: any;
}

interface EMFSStream {
  node: EMFSNode;
  position: number;
  fileData?: Uint8Array;
}

const DIR_MODE = 16895; // 040777
const FILE_MODE = 33206; // 100666
const SEEK_CUR = 1;
const SEEK_END = 2;
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

export class EMFS {
  FS: any;
  ERRNO_CODES: any;
  CUSTOM_FS: NotebookFilesystemSync;

  node_ops = {} as any;
  stream_ops = {} as any;

  constructor(FS: any, ERRNO_CODES: any, CUSTOM_FS: NotebookFilesystemSync) {
    this.FS = FS;
    this.ERRNO_CODES = ERRNO_CODES;
    this.CUSTOM_FS = CUSTOM_FS;

    this.node_ops.getattr = (node: EMFSNode) => {
      return {
        dev: 1,
        ino: node.id,
        mode: node.mode,
        nlink: 1,
        uid: 0,
        gid: 0,
        rdev: undefined,
        size: 0,
        atime: new Date(node.timestamp),
        mtime: new Date(node.timestamp),
        ctime: new Date(node.timestamp),
        blksize: 4096,
        blocks: 0,
      };
    };
    this.node_ops.setattr = (node: EMFSNode, attr: any) => {
      // Doesn't really do anything
      if (attr.mode !== undefined) {
        node.mode = attr.mode;
      }
      if (attr.timestamp !== undefined) {
        node.timestamp = attr.timestamp;
      }
    };
    this.node_ops.lookup = (parent: EMFSNode, name: string) => {
      const path = realPath(parent, name);
      const result = this.CUSTOM_FS.get({ path });
      if (!result.ok) {
        // I wish Javascript had inner exceptions
        throw this.FS.genericErrors[this.ERRNO_CODES["ENOENT"]];
      }
      return this.createNode(parent, name, result.data === null ? DIR_MODE : FILE_MODE);
    };
    this.node_ops.mknod = (parent: EMFSNode, name: string, mode: number, dev?: any) => {
      const node = this.createNode(parent, name, mode, dev);
      const path = realPath(node);
      if (this.FS.isDir(node.mode)) {
        this.convertSyncResult(this.CUSTOM_FS.put({ path, value: null }));
      } else {
        this.convertSyncResult(this.CUSTOM_FS.put({ path, value: "" }));
      }
      return node;
    };
    this.node_ops.rename = (oldNode: EMFSNode, newDir: EMFSNode, newName: string) => {
      const oldPath = realPath(oldNode);
      const newPath = realPath(newDir, newName);
      this.convertSyncResult(this.CUSTOM_FS.move({ path: oldPath, newPath: newPath }));
      oldNode.name = newName;
    };
    this.node_ops.unlink = (parent: EMFSNode, name: string) => {
      const path = realPath(parent, name);
      this.convertSyncResult(this.CUSTOM_FS.delete({ path }));
    };
    this.node_ops.rmdir = (parent: EMFSNode, name: string) => {
      const path = realPath(parent, name);
      this.convertSyncResult(this.CUSTOM_FS.delete({ path }));
    };
    this.node_ops.readdir = (node: EMFSNode) => {
      const path = realPath(node);
      let result = this.convertSyncResult(this.CUSTOM_FS.listDirectory({ path }));
      if (!result.includes(".")) {
        result.push(".");
      }
      if (!result.includes("..")) {
        result.push("..");
      }
      return result;
    };
    this.node_ops.symlink = (parent: EMFSNode, newName: string, oldPath: string) => {
      throw new FS.ErrnoError(this.ERRNO_CODES["EPERM"]);
    };
    this.node_ops.readlink = (node: EMFSNode) => {
      throw new FS.ErrnoError(this.ERRNO_CODES["EPERM"]);
    };

    this.stream_ops.open = (stream: EMFSStream) => {
      const path = realPath(stream.node);
      if (FS.isFile(stream.node.mode)) {
        const result = this.convertSyncResult(this.CUSTOM_FS.get({ path }));
        if (result === null) {
          return;
        }
        stream.fileData = encoder.encode(result);
      }
    };
    this.stream_ops.close = (stream: EMFSStream) => {
      const path = realPath(stream.node);
      if (FS.isFile(stream.node.mode) && stream.fileData) {
        const text = decoder.decode(stream.fileData);
        stream.fileData = undefined;
        this.convertSyncResult(this.CUSTOM_FS.put({ path, value: text }));
      }
    };
    this.stream_ops.read = (
      stream: EMFSStream,
      buffer: Uint8Array,
      offset: number,
      length: number,
      position: number
    ) => {
      if (length <= 0) return 0;

      const size = Math.min((stream.fileData?.length ?? 0) - position, length);
      try {
        buffer.set(stream.fileData!.subarray(position, position + size), offset);
      } catch (e) {
        throw new FS.ErrnoError(this.ERRNO_CODES["EPERM"]);
      }
      return size;
    };
    this.stream_ops.write = (
      stream: EMFSStream,
      buffer: Uint8Array,
      offset: number,
      length: number,
      position: number
    ) => {
      if (length <= 0) return 0;
      stream.node.timestamp = Date.now();

      try {
        if (position + length > (stream.fileData?.length ?? 0)) {
          // Resize
          // If this gets called very often, maybe resizing it by some multiple of its current size would be a better idea
          const oldData = stream.fileData ?? new Uint8Array();
          stream.fileData = new Uint8Array(position + length);
          stream.fileData.set(oldData);
        }

        // Write
        stream.fileData!.set(buffer.subarray(offset, offset + length), position);

        return length;
      } catch (e) {
        throw new FS.ErrnoError(this.ERRNO_CODES["EPERM"]);
      }
    };
    this.stream_ops.llseek = (stream: EMFSStream, offset: number, whence: number) => {
      let position = offset;
      if (whence === SEEK_CUR) {
        position += stream.position;
      } else if (whence === SEEK_END) {
        if (this.FS.isFile(stream.node.mode)) {
          try {
            // Not sure, but let's see
            position += stream.fileData!.length;
          } catch (e) {
            throw new FS.ErrnoError(this.ERRNO_CODES["EPERM"]);
          }
        }
      }

      if (position < 0) {
        throw new FS.ErrnoError(this.ERRNO_CODES["EINVAL"]);
      }

      return position;
    };
  }

  mount(mount: { opts: { root: string } }) {
    return this.createNode(null, "/", DIR_MODE, 0);
  }

  createNode(parent: EMFSNode | null, name: string, mode: number, dev?: any) {
    if (!this.FS.isDir(mode) && !this.FS.isFile(mode)) {
      throw new this.FS.ErrnoError(this.ERRNO_CODES["EINVAL"]);
    }
    let node = this.FS.createNode(parent, name, mode);
    node.node_ops = this.node_ops;
    node.stream_ops = this.stream_ops;
    return node;
  }

  private convertSyncResult<T, E>(result: SyncResult<T, E>): T {
    if (result.ok) {
      return result.data;
    } else {
      let error;

      if (result.status === 404) {
        error = new this.FS.ErrnoError(this.ERRNO_CODES["ENOENT"]);
      } else if (result.status === 400) {
        error = new this.FS.ErrnoError(this.ERRNO_CODES["EINVAL"]);
      } else {
        error = new this.FS.ErrnoError(this.ERRNO_CODES["EPERM"]);
      }

      // I'm so looking forward to https://github.com/tc39/proposal-error-cause
      error.cause = result.error;

      throw error;
    }
  }
}

function realPath(node: EMFSNode, fileName?: string) {
  const parts = [];
  while (node.parent !== node) {
    parts.push(node.name);
    node = node.parent;
  }
  parts.push(node.mount.opts.root);
  parts.reverse();
  if (fileName !== undefined && fileName !== null) {
    parts.push(fileName);
  }
  return parts.join("/");
}
