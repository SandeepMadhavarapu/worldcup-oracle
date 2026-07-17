const CACHE_NAME = "worldcup-oracle-v2";
// Precache navigable routes plus a static offline fallback. Precaching is
// TOLERANT: one failed route must not brick the install, so each URL is cached
// individually and failures are ignored.
const APP_SHELL = ["/", "/dashboard", "/model-lab", "/calibration", "/offline.html"];

// How long to wait for the network before falling back to cache. Without this,
// users on a dead-slow connection stare at a spinner until the request times
// out at the OS level before the cached copy is ever consulted.
const NETWORK_TIMEOUT_MS = 5000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(APP_SHELL.map((url) => cache.add(url))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function fetchWithTimeout(request) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("sw-network-timeout")), NETWORK_TIMEOUT_MS);

    fetch(request).then(
      (response) => {
        clearTimeout(timer);
        resolve(response);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetchWithTimeout(event.request).catch(() =>
      caches.match(event.request).then((cached) => {
        if (cached) {
          return cached;
        }

        // Navigations get the offline page; other requests surface the failure.
        if (event.request.mode === "navigate") {
          return caches.match("/offline.html");
        }

        return Response.error();
      }),
    ),
  );
});
