/* Braxon PWA Root Service Worker
   - Safe shell cache only
   - Does NOT cache /api
   - Designed for installable PWA scope (/)
*/

const CACHE_NAME = "braxon-pwa-shell-v1";

const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/mobile-login.html",
  "/manifest.json",
  "/css/mobile-modern.css",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith("braxon-pwa-shell-") && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== "GET") return;

  // Never cache API calls
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req).catch(() => caches.match("/mobile-login.html"));
    })
  );
});

