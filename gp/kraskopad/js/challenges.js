/* Краскопад · 20 одиночных испытаний со звёздами (Э18).
   Виды: тир (выбить мишени), снайпер, гонка на квадроцикле/багги/лодке по кольцам, подъём по рампам, дуэль, выживание, охота на дронов, сбор кристаллов.
   ★ — выполнить; ★★ и ★★★ — быстрее (время) или с запасом здоровья (дуэль, выживание). Открываются по порядку: следующее — после ★ в предыдущем.
   Первые пять открыты сразу. Награда — опыт за каждую новую звезду. */
window.KP = window.KP || {};
(function (KP) {
  "use strict";
  var G = KP.G, W3 = KP.world, rnd = Math.random;
  /* id, вид, карта, локация (индекс), параметры, пороги звёзд [для ★★, для ★★★] (секунды или здоровье) */
  var LIST = [
    { t: "targets", map: "isle", poi: 1, n: 6, time: 90, s: [60, 40] },
    { t: "collect", map: "isle", poi: 6, n: 10, time: 90, s: [60, 42] },
    { t: "race", map: "isle", poi: 7, veh: "quad", time: 80, s: [50, 38] },
    { t: "climb", map: "isle", poi: 7, h: 12, time: 60, s: [40, 25] },
    { t: "duel", map: "isle", poi: 2, skill: 0.5, bot: "rusher", time: 120, s: [40, 70] },
    { t: "targets", map: "frost", poi: 4, n: 8, time: 120, s: [80, 55] },
    { t: "sniper", map: "frost", poi: 5, n: 6, time: 120, s: [80, 55] },
    { t: "race", map: "canyon", poi: 0, veh: "buggy", time: 90, s: [62, 48] },
    { t: "survive", map: "isle", poi: 4, n: 4, time: 60, s: [40, 70] },
    { t: "drones", map: "isle", poi: 9, kinds: ["scout", "scout", "gunner", "gunner", "scout", "gunner"], time: 120, s: [80, 55] },
    { t: "collect", map: "frost", poi: 7, n: 12, time: 100, s: [70, 50] },
    { t: "race", map: "isle", poi: 6, veh: "boat", time: 45, s: [26, 18] },
    { t: "duel", map: "frost", poi: 6, skill: 0.6, bot: "sniper", time: 150, s: [40, 70] },
    { t: "climb", map: "canyon", poi: 4, h: 16, time: 75, s: [50, 34] },
    { t: "targets", map: "canyon", poi: 4, n: 10, time: 130, s: [90, 65] },
    { t: "survive", map: "frost", poi: 6, n: 6, time: 90, s: [40, 70] },
    { t: "drones", map: "canyon", poi: 6, kinds: ["scout", "gunner", "heavy", "gunner", "kamikaze", "scout", "gunner", "heavy"], time: 150, s: [100, 70] },
    { t: "sniper", map: "canyon", poi: 1, n: 8, time: 140, s: [95, 70] },
    { t: "duel", map: "canyon", poi: 3, skill: 0.85, bot: "rusher", time: 150, s: [40, 70] },
    { t: "survive", map: "canyon", poi: 0, n: 6, time: 120, s: [40, 70] }
  ];
  KP.CHAL = LIST;
  KP.chalOpen = function (P, i) { return i < 5 || !!(P.chal && P.chal[i - 1] > 0); };
  KP.chalTotal = function (P) { var n = 0; Object.keys(P.chal || {}).forEach(function (k) { n += P.chal[k]; }); return n; };
  /* параметры режима для startMatch: сколько бойцов и каких */
  KP.chalMode = function (i) {
    var C = LIST[i], bots = C.t === "targets" || C.t === "sniper" ? C.n : C.t === "duel" ? 1 : C.t === "survive" ? C.n : 0;
    return { n: 1 + bots, rules: "chal", zone: [], r0: 240, chal: i, botType: C.t === "duel" ? C.bot : C.t === "survive" ? "rusher" : "dummy", botSkill: C.t === "duel" ? C.skill : C.t === "survive" ? 0.3 : 0.2 };
  };
  function spot(cx, cz, rmin, rmax) {
    for (var k = 0; k < 60; k++) {
      var a = rnd() * 6.28, r = rmin + rnd() * (rmax - rmin), x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      if (W3.height(x, z) < 0.6) continue;
      if (W3.query(x - 1, z - 1, x + 1, z + 1).some(function (c) { return c.r ? Math.hypot(c.x - x, c.z - z) < c.r + 0.8 : (x > c.x0 - 0.8 && x < c.x1 + 0.8 && z > c.z0 - 0.8 && z < c.z1 + 0.8); })) continue;
      return { x: x, z: z };
    }
    return { x: cx + rmin, z: cz };
  }
  function put(c, s) { c.x = s.x; c.z = s.z; c.y = W3.height(s.x, s.z) + 0.1; c.vy = 0; c.state = "ground"; c.onGround = true; if (c.mesh) c.mesh.visible = true; }
  var ringGeo = null;
  KP.chalSetup = function (M) {
    var C = LIST[M.chal], P0 = W3.POIS[Math.min(C.poi, W3.POIS.length - 1)], p = G.player;
    var S = G.chalState = { C: C, id: M.chal, t: 0, done: false, rings: [], ri: 0, crystals: [], got: 0, startY: 0 };
    G.plane.t = 1; G.zone.phases = []; G.zone.none = true; G.zone.r = G.zone.tr = 400;
    var st = spot(P0.x, P0.z, 2, 10); put(p, st); S.startY = p.y;
    p.slots = [{ id: 0 }, { id: C.t === "sniper" ? 5 : 4, r: 2, mag: C.t === "sniper" ? 4 : 25 }, C.t === "sniper" ? null : { id: 3, r: 1, mag: 5 }, null, null];
    p.items.tube = 2; p.items.lac = 1; p.items.gren = C.t === "drones" ? 3 : 1; p.wood = C.t === "climb" ? 300 : 40; p.sh = 50; p.cur = -1; KP.equip(p, 1);
    G.chars.forEach(function (c) {
      if (c === p) return;
      var r0 = C.t === "sniper" ? 40 : C.t === "duel" ? 25 : 12, r1 = C.t === "sniper" ? 75 : C.t === "duel" ? 30 : 34;
      put(c, spot(P0.x, P0.z, r0, r1)); if (C.t === "targets" || C.t === "sniper") c.home = { x: c.x, z: c.z };
      if (C.t === "duel" || C.t === "survive") { c.slots = [{ id: 0 }, { id: 4, r: 1, mag: 25 }, { id: 3, r: 1, mag: 5 }, null, null]; c.cur = -1; KP.equip(c, 1); c.sh = 50; }
      if (C.t === "targets" || C.t === "sniper") { c.hp = C.t === "sniper" ? 60 : 80; }
    });
    if (C.t === "race") {
      var water = C.veh === "boat";
      for (var k = 0; k < 7; k++) {
        var a = k / 7 * 6.28, x, z;
        if (water) { var aa = Math.atan2(P0.z, P0.x) + (k - 3) * 0.16, R = 176; x = Math.cos(aa) * R; z = Math.sin(aa) * R; for (var q = 0; q < 20 && W3.height(x, z) > -0.9; q++) { R += 3; x = Math.cos(aa) * R; z = Math.sin(aa) * R; } }
        else { var sp = spot(P0.x + Math.cos(a) * 45, P0.z + Math.sin(a) * 45, 0, 8); x = sp.x; z = sp.z; }
        var y = water ? 0.6 : W3.height(x, z) + 1.6;
        var ring = { x: x, z: z, y: y };
        if (!G.headless) { if (!ringGeo) ringGeo = new THREE.TorusGeometry(3.2, 0.18, 8, 28); ring.mesh = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: "#ffc531" })); ring.mesh.position.set(x, y, z); G.scene.add(ring.mesh); }
        S.rings.push(ring);
      }
      // транспорт у старта: ближайший нужного вида переносим к игроку и сажаем
      var v = (G.vehicles || []).filter(function (o) { return o.kind === C.veh; })[0];
      if (v) {
        var r0p = S.rings[0];
        if (water) { v.x = r0p.x - Math.cos(Math.atan2(r0p.z, r0p.x) + 0.5) * 12; v.z = r0p.z - Math.sin(Math.atan2(r0p.z, r0p.x) + 0.5) * 12; if (W3.height(v.x, v.z) > -0.9) { v.x = r0p.x; v.z = r0p.z; } }
        else { var last = S.rings[S.rings.length - 1], vs = spot(last.x, last.z, 0, 6); v.x = vs.x; v.z = vs.z; v.y = W3.height(v.x, v.z); }   // старт — у последнего кольца, круг замыкается
        v.yaw = Math.atan2(r0p.x - v.x, r0p.z - v.z); v.speed = 0; KP.enterVehicle(p, v);
      }
    }
    if (C.t === "collect") {
      for (var c2 = 0; c2 < C.n; c2++) {
        var cs = spot(P0.x, P0.z, 8, 40), cr = { x: cs.x, z: cs.z, y: W3.height(cs.x, cs.z) + 0.9, alive: true };
        if (!G.headless) { cr.mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), KP.mat("#7ff7ff", "glow")); cr.mesh.position.set(cr.x, cr.y, cr.z); G.scene.add(cr.mesh); }
        S.crystals.push(cr);
      }
    }
    if (C.t === "drones") C.kinds.forEach(function (kd) { KP.spawnDrone(kd, P0.x, P0.z, 45 + rnd() * 20); });
    if (C.t === "survive") { G.botDmgMul = 0.45; G.chars.forEach(function (c, k) { if (c.ai) { c.ai.target = p; c.ai.reactT = 1 + k * 1.5; } }); }
  };
  KP.chalClear = function () {
    var S = G.chalState; if (!S) return;
    S.rings.forEach(function (r) { if (r.mesh) G.scene.remove(r.mesh); }); S.crystals.forEach(function (c) { if (c.mesh) G.scene.remove(c.mesh); });
    (G.drones || []).forEach(function (d) { if (d.mesh) G.scene.remove(d.mesh); }); G.drones = [];
    G.chalState = null;
  };
  function end(ok) {
    var S = G.chalState, C = S.C, p = G.player, stars = 0;
    if (ok) {
      stars = 1;
      if (C.t === "duel" || C.t === "survive") { var hp = p.hp + p.sh; if (hp >= C.s[0]) stars = 2; if (hp >= C.s[1]) stars = 3; }
      else { if (S.t <= C.s[0]) stars = 2; if (S.t <= C.s[1]) stars = 3; }
    }
    S.done = true; G.win = ok; p.place = ok ? 1 : 2; G.teamPlace = {}; G.teamPlace[p.team] = p.place; if (!p.alive) p.alive = true;
    G.chalRes = { id: S.id, stars: stars, t: Math.round(S.t) };
    return true;
  }
  KP.chalStep = function (dt) {
    var S = G.chalState; if (!S || S.done) return false;
    var C = S.C, p = G.player; S.t += dt;
    if (!p.alive && C.t !== "survive") return end(false);
    if (C.t === "survive") { if (!p.alive) return end(false); if (S.t >= C.time) return end(true);
      G.chars.forEach(function (c) { if (c !== p && c.state === "out" && c.outT > 3) { c.alive = true; c.state = "ground"; c.hp = 100; c.outT = 0; if (c.mesh) { G.scene.remove(c.mesh); c.mesh = KP.charMesh(c.skin, c.paint); G.scene.add(c.mesh); } c.cur = -1; KP.equip(c, 1); var s2 = spot(p.x, p.z, 30, 40); put(c, s2); if (c.ai) c.ai.target = p; } });
      return false; }
    if (S.t >= C.time) return end(false);
    if (C.t === "targets" || C.t === "sniper" || C.t === "duel") { if (!G.chars.some(function (c) { return c !== p && c.alive; })) return end(true); }
    if (C.t === "drones") { KP.dronesStep(dt); if (!G.drones.some(function (d) { return d.alive; })) return end(true); }
    if (C.t === "climb") { if (p.y - S.startY >= C.h) return end(true); }
    if (C.t === "collect") {
      S.crystals.forEach(function (c) { if (c.alive && Math.abs(c.x - p.x) < 1.7 && Math.abs(c.z - p.z) < 1.7) { c.alive = false; S.got++; if (c.mesh) G.scene.remove(c.mesh); KP.sfx && KP.sfx("chest", 0, 0, true); } });
      if (S.got >= C.n) return end(true);
    }
    if (p.ai) {   // автоигрок (проверка): ведём к кольцу / кристаллу
      var tg = C.t === "race" ? S.rings[S.ri] : C.t === "collect" ? S.crystals.filter(function (c) { return c.alive; }).sort(function (a2, b2) { return Math.hypot(a2.x - p.x, a2.z - p.z) - Math.hypot(b2.x - p.x, b2.z - p.z); })[0] : null;
      if (tg) { p.ai.goal = { x: tg.x, z: tg.z }; p.ai.goalKind = "obj"; p.ai.goalT = 2; }
    }
    if (C.t === "race") {
      var r = S.rings[S.ri];
      if (r && Math.hypot(p.x - r.x, p.z - r.z) < 4.2 && Math.abs(p.y - r.y) < 4) {
        S.ri++; if (r.mesh) r.mesh.material.color.set("#3a4048"); KP.sfx && KP.sfx("pick", 0, 0, true);
        if (S.ri >= S.rings.length) return end(true);
      }
    }
    return false;
  };
  KP.chalHud = function () {
    var S = G.chalState; if (!S) return null;
    var C = S.C, p = G.player, left = Math.max(0, C.time - S.t), mm = Math.floor(left / 60) + ":" + ("0" + Math.floor(left % 60)).slice(-2), prog = "";
    if (C.t === "targets" || C.t === "sniper") prog = KP.t("chalLeft", G.chars.filter(function (c) { return c !== p && c.alive; }).length);
    else if (C.t === "collect") prog = S.got + " / " + C.n;
    else if (C.t === "race") prog = KP.t("chalRing", Math.min(S.ri + 1, S.rings.length), S.rings.length);
    else if (C.t === "climb") prog = Math.max(0, Math.round(p.y - S.startY)) + " / " + C.h + " " + KP.t("unitM");
    else if (C.t === "drones") prog = KP.t("dronesLeft", (G.drones || []).filter(function (d) { return d.alive; }).length);
    else if (C.t === "survive") prog = KP.t("chalSurvive");
    return KP.t("chal_" + C.t) + " · " + prog + " · " + mm;
  };
  KP.chalRender = function () {
    var S = G.chalState; if (!S) return;
    var t = performance.now() / 1000;
    S.rings.forEach(function (r, i) { if (r.mesh) { r.mesh.rotation.y = Math.atan2(G.player.x - r.x, G.player.z - r.z); r.mesh.material.color.set(i < S.ri ? "#3a4048" : i === S.ri ? "#ffc531" : "#7ff7ff"); } });
    S.crystals.forEach(function (c) { if (c.mesh) { c.mesh.rotation.y = t * 1.6; } });
    if (KP.pveRender) KP.pveRender(0);
  };
  KP.chalMini = function (ctx, X) {
    var S = G.chalState; if (!S) return;
    S.rings.forEach(function (r, i) { if (i < S.ri) return; ctx.strokeStyle = i === S.ri ? "#ffc531" : "#7ff7ff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(r.x), X(r.z), 3.5, 0, 6.3); ctx.stroke(); });
    S.crystals.forEach(function (c) { if (c.alive) { ctx.fillStyle = "#7ff7ff"; ctx.fillRect(X(c.x) - 2, X(c.z) - 2, 4, 4); } });
    (G.drones || []).forEach(function (d) { if (d.alive) { ctx.fillStyle = "#ff4f6a"; ctx.fillRect(X(d.x) - 2, X(d.z) - 2, 4, 4); } });
  };
})(window.KP);
