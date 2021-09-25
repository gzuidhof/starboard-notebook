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

export interface NotebookFilesystem {
  /**
   * Get a file or directory at a given path.
   * @returns The contents of the file. `null` corresponds to a directory
   */
  get(opts: { path: string }): AsyncResult<string | null>;

  /**
   * Creates or replaces a file or directory at a given path.
   * @param opts.value The contents of the file. `null` corresponds to a directory
   */
  put(opts: { path: string; value: string | null }): AsyncResult<undefined>;

  /**
   * Deletes a file or directory at a given path
   */
  delete(opts: { path: string }): AsyncResult<undefined>;

  /**
   * Move a file or directory to a new path. Can be used for renaming
   */
  move(opts: { path: string; newPath: string }): AsyncResult<undefined>;

  /**
   * List the files and subdirectories in a directory
   */
  listDirectory(opts: { path: string }): AsyncResult<string[]>;
}
