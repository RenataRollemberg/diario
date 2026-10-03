// Meu Diário — guarda o app para abrir mesmo sem internet.
// Páginas do próprio site: tenta a internet primeiro (para pegar novidades) e usa a cópia guardada se cair.
const CACHE = 'diario-v6';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './icon-180.png',
  './fonts/baloo-2-latin-500-normal.woff2', './fonts/baloo-2-latin-700-normal.woff2', './fonts/baloo-2-latin-800-normal.woff2',
  './fonts/nunito-latin-500-normal.woff2', './fonts/nunito-latin-700-normal.woff2', './fonts/nunito-latin-800-normal.woff2', './termos.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

});
