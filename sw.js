// Meu Diário — guarda o app para abrir mesmo sem internet.
// Imagens e fontes: cache-first (abre do cache, atualiza por baixo)
// HTML/JS: network-first (pega novidades, cai no cache se offline)
const CACHE = 'diario-v27';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './icon-180.png',
  './fonts/baloo-2-latin-500-normal.woff2', './fonts/baloo-2-latin-700-normal.woff2', './fonts/baloo-2-latin-800-normal.woff2',
  './fonts/nunito-latin-500-normal.woff2', './fonts/nunito-latin-700-normal.woff2', './fonts/nunito-latin-800-normal.woff2', './termos.html',
  './img/quarto-dia.webp', './img/quarto-noite.webp',
  './img/circo-dia.webp', './img/circo-noite.webp',
  './img/carrossel-dia.webp', './img/carrossel-noite.webp'];

// extensões que devem usar cache-first (estáticos que não mudam com frequência)
const CACHE_FIRST_EXT = ['.webp','.png','.jpg','.jpeg','.svg','.woff2','.woff'];

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
  if (url.origin !== location.origin) return;

  const isCacheFirst = CACHE_FIRST_EXT.some((ext) => url.pathname.endsWith(ext));

  if (isCacheFirst) {
    // cache-first: serve do cache imediatamente, atualiza em segundo plano
    e.respondWith(
      caches.open(CACHE).then((c) => c.match(req).then((hit) => {
        const fetchPromise = fetch(req).then((res) => {
          if (res.ok) c.put(req, res.clone());
          return res;
        });
        return hit || fetchPromise;
      }))
    );
  } else {
    // network-first para HTML/JS: pega novidades, usa cache se offline
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
    );
  }
});
