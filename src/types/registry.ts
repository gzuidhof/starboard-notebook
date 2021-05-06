/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export type RegistryEventType = "register" | "deregister";

export type RegistryEvent<S, T> = { type: RegistryEventType; key: S; value: T };
export type MapRegistryListenerFunction<S, T> = (event: RegistryEvent<S, T>) => void;

/**
 * A registry here is just a wrapper around a Map. It has a register function that calls set,
 * but also emits an event for internal use.
 */
export class MapRegistry<S, T> {
  protected map = new Map<S, T>();

  private handlers: MapRegistryListenerFunction<S, T>[] = [];

  public subscribe(handler: MapRegistryListenerFunction<S, T>) {
    this.handlers.push(handler);
  }

  public unsubscribe(handler: MapRegistryListenerFunction<S, T>) {
    this.handlers = this.handlers.filter((h) => h !== handler);
  }

  private notifyHandlers(type: RegistryEventType, key: S, value: T) {
    this.handlers.forEach((h) => h({ type, key, value }));
  }

  public get(key: S) {
    return this.map.get(key);
  }

  /**
   * This does *not* trigger a register event, so cells already present with this cell type will not switch automatically.
   * Use register instead.
   */
  public set(key: S | Array<S>, value: T) {
    if (!Array.isArray(key)) {
      key = [key];
    }
    key.forEach((k) => this.map.set(k, value));
  }

  public has(key: S) {
    return this.map.has(key);
  }

  public keys() {
    return this.map.keys();
  }

  public values() {
    return this.map.values();
  }

  public register(key: S | Array<S>, value: T) {
    if (!Array.isArray(key)) {
      key = [key];
    }
    key.forEach((k) => {
      this.map.set(k, value);
      this.notifyHandlers("register", k, value);
    });
  }

  public deregister(key: S) {
    if (!this.has(key)) return false;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const v = this.get(key)!;
    this.map.delete(key);
    this.notifyHandlers("deregister", key, v);
  }

  /**
   * Get the underlying Map
   */
  public getMap() {
    return this.map;
  }
}
