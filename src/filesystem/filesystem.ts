export type AsyncResult<T, E = Error> = Promise<
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      status: number;
      error: E;
      detail?: string;
    }
>;

/**
 * All of the functions can reject with a `NotebookFilesystemError`
 */
export interface NotebookFilesystem {
  get(opts: { path: string }): AsyncResult<string>;
  put(opts: { path: string; value: string }): AsyncResult<void>;
  delete(opts: { path: string }): AsyncResult<void>;
  listFiles(opts: { path: string }): AsyncResult<string[]>;
  move(opts: { path: string; newPath: string }): AsyncResult<void>;
}
