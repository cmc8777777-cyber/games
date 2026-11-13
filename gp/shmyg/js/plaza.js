/* Держи Шмыга! · площадь мира для стройки: 5 зданий × 3 уровня, у каждого здания свой вид (архетип) на каждом уровне.
   Уровень 0 — фундамент с лесами и табличкой. Постройка — анимация «вырастает из земли», пыль и золотые искры. */
window.PLAZA = (function () {
  "use strict";
  var T = window.THREE, G = window.GFX, MD = window.MODELS, WG = window.WORLDGFX;
  var M = G.mat, geo = MD.geo;
  function mesh(g, m, x, y, z, p) { var o = new T.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; o.receiveShadow = true; if (p) p.add(o); return o; }
  function box(w, h, d) { return geo.box(w, h, d); }
  function cyl(a, b, h, s) { return geo.cyl(a, b, h, s); }
  function sph(r, a, b) { return geo.sph(r, a, b); }
  function cone(r, h, s) { return geo.cone(r, h, s); }
  function grp(p) { var g = new T.Group(); if (p) p.add(g); return g; }
  function lightBulb(g, x, y, z, c) { var b = mesh(sph(0.12, 8, 6), M(c || 0xffe0a0, "glass", { emissive: c || 0xffd27a, ei: 0.4, night: 3 }), x, y, z, g); b.castShadow = false; return b; }
  function flag(g, x, y, c) { mesh(cyl(0.04, 0.04, 1.6, 6), M(0x777777, "metal"), x, y + 0.8, 0, g); var f = mesh(box(0.7, 0.42, 0.03), M(c, "fabric"), x + 0.36, y + 1.38, 0, g); f.userData.flag = true; return f; }
  var roofGeo = {};
  function roof(w, h, d) { var k = w + ":" + h + ":" + d; if (!roofGeo[k]) { var s = new T.Shape(); s.moveTo(-w / 2, 0); s.lineTo(0, h); s.lineTo(w / 2, 0); s.lineTo(-w / 2, 0); var gg = new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); gg.translate(0, 0, -d / 2); roofGeo[k] = gg; } return roofGeo[k]; }

  /* ---------- Архетипы зданий: f(g, lvl 1..3, c — цвет здания, w — мир) ---------- */
  var A = {
    fountain: function (g, l, c) {
      mesh(cyl(2.2, 2.4, 0.5, 20), M(0xc8beb0, "stone"), 0, 0.25, 0, g);
      mesh(cyl(1.95, 1.95, 0.08, 20), M(c, "glass", { opacity: 0.85, emissive: 0x1a5a8a, ei: 0.2 }), 0, 0.46, 0, g);
      mesh(cyl(0.3, 0.45, 1.4 + l * 0.4, 10), M(0xd8d0c4, "stone"), 0, 0.9 + l * 0.2, 0, g);
      if (l >= 2) { mesh(cyl(1.0, 0.6, 0.25, 16), M(0xd8d0c4, "stone"), 0, 1.7, 0, g); mesh(cyl(0.9, 0.9, 0.06, 16), M(c, "glass", { opacity: 0.85 }), 0, 1.83, 0, g); }
      if (l >= 3) { mesh(sph(0.35, 12, 8), M(0xffc93a, "gold"), 0, 2.55, 0, g); for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2; lightBulb(g, Math.cos(a) * 2.25, 0.6, Math.sin(a) * 2.25, 0x8ad8ff); } }
    },
    house: function (g, l, c, w, o) {
      var h = 2.2 + l * 1.3, wd = 3.2 + l * 0.3;
      var f = G.facade("pz:" + c + (o && o.wood ? "w" : ""), { wall: (o && o.wall) || 0xf0e0c8, brick: !(o && o.wood), wood: o && o.wood, shutters: "#" + ("00000" + c.toString(16)).slice(-6), door: true, cols: 2, rows: Math.max(1, l) });
      mesh(box(wd, h, 3), M(0xffffff, "stone", { map: f.map, emissive: 0xffffff, emissiveMap: f.emissive, night: 1.4 }), 0, h / 2, 0, g);
      var r = mesh(roof(wd + 0.5, 1.4 + l * 0.2, 3.5), M(c, "stone", { flat: true }), 0, h, 0, g); r.rotation.y = 0;
      if (l >= 2) { mesh(box(wd + 0.3, 0.1, 0.9), M(c, "fabric"), 0, 2.3, 1.85, g).rotation.x = 0.35; mesh(box(0.5, 1.0, 0.5), M(0x8a5a4a, "stone"), wd * 0.25, h + 1.2, 0.4, g); }
      if (l >= 3) { flag(g, -wd / 2 + 0.2, h + 0.4, c); lightBulb(g, -0.9, 2.0, 1.6); lightBulb(g, 0.9, 2.0, 1.6); mesh(box(1.2, 0.5, 0.1), M(0xffc93a, "gold"), 0, h - 0.4, 1.55, g); }
    },
    tower: function (g, l, c, w, o) {
      var h = 4 + l * 2.2;
      mesh(box(2.2, h, 2.2), M((o && o.wall) || 0xe8dcc8, "stone"), 0, h / 2, 0, g);
      for (var y = 1.2; y < h - 0.5; y += 1.6) mesh(box(0.5, 0.8, 0.1), M(0x3a4a6a, "glass", { emissive: 0xffd9a0, night: 1.4 }), 0, y, 1.12, g);
      mesh(cone(1.9, 2 + l * 0.4, 4), M(c, "stone", { flat: true }), 0, h + 1 + l * 0.2, 0, g).rotation.y = Math.PI / 4;
      if (o && o.clock && l >= 2) { mesh(cyl(0.8, 0.8, 0.12, 20), M(0xfff8e8, "plastic", { emissive: 0xfff2c0, night: 1.2 }), 0, h - 1.0, 1.15, g).rotation.x = Math.PI / 2; var hd = mesh(box(0.06, 0.6, 0.05), M(0x222222, "metal"), 0, h - 0.8, 1.23, g); hd.userData.clock = true; }
      if (o && o.stripes) for (var s = 0; s < l + 1; s++) mesh(box(2.25, 0.6, 2.25), M(0xc8302a, "paint"), 0, 1 + s * 2.2, 0, g);
      if (o && o.lamp) { mesh(cyl(0.9, 0.9, 1.2, 12), M(0xfff2c0, "glass", { emissive: 0xfff0a0, ei: 0.3, night: 3 }), 0, h + 0.6, 0, g); }
      if (l >= 3) { flag(g, 0, h + 2.6 + l * 0.2, c); for (var k = 0; k < 4; k++) lightBulb(g, (k % 2 ? 1 : -1) * 1.15, h - 0.2, (k < 2 ? 1 : -1) * 1.15); }
    },
    carousel: function (g, l, c) {
      mesh(cyl(2.6, 2.6, 0.35, 24), M(0xf2e2c8, "paint"), 0, 0.18, 0, g);
      mesh(cyl(0.25, 0.25, 3, 10), M(0xffc93a, "gold"), 0, 1.7, 0, g);
      var top = mesh(cone(3.0, 1.2 + l * 0.3, 16), M(c, "fabric"), 0, 3.6, 0, g);
      var rot = grp(g); rot.userData.spin = 0.6;
      for (var i = 0; i < 4 + l * 2; i++) { var a = i / (4 + l * 2) * Math.PI * 2; mesh(cyl(0.04, 0.04, 2.6, 6), M(0xffc93a, "gold"), Math.cos(a) * 2, 1.7, Math.sin(a) * 2, rot); var hs = mesh(box(0.35, 0.5, 0.9), M(i % 2 ? 0xffffff : c, "paint"), Math.cos(a) * 2, 1.2 + (i % 2) * 0.3, Math.sin(a) * 2, rot); hs.rotation.y = -a; }
      if (l >= 3) { for (var k = 0; k < 12; k++) { var b = k / 12 * Math.PI * 2; lightBulb(g, Math.cos(b) * 2.9, 3.05, Math.sin(b) * 2.9); } flag(g, 0, 4.2 + l * 0.3, 0xffffff); }
    },
    well: function (g, l, c) {
      mesh(cyl(1.0, 1.1, 1.0, 14), M(0xc8a878, "stone"), 0, 0.5, 0, g); mesh(cyl(0.85, 0.85, 0.05, 14), M(0x2a6a9a, "glass"), 0, 0.98, 0, g);
      [-0.9, 0.9].forEach(function (x) { mesh(box(0.15, 2.2, 0.15), M(0x6a4a2a, "wood"), x, 1.6, 0, g); });
      mesh(roof(2.4, 0.9 + l * 0.2, 1.6), M(c, "stone", { flat: true }), 0, 2.6, 0, g).rotation.y = Math.PI / 2;
      if (l >= 2) { mesh(cyl(1.6, 1.6, 0.2, 16), M(0xd8c098, "stone"), 0, 0.1, 0, g); for (var i = 0; i < 3; i++) mesh(sph(0.3, 10, 8), M(0xb8643a, "stone"), -1.6 + i * 0.4, 0.4, 1.4, g).scale.y = 1.3; }
      if (l >= 3) { mesh(box(0.15, 0.15, 1.2), M(0xffc93a, "gold"), 0, 2.4, 0, g); lightBulb(g, 0, 2.2, 0.6); flag(g, 1.4, 0, c); }
    },
    tents: function (g, l, c) {
      for (var i = 0; i < l + 1; i++) { var x = (i - l / 2) * 2.2; mesh(box(1.9, 0.9, 1.4), M(0x8a6040, "wood"), x, 0.45, 0, g); [-0.85, 0.85].forEach(function (dx) { mesh(cyl(0.05, 0.05, 2.4, 6), M(0x6a4a2a, "wood"), x + dx, 1.2, 0.6, g); }); var aw = mesh(box(2.0, 0.08, 1.6), M(i % 2 ? 0xffffff : c, "fabric"), x, 2.4, 0.2, g); aw.rotation.x = -0.25; for (var k = 0; k < 4; k++) mesh(sph(0.16, 8, 6), M([0xff5a3a, 0xffc83a, 0x5ac85a, 0xff8ad8][k], "plastic"), x - 0.6 + k * 0.4, 1.05, 0.2, g); }
      if (l >= 3) for (var j = 0; j < 8; j++) lightBulb(g, -3.4 + j, 2.6, 1.0);
    },
    oasis: function (g, l, c) {
      mesh(cyl(2.2, 2.2, 0.08, 20), M(0x2a8ab8, "glass", { opacity: 0.85, emissive: 0x0a3a5a, ei: 0.3 }), 0, 0.05, 0, g);
      mesh(new T.TorusGeometry(2.2, 0.25, 6, 24), M(0xd8c098, "stone"), 0, 0.08, 0, g).rotation.x = Math.PI / 2;
      for (var i = 0; i < l + 1; i++) { var a = i * 2.2, x = Math.cos(a) * 2.8, z = Math.sin(a) * 2.8; mesh(cyl(0.12, 0.18, 3.5 + i * 0.4, 7), M(0x8a6040, "wood"), x, 1.75 + i * 0.2, z, g); for (var k = 0; k < 6; k++) { var lf = mesh(box(1.8, 0.06, 0.45), M(c, "fabric"), x + Math.cos(k) * 0.7, 3.5 + i * 0.4, z + Math.sin(k) * 0.7, g); lf.rotation.y = -k; lf.rotation.z = -0.4; } }
      if (l >= 3) { mesh(box(1.2, 0.25, 0.5), M(0x8a6040, "wood"), 0, 0.3, 2.9, g); for (var j = 0; j < 5; j++) lightBulb(g, Math.cos(j * 1.25) * 2.5, 0.3, Math.sin(j * 1.25) * 2.5, 0xffb86a); }
    },
    temple: function (g, l, c) {
      for (var i = 0; i < l + 2; i++) mesh(box(5 - i * 1.0, 0.9, 4.4 - i * 0.9), M(0xd8b47a, "stone"), 0, 0.45 + i * 0.9, 0, g);
      var top = (l + 2) * 0.9;
      mesh(box(1.2, 1.3, 1.2), M(0xc8a068, "stone"), 0, top + 0.65, 0, g); mesh(box(0.6, 0.9, 0.1), M(0x2a1a10, "stone"), 0, top + 0.5, 0.6, g);
      if (l >= 2) mesh(sph(0.45, 14, 10), M(0xffc93a, "gold", { emissive: 0xffa020, ei: 0.4 }), 0, top + 1.8, 0, g);
      if (l >= 3) { [-2, 2].forEach(function (x) { mesh(cyl(0.2, 0.25, 2.6, 8), M(0xe8d0a0, "stone"), x, 1.3, 2.4, g); mesh(cone(0.25, 0.5, 6), M(0xff8a2a, "glass", { emissive: 0xff7a1a, ei: 1.5 }), x, 2.85, 2.4, g); }); }
    },
    rink: function (g, l, c) {
      mesh(cyl(3, 3, 0.15, 24), M(0xcfefff, "ice"), 0, 0.08, 0, g).scale.z = 0.7;
      for (var i = 0; i < 24; i++) { var a = i / 24 * Math.PI * 2; mesh(box(0.1, 0.6, 0.8), M(c, "paint"), Math.cos(a) * 3, 0.3, Math.sin(a) * 2.1, g).rotation.y = -a; }
      if (l >= 2) { mesh(box(1.4, 1.6, 1.0), M(0x9a6a42, "wood"), 3.6, 0.8, -1.2, g); mesh(roof(1.6, 0.6, 1.2), M(0xffffff, "stone"), 3.6, 1.6, -1.2, g); }
      if (l >= 3) { mesh(fir0(), M(0x1f5a3a, "fabric", { flat: true }), 0, 1.5, 0, g); for (var j = 0; j < 10; j++) lightBulb(g, Math.cos(j * 0.63) * 3.1, 0.75, Math.sin(j * 0.63) * 2.2, [0xff5a5a, 0x5aff8a, 0xffd25a, 0x5ab8ff][j % 4]); }
    },
    lift: function (g, l, c) {
      mesh(box(2.4, 2, 2), M(0x9a6a42, "wood"), 0, 1, 0, g); mesh(roof(2.8, 1, 2.4), M(0xffffff, "stone"), 0, 2, 0, g);
      mesh(box(0.35, 5 + l, 0.35), M(0x6a6a72, "metal"), 2.2, (5 + l) / 2, -1, g); mesh(box(2.4, 0.25, 0.25), M(0x6a6a72, "metal"), 2.2, 5 + l, -1, g);
      var cab = grp(g); cab.position.set(2.2, 3.6 + l, -0.2); mesh(box(0.9, 0.8, 0.9), M(c, "paint"), 0, 0, 0, cab); mesh(box(0.92, 0.3, 0.92), M(0x3a4a6a, "glass"), 0, 0.1, 0, cab); cab.userData.swing = true;
      if (l >= 3) { lightBulb(g, 0, 2.4, 1.1); flag(g, -1.4, 2, c); }
    },
    fir: function (g, l, c) { WG.fir(g, 0, 0, 1.2 + l * 0.6, true); if (l >= 2) mesh(sph(0.35, 10, 8), M(0xffd23a, "gold", { emissive: 0xffb020, ei: 0.8 }), 0, 4.3 + l * 2.3, 0, g); if (l >= 3) for (var i = 0; i < 14; i++) { var a = i * 1.1, r = 1.8 - i * 0.1; lightBulb(g, Math.cos(a) * r, 1 + i * 0.4, Math.sin(a) * r, [0xff5a5a, 0x5aff8a, 0xffd25a, 0x5ab8ff][i % 4]); } },
    dome: function (g, l, c, w, o) {
      mesh(cyl(2.2, 2.4, 1.6 + l * 0.4, 18), M((o && o.wall) || 0xe8e4dc, "stone"), 0, 0.8 + l * 0.2, 0, g);
      var d = mesh(new T.SphereGeometry(2.2, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), M(c, o && o.glass ? "glass" : "metal", o && o.glass ? { opacity: 0.45, emissive: c, ei: 0.2 } : null), 0, 1.6 + l * 0.4, 0, g);
      if (l >= 2) { var sl = mesh(box(0.5, 2.6, 0.2), M(0x2a2a30, "metal"), 0, 2.6 + l * 0.4, 1.6, g); sl.rotation.x = -0.6; mesh(cyl(0.25, 0.3, 2, 10), M(0x8a8a90, "metal"), 0, 3.4 + l * 0.4, 1.0, g).rotation.x = -0.9; }
      if (l >= 3) for (var i = 0; i < 8; i++) lightBulb(g, Math.cos(i * 0.78) * 2.3, 0.5, Math.sin(i * 0.78) * 2.3);
    },
    bridge: function (g, l, c) {
      [-2.6, 2.6].forEach(function (x) { mesh(cyl(0.2, 0.25, 3 + l * 0.5, 8), M(0x6a4a2a, "wood"), x, (3 + l * 0.5) / 2, -1, g); mesh(cyl(0.2, 0.25, 3 + l * 0.5, 8), M(0x6a4a2a, "wood"), x, (3 + l * 0.5) / 2, 1, g); });
      for (var i = 0; i < 11; i++) { var x = -2.5 + i * 0.5, y = 1.5 - Math.sin(i / 10 * Math.PI) * 0.5; mesh(box(0.45, 0.08, 2), M(0x8a6a44, "wood"), x, y, 0, g); }
      if (l >= 2) for (var k = 0; k < 2; k++) mesh(cyl(0.03, 0.03, 5.2, 4), M(0xc8a878, "fabric"), 0, 2.4, k ? 1 : -1, g).rotation.z = Math.PI / 2;
      if (l >= 3) { for (var j = 0; j < 6; j++) lightBulb(g, -2.5 + j, 2.5, 1, 0xffb86a); flag(g, 2.6, 3 + l * 0.5, c); }
    },
    treehouse: function (g, l, c) {
      mesh(cyl(0.6, 0.9, 6, 9), M(0x5a4430, "wood"), 0, 3, 0, g);
      for (var i = 0; i < 4; i++) mesh(sph(2.2, 9, 7), M(0x2f7a3a, "fabric", { flat: true }), Math.cos(i * 1.6) * 1.4, 6.5 + (i % 2) * 0.6, Math.sin(i * 1.6) * 1.4, g);
      mesh(box(2.6, 0.2, 2.6), M(0x8a6a44, "wood"), 0, 3.2, 0.6, g);
      if (l >= 1) { mesh(box(2.0, 1.5, 1.8), M(c, "wood"), 0, 4.0, 0.8, g); mesh(roof(2.4, 1, 2.2), M(0x6a4a2a, "wood"), 0, 4.75, 0.8, g); }
      if (l >= 2) { for (var k = 0; k < 8; k++) mesh(box(0.6, 0.06, 0.15), M(0x6a4a2a, "wood"), 1.5, 0.3 + k * 0.4, 1.6, g); }
      if (l >= 3) { for (var j = 0; j < 6; j++) lightBulb(g, Math.cos(j) * 1.6, 3.5, Math.sin(j) * 1.6 + 0.6, 0xffb86a); }
    },
    gate: function (g, l, c) {
      [-1.8, 1.8].forEach(function (x) { mesh(box(1, 3 + l, 1), M(0x8a9a7a, "stone"), x, (3 + l) / 2, 0, g); });
      mesh(box(4.8, 0.9, 1.2), M(0x7a8a6a, "stone"), 0, 3.4 + l, 0, g);
      if (l >= 2) { mesh(box(1.2, 1.2, 0.3), M(0x5a6a4a, "stone"), 0, 4.4 + l, 0, g); [-0.3, 0.3].forEach(function (x) { mesh(box(0.25, 0.2, 0.1), M(0x2affd0, "glass", { emissive: 0x2affd0, ei: 1.5 }), x, 4.6 + l, 0.16, g); }); }
      if (l >= 3) { [-1.8, 1.8].forEach(function (x) { mesh(cone(0.25, 0.5, 6), M(0xff8a2a, "glass", { emissive: 0xff7a1a, ei: 1.5 }), x, 3.35 + l, 0.6, g); }); mesh(box(4.8, 0.3, 1.3), M(0x3a8a3a, "fabric"), 0, 3.95 + l, 0, g); }
    },
    mill: function (g, l, c) {
      mesh(box(2.6, 2.4 + l * 0.6, 2.4), M(0xb89a6a, "stone"), 0, (2.4 + l * 0.6) / 2, 0, g); mesh(roof(3, 1.2, 2.8), M(c, "stone"), 0, 2.4 + l * 0.6, 0, g).rotation.y = Math.PI / 2;
      var wh = grp(g); wh.position.set(1.6, 1.5, 0); wh.userData.spinZ = 0.8;
      mesh(new T.TorusGeometry(1.3, 0.1, 6, 18), M(0x6a4a2a, "wood"), 0, 0, 0, wh).rotation.y = Math.PI / 2;
      for (var i = 0; i < 4 + l * 2; i++) { var p = mesh(box(0.1, 2.6, 0.35), M(0x7a5a3a, "wood"), 0, 0, 0, wh); p.rotation.x = i / (4 + l * 2) * Math.PI; }
      mesh(box(1.4, 0.1, 4), M(0x2a8ab8, "glass", { opacity: 0.8 }), 2.0, 0.1, 0, g);
      if (l >= 3) { lightBulb(g, -1.31, 1.6, 0.6); flag(g, -1, 3.6, c); }
    },
    totems: function (g, l, c) {
      for (var i = 0; i < l + 1; i++) { var x = (i - l / 2) * 1.6, h = 2 + i % 2; for (var k = 0; k < h; k++) { mesh(box(0.9, 0.95, 0.9), M([c, 0x8a6a44, 0x3a8a6a][k % 3], "wood"), x, 0.5 + k, 0, g); mesh(box(0.6, 0.2, 0.1), M(0x111111, "wood"), x, 0.6 + k, 0.46, g); } mesh(box(1.6, 0.15, 0.4), M(c, "wood"), x, 0.2 + h, 0, g); }
      if (l >= 3) for (var j = 0; j < 4; j++) lightBulb(g, -2.4 + j * 1.6, 0.4, 1.2, 0xffb86a);
    },
    boat: function (g, l, c) {
      [-1.2, 1.2].forEach(function (x) { mesh(box(0.3, 1.2, 0.3), M(0x6a4a2a, "wood"), x, 0.6, 0, g); });
      var h = mesh(box(1.8, 1.0, 4.5), M(c, "paint"), 0, 1.6, 0, g); mesh(cone(0.9, 1.4, 4), M(c, "paint"), 0, 1.6, 2.9, g).rotation.x = Math.PI / 2;
      if (l >= 2) { mesh(cyl(0.08, 0.08, 4, 6), M(0xdddddd, "metal"), 0, 4, 0, g); mesh(box(0.05, 2.4, 1.8), M(0xffffff, "fabric"), 0, 4, 0.9, g); }
      if (l >= 3) { mesh(box(1.4, 1, 1.6), M(0xffffff, "paint"), 0, 2.6, -1, g); flag(g, 0, 5.8, c); lightBulb(g, 0, 2.3, 2.3); }
    },
    wheel: function (g, l, c) {
      [-1, 1].forEach(function (k) { var s = mesh(box(0.25, 6, 0.25), M(0xdddddd, "metal"), k * 1.2, 2.8, 0, g); s.rotation.z = k * 0.3; });
      var wh = grp(g); wh.position.set(0, 5, 0); wh.userData.spinZ = 0.25;
      mesh(new T.TorusGeometry(3.2, 0.1, 6, 28), M(c, "paint"), 0, 0, 0, wh);
      var n = 6 + l * 2;
      for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2; var sp = mesh(box(0.06, 3.2, 0.06), M(0xdddddd, "metal"), Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0, wh); sp.rotation.z = a - Math.PI / 2; mesh(box(0.6, 0.55, 0.6), M([0xff5a5a, 0x5ab8ff, 0xffd25a, 0x5ac85a][i % 4], "paint"), Math.cos(a) * 3.2, Math.sin(a) * 3.2 - 0.4, 0.3, wh); if (l >= 3) lightBulb(wh, Math.cos(a) * 3.2, Math.sin(a) * 3.2, 0, c); }
    },
    crystals: function (g, l, c) {
      A.house(g, Math.max(1, l - 1), 0x5a3a2a, null, { wall: 0x6a5040, wood: true });
      for (var i = 0; i < 3 + l * 2; i++) { var k = mesh(cone(0.3, 1.2 + Math.random(), 5), M(c, "glass", { emissive: c, ei: 1.4, flat: true }), -2.3 + Math.random() * 4.6, 0.6, 2.2 + Math.random() * 0.6, g); k.rotation.z = Math.random() - 0.5; k.castShadow = false; }
    },
    frame: function (g, l, c) {
      var h = 5 + l * 1.5;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (p) { mesh(box(0.3, h, 0.3), M(0x7a7a82, "metal"), p[0], h / 2, p[1], g); });
      for (var y = 1.5; y < h; y += 1.5) mesh(box(2.3, 0.15, 2.3), M(0x6a6a72, "metal"), 0, y, 0, g);
      var cab = grp(g); cab.userData.lift = h - 1.5; mesh(box(1.4, 1.2, 1.4), M(c, "metal"), 0, 0.8, 0, cab);
      if (l >= 2) { var wh = mesh(new T.TorusGeometry(0.8, 0.12, 6, 14), M(0x5a3a22, "wood"), 0, h + 0.4, 0, g); }
      if (l >= 3) lightBulb(g, 0, h + 1, 0, 0xffb86a);
    },
    forge: function (g, l, c) {
      A.house(g, l, 0x3a2a22, null, { wall: 0x6a5a50 });
      mesh(box(0.9, 3 + l, 0.9), M(0x5a4a40, "stone"), -1.3, 2.5 + l * 0.6, -0.6, g);
      var fire = mesh(box(1.2, 0.8, 0.1), M(0xff7a1a, "glass", { emissive: 0xff6a1a, ei: 2.5 }), 0.9, 0.7, 1.52, g); fire.castShadow = false;
    },
    windmill: function (g, l, c) {
      mesh(cyl(0.9, 1.3, 5 + l, 8), M(0xf2e8d8, "stone"), 0, (5 + l) / 2, 0, g); mesh(cone(1.2, 1.6, 8), M(c, "paint"), 0, 5.8 + l, 0, g);
      var b = grp(g); b.position.set(0, 4.6 + l, 1.2); b.userData.spinZ = 0.7;
      for (var i = 0; i < 4; i++) { var p = grp(b); p.rotation.z = i * Math.PI / 2; mesh(box(0.5, 3.4, 0.06), M(0xffffff, "fabric"), 0, 1.8, 0, p); }
      if (l >= 3) { lightBulb(g, 0, 2, 1.1); flag(g, 0, 6.6 + l, c); }
    },
    airship: function (g, l, c) {
      [-1.6, 1.6].forEach(function (x) { mesh(box(0.3, 4, 0.3), M(0x8a6a44, "wood"), x, 2, 0, g); }); mesh(box(4, 0.3, 1.6), M(0x8a6a44, "wood"), 0, 4, 0, g);
      var sh = grp(g); sh.position.set(0, 6.2 + l * 0.3, 0); sh.userData.bob = true;
      mesh(sph(1.4 + l * 0.2, 16, 10), M(c, "fabric"), 0, 0, 0, sh).scale.set(1, 1, 2.2); mesh(box(0.8, 0.6, 1.4), M(0x6a4a2a, "wood"), 0, -1.6, 0, sh);
      if (l >= 3) lightBulb(sh, 0, -1.9, 0.8);
    },
    balloons: function (g, l, c) {
      mesh(box(1.2, 4 + l, 1.2), M(0xe8e0d0, "stone"), 0, (4 + l) / 2, 0, g);
      for (var i = 0; i < 2 + l * 2; i++) { var bl = mesh(sph(0.6, 12, 10), M([0xff5a5a, 0x5ab8ff, 0xffd25a, 0x5ac85a, 0xff8ad8][i % 5], "plastic"), Math.cos(i) * 1.6, 5 + l + (i % 3) * 0.8, Math.sin(i) * 1.6, g); bl.scale.y = 1.2; bl.userData.bob = true; }
    },
    rocket: function (g, l, c) {
      mesh(cyl(2.4, 2.6, 0.5, 16), M(0x6a6a72, "metal"), 0, 0.25, 0, g);
      var h = 3 + l * 1.4; mesh(cyl(0.7, 0.7, h, 14), M(0xf2f2f2, "paint"), 0, 0.5 + h / 2, 0, g); mesh(cone(0.7, 1.6, 14), M(c, "paint"), 0, 1.3 + h, 0, g);
      for (var i = 0; i < 3; i++) { var a = i * 2.1; var f = mesh(box(0.1, 1.4, 0.9), M(c, "paint"), Math.cos(a) * 0.8, 1.2, Math.sin(a) * 0.8, g); f.rotation.y = -a; }
      if (l >= 2) { mesh(box(0.4, h + 1, 0.4), M(0x8a8a90, "metal"), 1.7, (h + 1) / 2, 0, g); }
      if (l >= 3) for (var k = 0; k < 6; k++) lightBulb(g, Math.cos(k) * 2.4, 0.6, Math.sin(k) * 2.4, 0x3affd0);
    },
    dish: function (g, l, c) {
      mesh(cyl(0.2, 0.3, 3 + l, 8), M(0xdddddd, "metal"), 0, (3 + l) / 2, 0, g);
      var d = mesh(new T.SphereGeometry(1.4 + l * 0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3), M(0xf2f2f2, "metal", { side: true }), 0, 3 + l, 0.3, g); d.rotation.x = -0.9;
      mesh(sph(0.15, 8, 6), M(c, "glass", { emissive: c, ei: 2 }), 0, 3.6 + l, 1.1, g);
      if (l >= 3) for (var k = 0; k < 4; k++) lightBulb(g, Math.cos(k * 1.57) * 1, 0.3, Math.sin(k * 1.57) * 1, c);
    }
  };
  function fir0() { return cone(1.2, 2.4, 8); }

  /* какое здание в каком мире → архетип и параметры */
  var MAP = {
    town: [["fountain"], ["house"], ["house", { wall: 0xf8e8c0 }], ["tower", { clock: true }], ["carousel"]],
    dunes: [["well"], ["tents"], ["oasis"], ["temple"], ["tower", { wall: 0xe0c08a, lamp: true }]],
    snow: [["rink"], ["house", { wood: true, wall: 0x9a6a42 }], ["lift"], ["fir"], ["dome", { wall: 0xf4f8ff }]],
    jungle: [["bridge"], ["treehouse"], ["gate"], ["mill"], ["totems"]],
    harbor: [["tower", { stripes: true, lamp: true, wall: 0xffffff }], ["tents"], ["boat"], ["wheel"], ["house", { wall: 0xe8eef4 }]],
    mine: [["crystals"], ["frame"], ["forge"], ["house", { wall: 0x7a6a5a, wood: true }], ["dome", { wall: 0x5a4a40 }]],
    sky: [["windmill"], ["airship"], ["oasis"], ["tower", { wall: 0xf8f0e0 }], ["balloons"]],
    moon: [["dome", { glass: true, wall: 0xe8e8ec }], ["rocket"], ["carousel"], ["dish"], ["dome", { wall: 0xd8dce4 }]]
  };
  function building(worldId, idx, lvl, color) {
    var g = new T.Group(), m = (MAP[worldId] || MAP.town)[idx];
    if (lvl <= 0) {   // фундамент, леса, табличка
      mesh(cyl(2.6, 2.8, 0.25, 6), M(0xb8b0a4, "stone"), 0, 0.12, 0, g);
      for (var i = 0; i < 4; i++) { var a = i / 4 * Math.PI * 2 + 0.78; mesh(box(0.12, 2.4, 0.12), M(0xc8a060, "wood"), Math.cos(a) * 1.6, 1.2, Math.sin(a) * 1.6, g); }
      mesh(box(3.2, 0.12, 0.12), M(0xc8a060, "wood"), 0, 2.3, 1.13, g); mesh(box(3.2, 0.12, 0.12), M(0xc8a060, "wood"), 0, 2.3, -1.13, g);
      var sign = mesh(box(1.4, 0.8, 0.08), M(0xffc61a, "paint"), 0, 1.0, 2.0, g); mesh(box(0.08, 1.0, 0.08), M(0x6a4a2a, "wood"), 0, 0.5, 1.96, g);
      mesh(box(0.25, 0.5, 0.1), M(0x222222, "paint"), 0, 1.05, 2.05, g); mesh(box(0.5, 0.25, 0.1), M(0x222222, "paint"), 0, 1.05, 2.05, g);   // «+»
      for (var k = 0; k < 3; k++) mesh(box(0.8, 0.3, 0.5), M(0xb87a4a, "stone"), -1.4 + k * 0.4, 0.3 + k * 0.05, -1.6 + k * 0.2, g);
    } else A[m[0]](g, lvl, color, worldId, m[1]);
    return g;
  }

  /* ---------- Площадь целиком ---------- */
  var root = null, slots = [], CENTER = new T.Vector3(0, 0, -420), anims = [];
  function slotPos(i) { var a = -1.0 + i * 0.5; return new T.Vector3(CENTER.x + Math.sin(a) * 12, 0, CENTER.z - Math.cos(a) * 12 + 6); }
  function paving(worldId) {
    var cols = { town: 0x9a8e82, dunes: 0xc8a068, snow: 0xe8f0f8, jungle: 0x7a8a6a, harbor: 0x8a6a4a, mine: 0x4a3a30, sky: 0xd8d0c4, moon: 0x7a7e86 }, c = cols[worldId] || 0x9a8e82;
    return G.groundTex("pave:" + worldId, c, function (g, s) { for (var r = 8; r < s; r += 18) { g.strokeStyle = "rgba(0,0,0,.18)"; g.lineWidth = 2; g.beginPath(); g.arc(s / 2, s / 2, r, 0, 7); g.stroke(); } for (var a = 0; a < 48; a++) { var ca = Math.cos(a / 48 * 6.283), sa = Math.sin(a / 48 * 6.283); g.beginPath(); g.moveTo(s / 2 + ca * 40, s / 2 + sa * 40); g.lineTo(s / 2 + ca * s, s / 2 + sa * s); g.stroke(); } G.noise(g, s, s, 800, 0.08, 3); });
  }
  function build(scene, worldId, levels, colors) {
    if (root) scene.remove(root);
    root = new T.Group(); slots = []; anims = [];
    var wd = WG.W[worldId] || WG.W.town;
    var gt = G.groundTex("ground:" + worldId, wd.ground, wd.groundPaint).clone(); gt.needsUpdate = true; gt.repeat.set(16, 16);
    var gr = new T.Mesh(new T.CircleGeometry(90, 40), new T.MeshStandardMaterial({ map: gt, roughness: 0.95 })); gr.rotation.x = -Math.PI / 2; gr.position.copy(CENTER); gr.position.y = -0.02; gr.receiveShadow = true; root.add(gr);
    var pt = paving(worldId).clone(); pt.needsUpdate = true; pt.repeat.set(1, 1);
    var pv = new T.Mesh(new T.CircleGeometry(19, 48), new T.MeshStandardMaterial({ map: pt, roughness: 0.85 })); pv.rotation.x = -Math.PI / 2; pv.position.set(CENTER.x, 0.01, CENTER.z); pv.receiveShadow = true; root.add(pv);
    // кольцо фонарей/деталей мира и окружение
    for (var i = 0; i < 10; i++) { var a = i / 10 * Math.PI * 2, n = G.merge(wd.near(1)); n.position.set(CENTER.x + Math.cos(a) * 19.5, 0, CENTER.z + Math.sin(a) * 19.5); n.rotation.y = -a; n.traverse(function (o) { o.castShadow = false; }); root.add(n); }
    for (var j = 0; j < 22; j++) { var b = j / 22 * Math.PI * 2, p = G.merge(wd.props(1)); var r = 28 + Math.random() * 18; p.position.set(CENTER.x + Math.cos(b) * r, p.position.y, CENTER.z + Math.sin(b) * r); p.rotation.y = -b + Math.PI / 2; p.traverse(function (o) { o.castShadow = false; }); root.add(p); }
    for (var k = 0; k < 5; k++) {
      var s = grp(root); s.position.copy(slotPos(k)); s.lookAt(CENTER.x, 0, CENTER.z + 14);
      var bld = building(worldId, k, levels[k] || 0, colors[k]); s.add(bld);
      slots.push({ g: s, b: bld, lvl: levels[k] || 0 });
    }
    scene.add(root);
    return root;
  }
  /* постройка: старое здание уходит, новое вырастает с пылью */
  function upgrade(worldId, idx, lvl, color) {
    var s = slots[idx]; if (!s) return;
    var old = s.b; s.g.remove(old);
    var nb = building(worldId, idx, lvl, color); nb.scale.set(1, 0.01, 1); s.g.add(nb); s.b = nb; s.lvl = lvl;
    anims.push({ g: nb, t: 0, dur: 1.1, kind: "grow" });
    return s.g.position.clone();
  }
  function easeOutBack(x) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function tick(dt, t) {
    if (!root) return;
    anims = anims.filter(function (a) { a.t += dt; var k = Math.min(1, a.t / a.dur); a.g.scale.set(1 + Math.sin(k * Math.PI) * 0.06, Math.max(0.01, easeOutBack(k)), 1 + Math.sin(k * Math.PI) * 0.06); return k < 1; });
    root.traverse(function (o) {
      var u = o.userData; if (!u) return;
      if (u.spin) o.rotation.y += dt * u.spin;
      if (u.spinZ) o.rotation.z += dt * u.spinZ;
      if (u.bob) o.position.y += Math.sin(t * 1.5 + o.id) * 0.004;
      if (u.swing) o.rotation.z = Math.sin(t * 1.2) * 0.08;
      if (u.flag) o.rotation.y = Math.sin(t * 3 + o.id) * 0.25;
      if (u.lift != null) o.position.y = (Math.sin(t * 0.6) * 0.5 + 0.5) * u.lift;
      if (u.clock) o.rotation.z = -t * 0.5;
    });
  }
  function remove(scene) { if (root) scene.remove(root); root = null; slots = []; }
  return { build: build, upgrade: upgrade, tick: tick, remove: remove, slotPos: slotPos, CENTER: CENTER, active: function () { return !!root; }, building: building, MAP: MAP };
})();
