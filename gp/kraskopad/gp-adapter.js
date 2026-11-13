/* Краскопад · адаптер магазина приложений (сборка Google Play, publish/gplay/app). Копируется tools/gplay.py.
   Одно место, куда потом подставляются AdMob и Google Play Billing — без правок игры.
   Сейчас: рекламы нет, покупок нет. Слой площадки PF без SDK сам ничего не показывает: кнопка «×2 опыта за ролик»
   скрыта (награду за ролик, которого нет, не выдаём), полноэкранной рекламы нет, Премиума и подарка дня нет.
   Кнопка «Назад» Android: popstate → window.__app.back() (закрыть карту, пауза/продолжить, окно → меню). */
window.GP = {
  ads: {
    available: false,
    /* полноэкранная: cb(shown) */
    interstitial: function (cb) { cb(false); },
    /* ролик за награду: cb(true) только если досмотрен */
    rewarded: function (cb) { cb(false); }
  },
  /* покупка товара Google Play Billing: Promise<{ok, token}> */
  purchase: function (id) { return Promise.resolve({ ok: false, reason: "no-billing" }); }
};
(function () {
  try {
    history.replaceState({ kp: 0 }, "");
    history.pushState({ kp: 1 }, "");
    addEventListener("popstate", function () {
      var used = false;
      try { if (window.__app && window.__app.back) used = window.__app.back(); } catch (e) {}
      if (used) history.pushState({ kp: 1 }, "");   // остаёмся в игре; из главного меню «Назад» закрывает приложение
    });
  } catch (e) {}
  /* офлайн: service worker кэширует все файлы (sw.js рядом); на file:// не регистрируется */
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
})();
