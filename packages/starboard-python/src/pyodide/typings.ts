declare type ffi = {
  PyProxy: any,
  PythonError: any,
};

export declare type Pyodide = {
  ffi: ffi,
  runPython(code: string, messageCallback?: (msg: any) => void, errorCallback?: (err: any) => void): any;
  runPythonAsync(code: string, messageCallback?: (msg: any) => void, errorCallback?: (err: any) => void): Promise<any>;
  loadPackage(names: string, messageCallback?: (msg: any) => void, errorCallback?: (err: any) => void): Promise<any>;
  loadedPackages(packages: string[]): any;
  globals: PyProxy;
  unregisterJsModule(name: string): void;
  registerJsModule(name: string, obj: any): void;
  loadPackagesFromImports(code: string, options: {messageCallback?: (msg: any) => void, errorCallback?: (err: any) => void}): Promise<any>;

  version: () => string;
  // checkABI: any;
  _module: any;
  isPyProxy(v: any): boolean;  // deprecated
  PythonError: any;  // deprecated
};

// https://pyodide.org/en/stable/usage/api/js-api.html
export declare type PyProxy = {
  type?: string;
  length?: any;
  delete?: (key: any) => void;
  get?: (key: any) => any;
  has?: (key: any) => boolean;
  set?: (key: any, value: any) => void;
  destroy?: () => void;
  toJs?: (args: any) => any;
};
