// public/sw.js
const CACHE_NAME = "ghv-cache-v1";
const OFFLINE_URL = "/offline";

// Diese Dateien werden direkt beim Installieren gecacht
const PRECACHE_ASSETS = [
  "/",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/app/globals.css",
];

// ----------------------------------------
// Install - App-Shell + CSS + Icons cachen
// ----------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      for (const url of PRECACHE_ASSETS) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
          } else {
            console.warn(
              `[SW] ⚠️ Skip caching ${url} - HTTP ${response.status}`
            );
          }
        } catch (err) {
          console.warn(`[SW] ⚠️ Failed to fetch ${url}:`, err);
        }
      }
    })()
  );
  self.skipWaiting();
});
// ----------------------------------------
// Activate - Alte Caches löschen
// ----------------------------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

// ----------------------------------------
// Fetch - NetworkFirst für Navigations-Requests
// CacheFirst für statische Ressourcen
// ----------------------------------------
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // 1️⃣ HTML-Seiten (Navigation): Network-First
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((res) => res || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // 2️⃣ CSS / JS / Bilder: Cache-First
  if (
    req.url.includes("/_next/") ||
    req.destination === "style" ||
    req.destination === "script" ||
    req.destination === "image"
  ) {
    event.respondWith(
      caches.match(req).then((cacheRes) => {
        const fetchRes = fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            return res;
          })
          .catch(() => cacheRes);
        return cacheRes || fetchRes;
      })
    );
  }
});
