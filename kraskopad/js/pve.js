/* Краскопад · PvE «Оборона маяка» (Э17): игрок и три напарника защищают маяк от 10 волн дронов.
   Дроны: разведчик (быстрый, хрупкий), стрелок, тяжёлый (стреляет краской по площади), камикадзе (пикирует на маяк), босс на 10-й волне.
   Маяк — 2500 прочности (урон дронов по маяку вдвое меньше). Между волнами 10 с: ящик снабжения у маяка, время построить стены. Выбитые возвращаются через 8 с у маяка.
   Между волнами маяк чинится на 12 %. Звёзды: ★ — выстоять 10 волн, ★★ — маяк цел больше чем на половину, ★★★ — больше чем на 80 %. */
window.KP = window.KP || {};
(function (KP) {
  "use strict";
  var G = KP.G, W3 = KP.world, rnd = Math.random;
  var WAVES = 10, BASE_HP = 2500, BREAK = 10, RESPAWN = 8;
  var DT = {   // виды дронов
    scout: { hp: 40, spd: 13, alt: 7, dmg: 6, rate: 1.4, rng: 45, size: 0.7, col: "#c9cdd2", acc: 0.5, noBase: true },
    gunner: { hp: 90, spd: 8, alt: 9, dmg: 9, rate: 1.3, rng: 45, size: 0.95, col: "#3a3f46", acc: 0.7 },
    heavy: { hp: 260, spd: 5, alt: 11, dmg: 22, rate: 0.5, rng: 55, size: 1.5, col: "#5a2a2a", acc: 0.6, splash: 3.5 },
    kamikaze: { hp: 50, spd: 14, alt: 6, dmg: 60, rate: 0, rng: 0, size: 0.8, col: "#c98a2f", acc: 1, kam: true },
    boss: { hp: 2600, spd: 4, alt: 16, dmg: 18, rate: 5, rng: 70, size: 3.2, col: "#2a2d31", acc: 0.65, boss: true, splash: 2.5 }
  };
  var geos = {};
  function droneGeo(kind) {
    if (geos[kind]) return geos[kind];
    var d = DT[kind], s = d.size, m = new KP.Merger(1), B = new THREE.BoxGeometry(1, 1, 1);
    m.add(new THREE.SphereGeometry(0.6, 12, 8), 0, 0, 0, 0, 0, 0, s, s * 0.55, s, d.col);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (o) { m.add(B, o[0] * s * 0.6, 0, o[1] * s * 0.6, 0, Math.atan2(o[0], o[1]), 0, 0.12 * s, 0.08 * s, s * 0.9, "#2a2e33"); m.add(new THREE.CylinderGeometry(0.42 * s, 0.42 * s, 0.03, 14), o[0] * s * 0.95, 0.12 * s, o[1] * s * 0.95, 0, 0, 0, 1, 1, 1, "#9aa0a6"); });
    m.add(new THREE.SphereGeometry(0.16 * s, 8, 6), 0, -0.05 * s, 0.55 * s, 0, 0, 0, 1, 1, 1, "#ff2f4f");
    if (kind === "heavy" || kind === "boss") m.add(new THREE.CylinderGeometry(0.15 * s, 0.15 * s, 0.9 * s, 8), 0, -0.4 * s, 0.3 * s, Math.PI / 2, 0, 0, 1, 1, 1, "#1b1d20");
    if (kind === "boss") m.add(new THREE.TorusGeometry(0.9 * s, 0.06 * s, 6, 24), 0, 0.05, 0, Math.PI / 2, 0, 0, 1, 1, 1, "#ff2f4f");
    geos[kind] = m.build(); return geos[kind];
  }
  var droneMat = null;
  function waveList(n) {
    var L = [], k;
    for (k = 0; k < 2 + Math.ceil(n * 0.7); k++) L.push("scout");
    for (k = 0; k < Math.floor(n * 0.9); k++) L.push("gunner");
    for (k = 0; k < Math.floor((n - 2) / 2); k++) L.push("heavy");
    for (k = 0; k < Math.floor((n - 3) / 2); k++) L.push("kamikaze");
    if (n === WAVES) L.push("boss");
    return L;
  }
  KP.pveSetup = function (M) {
    var lh = W3.POIS.filter(function (p) { return p.kind === "lighthouse"; })[0] || W3.POIS[0];
    var col = null; KP.chests && W3.query(lh.x - 2, lh.z - 2, lh.x + 2, lh.z + 2).forEach(function (c) { if (c.r && c.r > 1.5) col = c; });
    var P = G.pve = { base: { x: lh.x, z: lh.z, y: W3.height(lh.x, lh.z), hp: BASE_HP, max: BASE_HP, col: col }, wave: 0, state: "break", t: 8, queue: [], spawnT: 0, cleared: 0 };
    G.drones = [];
    if (!droneMat) droneMat = new THREE.MeshLambertMaterial({ vertexColors: true, map: KP.tex().wall });
    G.plane.t = 1; G.zone.phases = []; G.zone.none = true; G.zone.cx = G.zone.tx = lh.x; G.zone.cz = G.zone.tz = lh.z; G.zone.r = G.zone.tr = 140;
    G.chars.forEach(function (c, i) {
      var a = i / G.chars.length * 6.28, x = lh.x + Math.cos(a) * 7, z = lh.z + Math.sin(a) * 7;
      c.x = x; c.z = z; c.y = W3.height(x, z) + 0.1; c.state = "ground"; c.onGround = true; if (c.mesh) c.mesh.visible = true;
      c.slots = [{ id: 0 }, { id: 4, r: 1, mag: 25 }, { id: [2, 3, 5][i % 3], r: 1, mag: KP.WEAPONS[[2, 3, 5][i % 3]].mag }, null, null];
      c.items.tube = 3; c.items.lac = 2; c.items.gren = 2; c.wood = 120; c.sh = 50; c.cur = -1; KP.equip(c, 1);
    });
  };
  KP.pveClear = function () { (G.drones || []).forEach(function (d) { if (d.mesh) G.scene.remove(d.mesh); }); G.drones = []; G.pve = null; };
  function spawn(kind, cx, cz, R0) {
    var P = G.pve, D = DT[kind], a = rnd() * 6.28, R = R0 || 105 + rnd() * 20;
    if (cx === undefined) { cx = P.base.x; cz = P.base.z; }
    G.drones = G.drones || [];
    if (!droneMat) droneMat = new THREE.MeshLambertMaterial({ vertexColors: true, map: KP.tex().wall });
    var d = { isDrone: true, kind: kind, D: D, name: KP.t("drone_" + kind), team: 9, x: cx + Math.cos(a) * R, z: cz + Math.sin(a) * R, y: 0, hp: D.hp, max: D.hp, alive: true, state: "drone", mvx: 0, mvz: 0, onGround: false, yaw: 0, cd: 1 + rnd() * 2, orbit: rnd() < 0.5 ? 1 : -1, paint: "#ff4f6a", kos: 0, dmg: 0 };
    d.y = Math.max(W3.height(d.x, d.z), 0) + D.alt + 6;
    if (!G.headless) { d.mesh = new THREE.Mesh(droneGeo(kind), droneMat); d.mesh.castShadow = true; G.scene.add(d.mesh); }
    G.drones.push(d);
  }
  /* попадание по дрону (из updateProj) */
  KP.droneHit = function (d, dmg, by, wid) {
    if (!d.alive) return;
    d.hp -= dmg; if (KP.onHit && by && by.isPlayer) KP.onHit(d, dmg, by, "shot");
    if (d.hp <= 0) {
      d.alive = false; if (by) { by.kos++; by.koW = by.koW || {}; by.koW[wid] = (by.koW[wid] || 0) + 1; }
      KP.burst(d.x, d.y, d.z, "#ff8a5c", 26, 12); KP.sparks && KP.sparks(d.x, d.y, d.z, 20); KP.flash && KP.flash(d.x, d.y, d.z, 3 * d.D.size, "#ffd27a");
      KP.sfx && KP.sfx("boom", d.x, d.z);
      if (rnd() < 0.18) KP.spawnLoot(d.x, d.z, KP.randomItem());
      if (d.mesh) G.scene.remove(d.mesh);
    }
  };
  function baseDamage(n, kind) { var P = G.pve; P.dmgBy = P.dmgBy || {}; P.dmgBy[kind || "?"] = (P.dmgBy[kind || "?"] || 0) + n * 0.4; P.base.hp = Math.max(0, P.base.hp - n * 0.4); if (KP.ui && !G.headless && P.base.hp > 0 && (P.base.hp / P.base.max) < 0.3 && !P.warned) { P.warned = true; KP.ui.toast(KP.t("baseLow"), 2.5); } }
  KP.pveBaseHit = function (p) { if (G.pve && p.owner && p.owner.isDrone && p.atBase) { baseDamage(p.dmg, p.owner.kind); return true; } return false; };
  /* шаг режима: волны, дроны, возрождение, конец */
  KP.pveStep = function (dt) {
    var P = G.pve; if (!P) return false;
    var p = G.player, base = P.base;
    // возрождение у маяка
    G.chars.forEach(function (c) {
      if (c.state === "out" && c.outT > RESPAWN) {
        c.alive = true; c.state = "ground"; c.outT = 0; c.hp = 100; c.sh = 50; c.healT = 0;
        if (c.mesh) { G.scene.remove(c.mesh); c.mesh = KP.charMesh(c.skin, c.paint); G.scene.add(c.mesh); }
        c.cur = -1; if (!c.slots[1]) c.slots[1] = { id: 4, r: 1, mag: 25 }; KP.equip(c, 1);
        var a = rnd() * 6.28; c.x = base.x + Math.cos(a) * 6; c.z = base.z + Math.sin(a) * 6; c.y = W3.height(c.x, c.z) + 0.1; c.vy = 0;
      }
    });
    if (P.state === "break") {
      P.t -= dt;
      if (P.t <= 0) {
        P.wave++; P.state = "wave"; P.queue = waveList(P.wave); P.spawnT = 0;
        if (KP.ui && !G.headless) { KP.ui.big(KP.t(P.wave === WAVES ? "waveBoss" : "waveN", P.wave, WAVES), 2.4); KP.sfx && KP.sfx("zone", 0, 0, true); }
      }
    } else {
      P.spawnT -= dt;
      if (P.queue.length && P.spawnT <= 0) { spawn(P.queue.shift()); P.spawnT = 0.9; }
      if (!P.queue.length && !G.drones.some(function (d) { return d.alive; })) {
        P.cleared = P.wave; G.drones.forEach(function (d) { if (d.mesh) G.scene.remove(d.mesh); }); G.drones = [];
        if (P.wave >= WAVES) return finish(true);
        P.state = "break"; P.t = BREAK; base.hp = Math.min(base.max, base.hp + base.max * 0.12);   // ремонтники чинят маяк между волнами
        // ящик снабжения у маяка
        var a = rnd() * 6.28, ch = { x: base.x + Math.cos(a) * 9, z: base.z + Math.sin(a) * 9, poi: -1, open: false, legend: P.wave % 3 === 0 };
        ch.y = W3.height(ch.x, ch.z);
        if (KP.makeChestMesh && !G.headless) KP.makeChestMesh(ch);
        KP.chests.push(ch); (P.extra = P.extra || []).push(ch);
        if (KP.ui && !G.headless) KP.ui.toast(KP.t("waveDone", P.wave), 2.5);
      }
    }
    stepDrones(dt, base);
    if (base.hp <= 0) return finish(false);
    return false;
  };
  /* полёт и стрельба дронов; base = null — дроны кружат вокруг игрока (испытания) */
  function stepDrones(dt, base) {
    var free = !base; if (free) { var pl = G.player; base = { x: pl.x, z: pl.z, y: pl.y }; }
    G.drones.forEach(function (d) {
      if (!d.alive) return;
      var D = d.D, tgt = null, td = 1e9;
      if (!D.kam) G.chars.forEach(function (c) { if (!c.alive || c.state === "out") return; var dd = Math.hypot(c.x - d.x, c.z - d.z); if (dd < D.rng && dd < td) { td = dd; tgt = c; } });
      var gx = base.x, gz = base.z, gy = base.y + D.alt, bd = Math.hypot(base.x - d.x, base.z - d.z);
      if (D.kam) { gy = base.y + 8; if (bd < 3.5) { if (!free) baseDamage(D.dmg, "kamikaze"); else KP.damage(G.player, D.dmg * 0.5, d, "splash", "drone"); KP.droneHit(d, 9999, null); KP.burst(d.x, d.y, d.z, "#ff4f6a", 30, 14); return; } }
      else if (bd < 26) {   // кружит у маяка
        var oa = Math.atan2(d.z - base.z, d.x - base.x) + d.orbit * 0.6; gx = base.x + Math.cos(oa) * 20; gz = base.z + Math.sin(oa) * 20;
      }
      var dx = gx - d.x, dz = gz - d.z, dl = Math.hypot(dx, dz) || 1, sp = D.spd;
      d.mvx = dx / dl * sp; d.mvz = dz / dl * sp;
      d.x += d.mvx * dt; d.z += d.mvz * dt;
      var floor = Math.max(W3.height(d.x, d.z), 0) + 3;
      d.y += (Math.max(floor, (D.kam && bd < 30 ? base.y + 8 : W3.height(d.x, d.z) + D.alt)) - d.y) * Math.min(1, dt * 1.5);
      d.yaw = Math.atan2(d.mvx, d.mvz);
      if (D.rate) {
        d.cd -= dt;
        var aimAtBase = !free && (!tgt || (bd < 22 && rnd() < 0.25));
        if (D.noBase && !tgt) aimAtBase = false;
        if (d.cd <= 0 && (tgt || (!free && bd < D.rng && !D.noBase))) {
          d.cd = 1 / D.rate * (0.8 + rnd() * 0.4);
          var tx = aimAtBase ? base.x : tgt.x, ty = aimAtBase ? base.y + 8 : tgt.y + 1, tz = aimAtBase ? base.z : tgt.z;
          var err = (1 - D.acc) * 4; tx += (rnd() - 0.5) * err; ty += (rnd() - 0.5) * err; tz += (rnd() - 0.5) * err;
          var vx = tx - d.x, vy = ty - d.y, vz = tz - d.z, L = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1, spd = D.splash ? 40 : 90;
          G.proj.push({ x: d.x, y: d.y - 0.3, z: d.z, vx: vx / L * spd, vy: vy / L * spd, vz: vz / L * spd, owner: d, dmg: free ? D.dmg * 0.35 : D.dmg, life: 3, grav: false, splash: D.splash || 0, col: "#ff4f6a", wid: "drone", atBase: aimAtBase });
          KP.sfx && KP.sfx(D.splash ? "shot6" : "shot2", d.x, d.z);
        }
      }
    });
  }
  KP.dronesStep = function (dt) { if (G.drones && G.drones.length) stepDrones(dt, null); };
  KP.spawnDrone = function (kind, cx, cz, R) { spawn(kind, cx, cz, R); };
  function finish(win) {
    var P = G.pve, p = G.player, hp = P.base.hp / P.base.max;
    P.stars = win ? (hp > 0.8 ? 3 : hp > 0.5 ? 2 : 1) : 0;
    G.win = win; p.place = win ? 1 : 2; G.teamPlace = {}; G.teamPlace[p.team] = p.place; if (!p.alive) p.alive = true;
    G.pveRes = { waves: P.cleared, stars: P.stars, xp: P.cleared * 30 + (win ? 200 : 0) };
    return true;
  }
  KP.pveHud = function () {
    var P = G.pve; if (!P) return null;
    var n = (G.drones || []).filter(function (d) { return d.alive; }).length + P.queue.length;
    return KP.t("pveHud", Math.max(1, P.wave), WAVES, Math.ceil(P.base.hp), P.base.max) + (P.state === "break" ? " · " + KP.t("nextWave", Math.ceil(P.t)) : " · " + KP.t("dronesLeft", n));
  };
  KP.pveRender = function (dt) {
    var t = performance.now() / 1000;
    (G.drones || []).forEach(function (d) { if (!d.mesh) return; d.mesh.position.set(d.x, d.y + Math.sin(t * 3 + d.x) * 0.15, d.z); d.mesh.rotation.y = d.yaw; d.mesh.rotation.x = 0.15; });
  };
  KP.pveMini = function (ctx, X) {
    var P = G.pve; if (!P) return;
    ctx.fillStyle = "#2fd6ff"; ctx.beginPath(); ctx.arc(X(P.base.x), X(P.base.z), 5, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#ff4f6a"; (G.drones || []).forEach(function (d) { if (d.alive) ctx.fillRect(X(d.x) - 2, X(d.z) - 2, 4, 4); });
  };
  KP.PVE = { WAVES: WAVES };
})(window.KP);
