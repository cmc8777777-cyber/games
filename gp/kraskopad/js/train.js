/* Краскопад · поезд на карте «Каньон» (Э16): локомотив и три вагона идут по кольцевой дороге без остановки.
   Поезд — подвижное препятствие: бойцов и транспорт отталкивает в сторону (без урона), пули о вагоны разбиваются (через коллизии AABB на каждом шаге). */
window.KP = window.KP || {};
(function (KP) {
  "use strict";
  var G = KP.G, W3 = KP.world, SPEED = 11, CARS = 4, GAP = 9.5;
  var T = null;
  function geoCar(kind) {
    var m = new KP.Merger(2), B = new THREE.BoxGeometry(1, 1, 1);
    if (kind === "loco") {
      m.add(B, 0, 1.9, 0, 0, 0, 0, 2.8, 2.6, 8.2, "#7a2a22"); m.add(B, 0, 3.6, -2.6, 0, 0, 0, 2.9, 1.6, 3, "#2a2d31");
      m.add(new THREE.CylinderGeometry(0.4, 0.5, 1.4, 10), 0, 3.8, 2.6, 0, 0, 0, 1, 1, 1, "#1b1d20"); m.add(B, 0, 2, 4.15, 0, 0, 0, 2.6, 1.6, 0.2, "#c9a13a");
      m.add(B, 0, 3.6, -1.1, 0, 0, 0, 2.95, 0.7, 0.05, "#9fd8ff");
    } else {
      m.add(B, 0, 2.1, 0, 0, 0, 0, 2.8, 2.8, 8.2, kind === "tank" ? "#c9cdd2" : "#8a6a4c"); m.add(B, 0, 3.6, 0, 0, 0, 0, 3, 0.2, 8.4, "#3a3f46");
      if (kind === "tank") m.add(new THREE.CylinderGeometry(1.4, 1.4, 7.6, 14), 0, 2.4, 0, Math.PI / 2, 0, 0, 1, 1, 1, "#d8dcdf");
    }
    m.add(B, 0, 0.55, 0, 0, 0, 0, 2.4, 0.5, 7.4, "#1b1d20");
    [-2.8, 2.8].forEach(function (z) { [-1.15, 1.15].forEach(function (x) { m.add(new THREE.CylinderGeometry(0.45, 0.45, 0.25, 12), x, 0.45, z, 0, 0, Math.PI / 2, 1, 1, 1, "#2a2e33"); }); });
    return m.build();
  }
  function railLen(R) { var L = 0, seg = []; for (var k = 0; k < R.pts.length; k++) { var a = R.pts[k], b = R.pts[(k + 1) % R.pts.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push(l); L += l; } return { L: L, seg: seg }; }
  function at(s) {   // точка и направление на пути по длине дуги
    var R = W3.RAIL; s = ((s % T.L) + T.L) % T.L;
    for (var k = 0; k < T.seg.length; k++) {
      if (s <= T.seg[k]) { var a = R.pts[k], b = R.pts[(k + 1) % R.pts.length], t = s / T.seg[k], h = R.h[k] + (R.h[(k + 1) % R.h.length] - R.h[k]) * t; return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, y: h + 0.2, yaw: Math.atan2(b[0] - a[0], b[1] - a[1]) }; }
      s -= T.seg[k];
    }
    return { x: 0, z: 0, y: 0, yaw: 0 };
  }
  KP.trainSetup = function (root) {
    T = null; if (!W3.RAIL) return;
    var rl = railLen(W3.RAIL); T = { L: rl.L, seg: rl.seg, s: 0, cars: [] };
    for (var i = 0; i < CARS; i++) {
      var kind = i === 0 ? "loco" : i === 2 ? "tank" : "box", c = { kind: kind, x: 0, z: 0, y: 0, yaw: 0, col: { x0: 0, x1: 0, z0: 0, z1: 0, y0: 0, y1: 0, kind: "house" } };
      if (root && !G.headless) { c.mesh = new THREE.Mesh(geoCar(kind), new THREE.MeshLambertMaterial({ vertexColors: true, map: KP.tex().wall })); c.mesh.castShadow = true; root.add(c.mesh); }
      T.cars.push(c);
    }
    place();
  };
  function place() {
    T.cars.forEach(function (c, i) {
      var p = at(T.s - i * GAP); c.x = p.x; c.z = p.z; c.y = p.y; c.yaw = p.yaw;
      // коллизия вагона: описанный прямоугольник (обновляем в сетке)
      if (c.col.alive) W3.removeCol(c.col);
      var hw = Math.abs(Math.sin(p.yaw)) * 4.1 + Math.abs(Math.cos(p.yaw)) * 1.4, hd = Math.abs(Math.cos(p.yaw)) * 4.1 + Math.abs(Math.sin(p.yaw)) * 1.4;
      c.col.x0 = p.x - hw; c.col.x1 = p.x + hw; c.col.z0 = p.z - hd; c.col.z1 = p.z + hd; c.col.y0 = p.y - 0.5; c.col.y1 = p.y + 3.7;
      W3.addCol(c.col);
    });
  }
  /* шаг поезда (в матче) и отталкивание тех, кого «задел» вагон */
  KP.trainStep = function (dt) {
    if (!T) return;
    T.s += SPEED * dt; place();
    T.cars.forEach(function (c) {
      var fx = Math.sin(c.yaw), fz = Math.cos(c.yaw);
      (G.chars || []).concat(G.vehicles || []).forEach(function (o) {
        if (o.alive === false || o.state === "plane" || o.state === "out" || o.driver) return;
        var dx = o.x - c.x, dz = o.z - c.z, along = dx * fx + dz * fz, side = -dx * fz + dz * fx;
        if (Math.abs(along) < 4.4 && Math.abs(side) < 1.9 && o.y < c.y + 3.6) { var sg = side >= 0 ? 1 : -1; o.x += -fz * sg * (1.9 - Math.abs(side) + 0.2); o.z += fx * sg * (1.9 - Math.abs(side) + 0.2); }
      });
    });
  };
  KP.trainRender = function (dt, menu) {
    if (!T) return;
    if (menu) { T.s += SPEED * dt; place(); }
    T.cars.forEach(function (c) { if (c.mesh) { c.mesh.position.set(c.x, c.y, c.z); c.mesh.rotation.y = c.yaw; } });
  };
  KP.trainPos = function () { return T ? T.cars.map(function (c) { return { x: c.x, z: c.z }; }) : []; };
})(window.KP);
