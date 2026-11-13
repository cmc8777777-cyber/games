/* Краскопад · сезонное событие «Северное сияние» (Э12).
   В матчах королевской битвы: 14 кристаллов сияния на острове (сезонное задание) и «Груз сияния» —
   капсула на парашюте с легендарным снаряжением, падает посреди матча внутри следующей зоны; боты за ней тоже бегут.
   Полярное сияние в небе — на закате и в сумерках. */
window.KP = window.KP || {};
(function (KP) {
  "use strict";
  var G = KP.G, W3 = KP.world, rnd = Math.random, CRYSTALS = 14;
  var crGeo = null, crMat = null;
  KP.eventSetup = function (M, mode) {
    KP.eventClear();
    var E = G.event = { crystals: [], drop: null, dropAt: mode === "quick" ? 60 : 110 };
    if (M.rules || M.train) { E.off = true; return; }
    if (!crGeo) { crGeo = new THREE.OctahedronGeometry(0.42, 0); crMat = new THREE.MeshLambertMaterial({ color: "#7ff7ff", emissive: "#2fd6ff", emissiveIntensity: 0.9 }); }
    for (var k = 0, n = 0; k < 200 && n < CRYSTALS; k++) {
      var a = rnd() * 6.28, r = Math.sqrt(rnd()) * 150, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (W3.height(x, z) < 0.8 || W3.query(x - 1.5, z - 1.5, x + 1.5, z + 1.5).length) continue;
      var c = { x: x, z: z, y: W3.height(x, z) + 0.9, alive: true }; n++;
      if (!G.headless) { c.mesh = new THREE.Mesh(crGeo, crMat); c.mesh.position.set(x, c.y, z); G.scene.add(c.mesh); }
      E.crystals.push(c);
    }
  };
  KP.eventClear = function () {
    var E = G.event; if (!E) return;
    E.crystals.forEach(function (c) { if (c.mesh) G.scene.remove(c.mesh); });
    if (E.drop && E.drop.mesh) G.scene.remove(E.drop.mesh);
    if (E.dropChest) { var i = KP.chests.indexOf(E.dropChest); if (i >= 0) KP.chests.splice(i, 1); if (E.dropChest.mesh) G.scene.remove(E.dropChest.mesh); }
    G.event = null;
  };
  KP.eventStep = function (dt) {
    var E = G.event; if (!E || E.off) return;
    var p = G.player;
    // кристаллы: подбирает игрок
    if (p.alive && p.state === "ground") E.crystals.forEach(function (c) {
      if (c.alive && Math.abs(c.x - p.x) < 1.6 && Math.abs(c.z - p.z) < 1.6) {
        c.alive = false; if (c.mesh) G.scene.remove(c.mesh); p.crystals = (p.crystals || 0) + 1;
        KP.sfx && KP.sfx("chest", 0, 0, true); KP.ui && KP.ui.toast(KP.t("crystalGot", p.crystals), 1.6);
      }
    });
    // груз сияния
    if (!E.drop && G.time > E.dropAt && G.zone) {
      var Z = G.zone, x, z, k = 0;
      do { var a = rnd() * 6.28, r = Math.sqrt(rnd()) * Math.max(8, Z.tr * 0.6); x = Z.tx + Math.cos(a) * r; z = Z.tz + Math.sin(a) * r; k++; } while ((W3.height(x, z) < 0.8 || W3.query(x - 2, z - 2, x + 2, z + 2).length) && k < 40);
      E.drop = { x: x, z: z, y: W3.height(x, z) + 90, g: W3.height(x, z) };
      if (!G.headless) {
        var g = new THREE.Group(), pod = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 1.6, 10), KP.mat("#e9edf0")); pod.position.y = 0.8; g.add(pod);
        var band = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.25, 10), KP.mat("#2fd6ff", "glow")); band.position.y = 1.1; g.add(band);
        var chute = new THREE.Mesh(new THREE.SphereGeometry(3.2, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: "#7ff7ff", side: THREE.DoubleSide })); chute.position.y = 6; g.add(chute);
        var beam = new THREE.Mesh(KP.GEO.beam, new THREE.MeshBasicMaterial({ color: "#7ff7ff", transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); beam.scale.set(2, 12, 2); beam.position.y = 24; g.add(beam);
        g.userData.chute = chute; E.drop.mesh = g; G.scene.add(g);
        KP.ui && KP.ui.big(KP.t("dropIncoming"), 2.6); KP.sfx && KP.sfx("zone", 0, 0, true);
      }
    }
    if (E.drop && !E.dropChest) {
      var D = E.drop; D.y = Math.max(D.g, D.y - dt * 7);
      if (D.mesh) D.mesh.position.set(D.x, D.y, D.z);
      if (D.y <= D.g) {   // приземлился: становится ящиком снабжения с легендарным лутом
        var ch = { x: D.x, z: D.z, y: D.g, poi: -1, legend: true, open: false };
        if (D.mesh) { D.mesh.userData.chute.visible = false; ch.mesh = D.mesh; ch.mesh.userData.lid = D.mesh.children[1]; ch.mesh.userData.beam = D.mesh.children[3]; D.mesh = null; }
        KP.chests.push(ch); E.dropChest = ch;
      }
    }
  };
  KP.eventRender = function (dt) {
    var E = G.event; if (!E || E.off) return;
    var t = performance.now() / 1000;
    E.crystals.forEach(function (c) { if (c.mesh) { c.mesh.rotation.y = t * 1.6; c.mesh.position.y = c.y + Math.sin(t * 2 + c.x) * 0.15; } });
  };
  KP.eventMini = function (ctx, X) {
    var E = G.event; if (!E || E.off) return;
    if (E.drop || E.dropChest) { var d = E.dropChest || E.drop; ctx.strokeStyle = "#7ff7ff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(d.x), X(d.z), 5, 0, 6.3); ctx.stroke(); }
  };
  /* полярное сияние: лента с градиентом в небе (без освещения) */
  KP.makeAurora = function (scene) {
    var g = new THREE.PlaneGeometry(520, 70, 60, 1), pos = g.attributes.position;
    for (var i = 0; i < pos.count; i++) { var x = pos.getX(i), a = x / 520 * 2.2; pos.setXYZ(i, Math.sin(a) * 260, pos.getY(i) + 120, -Math.cos(a) * 260 + 60 * Math.sin(x * 0.02)); }
    var m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      uniforms: { t: { value: 0 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform float t; varying vec2 vUv; void main(){ float w = 0.5 + 0.5 * sin(vUv.x * 18.0 + t * 0.7) * sin(vUv.x * 7.0 - t * 0.4);" +
        "float a = smoothstep(0.0, 0.35, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y)) * (0.35 + 0.65 * w);" +
        "vec3 c = mix(vec3(0.2, 1.0, 0.6), vec3(0.6, 0.3, 1.0), vUv.y); gl_FragColor = vec4(c * a * 0.55, 1.0); }"
    });
    var mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = -0.5; mesh.visible = false; scene.add(mesh);
    return mesh;
  };
})(window.KP);
