export declare type Pyodide = {
  runPython(code: string, messageCallback?: (msg: any) => void, errorCallback?: (err: any) => void): any;
  runPythonAsync(code: string, messageCallback?: (msg: any) => void, errorCallback?: (err: any) => void): Promise<any>;
  loadPackage(names: string, messageCallback?: (msg: any) => void, errorCallback?: (err: any) => void): Promise<any>;
  loadedPackages(packages: string[]): any;
  globals: PyProxy;
  unregisterJsModule(name: string): void;
  registerJsModule(name: string, obj: any): void;

  version: () => string;
  checkABI: any;
  _module: any;
  isPyProxy(v: any): boolean;

  PythonError: any;
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
