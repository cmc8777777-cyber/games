/* Catch Shmyg! offline cache. Cache name changes every build; old caches are deleted; other origins are not cached. */
var CACHE = "shmyg-v3.1-2fc90bf7";
var FILES = ["./", "art/hero-alpinist.webp", "art/hero-astro.webp", "art/hero-builder.webp", "art/hero-captain.webp", "art/hero-chef.webp", "art/hero-courier.webp", "art/hero-cyborg.webp", "art/hero-detective.webp", "art/hero-dj.webp", "art/hero-dragon.webp", "art/hero-explorer.webp", "art/hero-fire.webp", "art/hero-freerunner.webp", "art/hero-golden.webp", "art/hero-heroine.webp", "art/hero-hockey.webp", "art/hero-knight.webp", "art/hero-neon.webp", "art/hero-ninja.webp", "art/hero-nomad.webp", "art/hero-queen.webp", "art/hero-racer.webp", "art/hero-ranger.webp", "art/hero-samurai.webp", "art/hero-skier.webp", "art/hero-sporty.webp", "art/hero-sprinter.webp", "art/hero-street.webp", "art/hero-wizard.webp", "art/manifest.json", "art/thief-run.webp", "art/world-dunes-h.webp", "art/world-dunes-v.webp", "art/world-snow-h.webp", "art/world-snow-v.webp", "art/world-town-h.webp", "art/world-town-v.webp", "gp-adapter.js", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "index.html", "js/audio.js", "js/data.js", "js/engine.js", "js/gfx.js", "js/i18n-extra.js", "js/i18n.js", "js/models.js", "js/pets.js", "js/platform.js", "js/plaza.js", "js/shop.js", "js/story.js", "js/thumbs.js", "js/ui.js", "js/worlds.js", "manifest.webmanifest", "vendor/three.min.js"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== self.location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (r) {
    return r || fetch(e.request).catch(function () { return e.request.mode === "navigate" ? caches.match("./index.html") : Response.error(); });
  }));
});
