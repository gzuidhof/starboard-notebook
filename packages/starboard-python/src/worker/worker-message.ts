export type PyodideWorkerOptions = {
  artifactsUrl?: string;
  globalThisId?: string;
  drawCanvasId?: string;
  isMainThread?: boolean;
};

export type PyodideWorkerResult = {
  display?: "default" | "html" | "latex";
  value: any; // TODO: Normal objects can be normal objects, python proxies might need a bit of comlink
};
