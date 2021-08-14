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
  put(opts: { path: string; value: string }): AsyncResult<undefined>;
  delete(opts: { path: string }): AsyncResult<undefined>;
  move(opts: { path: string; newPath: string }): AsyncResult<undefined>;
  makeDirectory(opts: { path: string }): AsyncResult<undefined>;
  listDirectory(opts: { path: string }): AsyncResult<string[]>;
}
