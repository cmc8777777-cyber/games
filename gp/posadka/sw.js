var CACHE = 'posadka-0.5.1';
var FILES = ["./", "index.html", "gp-adapter.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "img/beacon.webp", "img/bg_jupiter.webp", "img/bg_mars.webp", "img/bg_moon.webp", "img/bg_venus.webp", "img/boom.webp", "img/chute.webp", "img/cover.webp", "img/flag.webp", "img/flame.webp", "img/ic_chute.webp", "img/ic_fuel.webp", "img/ic_lock.webp", "img/ic_quiz.webp", "img/ic_star.webp", "img/ic_wind.webp", "img/pad.webp", "img/ship_0.webp", "img/ship_1.webp", "img/ship_2.webp", "img/ship_3.webp"];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (r) { return r || fetch(e.request).catch(function () { return caches.match('index.html'); }); }));
});
