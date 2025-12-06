const CACHE_NAME = "spanish-flashcards-v1";

// Add any extra assets you want cached on first load
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json"
  // If you add separate CSS/JS files or icons, list them here too, e.g.:
  // "./styles.css",
  // "./icons/icon-192.png",
  // "./icons/icon-512.png"
];

// Install: cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate: cleanup old caches if you change CACHE_NAME
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
});

// Fetch: cache-first strategy for same-origin requests
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle GET and same-origin
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, fetch from network and cache it
      return fetch(request)
        .then((networkResponse) => {
          // Only cache successful, basic (same-origin) responses
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });

          return networkResponse;
        })
        .catch(() => {
          // Optional: provide a fallback response if offline and not cached
          // e.g., a simple offline page
          return caches.match("./index.html");
        });
    })
  );
});
