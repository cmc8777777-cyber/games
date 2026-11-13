/* Реклама и покупки для Google Play. Единственное место подключения AdMob и Play Billing.
   Сейчас: рекламы нет, покупок нет (кнопки «ролик за награду» скрыты). Не добавлять рекламный идентификатор для детских игр. */
window.GP = {
  ads: {
    available: function () { return false; },          // true, когда подключена награда за ролик (AdMob для детей)
    showRewarded: function (done) { done(false); }      // done(true) только после реально показанного ролика
  },
  purchase: {
    available: function () { return false; },          // true, когда подключён Google Play Billing
    buy: function (productId, done) { done(false); }
  }
};
