/* Держи Шмыга! · покупки костюмов через Яндекс (payments).
   Костюмы — постоянные покупки: их НЕ закрываем consumePurchase. При каждом запуске getPurchases возвращает всё купленное,
   поэтому костюм не теряется ни при сбое записи, ни на другом устройстве. Список товаров — DATA.PRODUCTS (совпадает с консолью).
   Премиум (premium_30/premium_365) обслуживает общий модуль premium.js, этот файл их не трогает. */
window.SKINSHOP = (function () {
  "use strict";
  var payments = null, catalog = {}, ready = false, busy = false, grant = function () {};
  function list(r) { return Array.isArray(r) ? r : (r && r.purchases) || []; }
  function init(sdk, onGrant) {
    grant = onGrant || grant;
    if (!sdk || typeof sdk.getPayments !== "function") return Promise.resolve(false);
    return sdk.getPayments({ signed: false }).then(function (p) {
      payments = p; return p.getCatalog();
    }).then(function (cat) {
      list(cat).forEach(function (c) { if (c && window.DATA.PRODUCTS[c.id]) catalog[c.id] = c; });
      ready = true;
      return payments.getPurchases();
    }).then(function (ps) {
      list(ps).forEach(function (p) { if (p && window.DATA.PRODUCTS[p.productID]) grant(p.productID, true); });
      return true;
    }).catch(function () { return false; });
  }
  function available(id) { return ready && !!catalog[id]; }
  function price(id) {
    var c = catalog[id];
    if (c) return c.price || ((c.priceValue || "") + " " + (c.priceCurrencyCode || ""));
    return window.DATA.PRODUCTS[id].price + " Ян";
  }
  function buy(id) {
    if (!available(id) || busy) return Promise.resolve(false);
    busy = true;
    return payments.purchase({ id: id, developerPayload: "skin" }).then(function (p) {
      busy = false; grant((p && p.productID) || id, false); return true;
    }, function () { busy = false; return false; });
  }
  return { init: init, available: available, price: price, buy: buy, busy: function () { return busy; } };
})();
