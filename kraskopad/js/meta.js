/* Краскопад · мета-прогрессия (Э6): уровень, боевой пропуск (50 ступеней, бесплатная ветка + Премиум), 30 бойцов, раскраски оружия, эмоции,
   задания дня и недели, расширенная статистика. Только логика и данные; экраны рисует main.js.
   Правило владельца: никаких вечных замков. У каждой вещи понятное условие: уровень, ступень пропуска, задание.
   Вещи ветки Премиума открываются Премиумом ИЛИ уровнем (указан в подписи) и после открытия остаются навсегда. */
window.KP = window.KP || {};
(function (KP) {
  "use strict";
  var TIERS = 50, TIER_SIZE = 300, SEASON = 2;   // идёт сезон 2; вещи сезона 1 доступны по ступени сезона 1 или уровню (10 + ступень)

  /* эмоции: anim — как двигаются руки/тело (main.js) */
  var EMOTES = [
    { key: "em0", anim: "wave" }, { key: "em1", anim: "salute" },
    { key: "em2", anim: "dance", pass: 3 }, { key: "em3", anim: "laugh", pass: 7 }, { key: "em4", anim: "flex", pass: 12 },
    { key: "em5", anim: "sit", pass: 20 }, { key: "em6", anim: "spin", prem: 25, lvl: 35 },
    { key: "em7", anim: "wave", pass: 6, s: 2 }, { key: "em8", anim: "dance", pass: 18, s: 2 }, { key: "em9", anim: "flex", prem: 30, lvl: 50, s: 2 }
  ];
  /* раскраски оружия: оттенок поверх цветов модели */
  var WRAPS = [
    { key: "wr0", tint: "#ffffff" }, { key: "wr1", tint: "#ff7ac0", pass: 4 }, { key: "wr2", tint: "#9fc27a", pass: 8 }, { key: "wr3", tint: "#dff1ff", pass: 16 },
    { key: "wr4", tint: "#ff9a5c", pass: 24 }, { key: "wr5", tint: "#7fd3ff", pass: 32 }, { key: "wr6", tint: "#ffd36a", pass: 40 },
    { key: "wr7", tint: "prism", prem: 15, lvl: 42 }, { key: "wr8", tint: "#5b5f66", prem: 33, lvl: 48 },
    { key: "wr9", tint: "#a8f0ff", pass: 4, s: 2 }, { key: "wr10", tint: "#b98cff", pass: 14, s: 2 }, { key: "wr11", tint: "#7dffb0", pass: 28, s: 2 }, { key: "wr12", tint: "prism", prem: 40, lvl: 55, s: 2 }
  ];

  function unlockSpec(kind, i) {
    if (kind === "skin") return KP.SKINS[i]; if (kind === "emote") return EMOTES[i]; if (kind === "wrap") return WRAPS[i]; if (kind === "paint") return KP.PAINTS[i];
    return {};
  }
  function lvlInfo(xp) { var L = 1, need = 100; while (xp >= need && L < 100) { xp -= need; L++; need = 100 + 25 * (L - 1); } return { L: L, cur: xp, need: need }; }
  function passTier(P, season) { var pp = Number((season || SEASON) === 1 ? P.pp : P.pp2) || 0, t = Math.min(TIERS, Math.floor(pp / TIER_SIZE)); return { tier: t, cur: t >= TIERS ? TIER_SIZE : pp % TIER_SIZE, size: TIER_SIZE }; }
  function premOn() { try { return !!(window.Premium && window.Premium.active()); } catch (e) { return false; } }
  /* открыта ли вещь */
  function isOpen(P, kind, i) {
    var s = unlockSpec(kind, i); if (!s) return false;
    if (P.own && P.own[kind + i]) return true;
    var L = lvlInfo(P.xp || 0).L, ss = s.s || 1, T = passTier(P, ss).tier, old = ss < SEASON;
    if (s.ch) return !!(P.ch && P.ch[s.ch]);
    if (s.prem) return (premOn() && T >= s.prem) || L >= s.lvl;
    if (s.pass) return T >= s.pass || (old && L >= 10 + s.pass);
    if (s.lvl) return L >= s.lvl;
    return true;
  }
  function lockText(kind, i) {
    var s = unlockSpec(kind, i), t = KP.t;
    if (s.ch) return t("lockCh", t("ch_" + s.ch));
    if (s.prem) return t("lockPrem", s.prem, s.lvl);
    if (s.pass) return (s.s || 1) < SEASON ? t("lockPassOld", s.s || 1, s.pass, 10 + s.pass) : t("lockPass", s.pass);
    if (s.lvl) return t("lockLvl", s.lvl);
    return "";
  }
  /* всё открытое (для сравнения «до/после» матча); вещи Премиума запоминаются навсегда */
  function openList(P) {
    var out = [];
    [["skin", KP.SKINS.length], ["emote", EMOTES.length], ["wrap", WRAPS.length], ["paint", KP.PAINTS.length]].forEach(function (k) {
      for (var i = 0; i < k[1]; i++) if (isOpen(P, k[0], i)) { out.push(k[0] + i); var s = unlockSpec(k[0], i); if (s.prem) { P.own = P.own || {}; P.own[k[0] + i] = 1; } }
    });
    return out;
  }
  function itemName(code) {
    var m = /^(skin|emote|wrap|paint)(\d+)$/.exec(code); if (!m) return code;
    var i = +m[2];
    return m[1] === "skin" ? KP.t("sk" + i) : m[1] === "emote" ? KP.t("emote") + " · " + KP.t(EMOTES[i].key) : m[1] === "wrap" ? KP.t("wrap") + " · " + KP.t(WRAPS[i].key) : KP.t("paints") + " · " + KP.t("pc" + i);
  }
  /* награды ступеней пропуска (для экрана пропуска) */
  function passRewards(season) {
    var free = {}, prem = {}, S = season || SEASON;
    function put(tab, t, code) { (tab[t] = tab[t] || []).push(code); }
    function add(list, kind) { list.forEach(function (s, i) { if ((s.s || 1) !== S) return; if (s.prem) put(prem, s.prem, kind + i); else if (s.pass) put(free, s.pass, kind + i); }); }
    add(KP.SKINS, "skin"); add(EMOTES, "emote"); add(WRAPS, "wrap");
    return { free: free, prem: prem };
  }

  /* ---------- задания дня и недели ---------- */
  var DAILY = [
    { t: "ko", g: [3, 5] }, { t: "dmg", g: [400, 800] }, { t: "built", g: [10, 20] }, { t: "chests", g: [3, 5] }, { t: "top10", g: [1, 2] },
    { t: "play", g: [2, 3] }, { t: "thrown", g: [3, 5] }, { t: "driven", g: [300, 600] }, { t: "heals", g: [3, 5] }
  ];
  var WEEKLY = [{ t: "ko", g: [20, 30] }, { t: "wins", g: [1, 2] }, { t: "top5", g: [3, 5] }, { t: "chests", g: [15, 25] }, { t: "dmg", g: [4000, 6000] }, { t: "built", g: [50, 80] }, { t: "play", g: [8, 12] }];
  function seeded(n) { return function () { n = (n * 16807) % 2147483647; return (n - 1) / 2147483646; }; }
  function dayKey(d) { return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function weekKey(d) { var t = new Date(d.getFullYear(), d.getMonth(), d.getDate()); t.setDate(t.getDate() - ((t.getDay() + 6) % 7)); return "w" + dayKey(t); }
  function gen(pool, n, key) {
    var h = 7; for (var i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 2147483647;
    var r = seeded(h || 1), list = pool.slice(), out = [];
    while (out.length < n && list.length) { var k = Math.floor(r() * list.length), q = list.splice(k, 1)[0]; out.push({ t: q.t, g: q.g[Math.floor(r() * q.g.length)], p: 0, d: 0 }); }
    return out;
  }
  function ensureQuests(P, now) {
    var d = now || new Date(), dk = dayKey(d), wk = weekKey(d);
    if (!P.dq || P.dq.k !== dk) P.dq = { k: dk, l: gen(DAILY, 3, dk) };
    if (!P.wq || P.wq.k !== wk) P.wq = { k: wk, l: gen(WEEKLY, 3, wk) };
  }
  function questText(q) { return KP.t("q_" + q.t, q.g); }
  var SEASONQ = [{ t: "crystals", g: 30 }, { t: "wins", g: 3 }, { t: "ko", g: 100 }, { t: "play", g: 20 }, { t: "drops", g: 5 }, { t: "driven", g: 3000 }];
  function ensureSeason(P) { if (!P.sq || P.sq.k !== "s" + SEASON) P.sq = { k: "s" + SEASON, l: SEASONQ.map(function (q) { return { t: q.t, g: q.g, p: 0, d: 0 }; }) }; }
  /* итог матча → прогресс заданий, опыт и очки пропуска за выполненные */
  function applyMatch(P, s) {
    ensureQuests(P);
    ensureSeason(P);
    var add = { crystals: s.crystals || 0, drops: s.drops || 0, ko: s.kos, dmg: s.dmg, built: s.built, chests: s.chests, top10: s.place <= 10 ? 1 : 0, top5: s.place <= 5 ? 1 : 0, wins: s.win ? 1 : 0, play: 1, thrown: s.thrown, driven: Math.round(s.driven), heals: s.heals };
    var done = [], xp = 0;
    [[P.dq.l, 150], [P.wq.l, 500], [P.sq.l, 600]].forEach(function (L) {
      L[0].forEach(function (q) { if (q.d) return; q.p = Math.min(q.g, q.p + (add[q.t] || 0)); if (q.p >= q.g) { q.d = 1; done.push(questText(q)); xp += L[1]; } });
    });
    return { done: done, xp: xp };
  }

  /* ---------- достижения (Э13): 36 штук, у каждого понятный счётчик; +100 опыта за каждое ---------- */
  function st(P, k) { return Number(P.st && P.st[k]) || 0; }
  function wk(P, w) { return Number(P.ws && P.ws[w] && P.ws[w].k) || 0; }
  var ACH = [
    ["a_win1", function (P) { return st(P, "w"); }, 1], ["a_win10", function (P) { return st(P, "w"); }, 10], ["a_win50", function (P) { return st(P, "w"); }, 50],
    ["a_ko10", function (P) { return st(P, "ko"); }, 10], ["a_ko100", function (P) { return st(P, "ko"); }, 100], ["a_ko500", function (P) { return st(P, "ko"); }, 500], ["a_ko1000", function (P) { return st(P, "ko"); }, 1000],
    ["a_kmax5", function (P) { return st(P, "kmax"); }, 5], ["a_kmax10", function (P) { return st(P, "kmax"); }, 10],
    ["a_dmg10k", function (P) { return st(P, "dmg"); }, 10000], ["a_dmg100k", function (P) { return st(P, "dmg"); }, 100000],
    ["a_build100", function (P) { return st(P, "built"); }, 100], ["a_build1000", function (P) { return st(P, "built"); }, 1000],
    ["a_drive1", function (P) { return st(P, "drv"); }, 1000], ["a_drive10", function (P) { return st(P, "drv"); }, 10000],
    ["a_chest50", function (P) { return st(P, "chests"); }, 50], ["a_chest500", function (P) { return st(P, "chests"); }, 500],
    ["a_gren50", function (P) { return st(P, "thr"); }, 50], ["a_play10", function (P) { return st(P, "m"); }, 10], ["a_play50", function (P) { return st(P, "m"); }, 50], ["a_play200", function (P) { return st(P, "m"); }, 200],
    ["a_top5", function (P) { return st(P, "t5"); }, 25], ["a_lvl10", function (P) { return lvlInfo(P.xp || 0).L; }, 10], ["a_lvl25", function (P) { return lvlInfo(P.xp || 0).L; }, 25], ["a_lvl50", function (P) { return lvlInfo(P.xp || 0).L; }, 50],
    ["a_tut", function (P) { return P.tut ? 1 : 0; }, 1], ["a_frost", function (P) { return st(P, "wFrost"); }, 1], ["a_trio", function (P) { return st(P, "wTrio"); }, 1],
    ["a_cap", function (P) { return st(P, "wCap"); }, 1], ["a_tdm", function (P) { return st(P, "wTdm"); }, 1], ["a_lr", function (P) { return st(P, "wLr"); }, 1],
    ["a_snipe", function (P) { return wk(P, 5); }, 25], ["a_shotgun", function (P) { return wk(P, 3); }, 50], ["a_axe", function (P) { return wk(P, 0); }, 10],
    ["a_cryst", function (P) { return st(P, "cryst"); }, 100], ["a_drops", function (P) { return st(P, "drops"); }, 10], ["a_pass2", function (P) { return passTier(P, 2).tier; }, 50]
  ];
  /* новые выполненные достижения (отмечает и возвращает список ключей) */
  function checkAch(P) {
    P.ach = P.ach || {}; var got = [];
    ACH.forEach(function (a) { if (!P.ach[a[0]] && a[1](P) >= a[2]) { P.ach[a[0]] = 1; got.push(a[0]); } });
    return got;
  }
  function achList(P) { return ACH.map(function (a) { return { key: a[0], cur: Math.min(a[1](P), a[2]), goal: a[2], done: !!(P.ach && P.ach[a[0]]) }; }); }
  KP.META = { ACH: ACH, checkAch: checkAch, achList: achList, SEASON: SEASON, ensureSeason: ensureSeason, EMOTES: EMOTES, WRAPS: WRAPS, TIERS: TIERS, TIER_SIZE: TIER_SIZE, lvlInfo: lvlInfo, passTier: passTier, isOpen: isOpen, lockText: lockText, openList: openList, itemName: itemName, passRewards: passRewards, ensureQuests: ensureQuests, questText: questText, applyMatch: applyMatch, premOn: premOn };
})(window.KP);
