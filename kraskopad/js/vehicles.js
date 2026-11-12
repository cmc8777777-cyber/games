/* Краскопад · транспорт: квадроциклы. Стоят у дорог в локациях, в любой можно сесть (E / «Взять»).
   Управление: вперёд/назад — газ и тормоз, влево/вправо — руль. Пока за рулём, стрелять нельзя. Боты квадроциклами не пользуются. */
window.KP = window.KP || {};
(function (KP) {
  "use strict";
  var G = KP.G, W3 = KP.world;
  var SPOTS = [[-118, 34], [-128, 2], [18, 22], [-14, -16], [70, 70], [-108, -36], [10, -132], [-60, 84], [22, 74], [-20, 120], [120, 10]];
  var quadGeo = null;
  function geo() {
    if (quadGeo) return quadGeo;
    var m = new KP.Merger(2), B = new THREE.BoxGeometry(1, 1, 1);
    m.add(B, 0, 0.62, 0, 0, 0, 0, 1.0, 0.35, 1.7, "#3c4a35");
    m.add(B, 0, 0.82, -0.15, 0, 0, 0, 0.55, 0.18, 0.75, "#1f2226");
    m.add(B, 0, 0.78, 0.72, 0, 0, 0, 1.08, 0.12, 0.45, "#ff8a1f"); m.add(B, 0, 0.78, -0.82, 0, 0, 0, 1.08, 0.12, 0.4, "#ff8a1f");
    m.add(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), 0, 1.0, 0.55, 0.35, 0, 0, 1, 1, 1, "#2a2e33");
    m.add(B, 0, 1.22, 0.62, 0, 0, 0, 0.7, 0.05, 0.05, "#2a2e33");
    m.add(B, 0, 0.68, 0.88, 0, 0, 0, 0.3, 0.12, 0.06, "#fff5c8");
    [[-0.55, 0.6], [0.55, 0.6], [-0.55, -0.6], [0.55, -0.6]].forEach(function (w) { m.add(new THREE.CylinderGeometry(0.33, 0.33, 0.28, 12), w[0], 0.33, w[1], 0, 0, Math.PI / 2, 1, 1, 1, "#1b1d20"); m.add(new THREE.CylinderGeometry(0.17, 0.17, 0.29, 8), w[0], 0.33, w[1], 0, 0, Math.PI / 2, 1, 1, 1, "#8a9098"); });
    quadGeo = m.build(); return quadGeo;
  }
  KP.spawnVehicles = function () {
    (G.vehicles || []).forEach(function (v) { if (v.mesh) G.scene.remove(v.mesh); });
    G.vehicles = [];
    SPOTS.forEach(function (s, i) {
      var h = W3.height(s[0], s[1]); if (h < 0.5) return;
      var v = { x: s[0], z: s[1], y: h, yaw: i * 1.3, speed: 0, rad: 1.0, vy: 0, mvx: 0, mvz: 0, walk: 0, onGround: true, driver: null };
      if (!G.headless) { v.mesh = new THREE.Mesh(geo(), new THREE.MeshLambertMaterial({ vertexColors: true, map: KP.tex().wall })); v.mesh.castShadow = true; G.scene.add(v.mesh); }
      G.vehicles.push(v);
    });
  };
  KP.nearVehicle = function (ch, r) { var best = null, bd = r; (G.vehicles || []).forEach(function (v) { if (v.driver) return; var d = Math.hypot(v.x - ch.x, v.z - ch.z); if (d < bd) { bd = d; best = v; } }); return best; };
  KP.enterVehicle = function (ch, v) { v.driver = ch; ch.veh = v; ch.state = "drive"; ch.reloadT = 0; ch.healT = 0; KP.sfx && KP.sfx("engine", v.x, v.z, true); };
  KP.exitVehicle = function (ch) {
    var v = ch.veh; if (!v) return;
    v.driver = null; ch.veh = null; ch.state = "ground";
    ch.x = v.x + Math.cos(v.yaw) * 1.4; ch.z = v.z - Math.sin(v.yaw) * 1.4; ch.y = W3.height(ch.x, ch.z) + 0.2; ch.vy = 0;
    v.speed *= 0.3;
  };
  /* шаг квадроцикла: thr — газ (-1..1), steer — руль (-1..1) */
  KP.driveVehicle = function (v, thr, steer, dt) {
    var max = 19, acc = thr > 0 ? 11 : 16;
    if (thr) v.speed += thr * acc * dt; else v.speed *= Math.max(0, 1 - dt * 1.6);
    v.speed = Math.max(-6, Math.min(max, v.speed));
    var h0 = W3.height(v.x, v.z);
    if (h0 < -0.4) v.speed *= Math.max(0, 1 - dt * 3);   // в воде глохнет
    v.yaw += steer * dt * 2.2 * Math.min(1, Math.abs(v.speed) / 6) * (v.speed < 0 ? -1 : 1);
    v.mvx = Math.sin(v.yaw) * v.speed; v.mvz = Math.cos(v.yaw) * v.speed;
    var ox = v.x, oz = v.z;
    KP.moveChar(v, dt);
    if (v.driver) v.driver.driven = (v.driver.driven || 0) + Math.hypot(v.x - ox, v.z - oz);
    if (v.blocked) { var real = Math.hypot(v.x - ox, v.z - oz) / dt; if (real < Math.abs(v.speed) * 0.5) v.speed *= 0.4; }
    // толкает бойцов
    G.chars.forEach(function (c) {
      if (!c.alive || c === v.driver || c.state !== "ground") return;
      var dx = c.x - v.x, dz = c.z - v.z, d = Math.hypot(dx, dz);
      if (d < 1.5 && d > 0.01) { c.x = v.x + dx / d * 1.5; c.z = v.z + dz / d * 1.5; if (v.driver && Math.abs(v.speed) > 9 && KP.enemy(v.driver, c)) { KP.damage(c, 20, v.driver, "ram"); v.speed *= 0.5; } }
    });
  };
  /* остальные бойцы не проходят сквозь стоящие квадроциклы */
  KP.vehicleBlock = function (ch) {
    (G.vehicles || []).forEach(function (v) {
      if (v.driver === ch) return;
      var dx = ch.x - v.x, dz = ch.z - v.z, d = Math.hypot(dx, dz);
      if (d < 1.3 && d > 0.01 && Math.abs(ch.y - v.y) < 1.5) { ch.x = v.x + dx / d * 1.3; ch.z = v.z + dz / d * 1.3; }
    });
  };
  KP.renderVehicles = function () {
    (G.vehicles || []).forEach(function (v) {
      if (!v.mesh) return;
      v.mesh.position.set(v.x, v.y, v.z); v.mesh.rotation.y = v.yaw;
      var gx = W3.height(v.x + Math.sin(v.yaw), v.z + Math.cos(v.yaw)) - W3.height(v.x - Math.sin(v.yaw), v.z - Math.cos(v.yaw));
      v.mesh.rotation.x = -Math.atan2(gx, 2) * 0.8;
    });
  };
})(window.KP);
