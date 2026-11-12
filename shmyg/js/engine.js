/* Держи Шмыга! · движок забега. Графика — gfx.js, модели — models.js, миры — worlds.js.
   Мир движется вдоль +z, героиня бежит вперёд по z. Дорожки: 0 — левая на экране (x = +2.2), 2 — правая (x = −2.2). */
window.ENGINE = (function () {
  "use strict";
  var D = window.DATA, R = D.RUN, T = window.THREE, G = window.GFX, MD = window.MODELS, WG = window.WORLDGFX;
  var renderer, scene, camera;
  var W = null, WD = null;               // данные мира (DATA) и графика мира (WORLDGFX)
  var road, roadBase, ground, walks = [], props = [], nears = [], glows = [], spinners = [], embers = null, earth = null;
  var PROP_SPAN = 240, NEAR_SPAN = 150;
  var obstacles = [], pickups = [], fx = [];
  var hero = null, thief = null, heroBlob, thiefBlob;
  var mode = "menu", st = null, hooks = {};
  var auto = false, autoErr = 0, skinCur = D.SKINS[0];
  var turntable = false, pool = {}, lastT = 0, menuLift = 0, menuLiftV = 0, palClock = 0, palKey = "", shake = 0;
  var coinIM, COIN_MAX = 420, coinFree = [], coinDummy = new T.Object3D();
  var DIMS = { low: { h: 1.0, d: 0.6 }, high: { h: 2.6, d: 0.5 }, wall: { h: 2.6, d: 1.4 }, train: { h: 3.0, d: 14 }, ramp: { h: 3.0, d: 6.5 },
    gap: { h: 0, d: 3.2 }, roller: { h: 1.1, d: 1.1 }, pad: { h: 0, d: 1.6 }, ice: { h: 0, d: 18 } };

  function laneX(i) { return (1 - i) * R.lane; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function irnd(a, b) { return Math.floor(rnd(a, b + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  /* ---------- Иконки бустов (canvas) — те же картинки в HUD ---------- */
  var iconCache = {};
  function iconCanvas(kind, letter) {
    var key = kind + (letter || "");
    if (iconCache[key]) return iconCache[key];
    var c = document.createElement("canvas"); c.width = c.height = 128; var g = c.getContext("2d");
    var col = kind === "letter" ? "#ffcf2e" : "#" + ("00000" + D.BOOSTS[kind].color.toString(16)).slice(-6);
    var gr = g.createRadialGradient(52, 44, 6, 64, 64, 60); gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.18, col); gr.addColorStop(1, G.shade(parseInt(col.slice(1), 16), -0.45));
    g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.arc(64, 68, 58, 0, 7); g.fill();
    g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 56, 0, 7); g.fill();
    g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 4; g.beginPath(); g.arc(64, 64, 54, 0, 7); g.stroke();
    g.strokeStyle = "#fff"; g.fillStyle = "#fff"; g.lineWidth = 11; g.lineCap = "round"; g.lineJoin = "round";
    g.shadowColor = "rgba(0,0,0,.35)"; g.shadowBlur = 6; g.shadowOffsetY = 3;
    if (kind === "magnet") { g.beginPath(); g.moveTo(42, 34); g.lineTo(42, 64); g.arc(64, 64, 22, Math.PI, 0, true); g.lineTo(86, 34); g.stroke(); g.strokeStyle = "#ffe27a"; g.beginPath(); g.moveTo(42, 32); g.lineTo(42, 42); g.moveTo(86, 32); g.lineTo(86, 42); g.stroke(); }
    else if (kind === "x2") { g.font = "900 50px system-ui, Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("×2", 64, 68); }
    else if (kind === "shield") { g.beginPath(); g.moveTo(64, 28); g.lineTo(92, 40); g.quadraticCurveTo(90, 82, 64, 100); g.quadraticCurveTo(38, 82, 36, 40); g.closePath(); g.fill(); }
    else if (kind === "jet") { g.fillRect(44, 32, 16, 44); g.fillRect(68, 32, 16, 44); g.fillStyle = "#ffe27a"; g.beginPath(); g.moveTo(44, 80); g.lineTo(52, 104); g.lineTo(60, 80); g.moveTo(68, 80); g.lineTo(76, 104); g.lineTo(84, 80); g.fill(); }
    else if (kind === "shoes") { g.beginPath(); g.moveTo(32, 84); g.lineTo(32, 50); g.lineTo(58, 50); g.lineTo(66, 66); g.lineTo(96, 72); g.lineTo(96, 84); g.closePath(); g.fill(); g.beginPath(); g.moveTo(40, 40); g.lineTo(48, 26); g.moveTo(60, 40); g.lineTo(68, 26); g.stroke(); }
    else if (kind === "letter") { g.fillStyle = "#7a4200"; g.font = "900 64px system-ui, Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(letter, 64, 70); }
    iconCache[key] = c; return c;
  }
  function iconURL(kind) { return iconCanvas(kind).toDataURL(); }
  var spriteMats = {};
  function spriteMat(kind, letter) {
    var key = kind + (letter || "");
    if (!spriteMats[key]) { var t = new T.CanvasTexture(iconCanvas(kind, letter)); t.encoding = T.sRGBEncoding; spriteMats[key] = new T.SpriteMaterial({ map: t, depthWrite: false }); }
    return spriteMats[key];
  }

  /* ---------- Мир: дорога, тротуары, земля, окружение ---------- */
  function clearWorld() {
    props.concat(nears).forEach(function (p) { scene.remove(p.g); }); props = []; nears = []; glows = []; spinners = [];
    obstacles.forEach(function (o) { scene.remove(o.mesh); }); obstacles = [];
    pickups.forEach(function (p) { killPickup(p); }); pickups = [];
    walks.forEach(function (w) { scene.remove(w); }); walks = [];
    if (embers) { scene.remove(embers); embers = null; } if (earth) { scene.remove(earth); earth = null; }
    pool = {};
  }
  function collectGlows(g) { g.traverse(function (o) { if (o.isSprite && o.userData.nightGlow) glows.push(o); if (o.userData && o.userData.spinner) spinners.push(o.userData.spinner); }); }
  function walkTex(hex, key) { return G.groundTex("walk:" + key, hex, function (g, s) { for (var y = 0; y < s; y += 32) for (var x = (y / 32) % 2 ? -16 : 0; x < s; x += 32) { g.fillStyle = G.shade(hex, (Math.random() - 0.5) * 0.18); g.fillRect(x + 1, y + 1, 30, 30); } }); }
  function setWorld(id) {
    var w = D.WORLDS.filter(function (x) { return x.id === id; })[0] || D.WORLDS[0];
    if (W === w && props.length) return;
    clearWorld(); W = w; WD = WG.W[w.id] || WG.W.town;
    var rt = G.roadTex("road:" + w.id, WD.road); road.material.map = rt;
    road.material.roughness = w.id === "snow" ? 0.55 : w.id === "moon" ? 0.5 : 0.85; road.material.metalness = w.id === "moon" ? 0.3 : 0;
    road.material.emissive = G.lin(WD.roadGlow || 0x000000); road.material.emissiveMap = WD.roadGlow ? rt : null; road.material.emissiveIntensity = WD.roadGlow ? 0.25 : 0;
    road.material.needsUpdate = true;
    roadBase.visible = !!WD.clouds;
    var gt = G.groundTex("ground:" + w.id, WD.ground, WD.groundPaint); ground.material.map = gt; ground.material.needsUpdate = true;
    ground.position.y = WD.groundY || (WD.water ? -0.6 : -0.02);
    ground.material.roughness = WD.water ? 0.12 : 0.95; ground.material.metalness = WD.water ? 0.4 : 0;
    var sd = WD.side || { curb: 0xaaaaaa, walk: 0x999999, walkW: 2 };
    [-1, 1].forEach(function (s) {
      var wt = walkTex(sd.walk, w.id).clone(); wt.needsUpdate = true; wt.repeat.set(sd.walkW / 2, 85);
      var wm = new T.Mesh(new T.BoxGeometry(sd.walkW, 0.18, 170), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, map: wt }));
      wm.position.set(s * (3.55 + sd.walkW / 2), 0.09, 0); wm.receiveShadow = true; wm.userData.tex = wt; scene.add(wm); walks.push(wm);
      var cb = new T.Mesh(new T.BoxGeometry(0.25, 0.26, 170), G.mat(sd.curb, "stone")); cb.position.set(s * 3.45, 0.13, 0); cb.receiveShadow = true; scene.add(cb); walks.push(cb);
      if (sd.rail) { var rl = new T.Mesh(new T.BoxGeometry(0.1, 0.1, 170), G.mat(0xe8c070, "gold")); rl.position.set(s * 3.5, 1.1, 0); scene.add(rl); walks.push(rl); }
    });
    for (var i = 0; i < 48; i++) {
      var side = i % 2 ? 1 : -1, g = G.merge(WD.props(side)); g.traverse(function (o) { o.castShadow = false; });
      var z = (i >> 1) * (PROP_SPAN / 24) + rnd(-3, 3), off = g.userData.off ? rnd(g.userData.off[0], g.userData.off[1]) : WD.tunnel ? rnd(6.5, 9) : rnd(8.5, 22);
      g.position.x = side * off; g.position.z = z; g.rotation.y = rnd(-0.15, 0.15);
      scene.add(g); props.push({ g: g }); collectGlows(g);
    }
    var every = WD.nearEvery || 14;
    for (var k = 0; k * every < NEAR_SPAN; k++) {
      [-1, 1].forEach(function (s) {
        if (WD.tunnel && s < 0) return;
        var ng = G.merge(WD.near(s)); ng.traverse(function (o) { o.castShadow = false; }); ng.position.set(s * 4.4, 0.18, k * every + (s > 0 ? 0 : every / 2)); scene.add(ng); nears.push({ g: ng }); collectGlows(ng);
      });
    }
    if (WD.feat && WD.feat.embers) { embers = makeEmbers(0xff8a2a); scene.add(embers); }
    if (WD.earth) { earth = new T.Sprite(new T.SpriteMaterial({ map: earthTex(), fog: false, depthWrite: false })); earth.scale.set(40, 40, 1); scene.add(earth); }
    palKey = ""; updatePal(0, true);
  }
  function earthTex() {
    return G.spriteTex("earth", function (g, s) {
      var r = s / 2 - 4, gr = g.createRadialGradient(s * 0.4, s * 0.38, r * 0.1, s / 2, s / 2, r);
      gr.addColorStop(0, "#7ac8ff"); gr.addColorStop(0.7, "#2a6ac8"); gr.addColorStop(1, "#0a1a4a");
      g.fillStyle = gr; g.beginPath(); g.arc(s / 2, s / 2, r, 0, 7); g.fill();
      g.fillStyle = "rgba(80,170,90,.85)"; for (var i = 0; i < 9; i++) { g.beginPath(); g.ellipse(s * rnd(0.3, 0.7), s * rnd(0.3, 0.7), rnd(10, 30), rnd(6, 18), rnd(0, 3), 0, 7); g.fill(); }
      g.fillStyle = "rgba(255,255,255,.55)"; for (var j = 0; j < 7; j++) { g.beginPath(); g.ellipse(s * rnd(0.25, 0.75), s * rnd(0.25, 0.75), rnd(12, 34), rnd(3, 6), rnd(0, 3), 0, 7); g.fill(); }
      var sh = g.createLinearGradient(s * 0.2, 0, s, 0); sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(0.6, "rgba(0,0,10,.15)"); sh.addColorStop(1, "rgba(0,0,10,.8)"); g.fillStyle = sh; g.beginPath(); g.arc(s / 2, s / 2, r, 0, 7); g.fill();
    }, 256);
  }
  function makeEmbers(c) {
    var n = 160, geo = new T.BufferGeometry(), pos = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) { pos[i * 3] = rnd(-12, 12); pos[i * 3 + 1] = rnd(0, 8); pos[i * 3 + 2] = rnd(-10, 90); }
    geo.setAttribute("position", new T.BufferAttribute(pos, 3));
    var p = new T.Points(geo, new T.PointsMaterial({ color: c, size: 0.12, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false }));
    p.frustumCulled = false; return p;
  }

  /* ---------- Время суток ---------- */
  var CYCLE = [["day", 0], ["day", 70], ["dusk", 90], ["dusk", 102], ["night", 122], ["night", 175], ["dusk", 192], ["day", 210]];
  var CYCLE_LEN = 210;
  function palAt(t) {
    var p = WD.pal;
    if (!WD.cycle || !p.dusk) return { a: "day", b: "day", k: 0 };
    t = t % CYCLE_LEN;
    for (var i = 0; i < CYCLE.length - 1; i++) if (t >= CYCLE[i][1] && t < CYCLE[i + 1][1]) { var k = (t - CYCLE[i][1]) / (CYCLE[i + 1][1] - CYCLE[i][1]); return { a: CYCLE[i][0], b: CYCLE[i + 1][0], k: k }; }
    return { a: "day", b: "day", k: 0 };
  }
  function updatePal(t, force) {
    var q = palAt(t), p = q.a === q.b ? WD.pal[q.a] : G.mixPal(WD.pal[q.a], WD.pal[q.b], q.k);
    var key = q.k < 0.5 ? q.a : q.b;
    var stormK = 0;
    if (WD.feat && WD.feat.storm && st && mode === "run") stormK = Math.max(0, Math.sin(st.t * 0.12) - 0.55) * 2.2;
    if (stormK > 0) p = Object.assign({}, p, { fogNear: p.fogNear * (1 - stormK * 0.7), fogFar: p.fogFar * (1 - stormK * 0.55), fog: 0xd8a868 });
    G.applyPal(p, force || key !== palKey);
    palKey = key;
    var n = G.night();
    glows.forEach(function (s) { s.material.opacity = s.userData.nightGlow * n; s.visible = n > 0.02; });
  }

  /* ---------- Препятствия ---------- */
  function buildObstacle(type, moving) {
    var o = WD.obs[type];
    var g = !o ? WD.obs.low() : type === "train" ? o(moving) : o();
    if (g.userData.spin) g.userData.spin.userData.keep = true;
    return G.merge(g);
  }
  function addObstacle(type, lane, zFront, moving, extra) {
    var key = W.id + ":" + type + (moving ? "m" : ""), mesh = (pool[key] && pool[key].pop());
    if (!mesh) {
      if (type === "ice") { var im = new T.Mesh(new T.PlaneGeometry(2.1, 1), G.mat(0xbfe8ff, "ice", { opacity: 0.75, emissive: 0x6ab8ff, ei: 0.15 })); im.rotation.x = -Math.PI / 2; im.position.y = 0.025; mesh = new T.Group(); mesh.add(im); }
      else mesh = buildObstacle(type, moving);
    }
    var d = (extra && extra.d) || DIMS[type].d;
    if (type === "ice") mesh.children[0].scale.y = d;
    mesh.position.set(laneX(lane), 0, zFront + d / 2); mesh.visible = true; scene.add(mesh);
    var ob = { type: type, lane: lane, z0: zFront, z1: zFront + d, top: DIMS[type].h, mesh: mesh, key: key, vz: moving ? (type === "roller" ? -6 : -7) : 0, dead: false };
    obstacles.push(ob); return ob;
  }
  function removeObstacle(ob) { scene.remove(ob.mesh); (pool[ob.key] = pool[ob.key] || []).push(ob.mesh); ob.dead = true; }

  /* ---------- Подбираемое: монеты — один InstancedMesh ---------- */
  var barGeo, bubbleGeo;
  function addPickup(kind, lane, z, y, letter) {
    var p = { kind: kind, lane: lane, x: laneX(lane), y: y, z: z, y0: y, dead: false, fly: false, letter: letter };
    if (kind === "coin") { if (!coinFree.length) return null; p.i = coinFree.pop(); }
    else if (kind === "bar") { p.mesh = (pool.bar && pool.bar.pop()) || new T.Mesh(barGeo, G.mat(0xffc21a, "gold")); p.mesh.castShadow = true; scene.add(p.mesh); }
    else {
      var g = new T.Group(), sp = new T.Sprite(spriteMat(kind, letter)); sp.scale.set(0.95, 0.95, 1); g.add(sp);
      g.add(new T.Mesh(bubbleGeo, G.mat(0xffffff, "glass", { opacity: 0.18 })));
      p.mesh = g; scene.add(g);
    }
    if (p.mesh) p.mesh.position.set(p.x, y, z);
    pickups.push(p); return p;
  }
  function killPickup(p) {
    if (p.kind === "coin") { coinDummy.position.set(0, -50, 0); coinDummy.scale.setScalar(0.0001); coinDummy.updateMatrix(); coinIM.setMatrixAt(p.i, coinDummy.matrix); coinFree.push(p.i); coinIM.instanceMatrix.needsUpdate = true; }
    else if (p.mesh) { scene.remove(p.mesh); if (p.kind === "bar") (pool.bar = pool.bar || []).push(p.mesh); }
    p.dead = true;
  }
  function coinLine(lane, z0, n, y, step) { for (var i = 0; i < n; i++) addPickup("coin", lane, z0 + i * (step || 2.2), y || 0.85); }
  function coinArc(lane, zc, n, h) { for (var i = 0; i < n; i++) { var t = i / (n - 1); addPickup("coin", lane, zc - 5 + t * 10, 0.85 + Math.sin(t * Math.PI) * (h || 1.9)); } }

  /* ---------- Генератор трассы ---------- */
  function feat(k) { return (WD.feat && WD.feat[k]) || 0; }
  /* обучение: заданная последовательность, у каждого препятствия метка нужного действия */
  function spawnTut() {
    var z = st.nextZ, k = st.tutK++;
    if (k === 0) { coinLine(1, z, 6); st.nextZ += 40; return; }
    if (k === 1) { var w = addObstacle("wall", 1, z); w.tut = "lr"; coinLine(0, z - 6, 8); coinLine(2, z - 6, 8); st.nextZ += 46; return; }
    if (k === 2) { [0, 1, 2].forEach(function (l) { var o = addObstacle("low", l, z); o.tut = "up"; coinArc(l, z + 0.3, 7); }); st.nextZ += 46; return; }
    if (k === 3) { [0, 1, 2].forEach(function (l) { var o = addObstacle("high", l, z); o.tut = "down"; }); coinLine(st.lane, z - 6, 6); st.nextZ += 46; return; }
    if (k === 4) { var b = addPickup("magnet", 1, z, 1.25); [0, 2].forEach(function (l) { coinLine(l, z + 6, 10); }); st.nextZ += 50; return; }
    st.tut = false; st.tutEnd = z;   // «готово» — когда героиня добежит до конца обучающего участка
    spawnRow();
  }
  function tutCheck() {
    var hz = st.dist, o = null;
    for (var i = 0; i < obstacles.length; i++) { var q = obstacles[i]; if (!q.dead && q.tut && !q.tutDone && q.z1 > hz - 0.5 && (!o || q.z0 < o.z0)) o = q; }
    var near = o ? (o.tut === "lr" ? 11 : 5.2) : 0;
    if (o && o.z0 - hz < near && o.z0 - hz > -0.3) { if (st.tutWait !== o.tut) { st.tutWait = o.tut; st.tutObs = o; if (hooks.tut) hooks.tut(o.tut); } }
    else if (st.tutWait) { st.tutWait = null; if (hooks.tut) hooks.tut(null); }
    if (!st.tut && st.tutEnd && hz > st.tutEnd) { st.tutEnd = 0; if (hooks.tut) hooks.tut("done"); }
  }
  function spawnRow() {
    if (st.tut) { spawnTut(); return; }
    var z = st.nextZ, sp = st.speed, diff = Math.min(1, st.dist / 4000);
    if (st.dist < 60 && z < 70) { coinLine(1, z, 7); st.nextZ += 24; return; }
    var rowTypes = [
      { w: 3, f: rowSingle }, { w: 2.2, f: rowDouble }, { w: 1.6 + diff * 1.4, f: rowTrains }, { w: 1.2, f: rowCoins }, { w: 0.9 + diff, f: rowMixed },
      { w: feat("gaps") * 10, f: rowGap }, { w: feat("rollers") * 10 * (0.4 + diff), f: rowRoller }, { w: feat("pads") * 10, f: rowPad }
    ];
    var sum = rowTypes.reduce(function (s, x) { return s + x.w; }, 0), q = Math.random() * sum, f = rowTypes[0].f;
    for (var i = 0; i < rowTypes.length; i++) { q -= rowTypes[i].w; if (q <= 0) { f = rowTypes[i].f; break; } }
    var used = f(z, diff) || 2;
    var gap = sp * rnd(0.85, 1.25) + 5 - diff * 2;
    st.nextZ = z + used + gap;
    if (feat("ice") && Math.random() < feat("ice")) addObstacle("ice", irnd(0, 2), z - 4, false, { d: rnd(12, 22) });
    if (Math.random() < 0.13) spawnBoost(st.nextZ - gap / 2);
    else if (st.dist - st.lastBarAt > st.barEvery) { st.lastBarAt = st.dist; addPickup("bar", st.lastFree != null ? st.lastFree : irnd(0, 2), st.nextZ - gap / 2, 1.0); }
    if (st.letter && !st.letterShown && st.dist > st.letterAt) { st.letterShown = true; addPickup("letter", irnd(0, 2), st.nextZ - gap / 2, 1.2, st.letter); }
  }
  function spawnBoost(z) { var kinds = D.BOOST_ORDER.slice(); if (st.jet > 0) kinds = ["magnet", "x2"]; addPickup(pick(kinds), irnd(0, 2), z, 1.25); }
  function rowSingle(z) {
    var lane = irnd(0, 2), t = Math.random() < 0.5 ? "low" : "high";
    addObstacle(t, lane, z);
    if (t === "low") coinArc(lane, z + 0.3, 7); else coinLine(lane, z - 6, 7);
    var other = (lane + irnd(1, 2)) % 3; if (Math.random() < 0.6) coinLine(other, z - 6, 8);
    st.lastFree = other; return 1;
  }
  function rowDouble(z) {
    var free = irnd(0, 2), types = ["low", "high", "wall"];
    [0, 1, 2].forEach(function (l) { if (l !== free) addObstacle(pick(types), l, z); });
    coinLine(free, z - 8, 9); st.lastFree = free; return 2;
  }
  function rowTrains(z, diff) {
    var free = irnd(0, 2), L = DIMS.train.d, top = false;
    var lanes = [0, 1, 2].filter(function (l) { return l !== free; });
    if (Math.random() < 0.35) lanes = [pick(lanes)];
    lanes.forEach(function (l, i) {
      var moving = diff > 0.25 && Math.random() < 0.3 * diff && i === 0 && lanes.length === 1;
      if (moving) { addObstacle("train", l, z + 30, true); return; }
      if (!top && Math.random() < 0.45) { addObstacle("ramp", l, z - DIMS.ramp.d); addObstacle("train", l, z); top = true; coinLine(l, z + 1, 6, 3.85); }
      else addObstacle("train", l, z + (lanes.length > 1 && i ? rnd(0, 6) : 0));
    });
    coinLine(free, z - 2, 8); st.lastFree = free; return L + 6;
  }
  function rowCoins(z) {
    var lane = irnd(0, 2);
    if (Math.random() < 0.5) coinLine(lane, z, 14);
    else for (var i = 0; i < 16; i++) addPickup("coin", Math.round(1 + Math.sin(i / 3) * 1), z + i * 2.2, 0.85);
    st.lastFree = lane; return 32;
  }
  function rowMixed(z) {
    var a = irnd(0, 2), b = (a + 1 + irnd(0, 1)) % 3;
    addObstacle("high", a, z); addObstacle("low", b, z + 9);
    coinLine(a, z - 3, 4); coinArc(b, z + 9.3, 7);
    st.lastFree = 3 - a - b; return 10;
  }
  function rowGap(z) {
    var all = Math.random() < 0.5, free = irnd(0, 2);
    [0, 1, 2].forEach(function (l) { if (all || l !== free) { addObstacle("gap", l, z); coinArc(l, z + 1.6, 6, 2.2); } });
    if (!all) coinLine(free, z - 4, 6);
    st.lastFree = all ? 1 : free; return DIMS.gap.d + 2;
  }
  function rowRoller(z) {
    var lane = irnd(0, 2); addObstacle("roller", lane, z + 26, true);
    var other = (lane + irnd(1, 2)) % 3; coinLine(other, z, 8); st.lastFree = other; return 6;
  }
  function rowPad(z) {
    var lane = irnd(0, 2); addObstacle("pad", lane, z);
    for (var i = 0; i < 10; i++) { var t = i / 9; addPickup("coin", lane, z + 4 + t * 26, 1 + Math.sin(t * Math.PI) * 6.5); }
    st.lastFree = lane; return 8;
  }

  /* ---------- Звук ---------- */
  function sfx(name) { if (st && st.fast) return; try { if (window.AUDIO) window.AUDIO.sfx(name); } catch (e) {} }
  function unlockAudio() { try { if (window.AUDIO) window.AUDIO.unlock(); } catch (e) {} }

  /* ---------- Забег ---------- */
  function newRun(opts) {
    opts = opts || {};
    obstacles.forEach(function (o) { removeObstacle(o); }); obstacles = [];
    pickups.forEach(function (p) { killPickup(p); }); pickups = [];
    var perk = opts.perk || {};
    st = { dist: 0, t: 0, speed: R.speed0, lane: 1, laneFrom: 1, x: 0, y: 0, vy: 0, slide: 0, nextZ: 18, onGround: true, onIce: false,
      coins: 0, coinF: 0, bars: 0, boostsGot: 0, jumps: 0, slides: 0, caught: 0, letterGot: "", phase: 0, anim: "run",
      boost: { magnet: 0, x2: 0, shield: 0, jet: 0, shoes: 0 }, jet: 0, inv: 0, stumbleAt: -99, stumbleFree: perk.stumble || 0, chase: 0,
      coinMul: (opts.coinMul || 1) + (perk.coins || 0), levels: opts.levels || {}, perk: perk,
      letter: opts.letter || "", letterAt: rnd(250, 600), letterShown: false,
      lastBarAt: -150, barEvery: 480 / (1 + (perk.bars || 0) + (opts.eventBars || 0)), catchBonus: opts.catchBonus || 0, lastFree: 1, continues: 0, ended: false, fast: !!opts.fast,
      gravity: R.gravity * (WD.gravity || 1), cycle0: opts.cycle0 || 0, tut: !!opts.tutorial, tutK: 0, tutWait: null };
    thief.gap = 17; thief.flee = 0; thief.lane = 1; thief.x = 0; thief.laneT = 1;
    hero.body.rotation.set(0, 0, 0); hero.body.position.set(0, 0, 0); hero.stars.visible = false; hero.root.rotation.set(0, 0, 0);
    if (opts.startShield || perk.startShield) giveBoost("shield");
    if (opts.startJet) giveBoost("jet");
    if (opts.startX2) giveBoost("x2");
    mode = "run"; palKey = "";
    try { if (window.AUDIO) window.AUDIO.music(W.id); } catch (e) {}
  }
  function dur(kind) { var add = (st.perk && st.perk[kind]) || 0; return D.BOOSTS[kind].dur[Math.min(5, st.levels[kind] || 0)] + add; }
  function giveBoost(kind) {
    st.boost[kind] = dur(kind);
    if (kind === "jet") {
      st.jet = st.boost.jet;
      var z = st.dist + 12, end = st.dist + 12 + st.speed * st.jet;
      for (var i = 0; z < end; z += 2.4, i++) addPickup("coin", Math.round(1 + Math.sin(i / 5) * 1), z, 6.6);
    }
  }
  function crash(why) {
    if (st.ended || mode !== "run") return;
    mode = "crash"; st.anim = "fall"; st.why = why; st.ctx = { lane: st.lane, from: st.laneFrom, x: +st.x.toFixed(2), y: +st.y.toFixed(2), vy: +st.vy.toFixed(1), ice: st.onIce, slide: +st.slide.toFixed(2), sp: +st.speed.toFixed(1), obs: obstacles.filter(function (o) { return !o.dead && o.z1 > st.dist - 3 && o.z0 < st.dist + 25; }).map(function (o) { return o.type + o.lane + "@" + (o.z0 - st.dist).toFixed(1) + (o.vz ? "m" : ""); }) }; sfx("crash"); hero.stars.visible = true; shake = 0.5;
    if (hooks.crash) hooks.crash(stats(), why);
  }
  function stats() {
    return { dist: Math.floor(st.dist), coins: st.coins, bars: st.bars, boosts: st.boostsGot, jumps: st.jumps, slides: st.slides,
      caught: st.caught, letter: st.letterGot, time: st.t, continues: st.continues, chase: st.chase, boost: st.boost, why: st.why || "", ctx: st.ctx };
  }
  function continueRun() {
    if (mode !== "crash") return;
    obstacles.forEach(function (o) { if (o.type !== "ice" && o.z1 > st.dist - 3 && o.z0 < st.dist + 50) removeObstacle(o); });
    obstacles = obstacles.filter(function (o) { return !o.dead; });
    st.inv = 2.5; st.continues++; st.y = 0; st.vy = 0; st.anim = "run"; hero.stars.visible = false; hero.body.rotation.set(0, 0, 0); hero.body.position.set(0, 0, 0);
    st.lane = Math.round(Math.max(0, Math.min(2, 1 - st.x / R.lane))); st.laneFrom = st.lane;
    mode = "run";
  }
  function endRun() { if (!st || st.ended) return; st.ended = true; mode = "over"; if (hooks.end) hooks.end(stats()); }

  /* ---------- Управление ---------- */
  function input(a) {
    if (mode !== "run") return;
    unlockAudio();
    if (st.tutWait && ((st.tutWait === "lr" && (a === "left" || a === "right")) || st.tutWait === a)) {
      var z0 = st.tutObs.z0; obstacles.forEach(function (o) { if (o.tut && Math.abs(o.z0 - z0) < 1) o.tutDone = true; });
      st.tutWait = null; if (hooks.tut) hooks.tut(null);
    }
    if (a === "left" || a === "right") {
      var nl = st.lane + (a === "left" ? -1 : 1);
      if (nl < 0 || nl > 2) { sfx("bump"); shake = 0.12; return; }
      st.laneFrom = st.lane; st.lane = nl; sfx("whoosh");
    } else if (a === "up") {
      if (st.jet > 0) return;
      if (st.onGround) { st.vy = (st.boost.shoes > 0 ? R.shoesJumpV : R.jumpV) * (WD.gravity ? Math.sqrt(WD.gravity) : 1); st.slide = 0; st.jumps++; sfx("jump"); }
    } else if (a === "down") {
      if (st.jet > 0) return;
      if (!st.onGround) st.vy = -24;
      st.slide = R.slideT; st.slides++; sfx("slide");
    }
  }

  /* ---------- Физика ---------- */
  function groundAt(x, z, y) {
    var g = 0;
    for (var i = 0; i < obstacles.length; i++) {
      var o = obstacles[i];
      if (o.dead || Math.abs(laneX(o.lane) - x) > 1.0 || z < o.z0 - 0.3 || z > o.z1 + 0.3) continue;
      var s = o.type === "train" ? o.top : o.type === "ramp" ? Math.max(0, Math.min(1, (z - o.z0) / (o.z1 - o.z0))) * o.top : -1;
      if (s > g && y >= s - (o.type === "ramp" ? 1.0 : 0.55)) g = s;
    }
    return g;
  }
  function overGap(x, z) {
    for (var i = 0; i < obstacles.length; i++) { var o = obstacles[i]; if (!o.dead && o.type === "gap" && Math.abs(laneX(o.lane) - x) < 0.8 && z > o.z0 + 0.35 && z < o.z1 - 0.35) return o; }
    return null;
  }
  function step(dt) {
    if (mode !== "run") return;
    if (st.tutWait && !auto) dt *= 0.1;   // замедление, пока игрок не сделал нужное движение
    st.t += dt;
    st.speed = R.speed0 + (R.speedMax - R.speed0) * (1 - Math.exp(-st.t / R.speedTau));
    var dz = st.speed * dt; st.dist += dz; st.phase += dz * 0.62;
    if (auto) autoplay();
    if (st.tut || st.tutWait || st.tutEnd) tutCheck();
    D.BOOST_ORDER.forEach(function (k) { if (st.boost[k] > 0) st.boost[k] = Math.max(0, st.boost[k] - dt); });
    if (st.jet > 0) { st.jet -= dt; if (st.jet <= 0) { st.jet = 0; st.inv = Math.max(st.inv, 1.6); clearAhead(32); } }
    if (st.inv > 0) st.inv -= dt;
    st.onIce = false;
    if (st.y < 0.1) for (var q = 0; q < obstacles.length; q++) { var oi = obstacles[q]; if (!oi.dead && oi.type === "ice" && Math.abs(laneX(oi.lane) - st.x) < 1.1 && st.dist > oi.z0 && st.dist < oi.z1) { st.onIce = true; break; } }
    var tx = laneX(st.lane); st.x += (tx - st.x) * Math.min(1, dt * (st.onIce ? 5 : 14));
    var hz = st.dist;
    if (st.jet > 0) { st.y += (6 - st.y) * Math.min(1, dt * 4); st.vy = 0; st.onGround = false; }
    else {
      var gnd = groundAt(st.x, hz, st.y), gap = gnd === 0 && overGap(st.x, hz);
      st.vy -= st.gravity * dt; st.y += st.vy * dt;
      if (gap && st.y <= 0.02) {
        if (st.boost.shield > 0 || st.inv > 0) { st.vy = R.jumpV; st.boost.shield = 0; st.inv = Math.max(st.inv, 0.8); sfx("shield"); }
        else if (st.y < -0.6) { crash("gap"); return; }
        st.onGround = false;
      } else if (st.y <= gnd) { st.y = gnd; st.vy = 0; st.onGround = true; } else st.onGround = st.y - gnd < 0.05;
    }
    if (st.slide > 0) st.slide -= dt;
    st.anim = st.jet > 0 ? "fly" : st.slide > 0 ? "slide" : !st.onGround ? "jump" : "run";
    obstacles.forEach(function (o) { if (o.vz && o.z0 < hz + 75) { o.z0 += o.vz * dt; o.z1 += o.vz * dt; o.mesh.position.z += o.vz * dt; if (o.mesh.userData.spin) o.mesh.userData.spin.rotation.x -= o.vz * dt / 0.55; } });
    if (st.jet <= 0) collide(dz);
    if (mode !== "run") return;
    if (st.onGround) for (var b = 0; b < obstacles.length; b++) { var pd = obstacles[b]; if (!pd.dead && pd.type === "pad" && Math.abs(laneX(pd.lane) - st.x) < 0.9 && hz > pd.z0 && hz < pd.z1) { st.vy = 19; st.onGround = false; sfx("boing"); break; } }
    var mag = st.boost.magnet > 0, h = st.slide > 0 ? 1.0 : 1.9;
    for (var i = 0; i < pickups.length; i++) {
      var p = pickups[i]; if (p.dead) continue;
      if (p.z < hz - 3) { killPickup(p); continue; }
      if (p.kind === "coin" && mag && p.z < hz + 15 && p.z > hz - 1) p.fly = true;
      if (p.fly) { var k = Math.min(1, dt * 12); p.x += (st.x - p.x) * k; p.y += (st.y + 1 - p.y) * k; p.z += (hz + 0.2 - p.z) * k; }
      if (Math.abs(p.x - st.x) < 1.0 && Math.abs(p.z - hz) < 0.9 && p.y > st.y - 0.4 && p.y < st.y + h + 0.4) collect(p);
    }
    pickups = pickups.filter(function (p) { return !p.dead; });
    obstacles = obstacles.filter(function (o) { if (!o.dead && o.z1 < hz - 10) removeObstacle(o); return !o.dead; });
    while (st.nextZ < hz + 145) spawnRow();
    st.chase = Math.max(0, st.chase);
    if (st.chase >= 100) {
      st.chase = 0; st.caught++; st.bars += R.catchReward + st.catchBonus; thief.flee = 1.6; sfx("caught");
      burst(thief.root.position.x, thief.root.position.y + 1.4, thief.root.position.z, 0xffc93a, 26);
      if (hooks.caught) hooks.caught(stats());
    }
  }
  function clearAhead(len) {
    obstacles.forEach(function (o) { if (o.type !== "ice" && o.z1 > st.dist - 1 && o.z0 < st.dist + len) removeObstacle(o); });
    obstacles = obstacles.filter(function (o) { return !o.dead; });
  }
  function collide(dz) {
    var hz = st.dist, top = st.y + (st.slide > 0 ? 0.8 : 1.7);
    for (var i = 0; i < obstacles.length; i++) {
      var o = obstacles[i];
      if (o.dead || o.type === "ramp" || o.type === "gap" || o.type === "pad" || o.type === "ice") continue;
      if (Math.abs(laneX(o.lane) - st.x) > 1.25) continue;
      if (hz + 0.35 < o.z0 || hz - 0.35 > o.z1) continue;
      var hit = false;
      if (o.type === "low" || o.type === "roller") hit = st.y < o.top - 0.05;
      else if (o.type === "high") hit = top > 1.2 && st.y < 2.55;
      else if (o.type === "wall") hit = st.y < 2.55;
      else if (o.type === "train") hit = st.y < o.top - 0.5;
      if (!hit || st.inv > 0) continue;
      if (st.boost.shield > 0) { st.boost.shield = 0; st.inv = 1.0; burst(laneX(o.lane), 1, o.z0, 0x8fd8ff, 18); removeObstacle(o); sfx("shield"); shake = 0.2; return; }
      var depth = hz + 0.35 - o.z0, side = depth > 0.45 + dz * 2 + (o.vz ? 0.4 : 0) && st.laneFrom !== st.lane && Math.abs(laneX(st.lane) - st.x) > 0.25;
      if (side) {
        st.lane = st.laneFrom; st.chase += R.stumbleCatch; sfx("stumble"); shake = 0.25;
        if (st.stumbleFree > 0) { st.stumbleFree--; return; }
        if (st.t - st.stumbleAt < R.stumbleWindow) { crash("stumble"); return; }
        st.stumbleAt = st.t; if (hooks.stumble) hooks.stumble(); return;
      }
      crash(o.type); return;
    }
  }
  function collect(p) {
    var x = p.x, y = p.y, z = p.z;
    killPickup(p);
    if (p.kind === "coin") { st.coinF += st.coinMul * (st.boost.x2 > 0 ? 2 : 1); st.coins = Math.floor(st.coinF); st.chase += R.catchCoins * (1 + (st.perk.chase || 0)); sfx("coin"); sparkle(x, y, z); }
    else if (p.kind === "bar") { st.bars++; st.chase += R.catchBar * (1 + (st.perk.chase || 0)); sfx("bar"); burst(x, y, z, 0xffc21a, 14); }
    else if (p.kind === "letter") { st.letterGot = p.letter; sfx("bar"); burst(x, y, z, 0xffe27a, 16); if (hooks.letter) hooks.letter(p.letter); }
    else { giveBoost(p.kind); st.boostsGot++; st.chase += R.catchBoost; sfx("boost"); burst(x, y, z, D.BOOSTS[p.kind].color, 20); if (hooks.boost) hooks.boost(p.kind); }
  }

  /* ---------- Эффекты ---------- */
  var fxPool = [];
  function fxSprite(color, size, life, x, y, z, vx, vy, vz) {
    var s = fxPool.pop(); if (!s) s = new T.Sprite(new T.SpriteMaterial({ map: G.glowTex(), transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    s.material.color.setHex(color); s.material.opacity = 1; s.scale.setScalar(size); s.position.set(x, y, z); s.userData = { life: life, max: life, vx: vx, vy: vy, vz: vz, size: size };
    scene.add(s); fx.push(s);
  }
  function sparkle(x, y, z) { if (st && st.fast) return; for (var i = 0; i < 3; i++) fxSprite(0xffd860, 0.5, 0.35, x, y, z, rnd(-2, 2), rnd(1, 4), rnd(-1, 3)); }
  function burst(x, y, z, c, n) { if (st && st.fast) return; for (var i = 0; i < n; i++) fxSprite(c, rnd(0.4, 0.9), rnd(0.4, 0.8), x, y, z, rnd(-5, 5), rnd(1, 7), rnd(-3, 6)); }
  function updateFx(dt) {
    fx = fx.filter(function (s) {
      var u = s.userData; u.life -= dt; if (u.life <= 0) { scene.remove(s); fxPool.push(s); return false; }
      s.position.x += u.vx * dt; s.position.y += u.vy * dt; s.position.z += u.vz * dt; u.vy -= 6 * dt;
      var k = u.life / u.max; s.material.opacity = k * (u.alpha || 1); s.scale.setScalar(u.size * (0.4 + k * 0.6)); return true;
    });
  }

  /* ---------- Автоигрок ---------- */
  function threat(l, from) {
    var best = null;
    for (var i = 0; i < obstacles.length; i++) {
      var o = obstacles[i];
      if (o.dead || o.lane !== l || o.z1 < from - 0.4 || o.type === "ice" || o.type === "pad") continue;
      if (o.type === "train" && st.y >= o.top - 0.5 && o.z0 < from) continue;
      if (!best || o.z0 < best.z0) best = o;
    }
    return best;
  }
  function blocks(o) { return o && (o.type === "wall" || o.type === "train"); }
  function freeDist(l) {
    var hz = st.dist, d = 999;
    for (var i = 0; i < obstacles.length; i++) {
      var o = obstacles[i]; if (o.dead || o.lane !== l || o.z1 < hz - 0.4 || o.type === "ramp" || o.type === "ice" || o.type === "pad") continue;
      if (o.type === "train" && st.y >= o.top - 0.5 && o.z0 < hz) continue;
      var pen = blocks(o) ? 0 : 25;
      if (o.type === "train" && obstacles.some(function (r) { return !r.dead && r.type === "ramp" && r.lane === l && Math.abs(r.z1 - o.z0) < 0.5 && r.z0 > hz - 0.5; })) pen = 20;
      d = Math.min(d, Math.max(0, o.z0 - hz) + pen + (o.vz ? -20 : 0));
    }
    return d;
  }
  function laneClearNow(l) {
    var hz = st.dist;
    return !obstacles.some(function (o) { return !o.dead && o.lane === l && o.type !== "ramp" && o.type !== "ice" && o.type !== "pad" && o.z0 < hz + 2.5 && o.z1 > hz - 1 && !((o.type === "low" || o.type === "roller") && st.y > 1.1) && !(o.type === "train" && st.y >= o.top - 0.5) && !(o.type === "gap" && st.y > 0.3); });
  }
  function autoplay() {
    if (st.jet > 0) return;
    var hz = st.dist, l = st.lane, sp = st.speed;
    var o = threat(l, hz), dist = o ? o.z0 - hz : 999;
    if (o && o.aiMiss === undefined) o.aiMiss = Math.random() < autoErr;
    if (o && o.aiMiss) return;
    var rel0 = sp - (o && o.vz ? o.vz : 0);
    // прыжок и подкат — даже во время смены дорожки
    if (o && (o.type === "low" || o.type === "roller") && dist < rel0 * 0.3 + 1.2 && dist > -0.2 && st.onGround) { input("up"); return; }
    if (o && o.type === "gap" && dist < rel0 * 0.12 + 0.6 && dist > -0.3 && st.onGround) { input("up"); return; }
    if (o && o.type === "high" && dist < sp * 0.12 + 1.6 && dist > -0.2 && st.slide <= 0.05) { input("down"); return; }
    if (Math.abs(laneX(l) - st.x) > 0.4) return;
    var rampAhead = o && o.type === "train" && obstacles.some(function (r) { return !r.dead && r.type === "ramp" && r.lane === l && Math.abs(r.z1 - o.z0) < 0.5; });
    if (o && o.type === "ramp") return;
    var rel = sp - (o && o.vz ? o.vz : 0);
    var danger = o && (blocks(o) && !rampAhead) && dist < sp * 0.75 + 6;
    if (o && o.vz && o.type === "train" && dist < rel * 1.3 + 12) danger = true;
    if (danger) {
      var opts = [l - 1, l + 1].filter(function (x) { return x >= 0 && x <= 2 && laneClearNow(x); });
      opts.sort(function (a, b) { return freeDist(b) - freeDist(a); });
      if (opts.length) { input(opts[0] < l ? "left" : "right"); return; }
    }
    if (o && (o.type === "low" || o.type === "roller") && dist < rel * 0.11 + 1.1 && dist > -0.2) { input("up"); return; }
    if (o && o.type === "gap" && dist < rel * 0.06 + 0.6 && dist > -0.3) { input("up"); return; }
    if (o && o.type === "high" && dist < sp * 0.12 + 1.6 && dist > -0.2 && st.slide <= 0.05) { input("down"); return; }
    if (!o || dist > 18) {
      var best = l, bestN = 0;
      [l - 1, l, l + 1].forEach(function (x) {
        if (x < 0 || x > 2) return;
        var n = 0; pickups.forEach(function (p) { if (!p.dead && p.lane === x && p.z > hz && p.z < hz + 20 && p.y < 3) n += p.kind === "coin" ? 1 : 6; });
        if (x !== l && (freeDist(x) < 26 || !laneClearNow(x))) return;
        if (n > bestN + (x === l ? 0 : 2)) { bestN = n; best = x; }
      });
      if (best !== l) input(best < l ? "left" : "right");
    }
  }

  /* ---------- Кадр: позиции, анимации, камера ---------- */
  var trailT = 0;
  var plazaKey = "", plazaFocus = -1, plazaFocusT = 0, plazaCam = new T.Vector3(), plazaLook = new T.Vector3();
  function animPlaza(dt, now) {
    var t = now / 1000, C = window.PLAZA.CENTER;
    hero.root.visible = true; thief.root.visible = false;
    hero.root.position.set(C.x, 0, C.z + 7.5); hero.root.rotation.set(0, Math.sin(t * 0.4) * 0.2, 0);
    MD.pose(hero, { phase: 0, anim: "idle" }, t, dt);
    if (plazaFocusT > 0) MD.pose(hero, { phase: 0, anim: "wave" }, t, dt);
    window.PLAZA.tick(dt, t);
    updateFx(dt);
    var por = camera.aspect < 0.8, d = por ? 25 : 20;
    var a = Math.sin(t * 0.12) * 0.12;
    var tc = new T.Vector3(C.x + Math.sin(a) * d, (por ? 11 : 9) + menuLiftV * 5, C.z + Math.cos(a) * d + 4), tl = new T.Vector3(C.x, 2 - menuLiftV * (por ? 8 : 4), C.z - 3);
    if (plazaFocusT > 0) {
      plazaFocusT -= dt; var sp = window.PLAZA.slotPos(plazaFocus);
      tc.set(sp.x * 0.55 + C.x * 0.45, 7 + menuLiftV * 4, sp.z + (por ? 15 : 11)); tl.set(sp.x, 2.6 - menuLiftV * (por ? 5 : 2.5), sp.z);
    }
    menuLiftV += (menuLift - menuLiftV) * Math.min(1, dt * 6);
    plazaCam.lerp(tc, Math.min(1, dt * 2.5)); plazaLook.lerp(tl, Math.min(1, dt * 2.5));
    camera.position.copy(plazaCam); camera.lookAt(plazaLook);
    if (Math.abs(camera.fov - camera.userData.baseFov) > 0.05) { camera.fov = camera.userData.baseFov; camera.updateProjectionMatrix(); }
    palClock -= dt; if (palClock <= 0) { palClock = 0.3; updatePal(0); }
    G.follow(C.x, C.z - 4);
  }
  function showPlaza(worldId, levels, colors) {
    var key = worldId + ":" + levels.join(",");
    if (worldId !== W.id) setWorld(worldId);
    if (mode !== "plaza") { G.shadowBox(true); var C = window.PLAZA.CENTER; plazaCam.set(C.x, 14, C.z + 34); plazaLook.set(C.x, 1, C.z); }
    mode = "plaza";
    if (key !== plazaKey) { window.PLAZA.build(scene, worldId, levels, colors); plazaKey = key; }
  }
  function plazaUpgrade(idx, lvl, color, levels) {
    var p = window.PLAZA.upgrade(W.id, idx, lvl, color);
    plazaKey = W.id + ":" + levels.join(",");
    plazaFocus = idx; plazaFocusT = 3.2;
    if (p) { for (var i = 0; i < 26; i++) fxSprite(0xd8c8a8, rnd(0.8, 1.6), rnd(0.6, 1.2), p.x + rnd(-2, 2), rnd(0.2, 1), p.z + rnd(-2, 2), rnd(-3, 3), rnd(0.5, 2.5), rnd(-3, 3)); burst(p.x, 3, p.z, 0xffc93a, 30); }
    sfx("build");
  }
  function hidePlaza() { if (mode !== "plaza") return; window.PLAZA.remove(scene); plazaKey = ""; G.shadowBox(false); thief.root.visible = true; mode = "menu"; }
  function animate(dt, now) {
    if (mode === "plaza") { animPlaza(dt, now); return; }
    var inMenu = mode === "menu";
    var hz = st && !inMenu ? st.dist : 0, x = st && !inMenu ? st.x : 0, y = st && !inMenu ? st.y : 0;
    var t = now / 1000;
    hero.root.position.set(x, y, hz);
    MD.pose(hero, { phase: st ? st.phase : 0, anim: inMenu ? "idle" : mode === "run" ? st.anim : "fall" }, t, dt);
    if (inMenu) hero.root.rotation.y = turntable ? hero.root.rotation.y + dt * 0.7 : 0.35 + Math.sin(t * 0.4) * 0.12;
    else { hero.root.rotation.y = 0; hero.root.rotation.z = st ? (st.x - laneX(st.lane)) * 0.06 : 0; }
    if (mode === "crash" || mode === "over") hero.stars.rotation.y += dt * 4;
    hero.shield.visible = !!(st && mode === "run" && (st.boost.shield > 0 || (st.inv > 0 && Math.floor(st.t * 10) % 2)));
    hero.jet.visible = !!(st && st.jet > 0 && mode === "run");
    if (hero.jet.visible) hero.flames.forEach(function (f) { f.scale.y = 0.8 + Math.random() * 0.5; });
    var q = G.quality();
    heroBlob.visible = !q.shadows; thiefBlob.visible = !q.shadows;
    heroBlob.position.set(x, (st && !inMenu ? groundAt(x, hz, y + 0.01) : 0) + 0.03, hz);
    if (inMenu) {
      thief.root.visible = !turntable;
      thief.root.position.set(-1.5, 0, -1.6); thief.root.rotation.y = -0.5;
      MD.pose(thief, { phase: 0, anim: "idle" }, t + 3, dt); thief.aR.up.rotation.x = -2.5; thief.aR.el.rotation.x = -0.9;
      thief.head.rotation.y = 0.4 + Math.sin(t * 0.8) * 0.3;
    } else {
      var gapT = thief.flee > 0 ? 42 : 17 - (st ? st.chase : 0) * 0.1;
      if (thief.flee > 0) thief.flee -= dt;
      thief.gap += (gapT - thief.gap) * Math.min(1, dt * 1.5);
      thief.laneT -= dt; if (thief.laneT <= 0) { thief.laneT = rnd(1.5, 3.5); thief.lane = irnd(0, 2); }
      thief.x += (laneX(thief.lane) - thief.x) * Math.min(1, dt * 3);
      var tz = hz + thief.gap, tx = thief.x, tg = groundAt(tx, tz, 10);
      thief.root.position.set(tx, tg, tz); thief.root.rotation.y = mode === "run" ? 0 : Math.PI;
      MD.pose(thief, { phase: (st ? st.phase : t * 8) * 1.08 + 1, anim: mode === "run" ? "run" : "idle" }, t, dt);
      if (mode !== "run") { thief.aR.up.rotation.x = -2.5; thief.aL.up.rotation.x = -2.9 + Math.sin(t * 10) * 0.3; }
      thief.head.rotation.y = mode === "run" && Math.sin(t * 0.7) > 0.85 ? 2.4 : 0;
    }
    thiefBlob.position.set(thief.root.position.x, thief.root.position.y + 0.03, thief.root.position.z);
    // монеты и предметы
    var rot = t * 3, any = false;
    for (var i = 0; i < pickups.length; i++) {
      var p = pickups[i]; if (p.dead) continue;
      if (p.kind === "coin") { coinDummy.position.set(p.x, p.y, p.z); coinDummy.rotation.set(0, rot + p.z * 0.25, 0); coinDummy.scale.setScalar(1); coinDummy.updateMatrix(); coinIM.setMatrixAt(p.i, coinDummy.matrix); any = true; }
      else if (p.mesh) { p.mesh.position.set(p.x, p.kind === "bar" ? p.y : p.y + Math.sin(t * 3 + p.z) * 0.12, p.z); if (p.kind === "bar") p.mesh.rotation.y = rot; }
    }
    if (any) coinIM.instanceMatrix.needsUpdate = true;
    props.forEach(function (p) { if (p.g.position.z < hz - 25) p.g.position.z += PROP_SPAN; else if (p.g.position.z > hz + PROP_SPAN - 25) p.g.position.z -= PROP_SPAN; });
    nears.forEach(function (p) { if (p.g.position.z < hz - 12) p.g.position.z += NEAR_SPAN; else if (p.g.position.z > hz + NEAR_SPAN - 12) p.g.position.z -= NEAR_SPAN; });
    spinners.forEach(function (s) { s.rotation.x += dt * 1.2; });
    road.position.z = hz + 60; roadBase.position.z = hz + 60; ground.position.z = hz + 60;
    if (road.material.map) road.material.map.offset.y = (hz / 25) % 1;
    if (ground.material.map) { ground.material.map.offset.y = (hz / (400 / 60)) % 1; if (WD.water) ground.material.map.offset.x = (t * 0.02) % 1; }
    walks.forEach(function (w) { w.position.z = hz + 60; if (w.userData.tex) w.userData.tex.offset.y = (hz / 2) % 1; });
    if (embers) { embers.position.z = hz - 10; var ep = embers.geometry.attributes.position; for (var e = 0; e < ep.count; e++) { var yy = ep.getY(e) + dt * 0.8; ep.setY(e, yy > 8 ? 0 : yy); } ep.needsUpdate = true; }
    if (earth) earth.position.set(-60, 70, hz + 160);
    trailT -= dt;
    if (mode === "run" && trailT <= 0 && !(st && st.fast)) {
      trailT = st.jet > 0 ? 0.025 : 0.07;
      fxSprite(hero.skin.trail, st.jet > 0 ? 0.6 : 0.22, 0.35, x + rnd(-0.15, 0.15), y + (st.jet > 0 ? 0.6 : 0.1), hz - 0.4, rnd(-0.4, 0.4), rnd(0, 0.6), -1); fx[fx.length - 1].userData.alpha = 0.55;
    }
    updateFx(dt);
    palClock -= dt;
    if (palClock <= 0) { palClock = 0.2; updatePal(inMenu ? 0 : (st ? st.t + st.cycle0 : 0)); }
    if (shake > 0) shake = Math.max(0, shake - dt);
    var sx = shake > 0 ? (Math.random() - 0.5) * shake * 0.6 : 0, sy = shake > 0 ? (Math.random() - 0.5) * shake * 0.6 : 0;
    if (inMenu) {
      menuLiftV += (menuLift - menuLiftV) * Math.min(1, dt * 6);
      var a = Math.sin(t * 0.22) * 0.18, dist = 5.8 - menuLiftV * 0.6;
      camera.position.set(Math.sin(a) * dist - 0.3, 1.7 + menuLiftV * 1.0, Math.cos(a) * dist + 0.4);
      camera.lookAt(-0.2, 1.05 - menuLiftV * 1.1, -0.4);
      if (Math.abs(camera.fov - camera.userData.baseFov) > 0.05) { camera.fov += (camera.userData.baseFov - camera.fov) * Math.min(1, dt * 4); camera.updateProjectionMatrix(); }
    } else {
      var cy = 3.6 + y * 0.6, cz = hz - 6.6;
      camera.position.x += (x * 0.72 - camera.position.x) * Math.min(1, dt * 6);
      camera.position.y += (cy - camera.position.y) * Math.min(1, dt * 5);
      camera.position.z = cz;
      camera.position.x += sx; camera.position.y += sy;
      camera.lookAt(camera.position.x * 0.82, 1.35 + y * 0.5, hz + 7.5);
      var fov = camera.userData.baseFov + (st ? (st.speed - R.speed0) / (R.speedMax - R.speed0) * 9 + (st.jet > 0 ? 4 : 0) : 0);
      camera.fov += (fov - camera.fov) * Math.min(1, dt * 3); camera.updateProjectionMatrix();
    }
    G.follow(x, hz);
  }

  /* ---------- Цикл и автокачество ---------- */
  var paused = false, hudCb = null, perf = { n: 0, sum: 0, checked: false };
  function loop(now) {
    requestAnimationFrame(loop);
    var raw = (now - (lastT || now)) / 1000, dt = Math.min(0.05, raw); lastT = now;
    if (paused) return;
    if (mode === "run") {
      var n = Math.ceil(dt / (1 / 120)), sdt = dt / n;
      for (var i = 0; i < n && mode === "run"; i++) step(sdt);
      if (hudCb) hudCb(st);
      try { if (window.AUDIO) window.AUDIO.setEnergy((st.speed - R.speed0) / (R.speedMax - R.speed0)); } catch (e) {}
      if (!perf.checked && raw > 0 && raw < 0.2 && st.t > 1.5 && !document.hidden) { perf.n++; perf.sum += raw; if (perf.n >= 150) { perf.checked = true; var avg = perf.sum / perf.n; if (avg > 0.034) G.setQuality(0); else if (avg > 0.024) G.setQuality(1); } }
    }
    animate(dt, now);
    renderer.render(scene, camera);
  }
  function init(canvas) {
    var g = G.init(canvas); renderer = g.renderer; scene = g.scene; camera = g.camera;
    road = new T.Mesh(new T.PlaneGeometry(6.9, 150), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 })); road.rotation.x = -Math.PI / 2; road.position.y = 0.01; road.receiveShadow = true; scene.add(road);
    roadBase = new T.Mesh(new T.BoxGeometry(7.6, 2.2, 150), G.mat(0x9a8a7a, "stone")); roadBase.position.y = -1.1; roadBase.visible = false; scene.add(roadBase);
    ground = new T.Mesh(new T.PlaneGeometry(400, 400), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    var blobTex = G.spriteTex("blob", function (c, s) { var r = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); r.addColorStop(0, "rgba(0,0,0,.45)"); r.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = r; c.fillRect(0, 0, s, s); }, 64);
    var bm = new T.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false });
    heroBlob = new T.Mesh(new T.PlaneGeometry(1.1, 1.1), bm); heroBlob.rotation.x = -Math.PI / 2; scene.add(heroBlob);
    thiefBlob = new T.Mesh(new T.PlaneGeometry(1.3, 1.3), bm); thiefBlob.rotation.x = -Math.PI / 2; scene.add(thiefBlob);
    var cg = new T.CylinderGeometry(0.42, 0.42, 0.09, 20); cg.rotateX(Math.PI / 2);
    coinIM = new T.InstancedMesh(cg, G.mat(0xffc93a, "gold", { emissive: 0x8a5200, ei: 0.55 }), COIN_MAX); coinIM.frustumCulled = false;
    coinDummy.position.set(0, -50, 0); coinDummy.scale.setScalar(0.0001); coinDummy.updateMatrix();
    for (var i = 0; i < COIN_MAX; i++) { coinFree.push(COIN_MAX - 1 - i); coinIM.setMatrixAt(i, coinDummy.matrix); }
    scene.add(coinIM);
    barGeo = new T.BoxGeometry(0.75, 0.32, 0.4); bubbleGeo = new T.SphereGeometry(0.62, 18, 12);
    hero = MD.hero(skinCur); G.mergeBones(hero.root); scene.add(hero.root);
    thief = MD.thief(); G.mergeBones(thief.root); thief.gap = 17; thief.flee = 0; thief.lane = 1; thief.x = 0; thief.laneT = 1; scene.add(thief.root);
    st = null;
    setWorld("town");
    requestAnimationFrame(loop);
  }
  function setSkin(skin) {
    skinCur = skin; var p = hero.root.position.clone(), r = hero.root.rotation.y;
    scene.remove(hero.root); hero = MD.hero(skin); G.mergeBones(hero.root); hero.root.position.copy(p); hero.root.rotation.y = r; scene.add(hero.root);
  }
  function toMenu() {
    mode = "menu"; if (st) { st.dist = 0; st.x = 0; st.y = 0; } hero.stars.visible = false; hero.body.rotation.set(0, 0, 0); hero.body.position.set(0, 0, 0);
    obstacles.forEach(function (o) { removeObstacle(o); }); obstacles = []; pickups.forEach(function (p) { killPickup(p); }); pickups = [];
    palKey = ""; updatePal(0, true);
  }
  function sim(maxT, opts) {
    var was = auto, wasErr = autoErr; auto = true; autoErr = (opts && opts.err) || 0;
    if (opts && opts.world) setWorld(opts.world);
    newRun(Object.assign({ fast: true }, opts || {}));
    var oldHooks = hooks; hooks = {};
    var guard = 0;
    while (mode === "run" && st.t < (maxT || 600) && guard++ < 2e6) step(1 / 120);
    var r = stats(); r.crashed = mode === "crash"; r.speed = st.speed; r.world = W.id;
    hooks = oldHooks; auto = was; autoErr = wasErr; toMenu();
    return r;
  }

  return {
    init: init, setWorld: setWorld, setSkin: setSkin, newRun: newRun, input: input, continueRun: continueRun, endRun: endRun,
    toMenu: toMenu, sim: sim, showPlaza: showPlaza, hidePlaza: hidePlaza, plazaUpgrade: plazaUpgrade, iconURL: iconURL, unlockAudio: unlockAudio, DIMS: DIMS,
    on: function (k, f) { hooks[k] = f; }, onHud: function (f) { hudCb = f; },
    setPaused: function (p) { paused = !!p; lastT = 0; }, isPaused: function () { return paused; },
    setSound: function (on) { try { if (window.AUDIO) window.AUDIO.setOn(on); } catch (e) {} },
    setMenuLift: function (v) { menuLift = v; }, giveBars: function (n) { if (st) { st.bars += n; sfx("bar"); } }, setTurntable: function (on) { turntable = !!on; },
    auto: function (on) { if (on !== undefined) auto = !!on; return auto; },
    mode: function () { return mode; }, state: function () { return st; }, world: function () { return W; },
    _advance: function (sec, frames) { for (var i = 0; i < sec * 120 && mode === "run"; i++) step(1 / 120); if (hudCb && st) hudCb(st); for (var f = 0; f < (frames || 1); f++) animate(1 / 30, performance.now() + f * 33); renderer.render(scene, camera); return mode; },
    _giveJet: function () { if (st && mode === "run") giveBoost("jet"); },
    _dbg: function () { return { obstacles: obstacles.length, pickups: pickups.length, props: props.length, coinsFree: coinFree.length, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, quality: G.quality().level }; }
  };
})();
