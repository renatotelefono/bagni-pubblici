const CACHE = "bagni-cache-v1";

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll([
        "/",
        "/index.html",
        "/style.css",
        "/map.js"
      ])
    )
  );
});
