if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register(new URL("./sw.js", import.meta.url)).then(
    function (registration) {
      console.log("COOP/COEP Service Worker registered", registration.scope);
    },
    function (err) {
      console.log("COOP/COEP Service Worker failed to register", err);
    }
  );

  navigator.serviceWorker.getRegistration().then(function (reg) {
    // Or use some other solution
    // https://stackoverflow.com/questions/51597231/register-service-worker-after-hard-refresh
    // https://github.com/mswjs/msw/issues/98#issuecomment-612118211
    if (reg && reg.active && !navigator.serviceWorker.controller) {
      window.location.reload();
    }
  });
}
