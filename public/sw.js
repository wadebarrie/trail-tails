self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/** Network-only fetch handler — satisfies install criteria without stale page caches. */
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
