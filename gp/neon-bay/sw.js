/* Неон-Бэй · service worker сборки Google Play: все файлы в кэше, игра запускается без сети.
   Имя кэша меняется с версией (build.py подставляет версию и список файлов). Чужие origin не кэшируются. */
const CACHE = 'neonbay-gp-5d050b9577';
const FILES = ["./", "./gp-adapter.js", "./index.html", "./manifest.webmanifest", "./fonts/OFL.txt", "./fonts/fonts.css", "./fonts/jetbrains-mono-cyrillic.woff2", "./fonts/jetbrains-mono-latin.woff2", "./fonts/manrope-cyrillic.woff2", "./fonts/manrope-latin.woff2", "./fonts/unbounded-cyrillic.woff2", "./fonts/unbounded-latin.woff2", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./vendor/three-r128/LICENSE", "./vendor/three-r128/three.min.js", "./vendor/three-r128/examples/js/postprocessing/EffectComposer.js", "./vendor/three-r128/examples/js/postprocessing/RenderPass.js", "./vendor/three-r128/examples/js/postprocessing/ShaderPass.js", "./vendor/three-r128/examples/js/postprocessing/UnrealBloomPass.js", "./vendor/three-r128/examples/js/shaders/CopyShader.js", "./vendor/three-r128/examples/js/shaders/GammaCorrectionShader.js", "./vendor/three-r128/examples/js/shaders/LuminosityHighPassShader.js"];
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
