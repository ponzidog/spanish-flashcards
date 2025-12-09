const CACHE_NAME = "spanish-flashcards-v4"; // I bumped the version to force an update

// We ONLY cache the two files absolutely required for the game to run.
// We REMOVED manifest.json from this list. If the manifest is missing/broken,
// the app might not look pretty on the home screen, but it WON'T crash offline.
const ASSETS_TO_CACHE = [
  "./",
  "./index.html", // Ensure this matches your actual HTML filename on GitHub
  "./decks.json"
];

// Install: Cache critical files
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Force this new service worker to activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching essential game files...");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate: Delete old caches to save space and ensure you get the latest version
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
  self.clients.claim(); // Take control of the page immediately
});

// Fetch: The "Stale-While-Revalidate" Strategy
// 1. Try to get the file from the Internet (so you get updates).
// 2. If Internet works, save a copy to the Cache for later.
// 3. If Internet FAILS (offline), instantly serve the file from Cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If we got a valid response from the web, clone it and cache it
        if (networkResponse && networkResponse.status === 200) {
            const resClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed (Airplane mode)? Return the cached version.
        return caches.match(event.request);
      })
  );
});
