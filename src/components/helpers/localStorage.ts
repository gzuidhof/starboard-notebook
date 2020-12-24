export function trySetLocalStorage(key: string, value: any) {
    try {
        localStorage.setItem(key, value);
    } catch(e) {
        console.warn(`Could not set localStorage (key = ${key}).`);
    }
}