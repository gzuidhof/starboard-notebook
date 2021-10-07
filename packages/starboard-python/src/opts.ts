import { KernelSource } from "./worker/kernel";

export type StarboardPythonPluginOpts = {
  artifactsUrl?: string;
  workerSource?: KernelSource;
  runInMainThread?: boolean;
};

// Global singleton
let pluginOpts: StarboardPythonPluginOpts = {};

export function getPluginOpts() {
  return pluginOpts;
}

export function setPluginOpts(opts: StarboardPythonPluginOpts) {
  pluginOpts = opts;
  pluginOpts.runInMainThread = false;
}

/**
 * Overwrite present options
 */
export function updatePluginOptions(opts: Partial<StarboardPythonPluginOpts>) {
  pluginOpts = {
    ...pluginOpts,
    ...opts,
  };
  pluginOpts.runInMainThread = false;
}
