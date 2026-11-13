/* Держи Шмыга! · адаптер Google Play. Единственное место, куда потом подключаются AdMob и Google Play Billing.
   Сейчас: рекламы нет, покупок нет (игра скрывает кнопки роликов и платные образы, если available() === false).
   Также: кнопка «Назад» Android (popstate → window.__app.back()) и регистрация service worker для офлайна. */
window.GP = (function () {
  "use strict";
  var ads = {
    available: function () { return false; },               // AdMob: true, когда ролик загружен
    rewarded: function (done) { done(false); },             // AdMob: done(true) только после досмотренного ролика
    interstitial: function (done) { done(); }
  };
  var purchase = {
    available: function () { return false; },               // Billing: true, когда каталог получен
    buy: function (id) { return Promise.resolve(false); },
    owned: function () { return Promise.resolve([]); }
  };
  /* «Назад»: шаг назад в игре; в главном меню — второе нажатие за 2 с закрывает приложение */
  var lastBack = 0;
  try {
    history.replaceState({ gp: 0 }, "");
    history.pushState({ gp: 1 }, "");
    window.addEventListener("popstate", function () {
      var app = window.__app, done = false;
      try { done = !!(app && app.back && app.back()); } catch (e) {}
      if (done) { history.pushState({ gp: 1 }, ""); return; }
      var now = Date.now();
      if (now - lastBack < 2000) { history.back(); return; }
      lastBack = now; history.pushState({ gp: 1 }, "");
      try { app && app.toast && app.toast("backExit"); } catch (e) {}
    });
  } catch (e) {}
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
  return { build: "gplay", ads: ads, purchase: purchase };
})();
