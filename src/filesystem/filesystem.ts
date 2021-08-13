export interface NotebookFilesystemError extends Error {
  status: number;
}

/**
 * All of the functions can reject with a `NotebookFilesystemError`
 */
export interface NotebookFilesystem {
  get(opts: { path: string }): Promise<string>;
  put(opts: { path: string; value: string }): Promise<void>;
  delete(opts: { path: string }): Promise<void>;
  listFiles(opts: { path: string }): Promise<string[]>;
  move(opts: { path: string; newPath: string }): Promise<void>;
}
