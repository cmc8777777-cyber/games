/* Держи Шмыга! · питомцы-помощники: данные, 3D-модели и анимация. Способности работают в engine.js (petTick).
   Один питомец с собой; уровни 1–5 улучшаются за монеты. */
window.PETS = (function () {
  "use strict";
  var T = window.THREE, G = window.GFX, MD = window.MODELS;
  var M = G.mat, geo = MD.geo;
  function mesh(g, m, x, y, z, p, sx, sy, sz) { var o = new T.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); if (sx) o.scale.set(sx, sy || sx, sz || sx); o.castShadow = true; if (p) p.add(o); return o; }
  function sph(r, a, b) { return geo.sph(r, a || 12, b || 10); }
  function box(w, h, d) { return geo.box(w, h, d); }
  function cyl(a, b, h, s) { return geo.cyl(a, b, h, s || 10); }
  function cone(r, h, s) { return geo.cone(r, h, s || 8); }
  function eyes(g, y, z, sp, r, col) { [-1, 1].forEach(function (k) { mesh(sph(r, 10, 8), M(col || 0x111111, "glass"), k * sp, y, z, g); mesh(sph(r * 0.35, 6, 4), G.basic(0xffffff), k * sp + r * 0.3, y + r * 0.3, z + r * 0.75, g); }); }

  /* lvl — 1..5. v(lvl) — сила способности для подписи и движка */
  var LIST = [
    { id: "cat", name: { ru: "Котёнок Искра", en: "Spark the Kitten" }, get: { t: "coins", n: 4000 },
      v: function (l) { return 3 + l; }, fly: false, color: 0xff9a3a },
    { id: "owl", name: { ru: "Сова Ночка", en: "Nightly the Owl" }, get: { t: "coins", n: 7000 },
      v: function (l) { return 30 + l * 10; }, fly: true, color: 0x8a6a4a },
    { id: "turtle", name: { ru: "Черепаха Броня", en: "Armor the Turtle" }, get: { t: "coins", n: 11000 },
      v: function (l) { return 2500 - l * 250; }, fly: true, color: 0x4aa86a },
    { id: "fox", name: { ru: "Лис Хитрик", en: "Trick the Fox" }, get: { t: "coins", n: 15000 },
      v: function (l) { return 10 + l * 5; }, fly: false, color: 0xe2602a },
    { id: "bee", name: { ru: "Пчела Медок", en: "Honey the Bee" }, get: { t: "task", stat: "boostsAll", n: 60 },
      v: function (l) { return l; }, fly: true, color: 0xffc21a },
    { id: "parrot", name: { ru: "Попугай Жако", en: "Jacko the Parrot" }, get: { t: "days", n: 10 },
      v: function (l) { return 10 + l * 6; }, fly: true, color: 0x2ab84a },
    { id: "dragon", name: { ru: "Дракончик Уголёк", en: "Ember the Dragonling" }, get: { t: "task", stat: "caught", n: 15 },
      v: function (l) { return 26 - l * 2; }, fly: true, color: 0xd8402a },
    { id: "robodog", name: { ru: "Робопёс Болт", en: "Bolt the Robodog" }, get: { t: "boss", w: "jungle" },
      v: function (l) { return 5 + l * 5; }, fly: false, color: 0x9aa8b8 }
  ];
  var UPGRADE = [0, 1200, 3000, 6000, 11000];   // цена перехода на уровень 2..5

  function build(id) {
    var g = new T.Group(), b = new T.Group(); g.add(b); var parts = { b: b };
    if (id === "cat") {
      var fur = M(0xff9a3a, "fur");
      mesh(sph(0.2), fur, 0, 0.32, 0, b, 1, 0.85, 1.4); mesh(sph(0.15), fur, 0, 0.48, 0.24, b);
      [-1, 1].forEach(function (k) { mesh(cone(0.05, 0.1, 4), fur, k * 0.08, 0.62, 0.24, b); });
      eyes(b, 0.5, 0.36, 0.055, 0.03, 0x2a8a3a); mesh(sph(0.02, 6, 4), M(0xff7a9a, "skin"), 0, 0.46, 0.39, b);
      var tail = new T.Group(); tail.position.set(0, 0.38, -0.26); b.add(tail); mesh(cyl(0.035, 0.025, 0.36, 6), fur, 0, 0.16, -0.06, tail).rotation.x = -0.5; parts.tail = tail;
      parts.legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(function (p) { var l = new T.Group(); l.position.set(p[0] * 0.09, 0.22, p[1] * 0.14); mesh(cyl(0.035, 0.03, 0.2, 6), fur, 0, -0.1, 0, l); b.add(l); return l; });
      for (var i = 0; i < 3; i++) mesh(box(0.02, 0.1, 0.01), M(0xc8602a, "fur"), 0, 0.42, -0.05 - i * 0.1, b).rotation.z = 0;
    } else if (id === "owl") {
      var f = M(0x8a6a4a, "fur"), c = M(0xe8d8b8, "fur");
      mesh(sph(0.2), f, 0, 0.3, 0, b, 1, 1.15, 0.95); mesh(sph(0.14), c, 0, 0.27, 0.1, b, 1, 1.1, 0.6);
      [-1, 1].forEach(function (k) { mesh(sph(0.07), M(0xffffff, "fur"), k * 0.08, 0.42, 0.15, b, 1, 1, 0.5); mesh(cone(0.04, 0.1, 4), f, k * 0.12, 0.54, 0.02, b); });
      eyes(b, 0.42, 0.19, 0.08, 0.04, 0xffb21a); mesh(cone(0.025, 0.06, 4), M(0x5a4a2a, "plastic"), 0, 0.36, 0.2, b).rotation.x = Math.PI;
      parts.wings = [-1, 1].map(function (k) { var w = new T.Group(); w.position.set(k * 0.18, 0.34, 0); mesh(box(0.28, 0.03, 0.18), f, k * 0.14, 0, 0, w); b.add(w); return w; });
    } else if (id === "turtle") {
      var sh = M(0x3a8a4a, "plastic"), sk = M(0x9ad87a, "skin");
      mesh(sph(0.24, 12, 8), sh, 0, 0.3, 0, b, 1, 0.6, 1.15); mesh(cyl(0.26, 0.26, 0.04, 14), M(0xc8a85a, "plastic"), 0, 0.22, 0, b).scale.z = 1.15;
      for (var j = 0; j < 5; j++) mesh(sph(0.07, 6, 4), M(0x2a6a3a, "plastic"), Math.cos(j * 1.26) * 0.13, 0.42, Math.sin(j * 1.26) * 0.15, b, 1, 0.4, 1);
      mesh(sph(0.09), sk, 0, 0.3, 0.32, b); eyes(b, 0.34, 0.39, 0.045, 0.022);
      parts.legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(function (p) { var l = new T.Group(); l.position.set(p[0] * 0.2, 0.22, p[1] * 0.18); mesh(sph(0.06, 8, 6), sk, 0, 0, 0, l, 1, 0.6, 1.2); b.add(l); return l; });
      mesh(new T.TorusGeometry(0.3, 0.025, 6, 20), M(0x7ad8ff, "glass", { emissive: 0x3a9aff, ei: 1.2 }), 0, 0.12, 0, b).rotation.x = Math.PI / 2;   // парит на кольце
    } else if (id === "fox") {
      var fx = M(0xe2602a, "fur"), wh = M(0xf4ece0, "fur");
      mesh(sph(0.19), fx, 0, 0.32, 0, b, 1, 0.85, 1.5); mesh(sph(0.14), fx, 0, 0.47, 0.27, b); mesh(cone(0.07, 0.16, 6), wh, 0, 0.44, 0.42, b).rotation.x = Math.PI / 2;
      mesh(sph(0.018, 6, 4), M(0x111111, "plastic"), 0, 0.44, 0.5, b);
      [-1, 1].forEach(function (k) { mesh(cone(0.055, 0.14, 4), fx, k * 0.08, 0.62, 0.24, b); });
      eyes(b, 0.5, 0.37, 0.055, 0.026, 0x8a5a1a);
      var tl = new T.Group(); tl.position.set(0, 0.36, -0.28); b.add(tl); mesh(sph(0.09), fx, 0, 0.02, -0.16, tl, 1, 1, 2.2); mesh(sph(0.06), wh, 0, 0.02, -0.34, tl); parts.tail = tl;
      parts.legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(function (p) { var l = new T.Group(); l.position.set(p[0] * 0.08, 0.22, p[1] * 0.15); mesh(cyl(0.03, 0.025, 0.22, 6), M(0x3a2a1a, "fur"), 0, -0.11, 0, l); b.add(l); return l; });
    } else if (id === "bee") {
      mesh(sph(0.14), M(0xffc21a, "fur"), 0, 0.3, 0, b, 1, 0.95, 1.35);
      for (var s = 0; s < 3; s++) mesh(cyl(0.135, 0.135, 0.04, 12), M(0x1a1a1a, "fur"), 0, 0.3, -0.05 - s * 0.07, b).rotation.x = Math.PI / 2;
      mesh(sph(0.1), M(0x1a1a1a, "fur"), 0, 0.32, 0.2, b); eyes(b, 0.35, 0.28, 0.05, 0.03);
      [-1, 1].forEach(function (k) { mesh(cyl(0.006, 0.006, 0.12, 4), M(0x111111, "plastic"), k * 0.04, 0.45, 0.24, b).rotation.z = -k * 0.4; });
      parts.wings = [-1, 1].map(function (k) { var w = new T.Group(); w.position.set(k * 0.06, 0.42, 0.02); mesh(sph(0.12, 8, 6), M(0xddeeff, "glass", { opacity: 0.45 }), k * 0.1, 0.04, 0, w, 1, 0.2, 0.6); b.add(w); return w; });
    } else if (id === "parrot") {
      var gr = M(0x2ab84a, "fur");
      mesh(sph(0.15), gr, 0, 0.32, 0, b, 1, 1.2, 1); mesh(sph(0.11), M(0xff4a3a, "fur"), 0, 0.5, 0.06, b);
      mesh(cone(0.035, 0.08, 6), M(0xf2e2a8, "plastic"), 0, 0.47, 0.17, b).rotation.x = Math.PI / 2 + 0.6; eyes(b, 0.53, 0.13, 0.05, 0.02);
      mesh(box(0.07, 0.3, 0.03), M(0x2a6ad8, "fur"), 0, 0.12, -0.12, b).rotation.x = 0.4;
      parts.wings = [-1, 1].map(function (k) { var w = new T.Group(); w.position.set(k * 0.13, 0.36, 0); mesh(box(0.3, 0.025, 0.14), M(k > 0 ? 0x2a6ad8 : 0xffc21a, "fur"), k * 0.15, 0, 0, w); b.add(w); return w; });
    } else if (id === "dragon") {
      var rd = M(0xd8402a, "plastic");
      mesh(sph(0.17), rd, 0, 0.32, 0, b, 1, 0.9, 1.35); mesh(sph(0.13), rd, 0, 0.47, 0.22, b); mesh(sph(0.07), M(0xf2b04a, "plastic"), 0, 0.42, 0.33, b, 1, 0.8, 1);
      [-1, 1].forEach(function (k) { mesh(cone(0.03, 0.12, 5), M(0xf2e2a8, "plastic"), k * 0.07, 0.6, 0.2, b).rotation.x = -0.4; });
      eyes(b, 0.51, 0.32, 0.06, 0.028, 0xffd21a);
      for (var d2 = 0; d2 < 4; d2++) mesh(cone(0.03, 0.08, 4), M(0xf2b04a, "plastic"), 0, 0.46 - d2 * 0.02, 0.1 - d2 * 0.12, b);
      parts.wings = [-1, 1].map(function (k) { var w = new T.Group(); w.position.set(k * 0.14, 0.4, -0.02); var m = mesh(cone(0.2, 0.36, 3), M(0x8a1a1a, "plastic", { side: true }), k * 0.18, 0, 0, w); m.rotation.z = k * 1.4; m.scale.z = 0.15; b.add(w); return w; });
      var tl2 = new T.Group(); tl2.position.set(0, 0.3, -0.22); b.add(tl2); mesh(cone(0.06, 0.3, 6), rd, 0, 0, -0.12, tl2).rotation.x = -Math.PI / 2; parts.tail = tl2;
    } else if (id === "robodog") {
      var mt = M(0xb8c4d0, "metal"), dk = M(0x3a4450, "metal");
      mesh(box(0.22, 0.16, 0.42), mt, 0, 0.34, 0, b); mesh(box(0.18, 0.15, 0.18), mt, 0, 0.47, 0.24, b); mesh(box(0.1, 0.07, 0.1), dk, 0, 0.44, 0.36, b);
      mesh(box(0.16, 0.035, 0.02), M(0x3affff, "glass", { emissive: 0x3affff, ei: 2 }), 0, 0.5, 0.335, b);
      [-1, 1].forEach(function (k) { mesh(box(0.03, 0.1, 0.06), dk, k * 0.08, 0.58, 0.2, b); });
      var at = mesh(cyl(0.008, 0.008, 0.18, 4), dk, 0.05, 0.6, 0.15, b); mesh(sph(0.025, 6, 4), M(0xff3a3a, "glass", { emissive: 0xff3a3a, ei: 2 }), 0.05, 0.7, 0.15, b);
      var tl3 = new T.Group(); tl3.position.set(0, 0.4, -0.22); b.add(tl3); mesh(cyl(0.015, 0.015, 0.16, 4), dk, 0, 0.06, -0.04, tl3).rotation.x = -0.6; parts.tail = tl3;
      parts.legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(function (p) { var l = new T.Group(); l.position.set(p[0] * 0.09, 0.27, p[1] * 0.15); mesh(box(0.05, 0.24, 0.05), dk, 0, -0.12, 0, l); b.add(l); return l; });
    }
    g.userData.parts = parts;
    return g;
  }
  /* анимация: бег или полёт рядом с героиней */
  function animate(g, t, running, fly) {
    var p = g.userData.parts, s = Math.sin(t * (running ? 16 : 3));
    if (p.legs) p.legs.forEach(function (l, i) { l.rotation.x = running ? (i % 2 ? s : -s) * 0.8 : 0; });
    if (p.wings) p.wings.forEach(function (w, i) { w.rotation.z = (i ? 1 : -1) * Math.sin(t * (fly ? 22 : 4)) * 0.6; });
    if (p.tail) p.tail.rotation.y = Math.sin(t * 6) * 0.5;
    p.b.position.y = fly ? 0.6 + Math.sin(t * 3) * 0.12 : (running ? Math.abs(s) * 0.05 : 0);
  }
  return { LIST: LIST, UPGRADE: UPGRADE, build: build, animate: animate, byId: function (id) { return LIST.filter(function (x) { return x.id === id; })[0] || null; } };
})();
