// Eliel Engenharia — Service Worker v4
// Página: busca primeiro na internet (pega sempre a versão nova) e usa o cache só quando estiver sem sinal.
// Demais arquivos: usa o cache e atualiza em segundo plano.
const CACHE = 'eliel-rdo-v4-5';
const ARQUIVOS = ['./', './index.html', './manifest.json', './logo.jpg', './icon-192.png', './icon-512.png', './modelo-cronograma.xlsx'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  const ehPagina = req.mode === 'navigate' || req.destination === 'document';
  if (ehPagina) {
    e.respondWith(
      fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(cacheado => {
      const rede = fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; }).catch(() => cacheado);
      return cacheado || rede;
    })
  );
});
