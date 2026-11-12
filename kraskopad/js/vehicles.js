/* Краскопад · транспорт (Э9): квадроциклы, багги и лодки. В любой можно сесть (E / «Сесть»), выйти — так же.
   Управление: вперёд/назад — газ и тормоз, влево/вправо — руль. Пока за рулём, стрелять нельзя.
   Боты: садятся на сухопутный транспорт, если цель далеко; в воде ищут лодку и плывут к берегу. */
window.KP = window.KP || {};
(function (KP) {
  "use strict";
  var G = KP.G, W3 = KP.world;
  var TYPES = {
    quad: { max: 19, acc: 11, turn: 2.2, rad: 1.0, h: 0.35 },
    buggy: { max: 25, acc: 13, turn: 1.9, rad: 1.25, h: 0.45 },
    boat: { max: 17, acc: 8, turn: 1.6, rad: 1.4, h: 0.3, water: true }
  };
  KP.VTYPES = TYPES;
  var geos = {};
  function geo(kind) {
    if (geos[kind]) return geos[kind];
    var m = new KP.Merger(2), B = new THREE.BoxGeometry(1, 1, 1), C = function (r, h, s) { return new THREE.CylinderGeometry(r, r, h, s || 12); };
    if (kind === "quad") {
      m.add(B, 0, 0.62, 0, 0, 0, 0, 1.0, 0.35, 1.7, "#3c4a35"); m.add(B, 0, 0.82, -0.15, 0, 0, 0, 0.55, 0.18, 0.75, "#1f2226");
      m.add(B, 0, 0.78, 0.72, 0, 0, 0, 1.08, 0.12, 0.45, "#ff8a1f"); m.add(B, 0, 0.78, -0.82, 0, 0, 0, 1.08, 0.12, 0.4, "#ff8a1f");
      m.add(C(0.03, 0.5, 6), 0, 1.0, 0.55, 0.35, 0, 0, 1, 1, 1, "#2a2e33"); m.add(B, 0, 1.22, 0.62, 0, 0, 0, 0.7, 0.05, 0.05, "#2a2e33"); m.add(B, 0, 0.68, 0.88, 0, 0, 0, 0.3, 0.12, 0.06, "#fff5c8");
      [[-0.55, 0.6], [0.55, 0.6], [-0.55, -0.6], [0.55, -0.6]].forEach(function (w) { m.add(C(0.33, 0.28), w[0], 0.33, w[1], 0, 0, Math.PI / 2, 1, 1, 1, "#1b1d20"); m.add(C(0.17, 0.29, 8), w[0], 0.33, w[1], 0, 0, Math.PI / 2, 1, 1, 1, "#8a9098"); });
    } else if (kind === "buggy") {
      m.add(B, 0, 0.6, 0, 0, 0, 0, 1.6, 0.3, 2.8, "#2c3036"); m.add(B, 0, 0.8, 1.05, 0, 0, 0, 1.5, 0.25, 0.7, "#21c8e0");
      m.add(B, 0, 0.85, -0.2, 0, 0, 0, 0.6, 0.35, 0.6, "#1b1d20");   // сиденье
      [[-0.75, 1], [0.75, 1], [-0.75, -0.6], [0.75, -0.6]].forEach(function (p) { m.add(C(0.04, 1.3, 6), p[0], 1.25, p[1], 0, 0, 0, 1, 1, 1, "#9aa0a6"); });   // каркас
      m.add(B, 0, 1.9, 0.2, 0, 0, 0, 1.55, 0.06, 1.7, "#9aa0a6");
      m.add(B, 0, 0.62, 1.42, 0, 0, 0, 1.3, 0.2, 0.08, "#fff5c8");
      [[-0.85, 0.95], [0.85, 0.95], [-0.85, -0.95], [0.85, -0.95]].forEach(function (w) { m.add(C(0.42, 0.38), w[0], 0.42, w[1], 0, 0, Math.PI / 2, 1, 1, 1, "#1b1d20"); m.add(C(0.2, 0.39, 8), w[0], 0.42, w[1], 0, 0, Math.PI / 2, 1, 1, 1, "#c9a13a"); });
    } else {   // лодка
      m.add(B, 0, 0.35, -0.2, 0, 0, 0, 1.5, 0.6, 3.0, "#e9e4da"); m.add(new THREE.ConeGeometry(0.75, 1.2, 4, 1), 0, 0.35, 1.85, Math.PI / 2, Math.PI / 4, 0, 1, 1, 0.55, "#e9e4da");
      m.add(B, 0, 0.62, -0.2, 0, 0, 0, 1.56, 0.08, 3.02, "#1e6f86"); m.add(B, 0, 0.75, -0.6, 0, 0, 0, 0.7, 0.25, 0.6, "#2a2e33");
      m.add(B, 0, 0.5, -1.8, 0, 0, 0, 0.35, 0.7, 0.35, "#2a2e33");   // мотор
      m.add(B, 0, 0.95, 0.35, 0, 0, 0, 1.1, 0.4, 0.05, "#9fd8ff");   // стекло
    }
    geos[kind] = m.build(); return geos[kind];
  }
  /* точки появления: суша (квадро/багги) и вода (лодки) */
  var LAND = [["quad", -118, 34], ["quad", -128, 2], ["quad", 18, 22], ["quad", -108, -36], ["quad", 10, -132], ["quad", -60, 84], ["quad", 22, 74], ["quad", 120, 10],
    ["buggy", -14, -16], ["buggy", 70, 70], ["buggy", -20, 120], ["buggy", 60, -60], ["buggy", -90, 40]];
  var WATER = [[-165, 22], [26, -168], [40, 110], [6, 176], [170, -40], [-150, -120]];
  function waterSpot(x, z) {   // ближайшая глубокая вода в сторону от центра острова
    var a = Math.atan2(z, x);
    for (var r = 0; r < 60; r += 2) { var px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (W3.height(px, pz) < -0.9) return [px, pz]; }
    return null;
  }
  function make(kind, x, z, yaw) {
    var T = TYPES[kind], v = { kind: kind, T: T, x: x, z: z, y: T.water ? -0.25 : W3.height(x, z), yaw: yaw, speed: 0, rad: T.rad, vy: 0, mvx: 0, mvz: 0, walk: 0, onGround: true, driver: null, stuckT: 0 };
    if (!G.headless) { v.mesh = new THREE.Mesh(geo(kind), new THREE.MeshLambertMaterial({ vertexColors: true, map: KP.tex().wall })); v.mesh.castShadow = true; G.scene.add(v.mesh); }
    G.vehicles.push(v); return v;
  }
  KP.spawnVehicles = function () {
    (G.vehicles || []).forEach(function (v) { if (v.mesh) G.scene.remove(v.mesh); });
    G.vehicles = [];
    var spots = (W3.VEH && W3.VEH()) || { land: LAND, water: WATER };
    spots.land.forEach(function (s, i) { if (W3.height(s[1], s[2]) > 0.5) make(s[0], s[1], s[2], i * 1.3); });
    spots.water.forEach(function (s, i) { var w = W3.height(s[0], s[1]) < -0.9 ? s : waterSpot(s[0], s[1]); if (w) make("boat", w[0], w[1], i * 2.1); });
  };
  KP.nearVehicle = function (ch, r, landOnly) { var best = null, bd = r; (G.vehicles || []).forEach(function (v) { if (v.driver || (landOnly && v.T.water)) return; var d = Math.hypot(v.x - ch.x, v.z - ch.z); if (d < bd) { bd = d; best = v; } }); return best; };
  KP.enterVehicle = function (ch, v) { if (v.driver) return false; v.driver = ch; ch.veh = v; ch.state = "drive"; ch.reloadT = 0; ch.healT = 0; ch.emote = null; KP.sfx && KP.sfx("engine", v.x, v.z, ch.isPlayer); return true; };
  /* точка высадки: сбоку от машины; у лодки — ближайший берег (до 30 м), иначе выйти нельзя */
  function exitPoint(v) {
    var sx = v.x + Math.cos(v.yaw) * (v.rad + 0.6), sz = v.z - Math.sin(v.yaw) * (v.rad + 0.6);
    if (!v.T.water && W3.height(sx, sz) > -0.6) return [sx, sz];
    for (var r = 1; r <= 30; r += 1.5) for (var a = 0; a < 6.28; a += 0.4) { var px = v.x + Math.cos(a) * r, pz = v.z + Math.sin(a) * r; if (W3.height(px, pz) > 0.25) return [px, pz]; }
    return null;
  }
  KP.exitVehicle = function (ch, force) {
    var v = ch.veh; if (!v) return false;
    var pt = exitPoint(v);
    if (!pt && !force) return false;
    if (!pt) pt = [v.x, v.z];
    v.driver = null; ch.veh = null; ch.state = "ground";
    ch.x = pt[0]; ch.z = pt[1]; ch.y = Math.max(W3.height(ch.x, ch.z), -0.2) + 0.2; ch.vy = 0;
    v.speed *= 0.3;
    return true;
  };
  /* шаг транспорта: thr — газ (-1..1), steer — руль (-1..1, плюс — влево) */
  KP.driveVehicle = function (v, thr, steer, dt) {
    var T = v.T, max = T.max;
    if (thr) v.speed += thr * T.acc * dt; else v.speed *= Math.max(0, 1 - dt * (T.water ? 0.9 : 1.6));
    v.speed = Math.max(-6, Math.min(max, v.speed));
    v.yaw += steer * dt * T.turn * Math.min(1, Math.abs(v.speed) / 6) * (v.speed < 0 ? -1 : 1);
    v.mvx = Math.sin(v.yaw) * v.speed; v.mvz = Math.cos(v.yaw) * v.speed;
    var ox = v.x, oz = v.z;
    if (T.water) {   // лодка: только по воде, у берега упирается
      var nx = v.x + v.mvx * dt, nz = v.z + v.mvz * dt;
      if (W3.height(nx, nz) < -0.35 && nx * nx + nz * nz < 225 * 225) { v.x = nx; v.z = nz; } else { v.speed *= 0.2; v.blocked = true; }
      v.y = -0.25;
    } else {
      var h0 = W3.height(v.x, v.z);
      if (h0 < -0.4) v.speed *= Math.max(0, 1 - dt * 3);   // в воде глохнет
      KP.moveChar(v, dt);
      if (v.blocked) { var real = Math.hypot(v.x - ox, v.z - oz) / dt; if (real < Math.abs(v.speed) * 0.5) v.speed *= 0.4; }
    }
    var moved = Math.hypot(v.x - ox, v.z - oz);
    if (v.driver) v.driver.driven = (v.driver.driven || 0) + moved;
    v.stuckT = thr && moved < dt * 1.5 ? v.stuckT + dt : 0;
    // толкает бойцов (на суше)
    if (!T.water) G.chars.forEach(function (c) {
      if (!c.alive || c === v.driver || c.state !== "ground") return;
      var dx = c.x - v.x, dz = c.z - v.z, d = Math.hypot(dx, dz), R = v.rad + 0.5;
      if (d < R && d > 0.01) { c.x = v.x + dx / d * R; c.z = v.z + dz / d * R; if (v.driver && Math.abs(v.speed) > 9 && KP.enemy(v.driver, c)) { KP.damage(c, 20, v.driver, "ram", "ram"); v.speed *= 0.5; } }
    });
  };
  /* остальные бойцы не проходят сквозь стоящий транспорт */
  KP.vehicleBlock = function (ch) {
    (G.vehicles || []).forEach(function (v) {
      if (v.driver === ch) return;
      var dx = ch.x - v.x, dz = ch.z - v.z, d = Math.hypot(dx, dz), R = v.rad + 0.3;
      if (d < R && d > 0.01 && Math.abs(ch.y - v.y) < 1.5) { ch.x = v.x + dx / d * R; ch.z = v.z + dz / d * R; }
    });
  };
  /* ИИ за рулём: едет к цели (A.goal), выходит у цели, при застревании или если рядом враг */
  KP.aiDrive = function (ch, dt) {
    var v = ch.veh, A = ch.ai, gl = A.goal || (G.zone ? { x: G.zone.tx, z: G.zone.tz } : { x: 0, z: 0 });
    if (v.T.water) {   // на лодке — к ближайшему берегу в сторону центра зоны
      var cx = G.zone ? G.zone.tx : 0, cz = G.zone ? G.zone.tz : 0; gl = { x: cx, z: cz };
      if (exitPoint(v) && Math.hypot(v.x - cx, v.z - cz) < Math.hypot(v.x, v.z) + 40 && W3.height(v.x + Math.sin(v.yaw) * 4, v.z + Math.cos(v.yaw) * 4) > -0.4) return { exit: true };
    }
    var dx = gl.x - v.x, dz = gl.z - v.z, d = Math.hypot(dx, dz);
    var want = Math.atan2(dx, dz), diff = Math.atan2(Math.sin(want - v.yaw), Math.cos(want - v.yaw));
    var near = A.target && A.target.alive && A.see && Math.hypot(A.target.x - v.x, A.target.z - v.z) < 28;
    if ((!v.T.water && (d < 14 || near)) || v.stuckT > 1.4) return { exit: true };
    return { thr: Math.abs(diff) > 1.2 ? 0.35 : 1, steer: Math.max(-1, Math.min(1, diff * 2)) };
  };
  KP.renderVehicles = function () {
    var t = performance.now() / 1000;
    (G.vehicles || []).forEach(function (v) {
      if (!v.mesh) return;
      v.mesh.rotation.y = v.yaw;
      if (v.T.water) { v.mesh.position.set(v.x, -0.35 + Math.sin(t * 2 + v.x) * 0.06, v.z); v.mesh.rotation.x = -Math.min(0.12, Math.abs(v.speed) * 0.006) + Math.sin(t * 1.7 + v.z) * 0.02; v.mesh.rotation.z = Math.sin(t * 1.3 + v.x) * 0.03; return; }
      v.mesh.position.set(v.x, v.y, v.z);
      var gx = W3.height(v.x + Math.sin(v.yaw), v.z + Math.cos(v.yaw)) - W3.height(v.x - Math.sin(v.yaw), v.z - Math.cos(v.yaw));
      v.mesh.rotation.x = -Math.atan2(gx, 2) * 0.8;
    });
  };
})(window.KP);
