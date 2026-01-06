// IMPORTANTE: Cambia questo numero ad ogni modifica!
const CACHE_VERSION = 'v3';
const CACHE_NAME = `bagni-pubblici-${CACHE_VERSION}`;

const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/bagni-pubblici.html",
  "/incidenti-2022.html",
  "/style.css",
  "/map.js",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

// Installa il service worker e metti in cache i file
self.addEventListener("install", event => {
  console.log('[SW] Installing service worker...', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching files');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  // Forza l'attivazione immediata del nuovo SW
  self.skipWaiting();
});

// Rimuovi le vecchie cache
self.addEventListener("activate", event => {
  console.log('[SW] Activating service worker...', CACHE_NAME);
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  // Prende il controllo di tutte le pagine immediatamente
  self.clients.claim();
});

// Strategia: Network First, poi Cache (per avere sempre l'ultima versione)
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se la risposta è valida, aggiorna la cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Se la rete fallisce, usa la cache
        return caches.match(event.request).then(response => {
          if (response) {
            return response;
          }
          // Se non è in cache, restituisci una pagina di errore base
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Gestisci gli aggiornamenti del SW
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});