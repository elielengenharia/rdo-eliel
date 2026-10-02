// Projeto Arquitetônico — funciona sem internet.
// Com internet, a página e os arquivos do app são sempre conferidos no servidor
// (cache: "no-cache"), para a versão nova aparecer na hora.
const CACHE = "arquitetonico-v2";
const ARQUIVOS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS.map(u => new Request(u, {cache: "reload"}))))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const local = req.url.startsWith(self.location.origin);
  const rede = req.mode === "navigate" ? fetch(req.url, {cache: "no-cache", credentials: "same-origin"})
             : local ? fetch(req, {cache: "no-cache"}) : fetch(req);
  e.respondWith(rede.then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)).catch(() => {}); return r; })
    .catch(() => caches.match(req).then(r => r || (req.mode === "navigate" ? caches.match("./index.html") : undefined))));
});
