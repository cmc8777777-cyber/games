/* Адаптер рекламы и покупок для сборки Google Play. Сейчас: рекламы и покупок нет.
   Сюда позже подключаются AdMob и Google Play Billing — игру править не нужно (она читает только GP.ads и GP.purchase). */
window.GP = {
  ads: {
    available: function () { return false; },          // true, когда подключён AdMob
    interstitial: function (done) { done(); },          // показать полноэкранную рекламу и вызвать done
    rewarded: function (cb) { cb(false); }              // ролик за награду: cb(true) только после просмотра
  },
  purchase: {
    available: function () { return false; },
    buy: function (id, cb) { cb(false); }
  }
};
