## Unreleased

- Fixed some build woes where Lerna couldn't figure out the build order when building from scratch.

## 0.14.1

- Migrated starboard-python to starboard-notebook repository

## 0.7.3

- Fix main thread python not resolving (causing it to never be runnable).
- Removed _proxy missing warning_ from python in main thread mode.

## 0.7.2

- Release with typescript typings on the plugin.

## 0.7.1

- The Pyodide webworker code is now embedded in the source file which prevents issues with COOP/COEP/CORS policies.
- Changed from kebab-case to snake_case for kernel messaging.
- Added CI script (which works by building starboard-notebook with starboard-python `npm link`ed).
- Added `updatePluginOptions` export, used to change options after the plugin has already been loaded.

## 0.7.0

- Run Pyodide in a web worker by default
- To run it in the main thread, set the `runInMainThread` option to true

## 0.6.7

- Make changes required for Starboard notebook 0.12.0 (moving away from emit to `runtime.controls` directly).

## 0.6.6

- Update to Starboard Notebook 0.10.0, removing some dependencies on deprecated functionality and updating the icons.

## 0.6.5

- Update to Starboard notebook 0.9.3 which requires a `clear()` method for cell handlers.

## 0.6.4

- Throw errors correctly instead of shielding them.

## 0.6.3

**Date:** 2021-05-02

- Matplotlib figures will again render as expected.
- There is now a global lock on Python execution to prevent weird interwoven cell executions happening when importing libraries.
