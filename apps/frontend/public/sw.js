const CACHE = 'interviewos-v2';
const STATIC_CACHE = 'interviewos-static-v2';
const OFFLINE_URL = '/offline';

const STATIC_EXTENSIONS = [
  '.js', '.css', '.woff2', '.woff', '.ttf', '.svg', '.png', '.jpg', '.webp', '.avif',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/dashboard',
        OFFLINE_URL,
        '/manifest.json',
        '/icons/icon.svg',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png',
        '/icons/apple-touch-icon.png',
      ]).catch(() => {});
    }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE && key !== STATIC_CACHE)
          .map((key) => caches.delete(key)),
      );
    }),
  );
  self.clients.claim();
});

function isStaticAsset(url) {
  const pathname = new URL(url).pathname;
  return STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  if (isStaticAsset(request.url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) return response;
    throw new Error('Not OK');
  } catch {
    const cached = await caches.match(OFFLINE_URL);
    if (cached) return cached;

    return new Response(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline — InterviewOS</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #000; color: #fff;
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      padding: 24px;
    }
    .container { text-align: center; max-width: 400px; }
    .icon { width: 64px; height: 64px; margin: 0 auto 24px; opacity: 0.4; }
    h1 { font-size: 22px; font-weight: 600; margin-bottom: 8px; color: rgba(255,255,255,0.9); }
    p { font-size: 14px; color: rgba(204,204,204,0.6); line-height: 1.5; margin-bottom: 24px; }
    .retry-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 24px; background: #0066cc; color: #fff;
      border: none; border-radius: 9999px; font-size: 14px;
      cursor: pointer; transition: background 0.2s;
    }
    .retry-btn:hover { background: #0071e3; }
    .retry-btn svg { width: 16px; height: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <svg class="icon" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="96" y="128" width="320" height="256" rx="24" stroke="#0066cc" stroke-width="16"/>
      <line x1="160" y1="208" x2="208" y2="256" stroke="#0066cc" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="208" y1="256" x2="160" y2="304" stroke="#0066cc" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="272" y1="288" x2="352" y2="288" stroke="#2997ff" stroke-width="12" stroke-linecap="round"/>
    </svg>
    <h1>You&rsquo;re offline</h1>
    <p>Check your connection and try again. InterviewOS will resume when you&rsquo;re back online.</p>
    <button class="retry-btn" onclick="location.reload()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/>
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
      </svg>
      Retry
    </button>
  </div>
  <script>
    window.addEventListener('online', () => location.reload());
  </script>
</body>
</html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      },
    );
  }
}
