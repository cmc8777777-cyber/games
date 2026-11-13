/* Неон-Бэй · адаптер магазина приложений (сборка Google Play, publish/gplay/app).
   Одно место, куда потом подставляются AdMob и Google Play Billing — без правок игры.
   Сейчас: рекламы нет, покупок нет. Пока GP.ads.available === false, игра скрывает кнопки «ролик за награду»
   (награду за ролик, которого нет, не выдаём) и не показывает полноэкранную рекламу. Премиум Яндекса в этой сборке не работает.
   Кнопка «Назад» Android: popstate → window.__app.back() (закрыть окно / карту, пауза, продолжить). */
window.GP = {
  ads: {
    available: false,
    /* полноэкранная: cb(shown) */
    interstitial: function (cb) { cb(false); },
    /* ролик за награду: cb(true) только если досмотрен */
    rewarded: function (cb) { cb(false); }
  },
  /* покупка товара Google Play Billing: Promise<{ok, token}> */
  purchase: function (id) { return Promise.resolve({ ok: false, reason: 'no-billing' }); }
};
(function () {
  try {
    history.replaceState({ nb: 0 }, '');
    history.pushState({ nb: 1 }, '');
    addEventListener('popstate', function () {
      try { if (window.__app && window.__app.back) window.__app.back(); } catch (e) {}
      history.pushState({ nb: 1 }, '');   // остаёмся в игре; выход — системный жест из заставки или гаража
    });
  } catch (e) {}
  /* офлайн: service worker кэширует все файлы (sw.js рядом); на file:// не регистрируется */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
