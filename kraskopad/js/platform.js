/* Краскопад · слой платформы (образец — kugosvetka/src/data/platform.js).
   Яндекс Игры SDK, если страница запущена на площадке: LoadingAPI.ready, GameplayAPI (только во время матча), пауза,
   полноэкранная реклама (между матчами, не чаще раза в 5 мин), ролик за награду, облачное сохранение с по-ключевым слиянием.
   Без SDK (сайт, локально) все вызовы — заглушки. Ключи игры: "kp.*" (синхронизируются), "kp.set" — настройки только этого устройства. */
window.PF = (function () {
  "use strict";
  var ysdk = null, player = null;
  var sdkOk = false, cloudOk = false, gaveUp = false;
  var wantReady = false, readyDone = false;
  var adBusy = false, tabHidden = false, apiPaused = false;
  var gpOn = false, wantGp = false;
  var lastAdAt = 0, bornAt = Date.now();
  var AD_FIRST_MS = 120000;   // первая реклама не раньше 2 минут после загрузки; дальше интервал берём из Premium.config.adGapMs (5 минут)
  function adGap() { return (window.Premium && window.Premium.config && window.Premium.config.adGapMs) || 300000; }
  function premiumOn() { try { return !!(window.Premium && window.Premium.active()); } catch (e) { return false; } }
  var INIT_TIMEOUT_MS = 4000, SYNC_DELAY_MS = 2500, DAILY_KEEP = 30;
  var T_KEY = "kp.syncT";
  var mem = {}, dirty = false, syncTimer = 0, lang = "ru";
  var self = { onPause: function () {} };

  /* ---- Хранилище ---- */
  var KT_KEY = "kp.keyT", kt = {}, lsOk = false;   // время изменения каждого ключа (мс); удалённый ключ: время есть, значения нет
  function isSynced(k) { return k !== T_KEY && k !== KT_KEY && (k.indexOf("kp.") === 0 && k !== "kp.set"); }
  function log() { try { console.info.apply(console, ["[kraskopad-save]"].concat([].slice.call(arguments))); } catch (e) {} }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* хранилище недоступно — остаётся зеркало в памяти */ } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function seedMem() {
    try { localStorage.setItem("kp.probe", "1"); lsOk = localStorage.getItem("kp.probe") === "1"; localStorage.removeItem("kp.probe"); } catch (e) { lsOk = false; }
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (isSynced(k) || k === T_KEY) mem[k] = localStorage.getItem(k); } } catch (e) {}
    try { var o = JSON.parse(localStorage.getItem(KT_KEY) || "{}"); if (o && typeof o === "object") kt = o; } catch (e) {}
  }
  function ktSave() { lsSet(KT_KEY, JSON.stringify(kt)); }
  function localT() { return Number(mem[T_KEY]) || 0; }
  function keyT(k) { return kt[k] || (Object.prototype.hasOwnProperty.call(mem, k) ? localT() : 0); }
  function schedule() { if (!syncTimer && player && cloudOk) syncTimer = setTimeout(function () { flush(false); }, SYNC_DELAY_MS); }
  function touch(k) {
    var now = Date.now(); kt[k] = now; ktSave();
    var t = String(now); mem[T_KEY] = t; lsSet(T_KEY, t);
    dirty = true; schedule();
  }
  self.get = function (k) {
    if (Object.prototype.hasOwnProperty.call(mem, k)) return mem[k];
    try { return localStorage.getItem(k); } catch (e) { return null; }
  };
  self.put = function (k, raw) { mem[k] = raw; lsSet(k, raw); if (isSynced(k)) touch(k); };
  self.del = function (k) { delete mem[k]; lsDel(k); if (isSynced(k)) touch(k); };
  self.onCloud = function () {};

  /* ---- Правила слияния по данным игры (прогресс не теряется ни у кого из двух) ---- */
  function jp(s) { try { return JSON.parse(s); } catch (e) { return undefined; } }
  function union(a, b) { var out = [], seen = {}; (a || []).concat(b || []).forEach(function (x) { var s = JSON.stringify(x); if (!seen[s]) { seen[s] = 1; out.push(x); } }); return out; }
  function mergerFor(k) {
    if (k === "kp.premium") return function (a, b) { return window.Premium && window.Premium.mergeState ? window.Premium.mergeState(a, b) : null; };
    if (k === "kp.prog") return function (a, b) {   // прогресс: опыт и статистика — максимум, выполненные задания — объединение, выбранный скин — локальный
      var x = jp(a), y = jp(b); if (!x || !y || typeof x !== "object" || typeof y !== "object") return null;
      var m = Object.assign({}, y, x);
      m.xp = Math.max(Number(x.xp) || 0, Number(y.xp) || 0); m.pp = Math.max(Number(x.pp) || 0, Number(y.pp) || 0); m.pp2 = Math.max(Number(x.pp2) || 0, Number(y.pp2) || 0);
      m.own = Object.assign({}, y.own || {}, x.own || {});
      m.tut = (x.tut || y.tut) ? 1 : 0;
      m.ach = Object.assign({}, y.ach || {}, x.ach || {});
      m.ws = {}; [y.ws || {}, x.ws || {}].forEach(function (o) { Object.keys(o).forEach(function (w) { var a = m.ws[w] || { k: 0, d: 0 }; m.ws[w] = { k: Math.max(a.k, o[w].k || 0), d: Math.max(a.d, o[w].d || 0) }; }); });
      ["dq", "wq", "sq"].forEach(function (k) {   // задания: берём более новый набор; если тот же — прогресс по максимуму
        var a = x[k], b = y[k]; if (!a || !b) { m[k] = a || b; return; }
        if (a.k !== b.k) { m[k] = a.k > b.k ? a : b; return; }
        m[k] = { k: a.k, l: a.l.map(function (q, i) { var o = b.l[i] || q; return { t: q.t, g: q.g, p: Math.max(q.p || 0, o.p || 0), d: (q.d || o.d) ? 1 : 0 }; }) };
      });
      m.st = {}; [x.st || {}, y.st || {}].forEach(function (o) { Object.keys(o).forEach(function (q) { m.st[q] = Math.max(m.st[q] || 0, Number(o[q]) || 0); }); });
      m.ch = Object.assign({}, y.ch || {}, x.ch || {});
      return JSON.stringify(m);
    };
    return null;
  }
  self.mergerFor = mergerFor;

  /* ---- Облако: слияние по ключам. У каждого ключа побеждает более позднее изменение; коллекции, прогресс и Премиум объединяются.
     Пустой ответ облака (гость, нет данных, медленный SDK) ничего не стирает. Снимок v1 без времени ключей: время ключа = _t снимка. ---- */
  function importCloud(data) {
    var d = data && typeof data === "object" ? data : {}, ct = Number(d._t) || 0;
    var blob = d.d && typeof d.d === "object" ? d.d : {}, ckt = d.kt && typeof d.kt === "object" ? d.kt : {};
    var keys = {}, took = 0, kept = 0, merged = 0, changedAny = false;
    [mem, kt, blob, ckt].forEach(function (o) { Object.keys(o).forEach(function (k) { if (isSynced(k)) keys[k] = 1; }); });
    Object.keys(keys).forEach(function (k) {
      var hasL = Object.prototype.hasOwnProperty.call(mem, k), hasC = typeof blob[k] === "string";
      var lt = keyT(k), cT = Number(ckt[k]) || (hasC ? ct : 0), lv = hasL ? mem[k] : null, cv = hasC ? blob[k] : null;
      var fn = mergerFor(k);
      if (fn && hasL && hasC && lv !== cv) {
        var m = null; try { m = fn(lv, cv); } catch (e) {}
        if (typeof m === "string") {
          if (m !== lv) { mem[k] = m; lsSet(k, m); changedAny = true; }
          if (m !== cv) dirty = true;
          kt[k] = Math.max(lt, cT); merged++; return;
        }
      }
      if (cT > lt || (cT === lt && hasC && !hasL)) {   // при равном времени лучше значение, чем пустота: удаление всегда обновляет время
        if (hasC) { if (lv !== cv) { mem[k] = cv; lsSet(k, cv); changedAny = true; } }
        else if (hasL) { delete mem[k]; lsDel(k); changedAny = true; }
        kt[k] = cT; took++;
      } else if (lt > cT || (hasL && !hasC)) { dirty = true; kept++; }
    });
    ktSave();
    if (ct > localT()) { mem[T_KEY] = String(ct); lsSet(T_KEY, String(ct)); }
    cloudOk = true;
    log("localStorage:", lsOk ? "работает" : "НЕДОСТУПЕН", "| облако:", Object.keys(blob).length ? "снимок v" + (d.v || 1) + ", ключей " + Object.keys(blob).length : "пусто", "| взято:", took, "оставлено:", kept, "объединено:", merged);
    if (dirty) schedule();
    return changedAny;
  }
  function snapshot() {
    var d = {}, t = {}, daily = [];
    Object.keys(mem).forEach(function (k) {
      if (!isSynced(k) || mem[k] == null) return;
      if (k.indexOf("daily:") === 0) daily.push(k); else d[k] = mem[k];
    });
    daily.sort().slice(-DAILY_KEEP).forEach(function (k) { d[k] = mem[k]; });
    var keep = {}; Object.keys(d).forEach(function (k) { keep[k] = 1; });
    Object.keys(kt).forEach(function (k) { if (isSynced(k) && (keep[k] || k.indexOf("daily:") !== 0)) t[k] = kt[k]; });   // метки удалений тоже уходят в облако
    return { v: 2, _t: localT(), d: d, kt: t };
  }
  function flush(now) {
    clearTimeout(syncTimer); syncTimer = 0;
    if (!dirty || !player || !cloudOk) return;
    dirty = false;
    try {
      var p = player.setData(snapshot(), !!now);
      if (p && p.catch) p.catch(function () { dirty = true; });
    } catch (e) { dirty = true; }
  }  /* Запись в облако с подтверждением: Promise<true>, когда данные сохранены. Нужна Премиуму: сначала запись, потом consumePurchase. */
  self.save = function () {
    clearTimeout(syncTimer); syncTimer = 0;
    if (!player || !cloudOk) return Promise.resolve(false);
    dirty = false;
    try {
      return Promise.resolve(player.setData(snapshot(), true)).then(function () { return true; }, function () { dirty = true; return false; });
    } catch (e) { dirty = true; return Promise.resolve(false); }
  };
  self.sdk = function () { return ysdk; };

  /* ---- Состояние паузы, звук, GameplayAPI ---- */
  self.paused = function () { return adBusy || tabHidden || apiPaused; };
  function applyGp() {
    if (!sdkOk || !readyDone) return;
    var should = wantGp && !self.paused();
    if (should === gpOn) return;
    gpOn = should;
    try { var g = ysdk.features && ysdk.features.GameplayAPI; if (g) { if (should) g.start(); else g.stop(); } } catch (e) {}
  }
  function changed() { applyGp(); try { self.onPause(self.paused()); } catch (e) {} }
  function onVis() { tabHidden = !!document.hidden; if (tabHidden) flush(true); changed(); }
  self.setPlaying = function (on) { wantGp = !!on; applyGp(); };

  /* ---- Загрузка ---- */
  function tryReady() {
    if (readyDone || !wantReady || !sdkOk) return;
    readyDone = true;
    try { var l = ysdk.features && ysdk.features.LoadingAPI; if (l) l.ready(); } catch (e) {}
    applyGp();
  }
  self.ready = function () { wantReady = true; tryReady(); };
  self.init = function () {
    seedMem();
    try { document.addEventListener("visibilitychange", onVis); window.addEventListener("pagehide", function () { flush(true); }); } catch (e) {}
    if (!window.YaGames || !window.YaGames.init) return Promise.resolve();
    return new Promise(function (resolve) {
      var timer = setTimeout(function () { gaveUp = true; resolve(); }, INIT_TIMEOUT_MS);
      function fin() { clearTimeout(timer); resolve(); }
      window.YaGames.init().then(function (sdk) {
        ysdk = sdk; sdkOk = true;
        try { lang = (sdk.environment && sdk.environment.i18n && sdk.environment.i18n.lang) || "ru"; } catch (e) {}
        try {
          sdk.on("game_api_pause", function () { apiPaused = true; changed(); });
          sdk.on("game_api_resume", function () { apiPaused = false; changed(); });
        } catch (e) {}
        tryReady();   // если игра уже просила ready, а SDK подъехал позже таймаута
        return sdk.getPlayer({ scopes: false }).then(function (p) {
          player = p;
          return p.getData();
        }).then(function (data) { var ch = importCloud(data); if (gaveUp && ch) { try { self.onCloud(); } catch (e) {} } }, function () { /* без облака: играем с localStorage */ });
      }).then(fin, fin);
    });
  };
  self.hasSdk = function () { return sdkOk; };
  self.lang = function () { return lang; };

  /* ---- Реклама ---- */
  function adBegin() { adBusy = true; changed(); }
  function adEnd() { adBusy = false; changed(); }
  /* Полноэкранная реклама в логической паузе. done вызывается ровно один раз, когда игра может продолжать (или сразу, если рекламы нет). */
  self.interstitial = function (done) {
    if (adBusy) return;
    var now = Date.now(), allowedAt = lastAdAt ? lastAdAt + adGap() : bornAt + AD_FIRST_MS;
    if (premiumOn() || !sdkOk || !ysdk.adv || !ysdk.adv.showFullscreenAdv || now < allowedAt) { done(); return; }   // при активном Премиуме рекламы нет
    var fin = false;
    function end(shown) { if (fin) return; fin = true; if (shown) { lastAdAt = Date.now(); try { if (window.Premium) window.Premium.noteFullscreen(); } catch (e) {} } adEnd(); done(); }
    adBegin();
    try {
      ysdk.adv.showFullscreenAdv({ callbacks: {
        onClose: function (wasShown) { end(wasShown); },
        onError: function () { end(false); },
        onOffline: function () { end(false); }
      } });
    } catch (e) { end(false); }
  };
  self.premium = premiumOn;
  self.canReward = function () { return !!(premiumOn() || (sdkOk && !adBusy && ysdk.adv && ysdk.adv.showRewardedVideo)); };
  /* Ролик за награду. done(got): got === true, только если игрок досмотрел и награда засчитана. У активного Премиума награда выдаётся сразу, без ролика. */
  self.rewarded = function (done) {
    if (premiumOn()) { done(true); return; }
    if (!self.canReward()) { done(false); return; }
    var fin = false, got = false;
    function end() { if (fin) return; fin = true; if (got) lastAdAt = Date.now(); adEnd(); done(got); }
    adBegin();
    try {
      ysdk.adv.showRewardedVideo({ callbacks: {
        onRewarded: function () { got = true; },
        onClose: end,
        onError: end
      } });
    } catch (e) { end(); }
  };
  return self;
})();
