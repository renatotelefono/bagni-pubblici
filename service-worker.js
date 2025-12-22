self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("bagni-cache").then(cache => {
      return cache.addAll([
        "./",
        "./index.html",
        "./style.css",
        "./map.js"
      ]);
    })
  );
});
