// AssignMe service worker (Phase 8).
// - Cache-first for same-origin static assets (JS/CSS/fonts/images).
// - Network-first for navigations, offline fallback to /offline.
// - NEVER caches /api/* (private academic/payment data).

const VERSION = "assignme-v1";
const STATIC_CACHE = `${VERSION}-static`;
const FALLBACK_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.add(FALLBACK_URL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isApi(url) {
  return url.pathname.startsWith("/api/");
}

function isStaticAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/") ||
      /\.(?:js|css|png|jpg|jpeg|svg|gif|webp|woff2?)$/.test(url.pathname))
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Private API responses are never cached (PRD §41).
  if (isApi(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => res)
        .catch(() => caches.match(FALLBACK_URL))
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return res;
          })
      )
    );
  }
});
