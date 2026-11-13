/* Краскопад · service worker сборки Google Play: все файлы в кэше, игра запускается без сети.
   Имя кэша меняется с каждой сборкой (tools/gplay.py подставляет хэш файлов и список). Чужие origin не кэшируются. */
const CACHE = 'kraskopad-gp-7543be35d1';
const FILES = ["./", "./gp-adapter.js", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./img/bg_loading.webp", "./img/bg_lose.webp", "./img/bg_menu.webp", "./img/bg_season2.webp", "./img/bg_win.webp", "./img/cover.webp", "./img/i_crystal.webp", "./img/i_drop2.webp", "./img/skin_0.webp", "./img/skin_1.webp", "./img/skin_10.webp", "./img/skin_11.webp", "./img/skin_12.webp", "./img/skin_13.webp", "./img/skin_14.webp", "./img/skin_15.webp", "./img/skin_16.webp", "./img/skin_17.webp", "./img/skin_18.webp", "./img/skin_19.webp", "./img/skin_2.webp", "./img/skin_20.webp", "./img/skin_21.webp", "./img/skin_22.webp", "./img/skin_23.webp", "./img/skin_24.webp", "./img/skin_25.webp", "./img/skin_26.webp", "./img/skin_27.webp", "./img/skin_28.webp", "./img/skin_29.webp", "./img/skin_3.webp", "./img/skin_30.webp", "./img/skin_31.webp", "./img/skin_32.webp", "./img/skin_33.webp", "./img/skin_34.webp", "./img/skin_35.webp", "./img/skin_36.webp", "./img/skin_37.webp", "./img/skin_38.webp", "./img/skin_39.webp", "./img/skin_4.webp", "./img/skin_5.webp", "./img/skin_6.webp", "./img/skin_7.webp", "./img/skin_8.webp", "./img/skin_9.webp", "./js/ai.js", "./js/art.js", "./js/audio.js", "./js/challenges.js", "./js/core.js", "./js/events.js", "./js/i18n.js", "./js/lang.js", "./js/main.js", "./js/meta.js", "./js/models.js", "./js/modes.js", "./js/platform.js", "./js/pve.js", "./js/tex.js", "./js/train.js", "./js/vehicles.js", "./js/world.js", "./vendor/LICENSE", "./vendor/three.min.js"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match('./index.html'))));
});
