/* Держи Шмыга! · интерфейс, сохранения, экономика, ежедневное. Движок — engine.js, данные — data.js. */
(function () {
  "use strict";
  var D = window.DATA, E = window.ENGINE, PF = window.PF;
  var $ = function (s) { return document.querySelector(s); };
  var lang = "ru";
  function t(k) { var s = (I18N[lang] && I18N[lang][k]) || (lang !== "ru" && I18N.en[k]) || I18N.ru[k] || k; for (var i = 1; i < arguments.length; i++) s = s.split("{" + (i - 1) + "}").join(arguments[i]); return s; }
  /* названия: в данных ru/en; для других языков — словарь I18N_NAMES[lang] по ключу o._key (world.town, skin.ninja…) */
  function nm(o) { return o.name[lang] || (window.I18N_NAMES && I18N_NAMES[lang] && o._key && I18N_NAMES[lang][o._key]) || o.name.en || o.name.ru; }
  (function nameKeys() {
    D.WORLDS.forEach(function (w) { w._key = "world." + w.id; w.buildings.forEach(function (b) { b._key = "bld." + w.id + "." + b.id; }); });
    D.SKINS.forEach(function (x) { x._key = "skin." + x.id; }); D.HEROES.forEach(function (x) { x._key = "hero." + x.id; });
    D.SEASONS.list.forEach(function (x) { x._key = "season." + x.id; }); D.ACHIEVEMENTS.forEach(function (x) { x._key = "ach." + x.id; });
    if (window.PETS) PETS.LIST.forEach(function (x) { x._key = "pet." + x.id; });
  })();
  /* слово дня из букв на трассе: в словаре (goldWord), длина любая */
  function goldWord() { return (t("goldWord") !== "goldWord" ? t("goldWord") : D.LETTERS.en).toUpperCase(); }
  function tokName(d) { return d.token[lang] || (window.I18N_NAMES && I18N_NAMES[lang] && I18N_NAMES[lang]["token." + d.id]) || d.token.en; }
  var LANGS = ["ru", "en"].concat(Object.keys(I18N).filter(function (l) { return l !== "ru" && l !== "en"; }));
  function cap(x) { return x.charAt(0).toUpperCase() + x.slice(1); }
  /* множественное число: ru — 1 слиток, 2 слитка, 5 слитков; en — 1 bar, 2 bars */
  var PL = { ru: { coin: ["монета", "монеты", "монет"], bar: ["слиток", "слитка", "слитков"], key: ["ключ", "ключа", "ключей"], time: ["раз", "раза", "раз"] },
    en: { coin: ["coin", "coins"], bar: ["gold bar", "gold bars"], key: ["key", "keys"], time: ["time", "times"] } };
  function pl(n, w) {
    var f = t("pl_" + w).split("|"); n = Math.abs(Math.floor(n));
    if (f.length === 1) return f[0];
    if (f.length === 2) return n === 1 ? f[0] : f[1];
    var m10 = n % 10, m100 = n % 100;
    return m10 === 1 && m100 !== 11 ? f[0] : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? f[1] : f[2];
  }
  function fmt(n) { return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ================= Картинки Художника (game/art/manifest.json; нет картинки — вариант кодом) ================= */
  var ART = {};
  function art(name) { return ART[name] || null; }
  function loadArt() {
    try { return fetch("art/manifest.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (m) { ART = m || {}; }, function () { ART = {}; }); }
    catch (e) { return Promise.resolve(); }
  }
  function boostIcon(k) { return art("boost-" + k) || E.iconURL(k); }

  /* ================= Сохранения ================= */
  var S = {};
  function jp(s, d) { try { var v = JSON.parse(s); return v && typeof v === "object" ? v : d; } catch (e) { return d; } }
  function load() {
    S.wallet = jp(PF.get("sg.wallet"), { coins: 0, bars: 0, keys: 1 });
    S.prog = jp(PF.get("sg.prog"), {});
    S.prog.skins = S.prog.skins || ["courier"]; S.prog.worlds = S.prog.worlds || ["town"]; S.prog.claimed = S.prog.claimed || [];
    S.prog.heroes = S.prog.heroes || ["mika"];
    S.prog.st = S.prog.st || {}; S.prog.up = S.prog.up || {}; S.prog.builds = S.prog.builds || {}; S.prog.pets = S.prog.pets || {};
    S.daily = jp(PF.get("sg.daily"), {});
    S.week = jp(PF.get("sg.week"), {});
    S.season = jp(PF.get("sg.season"), {});
    S.sel = jp(PF.get("sg.sel"), { skin: "courier", world: "town" });
    if (S.sel.pet && !S.prog.pets[S.sel.pet]) S.sel.pet = "";
    S.sel.hero = S.prog.heroes.indexOf(S.sel.hero) >= 0 ? S.sel.hero : "mika"; S.sel.skins = S.sel.skins || {};
    if (skinById(S.sel.skin).hero !== S.sel.hero) S.sel.skin = S.sel.skins[S.sel.hero] || heroById(S.sel.hero).base;
    S.set = jp(PF.get("sg.set"), { snd: 2, lang: "" }); if (S.set.snd == null) S.set.snd = S.set.sound === 0 ? 0 : 2;
    if (S.prog.skins.indexOf(S.sel.skin) < 0 || !D.SKINS.some(function (x) { return x.id === S.sel.skin; })) S.sel.skin = "courier";
    if (!worldOpen(S.sel.world) || !worldById(S.sel.world).ready) S.sel.world = "town";
  }
  function save(k) { PF.put("sg." + k, JSON.stringify(S[k])); }
  function saveAll() { ["wallet", "prog", "daily", "week", "season", "sel", "set"].forEach(save); }
  function st(k) { return Number(S.prog.st[k]) || 0; }
  function addStat(k, v) { S.prog.st[k] = st(k) + v; }

  /* ================= Время, сутки ================= */
  function dayNum() { var d = new Date(PF.now()); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }
  function ensureDay() {
    var today = dayNum(), ch = false;
    if (st("lastDay") < today) { S.prog.st.lastDay = today; addStat("days", 1); ch = true; save("prog"); }
    if (S.daily.day !== today) {
      var lvl = Math.min(2, Math.floor(st("runs") / 15)), pool = D.TASKS.slice(), tasks = [];
      while (tasks.length < 3) { var i = Math.floor(Math.random() * pool.length), x = pool.splice(i, 1)[0]; tasks.push({ id: x.id, goal: x.goal[lvl], reward: x.reward * (1 + lvl * 0.5), prog: 0, claimed: false }); }
      S.daily = { day: today, tasks: tasks, chest: false, wordN: 0, wordChest: false };
      save("daily"); ch = true;
    }
    var wk = Math.floor((today + 3) / 7);   // неделя с понедельника
    if (S.week.wk !== wk) { S.week = { wk: wk, prog: {}, claimed: {}, worlds: [], chest: false }; save("week"); ch = true; }
    return ch;
  }
  /* ---------- сезонное событие ---------- */
  function seasonNow() {
    var Z = D.SEASONS, k = Math.floor((dayNum() - Z.epoch) / Z.days), idx = ((k % Z.list.length) + Z.list.length) % Z.list.length;
    var left = Z.days - (((dayNum() - Z.epoch) % Z.days) + Z.days) % Z.days;
    if (S.season.k !== k) { S.season = { k: k, id: Z.list[idx].id, n: 0, got: [] }; save("season"); }
    return { def: Z.list[idx], left: left, k: k };
  }
  /* когда событие с образом: «идёт сейчас» или «через N дн.» — вечных замков нет, события идут по кругу */
  function seasonWhen(id) {
    var Z = D.SEASONS, now = seasonNow(), idx = Z.list.map(function (x) { return x.id; }).indexOf(id), cur = Z.list.indexOf(now.def);
    if (idx === cur) return t("seasonNowOn");
    var steps = (idx - cur + Z.list.length) % Z.list.length;
    return t("seasonIn", now.left + (steps - 1) * Z.days);
  }
  function weekAdd(id, v) { if (!S.week || !S.week.prog) return; S.week.prog[id] = (S.week.prog[id] || 0) + v; save("week"); }
  function weekDaysLeft() { return 7 - ((dayNum() + 3) % 7); }
  function isWeekend() { var d = new Date(PF.now()).getDay(); return d === 0 || d === 6; }

  /* ================= Экономика ================= */
  function worldById(id) { return D.WORLDS.filter(function (w) { return w.id === id; })[0]; }
  function worldIdx(id) { for (var i = 0; i < D.WORLDS.length; i++) if (D.WORLDS[i].id === id) return i; return -1; }
  function builds(id) { return S.prog.builds[id] || [0, 0, 0, 0, 0]; }
  function buildCount(id) { return builds(id).reduce(function (s, v) { return s + v; }, 0); }
  function buildTotal() { return D.WORLDS.reduce(function (s, w) { return s + buildCount(w.id); }, 0); }
  function worldOpen(id) {
    if (S.prog.worlds.indexOf(id) >= 0) return true;
    var i = worldIdx(id); if (i <= 0) return i === 0;
    var prev = D.WORLDS[i - 1]; return worldOpen(prev.id) && buildCount(prev.id) >= D.WORLDS[i].unlock.builds;
  }
  function coinMul() { return 1 + Math.min(D.BUILD_BONUS_MAX, buildTotal() * D.BUILD_BONUS); }
  function heroById(id) { return D.HEROES.filter(function (h) { return h.id === id; })[0] || D.HEROES[0]; }
  function heroOpen(id) { return S.prog.heroes.indexOf(id) >= 0; }
  function setHero(id) {
    S.sel.skins[S.sel.hero] = S.sel.skin; S.sel.hero = id;
    var sk = S.sel.skins[id] || heroById(id).base; if (!owns(sk)) { giveSkin(heroById(id).base); sk = heroById(id).base; }
    S.sel.skin = sk; save("sel"); E.setSkin(skinById(sk)); refreshTop();
  }
  /* бонус героя + бонус образа (складываются) */
  function runPerk() { var a = Object.assign({}, heroById(S.sel.hero).perk), b = skinById(S.sel.skin).perk || {}; Object.keys(b).forEach(function (k) { a[k] = (typeof b[k] === "number" ? (a[k] || 0) + b[k] : b[k]); }); return a; }
  function skinById(id) { return D.SKINS.filter(function (s) { return s.id === id; })[0] || D.SKINS[0]; }
  function owns(id) { return S.prog.skins.indexOf(id) >= 0; }
  function giveSkin(id) { if (!owns(id)) { S.prog.skins.push(id); save("prog"); return true; } return false; }
  /* можно ли забрать бесплатный костюм прямо сейчас */
  function skinReady(s) {
    var g = s.get;
    if (g.t === "task") return statFor(g.stat) >= g.n;
    if (g.t === "world") return buildCount(g.w) >= 15;
    if (g.t === "days") return st("days") >= g.n;
    if (g.t === "ads") return st("ads") >= g.n;
    if (g.t === "boss") return S.prog.claimed.indexOf("boss:" + g.w) >= 0;
    return false;
  }
  function statFor(k) { return k === "builds" ? buildTotal() : st(k); }
  function addReward(r) {
    if (r.coins) S.wallet.coins += r.coins; if (r.bars) S.wallet.bars += r.bars; if (r.keys) S.wallet.keys += r.keys;
    save("wallet");
  }
  function rewardText(r) {
    var a = []; if (r.coins) a.push(fmt(r.coins) + " " + pl(r.coins, "coin")); if (r.bars) a.push(r.bars + " " + pl(r.bars, "bar")); if (r.keys) a.push(r.keys + " " + pl(r.keys, "key")); return a.join(", ");
  }
  function rollChest(kind) {
    var c = D.CHESTS[kind], r = { coins: Math.round((c.coins[0] + Math.random() * (c.coins[1] - c.coins[0])) / 10) * 10 };
    if (Math.random() < c.key) r.keys = 1;
    if (Math.random() < c.bar) r.bars = c.bars[0] + Math.floor(Math.random() * (c.bars[1] - c.bars[0] + 1));
    return r;
  }
  function chestPic(kind) { var a = art("chest-" + kind); return a ? '<img class="chest-img" alt="" src="' + a + '">' : '<div class="chest-anim ' + kind + '"></div>'; }
  function openChest(kind) { var r = rollChest(kind); addReward(r); AUDIO.sfx("chest"); weekAdd("wchests", 1); modal(kind === "big" ? t("bigChest") : t("smallChest"), chestPic(kind) + '<p class="big">' + t("chestGot") + "<br><b>" + rewardText(r) + "</b></p>"); }

  /* ================= Реклама и Премиум ================= */
  function prem() { return PF.premium(); }
  /* Подарок Премиума (раз в сутки, пока Премиум активен): ≈ 2–3 ролика — 1 000 монет, слиток и ключ */
  var PREM_GIFT = { coins: 1000, bars: 1, keys: 1 };
  function premGift() { addReward(PREM_GIFT); toast(t("premGiftGot", rewardText(PREM_GIFT))); vib([30, 30, 60]); AUDIO.sfx("chest"); refreshTop(); if (panelId) renderPanel(); }
  function t2(l, k) { return (I18N[l] && I18N[l][k]) || I18N.ru[k]; }
  /* Сборка Google Play (publish/gplay): gp-adapter.js задаёт window.GP. Нет рекламы — кнопки роликов скрыты, нет покупок — платные образы скрыты.
     В сборке Яндекса window.GP нет, всё как раньше. */
  function adsOn() { return !(window.GP && !GP.ads.available()); }
  function shopOn() { return !(window.GP && !GP.purchase.available()); }
  function vib(p) { if (S.set && S.set.vib === 0) return; try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  function rewarded(cb) {
    if (!PF.canReward()) { toast(PF.hasSdk() ? t("adFail") : t("adFailLocal")); return; }
    PF.rewarded(function (ok) { if (ok) { addStat("ads", 1); save("prog"); } else toast(t("adFail")); cb(ok); });
  }

  /* ================= Экраны ================= */
  var screen = "menu";
  function show(id) {
    ["menu", "hud", "crash", "results", "pause"].forEach(function (s) { var e = $("#" + s); if (e) e.hidden = s !== id; });
    screen = id;
    document.documentElement.classList.toggle("running", id === "hud" || id === "crash" || id === "pause");
  }
  /* плавный счёт и «прыжок» значка при изменении */
  function countTo(e, v) {
    var cur = Number(e.dataset.v || 0); if (cur === v && e.textContent) return;
    e.dataset.v = v; var chip = e.parentNode; chip.classList.remove("bump"); void chip.offsetWidth; if (e.textContent) chip.classList.add("bump");
    var from = cur, t0 = performance.now(), d = Math.abs(v - from) > 5 && e.textContent ? 600 : 0;
    (function tick() { var k = d ? Math.min(1, (performance.now() - t0) / d) : 1; e.textContent = fmt(from + (v - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); })();
  }
  function refreshTop() {
    countTo($("#wCoins"), S.wallet.coins); countTo($("#wBars"), S.wallet.bars); countTo($("#wKeys"), S.wallet.keys);
    $("#worldName").textContent = nm(worldById(S.sel.world));
    var hc = $("#heroName"); if (hc) hc.textContent = nm(heroById(S.sel.hero));
    var ev = $("#eventChip"); if (ev) { ev.hidden = !isWeekend(); ev.textContent = t("weekendEvent"); }
    var sn = seasonNow(), sc = $("#seasonChip"); if (sc) { sc.innerHTML = "<b>" + esc(nm(sn.def)) + "</b> · " + esc(cap(tokName(sn.def))) + ": " + fmt(S.season.n || 0) + " · " + t("seasonLeftShort", sn.left); sc.style.setProperty("--sc", hex(sn.def.color)); sc.classList.toggle("dot", D.SEASONS.tiers.some(function (need, i) { return (S.season.n || 0) >= need && !(S.season.got || []).some(function (g) { return g === i; }); })); }
    E.setSeason(sn.def);
    var badge = {
      tasks: S.daily.tasks && S.daily.tasks.some(function (x) { return x.prog >= x.goal && !x.claimed; }) || (allTasksDone() && !S.daily.chest) || (S.daily.wordN >= goldWord().length && !S.daily.wordChest) || D.WEEKLY.some(function (w) { return S.week.prog && (S.week.prog[w.id] || 0) >= w.goal && !(S.week.claimed && S.week.claimed[w.id]); }),
      profile: D.ACHIEVEMENTS.some(function (a) { return !achDone(a) && achVal(a) >= a.n; }),
      chests: (window.Premium && Premium.giftAvailable && Premium.giftAvailable()) || !S.daily.wheel || !S.daily.shell || st("calLast") < dayNum() || PF.now() >= st("chestAt") + D.FREE_CHEST_MS && (PF.canReward() || !adsOn()),
      skins: D.SKINS.some(function (s) { return !owns(s.id) && (skinReady(s) || (s.get.t === "coins" && S.wallet.coins >= s.get.n)); }),
      world: D.WORLDS.some(function (w, i) { return w.ready && worldOpen(w.id) && builds(w.id).some(function (lv, b) { return lv < 3 && S.wallet.bars >= buildCost(b, lv, w.id); }); }),
      heroes: D.HEROES.some(function (h) { return !heroOpen(h.id) && heroCan(h); }),
      pets: PETS.LIST.some(function (p) { var l = S.prog.pets[p.id] || 0; return l ? l < 5 && S.wallet.coins >= PETS.UPGRADE[l] : (p.get.t === "coins" ? S.wallet.coins >= p.get.n : petReady(p)); }),
      workshop: D.BOOST_ORDER.some(function (k) { var lv = S.prog.up[k] || 0; return lv < 5 && S.wallet.coins >= D.UPGRADE_COST[lv]; })
    };
    renderStart();
    $("#recBtn").classList.toggle("dot", !!badge.profile); var hb = $("#heroChip"); if (hb) hb.classList.toggle("dot", !!badge.heroes);
    Object.keys(badge).forEach(function (k) { var b = $("#mb-" + k); if (b) b.classList.toggle("dot", !!badge[k]); });
  }
  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-t]").forEach(function (e) { e.textContent = t(e.getAttribute("data-t")); });
    $("#hint").textContent = matchMedia("(pointer:coarse)").matches ? t("hintSwipe") : t("hintKeys");
    $("#langBtn .lbl").textContent = lang.toUpperCase();
    document.title = t("title");
    try { if (window.Premium) Premium.setLang(lang === "ru" ? "ru" : "en"); } catch (e) {}
    refreshTop();
  }

  /* ---------- Панели (лист снизу на телефоне, справа на ПК) ---------- */
  var panelId = "", previewSkin = null;
  function openPanel(id) {
    if (panelId === "world" && id !== "world") E.hidePlaza();
    panelId = id; var p = $("#panel"); p.hidden = false; p.classList.toggle("short", id === "world" || id === "skins"); E.setTurntable(id === "skins"); E.setMenuLift(innerWidth / innerHeight < 1 ? 1 : 0); $("#menu").classList.add("dim");
    renderPanel(); p.querySelector(".pbody").scrollTop = 0;
  }
  function closePanel() {
    $("#panel").hidden = true; panelId = ""; $("#menu").classList.remove("dim"); E.setMenuLift(0); E.hidePlaza(); E.setTurntable(false);
    if (previewSkin) { previewSkin = null; E.setSkin(skinById(S.sel.skin)); }
    E.setWorld(S.sel.world); refreshTop();
    try { if (window.Premium) Premium.maybeCard(); } catch (e) {}
  }
  function renderPanel() {
    var body = $("#panel .pbody"); body.innerHTML = "";
    var titles = { story: "storyTitle", heroes: "heroesTitle", profile: "profileTitle", season: "seasonTitle", pets: "petsTitle", skins: "skins", world: "worldTitle", tasks: "tasksTitle", workshop: "workshopTitle", chests: "chestsTitle", records: "recordsTitle" };
    $("#panel .ptitle").textContent = t(titles[panelId]);
    ({ story: panelStory, heroes: panelHeroes, profile: panelProfile, season: panelSeason, pets: panelPets, skins: panelSkins, world: panelWorld, tasks: panelTasks, workshop: panelWorkshop, chests: panelChests, records: panelRecords })[panelId](body);
    refreshTop();
  }
  function btn(text, cls, fn, disabled) { var b = el("button", "btn " + (cls || ""), text); b.disabled = !!disabled; b.onclick = function (e) { e.stopPropagation(); E.unlockAudio(); if (!b.disabled) AUDIO.sfx("click"); fn(); }; return b; }
  function hex(n) { return "#" + ("00000" + n.toString(16)).slice(-6); }

  /* ---------- Костюмы ---------- */
  function skinThumb(s) {
    var c = s.c;
    return '<div class="thumb" style="--cap:' + hex(c.cap) + ";--top:" + hex(c.top) + ";--pants:" + hex(c.pants) + ";--shoe:" + hex(c.shoe) + ";--trail:" + hex(s.trail) + '">' +
      '<i class="t-hat"></i><i class="t-head"></i><i class="t-top"></i><i class="t-legs"></i><i class="t-shoes"></i></div>';
  }
  function skinCond(s) {
    var g = s.get;
    if (g.t === "start" || g.t === "hero") return t("getStart");
    if (g.t === "coins") return t("getCoins", fmt(g.n));
    if (g.t === "task") return t("getTask", t("stat" + g.stat.charAt(0).toUpperCase() + g.stat.slice(1), fmt(g.n), fmt(statFor(g.stat))));
    if (g.t === "world") return t("getWorld", nm(worldById(g.w)));
    if (g.t === "days") return t("getDays", g.n, Math.min(g.n, st("days")));
    if (g.t === "ads") return t("getAds", g.n, Math.min(g.n, st("ads")));
    if (g.t === "buy") return t("getBuy");
    if (g.t === "boss") return t("getBoss", nm(worldById(g.w)));
    if (g.t === "season") { var sd = D.SEASONS.list.filter(function (x) { return x.id === g.s; })[0]; return t("getSeason", nm(sd)) + " · " + seasonWhen(g.s); }
    return "";
  }
  function perkText(p) {
    var k = Object.keys(p)[0], v = p[k];
    return t("perk_" + k, k === "coins" || k === "bars" || k === "chase" || k === "build" ? Math.round(v * 100) : v);
  }
  var SKIN_GROUPS = [["coins", ["start", "coins"]], ["tasks", ["task", "boss"]], ["gifts", ["world", "days", "season"]], ["videos", ["ads"]], ["special", ["buy"]]];
  function panelSkins(body) {
    THUMBS.onOne = function (id, url) { if (art("hero-" + id)) return; var im = document.querySelector('#panel img[data-th="' + id + '"]'); if (im) { im.src = url; im.classList.add("ok"); } };
    THUMBS.renderAll(D.SKINS.filter(function (x) { return x.hero === S.sel.hero; }));
    var ht = el("div", "tabs");
    D.HEROES.forEach(function (h) { var b = el("button", "tab" + (h.id === S.sel.hero ? " on" : "") + (heroOpen(h.id) ? "" : " locked"), (heroOpen(h.id) ? "" : "🔒 ") + esc(nm(h))); b.onclick = function () { if (heroOpen(h.id)) { setHero(h.id); renderPanel(); } else openPanel("heroes"); }; ht.appendChild(b); });
    body.appendChild(ht);
    SKIN_GROUPS.forEach(function (gr) {
      var grid = el("div", "grid"), h3 = el("h3", "sec", t("sg_" + gr[0])); body.appendChild(h3);
      var list = D.SKINS.filter(function (s) { return s.hero === S.sel.hero && (shopOn() || s.get.t !== "buy") && gr[1].indexOf(s.get.t === "hero" ? "start" : s.get.t) >= 0; });
      if (!list.length) { body.removeChild(h3); return; } list.forEach(function (s) { skinCard(s, grid); });
      body.appendChild(grid);
    });
    if (!shopOn()) return;
    var pack = el("div", "card wide paid");
    pack.innerHTML = '<div class="nm">' + t("packAll") + '</div><div class="cond">' + t("packNote") + "</div>";
    var allOwned = D.PRODUCTS.pack_all.skins.every(owns);
    pack.appendChild(allOwned ? btn(t("owned"), "ghost", function () {}, true) : SKINSHOP.available("pack_all") ? btn(t("buyFor", SKINSHOP.price("pack_all")), "buy", function () { buySkin("pack_all"); }) : btn(t("onlyYandex"), "ghost small", function () {}, true));
    body.appendChild(pack);
  }
  function skinCard(s, grid) {
    {
      var own = owns(s.id), card = el("div", "card skin" + (S.sel.skin === s.id ? " on" : "") + (s.get.t === "buy" ? " paid" : "") + (previewSkin === s.id ? " pv" : ""));
      var ha = art("hero-" + s.id), th = ha || THUMBS.get(s.id); card.innerHTML = '<div class="thwrap' + (ha ? " artw" : "") + '">' + (th ? '<img class="th3d ok" alt="" data-th="' + s.id + '" src="' + th + '">' : '<img class="th3d" alt="" data-th="' + s.id + '">' + skinThumb(s)) + (owns(s.id) ? '' : '<i class="lock"></i>') + '</div><div class="nm">' + esc(nm(s)) + '</div><div class="cond">' + esc(own ? t("owned") : skinCond(s)) + "</div>" + (s.perk ? '<div class="perk">' + esc(perkText(s.perk)) + "</div>" : s.get.t === "buy" ? '<div class="perk look">' + t("lookOnly") + "</div>" : "");
      card.onclick = function () { previewSkin = s.id; E.setSkin(s); renderPanel(); };
      var b;
      if (own) b = S.sel.skin === s.id ? btn(t("equipped"), "ghost", function () {}, true) : btn(t("equip"), "ok", function () { S.sel.skin = s.id; previewSkin = null; save("sel"); E.setSkin(s); renderPanel(); });
      else if (s.get.t === "coins") b = btn("● " + fmt(s.get.n), "gold", function () {
        if (S.wallet.coins < s.get.n) { toast(t("notEnough")); return; }
        S.wallet.coins -= s.get.n; save("wallet"); giveSkin(s.id); S.sel.skin = s.id; save("sel"); E.setSkin(s); previewSkin = null; renderPanel();
      }, S.wallet.coins < s.get.n);
      else if (s.get.t === "ads" && !skinReady(s)) b = btn(t("watchAd"), "ad", function () { rewarded(function () { renderPanel(); }); });
      else if (s.get.t === "buy") {
        b = SKINSHOP.available(s.get.p) ? btn(t("buyFor", SKINSHOP.price(s.get.p)), "buy", function () { buySkin(s.get.p); }) : btn(t("onlyYandex"), "ghost small", function () {}, true);
      } else b = btn(t("claim"), "ok", function () { giveSkin(s.id); S.sel.skin = s.id; save("sel"); E.setSkin(s); previewSkin = null; toast(nm(s) + " ✓"); renderPanel(); }, !skinReady(s));
      card.appendChild(b); grid.appendChild(card);
    }
  }
  function grantProduct(id, silent) {
    var p = D.PRODUCTS[id]; if (!p) return;
    var any = false; p.skins.forEach(function (s) { any = giveSkin(s) || any; if (skinById(s).hero === "ars" && !heroOpen("ars")) { S.prog.heroes.push("ars"); save("prog"); } });
    if (any && !silent) { if (skinById(p.skins[0]).hero !== S.sel.hero) { S.sel.skins[S.sel.hero] = S.sel.skin; S.sel.hero = skinById(p.skins[0]).hero; } S.sel.skin = p.skins[0]; save("sel"); E.setSkin(skinById(S.sel.skin)); toast(nm(skinById(p.skins[0])) + " ✓"); }
    if (panelId) renderPanel(); refreshTop();
  }
  function buySkin(id) { toast(t("buying")); SKINSHOP.buy(id).then(function (ok) { if (!ok) toast(t("buyFail")); else PF.save(); }); }

  /* ---------- Достижения ---------- */
  function achVal(a) {
    if (a.stat === "builds") return buildTotal();
    if (a.stat === "worlds") return D.WORLDS.filter(function (w) { return worldOpen(w.id); }).length;
    if (a.stat === "skins") return S.prog.skins.length;
    if (a.stat === "pets") return Object.keys(S.prog.pets || {}).length;
    if (a.stat === "bosses") return S.prog.claimed.filter(function (c) { return c.indexOf("boss:") === 0; }).length;
    return st(a.stat);
  }
  function achDone(a) { return S.prog.claimed.indexOf("ach:" + a.id) >= 0; }
  function achCheck() {   // новые выполненные — тост и вибрация (награду забирают в профиле)
    var seen = S.prog.st.achSeen || 0, ready = D.ACHIEVEMENTS.filter(function (a) { return !achDone(a) && achVal(a) >= a.n; });
    if (ready.length > seen) { toast(t("achNew", nm(ready[ready.length - 1]))); vib([30, 30, 60]); AUDIO.sfx("bar"); }
    S.prog.st.achSeen = ready.length;
    return ready.length;
  }
  function panelProfile(body) {
    var sk = skinById(S.sel.skin), av = art("hero-" + sk.id) || THUMBS.get(sk.id), name = (window.__playerName || t("anon"));
    var lvl = Math.floor(Math.sqrt(st("distAll") / 400)) + 1, nextAt = Math.pow(lvl, 2) * 400, prevAt = Math.pow(lvl - 1, 2) * 400, pct = Math.min(100, (st("distAll") - prevAt) / (nextAt - prevAt) * 100);
    var head = el("div", "profhead");
    head.innerHTML = '<div class="pav">' + (av ? '<img alt="" src="' + av + '">' : "") + '</div><div class="pname"><b>' + esc(name) + '</b><span>' + t("profLevel", lvl) + '</span><div class="bar"><i style="width:' + pct + '%"></i></div><span class="muted">' + t("profNext", fmt(Math.max(0, nextAt - st("distAll")))) + "</span></div>";
    body.appendChild(head);
    var gr = el("div", "pstats");
    [["profRuns", st("runs")], ["bestAll", fmt(st("best")) + " " + t("m")], ["profDist", (st("distAll") / 1000).toFixed(1).replace(".", lang === "ru" ? "," : ".") + " " + t("km")], ["profCoins", fmt(st("coinsAll"))], ["caughtAll", st("caught")], ["profBuilds", buildTotal()], ["profBosses", achVal({ stat: "bosses" })], ["daysTotalShort", st("days")]]
      .forEach(function (x) { gr.appendChild(el("div", "pst", "<b>" + x[1] + "</b><span>" + t(x[0]) + "</span>")); });
    body.appendChild(gr);
    // настройки
    var set = el("div", "task"); set.innerHTML = '<div class="tt">' + t("settings") + "</div>";
    set.appendChild(btn(t(S.set.ghost === 0 ? "ghostOff" : "ghostOn"), "ghost small", function () { S.set.ghost = S.set.ghost === 0 ? 1 : 0; save("set"); renderPanel(); }));
    set.appendChild(btn(t(S.set.vib === 0 ? "vibOff" : "vibOn"), "ghost small", function () { S.set.vib = S.set.vib === 0 ? 1 : 0; save("set"); if (S.set.vib) vib(40); renderPanel(); }));
    var ql = S.set.q == null ? "auto" : S.set.q;
    set.appendChild(btn(t("quality") + ": " + t("q_" + ql), "ghost small", function () { var order = ["auto", 2, 1, 0], i = order.indexOf(ql); S.set.q = order[(i + 1) % 4]; save("set"); E.setQuality(S.set.q); renderPanel(); }));
    set.appendChild(btn(t(["sndOff", "sndNoMusic", "sndOn"][S.set.snd]), "ghost small", function () { $("#sndBtn").click(); renderPanel(); }));
    body.appendChild(set);
    var stb = el("div", "task"); stb.innerHTML = '<div class="tt">' + t("storyTitle") + '</div><div class="muted">' + STORY.ORDER.filter(storySeen).length + " / " + STORY.ORDER.length + "</div>";
    stb.appendChild(btn(t("storyNext"), "ok small", function () { openPanel("story"); })); body.appendChild(stb);
    // достижения
    var doneN = D.ACHIEVEMENTS.filter(achDone).length;
    body.appendChild(el("h3", "sec", t("achTitle", doneN, D.ACHIEVEMENTS.length)));
    D.ACHIEVEMENTS.slice().sort(function (a, b) { var ra = achDone(a) ? 2 : achVal(a) >= a.n ? 0 : 1, rb = achDone(b) ? 2 : achVal(b) >= b.n ? 0 : 1; return ra - rb; }).forEach(function (a) {
      var v = achVal(a), done = achDone(a), row = el("div", "ach" + (done ? " done" : v >= a.n ? " ready" : ""));
      row.innerHTML = '<i class="medal"></i><div class="ai"><b>' + esc(nm(a)) + '</b><span class="muted">' + t("ach_" + a.stat, fmt(a.n)) + " · " + t("reward", rewardText(a.r)) + '</span><div class="bar"><i style="width:' + Math.min(100, v / a.n * 100) + '%"></i></div></div>';
      if (!done && v >= a.n) row.appendChild(btn(t("claim"), "ok small", function () { S.prog.claimed.push("ach:" + a.id); addReward(a.r); save("prog"); toast(rewardText(a.r)); achCheck(); renderPanel(); }));
      body.appendChild(row);
    });
    // рекорды и лидеры
    body.appendChild(el("h3", "sec", t("recordsTitle")));
    panelRecords(body);
  }

  /* ---------- Панель события ---------- */
  function panelSeason(body) {
    var now = seasonNow(), Z = D.SEASONS, d = now.def, n = S.season.n || 0, sk = skinById(d.skin);
    var head = el("div", "seasonhead"); head.style.setProperty("--sc", hex(d.color));
    head.innerHTML = "<b>" + esc(nm(d)) + "</b><span>" + t("seasonLeft", now.left) + '</span><span class="stok">' + esc(cap(tokName(d))) + ": " + fmt(n) + "</span>";
    body.appendChild(head);
    body.appendChild(el("p", "muted", t("seasonHow", tokName(d), Z.catchTokens)));
    Z.tiers.forEach(function (need, i) {
      var r = Z.rewards[i], got = S.season.got && S.season.got.indexOf(i) >= 0, row = el("div", "task tier" + (n >= need ? " reach" : ""));
      var txt = r.skin ? t("seasonSkin", nm(sk)) : r.chest ? (r.chest === "big" ? t("bigChest") : t("smallChest")) : rewardText(r);
      row.innerHTML = '<div class="tt">' + (i + 1) + ". " + esc(txt) + '</div><div class="bar"><i style="width:' + Math.min(100, n / need * 100) + '%"></i><span>' + fmt(Math.min(n, need)) + " / " + fmt(need) + "</span></div>";
      row.appendChild(got ? btn(t("done"), "ghost", function () {}, true) : btn(t("claim"), "ok", function () {
        S.season.got = (S.season.got || []).concat([i]); save("season");
        if (r.skin) { giveSkin(d.skin); S.sel.skin = d.skin; save("sel"); E.setSkin(sk); toast(nm(sk) + " ✓"); }
        else if (r.chest) openChest(r.chest); else { addReward(r); toast(rewardText(r)); }
        renderPanel();
      }, n < need));
      body.appendChild(row);
    });
  }

  /* ---------- Призраки: путь лучшего забега (только на этом устройстве) и соперник выше в таблице ---------- */
  var GHOST_KEY = "shmyg.ghost", RIVALS = ["Ника", "Leo", "Тимур", "Sam", "Ева", "Max", "Аня", "Kate", "Олег", "Мила"];
  function ghostLoad() { try { var g = JSON.parse(localStorage.getItem(GHOST_KEY) || "null"); return g && g.v === 1 ? g : null; } catch (e) { return null; } }
  function ghostSave(s) { if (!s.rec || s.rec.length < 30 || s.boss) return; try { localStorage.setItem(GHOST_KEY, JSON.stringify({ v: 1, dist: s.dist, skin: S.sel.skin, world: S.sel.world, data: s.rec })); } catch (e) {} }
  function rivalFor(best) {
    if (S.set.ghost === 0) return null;
    var e = null;
    if (lbCache && lbCache.entries) lbCache.entries.forEach(function (x) { if (x.score > best && (!e || x.score < e.score) && !(lbCache.userRank && x.rank === lbCache.userRank)) e = { name: (x.player && x.player.publicName) || t("anon"), score: x.score }; });
    if (!e && best >= 200) { var k = (st("runs") + dayNum()) % RIVALS.length; e = { name: RIVALS[k], score: Math.round(best * 1.18 + 150) }; }
    return e;
  }

  /* ---------- Финальные погони ---------- */
  function bossState(wid) {
    if (S.prog.claimed.indexOf("boss:" + wid) >= 0) return "won";
    return buildCount(wid) >= D.BOSS.needBuilds ? "open" : "locked";
  }
  function bossResult(wid, s) {
    if (!s.boss || !s.boss.won) { setTimeout(function () { toast(t("bossLost")); }, 400); return; }
    var first = S.prog.claimed.indexOf("boss:" + wid) < 0, b = D.BOSS.list[wid], txt;
    if (first) {
      S.prog.claimed.push("boss:" + wid); var r = b.reward;
      addReward({ bars: r.bars || 0, keys: r.keys || 0 });
      if (r.pet && !S.prog.pets[r.pet]) S.prog.pets[r.pet] = 1;
      if (r.skin) giveSkin(r.skin);
      txt = rewardText(r) + (r.pet ? ", " + nm(PETS.byId(r.pet)) : "") + (r.skin ? ", " + nm(skinById(r.skin)) : "");
    } else if (S.daily["boss_" + wid] !== 1) { S.daily["boss_" + wid] = 1; addReward({ bars: D.BOSS.replayBars }); txt = rewardText({ bars: D.BOSS.replayBars }); save("daily"); }
    else txt = t("bossNoReplay");
    addStat("bossWins", 1); save("prog");
    setTimeout(function () { modal(t("bossWin"), (art("thief-run") ? '<img class="boss-img" alt="" src="' + art("thief-run") + '">' : "") + '<p class="big">' + t("bossWinText") + "<br><b>" + txt + "</b></p>"); }, 300);
  }
  function bossCard(body, w) {
    var stt = bossState(w.id), b = D.BOSS.list[w.id], c = el("div", "task bosscard " + stt);
    c.innerHTML = '<div class="tt">' + t("bossTitle") + '</div><div class="muted">' + (stt === "locked" ? t("bossLocked", Math.min(D.BOSS.needBuilds, buildCount(w.id)), D.BOSS.needBuilds) : stt === "won" ? t("bossWon") : t("bossInfo", fmt(b.target))) + "</div>" +
      (stt !== "won" ? '<div class="muted">' + t("reward", rewardText(b.reward) + (b.reward.pet ? ", " + nm(PETS.byId(b.reward.pet)) : "") + (b.reward.skin ? ", " + nm(skinById(b.reward.skin)) : "")) + "</div>" : "");
    if (stt !== "locked") c.appendChild(btn(stt === "won" ? t("bossAgain") : t("bossGo"), stt === "won" ? "ghost" : "buy", function () { startBoss(w.id); }));
    body.appendChild(c);
  }

  /* ---------- Герои ---------- */
  function heroCan(h) { return h.get.t === "start" || S.wallet.coins >= h.get.coins || achVal({ stat: "bosses" }) >= h.get.boss; }
  function panelHeroes(body) {
    THUMBS.onOne = function (id, url) { var im = document.querySelector('#panel img[data-th="' + id + '"]'); if (im) { im.src = url; im.classList.add("ok"); } };
    THUMBS.renderAll(D.HEROES.map(function (h) { return skinById(h.base); }));
    D.HEROES.forEach(function (h) {
      var open = heroOpen(h.id), sk = skinById(h.base), th = art("hero-" + h.base) || THUMBS.get(h.base), row = el("div", "petrow herorow" + (S.sel.hero === h.id ? " on" : ""));
      row.innerHTML = '<div class="pthumb hthumb"><img class="th3d' + (th ? " ok" : "") + '" alt="" data-th="' + h.base + '"' + (th ? ' src="' + th + '"' : "") + "></div>" +
        '<div class="pinfo"><b>' + esc(nm(h)) + '</b><span class="pab">' + t("hero_" + h.id) + '</span><span class="perk2">' + esc(perkText(h.perk)) + "</span>" + (open ? "" : '<span class="muted">' + t("heroUnlock", fmt(h.get.coins), h.get.boss) + "</span>") + "</div>";
      var col = el("div", "pbtns");
      if (open) col.appendChild(S.sel.hero === h.id ? btn(t("petWith"), "ghost", function () {}, true) : btn(t("heroPick"), "ok", function () { setHero(h.id); renderPanel(); }));
      else {
        if (achVal({ stat: "bosses" }) >= h.get.boss) col.appendChild(btn(t("claim"), "ok", function () { S.prog.heroes.push(h.id); save("prog"); setHero(h.id); toast(nm(h) + " ✓"); renderPanel(); }));
        col.appendChild(btn("● " + fmt(h.get.coins), "gold", function () { if (S.wallet.coins < h.get.coins) return; S.wallet.coins -= h.get.coins; save("wallet"); S.prog.heroes.push(h.id); save("prog"); setHero(h.id); toast(nm(h) + " ✓"); renderPanel(); }, S.wallet.coins < h.get.coins));
      }
      row.appendChild(col); body.appendChild(row);
    });
  }

  /* ---------- Питомцы ---------- */
  function petCond(p) {
    var g = p.get;
    if (g.t === "coins") return t("getCoins", fmt(g.n));
    if (g.t === "task") return t("getTask", g.stat === "boostsAll" ? t("statBoosts", g.n, Math.min(g.n, st("boostsAll"))) : t("statCaught", g.n, Math.min(g.n, st("caught"))));
    if (g.t === "days") return t("getDays", g.n, Math.min(g.n, st("days")));
    if (g.t === "boss") return t("getBoss", nm(worldById(g.w)));
    return "";
  }
  function petReady(p) { var g = p.get; return g.t === "task" ? st(g.stat) >= g.n : g.t === "days" ? st("days") >= g.n : g.t === "boss" ? S.prog.claimed.indexOf("boss:" + g.w) >= 0 : false; }
  function panelPets(body) {
    var list = PETS.LIST.map(function (p) { return { id: p.id, pet: true }; });
    THUMBS.onOne = function (id, url) { var im = document.querySelector('#panel img[data-th="' + id + '"]'); if (im) { im.src = url; im.classList.add("ok"); } };
    THUMBS.renderAll(list);
    body.appendChild(el("p", "muted", t("petsNote")));
    PETS.LIST.forEach(function (p) {
      var lvl = S.prog.pets[p.id] || 0, row = el("div", "petrow" + (S.sel.pet === p.id ? " on" : "")), th = art("pet-" + p.id) || THUMBS.get("pet:" + p.id);
      row.innerHTML = '<div class="pthumb"><img class="th3d' + (th ? " ok" : "") + '" alt="" data-th="pet:' + p.id + '"' + (th ? ' src="' + th + '"' : "") + "></div>" +
        '<div class="pinfo"><b>' + esc(nm(p)) + '</b><span class="pab">' + t("pet_" + p.id, Math.round(p.v(Math.max(1, lvl)))) + "</span>" +
        (lvl ? '<span class="pips">' + [1, 2, 3, 4, 5].map(function (q) { return '<i class="' + (q <= lvl ? "on" : "") + '"></i>'; }).join("") + "</span>" + (lvl < 5 ? '<span class="muted">' + t("petNext", t("pu_" + p.id, Math.round(p.v(lvl + 1)))) + "</span>" : "") : '<span class="muted">' + esc(petCond(p)) + "</span>") + "</div>";
      var col = el("div", "pbtns");
      if (!lvl) {
        if (p.get.t === "coins") col.appendChild(btn("● " + fmt(p.get.n), "gold", function () { if (S.wallet.coins < p.get.n) return; S.wallet.coins -= p.get.n; S.prog.pets[p.id] = 1; S.sel.pet = p.id; save("wallet"); save("prog"); save("sel"); E.setPet(p.id); renderPanel(); }, S.wallet.coins < p.get.n));
        else col.appendChild(btn(t("claim"), "ok", function () { S.prog.pets[p.id] = 1; S.sel.pet = p.id; save("prog"); save("sel"); E.setPet(p.id); toast(nm(p) + " ✓"); renderPanel(); }, !petReady(p)));
      } else {
        col.appendChild(S.sel.pet === p.id ? btn(t("petWith"), "ghost", function () { S.sel.pet = ""; save("sel"); E.setPet(""); renderPanel(); }) : btn(t("petTake"), "ok", function () { S.sel.pet = p.id; save("sel"); E.setPet(p.id); renderPanel(); }));
        if (lvl < 5) { var c = PETS.UPGRADE[lvl]; col.appendChild(btn("▲ " + fmt(c), "gold small", function () { if (S.wallet.coins < c) return; S.wallet.coins -= c; S.prog.pets[p.id] = lvl + 1; save("wallet"); save("prog"); AUDIO.sfx("boost"); renderPanel(); }, S.wallet.coins < c)); }
      }
      row.appendChild(col); body.appendChild(row);
    });
  }

  /* ---------- Мир и стройка ---------- */
  var worldTab = null;
  function house(w, b, lv) {
    var c = hex(w.buildings[b].color);
    return '<div class="house lv' + lv + '" style="--c:' + c + '"><i class="h-base"></i><i class="h-body"></i><i class="h-roof"></i><i class="h-flag"></i><i class="h-scaf"></i></div>';
  }
  function panelWorld(body) {
    var tabs = el("div", "tabs"), cur = worldTab || S.sel.world;
    D.WORLDS.forEach(function (w) {
      var open = worldOpen(w.id), b = el("button", "tab" + (w.id === cur ? " on" : "") + (open ? "" : " locked"), (open ? "" : "🔒 ") + esc(nm(w)));
      b.style.setProperty("--sky", hex(w.sky)); b.onclick = function () { worldTab = w.id; renderPanel(); };
      tabs.appendChild(b);
    });
    body.appendChild(tabs);
    var w = worldById(cur), i = worldIdx(cur), open = worldOpen(cur);
    var wb = art("world-" + cur + "-h");
    if (wb) { var bn = el("div", "wbanner" + (open ? "" : " locked")); bn.style.backgroundImage = "url(" + wb + ")"; bn.innerHTML = "<b>" + esc(nm(w)) + "</b>"; body.appendChild(bn); }
    E.showPlaza(w.id, builds(w.id), w.buildings.map(function (b) { return b.color; }));
    var info = el("div", "winfo");
    if (!w.ready) { info.innerHTML = '<p class="muted">' + t("soon") + "</p><p>" + t("lockedBuilds", nm(D.WORLDS[i - 1]), Math.min(5, buildCount(D.WORLDS[i - 1].id))) + "<br>" + t("lockedCoins", fmt(w.unlock.coins)) + "</p>"; body.appendChild(info); return; }
    if (!open) {
      var prev = D.WORLDS[i - 1];
      info.innerHTML = "<p>" + t("lockedBuilds", nm(prev), Math.min(5, buildCount(prev.id))) + "<br>" + t("lockedCoins", fmt(w.unlock.coins)) + "</p>";
      info.appendChild(btn(t("unlockFor", "● " + fmt(w.unlock.coins)), "gold", function () {
        if (S.wallet.coins < w.unlock.coins) { toast(t("notEnough")); return; }
        S.wallet.coins -= w.unlock.coins; S.prog.worlds.push(w.id); save("wallet"); save("prog"); renderPanel();
      }, S.wallet.coins < w.unlock.coins));
      body.appendChild(info); return;
    }
    if (S.prog.worlds.indexOf(w.id) < 0) { S.prog.worlds.push(w.id); save("prog"); }
    info.appendChild(S.sel.world === w.id ? btn(t("chosen"), "ghost", function () {}, true) : btn(t("choose"), "ok", function () { S.sel.world = w.id; save("sel"); E.setWorld(w.id); renderPanel(); }));
    info.appendChild(el("span", "muted", t("bonus", Math.round((coinMul() - 1) * 100))));
    body.appendChild(info);
    bossCard(body, w);
    var bl = builds(w.id), list = el("div", "blist");
    w.buildings.forEach(function (b, k) {
      var lv = bl[k], row = el("div", "brow"), cost = lv < 3 ? buildCost(k, lv, w.id) : 0;
      row.innerHTML = '<div class="bname"><b>' + esc(nm(b)) + '</b><span class="pips">' + [0, 1, 2].map(function (q) { return '<i class="' + (q < lv ? "on" : "") + '"></i>'; }).join("") + "</span></div>";
      row.appendChild(lv >= 3 ? btn(t("maxLvl"), "ghost", function () {}, true) : btn((lv ? t("upgrade") : t("build")) + " ▮" + cost, "gold", function () { doBuild(w, k); }, S.wallet.bars < cost));
      list.appendChild(row);
    });
    body.appendChild(list);
    if (buildCount(w.id) >= 15) body.appendChild(el("p", "ok-text", t("worldDone")));
  }
  function buildCost(k, lv, wid) { var pk = skinById(S.sel.skin).perk, wi = Math.max(0, worldIdx(wid || curWorldTab())); return Math.max(1, Math.round(D.BUILD_COST[k][lv] * (1 + wi * D.BUILD_WORLD_MUL) * (1 - ((pk && pk.build) || 0)))); }
  function curWorldTab() { return worldTab || S.sel.world; }
  function doBuild(w, k) {
    var bl = builds(w.id).slice(), lv = bl[k], cost = buildCost(k, lv, w.id);
    if (lv >= 3 || S.wallet.bars < cost) { toast(t("needBars", cost)); return; }
    S.wallet.bars -= cost; bl[k] = lv + 1; S.prog.builds[w.id] = bl; save("wallet"); save("prog");
    E.plazaUpgrade(k, lv + 1, w.buildings[k].color, bl); weekAdd("wbuilds", 1);
    setTimeout(function () { var nx = D.WORLDS[worldIdx(w.id) + 1]; if (nx && worldOpen(nx.id) && !storySeen(nx.id)) { closePanel(); playStory(nx.id); } }, 2200);
    if (buildCount(w.id) === 15) {
      var sk = D.SKINS.filter(function (s) { return s.get.t === "world" && s.get.w === w.id; })[0];
      if (sk) { giveSkin(sk.id); modal(t("worldDone"), "<p>" + t("worldReward", esc(nm(sk))) + "</p>" + skinThumb(sk)); }
      else if (S.prog.claimed.indexOf("plaza:" + w.id) < 0) { S.prog.claimed.push("plaza:" + w.id); save("prog"); openChest("big"); }
    }
    var nx = D.WORLDS[worldIdx(w.id) + 1];
    if (nx && buildCount(w.id) === nx.unlock.builds && nx.ready) { if (S.prog.worlds.indexOf(nx.id) < 0) { S.prog.worlds.push(nx.id); save("prog"); } toast("🔓 " + nm(nx)); }
    renderPanel();
  }
  function beepBuild() { try { E.unlockAudio(); } catch (e) {} }

  /* ---------- Задания ---------- */
  function allTasksDone() { return S.daily.tasks && S.daily.tasks.every(function (x) { return x.claimed; }); }
  function panelTasks(body) {
    ensureDay();
    S.daily.tasks.forEach(function (x, i) {
      var row = el("div", "task"), pct = Math.min(100, x.prog / x.goal * 100);
      row.innerHTML = '<div class="tt">' + t("t_" + x.id, fmt(x.goal)) + '</div><div class="bar"><i style="width:' + pct + '%"></i><span>' + fmt(Math.min(x.prog, x.goal)) + " / " + fmt(x.goal) + '</span></div><div class="muted">' + t("reward", "● " + fmt(x.reward)) + "</div>";
      row.appendChild(x.claimed ? btn(t("done"), "ghost", function () {}, true) : btn(t("claim"), "ok", function () { x.claimed = true; addReward({ coins: x.reward }); save("daily"); renderPanel(); }, x.prog < x.goal));
      body.appendChild(row);
    });
    var ch = el("div", "task"); ch.innerHTML = '<div class="tt">' + t("allTasks") + "</div>";
    ch.appendChild(S.daily.chest ? btn(t("done"), "ghost", function () {}, true) : btn(t("claim"), "ok", function () { S.daily.chest = true; save("daily"); openChest("small"); renderPanel(); }, !allTasksDone()));
    body.appendChild(ch);
    var word = goldWord(), wd = el("div", "task");
    wd.innerHTML = '<div class="tt">' + t("letters") + '</div><div class="word">' + word.split("").map(function (c, i) { return '<b class="' + (i < S.daily.wordN ? "on" : "") + '">' + c + "</b>"; }).join("") + "</div>";
    wd.appendChild(S.daily.wordChest ? btn(t("done"), "ghost", function () {}, true) : btn(t("claim"), "ok", function () { S.daily.wordChest = true; save("daily"); openChest("big"); renderPanel(); }, S.daily.wordN < word.length));
    body.appendChild(wd);
    body.appendChild(el("p", "muted", t("newTasks")));
    // неделя
    body.appendChild(el("h3", "sec", t("weekTitle", weekDaysLeft())));
    D.WEEKLY.forEach(function (w) {
      var pr = (S.week.prog && S.week.prog[w.id]) || 0, done = S.week.claimed && S.week.claimed[w.id], row = el("div", "task"), pct = Math.min(100, pr / w.goal * 100);
      row.innerHTML = '<div class="tt">' + t("w_" + w.id, fmt(w.goal)) + '</div><div class="bar"><i style="width:' + pct + '%"></i><span>' + fmt(Math.min(pr, w.goal)) + " / " + fmt(w.goal) + '</span></div><div class="muted">' + t("reward", rewardText(w.reward)) + "</div>";
      row.appendChild(done ? btn(t("done"), "ghost", function () {}, true) : btn(t("claim"), "ok", function () { S.week.claimed[w.id] = true; addReward(w.reward); save("week"); toast(rewardText(w.reward)); renderPanel(); }, pr < w.goal));
      body.appendChild(row);
    });
    var allW = D.WEEKLY.every(function (w) { return S.week.claimed && S.week.claimed[w.id]; }), wc = el("div", "task");
    wc.innerHTML = '<div class="tt">' + t("weekAll") + "</div>";
    wc.appendChild(S.week.chest ? btn(t("done"), "ghost", function () {}, true) : btn(t("claim"), "ok", function () { S.week.chest = true; save("week"); openChest("big"); renderPanel(); }, !allW));
    body.appendChild(wc);
  }

  /* ---------- Рекорды и таблица лидеров ---------- */
  var lbCache = null, lbAt = 0;
  function submitScore(dist) {
    try { var sdk = PF.sdk(); if (!sdk || !sdk.getLeaderboards) return; sdk.getLeaderboards().then(function (lb) { return lb.setLeaderboardScore(D.LEADERBOARD, Math.floor(dist)); }).catch(function () {}); } catch (e) {}
  }
  function loadBoard(cb) {
    if (lbCache && Date.now() - lbAt < 60000) { cb(lbCache); return; }
    try {
      var sdk = PF.sdk(); if (!sdk || !sdk.getLeaderboards) { cb(null); return; }
      sdk.getLeaderboards().then(function (lb) { return lb.getLeaderboardEntries(D.LEADERBOARD, { quantityTop: 10, includeUser: true, quantityAround: 2 }); })
        .then(function (r) { lbCache = r; lbAt = Date.now(); cb(r); }, function () { cb(null); });
    } catch (e) { cb(null); }
  }
  function panelRecords(body) {
    var me = el("div", "task");
    me.innerHTML = '<div class="tt">' + t("myRecords") + '</div><div class="rec"><span>' + t("bestAll") + "</span><b>" + fmt(st("best")) + " " + t("m") + "</b></div>" +
      D.WORLDS.map(function (w) { return '<div class="rec"><span>' + esc(nm(w)) + "</span><b>" + (st("best_" + w.id) ? fmt(st("best_" + w.id)) + " " + t("m") : "—") + "</b></div>"; }).join("") +
      '<div class="rec"><span>' + t("runsAll") + "</span><b>" + fmt(st("runs")) + '</b></div><div class="rec"><span>' + t("caughtAll") + "</span><b>" + fmt(st("caught")) + "</b></div>";
    body.appendChild(me);
    if (window.GP) return;
    var bd = el("div", "task"); bd.innerHTML = '<div class="tt">' + t("boardTitle") + '</div><div class="muted">' + t("loading") + "</div>"; body.appendChild(bd);
    loadBoard(function (r) {
      if (panelId !== "records" && panelId !== "profile") return;
      if (!r || !r.entries || !r.entries.length) { bd.innerHTML = '<div class="tt">' + t("boardTitle") + '</div><div class="muted">' + t(PF.hasSdk() ? "boardEmpty" : "boardLocal") + "</div>"; return; }
      bd.innerHTML = '<div class="tt">' + t("boardTitle") + "</div>" + r.entries.map(function (e) {
        var n = (e.player && e.player.publicName) || t("anon"), mine = r.userRank && e.rank === r.userRank;
        return '<div class="rec' + (mine ? " mine" : "") + '"><span>' + e.rank + ". " + esc(n) + "</span><b>" + fmt(e.score) + " " + t("m") + "</b></div>";
      }).join("");
    });
  }

  /* ---------- Мастерская ---------- */
  function panelWorkshop(body) {
    D.BOOST_ORDER.forEach(function (k) {
      var lv = S.prog.up[k] || 0, row = el("div", "boost");
      row.innerHTML = '<img alt="" src="' + boostIcon(k) + '"><div class="bi"><b>' + t("b_" + k) + '</b><span class="muted">' + t("bd_" + k) + " · " + t("sec", D.BOOSTS[k].dur[lv]) + (lv < 5 ? " → " + t("sec", D.BOOSTS[k].dur[lv + 1]) : "") + '</span><span class="pips">' + [0, 1, 2, 3, 4].map(function (q) { return '<i class="' + (q < lv ? "on" : "") + '"></i>'; }).join("") + "</span></div>";
      row.appendChild(lv >= 5 ? btn(t("maxLvl"), "ghost", function () {}, true) : btn("● " + fmt(D.UPGRADE_COST[lv]), "gold", function () {
        if (S.wallet.coins < D.UPGRADE_COST[lv]) { toast(t("notEnough")); return; }
        S.wallet.coins -= D.UPGRADE_COST[lv]; S.prog.up[k] = lv + 1; save("wallet"); save("prog"); renderPanel();
      }, S.wallet.coins < D.UPGRADE_COST[lv]));
      body.appendChild(row);
    });
  }

  /* ---------- Сундуки и календарь ---------- */
  function hms(ms) { var s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h + ":" + ("0" + m).slice(-2) + ":" + ("0" + s % 60).slice(-2); }
  function panelChests(body) {
    var cal = el("div", "cal"), idx = st("calIdx") % 7, can = st("calLast") < dayNum();
    D.CALENDAR.forEach(function (r, i) {
      var c = el("div", "cday" + (i < idx ? " got" : "") + (i === idx && can ? " now" : ""));
      c.innerHTML = "<small>" + t("calDay", i + 1) + "</small><b>" + (r.chest ? "🎁" : r.coins ? "● " + fmt(r.coins) : r.bars ? "▮ " + r.bars : "🔑 " + r.keys) + "</b>";
      cal.appendChild(c);
    });
    var box1 = el("div", "task"); box1.innerHTML = '<div class="tt">' + t("calendar") + '</div>'; box1.appendChild(cal);
    box1.appendChild(btn(can ? t("calTake") : t("calTaken"), can ? "ok" : "ghost", function () {
      var r = D.CALENDAR[idx]; S.prog.st.calIdx = st("calIdx") + 1; S.prog.st.calLast = dayNum(); save("prog");
      if (r.chest) openChest(r.chest); else { addReward(r); toast(rewardText(r)); }
      renderPanel();
    }, !can));
    box1.appendChild(el("p", "muted", t("daysTotal", st("days"))));
    body.appendChild(box1);
    var left = st("chestAt") + D.FREE_CHEST_MS - PF.now(), fc = el("div", "task");
    var cs = D.CHESTS.small;
    fc.innerHTML = '<div class="tt">' + t("freeChest") + '</div>' + chestPic("small") + '<div class="muted">' + t("chestOdds", cs.coins[0], cs.coins[1], Math.round(cs.key * 100), Math.round(cs.bar * 100)) + "</div>";
    fc.appendChild(left > 0 ? btn(t("freeIn", hms(left)), "ghost", function () {}, true) : !adsOn() ? btn(t("openFree"), "ok", function () { S.prog.st.chestAt = PF.now(); save("prog"); openChest("small"); renderPanel(); }) : btn(t("openAd"), "ad", function () {
      rewarded(function (ok) { if (!ok) return; S.prog.st.chestAt = PF.now(); save("prog"); openChest("small"); renderPanel(); });
    }));
    body.appendChild(fc);
    if (window.Premium && Premium.active && Premium.active()) {
      var pg = el("div", "task premgift"); pg.innerHTML = '<i class="mico"></i><div class="tt">' + t("premGiftTitle") + '</div><div class="muted">' + t("premGiftText") + "</div>";
      pg.appendChild(Premium.giftAvailable() ? btn(t("premGiftBtn"), "gold", function () { Premium.claimGift(); renderPanel(); }) : btn(t("premGiftWait"), "ghost", function () {}, true));
      body.insertBefore(pg, body.firstChild);
    }
    [["wheel", playWheel, "wheelTitle", adsOn() ? "wheelNote" : "wheelNoteFree"], ["shell", playShell, "shellTitle", "shellNote"]].forEach(function (mg) {
      var lf = miniLeft(mg[0]), c = el("div", "task minicard " + mg[0]);
      c.innerHTML = '<i class="mico"></i><div class="tt">' + t(mg[2]) + '</div><div class="muted">' + t(mg[3]) + "</div>";
      c.appendChild(btn(lf.free ? t("playFree") : lf.ad ? t("playAgain") : t("miniTomorrowShort"), lf.free ? "ok" : lf.ad ? "ad" : "ghost", mg[1], !lf.free && !lf.ad));
      body.insertBefore(c, body.firstChild);
    });
    var bought = S.daily.keysBought || 0, kb = el("div", "task");
    kb.innerHTML = '<div class="tt">' + t("buyKey") + '</div><div class="muted">' + t("buyKeyNote", D.KEYS_PER_DAY - bought) + "</div>";
    kb.appendChild(btn("● " + fmt(D.KEY_PRICE), "gold", function () {
      if (S.wallet.coins < D.KEY_PRICE || bought >= D.KEYS_PER_DAY) return;
      S.wallet.coins -= D.KEY_PRICE; S.wallet.keys++; S.daily.keysBought = bought + 1; save("wallet"); save("daily"); toast("+1 " + pl(1, "key")); renderPanel();
    }, S.wallet.coins < D.KEY_PRICE || bought >= D.KEYS_PER_DAY));
    body.appendChild(kb);
    var cb = D.CHESTS.big, bc = el("div", "task");
    bc.innerHTML = '<div class="tt">' + t("bigChest") + '</div><div class="muted">' + t("chestOdds", cb.coins[0], cb.coins[1], 100, 100) + "</div>";
    body.appendChild(bc);
  }

  /* ---------- Модальные окна и тосты ---------- */
  function modal(title, html, after) {
    var m = $("#modal"); m.hidden = false;
    m.querySelector(".mt").textContent = title; m.querySelector(".mbody").innerHTML = html;
    var b = m.querySelector(".mok"); b.textContent = t("ok"); b.onclick = function () { m.hidden = true; refreshTop(); if (after) after(); };
  }
  var toastT = 0;
  function toast(s) { var e = $("#toast"); e.textContent = s; e.hidden = false; e.classList.remove("show"); void e.offsetWidth; e.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(function () { e.hidden = true; }, 2200); }

  /* ================= Забег ================= */
  var runInfo = null, crashTimer = 0;
  var bossRun = null;
  function startBoss(wid) { bossRun = wid; S.sel.world = wid; save("sel"); startRun(); }
  function startRun() {
    ensureDay(); closePanelQuiet(); E.unlockAudio();
    E.setWorld(S.sel.world); E.setSkin(skinById(S.sel.skin));
    var letters = goldWord(), letter = S.daily.wordN < letters.length ? letters[S.daily.wordN] : "";
    var ev = isWeekend() ? D.WEEKEND : {}, tut = !st("tutDone") && !E.auto(), petSel = S.sel.pet && S.prog.pets[S.sel.pet] ? { id: S.sel.pet, lvl: S.prog.pets[S.sel.pet] } : null;
    var sb = {}; Object.keys(startSel).forEach(function (k) { if (startSel[k] && S.wallet.coins >= D.START_BOOSTS[k]) { S.wallet.coins -= D.START_BOOSTS[k]; sb[k] = true; } }); startSel = {}; save("wallet"); renderStart();
    var bossOpt = bossRun ? D.BOSS.list[bossRun] : null, sz = seasonNow().def; $(".chase span[data-t]").textContent = bossOpt ? t("bossBar") : t("chase");
    var gh = S.set.ghost === 0 || bossOpt ? null : ghostLoad(), rv = bossOpt ? null : rivalFor(st("best"));
    if (!lbCache) loadBoard(function () {});
    E.newRun({ ghost: gh && gh.dist >= 150 ? gh : null, rival: rv, season: sz, boss: bossOpt, pet: petSel, tutorial: tut, startShield: sb.shield, startJet: sb.jet, startX2: sb.x2, coinMul: coinMul(), levels: S.prog.up, letter: letter, perk: runPerk(), eventBars: ev.bars || 0, catchBonus: ev.catchBonus || 0 });
    runInfo = { x2: false, boss: bossRun }; bossRun = null;
    show("hud"); PF.setPlaying(true);
    $("#hudHint").hidden = st("runs") > 2 || tut; $("#hudHint").textContent = $("#hint").textContent; $("#tut").hidden = true;
  }
  /* стартовые бусты: выбрать перед забегом, монеты списываются при старте */
  var startSel = {};
  function renderStart() {
    var box = $("#startBoosts"); if (!box) return; box.innerHTML = "";
    if (st("runs") < 3) { box.hidden = true; return; }
    box.hidden = false;
    Object.keys(D.START_BOOSTS).forEach(function (k) {
      var price = D.START_BOOSTS[k], b = el("button", "sbst" + (startSel[k] ? " on" : ""), '<img alt="" src="' + boostIcon(k) + '"><span>' + fmt(price) + "</span>");
      b.title = t("start_" + k); b.disabled = !startSel[k] && S.wallet.coins < price;
      b.onclick = function () { startSel[k] = !startSel[k]; AUDIO.sfx("click"); renderStart(); if (startSel[k]) toast(t("start_" + k) + " · " + fmt(price)); };
      box.appendChild(b);
    });
  }
  function closePanelQuiet() { E.setMenuLift(0); E.hidePlaza(); E.setTurntable(false); $("#panel").hidden = true; panelId = ""; $("#menu").classList.remove("dim"); previewSkin = null; }
  var lastHud = 0;
  function hud(s) {
    var now = performance.now(); if (now - lastHud < 60) return; lastHud = now;
    $("#hCoins").textContent = fmt(s.coins); $("#hDist").textContent = fmt(s.dist) + " " + t("m"); $("#hBars").textContent = s.bars;
    var bs = s.boss; $("#chaseFill").style.width = (bs ? Math.min(100, s.dist / bs.target * 100) : Math.min(100, s.chase)) + "%";
    $(".chase").classList.toggle("bossbar", !!bs);
    var gl = $("#ghostLine"), parts = [];
    if (s.ghost && !s.ghostBeat && s.ghost.dist > s.dist) parts.push(t("toBest", fmt(s.ghost.dist - s.dist)));
    if (s.rival && !s.rivalBeat && s.rival.score > s.dist) parts.push(t("toRival", s.rival.name, fmt(s.rival.score - s.dist)));
    gl.textContent = parts.join(" · "); gl.hidden = !parts.length;
    var bx = $("#hBoosts"), html = "";
    D.BOOST_ORDER.forEach(function (k) { if (s.boost[k] > 0) { var full = D.BOOSTS[k].dur[Math.min(5, S.prog.up[k] || 0)]; html += '<div class="hb"><img alt="" src="' + E.iconURL(k) + '"><i style="width:' + Math.min(100, s.boost[k] / full * 100) + '%"></i></div>'; } });
    if (bx.innerHTML !== html) bx.innerHTML = html;
    if (s.dist > 120) $("#hudHint").hidden = true;
  }
  function onCrash(s) {
    PF.setPlaying(false); vib(90);
    if (E.auto() && window.__autoEnd !== false) { setTimeout(function () { E.endRun(); }, 300); return; }
    show("crash");
    var keyCost = s.continues + 1, box = $("#crashBtns"); box.innerHTML = "";
    if (s.continues === 0 && PF.canReward()) box.appendChild(btn(t("contAd"), "ad big", function () {
      clearTimeout(crashTimer); rewarded(function (ok) { if (ok) resumeRun(); else E.endRun(); });
    }));
    if (S.wallet.keys >= keyCost) box.appendChild(btn(t("contKey", keyCost) + " 🔑", "gold", function () { clearTimeout(crashTimer); S.wallet.keys -= keyCost; save("wallet"); resumeRun(); }));
    box.appendChild(btn(t("noThanks"), "ghost", function () { clearTimeout(crashTimer); E.endRun(); }));
    var ring = $("#crashRing"); ring.classList.remove("go"); void ring.offsetWidth; ring.classList.add("go");
    clearTimeout(crashTimer); crashTimer = setTimeout(function () { if (E.mode() === "crash") E.endRun(); }, 7000);
  }
  function resumeRun() { show("hud"); E.continueRun(); PF.setPlaying(true); }
  var lastRun = null;
  function onEnd(s) {
    PF.setPlaying(false); clearTimeout(crashTimer);
    var newBest = s.dist > st("best");
    if (newBest) ghostSave(s);
    if (s.ghostBeat && st("best") >= 300) { addReward({ coins: 300, bars: 1 }); }
    if (s.rivalBeat) { addReward({ bars: 2 }); addStat("rivalsBeat", 1); }
    S.wallet.coins += s.coins; S.wallet.bars += s.bars;
    addStat("boostsAll", s.boosts); addStat("barsAll", s.bars); addStat("jumpsAll", s.jumps); addStat("tokensAll", s.tokens || 0); addStat("distAll", s.dist);
    addStat("runs", 1); S.prog.st.best = Math.max(st("best"), s.dist); addStat("coinsAll", s.coins); addStat("caught", s.caught);
    if (s.letter && S.daily.wordN < goldWord().length) S.daily.wordN++;
    (S.daily.tasks || []).forEach(function (x) {
      var v = { coins: s.coins, dist: s.dist, boosts: s.boosts, jumps: s.jumps, slides: s.slides, bars: s.bars, caught: s.caught, runs: 1 }[x.id] || 0;
      if (x.id === "coins" || x.id === "dist") x.prog = Math.max(x.prog, v); else x.prog += v;
    });
    if (runInfo && runInfo.boss) bossResult(runInfo.boss, s);
    if (s.tokens) { seasonNow(); S.season.n = (S.season.n || 0) + s.tokens; save("season"); }
    var wbest = "best_" + S.sel.world; S.prog.st[wbest] = Math.max(st(wbest), s.dist);
    weekAdd("wdist", s.dist); weekAdd("wcoins", s.coins); weekAdd("wcaught", s.caught);
    if (S.week.worlds && S.week.worlds.indexOf(S.sel.world) < 0) { S.week.worlds.push(S.sel.world); S.week.prog.wworlds = S.week.worlds.length; save("week"); }
    if (newBest) submitScore(s.dist);
    save("wallet"); save("prog"); save("daily");
    setTimeout(achCheck, 900);
    lastRun = s;
    $("#rDist").textContent = fmt(s.dist) + " " + t("m"); $("#rCoins").textContent = fmt(s.coins); $("#rBars").textContent = s.bars; $("#rCaught").textContent = s.caught; var rt = $("#rTokens"); if (rt) { rt.textContent = s.tokens || 0; rt.previousElementSibling.textContent = cap(tokName(seasonNow().def)); }
    $("#rBest").textContent = newBest ? t("newBest") : t("best") + ": " + fmt(st("best")) + " " + t("m"); $("#rBest").classList.toggle("nb", newBest);
    var xb = $("#x2Btn"); xb.hidden = s.coins < 10 || !adsOn(); xb.disabled = false; xb.textContent = t("x2Ad");
    show("results"); refreshTop();
    if (E.auto() && window.__autoLoop) setTimeout(function () { again(); }, 800);
  }
  function x2() {
    if (!lastRun || runInfo.x2) return;
    rewarded(function (ok) { if (!ok) return; runInfo.x2 = true; S.wallet.coins += lastRun.coins; save("wallet"); $("#rCoins").textContent = fmt(lastRun.coins * 2); $("#x2Btn").disabled = true; toast(t("x2Done")); refreshTop(); });
  }
  function afterResults(fn) { PF.interstitial(function () { fn(); }); }
  function again() { afterResults(startRun); }
  function toMenu() {
    afterResults(function () { E.toMenu(); show("menu"); AUDIO.music("menu"); refreshTop(); setTimeout(storyCheck, 600); try { if (window.Premium) Premium.maybeCard(); } catch (e) {} });
  }
  function pause(on) {
    if (on && E.mode() !== "run") return;
    E.setPaused(on); if (on) { show("pause"); PF.setPlaying(false); } else { show("hud"); PF.setPlaying(true); }
  }

  /* ================= Ввод ================= */
  function key(e) {
    var k = e.key;
    if (screen === "hud") {
      var a = { ArrowLeft: "left", a: "left", A: "left", "ф": "left", ArrowRight: "right", d: "right", D: "right", "в": "right", ArrowUp: "up", w: "up", W: "up", " ": "up", "ц": "up", ArrowDown: "down", s: "down", S: "down", "ы": "down" }[k];
      if (a) { E.input(a); e.preventDefault(); return; }
      if (k === "Escape" || k === "p" || k === "P" || k === "з") { pause(true); e.preventDefault(); }
    } else if (screen === "pause" && (k === "Escape" || k === "p" || k === "P")) pause(false);
    else if (screen === "menu" && (k === "Enter") && !panelId) startRun();
  }
  var sx = 0, sy = 0, swiping = false;
  function pdown(e) { if (screen !== "hud") return; sx = e.clientX; sy = e.clientY; swiping = true; }
  function pmove(e) {
    if (!swiping) return;
    var dx = e.clientX - sx, dy = e.clientY - sy, th = Math.max(24, Math.min(innerWidth, innerHeight) * 0.05);
    if (Math.abs(dx) < th && Math.abs(dy) < th) return;
    swiping = false;
    if (Math.abs(dx) > Math.abs(dy)) E.input(dx < 0 ? "left" : "right"); else E.input(dy < 0 ? "up" : "down");
  }
  function pup() { swiping = false; }

  /* ================= Запуск ================= */
  function boot() {
    E.init($("#c"));
    loadArt().then(loadingArt);
    Promise.all([PF.init(), loadArt()]).then(function () {
      load(); ensureDay();
      if (!adsOn()) D.SKINS.forEach(function (x) { if (x.get.t === "ads") x.get = { t: "coins", n: x.get.n * 1000 }; });
      var pl0 = ((PF.hasSdk() ? PF.lang() : (navigator.language || "ru")) || "ru").slice(0, 2);
      lang = S.set.lang || (LANGS.indexOf(pl0) >= 0 ? pl0 : ["be", "uk", "kk", "uz", "ky", "tg", "hy", "az"].indexOf(pl0) >= 0 ? "ru" : "en");
      if (LANGS.indexOf(lang) < 0) lang = "ru";
      applySound();
      if (S.set.q != null && S.set.q !== "auto") E.setQuality(S.set.q); else if (S.set.qAuto != null) { E.setQuality("auto"); GFX.setQuality(S.set.qAuto); }
      if (/[?&]fps=1/.test(location.search)) { var fm = document.createElement("div"); fm.id = "fpsMeter"; document.body.appendChild(fm); }
      E.setSkin(skinById(S.sel.skin)); E.setWorld(S.sel.world); E.setPet(S.sel.pet || "");
      E.on("crash", onCrash);
      E.on("quality", function (q) { S.set.qAuto = q; save("set"); });
      E.on("fps", function (f, q) { var e = $("#fpsMeter"); if (e) e.textContent = f + " FPS · q" + q; });
      E.on("beat", function (k, name) { if (k === "self") { toast(t("beatSelf")); vib([30, 30, 30]); AUDIO.sfx("boost"); } else { toast(t("beatRival", name)); vib([40, 40, 80]); AUDIO.sfx("caught"); } });
      E.on("bossWin", function () { toast(t("bossCaught")); vib([60, 40, 120]); });
      E.on("warn", function () { toast(t("owlWarn")); vib(40); });
      E.on("petAct", function (id) { toast(t("petAct_" + id)); }); E.on("end", onEnd); E.onHud(hud);
      E.on("caught", function () { vib([40, 30, 40]); var n = D.RUN.catchReward + (isWeekend() ? D.WEEKEND.catchBonus : 0); toast(t("caughtToast", n + " " + pl(n, "bar"))); });
      E.on("stumble", function () { toast(t("stumbleToast")); vib(30); });
      E.on("letter", function (l) { toast(t("letterToast", l)); });
      E.on("tut", function (a) {
        var el2 = $("#tut");
        if (a === "done") { el2.hidden = true; S.prog.st.tutDone = 1; save("prog"); E.giveBars && E.giveBars(2); toast(t("tutDone")); return; }
        if (!a) { el2.hidden = true; return; }
        el2.hidden = false; el2.className = a === "lr" ? (Math.random() < 0.5 ? "left" : "right") : a;
        el2.querySelector(".tx").textContent = t("tut_" + a + (matchMedia("(pointer:coarse)").matches ? "" : "_k"));
      });
      PF.onCloud = function () { load(); E.setSkin(skinById(S.sel.skin)); E.setWorld(S.sel.world); refreshTop(); };
      PF.onPause = function (p) { AUDIO.suspend(p); if (p && screen === "hud") pause(true); };
      // Премиум и покупки костюмов
      try {
        Premium.init({ gift: { grant: premGift, text: { ru: t2("ru", "premGiftText"), en: t2("en", "premGiftText") } }, sdk: PF.sdk(), lang: lang === "ru" ? "ru" : "en", texts: lang !== "ru" && lang !== "en" && window.I18N_PREM[lang] ? { en: window.I18N_PREM[lang] } : undefined, store: { get: function () { return PF.get("sg.premium"); }, set: function (r) { PF.put("sg.premium", r); }, save: function () { return PF.save(); } } })
          .then(function () { try { Premium.maybeCard(); } catch (e) {} });
      } catch (e) {}
      SKINSHOP.init(PF.sdk(), grantProduct).then(function () { if (panelId) renderPanel(); });
      try { var sdk = PF.sdk(); if (sdk && sdk.getPlayer) sdk.getPlayer({ scopes: false }).then(function (pl) { var n = pl.getName && pl.getName(); if (n) window.__playerName = n; }, function () {}); } catch (e) {}
      applyLang(); show("menu");
      if (!st("introSeen")) playStory("intro", function () { S.prog.st.introSeen = 1; save("prog"); });
      $("#loading").hidden = true;
      PF.ready();
      
    });
    addEventListener("keydown", key);
    addEventListener("pointerdown", pdown, { passive: true }); addEventListener("pointermove", pmove, { passive: true }); addEventListener("pointerup", pup); addEventListener("pointercancel", pup);
    document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    $("#runBtn").onclick = function () { startRun(); };
    var firstTap = function () { AUDIO.unlock(); if (screen === "menu") AUDIO.music("menu"); removeEventListener("pointerdown", firstTap); removeEventListener("keydown", firstTap); };
    addEventListener("pointerdown", firstTap); addEventListener("keydown", firstTap);
    document.querySelectorAll("[data-panel]").forEach(function (b) { b.onclick = function () { E.unlockAudio(); worldTab = null; openPanel(b.getAttribute("data-panel")); }; });
    $("#worldChip").onclick = function () { worldTab = null; openPanel("world"); };
    $("#panel .px").onclick = closePanel;
    $("#pauseBtn").onclick = function () { pause(true); };
    $("#resumeBtn").onclick = function () { pause(false); };
    $("#quitBtn").onclick = function () { E.setPaused(false); E.endRun(); };
    $("#x2Btn").onclick = x2; $("#againBtn").onclick = again; $("#menuBtn").onclick = toMenu;
    $("#langBtn").onclick = function () { lang = LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length]; S.set.lang = lang; save("set"); applyLang(); if (panelId) renderPanel(); };
    $("#sndBtn").onclick = function () { S.set.snd = (S.set.snd + 2) % 3; save("set"); applySound(); AUDIO.unlock(); toast(t(["sndOff", "sndNoMusic", "sndOn"][S.set.snd])); };
    setInterval(function () { if (panelId === "chests") renderPanelSoft(); }, 1000);
  }
  function applySound() {
    AUDIO.setOn(S.set.snd > 0); AUDIO.setMusic(S.set.snd > 1);
    var b = $("#sndBtn"); b.classList.toggle("off", S.set.snd === 0); b.style.opacity = S.set.snd === 1 ? 0.75 : "";
  }
  /* ---------- Мини-игры: колесо удачи и «Найди слиток» ---------- */
  function miniLeft(kind) { var free = !S.daily[kind], ad = adsOn() && !S.daily[kind + "Ad"]; return { free: free, ad: ad }; }
  function miniUse(kind, viaAd, go) {
    if (!viaAd) { S.daily[kind] = 1; save("daily"); go(); return; }
    rewarded(function (ok) { if (!ok) return; S.daily[kind + "Ad"] = 1; save("daily"); go(); });
  }
  function giveMini(r) { if (r.chest) { openChest(r.chest); return; } addReward(r); toast("+ " + rewardText(r)); AUDIO.sfx("bar"); }
  function miniBox(title) { var m = $("#mini"); m.hidden = false; m.innerHTML = '<div class="box minibox"><h2>' + title + '</h2><div class="mstage"></div><div class="mres muted"></div><button class="btn ghost mclose">' + t("close") + "</button></div>"; m.querySelector(".mclose").onclick = function () { m.hidden = true; refreshTop(); if (panelId) renderPanel(); }; return m.querySelector(".mstage"); }
  function playWheel() {
    var st2 = miniBox(t("wheelTitle")), W = D.WHEEL, sum = W.reduce(function (a, x) { return a + x.w; }, 0), n = W.length;
    var cv = document.createElement("canvas"); cv.width = cv.height = 520; var g = cv.getContext("2d"), R = 250;
    W.forEach(function (x, i) {
      var a0 = -Math.PI / 2 + i / n * Math.PI * 2 - Math.PI / n, a1 = a0 + Math.PI * 2 / n;
      g.beginPath(); g.moveTo(260, 260); g.arc(260, 260, R, a0, a1); g.closePath(); g.fillStyle = hex(x.c); g.fill(); g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 3; g.stroke();
      g.save(); g.translate(260, 260); g.rotate(a0 + Math.PI / n + Math.PI / 2); g.fillStyle = "#fff"; g.font = "800 26px Segoe UI, Arial"; g.textAlign = "center";
      g.fillText(x.r.chest ? t("smallChest") : x.r.coins ? fmt(x.r.coins) : x.r.bars ? "▮ " + x.r.bars : "🔑 " + x.r.keys, 0, -R + 52); g.restore();
    });
    g.beginPath(); g.arc(260, 260, 46, 0, 7); g.fillStyle = "#1a1430"; g.fill(); g.strokeStyle = "#ffd04a"; g.lineWidth = 6; g.stroke();
    st2.innerHTML = '<div class="wheelwrap"><i class="wptr"></i></div>'; var ww = st2.querySelector(".wheelwrap"); cv.className = "wheel"; ww.appendChild(cv);
    var left = miniLeft("wheel"), res = $("#mini .mres"), btns = el("div", "row2");
    function spin(viaAd) {
      miniUse("wheel", viaAd, function () {
        var q = Math.random() * sum, k = 0; for (; k < n; k++) { q -= W[k].w; if (q <= 0) break; }
        var turns = 5 * 360 + (360 - k * 360 / n) + (Math.random() - 0.5) * (300 / n);
        cv.style.transition = "none"; cv.style.transform = "rotate(0deg)"; void cv.offsetWidth;
        cv.style.transition = "transform 3.6s cubic-bezier(.12,.75,.12,1)"; cv.style.transform = "rotate(" + turns + "deg)";
        btns.innerHTML = ""; AUDIO.sfx("whoosh");
        setTimeout(function () { giveMini(W[k].r); res.textContent = t("youWon", W[k].r.chest ? t("smallChest") : rewardText(W[k].r)); vib([30, 30, 60]); }, 3700);
      });
    }
    if (left.free) btns.appendChild(btn(t("spinFree"), "ok", function () { spin(false); }));
    else if (left.ad) btns.appendChild(btn(t("spinAd"), "ad", function () { spin(true); }));
    else res.textContent = t("miniTomorrow");
    st2.appendChild(btns);
  }
  function playShell() {
    var st2 = miniBox(t("shellTitle")), res = $("#mini .mres"), left = miniLeft("shell"), btns = el("div", "row2"), prize = Math.floor(Math.random() * 3), locked = true;
    st2.innerHTML = '<div class="shells">' + [0, 1, 2].map(function (i) { return '<div class="shell" data-i="' + i + '"><i class="sbar"></i><div class="lid"></div></div>'; }).join("") + "</div>";
    var nodes = Array.prototype.slice.call(st2.querySelectorAll(".shell")), pos = [0, 1, 2];
    function place() { nodes.forEach(function (nd, i) { nd.style.transform = "translateX(" + (pos[i] - 1) * 105 + "%)"; }); }
    place(); nodes.forEach(function (nd, i) { nd.classList.toggle("has", i === prize); });
    res.textContent = t("shellHint");
    function start(viaAd) {
      miniUse("shell", viaAd, function () {
        btns.innerHTML = ""; nodes[prize].classList.add("show");
        setTimeout(function () {
          nodes[prize].classList.remove("show"); var k = 0;
          (function swap() {
            if (k++ >= D.SHELL.swaps) { locked = false; res.textContent = t("shellPick"); return; }
            var a = Math.floor(Math.random() * 3), b = (a + 1 + Math.floor(Math.random() * 2)) % 3, tmp = pos[a]; pos[a] = pos[b]; pos[b] = tmp; place(); AUDIO.sfx("whoosh");
            setTimeout(swap, 380);
          })();
        }, 1100);
      });
    }
    nodes.forEach(function (nd, i) { nd.onclick = function () {
      if (locked) return; locked = true; nodes.forEach(function (x) { x.classList.add("show"); });
      var win = i === prize; giveMini(win ? D.SHELL.win : D.SHELL.lose); res.textContent = win ? t("shellWin") : t("shellLose"); if (win) vib([40, 30, 80]);
    }; });
    if (left.free) btns.appendChild(btn(t("shellFree"), "ok", function () { start(false); }));
    else if (left.ad) btns.appendChild(btn(t("spinAd"), "ad", function () { start(true); }));
    else res.textContent = t("miniTomorrow");
    st2.appendChild(btns);
  }

  /* ---------- Сюжет: комикс-сцены ---------- */
  function storySeen(id) { return S.prog.claimed.indexOf("story:" + id) >= 0; }
  function storyOpen(id) { if (id === "intro") return true; if (id === "finale") return S.prog.claimed.indexOf("boss:moon") >= 0; return worldOpen(id); }
  function portrait(who) {
    if (who === "thief") return art("thief-run") || "";
    var sk = who === "ars" ? "ars" : "courier"; return art("hero-" + sk) || THUMBS.get(sk) || "";
  }
  function playStory(id, done) {
    var sc = STORY.SCENES[id]; if (!sc) { if (done) done(); return; }
    THUMBS.renderAll([skinById("courier"), skinById("ars")]);
    var w = worldById(sc.world), box = $("#story"), i = 0;
    function frame() {
      var f = sc.frames[i], n = i + 1, bg = art("story-" + id + "-" + n) || art("world-" + sc.world + (innerWidth / innerHeight < 1 ? "-v" : "-h"));
      box.hidden = false; box.className = "story" + (art("story-" + id + "-" + n) ? " full" : "");
      box.style.setProperty("--sky", hex(w.sky)); box.style.setProperty("--ground", hex(w.ground));
      var pics = "";
      if (!art("story-" + id + "-" + n)) f.who.forEach(function (who, k) { var src = portrait(who); if (src) pics += '<img class="sp sp' + k + (who === "thief" ? " thief" : "") + (f.who.length === 1 ? " solo" : "") + '" alt="" src="' + src + '">'; else if (who === "crowd") pics += '<div class="crowd"></div>'; });
      box.innerHTML = '<div class="sbg"' + (bg ? ' style="background-image:url(' + bg + ')"' : "") + "></div>" + pics +
        '<div class="sbub' + (f.say ? " talk" : "") + '">' + (f.say ? "<b>" + t("storyName_" + f.say) + "</b>" : "") + "<p>" + esc(t("st_" + id + "_" + n)) + "</p></div>" +
        '<div class="sbtns"><button class="btn ghost small skip">' + t("storySkip") + '</button><span class="sdots">' + sc.frames.map(function (x, k) { return '<i class="' + (k === i ? "on" : "") + '"></i>'; }).join("") + '</span><button class="btn ok nx">' + (i < sc.frames.length - 1 ? t("storyNext") : t("storyEnd")) + "</button></div>";
      box.querySelector(".nx").onclick = function (e) { e.stopPropagation(); AUDIO.sfx("click"); i++; if (i >= sc.frames.length) end(); else frame(); };
      box.querySelector(".skip").onclick = function (e) { e.stopPropagation(); end(); };
    }
    function end() { box.hidden = true; if (!storySeen(id)) { S.prog.claimed.push("story:" + id); save("prog"); } if (done) done(); }
    frame();
  }
  /* при открытии новых миров — их сцена (одна за раз) */
  function storyCheck() {
    if (screen !== "menu" || !$("#story").hidden) return;
    for (var k = 0; k < STORY.ORDER.length; k++) { var id = STORY.ORDER[k]; if (id !== "intro" && !storySeen(id) && storyOpen(id)) { playStory(id); return; } }
  }
  function panelStory(body) {
    STORY.ORDER.forEach(function (id, k) {
      var open = storyOpen(id), row = el("div", "task");
      row.innerHTML = '<div class="tt">' + (k + 1) + ". " + t("sc_" + id) + "</div>" + (open ? "" : '<div class="muted">' + t("storyLocked") + "</div>");
      if (open) row.appendChild(btn(t("storyNext"), "ok small", function () { closePanel(); playStory(id); }));
      body.appendChild(row);
    });
  }
  /* вступление: вор с мешком (картинка Художника), история в двух фразах */
  function showIntro() {
    var th = art("thief-run"), hc = art("hero-courier");
    var pics = (hc ? '<img class="intro-hero" alt="" src="' + hc + '">' : "") + (th ? '<img class="intro-thief" alt="" src="' + th + '">' : "");
    modal(t("introTitle"), '<div class="intro">' + pics + '</div><p class="big">' + t("story") + "</p>", function () { S.prog.st.introSeen = 1; save("prog"); });
    $("#modal .mok").textContent = t("introGo");
  }
  /* фон загрузки и меню: картинка мира (если есть) под 3D-сценой не нужна — используем на экране загрузки */
  function loadingArt() {
    var a = art("world-" + (S.sel && S.sel.world || "town") + (innerWidth / innerHeight < 1 ? "-v" : "-h"));
    if (a) { var l = $("#loading"); l.style.backgroundImage = "linear-gradient(rgba(10,8,24,.35),rgba(10,8,24,.75)),url(" + a + ")"; }
  }
  function renderPanelSoft() { var b = $("#panel .pbody"), y = b.scrollTop; renderPanel(); b.scrollTop = y; }

  /* Шаг назад для кнопки «Назад» Android (сборка gplay). true — шаг сделан, false — уже главное меню */
  function back() {
    var x;
    if (!$("#story").hidden) { x = $("#story .skip"); if (x) x.click(); else $("#story").hidden = true; return true; }
    if (!$("#mini").hidden) { x = $("#mini .mclose"); if (x) x.click(); else $("#mini").hidden = true; return true; }
    if (!$("#modal").hidden) { $("#modal .mok").click(); return true; }
    if (panelId) { closePanel(); return true; }
    if (screen === "hud") { pause(true); return true; }
    if (screen === "pause") { pause(false); return true; }
    if (screen === "crash") { clearTimeout(crashTimer); E.endRun(); return true; }
    if (screen === "results") { toMenu(); return true; }
    return false;
  }
  window.__app = { back: back, toast: function (k) { toast(t(k)); } };

  
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
