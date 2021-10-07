/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export interface FlatPromise<T = any, E = any> {
  resolve: (value?: T) => void;
  reject: (reason?: E) => void;
  promise: Promise<T>;
}

/**
 * Creates a promise with the resolve and reject function outside of it, useful for tasks that may complete at any time.
 * Based on MIT licensed https://github.com/arikw/flat-promise, with typings added by gzuidhof.
 * @param executor
 */
export function flatPromise<T = any, E = any>(
  executor?: (resolve: (value?: T) => void, reject: (reason?: E) => void) => void | Promise<void>
): FlatPromise<T, E> {
  let resolve!: (value?: T) => void;
  let reject!: (reason?: E) => void;

  const promise: Promise<T> = new Promise((res, rej) => {
    // Is this any cast necessary?
    (resolve as any) = res;
    reject = rej;
  });

  if (executor) {
    // This is actually valid.. as in the spec the function above the Promise gets executed immediately.
    executor(resolve, reject);
  }

  return { promise, resolve, reject };
}
