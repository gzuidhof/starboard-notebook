self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        // We only need to set the headers for index.html
        if (!response.url.includes("index.html")) return response;

        const newHeaders = new Headers(response.headers);
        newHeaders.append("Cross-Origin-Embedder-Policy", "require-corp");
        newHeaders.append("Cross-Origin-Opener-Policy", "same-origin");

        const moddedResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });

        return moddedResponse;
      })
      .catch(function (e) {
        console.error(e);
      })
  );
});
