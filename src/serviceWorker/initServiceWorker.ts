import {
  isSharedArrayBufferAndAtomicsReady,
  serviceWorkerCanBeRegisteredAtCorrectScope,
} from "../components/helpers/crossOriginIsolated";

export function initCrossOriginIsolatedServiceWorker() {
  const hasSharedArrayBufferAndAtomics = isSharedArrayBufferAndAtomicsReady();

  if (!hasSharedArrayBufferAndAtomics) {
    const canRegister = serviceWorkerCanBeRegisteredAtCorrectScope();
    if (!canRegister.ok) {
      console.warn(
        `No shared array buffer/atomics support detected, and global service worker workaround can't be injected because: ${canRegister.reason}`
      );
      return;
    }
    // This won't make a difference on Safari, because Safari just outright doesn't support atomics
    console.debug("No shared array buffer/atomics support detected. Injecting global service worker...");
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(new URL("./starboard-sw.js", import.meta.url)).then(
        async function (registration) {
          console.log("COOP/COEP Service Worker registered", registration.scope);

          registration.addEventListener("updatefound", (_ev) => {
            window.location.reload();
          });

          // If the registration is active, but it's not controlling the page
          if (registration.active && !navigator.serviceWorker.controller) {
            console.log("Reloading page to make use of COOP/COEP Service Worker.");
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
}

export function removeCrossOriginIsolatedServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.controller?.postMessage({ type: "removeCrossOriginIsolatedServiceWorker" });
  }
}
