const CACHE_NAME = "spanish-flashcards-v2"; // Bump this version (v2, v3) whenever you update decks.json

// 1. FIXED: Added 'decks.json' so the app data works offline
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./decks.json",     // <--- CRITICAL: Prevents "No Internet" errors
  "./manifest.json"
];

// Install: cache core assets immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Caching Files");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate: cleanup old caches (runs when you change CACHE_NAME)
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

// Fetch: serve from cache first, fall back to network
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle GET and same-origin requests
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached file if found
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, fetch from network
      return fetch(request)
        .then((networkResponse) => {
          // Check if valid response
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }

          // Clone response to save it to cache for next time
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });

          return networkResponse;
        })
        .catch(() => {
          // 2. FIXED: Removed the specific fallback that returned HTML for everything.
          // Returning index.html when the app asks for decks.json causes a crash.
          // If the file isn't in the cache and the network fails, we simply return nothing
          // (browser will handle the offline error naturally).
        });
    })
  );
});
