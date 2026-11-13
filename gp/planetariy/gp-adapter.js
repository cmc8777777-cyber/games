/* Адаптер платформы для Google Play: игра работает офлайн, без Яндекс SDK.
   Реклама и покупки выключены. Место под AdMob и Google Play Billing — только объект GP ниже:
   подставить рекламу в GP.ads.* и покупки в GP.purchase.*, игру править не нужно. */
window.GP = {
  ads: {
    can: function () { return false; },                 // есть ли ролик за награду (пока нет)
    rewarded: function (cb) { cb(false); },             // награда только после показанного ролика
    interstitial: function (done) { done(); }           // полноэкранная между уровнями (пока нет)
  },
  purchase: { available: false }                        // Google Play Billing (пока нет)
};
window.PF = (function () {
  'use strict';
  var self = { onPause: function () {}, onCloud: function () {}, mergers: {} }, hidden = false;
  self.get = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  self.put = function (k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} };
  self.del = function (k) { try { localStorage.removeItem(k); } catch (e) {} };
  self.save = function () { return Promise.resolve(true); };
  self.init = function () {
    try { document.addEventListener('visibilitychange', function () { hidden = !!document.hidden; try { self.onPause(self.paused()); } catch (e) {} }); } catch (e) {}
    return Promise.resolve();
  };
  self.ready = function () {};
  self.setPlaying = function () {};
  self.paused = function () { return hidden; };
  self.hasSdk = function () { return false; };
  self.sdk = function () { return null; };
  self.lang = function () { return ''; };
  self.premium = function () { return false; };
  self.canReward = function () { return !!window.GP.ads.can(); };
  self.rewarded = function (cb) { window.GP.ads.rewarded(cb); };
  self.interstitial = function (done) { window.GP.ads.interstitial(done); };
  return self;
})();
/* кнопка «Назад» Android: шаг назад по экранам игры; с заставки выходит из приложения */
(function () {
  try {
    history.pushState({ gp: 1 }, '');
    window.addEventListener('popstate', function () {
      var handled = false;
      try { handled = !!(window.__app && window.__app.back()); } catch (e) {}
      if (handled) history.pushState({ gp: 1 }, '');
      else history.back();
    });
  } catch (e) {}
  /* офлайн: service worker */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
