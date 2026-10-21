// RenderPro Studio - cache simples para abrir sem internet
const C = 'renderpro-v1';
const ARQ = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-180.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(ARQ))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(C).then((c) => c.put(e.request, cp)).catch(() => {}); return r; }).catch(() => caches.match(e.request)));
});
