/* Краскопад · командные и раундовые режимы (Э11).
   «Захват точек» 8×8: три точки A/B/C, удержание приносит очки, до 150 или 6 минут.
   «Командный бой» 12×12: до 40 выбиваний команды или 6 минут.
   В обоих — старт на земле с набором оружия, возрождение через 5 с у своей базы, арена ограничена кругом (снаружи хмарь).
   «Последний круг»: 3 коротких раунда по 16 бойцов в маленькой быстро сужающейся зоне, очки за место в раунде. */
window.KP = window.KP || {};
(function (KP) {
  "use strict";
  var G = KP.G, W3 = KP.world, rnd = Math.random;
  var RESPAWN = 5, TDM_GOAL = 40, CAP_GOAL = 150, TIME = 360, LR_ROUNDS = 3, LR_PTS = [10, 7, 5, 4, 3, 2];

  function landPOI() { var list = W3.POIS.filter(function (p) { return W3.height(p.x, p.z) > 0.6; }); return list[Math.floor(rnd() * list.length)] || { x: 0, z: 0 }; }
  function freeSpot(cx, cz, R) {
    for (var k = 0; k < 40; k++) {
      var a = rnd() * 6.28, r = Math.sqrt(rnd()) * R, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      if (W3.height(x, z) < 0.5) continue;
      var near = W3.query(x - 1.2, z - 1.2, x + 1.2, z + 1.2), bad = false;
      for (var i = 0; i < near.length; i++) { var c = near[i]; if (c.r ? Math.hypot(c.x - x, c.z - z) < c.r + 0.8 : (x > c.x0 - 0.8 && x < c.x1 + 0.8 && z > c.z0 - 0.8 && z < c.z1 + 0.8)) { bad = true; break; } }
      if (!bad) return { x: x, z: z };
    }
    return { x: cx, z: cz };
  }
  function loadout(c) {
    c.slots = [{ id: 0 }, { id: 4, r: Math.floor(rnd() * 3), mag: 25 }, null, null, null];
    var sid = [1, 2, 3, 5][Math.floor(rnd() * 4)]; c.slots[2] = { id: sid, r: Math.floor(rnd() * 2), mag: KP.WEAPONS[sid].mag };
    c.items.tube = 2; c.items.lac = 1; c.items.gren = 1; c.wood = 60; c.hp = 100; c.sh = 50; c.cur = -1; KP.equip(c, 1);
  }
  function place(c, spot) { c.x = spot.x; c.z = spot.z; c.y = W3.height(c.x, c.z) + 0.1; c.vy = 0; c.state = "ground"; c.onGround = true; if (c.mesh) c.mesh.visible = true; }
  function baseOf(team) { var M = G.modeState; return team === M.teamA ? M.baseA : M.baseB; }
  function revive(c) {
    c.alive = true; c.state = "ground"; c.outT = 0; c.healT = 0; c.reloadT = 0; c.emote = null;
    if (c.mesh) { G.scene.remove(c.mesh); c.mesh = KP.charMesh(c.skin, c.paint); G.scene.add(c.mesh); }
    loadout(c); place(c, freeSpot(baseOf(c.team).x, baseOf(c.team).z, 10));
    if (c.ai) { c.ai.target = null; c.ai.goal = null; c.ai.cover = null; }
  }

  /* подготовка после создания бойцов */
  KP.modeSetup = function (M) {
    if (M.rules === "pve") { G.modeState = { rules: "pve", t: 0 }; KP.pveSetup(M); return; }
    if (M.rules === "chal") { G.modeState = { rules: "chal", t: 0 }; KP.chalSetup(M); return; }
    var S = G.modeState = { rules: M.rules, t: 0, score: [0, 0], teamA: 0, teamB: 1 };
    G.plane.t = 1;
    if (M.rules === "lr") { S.round = 1; S.pts = {}; G.chars.forEach(function (c) { S.pts[c.id] = 0; }); newRound(true); return; }
    var C = landPOI(), a = rnd() * 6.28, R = M.arena;
    S.cx = C.x; S.cz = C.z; S.R = R;
    S.baseA = { x: C.x + Math.cos(a) * R * 0.6, z: C.z + Math.sin(a) * R * 0.6 }; S.baseB = { x: C.x - Math.cos(a) * R * 0.6, z: C.z - Math.sin(a) * R * 0.6 };
    G.chars.forEach(function (c) { loadout(c); place(c, freeSpot(baseOf(c.team).x, baseOf(c.team).z, 10)); });
    var Z = G.zone; Z.cx = Z.tx = Z.sx = C.x; Z.cz = Z.tz = Z.sz = C.z; Z.r = Z.tr = Z.sr = R; Z.dps = 8; Z.phases = []; Z.none = true;
    if (M.rules === "cap") {
      S.points = [-1, 0, 1].map(function (k, i) {
        var px = C.x + Math.cos(a + Math.PI / 2) * k * R * 0.45, pz = C.z + Math.sin(a + Math.PI / 2) * k * R * 0.45, sp = freeSpot(px, pz, 6);
        return { name: "ABC"[i], x: sp.x, z: sp.z, own: -1, prog: 0 };
      });
      if (!G.headless) S.points.forEach(function (pt) { pt.mesh = pointMesh(pt); G.scene.add(pt.mesh); });
    }
  };
  function newRound(first) {
    var S = G.modeState, C = landPOI();
    S.t = 0; S.cx = C.x; S.cz = C.z; S.roundEnd = false;
    G.chars.forEach(function (c) {
      if (!first) {
        c.alive = true; c.outT = 0; c.healT = 0; c.emote = null;
        if (c.mesh) { G.scene.remove(c.mesh); c.mesh = KP.charMesh(c.skin, c.paint); G.scene.add(c.mesh); }
      }
      loadout(c); place(c, freeSpot(C.x, C.z, 50));
      if (c.ai) { c.ai.target = null; c.ai.goal = null; }
    });
    KP.zoneInit("lr"); var Z = G.zone; Z.cx = Z.sx = C.x; Z.cz = Z.sz = C.z;
    var P0 = Z.phases[0]; Z.tr = P0[2]; var aa = rnd() * 6.28, dd = rnd() * (Z.r - Z.tr) * 0.6; Z.tx = C.x + Math.cos(aa) * dd; Z.tz = C.z + Math.sin(aa) * dd;
    if (KP.ui && !G.headless) KP.ui.big(KP.t("lrRound", S.round, LR_ROUNDS), 2.2);
  }
  function pointMesh(pt) {
    var g = new THREE.Group(), y = W3.height(pt.x, pt.z);
    var ring = new THREE.Mesh(new THREE.RingGeometry(5.6, 6, 40), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.7, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.08; g.add(ring);
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5, 6), KP.mat("#c9cdd2")); pole.position.y = 2.5; g.add(pole);
    var flag = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 0.04), new THREE.MeshLambertMaterial({ color: "#ffffff", emissive: "#333333" })); flag.position.set(0.72, 4.5, 0); g.add(flag);
    g.position.set(pt.x, y, pt.z); g.userData = { ring: ring, flag: flag }; return g;
  }
  KP.modeClear = function () { if (KP.chalClear) KP.chalClear(); if (G.pve) { (G.pve.extra || []).forEach(function (c) { var i = KP.chests.indexOf(c); if (i >= 0) KP.chests.splice(i, 1); if (c.mesh && c.mesh.parent) c.mesh.parent.remove(c.mesh); }); KP.pveClear(); } var S = G.modeState; if (S && S.points) S.points.forEach(function (pt) { if (pt.mesh) G.scene.remove(pt.mesh); }); G.modeState = null; };
  function teamCol(t) { return t < 0 ? "#ffffff" : t === G.player.team ? "#2fd6ff" : "#ff4f6a"; }

  /* шаг режима; возвращает true, когда матч закончен (и выставляет G.win, место игрока) */
  KP.modeStep = function (dt) {
    var S = G.modeState; if (!S) return false;
    S.t += dt;
    if (S.rules === "pve") return KP.pveStep(dt);
    if (S.rules === "chal") return KP.chalStep(dt);
    var p = G.player;
    if (S.rules === "lr") return stepLR(dt);
    // возрождение
    G.chars.forEach(function (c) { if (c.state === "out" && c.outT > RESPAWN) revive(c); });
    // очки команды за выбивания (TDM) и за удержание точек
    if (S.rules === "tdm") { S.score[0] = G.chars.filter(function (c) { return c.team === 0; }).reduce(function (s, c) { return s + c.kos; }, 0); S.score[1] = G.chars.filter(function (c) { return c.team === 1; }).reduce(function (s, c) { return s + c.kos; }, 0); }
    if (S.rules === "cap") {
      S.points.forEach(function (pt) {
        var n = [0, 0]; G.chars.forEach(function (c) { if (c.alive && c.state === "ground" && Math.hypot(c.x - pt.x, c.z - pt.z) < 6) n[c.team]++; });
        var d = n[0] - n[1];
        if (d) { pt.prog = Math.max(-1, Math.min(1, pt.prog + Math.sign(d) * Math.min(3, Math.abs(d)) * dt * 0.12)); }
        var own = pt.prog >= 1 ? 0 : pt.prog <= -1 ? 1 : (Math.abs(pt.prog) < 0.01 ? -1 : pt.own);
        if (own !== pt.own) { pt.own = own; if (own >= 0 && KP.ui && !G.headless) KP.ui.toast(KP.t(own === p.team ? "capOurs" : "capTheirs", pt.name), 2); }
        if (pt.own >= 0) { S.acc = S.acc || [0, 0]; S.acc[pt.own] += dt; if (S.acc[pt.own] >= 2) { S.acc[pt.own] -= 2; S.score[pt.own] += 1; } }
      });
    }
    var goal = S.rules === "tdm" ? TDM_GOAL : CAP_GOAL;
    if (S.score[0] >= goal || S.score[1] >= goal || S.t >= TIME) {
      var mine = S.score[p.team], theirs = S.score[1 - p.team];
      G.win = mine > theirs; p.place = G.win ? 1 : 2; G.teamPlace = {}; G.teamPlace[p.team] = p.place;
      return true;
    }
    return false;
  };
  function stepLR(dt) {
    var S = G.modeState, alive = G.chars.filter(function (c) { return c.alive; });
    if (!S.roundEnd && (alive.length <= 1 || S.t > 150)) {
      // очки раунда: место = порядок выбывания
      var order = G.chars.slice().sort(function (a, b) { return (a.alive ? 0 : a.place || 99) - (b.alive ? 0 : b.place || 99); });
      order.forEach(function (c, i) { S.pts[c.id] += LR_PTS[i] || 1; });
      S.roundEnd = true; S.wait = 2.5;
      if (KP.ui && !G.headless) KP.ui.big(KP.t("lrRoundEnd", S.round), 2.2);
    }
    if (S.roundEnd) {
      S.wait -= dt;
      if (S.wait <= 0) {
        if (S.round >= LR_ROUNDS) {
          var rank = G.chars.slice().sort(function (a, b) { return S.pts[b.id] - S.pts[a.id]; });
          var p = G.player; p.place = rank.indexOf(p) + 1; G.win = p.place === 1; G.teamPlace = {}; G.teamPlace[p.team] = p.place;
          if (!p.alive) { p.alive = true; }
          return true;
        }
        S.round++; newRound(false);
      }
    }
    return false;
  }
  /* куда идти боту без цели: точки захвата / к центру арены */
  KP.objGoal = function (ch) {
    var S = G.modeState; if (!S || S.rules === "lr") return null;
    if (S.rules === "chal") return ch.home ? { x: ch.home.x + (rnd() - 0.5) * 10, z: ch.home.z + (rnd() - 0.5) * 10 } : null;   // мишени держатся у своего места
    if (S.rules === "pve") { var b = G.pve.base, a = ch.id * 1.7 + G.time * 0.05; return { x: b.x + Math.cos(a) * (6 + (ch.id % 3) * 4), z: b.z + Math.sin(a) * (6 + (ch.id % 3) * 4) }; }
    if (S.rules === "cap") {
      var best = null, bd = 1e9;
      S.points.forEach(function (pt) { var want = pt.own !== ch.team || Math.abs(pt.prog) < 1; var d = Math.hypot(pt.x - ch.x, pt.z - ch.z) + (want ? 0 : 60) + (ch.id % 3) * 8; if (d < bd) { bd = d; best = pt; } });
      return best ? { x: best.x + (rnd() - 0.5) * 6, z: best.z + (rnd() - 0.5) * 6 } : null;
    }
    var en = G.chars.filter(function (c) { return c.alive && c.team !== ch.team; });
    if (!en.length) return null;
    var e = en[Math.floor(rnd() * en.length)];
    return { x: (e.x + S.cx) / 2 + (rnd() - 0.5) * 20, z: (e.z + S.cz) / 2 + (rnd() - 0.5) * 20 };
  };
  KP.modeHud = function () {
    var S = G.modeState; if (!S) return null;
    if (S.rules === "pve") return KP.pveHud();
    if (S.rules === "chal") return KP.chalHud();
    var p = G.player, left = Math.max(0, TIME - S.t), mm = Math.floor(left / 60) + ":" + ("0" + Math.floor(left % 60)).slice(-2);
    if (S.rules === "lr") return KP.t("lrHud", S.round, LR_ROUNDS, S.pts[p.id]);
    var s = KP.t("teamUs") + " " + S.score[p.team] + " : " + S.score[1 - p.team] + " " + KP.t("teamThem") + " · " + mm;
    if (S.rules === "cap") s += " · " + S.points.map(function (pt) { return pt.name + (pt.own === p.team ? "●" : pt.own >= 0 ? "○" : "·"); }).join(" ");
    if (!p.alive) s += " · " + KP.t("respawnIn", Math.max(0, Math.ceil(RESPAWN - p.outT)));
    return s;
  };
  KP.modeRender = function (dt) {
    if (G.pve) KP.pveRender(dt); if (G.chalState) KP.chalRender();
    var S = G.modeState; if (!S || !S.points) return;
    S.points.forEach(function (pt) {
      if (!pt.mesh) return; var u = pt.mesh.userData, c = teamCol(pt.own);
      u.flag.material.color.set(c); u.ring.material.color.set(Math.abs(pt.prog) > 0.02 && Math.abs(pt.prog) < 1 ? "#ffc531" : c);
      u.flag.position.y = 1.2 + 3.3 * Math.abs(pt.prog);
    });
  };
  KP.modeMini = function (ctx, X, k) {
    var S = G.modeState; if (!S) return;
    if (G.pve) KP.pveMini(ctx, X); if (G.chalState) KP.chalMini(ctx, X);
    if (S.points) S.points.forEach(function (pt) { ctx.fillStyle = teamCol(pt.own); ctx.beginPath(); ctx.arc(X(pt.x), X(pt.z), 4, 0, 6.3); ctx.fill(); ctx.fillStyle = "#000"; ctx.font = "bold 7px sans-serif"; ctx.textAlign = "center"; ctx.fillText(pt.name, X(pt.x), X(pt.z) + 2.5); });
  };
})(window.KP);
