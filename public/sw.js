/**
 * Service Worker for Mind Measure Mobile
 *
 * Caching strategy:
 *   - S3 images:  cache-first  (immutable, content-addressed filenames)
 *   - API calls:  network-first with 1h stale fallback (offline viewing)
 *   - App shell:  cache-first  (served by Vite/Capacitor)
 */

const CACHE_VERSION = 'mm-mobile-v1';
const IMAGE_CACHE = 'mm-images-v1';
const API_CACHE = 'mm-api-v1';

/** How long API responses are considered fresh (1 hour). */
const API_MAX_AGE_MS = 60 * 60 * 1000;

// ── Install ────────────────────────────────────────────────────

self.addEventListener('install', () => {
  // Skip waiting so the new SW activates immediately
  self.skipWaiting();
});

// ── Activate ───────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => ![CACHE_VERSION, IMAGE_CACHE, API_CACHE].includes(n))
          .map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ──────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // ── S3 images: cache-first (immutable) ───────────────────────
  if (isS3ImageRequest(url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // ── API calls: network-first with stale fallback ─────────────
  if (url.pathname.includes('/api/')) {
    event.respondWith(networkFirstWithCache(request, API_CACHE));
    return;
  }

  // Everything else: default browser behaviour
});

// ── Helpers ────────────────────────────────────────────────────

function isS3ImageRequest(url) {
  return (
    url.hostname.includes('amazonaws.com') &&
    /\.(jpe?g|png|gif|webp)$/i.test(url.pathname)
  );
}

/**
 * Cache-first: return cached response if available, otherwise fetch
 * and cache for next time.
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (_err) {
    // Offline and not cached — return a transparent 1x1 pixel as placeholder
    return new Response(
      Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), c => c.charCodeAt(0)),
      { headers: { 'Content-Type': 'image/gif' } }
    );
  }
}

/**
 * Network-first: try the network, fall back to cache.
 * Successful responses are cached with a timestamp header.
 */
async function networkFirstWithCache(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Clone and store with a freshness timestamp
      const headers = new Headers(response.headers);
      headers.set('sw-cached-at', Date.now().toString());
      const cachedResponse = new Response(await response.clone().blob(), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      cache.put(request, cachedResponse);
    }
    return response;
  } catch (_err) {
    // Offline — serve from cache if fresh enough
    const cached = await cache.match(request);
    if (cached) {
      const cachedAt = Number(cached.headers.get('sw-cached-at') || 0);
      if (Date.now() - cachedAt < API_MAX_AGE_MS) {
        return cached;
      }
    }
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
