const hasSharedArrayBufferAndAtomics: boolean =
  "SharedArrayBuffer" in globalThis && "Atomics" in globalThis && (globalThis as any)["crossOriginIsolated"] !== false;

if (!hasSharedArrayBufferAndAtomics) {
  // TODO: Won't make a difference on Safari, because Safari just outright doesn't support atomics
  console.warn("No shared array buffer/atomics support detected. Injecting global service worker...");
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register(new URL("./sw.js", import.meta.url)).then(
      function (registration) {
        console.log("COOP/COEP Service Worker registered", registration.scope);

        // If the registration is active, but it's not controlling the page
        if (registration.active && !navigator.serviceWorker.controller) {
          window.location.reload();
        }
      },
      function (err) {
        console.log("COOP/COEP Service Worker failed to register", err);
      }
    );
  } else {
    console.warn("Cannot register a service worker");
  }
}
