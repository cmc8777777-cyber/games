/* Премиум: общий модуль для браузерных игр на Яндекс Играх.
   Платный Премиум на срок (30 дней или год), без автопродления: «используемая» покупка, срок считается по серверному
   времени Яндекса и хранится в облачных данных игрока. Подробно: README.md рядом с этим файлом.
   Модуль ничего не знает об игре: хранилище, звук и реклама подключаются через init() и несколько вызовов хозяина.
   Без SDK, без покупок или без созданных товаров в консоли кнопка и карточки скрыты, игра работает как раньше. */
window.Premium = (function () {
  "use strict";
  var DAY = 86400000;

  /* ---- Настройки: все числа и товары в одном месте ---- */
  var config = {
    adGapMs: 5 * 60 * 1000,     // интервал полноэкранной рекламы; хозяин читает его при показе (решение владельца 8 ноября: 5 минут)
    cardEvery: 3,               // карточка «Надоела реклама?» после каждой 3-й показанной полноэкранной рекламы
    remindDays: 3,              // напоминание о конце Премиума за столько дней и меньше (раз в сутки)
    pollMs: 60000,              // как часто сверять срок с серверным временем
    tokensKeep: 20,             // сколько токенов последних покупок помнить
    products: {                 // id товара в консоли Яндекса → срок
      premium_30: { days: 30 },
      premium_365: { days: 365 }
    },
    order: ["premium_30", "premium_365"],
    corner: true,               // кнопка «Премиум» в углу экрана
    zIndex: 50
  };

  /* ---- Тексты по умолчанию (нейтральные; не обещать отсутствие чужих блоков рекламы, платформа может показывать свои). Игра подставляет свои финальные тексты. Подмена: Premium.init({ texts: { ru: {...}, en: {...} } }) ---- */
  var TEXTS = {
    ru: {
      btn: "Премиум", btnOn: "Премиум · {0} д.", title: "Премиум",
      activeUntil: "Активен до {0}. Осталось {1}.",
      notActive: "Сейчас Премиум не включён.",
      perks: ["Полноэкранная реклама отключается.", "Награды за ролики выдаются сразу, без просмотра.", "Правила и сложность игры не меняются: Премиум не помогает выигрывать."],
      p30: "Премиум на 30 дней", p365: "Премиум на год",
      validTo: "Будет действовать до {0}", buy: "Купить", endBuy: "Купить Премиум", extend: "Продлить",
      note: "Один платёж, без автопродления: больше ничего не спишется. Если Премиум уже идёт, новый срок добавится к концу.",
      close: "Закрыть", later: "Не сейчас",
      adTitle: "Надоела реклама?", adText: "Премиум отключает полноэкранную рекламу, а награды за ролики выдаёт сразу. 30 дней за {0}, не продлевается сам.", adMore: "Узнать про Премиум",
      soonTitle: "Премиум скоро закончится", soonText: "Осталось {0}. Продлить?",
      endTitle: "Премиум закончился", endText: "Реклама вернулась. Можно включить Премиум снова.",
      busy: "Ждём подтверждения оплаты…", done: "Готово! Премиум активен до {0}.",
      fail: "Покупка не прошла. Деньги не списаны.", saveFail: "Оплата принята, но срок пока не сохранился. Не закрывайте игру, мы повторим при следующем запуске.",
      d1: "{0} день", d2: "{0} дня", d5: "{0} дней", free: "Ян", lang: "ru-RU"
    },
    en: {
      btn: "Premium", btnOn: "Premium · {0} d", title: "Premium",
      activeUntil: "Active until {0}. {1} left.",
      notActive: "Premium is not active.",
      perks: ["Full-screen ads are disabled.", "Rewards for videos are given instantly, no watching.", "The rules and difficulty stay the same: Premium does not help you win."],
      p30: "Premium for 30 days", p365: "Premium for a year",
      validTo: "Will be active until {0}", buy: "Buy", endBuy: "Buy Premium", extend: "Extend",
      note: "One payment, no auto-renewal: nothing else will be charged. If Premium is already running, the new period is added to the end.",
      close: "Close", later: "Not now",
      adTitle: "Tired of ads?", adText: "Premium removes full-screen ads and gives video rewards instantly. 30 days for {0}, no auto-renewal.", adMore: "About Premium",
      soonTitle: "Premium ends soon", soonText: "{0} left. Extend?",
      endTitle: "Premium has ended", endText: "Ads are back. You can turn Premium on again.",
      busy: "Waiting for payment confirmation…", done: "Done! Premium is active until {0}.",
      fail: "The purchase did not go through. You were not charged.", saveFail: "Payment accepted, but the period is not saved yet. Keep the game open, we will retry on the next start.",
      d1: "{0} day", d2: "{0} days", d5: "{0} days", free: "Yan", lang: "en-GB"
    }
  };

  /* ---- Состояние ---- */
  var sdk = null, payments = null, store = null;
  var lang = "ru", texts = TEXTS.ru;
  var catalog = {};                   // id → описание товара из консоли
  var st = blank();
  var off = 0;                        // запасная поправка серверного времени, если serverTime() недоступен
  var ready = false, canBuy = false, busy = false, chain = Promise.resolve();
  var listeners = [], pollTimer = 0, lastActive = false;
  var ui = { corner: null, ov: null, box: null, status: "", mode: "", style: null, lastFocus: null };

  function blank() { return { until: 0, tokens: [], ads: 0, cardAt: 0, remindDay: 0, endShown: 0 }; }
  function clean(o) {
    var r = blank();
    if (!o || typeof o !== "object") return r;
    r.until = Math.max(0, Number(o.until) || 0);
    r.tokens = Array.isArray(o.tokens) ? o.tokens.filter(function (t) { return typeof t === "string"; }).slice(-config.tokensKeep) : [];
    r.ads = Math.max(0, Math.floor(Number(o.ads) || 0));
    r.cardAt = Math.max(0, Math.floor(Number(o.cardAt) || 0));
    r.remindDay = Math.max(0, Math.floor(Number(o.remindDay) || 0));
    r.endShown = Math.max(0, Number(o.endShown) || 0);
    return r;
  }
  function parse(raw) { try { return clean(typeof raw === "string" ? JSON.parse(raw) : raw); } catch (e) { return blank(); } }
  /* Слияние двух снимков (облако и устройство): срок и счётчики берём большие, токены объединяем.
     Хозяин вызывает при импорте облака, иначе срок мог бы пропасть при конфликте двух устройств. */
  function mergeState(a, b) {
    var x = parse(a), y = parse(b), r = blank(), seen = {};
    r.until = Math.max(x.until, y.until); r.ads = Math.max(x.ads, y.ads); r.cardAt = Math.max(x.cardAt, y.cardAt);
    r.remindDay = Math.max(x.remindDay, y.remindDay); r.endShown = Math.max(x.endShown, y.endShown);
    y.tokens.concat(x.tokens).forEach(function (t) { if (!seen[t]) { seen[t] = 1; r.tokens.push(t); } });
    r.tokens = r.tokens.slice(-config.tokensKeep);
    return JSON.stringify(r);
  }
  function persist() { try { if (store && store.set) store.set(JSON.stringify(st)); } catch (e) {} }
  function loadState() { try { st = parse(store && store.get ? store.get() : null); } catch (e) { st = blank(); } }

  /* ---- Серверное время: часы устройства не используем ---- */
  function now() {
    if (sdk && typeof sdk.serverTime === "function") {
      try { var t = sdk.serverTime(); if (typeof t === "number" && t > 0) { off = t - Date.now(); return t; } } catch (e) {}
    }
    return Date.now() + off;
  }
  function active() { return st.until > now(); }
  function daysLeft() { var ms = st.until - now(); return ms > 0 ? Math.ceil(ms / DAY) : 0; }
  function available() { return !!(ready && canBuy); }

  /* ---- Утилиты текста ---- */
  function fmt(s) { var a = arguments; return String(s).replace(/\{(\d)\}/g, function (m, i) { var v = a[Number(i) + 1]; return v == null ? "" : v; }); }
  function tx(k) { var v = texts[k]; return v != null ? v : (TEXTS.ru[k] != null ? TEXTS.ru[k] : k); }
  function plural(n) {
    if (lang === "en") return fmt(n === 1 ? tx("d1") : tx("d2"), n);
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return fmt(tx("d1"), n);
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return fmt(tx("d2"), n);
    return fmt(tx("d5"), n);
  }
  function dateStr(ms) {
    try { return new Date(ms).toLocaleDateString(tx("lang"), { day: "numeric", month: "long", year: "numeric" }).replace(/\s*г\.$/, ""); }   // без «г.», чтобы в конце фразы не было «г..»
    catch (e) { return new Date(ms).toISOString().slice(0, 10); }
  }
  function priceOf(id) { var c = catalog[id]; return c && c.price ? String(c.price) : ""; }
  function dayIdx() { return Math.floor(now() / DAY); }
  function emit() { var a = active(); lastActive = a; listeners.slice().forEach(function (f) { try { f(a); } catch (e) {} }); renderCorner(); if (ui.ov && ui.mode === "shop") renderShop(); }

  /* ---- Покупка и начисление: запись в облако подтверждена, и только потом consumePurchase ---- */
  function grant(p) {
    var id = p && p.productID, tok = p && p.purchaseToken, prod = config.products[id];
    if (!prod || !tok) return Promise.resolve(false);
    if (st.tokens.indexOf(tok) < 0) {
      var base = Math.max(now(), st.until);
      st.until = base + prod.days * DAY;
      st.tokens.push(tok); if (st.tokens.length > config.tokensKeep) st.tokens.shift();
      persist();
    }
    return Promise.resolve(store && store.save ? store.save() : false).then(function (ok) {
      if (!ok) { var e = new Error("save"); e.code = "save"; throw e; }
      // срок уже сохранён: если закрыть покупку не вышло, её закроют при следующем запуске, второй раз срок не начислится
      return Promise.resolve(payments.consumePurchase(tok)).then(function () {}, function () {});
    }).then(function () { emit(); return true; });
  }
  function queue(f) { var r = chain.then(f, f); chain = r.then(function () {}, function () {}); return r; }
  function checkPurchases() {
    return queue(function () {
      return payments.getPurchases().then(function (list) {
        list = Array.isArray(list) ? list : (list && list.purchases) || [];
        return list.reduce(function (p, item) { return p.then(function () { return grant(item).catch(function () {}); }); }, Promise.resolve());
      });
    }).catch(function () {}).then(function () { emit(); });
  }
  function buy(id) {
    if (busy || !canBuy || !config.products[id]) return Promise.resolve(false);
    busy = true; setStatus(tx("busy")); renderShop();
    return queue(function () {
      return payments.purchase({ id: id, developerPayload: "pm" }).then(function (p) {
        return grant(p).then(function () { setStatus(fmt(tx("done"), dateStr(st.until))); return true; }, function (e) {
          setStatus(e && e.code === "save" ? tx("saveFail") : tx("fail")); return false;
        });
      }, function () { setStatus(tx("fail")); return false; });
    }).then(function (r) { busy = false; renderShop(); return r; }, function () { busy = false; renderShop(); return false; });
  }

  /* ---- Вызовы хозяина ---- */
  function noteFullscreen() { st.ads++; persist(); }
  /* Показать карточку на спокойном экране (меню, результат). Возвращает true, если карточка открыта. */
  function maybeCard() {
    if (!available() || ui.ov) return false;
    if (active()) {
      if (daysLeft() <= config.remindDays && st.remindDay !== dayIdx()) { st.remindDay = dayIdx(); persist(); openCard("soon"); return true; }
      return false;
    }
    if (st.until > 0 && st.endShown !== st.until) { st.endShown = st.until; persist(); openCard("end"); return true; }
    if (config.cardEvery > 0 && Math.floor(st.ads / config.cardEvery) > Math.floor(st.cardAt / config.cardEvery)) { st.cardAt = st.ads; persist(); openCard("ad"); return true; }
    return false;
  }

  /* ---- Интерфейс ---- */
  var CSS = ".pm-corner{position:fixed;top:calc(env(safe-area-inset-top,0px) + 10px);right:max(12px,env(safe-area-inset-right,0px));z-index:var(--pm-z,50);display:inline-flex;align-items:center;gap:5px;" +
    "min-height:40px;padding:0 12px;border-radius:20px;border:1.5px solid var(--pm-ink,var(--fg,#22304a));background:var(--pm-gold,#f2c14e);color:#2a2110;font:600 14px/1 var(--f-display,system-ui,sans-serif);letter-spacing:.02em;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.25)}" +
    ".pm-corner[hidden]{display:none}.pm-corner.on{background:var(--pm-paper,var(--paper,#f4edd9));color:var(--pm-ink,var(--fg,#22304a))}" +
    ".pm-corner:focus-visible,.pm-btn:focus-visible,.pm-x:focus-visible{outline:3px solid var(--pm-focus,var(--focus,#1d5cc0));outline-offset:2px}" +
    ".pm-ov{position:fixed;inset:0;z-index:calc(var(--pm-z,50) + 10);display:grid;place-items:center;padding:16px max(16px,env(safe-area-inset-right,0px)) 16px max(16px,env(safe-area-inset-left,0px));background:var(--pm-scrim,rgba(20,18,12,.5))}" +
    ".pm-ov[hidden]{display:none}.pm-box{position:relative;box-sizing:border-box;width:100%;max-width:420px;max-height:calc(100% - 8px);overflow-y:auto;background:var(--pm-paper,var(--paper,#f4edd9));color:var(--pm-ink,var(--fg,#22304a));" +
    "border:1.5px solid var(--pm-ink,var(--fg,#22304a));border-radius:12px;padding:18px 18px 16px;box-shadow:0 10px 34px rgba(0,0,0,.4);font:15px/1.4 var(--f-body,system-ui,sans-serif);-webkit-user-select:none;user-select:none}" +
    ".pm-box h2{margin:0 36px 8px 0;font:600 22px/1.2 var(--f-display,system-ui,sans-serif);text-wrap:balance}.pm-box p{margin:0 0 10px}.pm-sub{color:var(--pm-muted,var(--muted,#615d4f));font-size:14px}" +
    ".pm-x{position:absolute;top:8px;right:8px;width:36px;height:36px;border-radius:50%;border:1.5px solid var(--pm-ink,var(--fg,#22304a));background:transparent;color:inherit;font-size:20px;line-height:1;cursor:pointer}" +
    ".pm-perks{margin:0 0 12px;padding-left:20px}.pm-perks li{margin:0 0 4px}" +
    ".pm-prod{display:grid;grid-template-columns:1fr auto;gap:4px 12px;align-items:center;padding:10px 12px;margin:0 0 10px;border:1.5px solid var(--pm-line,var(--line,#b9ab86));border-radius:10px;background:var(--pm-paper2,var(--paper-2,#ebe1c6))}" +
    ".pm-prod b{font:600 17px/1.2 var(--f-display,system-ui,sans-serif)}.pm-prod .pm-price{font:600 17px/1 var(--f-display,system-ui,sans-serif);font-variant-numeric:tabular-nums;white-space:nowrap}" +
    ".pm-prod .pm-sub{grid-column:1 / -1}.pm-btn{box-sizing:border-box;min-height:44px;padding:0 16px;border-radius:8px;border:1.5px solid var(--pm-ink,var(--fg,#22304a));background:transparent;color:inherit;font:600 16px/1 var(--f-display,system-ui,sans-serif);cursor:pointer}" +
    ".pm-btn.main{background:var(--pm-red,var(--red,#b3352b));border-color:var(--pm-red,var(--red,#b3352b));color:var(--pm-redink,var(--red-ink,#fff7ea))}.pm-btn:disabled{opacity:.55;cursor:default}" +
    ".pm-prod .pm-btn{grid-column:1 / -1;width:100%}.pm-row{display:flex;gap:10px;flex-wrap:wrap}.pm-row .pm-btn{flex:1 1 140px}" +
    ".pm-status{min-height:20px;margin:6px 0 0;font-size:14px;font-style:italic}@media (prefers-reduced-motion:no-preference){.pm-box{animation:pmIn .2s ease-out}}@keyframes pmIn{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}";

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function ensureUi() {
    if (ui.style) return;
    ui.style = el("style"); ui.style.textContent = CSS; document.head.appendChild(ui.style);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && ui.ov) closeOv(); });
  }
  function renderCorner() {
    if (!config.corner || typeof document === "undefined") return;
    var show = ready && (canBuy || active());
    try { document.documentElement.classList.toggle("pm-on", !!show); } catch (e) {}
    if (!show) { if (ui.corner) ui.corner.hidden = true; return; }
    ensureUi();
    if (!ui.corner) {
      ui.corner = el("button", "pm-corner"); ui.corner.type = "button"; ui.corner.id = "pmCorner";
      ui.corner.addEventListener("click", function () { openShop(); });
      document.body.appendChild(ui.corner);
    }
    var on = active();
    ui.corner.hidden = false;
    ui.corner.classList.toggle("on", on);
    // звезда и подпись отдельными элементами: хозяин может скрыть подпись на тесном экране (.pm-lbl), кнопка остаётся звездой
    ui.corner.textContent = "";
    ui.corner.appendChild(el("span", "pm-st", "★"));
    ui.corner.appendChild(el("span", "pm-lbl", on ? fmt(tx("btnOn"), daysLeft()) : tx("btn")));
    ui.corner.setAttribute("aria-label", on ? fmt(tx("activeUntil"), dateStr(st.until), plural(daysLeft())) : tx("btn"));
  }
  function setStatus(s) { ui.status = s || ""; var n = ui.box && ui.box.querySelector(".pm-status"); if (n) n.textContent = ui.status; }
  function mountOv() {
    ensureUi(); closeOv(true);
    ui.lastFocus = document.activeElement;
    ui.ov = el("div", "pm-ov"); ui.ov.setAttribute("role", "dialog"); ui.ov.setAttribute("aria-modal", "true");
    ui.box = el("div", "pm-box"); ui.ov.appendChild(ui.box);
    ui.ov.addEventListener("click", function (e) { if (e.target === ui.ov) closeOv(); });
    document.body.appendChild(ui.ov);
  }
  function closeOv(quiet) {
    if (ui.ov && ui.ov.parentNode) ui.ov.parentNode.removeChild(ui.ov);
    ui.ov = null; ui.box = null; ui.mode = ""; ui.status = "";
    if (!quiet && ui.lastFocus && ui.lastFocus.focus) { try { ui.lastFocus.focus({ preventScroll: true }); } catch (e) {} }
  }
  function xBtn() { var b = el("button", "pm-x", "×"); b.type = "button"; b.setAttribute("aria-label", tx("close")); b.addEventListener("click", function () { closeOv(); }); return b; }
  function productCard(id) {
    var days = config.products[id].days, c = el("div", "pm-prod");
    var base = Math.max(now(), st.until);
    c.appendChild(el("b", "", id === "premium_365" ? tx("p365") : tx("p30")));
    c.appendChild(el("span", "pm-price", priceOf(id) || ""));
    c.appendChild(el("span", "pm-sub", fmt(tx("validTo"), dateStr(base + days * DAY))));
    var b = el("button", "pm-btn main", active() ? tx("extend") : tx("buy")); b.type = "button"; b.disabled = busy; b.setAttribute("data-pm-buy", id);
    b.addEventListener("click", function () { buy(id); });
    c.appendChild(b);
    return c;
  }
  function renderShop() {
    if (!ui.box || ui.mode !== "shop") return;
    var b = ui.box; b.textContent = "";
    b.appendChild(xBtn());
    var h = el("h2", "", tx("title")); h.id = "pmTitle"; b.appendChild(h);
    ui.ov.setAttribute("aria-labelledby", "pmTitle");
    b.appendChild(el("p", "", active() ? fmt(tx("activeUntil"), dateStr(st.until), plural(daysLeft())) : tx("notActive")));
    var ul = el("ul", "pm-perks"); texts.perks.forEach(function (s) { ul.appendChild(el("li", "", s)); }); b.appendChild(ul);
    config.order.forEach(function (id) { if (catalog[id]) b.appendChild(productCard(id)); });
    b.appendChild(el("p", "pm-sub", tx("note")));
    var s = el("p", "pm-status", ui.status); s.setAttribute("role", "status"); s.setAttribute("aria-live", "polite"); b.appendChild(s);
  }
  function openShop() {
    if (!ready || (!canBuy && !active())) return;
    mountOv(); ui.mode = "shop"; renderShop();
    var f = ui.box.querySelector(".pm-prod .pm-btn") || ui.box.querySelector(".pm-x"); if (f) try { f.focus({ preventScroll: true }); } catch (e) {}
  }
  function openCard(kind) {
    mountOv(); ui.mode = "card:" + kind;
    var b = ui.box, p30 = priceOf("premium_30");
    var title = kind === "ad" ? tx("adTitle") : kind === "soon" ? tx("soonTitle") : tx("endTitle");
    var text = kind === "ad" ? fmt(tx("adText"), p30 || ("99 " + tx("free"))) : kind === "soon" ? fmt(tx("soonText"), plural(daysLeft())) : tx("endText");
    b.appendChild(xBtn());
    var h = el("h2", "", title); h.id = "pmTitle"; b.appendChild(h); ui.ov.setAttribute("aria-labelledby", "pmTitle");
    b.appendChild(el("p", "", text));
    var row = el("div", "pm-row");
    var go = el("button", "pm-btn main", kind === "ad" ? tx("adMore") : (kind === "soon" ? tx("extend") : tx("endBuy"))); go.type = "button";
    go.addEventListener("click", function () { openShop(); });
    var no = el("button", "pm-btn", tx("later")); no.type = "button"; no.addEventListener("click", function () { closeOv(); });
    row.appendChild(go); row.appendChild(no); b.appendChild(row);
    try { no.focus({ preventScroll: true }); } catch (e) {}
  }

  /* ---- Запуск ---- */
  function setLang(l) {
    lang = l === "en" ? "en" : "ru"; texts = Object.assign({}, TEXTS.ru, TEXTS[lang] || {});
    renderCorner(); if (ui.ov) { if (ui.mode === "shop") renderShop(); else { var m = ui.mode.split(":")[1]; openCard(m); } }
  }
  function tick() {
    var a = active();
    if (a !== lastActive) emit(); else renderCorner();
  }
  function init(o) {
    o = o || {};
    if (o.config) Object.keys(o.config).forEach(function (k) { config[k] = o.config[k]; });
    if (o.texts) Object.keys(o.texts).forEach(function (l) { TEXTS[l] = Object.assign(TEXTS[l] || {}, o.texts[l]); });
    sdk = o.sdk || null; store = o.store || null;
    setLang(o.lang || lang);
    loadState();
    ready = true; lastActive = active();
    try { document.addEventListener("visibilitychange", function () { if (!document.hidden) tick(); }); } catch (e) {}
    clearInterval(pollTimer); pollTimer = setInterval(tick, config.pollMs);
    renderCorner();
    if (!sdk || typeof sdk.getPayments !== "function") return Promise.resolve(false);
    return sdk.getPayments({ signed: false }).then(function (pay) {
      payments = pay;
      return pay.getCatalog();
    }).then(function (list) {
      list = Array.isArray(list) ? list : [];
      list.forEach(function (c) { if (c && config.products[c.id]) catalog[c.id] = c; });
      canBuy = !!(store && store.save && config.order.some(function (id) { return catalog[id]; }));
      renderCorner();
      return canBuy ? checkPurchases().then(function () { return true; }) : false;
    }).catch(function () { canBuy = false; renderCorner(); return false; });
  }

  return {
    config: config,
    init: init, setLang: setLang,
    active: active, until: function () { return st.until; }, daysLeft: daysLeft, available: available,
    noteFullscreen: noteFullscreen, maybeCard: maybeCard, openShop: openShop,
    onChange: function (f) { if (typeof f === "function") listeners.push(f); },
    mergeState: mergeState,
    refresh: function () { return canBuy ? checkPurchases() : Promise.resolve(); },
    _state: function () { return JSON.parse(JSON.stringify(st)); }
  };
})();
