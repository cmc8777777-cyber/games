/* Держи Шмыга! · 8 миров: палитры дня/заката/ночи, дорога, земля, окружение, препятствия, особенности.
   Препятствия всех миров одной логики (размеры — ENGINE.DIMS): low (прыжок), high (подкат), wall (обойти), train (обойти или забежать по рампе),
   ramp, gap (провал — прыжок), roller (катится навстречу — прыжок), pad (батут). */
window.WORLDGFX = (function () {
  "use strict";
  var T = window.THREE, G = window.GFX, MD = window.MODELS;
  var M = G.mat, geo = MD.geo;
  function mesh(g, m, x, y, z, p, sh) { var o = new T.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); if (sh) o.castShadow = true; if (p) p.add(o); return o; }
  function box(w, h, d) { return geo.box(w, h, d); }
  function cyl(a, b, h, s) { return geo.cyl(a, b, h, s); }
  function sph(r, a, b) { return geo.sph(r, a, b); }
  function cone(r, h, s) { return geo.cone(r, h, s); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function grp() { return new T.Group(); }
  function shadowAll(g) { g.traverse(function (o) { if (o.isMesh) o.castShadow = true; }); return g; }
  /* призма-крыша */
  var roofGeo = {};
  function roof(w, h, d) { var k = w + ":" + h + ":" + d; if (!roofGeo[k]) { var s = new T.Shape(); s.moveTo(-w / 2, 0); s.lineTo(0, h); s.lineTo(w / 2, 0); s.lineTo(-w / 2, 0); var g = new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); roofGeo[k] = g; } return roofGeo[k]; }

  /* ---------- общие кусочки ---------- */
  function lamp(g, x, z, side, col) {
    mesh(cyl(0.06, 0.09, 4.2, 8), M(0x2a2a30, "metal"), x, 2.1, z, g);
    var arm = mesh(box(0.9, 0.06, 0.06), M(0x2a2a30, "metal"), x - side * 0.4, 4.15, z, g);
    mesh(cone(0.22, 0.25, 8), M(0x2a2a30, "metal"), x - side * 0.85, 4.05, z, g);
    mesh(sph(0.12, 10, 8), M(0xfff2c0, "glass", { emissive: col || 0xffd27a, night: 3 }), x - side * 0.85, 3.92, z, g);
    var s = new T.Sprite(new T.SpriteMaterial({ map: G.glowTex(), color: col || 0xffd27a, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0 }));
    s.scale.set(3.2, 3.2, 1); s.position.set(x - side * 0.85, 3.9, z); s.userData.nightGlow = 0.9; g.add(s);
    return g;
  }
  function tree(g, x, z, s, leaf) {
    s = s || 1;
    mesh(cyl(0.12 * s, 0.18 * s, 1.8 * s, 7), M(0x5a3c24, "wood"), x, 0.9 * s, z, g);
    var c = leaf || pick([0x3e8a3a, 0x4a9a3e, 0x357a34]);
    mesh(sph(1.0 * s, 9, 7), M(c, "fabric", { flat: true }), x, 2.3 * s, z, g);
    mesh(sph(0.75 * s, 9, 7), M(G.lin ? c : c, "fabric", { flat: true }), x + 0.5 * s, 2.0 * s, z + 0.3 * s, g);
    mesh(sph(0.7 * s, 9, 7), M(c, "fabric", { flat: true }), x - 0.4 * s, 2.7 * s, z - 0.2 * s, g);
  }
  function fir(g, x, z, s, snow) {
    mesh(cyl(0.12 * s, 0.16 * s, 0.9 * s, 6), M(0x4a3020, "wood"), x, 0.45 * s, z, g);
    for (var i = 0; i < 4; i++) {
      var r = (1.3 - i * 0.26) * s, y = (1.0 + i * 0.85) * s;
      mesh(cone(r, 1.3 * s, 8), M(0x1f5a3a, "fabric", { flat: true }), x, y, z, g);
      if (snow) mesh(cone(r * 0.72, 0.5 * s, 8), M(0xf4f8ff, "stone", { flat: true }), x, y + 0.42 * s, z, g);
    }
  }
  function house(g, side, o) {
    var w = rnd(o.w[0], o.w[1]), h = rnd(o.h[0], o.h[1]), d = rnd(4, 6);
    var wall = pick(o.walls), fk = o.key + wall + (o.brick ? "b" : "") + (o.wood ? "w" : "");
    var f = G.facade(fk, { wall: wall, brick: o.brick && Math.random() < 0.5, wood: o.wood, shutters: o.shutters ? pick(o.shutters) : null, door: true, cols: Math.round(w / 1.6), rows: Math.max(2, Math.round(h / 2.4)) });
    var fm = M(0xffffff, "stone", { map: f.map, emissive: 0xffffff, emissiveMap: f.emissive, night: 1.4 });
    var b = new T.Mesh(new T.BoxGeometry(w, h, d), fm);   // фасад со всех сторон: один материал — один вызов отрисовки
    b.position.y = h / 2; b.castShadow = true; b.receiveShadow = true; g.add(b);
    if (o.roof) { var r = mesh(roof(w + 0.6, rnd(1.4, 2.4), d + 0.6), M(pick(o.roof), "stone", { flat: true }), 0, h, 0, g); r.rotation.y = Math.PI / 2; if (Math.random() < 0.5) mesh(box(0.5, 1.2, 0.5), M(0x7a4a3a, "stone"), w * 0.2, h + 1.1, d * 0.2, g); }
    else mesh(box(w + 0.3, 0.3, d + 0.3), M(G.shade ? 0x6a5a4a : 0x6a5a4a, "stone"), 0, h + 0.15, 0, g);
    if (o.awning && Math.random() < 0.5) { var a = mesh(box(0.9, 0.08, d * 0.7), M(pick(o.awning), "fabric"), -side * (w / 2 + 0.4), 2.8, 0, g); a.rotation.z = side * 0.3; }
    return w;
  }
  /* ---------- общие препятствия (переопределяются мирами) ---------- */
  function obsBarrier(c1, c2) {
    var g = grp();
    [-0.85, 0.85].forEach(function (x) { mesh(cyl(0.06, 0.06, 1.0, 8), M(0x444a52, "metal"), x, 0.5, 0, g); mesh(box(0.3, 0.06, 0.3), M(0x333333, "metal"), x, 0.03, 0, g); });
    for (var i = 0; i < 7; i++) mesh(box(0.27, 0.32, 0.08), M(i % 2 ? c2 : c1, "paint"), -0.81 + i * 0.27, 0.8, 0, g);
    mesh(sph(0.06, 8, 6), M(0xff7a1a, "glass", { emissive: 0xff7a1a, ei: 1.5 }), 0.85, 1.05, 0, g);
    return shadowAll(g);
  }
  function obsSign(c, bg) {
    var g = grp();
    [-0.92, 0.92].forEach(function (x) { mesh(box(0.1, 2.7, 0.1), M(0x50565e, "metal"), x, 1.35, 0, g); });
    mesh(box(1.95, 1.15, 0.1), M(bg || 0xf2f2f2, "paint"), 0, 1.98, 0, g);
    mesh(box(1.7, 0.9, 0.12), M(c, "paint"), 0, 1.98, 0, g);
    mesh(box(1.2, 0.12, 0.13), M(0xffffff, "paint"), 0, 2.05, 0, g); mesh(box(0.7, 0.12, 0.13), M(0xffffff, "paint"), -0.25, 1.82, 0, g);
    return shadowAll(g);
  }
  function obsCrates(c) {
    var g = grp(), m = M(c || 0x9a6a3a, "wood");
    mesh(box(0.95, 0.95, 1.2), m, -0.48, 0.48, 0, g).rotation.y = 0.05; mesh(box(0.95, 0.95, 1.2), m, 0.48, 0.48, 0.05, g);
    mesh(box(0.95, 0.95, 1.2), m, 0.0, 1.43, 0, g).rotation.y = -0.08; mesh(box(0.8, 0.8, 1.0), m, 0.2, 2.25, 0, g).rotation.y = 0.2;
    g.children.forEach(function (o) { mesh(box(o.geometry.parameters.width + 0.02, 0.1, o.geometry.parameters.depth + 0.02), M(0x5a3a1e, "wood"), o.position.x, o.position.y, o.position.z, g); });
    return shadowAll(g);
  }
  function obsTrain(c, stripe, moving, L, kind) {
    var g = grp(); L = L || 14;
    var body = M(c, "paint"), dark = M(0x22262c, "metal");
    mesh(box(1.96, 2.45, L), body, 0, 1.65, 0, g);
    mesh(box(1.98, 0.3, L - 0.2), M(stripe, "paint"), 0, 1.0, 0, g);
    var gl = M(0x2a3a52, "glass", { emissive: 0xffd9a0, night: 1.2 });
    mesh(box(2.0, 0.75, L - 1.2), gl, 0, 2.15, 0, g);
    for (var i = -L / 2 + 1.5; i < L / 2 - 1; i += 1.6) mesh(box(2.02, 0.75, 0.08), body, 0, 2.15, i, g);
    mesh(box(1.7, 0.15, L - 0.6), M(0xbfc4ca, "metal"), 0, 2.95, 0, g);
    mesh(box(1.96, 0.35, L - 0.4), dark, 0, 0.3, 0, g);
    [-L / 2 + 1.6, L / 2 - 1.6].forEach(function (z) { [-0.7, 0.7].forEach(function (x) { var w = mesh(cyl(0.32, 0.32, 0.18, 14), dark, x, 0.32, z, g); w.rotation.z = Math.PI / 2; }); });
    if (kind === "tram") { var pg = mesh(box(0.06, 0.9, 0.06), dark, 0, 3.4, 0, g); pg.rotation.x = 0.6; mesh(box(0.9, 0.05, 0.08), dark, 0, 3.75, 0.3, g); }
    // лобовое стекло и фары (смотрят на героя, −z)
    mesh(box(1.6, 0.9, 0.06), gl, 0, 2.05, -L / 2 - 0.02, g);
    var lc = moving ? 0xfff2b0 : 0xff4a2a;
    [-0.65, 0.65].forEach(function (x) { mesh(box(0.28, 0.18, 0.06), M(lc, "glass", { emissive: lc, ei: moving ? 3 : 1.6 }), x, 0.85, -L / 2 - 0.04, g); });
    if (moving) { var s = new T.Sprite(new T.SpriteMaterial({ map: G.glowTex(), color: 0xfff2b0, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.9 })); s.scale.set(3.5, 2, 1); s.position.set(0, 0.9, -L / 2 - 0.3); g.add(s); }
    return shadowAll(g);
  }
  function obsRamp(c) {
    var g = grp(), L = 6.5, ang = Math.atan2(3.0, L), len = Math.hypot(3.0, L);
    var pl = mesh(box(1.9, 0.16, len), M(c || 0xb8864a, "wood"), 0, 1.5, 0, g); pl.rotation.x = -ang;
    for (var i = 0; i < 8; i++) { var s = mesh(box(1.92, 0.04, 0.08), M(0x6a4a2a, "wood"), 0, 0, 0, pl); s.position.set(0, 0.1, -len / 2 + 0.4 + i * len / 8); }
    [-0.85, 0.85].forEach(function (x) { mesh(box(0.1, 3.0, 0.1), M(0x5a3a1e, "wood"), x, 1.5, L / 2 - 0.2, g); mesh(box(0.1, 1.5, 0.1), M(0x5a3a1e, "wood"), x, 0.75, 0, g); });
    return shadowAll(g);
  }
  function obsGap(c, edge, glow) {
    var g = grp(), L = 3.2;
    mesh(box(2.1, 0.05, L), M(c, glow ? "glass" : "stone", glow ? { emissive: c, ei: 1.6 } : null), 0, 0.02, 0, g);
    [-L / 2, L / 2].forEach(function (z) { mesh(box(2.15, 0.12, 0.18), M(edge, "stone"), 0, 0.04, z, g); });
    return g;
  }
  function obsRoller(c, kind) {
    var g = grp();
    if (kind === "barrel") { var b = mesh(cyl(0.5, 0.5, 1.6, 14), M(c, "paint"), 0, 0.5, 0, g); b.rotation.z = Math.PI / 2; [-0.5, 0, 0.5].forEach(function (x) { var r = mesh(cyl(0.52, 0.52, 0.06, 14), M(0x3a3a3a, "metal"), x, 0.5, 0, g); r.rotation.z = Math.PI / 2; }); g.userData.spin = b; }
    else { var s = mesh(sph(0.55, 14, 10), M(c, kind === "snow" ? "stone" : "fabric", { flat: kind !== "snow" }), 0, 0.55, 0, g); g.userData.spin = s; }
    return shadowAll(g);
  }
  function obsPad(c) {
    var g = grp();
    mesh(cyl(0.85, 0.95, 0.25, 18), M(0x3a3a44, "metal"), 0, 0.12, 0, g);
    mesh(cyl(0.75, 0.75, 0.06, 18), M(c, "rubber", { emissive: c, ei: 0.5 }), 0, 0.27, 0, g);
    return g;
  }

  /* ---------- Палитры ---------- */
  function P(o) { return Object.assign({ top: 0x3d7fd6, hor: 0xbfe0f5, bot: 0x8a96a0, ground: 0x6a7a5a, sunCol: 0xfff1d6, sunI: 1, hemiSky: 0xbcd8ff, hemiGround: 0x7a6a56, hemiI: 0.75, fog: 0xbfd8ea, fogNear: 45, fogFar: 170, sunEl: 0.8, stars: 0, night: 0, exposure: 1.0 }, o); }

  /* ---------- Миры ---------- */
  var W = {};

  /* 1. Златоград — старый город, трамваи */
  W.town = {
    pal: {
      day: P({}),
      dusk: P({ top: 0x2e3f82, hor: 0xffa066, bot: 0x5a4a5a, ground: 0x4a4038, sunCol: 0xff9a5a, sunI: 0.75, hemiSky: 0x9a8ab8, hemiGround: 0x5a4a40, hemiI: 0.6, fog: 0xe0a080, fogNear: 40, fogFar: 150, sunEl: 0.1, night: 0.35, exposure: 1.05 }),
      night: P({ top: 0x060a1c, hor: 0x1c2848, bot: 0x0a0e18, ground: 0x10141c, sunCol: 0x9ab0ff, sunI: 0.28, hemiSky: 0x40508a, hemiGround: 0x1a1a24, hemiI: 0.5, fog: 0x121a2e, fogNear: 28, fogFar: 125, sunEl: 0.95, stars: 1, night: 1, exposure: 1.25 })
    },
    cycle: true, ground: 0x6f8a52,
    groundPaint: function (g, s) { G.noise(g, s, s, 1500, 0.1, 3); },
    road: function (g, s) {
      g.fillStyle = "#4e463f"; g.fillRect(0, 0, s, s);
      for (var y = 0; y < s; y += 16) for (var x = (y / 16) % 2 ? -8 : 0; x < s; x += 16) { g.fillStyle = G.shade(0x7a6a5e, (Math.random() - 0.5) * 0.4); g.beginPath(); g.roundRect ? g.roundRect(x + 1, y + 1, 14, 14, 4) : g.rect(x + 1, y + 1, 14, 14); g.fill(); }
      [0, 1, 2].forEach(function (l) { var cx = (l + 0.5) * s / 3; g.fillStyle = "#5a5450"; g.fillRect(cx - 34, 0, 10, s); g.fillRect(cx + 24, 0, 10, s); g.fillStyle = "#c8ccd2"; g.fillRect(cx - 32, 0, 5, s); g.fillRect(cx + 26, 0, 5, s); });
    },
    side: { curb: 0xb8b0a4, walk: 0xa49a8e, walkW: 3.2 },
    props: function (side) {
      var g = grp(), r = Math.random();
      if (r < 0.6) { g.userData.off = [7.6, 11]; house(g, side, { key: "town", w: [3.5, 5.5], h: [5, 10], walls: [0xe8c8a0, 0xf0dcc0, 0xc8d8e0, 0xe0b8a8, 0xd8c8e8, 0xf2e2a8], brick: true, roof: [0xa8442e, 0x8a3a2a, 0x4a5a6a, 0xb85a3a], shutters: ["#3a6a4a", "#5a3a2a", "#3a4a7a"], awning: [0xc8302a, 0x2a7a4a, 0x2a4a9a] }); }
      else if (r < 0.8) { tree(g, 0, 0, rnd(0.9, 1.3)); mesh(cyl(0.7, 0.7, 0.4, 10), M(0x8a7a6a, "stone"), 0, 0.2, 0, g); }
      else lamp(g, 0, 0, side);
      return g;
    },
    near: function (side) { var g = grp(); lamp(g, 0, 0, side); return g; },   // ряд фонарей у бордюра
    obs: {
      low: function () { return obsBarrier(0xd8302a, 0xf2f2f2); },
      high: function () { return obsSign(0x2a6ad8); },
      wall: function () { return obsCrates(0x9a6a3a); },
      train: function (mv) { return obsTrain(pick([0xf2c21a, 0xd8302a]), 0xf2f2f2, mv, 14, "tram"); },
      ramp: function () { return obsRamp(); }
    },
    feat: {}
  };

  /* 2. Песчаные барханы — караваны, перекати-поле, песчаная буря */
  W.dunes = {
    pal: {
      day: P({ top: 0x3a7ad0, hor: 0xf0d0a0, bot: 0xc8a070, ground: 0xd8b070, sunCol: 0xfff0d0, sunI: 0.95, exposure: 0.88, hemiSky: 0xd8e4f8, hemiGround: 0xc89a5a, hemiI: 0.75, fog: 0xf2d8b0, fogNear: 40, fogFar: 160, sunEl: 0.9 }),
      dusk: P({ top: 0x3a3a8a, hor: 0xff8a4a, bot: 0x8a5a3a, ground: 0x8a6040, sunCol: 0xff7a3a, sunI: 0.8, hemiSky: 0xa88ab8, hemiGround: 0x8a5a3a, hemiI: 0.6, fog: 0xe8906a, fogNear: 35, fogFar: 145, sunEl: 0.08, night: 0.35 }),
      night: P({ top: 0x080a22, hor: 0x2a2a52, bot: 0x18141e, ground: 0x2a2018, sunCol: 0xa8b8ff, sunI: 0.32, hemiSky: 0x4a5a9a, hemiGround: 0x2a2018, hemiI: 0.5, fog: 0x1a1a32, fogNear: 28, fogFar: 125, sunEl: 0.9, stars: 1, night: 1, exposure: 1.25 })
    },
    cycle: true, ground: 0xd2a868,
    groundPaint: function (g, s) { for (var y = 0; y < s; y += 6) { g.strokeStyle = "rgba(160,110,50," + rnd(0.05, 0.14) + ")"; g.beginPath(); g.moveTo(0, y); for (var x = 0; x <= s; x += 16) g.lineTo(x, y + Math.sin(x * 0.05 + y) * 3); g.stroke(); } G.noise(g, s, s, 600, 0.06, 2); },
    road: function (g, s) {
      g.fillStyle = "#b48a52"; g.fillRect(0, 0, s, s); G.noise(g, s, s, 2500, 0.12, 3);
      for (var y = 0; y < s; y += 64) { g.fillStyle = "rgba(120,80,40,.18)"; g.fillRect(0, y, s, 3); }
      [0, 1, 2].forEach(function (l) { var cx = (l + 0.5) * s / 3; g.fillStyle = "rgba(110,70,30,.28)"; g.fillRect(cx - 30, 0, 12, s); g.fillRect(cx + 18, 0, 12, s); });
    },
    side: { curb: 0xa88050, walk: 0xc09a62, walkW: 2 },
    props: function (side) {
      var g = grp(), r = Math.random();
      if (r < 0.3) { var d = mesh(sph(rnd(4, 7), 14, 8), M(pick([0xe8c07a, 0xdcb06a, 0xf0cc8a]), "stone"), 0, -1.6, 0, g); d.scale.set(1.6, rnd(0.45, 0.7), 1.2); d.receiveShadow = true; }
      else if (r < 0.5) { for (var i = 0; i < 3; i++) { var col = mesh(cyl(0.35, 0.4, rnd(2, 5), 10), M(0xd8b47a, "stone"), i * 1.5 - 1.5, 0, 0, g); col.position.y = col.geometry.parameters.height / 2; } mesh(box(4, 0.5, 1), M(0xc8a068, "stone"), 0, 4.8, 0, g); }
      else if (r < 0.7) { mesh(cyl(0.14, 0.2, 4.5, 7), M(0x8a6040, "wood"), 0, 2.25, 0, g); for (var k = 0; k < 7; k++) { var lf = mesh(box(2.2, 0.06, 0.5), M(0x3a8a3a, "fabric"), Math.cos(k * 0.9) * 0.9, 4.3, Math.sin(k * 0.9) * 0.9, g); lf.rotation.y = -k * 0.9; lf.rotation.z = -0.45; } }
      else if (r < 0.85) { var tent = mesh(cone(1.8, 2.4, 6), M(pick([0xc8402a, 0x2a6aa8, 0xe8a02a]), "fabric", { flat: true }), 0, 1.2, 0, g); mesh(cyl(1.8, 1.8, 0.1, 6), M(0x8a5a2a, "fabric"), 0, 0.05, 0, g); }
      else { var py = mesh(cone(rnd(5, 9), rnd(6, 10), 4), M(0xd8b070, "stone", { flat: true }), 0, 3, 0, g); py.rotation.y = Math.PI / 4; py.position.y = py.geometry.parameters.height / 2; }
      return g;
    },
    near: function (side) { var g = grp(); mesh(cyl(0.12, 0.12, 2.2, 6), M(0x6a4a2a, "wood"), 0, 1.1, 0, g); mesh(sph(0.18, 10, 8), M(0xffc87a, "glass", { emissive: 0xffa040, night: 3 }), 0, 2.3, 0, g); var s = new T.Sprite(new T.SpriteMaterial({ map: G.glowTex(), color: 0xffa040, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0 })); s.scale.set(2.6, 2.6, 1); s.position.y = 2.3; s.userData.nightGlow = 0.9; g.add(s); return g; },
    obs: {
      low: function () { var g = grp(); var c = mesh(cyl(0.42, 0.42, 1.9, 12), M(0xd8b47a, "stone"), 0, 0.42, 0, g); c.rotation.z = Math.PI / 2; mesh(box(0.3, 0.5, 0.5), M(0xc8a068, "stone"), 0.7, 0.85, 0, g); return shadowAll(g); },
      high: function () { var g = grp(); [-0.9, 0.9].forEach(function (x) { mesh(cyl(0.06, 0.06, 2.7, 6), M(0x6a4a2a, "wood"), x, 1.35, 0, g); }); for (var i = 0; i < 6; i++) mesh(box(0.33, 0.9, 0.06), M(i % 2 ? 0xf2e2c2 : 0xc8402a, "fabric"), -0.82 + i * 0.33, 2.05, 0, g); return shadowAll(g); },
      wall: function () { var g = grp(); mesh(box(1.9, 1.6, 1.3), M(0xd0a868, "stone"), 0, 0.8, 0, g); [-0.5, 0.45].forEach(function (x) { var j = mesh(sph(0.42, 12, 10), M(0xb8643a, "stone"), x, 2.0, 0, g); j.scale.y = 1.25; mesh(cyl(0.16, 0.2, 0.2, 10), M(0xb8643a, "stone"), x, 2.55, 0, g); }); return shadowAll(g); },
      train: function (mv) { var g = obsTrain(pick([0x8a5ad1, 0x3a9a6a]), 0xe8c07a, mv, 14); var cov = mesh(cyl(1.05, 1.05, 13, 14, 1), M(0xf2e2c2, "fabric"), 0, 2.9, 0, g); cov.rotation.x = Math.PI / 2; cov.scale.set(1, 1, 0.6); return g; },
      ramp: function () { return obsRamp(0xc8945a); },
      roller: function () { var g = grp(); var s = mesh(sph(0.55, 8, 6), M(0xa8804a, "fabric", { flat: true, opacity: 0.95 }), 0, 0.55, 0, g); var s2 = mesh(sph(0.45, 6, 5), M(0x8a6a3a, "fabric", { flat: true }), 0, 0.55, 0, g); s2.rotation.set(0.5, 0.3, 0.2); g.userData.spin = s; return shadowAll(g); }
    },
    feat: { rollers: 0.18, storm: true }
  };

  /* 3. Снежный перевал — лёд, снежные комья, сани */
  W.snow = {
    pal: {
      day: P({ top: 0x3a7ad8, hor: 0xd8ecfa, bot: 0xb0c4d4, ground: 0xe8f0f8, sunCol: 0xfff8ee, sunI: 1.05, hemiSky: 0xd8e8ff, hemiGround: 0xa8b8c8, hemiI: 0.85, fog: 0xdcecf8, fogNear: 40, fogFar: 160, sunEl: 0.6, exposure: 0.95 }),
      dusk: P({ top: 0x3a3a8a, hor: 0xff9ab0, bot: 0x8a7aa0, ground: 0xa898b8, sunCol: 0xffa080, sunI: 0.7, hemiSky: 0xb8a8d8, hemiGround: 0x8a8aa8, hemiI: 0.7, fog: 0xd8a8c0, fogNear: 35, fogFar: 140, sunEl: 0.1, night: 0.4 }),
      night: P({ top: 0x050a20, hor: 0x1a2a52, bot: 0x1a2232, ground: 0x2a3448, sunCol: 0xb0c8ff, sunI: 0.4, hemiSky: 0x5068a8, hemiGround: 0x2a3448, hemiI: 0.6, fog: 0x18223a, fogNear: 28, fogFar: 125, sunEl: 0.9, stars: 1, night: 1, exposure: 1.2 })
    },
    cycle: true, ground: 0xf2f6fc,
    groundPaint: function (g, s) { G.noise(g, s, s, 800, 0.05, 3); for (var i = 0; i < 80; i++) { g.fillStyle = "rgba(255,255,255,.9)"; g.fillRect(Math.random() * s, Math.random() * s, 1.5, 1.5); } },
    road: function (g, s) {
      g.fillStyle = "#dfe8f2"; g.fillRect(0, 0, s, s); G.noise(g, s, s, 1800, 0.06, 3);
      [0, 1, 2].forEach(function (l) { var cx = (l + 0.5) * s / 3; g.fillStyle = "rgba(120,150,190,.25)"; g.fillRect(cx - 28, 0, 8, s); g.fillRect(cx + 20, 0, 8, s); });
      g.fillStyle = "rgba(140,170,210,.35)"; g.fillRect(s / 3 - 2, 0, 4, s); g.fillRect(2 * s / 3 - 2, 0, 4, s);
    },
    side: { curb: 0xffffff, walk: 0xf0f4fa, walkW: 2.5 },
    props: function (side) {
      var g = grp(), r = Math.random();
      if (r < 0.5) fir(g, 0, 0, rnd(0.9, 1.6), true);
      else if (r < 0.75) { g.userData.off = [8, 13]; house(g, side, { key: "snow", w: [3.5, 5], h: [3.5, 5], walls: [0x9a6a42, 0x8a5a38, 0xa8784a], wood: true, roof: [0xf4f8ff], shutters: ["#a83a2a", "#2a5a3a"] }); }
      else if (r < 0.9) { var rk = mesh(sph(rnd(1, 2.2), 7, 5), M(0x7a8090, "stone", { flat: true }), 0, 0.3, 0, g); rk.scale.y = 0.7; mesh(sph(rk.geometry.parameters.radius * 0.9, 7, 5), M(0xffffff, "stone", { flat: true }), 0, 0.7, 0, g).scale.y = 0.4; }
      else { mesh(box(0.4, 9, 0.4), M(0x6a6a72, "metal"), 0, 4.5, 0, g); mesh(box(3, 0.3, 0.3), M(0x6a6a72, "metal"), 0, 9, 0, g); }
      return g;
    },
    near: function (side) { var g = grp(); fir(g, 0, 0, 0.6, true); return g; },
    obs: {
      low: function () { var g = grp(); for (var i = 0; i < 7; i++) mesh(box(0.12, rnd(0.9, 1.1), 0.08), M(0xc8302a, "wood"), -0.85 + i * 0.28, 0.5, 0, g); mesh(box(1.9, 0.1, 0.1), M(0x8a2a1a, "wood"), 0, 0.75, 0.02, g); mesh(box(1.95, 0.18, 0.3), M(0xffffff, "stone"), 0, 1.0, 0, g); return shadowAll(g); },
      high: function () { var g = obsSign(0x2a8ad8, 0xffffff); mesh(box(1.95, 0.2, 0.3), M(0xffffff, "stone"), 0, 2.62, 0, g); return g; },
      wall: function () { var g = grp(); var m = M(0xa8dcff, "ice", { opacity: 0.88, emissive: 0x2a6aa8, ei: 0.2 }); mesh(box(1.8, 1.3, 1.2), m, 0, 0.65, 0, g); mesh(box(1.4, 1.2, 1.0), m, 0.15, 1.9, 0, g).rotation.y = 0.15; return shadowAll(g); },
      train: function (mv) { var g = obsTrain(pick([0x2e6fd0, 0xd04a6a]), 0xffffff, mv, 14); mesh(box(1.9, 0.25, 13.6), M(0xffffff, "stone"), 0, 3.08, 0, g); [-0.95, 0.95].forEach(function (x) { mesh(box(0.12, 0.12, 14.4), M(0x9aa2aa, "metal"), x, 0.08, -0.2, g); }); return g; },
      ramp: function () { var g = obsRamp(0xf4f8ff); return g; },
      roller: function () { return obsRoller(0xf4f8ff, "snow"); }
    },
    feat: { rollers: 0.22, ice: 0.25 }
  };

  /* 4. Изумрудные джунгли — реки (провалы), лианы, брёвна */
  W.jungle = {
    pal: {
      day: P({ top: 0x3a8ac8, hor: 0xc8e8c0, bot: 0x5a7a4a, ground: 0x3a5a2a, sunCol: 0xfff2c8, sunI: 0.95, hemiSky: 0xc0e8c0, hemiGround: 0x3a5a2a, hemiI: 0.8, fog: 0xa8d0a0, fogNear: 30, fogFar: 135, sunEl: 0.8 }),
      dusk: P({ top: 0x2a3a6a, hor: 0xe8a060, bot: 0x3a4a2a, ground: 0x2a3a1a, sunCol: 0xffa060, sunI: 0.7, hemiSky: 0x8aa080, hemiGround: 0x2a3a1a, hemiI: 0.6, fog: 0x8a9a6a, fogNear: 28, fogFar: 120, sunEl: 0.1, night: 0.4 }),
      night: P({ top: 0x050c14, hor: 0x123024, bot: 0x0a140c, ground: 0x0a140c, sunCol: 0x9ac8b0, sunI: 0.3, hemiSky: 0x2a5a4a, hemiGround: 0x0a140c, hemiI: 0.5, fog: 0x0e2018, fogNear: 22, fogFar: 110, sunEl: 0.9, stars: 0.6, night: 1, exposure: 1.3 })
    },
    cycle: true, ground: 0x3e6a2e,
    groundPaint: function (g, s) { G.noise(g, s, s, 2000, 0.14, 4); },
    road: function (g, s) {
      g.fillStyle = "#4a3220"; g.fillRect(0, 0, s, s); G.noise(g, s, s, 2500, 0.12, 4);
      for (var y = 0; y < s; y += 24) { g.fillStyle = G.shade(0x5e4228, (Math.random() - 0.5) * 0.3); g.fillRect(0, y, s, 20); g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(0, y + 20, s, 4); }
      g.fillStyle = "rgba(60,90,40,.35)"; for (var i = 0; i < 40; i++) g.fillRect(Math.random() * s, Math.random() * s, 10, 4);
    },
    side: { curb: 0x4a6a32, walk: 0x3e5a2a, walkW: 2 },
    props: function (side) {
      var g = grp(), r = Math.random();
      if (r < 0.55) { var h = rnd(7, 12); mesh(cyl(0.35, 0.55, h, 8), M(0x5a4430, "wood"), 0, h / 2, 0, g); for (var i = 0; i < 4; i++) { var c = mesh(sph(rnd(1.6, 2.6), 8, 6), M(pick([0x2a7a3a, 0x3a8a3a, 0x1f6a30]), "fabric", { flat: true }), rnd(-1.5, 1.5), h - rnd(0, 2), rnd(-1.5, 1.5), g); c.scale.y = 0.7; } for (var v = 0; v < 3; v++) mesh(cyl(0.03, 0.03, rnd(3, 6), 4), M(0x2a5a2a, "fabric"), rnd(-1.5, 1.5), h - 3, rnd(-1, 1), g); }
      else if (r < 0.8) { for (var f = 0; f < 5; f++) { var l = mesh(box(1.6, 0.05, 0.4), M(0x3a9a3a, "fabric"), 0, 0.5, 0, g); l.rotation.y = f * 1.25; l.rotation.z = 0.5; l.position.x = Math.cos(f * 1.25) * 0.6; l.position.z = -Math.sin(f * 1.25) * 0.6; } }
      else { mesh(box(rnd(2, 4), rnd(2, 4), 2), M(0x7a8a6a, "stone"), 0, 1.2, 0, g); mesh(box(1.5, 0.3, 2.2), M(0x3a7a3a, "fabric"), 0, 2.6, 0, g); }
      return g;
    },
    near: function (side) { var g = grp(); mesh(cyl(0.08, 0.08, 1.8, 6), M(0x5a3a1e, "wood"), 0, 0.9, 0, g); mesh(cone(0.18, 0.4, 6), M(0xffa040, "glass", { emissive: 0xff8020, ei: 0.6, night: 3 }), 0, 1.95, 0, g); var s = new T.Sprite(new T.SpriteMaterial({ map: G.glowTex(), color: 0xff9030, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0 })); s.scale.set(2.4, 2.4, 1); s.position.y = 1.95; s.userData.nightGlow = 1; g.add(s); return g; },
    obs: {
      low: function () { var g = grp(); var l = mesh(cyl(0.45, 0.5, 2.0, 10), M(0x6a4a2e, "wood"), 0, 0.45, 0, g); l.rotation.z = Math.PI / 2; mesh(sph(0.2, 8, 6), M(0x3a8a3a, "fabric"), 0.4, 0.9, 0, g); return shadowAll(g); },
      high: function () { var g = grp(); mesh(cyl(0.22, 0.22, 2.4, 8), M(0x6a4a2e, "wood"), 0, 2.4, 0, g).rotation.z = Math.PI / 2; for (var i = 0; i < 9; i++) { var v = mesh(cyl(0.035, 0.035, rnd(0.9, 1.15), 4), M(0x2f7a2f, "fabric"), -0.9 + i * 0.22, 1.85, 0, g); } [-1.05, 1.05].forEach(function (x) { mesh(cyl(0.15, 0.2, 2.7, 7), M(0x5a4430, "wood"), x, 1.35, 0, g); }); return shadowAll(g); },
      wall: function () { var g = grp(); mesh(box(1.8, 2.5, 1.3), M(0x8a9a7a, "stone"), 0, 1.25, 0, g); mesh(box(1.2, 0.3, 0.2), M(0x5a6a4a, "stone"), 0, 1.4, -0.7, g); [-0.4, 0.4].forEach(function (x) { mesh(box(0.3, 0.25, 0.1), M(0x2a3a2a, "stone"), x, 1.9, -0.68, g); }); mesh(box(1.9, 0.4, 1.4), M(0x3a7a3a, "fabric"), 0, 2.6, 0, g); return shadowAll(g); },
      train: function (mv) { var g = obsTrain(0x7a5a3a, 0x3a7a3a, mv, 14); return g; },
      ramp: function () { return obsRamp(0x8a6a44); },
      gap: function () { var g = obsGap(0x2a7a9a, 0x6a4a2e); var w = mesh(box(2.0, 0.02, 3.0), M(0x5ac8e8, "glass", { opacity: 0.8, emissive: 0x1a5a7a, ei: 0.3 }), 0, -0.2, 0, g); return g; }
    },
    feat: { gaps: 0.2 }
  };

  /* 5. Солнечный порт — контейнеры, бочки, погрузчики, море сбоку */
  W.harbor = {
    pal: {
      day: P({ top: 0x2a7ae0, hor: 0xc8ecff, bot: 0x5a8aa8, ground: 0x3a7aa8, sunCol: 0xfff4e0, sunI: 1.05, hemiSky: 0xc8e4ff, hemiGround: 0x6a7a8a, hemiI: 0.8, fog: 0xc0e0f4, fogNear: 45, fogFar: 175, sunEl: 0.85 }),
      dusk: P({ top: 0x2a2a7a, hor: 0xff8a5a, bot: 0x5a4a6a, ground: 0x3a3a5a, sunCol: 0xff8a4a, sunI: 0.75, hemiSky: 0xa08ac0, hemiGround: 0x4a4a5a, hemiI: 0.6, fog: 0xe0907a, fogNear: 40, fogFar: 150, sunEl: 0.08, night: 0.4 }),
      night: P({ top: 0x040a1e, hor: 0x16284a, bot: 0x0a1020, ground: 0x0a1428, sunCol: 0x9ab8ff, sunI: 0.3, hemiSky: 0x3a5a9a, hemiGround: 0x101a2a, hemiI: 0.5, fog: 0x101a30, fogNear: 30, fogFar: 125, sunEl: 0.9, stars: 1, night: 1, exposure: 1.25 })
    },
    cycle: true, ground: 0x2a6a9a, water: true,
    groundPaint: function (g, s) { for (var i = 0; i < 300; i++) { g.fillStyle = "rgba(255,255,255," + rnd(0.05, 0.2) + ")"; g.fillRect(Math.random() * s, Math.random() * s, rnd(4, 12), 1.5); } },
    road: function (g, s) {
      for (var x = 0; x < s; x += 21) { g.fillStyle = G.shade(0x9a7a56, (Math.random() - 0.5) * 0.3); g.fillRect(x, 0, 20, s); g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(x + 20, 0, 1, s); }
      for (var y = 0; y < s; y += 128) { g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(0, y, s, 2); }
      G.noise(g, s, s, 1500, 0.08, 2);
    },
    side: { curb: 0x6a5a4a, walk: 0x8a8a8a, walkW: 3 },
    props: function (side) {
      var g = grp(), r = Math.random();
      if (r < 0.5) { var n = Math.floor(rnd(1, 4)); for (var i = 0; i < n; i++) { var c = pick([0xc8402a, 0x2a6ac8, 0x2a9a5a, 0xe8a02a, 0x7a3aa8]); var b = mesh(box(2.4, 2.5, 6), M(c, "paint"), 0, 1.25 + i * 2.5, 0, g); b.castShadow = true; for (var k = -2.6; k <= 2.6; k += 0.4) mesh(box(2.42, 2.3, 0.06), M(G.lin ? c : c, "metal"), 0, 1.25 + i * 2.5, k, g); } }
      else if (r < 0.7) { mesh(box(0.8, 14, 0.8), M(0xe8b81a, "paint"), 0, 7, 0, g); var arm = mesh(box(0.6, 0.6, 12), M(0xe8b81a, "paint"), 0, 14, -3, g); mesh(box(1.6, 1.5, 1.6), M(0x2a2a30, "metal"), 0, 13.2, 0, g); mesh(cyl(0.03, 0.03, 6, 4), M(0x222222, "metal"), 0, 11, -8, g); }
      else if (r < 0.85) { mesh(cyl(1.2, 1.5, 9, 12), M(0xffffff, "paint"), 0, 4.5, 0, g); for (var s2 = 0; s2 < 3; s2++) mesh(cyl(1.25, 1.35, 1, 12), M(0xc8302a, "paint"), 0, 1 + s2 * 3, 0, g); mesh(cyl(0.9, 0.9, 1.2, 12), M(0xfff2c0, "glass", { emissive: 0xfff2a0, ei: 0.3, night: 3 }), 0, 9.6, 0, g); mesh(cone(1.1, 1, 12), M(0xc8302a, "paint"), 0, 10.7, 0, g); }
      else { var hull = mesh(box(3, 1.4, 8), M(pick([0xffffff, 0x2a4a7a, 0xc8402a]), "paint"), 0, 0.3, 0, g); mesh(box(2, 1.4, 3), M(0xffffff, "paint"), 0, 1.7, -1, g); mesh(cyl(0.06, 0.06, 6, 6), M(0xdddddd, "metal"), 0, 4, 1, g); }
      return g;
    },
    near: function (side) { var g = grp(); mesh(cyl(0.22, 0.28, 0.7, 10), M(0x2a2a30, "metal"), 0, 0.35, 0, g); mesh(cyl(0.3, 0.3, 0.12, 10), M(0x2a2a30, "metal"), 0, 0.72, 0, g); return g; },
    obs: {
      low: function () { var g = grp(); [-0.55, 0.55].forEach(function (x) { mesh(cyl(0.42, 0.42, 0.95, 12), M(pick([0x2a6ac8, 0xc8402a]), "paint"), x, 0.48, 0, g); mesh(cyl(0.44, 0.44, 0.05, 12), M(0x2a2a2a, "metal"), x, 0.75, 0, g); }); return shadowAll(g); },
      high: function () { var g = grp(); mesh(box(1.9, 1.2, 1.4), M(0xe8a02a, "paint"), 0, 2.0, 0, g); [-0.6, 0.6].forEach(function (x) { mesh(cyl(0.02, 0.02, 3, 4), M(0x222222, "metal"), x, 4.1, 0, g); }); return shadowAll(g); },
      wall: function () { var g = grp(); var c = pick([0xc8402a, 0x2a6ac8, 0x2a9a5a]); mesh(box(1.95, 2.55, 1.4), M(c, "paint"), 0, 1.28, 0, g); for (var x = -0.9; x <= 0.9; x += 0.3) mesh(box(0.06, 2.4, 1.42), M(c, "metal"), x, 1.28, 0, g); return shadowAll(g); },
      train: function (mv) { var g = grp(); var c = pick([0xc8402a, 0x2a6ac8, 0x2a9a5a, 0xe8a02a]); mesh(box(1.96, 2.6, 13.4), M(c, "paint"), 0, 1.6, 0.3, g); for (var z = -6.3; z <= 6.9; z += 0.45) mesh(box(2.0, 2.45, 0.07), M(c, "metal"), 0, 1.6, z, g); mesh(box(1.96, 1.2, 1.8), M(0x2a2a30, "paint"), 0, 1.0, -6.4, g); mesh(box(1.6, 0.7, 0.05), M(0x2a3a52, "glass", { emissive: 0xffd9a0, night: 1 }), 0, 1.3, -7.32, g); [-0.65, 0.65].forEach(function (x) { mesh(box(0.25, 0.16, 0.05), M(mv ? 0xfff2b0 : 0xff4a2a, "glass", { emissive: mv ? 0xfff2b0 : 0xff4a2a, ei: 2.5 }), x, 0.55, -7.33, g); }); mesh(box(1.9, 0.3, 14), M(0x2a2a30, "metal"), 0, 0.18, 0, g); return shadowAll(g); },
      ramp: function () { return obsRamp(0x9a7a56); },
      roller: function () { return obsRoller(0x2a6ac8, "barrel"); }
    },
    feat: { rollers: 0.2 }
  };

  /* 6. Огненная шахта — всегда полумрак, вагонетки, лава */
  W.mine = {
    pal: {
      day: P({ top: 0x1a1210, hor: 0x3a2418, bot: 0x2a1a10, ground: 0x2a1a12, sunCol: 0xffa060, sunI: 0.35, hemiSky: 0x8a5a3a, hemiGround: 0x2a1a10, hemiI: 0.6, fog: 0x2a1810, fogNear: 18, fogFar: 95, sunEl: 1.1, night: 0.8, exposure: 1.35 }),
      dusk: null, night: null
    },
    cycle: false, ground: 0x3a2a20, tunnel: true,
    groundPaint: function (g, s) { G.noise(g, s, s, 2500, 0.2, 4); },
    road: function (g, s) {
      g.fillStyle = "#4a3a30"; g.fillRect(0, 0, s, s); G.noise(g, s, s, 3500, 0.2, 3);
      for (var y = 0; y < s; y += 32) { g.fillStyle = "#3a2618"; [0, 1, 2].forEach(function (l) { var cx = (l + 0.5) * s / 3; g.fillRect(cx - 44, y, 88, 10); }); }
      [0, 1, 2].forEach(function (l) { var cx = (l + 0.5) * s / 3; g.fillStyle = "#8a8a90"; g.fillRect(cx - 32, 0, 6, s); g.fillRect(cx + 26, 0, 6, s); });
    },
    side: { curb: 0x3a2a20, walk: 0x2a1c14, walkW: 1.5 },
    props: function (side) {
      var g = grp(), r = Math.random();
      if (r < 0.5) { var c = pick([0xff8a2a, 0xffb02a, 0x2affd0, 0xc84aff]); for (var i = 0; i < 4; i++) { var k = mesh(cone(rnd(0.2, 0.5), rnd(1, 2.5), 5), M(c, "glass", { emissive: c, ei: 1.4, flat: true }), rnd(-1, 1), 0.6, rnd(-1, 1), g); k.rotation.set(rnd(-0.4, 0.4), 0, rnd(-0.4, 0.4)); } mesh(sph(1.3, 6, 5), M(0x3a2a22, "stone", { flat: true }), 0, -0.2, 0, g); }
      else { mesh(sph(rnd(2, 4), 7, 5), M(0x4a3628, "stone", { flat: true }), 0, rnd(0, 2), 0, g); }
      return g;
    },
    near: function (side) {   // крепь туннеля: стойки, балка и фонарь
      var g = grp(); mesh(box(0.35, 6, 0.35), M(0x5a3a22, "wood"), 0, 3, 0, g);
      if (side > 0) { mesh(box(12.5, 0.4, 0.4), M(0x5a3a22, "wood"), -6.1, 6, 0, g); mesh(box(0.35, 6, 0.35), M(0x5a3a22, "wood"), -12.2, 3, 0, g); }
      mesh(box(0.25, 0.35, 0.25), M(0xffc060, "glass", { emissive: 0xff9a30, ei: 2.5 }), -side * 0.3, 4.2, 0, g);
      var s = new T.Sprite(new T.SpriteMaterial({ map: G.glowTex(), color: 0xff9a30, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.85 })); s.scale.set(3, 3, 1); s.position.set(-side * 0.3, 4.2, 0); g.add(s);
      return g;
    },
    nearEvery: 12,
    obs: {
      low: function () { var g = grp(); for (var i = 0; i < 5; i++) mesh(sph(rnd(0.3, 0.45), 6, 5), M(pick([0x5a4a3a, 0x6a5040]), "stone", { flat: true }), -0.7 + i * 0.35, 0.3, rnd(-0.1, 0.1), g); mesh(sph(0.15, 6, 5), M(0xffc040, "gold", { flat: true }), 0.2, 0.75, 0, g); return shadowAll(g); },
      high: function () { var g = grp(); mesh(box(2.4, 0.5, 0.5), M(0x5a3a22, "wood"), 0, 2.3, 0, g); for (var i = 0; i < 4; i++) mesh(cone(0.18, rnd(0.6, 1.0), 5), M(0x5a4a3a, "stone", { flat: true }), -0.7 + i * 0.45, 1.7, 0, g).rotation.x = Math.PI; [-1.1, 1.1].forEach(function (x) { mesh(box(0.3, 2.6, 0.3), M(0x5a3a22, "wood"), x, 1.3, 0, g); }); return shadowAll(g); },
      wall: function () { var g = grp(); mesh(sph(1.15, 7, 6), M(0x5a4636, "stone", { flat: true }), 0, 1.1, 0, g).scale.set(0.9, 1.15, 0.7); mesh(cone(0.25, 0.8, 5), M(0x2affd0, "glass", { emissive: 0x2affd0, ei: 1.4, flat: true }), 0.5, 2.2, 0, g); return shadowAll(g); },
      train: function (mv) { var g = grp(); for (var i = 0; i < 3; i++) { var z = -4.6 + i * 4.6; mesh(box(1.8, 1.5, 4.2), M(0x6a6a72, "metal"), 0, 1.1, z, g); mesh(box(1.6, 0.3, 4.0), M(0xffb02a, "gold", { flat: true }), 0, 1.95, z, g); [-1.4, 1.4].forEach(function (dz) { [-0.7, 0.7].forEach(function (x) { var w = mesh(cyl(0.3, 0.3, 0.15, 12), M(0x2a2a2a, "metal"), x, 0.3, z + dz, g); w.rotation.z = Math.PI / 2; }); }); } mesh(box(1.9, 2.6, 0.3), M(0x4a4a50, "metal"), 0, 1.5, -6.9, g); [-0.5, 0.5].forEach(function (x) { mesh(box(0.3, 0.3, 0.05), M(mv ? 0xfff2b0 : 0xff4a2a, "glass", { emissive: mv ? 0xfff2b0 : 0xff4a2a, ei: 3 }), x, 2.2, -7.06, g); }); return shadowAll(g); },
      ramp: function () { return obsRamp(0x6a4a30); },
      gap: function () { return obsGap(0xff5a1a, 0x3a2a20, true); }
    },
    feat: { gaps: 0.22, embers: true }
  };

  /* 7. Небесные острова — облака-провалы, батуты, ветряки */
  W.sky = {
    pal: {
      day: P({ top: 0x2a6ae0, hor: 0xd0e8ff, bot: 0xffffff, ground: 0xf4f8ff, sunCol: 0xfff8e8, sunI: 0.95, exposure: 0.9, hemiSky: 0xd8ecff, hemiGround: 0xc8d8e8, hemiI: 0.9, fog: 0xe8f4ff, fogNear: 45, fogFar: 180, sunEl: 0.7 }),
      dusk: P({ top: 0x3a2a8a, hor: 0xffa0a0, bot: 0xffc8a8, ground: 0xe8b8b0, sunCol: 0xff9a6a, sunI: 0.8, hemiSky: 0xc8a8d8, hemiGround: 0xc8a0a0, hemiI: 0.7, fog: 0xf0b0a8, fogNear: 40, fogFar: 160, sunEl: 0.08, night: 0.35 }),
      night: P({ top: 0x050820, hor: 0x2a2a5a, bot: 0x3a3a6a, ground: 0x2a2a4a, sunCol: 0xb8c8ff, sunI: 0.35, hemiSky: 0x5a5aa8, hemiGround: 0x2a2a4a, hemiI: 0.6, fog: 0x1a1a3a, fogNear: 30, fogFar: 140, sunEl: 0.9, stars: 1, night: 1, exposure: 1.2 })
    },
    cycle: true, ground: 0xe8eef8, clouds: true, groundY: -14,
    groundPaint: function (g, s) { for (var i = 0; i < 90; i++) { var r = rnd(10, 30), x = Math.random() * s, y = Math.random() * s, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(255,255,255,.9)"); gr.addColorStop(1, "rgba(220,230,250,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } },
    road: function (g, s) {
      g.fillStyle = "#6a645a"; g.fillRect(0, 0, s, s);
      for (var y = 0; y < s; y += 32) for (var x = (y / 32) % 2 ? -32 : 0; x < s; x += 64) { g.fillStyle = G.shade(0x8a8276, (Math.random() - 0.5) * 0.25); g.fillRect(x + 2, y + 2, 60, 28); }
      g.fillStyle = "#e8c070"; g.fillRect(0, 0, 8, s); g.fillRect(s - 8, 0, 8, s);
    },
    side: { curb: 0xc8a050, walk: 0x8a8276, walkW: 0.6, rail: true },
    props: function (side) {
      var g = grp(), r = Math.random();
      if (r < 0.55) { var rad = rnd(3, 6); var isl = mesh(cone(rad, rad * 1.6, 7), M(0x8a7a6a, "stone", { flat: true }), 0, -rad * 0.8, 0, g); isl.rotation.x = Math.PI; mesh(cyl(rad, rad, 0.6, 7), M(0x5aa84a, "fabric", { flat: true }), 0, 0.3, 0, g); if (Math.random() < 0.6) tree(g, rnd(-1, 1), rnd(-1, 1), 1, 0x4aa84a); g.position.y = rnd(-4, 6); }
      else if (r < 0.75) { mesh(cyl(0.6, 1, 7, 8), M(0xf2e8d8, "stone"), 0, 3.5, 0, g); mesh(cone(1.2, 1.6, 8), M(0xc8402a, "paint"), 0, 7.8, 0, g); var b = grp(); b.position.set(-side * 1.1, 6, 0); for (var i = 0; i < 4; i++) { var bl = mesh(box(0.3, 3.4, 0.08), M(0xf4f4f4, "fabric"), 0, 1.7, 0, null); var p = grp(); p.add(bl); p.rotation.x = i * Math.PI / 2; b.add(p); } b.userData.spin = 1; b.userData.noMerge = true; g.add(b); g.userData.spinner = b; }
      else { var bal = mesh(sph(2.2, 14, 10), M(pick([0xff5a5a, 0x5aa8ff, 0xffc83a]), "fabric"), 0, 6, 0, g); bal.scale.y = 1.2; mesh(box(1, 0.8, 1), M(0x8a5a2a, "wood"), 0, 2.8, 0, g); g.position.y = rnd(0, 8); }
      return g;
    },
    near: function (side) { var g = grp(); mesh(box(0.15, 1.1, 0.15), M(0xe8c070, "gold"), 0, 0.55, 0, g); return g; },
    nearEvery: 4,
    obs: {
      low: function () { var g = grp(); mesh(box(1.9, 0.9, 0.7), M(0x3a8a3a, "fabric", { flat: true }), 0, 0.45, 0, g); for (var i = 0; i < 4; i++) mesh(sph(0.1, 6, 5), M(0xff7aa8, "fabric"), -0.7 + i * 0.45, 0.95, 0.2, g); return shadowAll(g); },
      high: function () { var g = grp(); var a = mesh(new T.TorusGeometry(1.15, 0.12, 8, 20, Math.PI), M(0xe8c070, "gold"), 0, 1.3, 0, g); [-1.15, 1.15].forEach(function (x) { mesh(cyl(0.12, 0.12, 1.3, 8), M(0xe8c070, "gold"), x, 0.65, 0, g); }); mesh(box(2.1, 1.0, 0.12), M(0xf4f4f8, "fabric"), 0, 2.0, 0, g); return shadowAll(g); },
      wall: function () { var g = grp(); mesh(cyl(0.85, 1.0, 2.6, 7), M(0x9a8a7a, "stone", { flat: true }), 0, 1.3, 0, g); mesh(cyl(1.0, 0.85, 0.3, 7), M(0x5aa84a, "fabric", { flat: true }), 0, 2.7, 0, g); return shadowAll(g); },
      train: function (mv) { var g = obsTrain(pick([0xf2f2f2, 0xffc83a]), 0x5aa8ff, mv, 14); mesh(sph(1.4, 10, 8), M(0xffffff, "fabric", { opacity: 0.85 }), 0, 3.2, 4, g).scale.set(1, 0.5, 2); return g; },
      ramp: function () { return obsRamp(0xe8c070); },
      gap: function () { var g = grp(); mesh(box(2.1, 0.04, 3.2), M(0xf4f8ff, "fabric", { opacity: 0.95 }), 0, 0.02, 0, g); [-1.6, 1.6].forEach(function (z) { mesh(box(2.15, 0.25, 0.25), M(0x9a8a7a, "stone"), 0, 0.0, z, g); }); for (var i = 0; i < 5; i++) mesh(sph(rnd(0.4, 0.7), 8, 6), M(0xffffff, "fabric", { opacity: 0.9 }), rnd(-0.8, 0.8), -0.2, rnd(-1.2, 1.2), g); return g; },
      pad: function () { return obsPad(0x5ac8ff); }
    },
    feat: { gaps: 0.2, pads: 0.12 }
  };

  /* 8. Лунный парк — низкая гравитация, кратеры, луноходы */
  W.moon = {
    pal: {
      day: P({ top: 0x020208, hor: 0x1a1a3a, bot: 0x2a2a30, ground: 0x6a6a72, sunCol: 0xffffff, sunI: 1.15, hemiSky: 0x6a7ab8, hemiGround: 0x3a3a40, hemiI: 0.55, fog: 0x14142a, fogNear: 60, fogFar: 200, sunEl: 0.45, stars: 1, night: 0.6, exposure: 0.92 }),
      dusk: null, night: null
    },
    cycle: false, ground: 0x6a6a72, earth: true, gravity: 0.58,
    groundPaint: function (g, s) { G.noise(g, s, s, 2000, 0.12, 3); for (var i = 0; i < 25; i++) { var x = Math.random() * s, y = Math.random() * s, r = rnd(4, 14); g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); g.fillStyle = "rgba(0,0,0,.1)"; g.fill(); } },
    road: function (g, s) {
      g.fillStyle = "#5a6068"; g.fillRect(0, 0, s, s);
      for (var y = 0; y < s; y += 64) for (var x = 0; x < s; x += 64) { g.fillStyle = G.shade(0x737a84, (Math.random() - 0.5) * 0.15); g.fillRect(x + 2, y + 2, 60, 60); g.fillStyle = "rgba(0,0,0,.3)"; [8, 52].forEach(function (a) { [8, 52].forEach(function (b) { g.fillRect(x + a, y + b, 3, 3); }); }); }
      g.fillStyle = "#3affd0"; g.fillRect(s / 3 - 2, 0, 4, s); g.fillRect(2 * s / 3 - 2, 0, 4, s);
    },
    roadGlow: 0x3affd0,
    side: { curb: 0x9aa0a8, walk: 0x5a5a62, walkW: 1.5 },
    props: function (side) {
      var g = grp(), r = Math.random();
      if (r < 0.35) { var d = mesh(new T.SphereGeometry(rnd(3, 5), 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), M(0xbfe8ff, "glass", { opacity: 0.35, emissive: 0x3a8aff, ei: 0.3 }), 0, 0, 0, g); mesh(cyl(1, 1, 2, 10), M(0xe8e8e8, "plastic"), 0, 1, 0, g); }
      else if (r < 0.55) { mesh(cyl(0.6, 0.6, 7, 12), M(0xf2f2f2, "paint"), 0, 3.5, 0, g); mesh(cone(0.6, 1.6, 12), M(0xc8302a, "paint"), 0, 7.8, 0, g); [0, 1, 2].forEach(function (i) { var f = mesh(box(0.1, 1.6, 1), M(0xc8302a, "paint"), Math.cos(i * 2.1) * 0.7, 0.8, Math.sin(i * 2.1) * 0.7, g); f.rotation.y = -i * 2.1; }); }
      else if (r < 0.75) { var cr = mesh(new T.TorusGeometry(rnd(2, 4), 0.6, 6, 14), M(0x7a7a82, "stone", { flat: true }), 0, 0, 0, g); cr.rotation.x = Math.PI / 2; cr.scale.z = 0.5; }
      else { mesh(cyl(0.12, 0.12, 5, 6), M(0xdddddd, "metal"), 0, 2.5, 0, g); var dish = mesh(new T.SphereGeometry(1.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 3), M(0xeeeeee, "metal", { side: true }), 0, 5, 0, g); dish.rotation.x = -0.8; mesh(sph(0.15, 8, 6), M(0xff3a3a, "glass", { emissive: 0xff3a3a, ei: 2 }), 0, 5.6, 0.2, g); }
      return g;
    },
    near: function (side) { var g = grp(); mesh(box(0.2, 0.6, 0.2), M(0xc8ccd4, "metal"), 0, 0.3, 0, g); mesh(box(0.22, 0.1, 0.22), M(0x3affd0, "glass", { emissive: 0x3affd0, ei: 2 }), 0, 0.62, 0, g); return g; },
    nearEvery: 6,
    obs: {
      low: function () { var g = grp(); mesh(box(1.8, 0.9, 0.9), M(0xe8e8ec, "plastic"), 0, 0.45, 0, g); mesh(box(1.82, 0.12, 0.92), M(0xff8a1a, "paint"), 0, 0.7, 0, g); return shadowAll(g); },
      high: function () { var g = grp(); [-0.95, 0.95].forEach(function (x) { mesh(box(0.14, 2.7, 0.14), M(0xc8ccd4, "metal"), x, 1.35, 0, g); }); mesh(box(2.0, 1.1, 0.12), M(0x2a3a5a, "glass", { emissive: 0x3a7aff, ei: 0.4 }), 0, 2.0, 0, g); return shadowAll(g); },
      wall: function () { var g = grp(); mesh(box(1.9, 2.5, 1.4), M(0xe8e8ec, "plastic"), 0, 1.25, 0, g); mesh(box(1.92, 0.3, 1.42), M(0x3affd0, "glass", { emissive: 0x3affd0, ei: 1.2 }), 0, 1.6, 0, g); return shadowAll(g); },
      train: function (mv) { var g = obsTrain(0xe8e8ec, 0x3affd0, mv, 14); [-5, 0, 5].forEach(function (z) { mesh(sph(0.7, 12, 8), M(0xbfe8ff, "glass", { opacity: 0.5 }), 0, 3.0, z, g); }); return g; },
      ramp: function () { return obsRamp(0xc8ccd4); },
      gap: function () { var g = grp(); mesh(cyl(1.6, 1.4, 0.06, 18), M(0x1a1a20, "stone"), 0, 0.02, 0, g).scale.z = 1.05; var rim = mesh(new T.TorusGeometry(1.6, 0.18, 6, 18), M(0x8a8a90, "stone", { flat: true }), 0, 0.05, 0, g); rim.rotation.x = Math.PI / 2; return g; }
    },
    feat: { gaps: 0.2 }
  };

  return { W: W, lamp: lamp, tree: tree, fir: fir };
})();
