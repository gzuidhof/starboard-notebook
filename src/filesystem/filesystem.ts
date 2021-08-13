export interface NotebookFilesystem {
  get(absolutePath: string): Promise<string>;
  put(absolutePath: string, value: string): Promise<void>;
  delete(absolutePath: string): Promise<void>;
  listFiles(absolutePath: string): Promise<string[]>;
  move(absolutePath: string, newAbsolutePath: string): Promise<void>;
}
