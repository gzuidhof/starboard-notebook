
export type RegistryEvent<S, T> = {type: "register"; key: S; value: T};
export type MapRegistryListenerFunction<S, T> = (event: RegistryEvent<S, T>) => void;

/**
 * A registry here is just a wrapper around a Map. It has a register function that simply calls set,
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

    private notifyHandlers(type: "register", key: S, value: T) {
        this.handlers.forEach((h) => h({type, key, value}));
    }


    public get(key: S) {
        return this.map.get(key);
    }

    /**
     * This does *not* trigger a register event, so cells already present with this cell type will not switch automatically.
     * Use register instead.
     */
    public set(key: S, value: T) {
        return this.map.set(key, value);
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

    public register(key: S, value: T) {
        const retValue = this.set(key,value);
        this.notifyHandlers("register", key, value);
        return retValue;
    }
}
