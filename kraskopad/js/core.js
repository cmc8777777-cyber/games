/* Краскопад · ядро матча: оружие, персонажи, физика, постройки, снаряды, лут, зона.
   Общее состояние — KP.G. ИИ ботов — ai.js, ввод/камера/интерфейс — main.js. */
window.KP = window.KP || {};
(function (KP) {
  "use strict";
  var W3 = KP.world;

  /* ---------- данные ---------- */
  var WEAPONS = [
    { id: 0, melee: true, dmg: 20, rate: 2, rng: 2.8, size: [0.2, 0.2, 0.9], col: "#ffffff", score: 0 },
    { id: 1, dmg: 18, rate: 4, mag: 12, rel: 1.2, spd: 150, spr: 1.2, rng: 70, size: [0.18, 0.25, 0.5], col: "#62c6ff", score: 1, w: 30, kick: 0.025, bloom: 0.35, maxB: 1.5 },
    { id: 2, dmg: 11, rate: 10, mag: 30, rel: 1.8, spd: 140, spr: 3.6, rng: 55, size: [0.2, 0.28, 0.75], col: "#5fe08a", score: 2, w: 22, kick: 0.012, bloom: 0.12, maxB: 1.6 },
    { id: 3, dmg: 9, pel: 8, rate: 1.1, mag: 5, rel: 2.4, spd: 110, spr: 7, rng: 24, size: [0.32, 0.36, 0.8], col: "#ffad42", score: 2.2, w: 18, kick: 0.09, bloom: 0, maxB: 0 },
    { id: 4, dmg: 20, rate: 5.5, mag: 25, rel: 2.0, spd: 170, spr: 1.8, rng: 85, size: [0.2, 0.26, 1.0], col: "#ff73b4", score: 2.6, w: 14, kick: 0.018, bloom: 0.18, maxB: 1.8 },
    { id: 5, dmg: 75, rate: 0.6, mag: 4, rel: 2.8, spd: 320, spr: 0.15, rng: 260, size: [0.18, 0.22, 1.4], col: "#b18bff", score: 2.4, zoom: true, w: 7, kick: 0.12, bloom: 0, maxB: 0 },
    { id: 6, dmg: 50, rate: 1.0, mag: 4, rel: 2.5, spd: 36, spr: 1, rng: 70, size: [0.4, 0.4, 0.8], col: "#ffe14d", score: 2, grav: true, splash: 4.2, w: 9, kick: 0.1, bloom: 0, maxB: 0 }
  ];
  var RAR = [{ m: 1, c: "#b8bec6" }, { m: 1.1, c: "#3d9bff" }, { m: 1.2, c: "#b05cff" }, { m: 1.3, c: "#ffb11f" }];
  var ITEMS = {
    tube: { col: "#57e08a", cap: 6, time: 2, hp: 25 }, pal: { col: "#e8efe9", cap: 2, time: 5, hp: 100 },
    lac: { col: "#3fb6ff", cap: 4, time: 3, sh: 50 }, big: { col: "#2a7bff", cap: 2, time: 4.5, sh: 100 },
    gren: { col: "#ff3d8b", cap: 4, thr: true }, smoke: { col: "#b8c2cc", cap: 3, thr: true }, pop: { col: "#ffc531", cap: 3, thr: true }
  };
  var ITEM_KEYS = ["tube", "pal", "lac", "big", "gren", "smoke", "pop"];
  KP.ITEM_KEYS = ITEM_KEYS;
  /* скины: полуреалистичные бойцы. f — женская фигура; helm: helmet | mask | cap | hood | hair | hat */
  /* 30 бойцов (как в ПРОМПТЫ.md). f — женская фигура; helm: helmet | mask | cap | hood | hair | hat.
     Открытие: lvl — уровень; pass — ступень пропуска; prem + lvl — Премиум или уровень; ch — задание. */
  var SKINS = [
    { suit: "#5b6168", pants: "#3b4046", vest: "#6f7a5a", skin: "#d8a888", helm: "cap", helmCol: "#2f3338" },
    { f: true, suit: "#5f6b4a", pants: "#3d4436", vest: "#8a8f78", skin: "#e2b597", helm: "hair", helmCol: "#3a2a1f" },
    { f: true, suit: "#b49b74", pants: "#6d5d45", vest: "#c9b48f", vest2: "#8a7556", skin: "#c99272", helm: "helmet", helmCol: "#a88f6a", lvl: 3 },
    { suit: "#2d3f5f", pants: "#263247", vest: "#3a4f75", skin: "#e0b294", helm: "helmet", helmCol: "#e9ecef", pass: 2 },
    { f: true, suit: "#e9eef0", pants: "#2c3a40", vest: "#2fa3a0", vest2: "#e9eef0", skin: "#f0c8aa", helm: "hair", helmCol: "#cfd4d8", lvl: 5 },
    { suit: "#383c42", pants: "#2a2d31", vest: "#4c5157", skin: "#b88466", helm: "mask", helmCol: "#2a2d31", pass: 6 },
    { f: true, suit: "#b8463a", pants: "#2a2d31", vest: "#d1574a", vest2: "#3a3f46", skin: "#8d5a3f", helm: "hair", helmCol: "#1d1712", lvl: 8 },
    { suit: "#4a5a36", pants: "#3a4530", vest: "#5d6e44", vest2: "#7a6a48", skin: "#d9a582", helm: "hat", helmCol: "#5a4a32", pass: 10 },
    { f: true, suit: "#d9772e", pants: "#c7682a", vest: "#3a3f46", skin: "#e9bc9c", helm: "cap", helmCol: "#2a2d31", lvl: 11 },
    { suit: "#1c1e22", pants: "#16181b", vest: "#2a2d33", skin: "#c48d6c", helm: "hood", helmCol: "#202227", pass: 14 },
    { suit: "#c2a679", pants: "#9a8460", vest: "#d8c39b", vest2: "#8a7556", skin: "#b07a58", helm: "hood", helmCol: "#d8c39b", lvl: 14 },
    { f: true, suit: "#e8eef2", pants: "#c9d2d8", vest: "#f4f7f9", vest2: "#9fc6e0", skin: "#f2d0b8", helm: "helmet", helmCol: "#f4f7f9", pass: 18 },
    { f: true, suit: "#24262b", pants: "#1d1f23", vest: "#e23c8a", vest2: "#24262b", skin: "#f2c6a8", helm: "hair", helmCol: "#e23c8a", ch: "ko5" },
    { suit: "#3a2a22", pants: "#22252a", vest: "#4a3528", vest2: "#2a2d31", skin: "#d7a283", helm: "helmet", helmCol: "#1c1e22", lvl: 17 },
    { suit: "#1f2d4a", pants: "#22252a", vest: "#2c3f66", vest2: "#c9a13a", skin: "#e0ae8c", helm: "cap", helmCol: "#1f2d4a", pass: 22 },
    { f: true, suit: "#e9efe9", pants: "#5e7a66", vest: "#7ea88a", skin: "#f0c4a4", helm: "hair", helmCol: "#5a3a26", lvl: 20 },
    { suit: "#2a2d31", pants: "#2a2d31", vest: "#e8c31f", vest2: "#1c1e22", skin: "#c48d6c", helm: "helmet", helmCol: "#e8c31f", pass: 26 },
    { f: true, suit: "#b8542a", pants: "#3a2d26", vest: "#c9662f", skin: "#efc2a2", helm: "hood", helmCol: "#b8542a", lvl: 23 },
    { suit: "#b9bec4", pants: "#9aa0a6", vest: "#d6dade", vest2: "#8a9096", skin: "#e6e2dc", helm: "mask", helmCol: "#e6e9ec", pass: 30 },
    { f: true, suit: "#1e3a6a", pants: "#1a2c4c", vest: "#2b56a0", skin: "#e8b898", helm: "helmet", helmCol: "#2b56a0", lvl: 26 },
    { suit: "#2a2d31", pants: "#1c1e22", vest: "#9e2a2a", vest2: "#2a2d31", skin: "#d8a888", helm: "helmet", helmCol: "#9e2a2a", pass: 35 },
    { f: true, suit: "#4c6a34", pants: "#5a5040", vest: "#3e5a2c", skin: "#c48a64", helm: "hair", helmCol: "#2a1f16", lvl: 30 },
    { f: true, suit: "#e0761f", pants: "#d06a1a", vest: "#3a3f46", skin: "#f0c8aa", helm: "hair", helmCol: "#c9a070", prem: 5, lvl: 40 },
    { suit: "#3a3f46", pants: "#2a2d31", vest: "#4c5157", vest2: "#21c8e0", skin: "#e4b494", helm: "hood", helmCol: "#4c5157", prem: 12, lvl: 45 },
    { suit: "#1e2024", pants: "#17191c", vest: "#b8902e", vest2: "#2a2d31", skin: "#d6a283", helm: "helmet", helmCol: "#c9a13a", ch: "win" },
    { f: true, suit: "#22252a", pants: "#1c1e22", vest: "#3a2622", vest2: "#ff6a1f", skin: "#d49a78", helm: "helmet", helmCol: "#2a2d31", prem: 20, lvl: 50 },
    { suit: "#1b4a5a", pants: "#163c4a", vest: "#2a7a8a", vest2: "#f2d27a", skin: "#c88a62", helm: "hair", helmCol: "#e0c27a", prem: 28, lvl: 55 },
    { f: true, suit: "#22252a", pants: "#1c1e22", vest: "#33373d", vest2: "#5a5f66", skin: "#f0c8aa", helm: "hair", helmCol: "#121212", prem: 38, lvl: 60 },
    { suit: "#f2f4f6", pants: "#d8dde2", vest: "#ffffff", vest2: "#ff3d8b", skin: "#e0ae8c", helm: "helmet", helmCol: "#ffffff", pass: 45 },
    { f: true, suit: "#dfe3e8", pants: "#b9c0c8", vest: "#f2f4f6", vest2: "#ffc531", skin: "#efc6a8", helm: "helmet", helmCol: "#ffc531", ch: "win10" }
  ];
  var PAINTS = [
    { c: "#ff3d8b", lvl: 1 }, { c: "#2f9bff", lvl: 1 }, { c: "#7be03a", lvl: 3 }, { c: "#ff8a1f", lvl: 5 },
    { c: "#9b5cff", lvl: 7 }, { c: "#19d3c5", lvl: 10 }, { c: "#ffc61a", lvl: 13 }, { c: "rainbow", lvl: 18 }
  ];
  var MODES = {
    solo: { n: 25, zone: [[60, 35, 110, 1], [40, 30, 65, 2], [30, 25, 36, 4], [25, 20, 18, 7], [20, 18, 7, 10], [12, 15, 0, 16]], r0: 200 },
    trio: { n: 24, team: 3, zone: [[60, 35, 110, 1], [40, 30, 65, 2], [30, 25, 36, 4], [25, 20, 18, 7], [20, 18, 7, 10], [12, 15, 0, 16]], r0: 200 },
    train: { n: 9, zone: [], r0: 230, train: true },
    tutor: { n: 4, zone: [], r0: 230, train: true, tutor: true },
    event: { n: 20, zone: [[50, 30, 95, 1], [35, 26, 55, 2], [26, 22, 30, 4], [22, 18, 14, 7], [16, 15, 5, 10], [10, 12, 0, 16]], r0: 200 },
    quick: { n: 12, zone: [[40, 22, 70, 2], [24, 18, 40, 3], [18, 15, 20, 6], [14, 12, 8, 10], [10, 10, 0, 16]], r0: 130 }
  };
  /* событие дня (меняется каждые сутки по местной дате): ограничение оружия, гравитация, темп хмари, бонус опыта */
  var EVENTS = [
    { key: "ev0", weapons: [3, 1], xp: 1.5 },                 // дробовики и пистолеты
    { key: "ev1", weapons: [5, 1], xp: 1.5 },                 // снайперская дуэль
    { key: "ev2", grenBoost: 3, xp: 1.5 },                    // гранатный ливень
    { key: "ev3", grav: 0.55, xp: 1.5 },                      // лёгкая гравитация
    { key: "ev4", zoneK: 0.6, xp: 1.6 },                      // быстрая хмарь
    { key: "ev5", weapons: [2, 4], wood: 150, xp: 1.5 }       // штурм: автоматы и стройка
  ];
  KP.EVENTS = EVENTS;
  KP.todayEvent = function () { var d = new Date(), n = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5); return EVENTS[n % EVENTS.length]; };
  KP.WEAPONS = WEAPONS; KP.RAR = RAR; KP.ITEMS = ITEMS; KP.SKINS = SKINS; KP.PAINTS = PAINTS; KP.MODES = MODES;

  var G = KP.G = { chars: [], proj: [], loot: [], builds: {}, buildList: [], time: 0, running: false, fx: null };
  var rnd = Math.random;

  /* модели и эффекты — models.js; здесь тонкие обёртки */
  function mat(c, e) { return KP.mat(c, e); }
  function burst(x, y, z, c, n, sp) { KP.burst(x, y, z, c, n, sp); }
  function splat(x, y, z, c, sc) { KP.splat(x, y, z, c, sc); }
  function paintColor(p) { return KP.paintColor(p); }
  function weaponMesh(id) { return KP.weaponMesh(id); }
  function charMesh(s, p) { return KP.charMesh(s, p); }

  /* ---------- рельеф + постройки ---------- */
  function rampSurf(b, x, z) {
    var t = b.dir === 0 ? (z - b.z0) : b.dir === 1 ? (x - b.x0) : b.dir === 2 ? (b.z1 - z) : (b.x1 - x);
    return b.base + Math.max(0, Math.min(4, t));
  }
  function groundAt(x, z, y) {
    var g = W3.height(x, z);
    var near = W3.query(x - 0.1, z - 0.1, x + 0.1, z + 0.1);
    for (var i = 0; i < near.length; i++) {
      var c = near[i];
      if (c.kind === "ramp" && x >= c.x0 && x <= c.x1 && z >= c.z0 && z <= c.z1) { var s = rampSurf(c, x, z); if (y + 1.15 >= s && s > g) g = s; }
    }
    return g;
  }
  KP.groundAt = groundAt;

  function resolve(ch) {
    var R = ch.rad || 0.5, near = W3.query(ch.x - R - 0.5, ch.z - R - 0.5, ch.x + R + 0.5, ch.z + R + 0.5);
    for (var i = 0; i < near.length; i++) {
      var c = near[i];
      if (c.r) {
        if (ch.y > c.top) continue;
        var dx = ch.x - c.x, dz = ch.z - c.z, d = Math.sqrt(dx * dx + dz * dz), m = c.r + R;
        if (d < m) { if (d < 1e-4) { dx = 1; d = 1; } ch.x = c.x + dx / d * m; ch.z = c.z + dz / d * m; ch.blocked = true; }
        continue;
      }
      if (ch.x < c.x0 - R || ch.x > c.x1 + R || ch.z < c.z0 - R || ch.z > c.z1 + R) continue;
      if (c.kind === "ramp") {
        var px = Math.max(c.x0, Math.min(c.x1, ch.x)), pz = Math.max(c.z0, Math.min(c.z1, ch.z));
        if (ch.y + 1.15 >= rampSurf(c, px, pz) || ch.y + 1.8 < c.base) continue;
      } else if (ch.y >= c.y1 - 0.05 || ch.y + 1.8 <= c.y0) continue;
      var pl = ch.x - (c.x0 - R), pr = (c.x1 + R) - ch.x, pd = ch.z - (c.z0 - R), pu = (c.z1 + R) - ch.z, mn = Math.min(pl, pr, pd, pu);
      if (mn === pl) ch.x -= pl; else if (mn === pr) ch.x += pr; else if (mn === pd) ch.z -= pd; else ch.z += pu;
      ch.blocked = true;
    }
  }

  /* перемещение персонажа: желаемая горизонтальная скорость mvx/mvz, гравитация, вода, край мира */
  function moveChar(ch, dt) {
    var ox = ch.x, oz = ch.z;
    ch.blocked = false;
    var sp = 1, h0 = W3.height(ch.x, ch.z);
    if (h0 < -0.4) sp = 0.6;
    ch.x += ch.mvx * dt * sp; ch.z += ch.mvz * dt * sp;
    var h1 = W3.height(ch.x, ch.z), r1 = ch.x * ch.x + ch.z * ch.z;
    // глубокая вода и край мира не пускают дальше, но к берегу выйти можно всегда
    if ((h1 < -1.6 && h1 < h0 - 0.001) || (r1 > 205 * 205 && r1 > ox * ox + oz * oz)) { ch.x = ox; ch.z = oz; ch.blocked = true; }
    resolve(ch);
    ch.vy -= 24 * (G.grav || 1) * dt; ch.y += ch.vy * dt;
    var g = groundAt(ch.x, ch.z, ch.y);
    if (ch.y <= g) { ch.y = g; ch.vy = 0; ch.onGround = true; }
    else if (ch.onGround && ch.vy <= 0 && ch.y - g < 0.7) { ch.y = g; ch.vy = 0; }
    else ch.onGround = false;
    var dd = Math.hypot(ch.x - ox, ch.z - oz); ch.walk += dd * 3.2;
  }
  KP.moveChar = moveChar;

  /* ---------- постройки ---------- */
  var DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  function dirOf(yaw) { var d = Math.round(yaw / (Math.PI / 2)); return ((d % 4) + 4) % 4; }
  var bMats = {};
  function buildMat(paint) {   // доски с фактурой и лёгким оттенком краски владельца
    if (!bMats[paint]) { var c = new THREE.Color("#ffffff").lerp(new THREE.Color(paint === "rainbow" ? "#ff3d8b" : paint), 0.16); bMats[paint] = new THREE.MeshLambertMaterial({ map: KP.tex().plank, color: c }); }
    return bMats[paint];
  }
  function place(ch, kind) {
    if (ch.wood < 10) return "noWood";
    var di = dirOf(ch.yaw), D = DIRS[di], gx = Math.floor(ch.x / 4), gz = Math.floor(ch.z / 4), key, b;
    if (kind === "wall") {
      var ex = gx * 4 + 2 + D[0] * 2, ez = gz * 4 + 2 + D[1] * 2;
      if (Math.abs((ch.x - ex) * D[0] + (ch.z - ez) * D[1]) < 1.0) { ex += D[0] * 4; ez += D[1] * 4; }
      key = "w" + Math.round(ex) + ":" + Math.round(ez);
      if (G.builds[key]) return "busy";
      var base = Math.min(W3.height(ex - D[1] * 2, ez - D[0] * 2), W3.height(ex + D[1] * 2, ez + D[0] * 2), groundAt(ex, ez, ch.y + 0.5));
      if (ch.onGround && ch.y > base && ch.y - base < 4) base = Math.max(base, ch.y - 0.2);
      var hx = D[0] ? 0.2 : 2, hz = D[0] ? 2 : 0.2;
      b = { kind: "wall", x0: ex - hx, x1: ex + hx, z0: ez - hz, z1: ez + hz, y0: base - 1, y1: base + 4.2, cx: ex, cz: ez, base: base, rot: D[0] ? Math.PI / 2 : 0, hp: 150 };
    } else {
      var cx = (gx + D[0]) * 4, cz = (gz + D[1]) * 4;
      key = "r" + cx + ":" + cz;
      if (G.builds[key]) return "busy";
      var nx = cx + 2 - D[0] * 2, nz = cz + 2 - D[1] * 2;
      var base2 = W3.height(nx, nz);
      if (ch.onGround && ch.y > base2 - 0.5) base2 = ch.y;
      b = { kind: "ramp", x0: cx, x1: cx + 4, z0: cz, z1: cz + 4, y0: base2 - 1, y1: base2 + 4, cx: cx + 2, cz: cz + 2, base: base2, dir: di, hp: 150 };
    }
    b.key = key; b.owner = ch;
    ch.wood -= 10; ch.built = (ch.built || 0) + 1;
    W3.addCol(b); G.builds[key] = b; G.buildList.push(b);
    if (!G.headless) {
      var m = new THREE.Mesh(kind === "wall" ? KP.GEO.wall : KP.GEO.ramp, buildMat(ch.paint));
      if (kind === "wall") { m.position.set(b.cx, b.base + 2.1, b.cz); m.rotation.y = b.rot; }
      else { m.position.set(b.cx, b.base + 2, b.cz); m.rotation.y = [0, Math.PI / 2, Math.PI, -Math.PI / 2][b.dir]; }
      m.scale.set(0.2, 0.2, 0.2); m.userData.grow = 0; m.castShadow = true; m.receiveShadow = true; b.mesh = m; G.scene.add(m);
    }
    KP.sfx && KP.sfx("build", b.cx, b.cz);
    return "ok";
  }
  KP.place = place;
  function hurtBuild(b, d) {
    if (!b.alive) return;
    b.hp -= d;
    if (b.mesh) { b.mesh.userData.shake = 0.15; }
    if (b.hp <= 0) {
      W3.removeCol(b); delete G.builds[b.key]; G.buildList.splice(G.buildList.indexOf(b), 1);
      if (b.mesh) { G.scene.remove(b.mesh); }
      burst(b.cx, b.base + 2, b.cz, "#c9a77a", 18, 8); KP.sparks && KP.sparks(b.cx, b.base + 2, b.cz, 6);
    }
  }
  KP.hurtBuild = hurtBuild;
  function hurtProp(c, d, by) {   // деревья и ящики → доски
    if (!c.alive || !c.hp) return;
    c.hp -= d;
    var gain = c.kind === "tree" ? 5 : 4;
    if (by) by.wood = Math.min(500, by.wood + gain);
    burst(c.x, c.y + 1.5, c.z, c.kind === "tree" ? "#b48a5c" : "#c79a66", 5, 5);
    if (c.hp <= 0) {
      W3.removeCol(c); c.setVis && c.setVis(false);
      if (by) by.wood = Math.min(500, by.wood + (c.kind === "tree" ? 10 : 6));
      if (c.kind === "crate" && c.loot) spawnLoot(c.x, c.z, rnd() < 0.5 ? randomWeapon(0) : randomItem());
    }
  }
  KP.hurtProp = hurtProp;

  /* ---------- лут ---------- */
  function randomWeapon(minR, bias) {
    var tot = 0, i, wt = function (k) { return WEAPONS[k].w * ((bias && bias[k]) || 1); }; for (i = 1; i < WEAPONS.length; i++) tot += wt(i);
    var r = rnd() * tot, id = 1; for (i = 1; i < WEAPONS.length; i++) { r -= wt(i); if (r <= 0) { id = i; break; } }
    if (G.mods && G.mods.weapons) id = G.mods.weapons[Math.floor(rnd() * G.mods.weapons.length)];
    var q = rnd(), rr = q < 0.55 ? 0 : q < 0.83 ? 1 : q < 0.96 ? 2 : 3;
    return { t: "w", id: id, r: Math.max(minR || 0, rr) };
  }
  function randomItem() {
    var q = rnd(), id = q < 0.32 ? "tube" : q < 0.52 ? "lac" : q < 0.64 ? "pal" : q < 0.7 ? "big" : q < 0.84 ? "gren" : q < 0.93 ? "smoke" : "pop";
    if (G.mods && G.mods.grenBoost && rnd() < 0.5) id = "gren";
    return { t: "i", id: id, n: id === "gren" ? 2 : 1 };
  }
  KP.randomWeapon = randomWeapon; KP.randomItem = randomItem;
  var lootMats = {};
  function spawnLoot(x, z, it) {
    it.x = x; it.z = z; it.y = W3.height(x, z); it.alive = true; it.noPick = 0;
    if (!G.headless) {
      var g = new THREE.Group(), m;
      var rc = it.t === "w" ? RAR[it.r].c : ITEMS[it.id].col;
      if (it.t === "w") { m = weaponMesh(it.id); m.scale.set(1.6, 1.6, 1.6); }
      else { m = new THREE.Mesh(KP.GEO[it.id], mat(ITEMS[it.id].col, "glow")); }
      m.position.y = 0.6; g.add(m);
      if (!lootMats[rc]) lootMats[rc] = [new THREE.MeshBasicMaterial({ color: rc, transparent: true, opacity: 0.85, side: THREE.DoubleSide }), new THREE.MeshBasicMaterial({ color: rc, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })];
      var ring = new THREE.Mesh(KP.GEO.lootRing, lootMats[rc][0]); ring.position.y = 0.06; g.add(ring);
      if (it.t === "w" && it.r > 0) { var beam = new THREE.Mesh(KP.GEO.beam, lootMats[rc][1]); beam.position.y = 2.1; g.add(beam); }
      g.position.set(x, it.y, z); g.userData.spin = m; it.mesh = g; G.scene.add(g); g.visible = false;
    }
    G.loot.push(it);
    return it;
  }
  KP.spawnLoot = spawnLoot;
  function removeLoot(it) { it.alive = false; if (it.mesh) G.scene.remove(it.mesh); var i = G.loot.indexOf(it); if (i >= 0) G.loot.splice(i, 1); }
  KP.removeLoot = removeLoot;
  function openChest(c, ch) {
    if (c.open) return; c.open = true;
    if (c.mesh) { c.mesh.userData.lid.rotation.x = -1.2; c.mesh.userData.lid.position.z = -0.35; }
    burst(c.x, c.y + 1, c.z, "#ffd84a", 12, 6);
    var a = rnd() * 6.28;
    spawnLoot(c.x + Math.cos(a) * 1.2, c.z + Math.sin(a) * 1.2, randomWeapon(1, c.poi >= 0 && W3.POIS[c.poi] ? W3.POIS[c.poi].bias : null));
    spawnLoot(c.x + Math.cos(a + 2) * 1.2, c.z + Math.sin(a + 2) * 1.2, randomItem());
    if (ch) { ch.wood = Math.min(500, ch.wood + 10); ch.chests = (ch.chests || 0) + 1; }
    KP.sfx && KP.sfx("chest", c.x, c.z);
  }
  KP.openChest = openChest;
  function wScore(s) { return s ? WEAPONS[s.id].score * RAR[s.r].m : 0; }
  KP.wScore = wScore;
  /* подобрать предмет; slot — куда класть оружие (для игрока при обмене) */
  function pickup(ch, it, slot) {
    if (it.t === "i") {
      var cap = ITEMS[it.id].cap; if (ch.items[it.id] >= cap) return false;
      ch.items[it.id] = Math.min(cap, ch.items[it.id] + it.n); removeLoot(it); KP.sfx && ch.isPlayer && KP.sfx("pick"); return true;
    }
    var s = slot;
    if (s === undefined) { for (var i = 1; i <= 4; i++) if (!ch.slots[i]) { s = i; break; } }
    if (s === undefined || s < 1) return false;
    var old = ch.slots[s];
    ch.slots[s] = { id: it.id, r: it.r, mag: WEAPONS[it.id].mag };
    removeLoot(it);
    if (old) { var d = spawnLoot(ch.x + (rnd() - 0.5), ch.z + (rnd() - 0.5), { t: "w", id: old.id, r: old.r }); d.noPick = 2; d.dropper = ch; }
    if (ch.cur === s || ch.cur === 0) equip(ch, s);
    KP.sfx && ch.isPlayer && KP.sfx("pick");
    return true;
  }
  KP.pickup = pickup;
  function equip(ch, s) {
    if (s !== 0 && !ch.slots[s]) return;
    if (ch.cur !== s) { ch.reloadT = 0; ch.healT = 0; ch.swapT = 0.25; }
    ch.cur = s;
    if (ch.mesh) {
      var hand = ch.mesh.userData.parts.hand; while (hand.children.length) hand.remove(hand.children[0]);
      hand.add(KP.weaponMesh(s === 0 ? 0 : ch.slots[s].id, ch.wrap || 0));
    }
  }
  KP.equip = equip;

  /* ---------- персонажи ---------- */
  function makeChar(o) {
    var ch = {
      id: G.chars.length, name: o.name, isPlayer: !!o.isPlayer, skin: o.skin, paint: o.paint, team: o.team !== undefined ? o.team : G.chars.length, ally: !!o.ally,
      x: 0, y: 120, z: 0, vy: 0, mvx: 0, mvz: 0, yaw: 0, pitch: 0, hp: 100, sh: 0, alive: true, state: "plane",
      wood: 0, slots: [{ id: 0 }, null, null, null, null], cur: 0, items: { tube: 0, pal: 0, lac: 0, big: 0, gren: 0, smoke: 0, pop: 0 }, thr: "gren", bloom: 0,
      cd: 0, reloadT: 0, healT: 0, healKind: null, swapT: 0, kos: 0, dmg: 0, built: 0, walk: 0, onGround: false, place: 0, outT: 0,
      ai: o.ai || null, lastHitBy: null, hitT: 0, firing: false, target: null
    };
    if (!ch.isPlayer && Math.random() < 0.35) ch.wrap = 1 + Math.floor(Math.random() * 6);
    if (!G.headless) { ch.mesh = charMesh(ch.skin, ch.paint); ch.mesh.visible = false; G.scene.add(ch.mesh); equip(ch, 0); }
    G.chars.push(ch);
    return ch;
  }
  KP.makeChar = makeChar;

  function damage(ch, d, by, kind) {
    if (!ch.alive || d <= 0) return;
    if (by && by !== ch && by.team === ch.team) return;   // по своим урона нет
    if (ch.isPlayer && window.__shotGod) d *= 0.05;   // только для сцен скриншотов (?shot=)
    if (kind !== "zone") d *= 0.5;   // общий темп боя: матч должен длиться 5–8 минут
    if (by && by !== ch && !by.isPlayer && ch.isPlayer) d *= G.botDmgMul || 1;
    if (by && by !== ch && !by.isPlayer && !ch.isPlayer) d *= 0.5;   // боты между собой бьют слабее: до финала доживает больше соперников
    var real = d;
    if (kind !== "zone" && ch.sh > 0) { var a = Math.min(ch.sh, d); ch.sh -= a; d -= a; }
    ch.hp -= d; ch.healT = 0;
    if (by && by !== ch) { ch.lastHitBy = by; ch.hitT = G.time; by.dmg += real; }
    if (KP.onHit) KP.onHit(ch, real, by, kind);
    if (ch.ai && by && by !== ch && KP.aiHurt) KP.aiHurt(ch, by);
    if (ch.hp <= 0) knockout(ch, by, kind);
  }
  KP.damage = damage;
  function knockout(ch, by, kind) {
    ch.hp = 0; ch.alive = false; ch.state = "out";
    var alive = G.chars.filter(function (c) { return c.alive; }).length;
    ch.place = alive + 1;
    // место команды: когда выбыл последний из команды
    if (!G.chars.some(function (c) { return c.alive && c.team === ch.team; })) {
      var tl = {}; G.chars.forEach(function (c) { if (c.alive) tl[c.team] = 1; });
      G.teamPlace = G.teamPlace || {}; G.teamPlace[ch.team] = Object.keys(tl).length + 1;
    }
    if (by && by !== ch && kind !== "zone") by.kos++;
    // всё выпадает
    var k = 0;
    for (var i = 1; i <= 4; i++) if (ch.slots[i]) { var a = (k++) * 1.3; spawnLoot(ch.x + Math.cos(a) * 1.4, ch.z + Math.sin(a) * 1.4, { t: "w", id: ch.slots[i].id, r: ch.slots[i].r }); }
    ITEM_KEYS.forEach(function (id) { if (ch.items[id]) { var a2 = (k++) * 1.3; spawnLoot(ch.x + Math.cos(a2) * 1.6, ch.z + Math.sin(a2) * 1.6, { t: "i", id: id, n: ch.items[id] }); } });
    burst(ch.x, ch.y + 1, ch.z, paintColor(by ? by.paint : "#888888"), 22, 10);
    KP.sparks && KP.sparks(ch.x, ch.y + 1.2, ch.z, 16, "#9fe9ff");
    ch.outT = 0;
    if (ch.mesh && KP.koVisual) KP.koVisual(ch);
    if (KP.onKO) KP.onKO(ch, by, kind);
  }

  /* ---------- стрельба ---------- */
  function fire(ch, tx, ty, tz, assist) {
    if (!ch.alive || ch.state !== "ground" || ch.cd > 0 || ch.swapT > 0) return false;
    var s = ch.slots[ch.cur], w = WEAPONS[s ? s.id : 0];
    ch.healT = 0;
    if (w.melee) { ch.cd = 1 / w.rate; swing(ch); return true; }
    if (ch.reloadT > 0) return false;
    if (s.mag <= 0) { reload(ch); return false; }
    s.mag--; ch.cd = 1 / w.rate;
    var fwd = 0.55 + (w.size ? 0 : 0) + (w.id === 5 ? 0.5 : w.id === 4 || w.id === 3 ? 0.3 : 0.1);
    var mx = ch.x + Math.sin(ch.yaw) * fwd - Math.cos(ch.yaw) * 0.12, my = ch.y + 1.3, mz = ch.z + Math.cos(ch.yaw) * fwd + Math.sin(ch.yaw) * 0.12;
    var dx = tx - mx, dy = ty - my, dz = tz - mz, L = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    dx /= L; dy /= L; dz /= L;
    var spr = w.spr * (ch.onGround ? 1 : 1.6) * (ch.aiming && !w.pel ? 0.55 : 1) * (1 + (ch.bloom || 0)) * (Math.hypot(ch.mvx, ch.mvz) > 3 ? 1.25 : 1) * Math.PI / 180;
    ch.bloom = Math.min(w.maxB || 0, (ch.bloom || 0) + (w.bloom || 0));
    var n = w.pel || 1, col = paintColor(ch.paint), dm = w.dmg * RAR[s.r].m;
    for (var i = 0; i < n; i++) {
      var ex = (rnd() - 0.5) * 2 * spr, ey = (rnd() - 0.5) * 2 * spr, ez = (rnd() - 0.5) * 2 * spr;
      var vx = dx + ex, vy = dy + ey, vz = dz + ez, l2 = Math.sqrt(vx * vx + vy * vy + vz * vz);
      var spd = w.spd;
      var p = { x: mx, y: my, z: mz, vx: vx / l2 * spd, vy: vy / l2 * spd, vz: vz / l2 * spd, owner: ch, dmg: dm, life: w.rng / spd + 0.05, grav: !!w.grav, splash: w.splash || 0, col: col, wid: w.id };
      if (w.grav) { // навесом: подбираем угол, чтобы долететь
        var hd = Math.hypot(tx - mx, tz - mz), t = Math.max(0.4, hd / 26); p.vx = (tx - mx) / t; p.vz = (tz - mz) / t; p.vy = (ty - my) / t + 0.5 * 20 * t; p.life = 4;
      }
      G.proj.push(p);
    }
    if (!G.headless && KP.flash) KP.flash(mx + dx * 0.15, my + dy * 0.15, mz + dz * 0.15, w.pel ? 0.9 : w.id === 6 ? 1 : 0.55, w.id === 6 ? "#ffd27a" : "#ffe9b0");
    ch.kick = (ch.kick || 0) + (w.kick || 0.02);
    KP.sfx && KP.sfx("shot" + w.id, ch.x, ch.z, ch.isPlayer);
    return true;
  }
  KP.fire = fire;
  /* бросок: краска-граната, дымовая или мгновенная стена. Выбранный вид (ch.thr), если кончился — любой имеющийся */
  function throwItem(ch, tx, ty, tz) {
    if (!ch.alive || ch.state !== "ground" || ch.cd > 0) return false;
    var k = ch.items[ch.thr] > 0 ? ch.thr : ["gren", "smoke", "pop"].filter(function (q) { return ch.items[q] > 0; })[0];
    if (!k) return false;
    ch.items[k]--; ch.cd = 0.7; ch.thrown = (ch.thrown || 0) + 1; ch.healT = 0; ch.swingT = 0.25;
    var mx = ch.x + Math.sin(ch.yaw) * 0.4, my = ch.y + 1.6, mz = ch.z + Math.cos(ch.yaw) * 0.4;
    var hd = Math.min(32, Math.hypot(tx - mx, tz - mz)), t = Math.max(0.5, hd / 17), ang = Math.atan2(tx - mx, tz - mz);
    var ex = mx + Math.sin(ang) * hd, ez = mz + Math.cos(ang) * hd, ey = Math.min(ty, W3.height(ex, ez) + 1);
    G.proj.push({ x: mx, y: my, z: mz, vx: (ex - mx) / t, vz: (ez - mz) / t, vy: (ey - my) / t + 0.5 * 20 * t, owner: ch, dmg: 55, life: 4, grav: true, splash: k === "gren" ? 4.5 : 0, col: k === "gren" ? paintColor(ch.paint) : KP.ITEMS[k].col, wid: 6, thr: k });
    KP.sfx && KP.sfx("throw", ch.x, ch.z, ch.isPlayer);
    return true;
  }
  KP.throwItem = throwItem;
  /* стена в точке (мгновенная стена из гранаты): ставим «как будто» боец стоит там и смотрит от бросившего */
  function popWall(x, z, owner) {
    var fake = { x: x - Math.sin(owner.yaw) * 2.2, z: z - Math.cos(owner.yaw) * 2.2, y: W3.height(x, z), yaw: owner.yaw, wood: 10, onGround: true, paint: owner.paint };
    var r = place(fake, "wall"); if (r === "ok") { var b = G.buildList[G.buildList.length - 1]; b.owner = owner; b.hp = 220; }
    fake.yaw = owner.yaw + Math.PI / 2; fake.wood = 10; place(fake, "wall");
  }
  G.smokes = [];
  function smokeAt(x, y, z) {
    var s = { x: x, y: y + 1.5, z: z, r: 0.5, t: 14 };
    G.smokes.push(s);
    if (!G.headless && KP.smokeVisual) KP.smokeVisual(s);
    KP.sfx && KP.sfx("smoke", x, z);
  }
  function reload(ch) {
    var s = ch.slots[ch.cur]; if (!s || ch.reloadT > 0) return;
    var w = WEAPONS[s.id]; if (s.mag >= w.mag) return;
    ch.reloadT = w.rel; ch.healT = 0;
  }
  KP.reload = reload;
  function swing(ch) {
    var fx = Math.sin(ch.yaw), fz = Math.cos(ch.yaw), hit = false;
    G.chars.forEach(function (o) {
      if (o === ch || !o.alive || o.state !== "ground") return;
      var dx = o.x - ch.x, dz = o.z - ch.z, d = Math.hypot(dx, dz);
      if (d < 2.8 && Math.abs(o.y - ch.y) < 2 && (dx * fx + dz * fz) / (d || 1) > 0.4) { damage(o, 20, ch, "melee"); hit = true; }
    });
    var px = ch.x + fx * 1.6, pz = ch.z + fz * 1.6, near = W3.query(px - 1.6, pz - 1.6, px + 1.6, pz + 1.6);
    for (var i = 0; i < near.length; i++) {
      var c = near[i];
      if ((c.kind === "tree" || c.kind === "crate") && Math.hypot(c.x - px, c.z - pz) < 1.6 + c.r) { hurtProp(c, 20, ch); hit = true; break; }
      if ((c.kind === "wall" || c.kind === "ramp") && px > c.x0 - 1.2 && px < c.x1 + 1.2 && pz > c.z0 - 1.2 && pz < c.z1 + 1.2) { hurtBuild(c, 25); hit = true; break; }
    }
    ch.swingT = 0.25;
    KP.sfx && KP.sfx(hit ? "chop" : "swing", ch.x, ch.z, ch.isPlayer);
    return hit;
  }
  KP.swing = swing;
  KP.chests = [];
  function nearChest(ch, r) { for (var i = 0; i < KP.chests.length; i++) { var c = KP.chests[i]; if (!c.open && Math.hypot(c.x - ch.x, c.z - ch.z) < r) return c; } return null; }
  KP.nearChest = nearChest;

  function segBox(x0, y0, z0, x1, y1, z1, b) {   // отрезок vs AABB → t или -1
    var tmin = 0, tmax = 1, d, o, lo, hi, a;
    var P = [[x0, x1 - x0, b.x0, b.x1], [y0, y1 - y0, b.y0, b.y1], [z0, z1 - z0, b.z0, b.z1]];
    for (var i = 0; i < 3; i++) {
      o = P[i][0]; d = P[i][1]; lo = P[i][2]; hi = P[i][3];
      if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) return -1; continue; }
      var t1 = (lo - o) / d, t2 = (hi - o) / d; if (t1 > t2) { a = t1; t1 = t2; t2 = a; }
      if (t1 > tmin) tmin = t1; if (t2 < tmax) tmax = t2; if (tmin > tmax) return -1;
    }
    return tmin;
  }
  KP.segBox = segBox;
  /* луч видимости: true, если между точками нет домов/построек/рельефа */
  function segSphere(ax, ay, az, bx, by, bz, s) {
    var ux = bx - ax, uy = by - ay, uz = bz - az, L2 = ux * ux + uy * uy + uz * uz || 1;
    var t = Math.max(0, Math.min(1, ((s.x - ax) * ux + (s.y - ay) * uy + (s.z - az) * uz) / L2));
    var qx = ax + ux * t - s.x, qy = ay + uy * t - s.y, qz = az + uz * t - s.z;
    return qx * qx + qy * qy + qz * qz < s.r * s.r;
  }
  KP.smokeTick = function (dt) {
    for (var i = G.smokes.length - 1; i >= 0; i--) { var s = G.smokes[i]; s.t -= dt; s.r = Math.min(5.5, s.r + dt * 6) * (s.t < 2 ? Math.max(0.2, s.t / 2) : 1); if (s.t <= 0) { if (s.vis) s.vis(true); G.smokes.splice(i, 1); } else if (s.vis) s.vis(false); }
  };
  function los(ax, ay, az, bx, by, bz) {
    for (var si = 0; si < G.smokes.length; si++) if (segSphere(ax, ay, az, bx, by, bz, G.smokes[si])) return false;
    var dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz), steps = Math.ceil(L / 5);
    for (var i = 1; i < steps; i++) { var t = i / steps; if (W3.height(ax + dx * t, az + dz * t) > ay + (by - ay) * t) return false; }
    var near = W3.query(Math.min(ax, bx), Math.min(az, bz), Math.max(ax, bx), Math.max(az, bz));
    for (var k = 0; k < near.length; k++) { var c = near[k]; if (c.r) continue; if (segBox(ax, ay, az, bx, by, bz, c) >= 0) return false; }
    return true;
  }
  KP.los = los;

  function explode(p, x, y, z) {
    var R = p.splash;
    G.chars.forEach(function (o) {
      if (!o.alive || o.state !== "ground") return;
      var d = Math.hypot(o.x - x, o.y + 1 - y, o.z - z);
      if (d < R) damage(o, p.dmg * (1 - 0.6 * d / R) * (o === p.owner ? 0.35 : 1), p.owner, "splash");
    });
    var near = W3.query(x - R, z - R, x + R, z + R);
    near.forEach(function (c) { if ((c.kind === "wall" || c.kind === "ramp") && x > c.x0 - R && x < c.x1 + R && z > c.z0 - R && z < c.z1 + R) hurtBuild(c, p.dmg * 2); });
    burst(x, y, z, p.col, 30, 14); splat(x, W3.height(x, z), z, p.col, 2.4); KP.flash && KP.flash(x, y, z, 3.5, "#ffd27a"); KP.sparks && KP.sparks(x, y, z, 18);
    KP.sfx && KP.sfx("boom", x, z);
  }
  function updateProj(dt) {
    for (var i = G.proj.length - 1; i >= 0; i--) {
      var p = G.proj[i];
      p.life -= dt;
      if (p.grav) p.vy -= 20 * dt;
      var nx = p.x + p.vx * dt, ny = p.y + p.vy * dt, nz = p.z + p.vz * dt;
      var segL = Math.sqrt((nx - p.x) * (nx - p.x) + (ny - p.y) * (ny - p.y) + (nz - p.z) * (nz - p.z));
      var hitT = 2, hitC = null, hitB = null, hitProp = null;
      // персонажи
      for (var k = 0; k < G.chars.length; k++) {
        var o = G.chars[k]; if (!o.alive || o === p.owner || o.state === "plane") continue;
        var cx = o.x, cy = o.y + 1.05, cz = o.z;
        var ux = nx - p.x, uy = ny - p.y, uz = nz - p.z, wx = cx - p.x, wy = cy - p.y, wz = cz - p.z;
        var tt = Math.max(0, Math.min(1, (wx * ux + wy * uy + wz * uz) / (segL * segL || 1)));
        var qx = p.x + ux * tt - cx, qy = p.y + uy * tt - cy, qz = p.z + uz * tt - cz;
        var rad = o.isPlayer ? 0.75 : 0.85;
        if (qx * qx + qy * qy * 0.45 + qz * qz < rad * rad && tt < hitT) { hitT = tt; hitC = o; }
      }
      // дома и постройки
      var near = W3.query(Math.min(p.x, nx) - 0.5, Math.min(p.z, nz) - 0.5, Math.max(p.x, nx) + 0.5, Math.max(p.z, nz) + 0.5);
      for (var m = 0; m < near.length; m++) {
        var c = near[m];
        if (c.r) {
          if (ny < c.top && Math.hypot(nx - c.x, nz - c.z) < c.r && 1 < hitT) { hitT = 1; hitProp = c; hitC = null; hitB = null; }
          continue;
        }
        if (c.kind === "ramp") {
          if (nx > c.x0 && nx < c.x1 && nz > c.z0 && nz < c.z1 && ny < rampSurf(c, nx, nz) + 0.15 && ny > c.base - 0.5 && 0.99 < hitT) { hitT = 0.99; hitB = c; hitC = null; hitProp = null; }
          continue;
        }
        var t2 = segBox(p.x, p.y, p.z, nx, ny, nz, c);
        if (t2 >= 0 && t2 < hitT) { hitT = t2; hitB = c; hitC = null; hitProp = null; }
      }
      var gh = W3.height(nx, nz), hitGround = ny < gh;
      if (hitT <= 1 || hitGround) {
        if (hitT > 1) hitT = 1;
        var hx = p.x + (nx - p.x) * hitT, hy = p.y + (ny - p.y) * hitT, hz = p.z + (nz - p.z) * hitT;
        if (p.thr === "smoke") smokeAt(hx, hy, hz);
        else if (p.thr === "pop") popWall(hx, hz, p.owner);
        else if (p.splash) explode(p, hx, hy, hz);
        else if (hitC) { damage(hitC, p.dmg, p.owner, "shot"); burst(hx, hy, hz, p.col, 5, 5); KP.sparks && KP.sparks(hx, hy, hz, hitC.sh > 0 ? 6 : 3, hitC.sh > 0 ? "#8fdcff" : undefined); }
        else if (hitB) { if (hitB.kind === "wall" || hitB.kind === "ramp") hurtBuild(hitB, p.dmg); burst(hx, hy, hz, p.col, 4, 4); KP.sparks && KP.sparks(hx, hy, hz, 3); }
        else if (hitProp) { burst(hx, hy, hz, p.col, 3, 4); }
        else { splat(hx, gh, hz, p.col, p.wid === 3 ? 0.25 : 0.4); burst(hx, gh + 0.1, hz, p.col, 2, 3); KP.sparks && KP.sparks(hx, gh + 0.1, hz, 2); }
        G.proj.splice(i, 1); continue;
      }
      p.x = nx; p.y = ny; p.z = nz;
      if (p.life <= 0) { if (p.thr === "smoke") smokeAt(p.x, p.y, p.z); else if (p.splash) explode(p, p.x, p.y, p.z); G.proj.splice(i, 1); }
    }
  }
  KP.updateProj = updateProj;

  /* ---------- лечение ---------- */
  function startHeal(ch) {
    if (ch.healT > 0 || ch.state !== "ground") return false;
    var k = null;
    if (ch.hp < 100 && ch.items.pal && ch.hp < 55) k = "pal";
    else if (ch.hp < 100 && ch.items.tube) k = "tube";
    else if (ch.sh < 50 && ch.items.big) k = "big";
    else if (ch.sh < 100 && ch.items.lac) k = "lac";
    else if (ch.sh < 100 && ch.items.big) k = "big";
    else if (ch.hp < 100 && ch.items.pal) k = "pal";
    if (!k) return false;
    ch.healKind = k; ch.healT = ITEMS[k].time; ch.reloadT = 0;
    return true;
  }
  KP.startHeal = startHeal;

  /* ---------- зона «Серая хмарь» ---------- */
  function zoneInit(mode) {
    var M = MODES[mode], k = (G.mods && G.mods.zoneK) || 1;
    var ph = M.zone.map(function (z) { return [z[0] * k, z[1] * k, z[2], z[3]]; });
    G.zone = { cx: 0, cz: 0, r: M.r0, sx: 0, sz: 0, sr: M.r0, tx: 0, tz: 0, tr: M.r0, ph: 0, t: 0, shrinking: false, dps: 0, phases: ph, none: !ph.length };
    pickNext();
  }
  function pickNext() {
    var z = G.zone, P = z.phases[z.ph]; if (!P) return;
    var nr = P[2], room = Math.max(0, z.r - nr) * 0.85, a = rnd() * 6.28, d = Math.sqrt(rnd()) * room;
    var tx = z.cx + Math.cos(a) * d, tz = z.cz + Math.sin(a) * d;
    var lim = Math.max(0, 125 - nr), L = Math.hypot(tx, tz); if (L > lim) { tx *= lim / L; tz *= lim / L; }
    for (var k = 0; k < 8 && W3.height(tx, tz) < 0.5; k++) { tx *= 0.8; tz *= 0.8; }
    z.tx = tx; z.tz = tz; z.tr = nr; z.sx = z.cx; z.sz = z.cz; z.sr = z.r;
  }
  function zoneUpdate(dt) {
    var z = G.zone, P = z.phases[z.ph];
    if (!P) return;
    z.t += dt;
    if (!z.shrinking) { if (z.t >= P[0]) { z.shrinking = true; z.t = 0; z.dps = Math.max(z.dps, P[3]); KP.onZone && KP.onZone("move"); } }
    else {
      var k = Math.min(1, z.t / P[1]);
      z.cx = z.sx + (z.tx - z.sx) * k; z.cz = z.sz + (z.tz - z.sz) * k; z.r = z.sr + (z.tr - z.sr) * k;
      if (k >= 1) { z.shrinking = false; z.t = 0; z.ph++; if (z.phases[z.ph]) pickNext(); else z.final = true; }
    }
  }
  KP.zoneInit = zoneInit; KP.zoneUpdate = zoneUpdate;
  KP.zoneLeft = function () { var z = G.zone, P = z.phases[z.ph]; if (!P) return 0; return Math.max(0, (z.shrinking ? P[1] : P[0]) - z.t); };
  KP.outside = function (ch) { var z = G.zone; return Math.hypot(ch.x - z.cx, ch.z - z.cz) > z.r; };
})(window.KP);
