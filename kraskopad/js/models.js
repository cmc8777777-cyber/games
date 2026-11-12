/* Краскопад · модели (полуреалистичный стиль): бойцы, оружие, параплан, капсула эвакуации; эффекты: трассеры, искры, брызги, вспышки, следы краски.
   Тело бойца — одна слитая геометрия на скин (кэш), ноги и руки — отдельные узлы для анимации. ≈6 вызовов отрисовки на бойца. */
window.KP = window.KP || {};
(function (KP) {
  "use strict";
  var G = KP.G, rnd = Math.random, TX = KP.tex();
  var V = THREE.Vector3;

  /* ---------- материалы ---------- */
  var mats = {};
  function mat(c, extra) {
    var k = c + (extra || "");
    if (!mats[k]) mats[k] = new THREE.MeshLambertMaterial(extra === "glow" ? { color: c, emissive: c, emissiveIntensity: 0.6 } : { color: c });
    return mats[k];
  }
  KP.mat = mat;
  var bodyMat = new THREE.MeshLambertMaterial({ vertexColors: true, map: TX.wall });
  var gunMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  var grayMat = new THREE.MeshLambertMaterial({ color: "#6d7075" });
  var shadowMat = new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.28, depthWrite: false });
  var capsMat = new THREE.MeshLambertMaterial({ color: "#7fe8ff", emissive: "#2bbfff", emissiveIntensity: 0.6, transparent: true, opacity: 0.38, depthWrite: false });

  var B = new THREE.BoxGeometry(1, 1, 1);
  var GEO = {
    box: B, shadow: new THREE.CircleGeometry(0.55, 14),
    wall: new THREE.BoxGeometry(4, 4.2, 0.3), ramp: new THREE.BoxGeometry(4, 0.25, 5.66), lootRing: new THREE.RingGeometry(0.42, 0.55, 20),
    tube: new THREE.CylinderGeometry(0.06, 0.06, 0.32, 8), pal: new THREE.BoxGeometry(0.5, 0.18, 0.36), lac: new THREE.CylinderGeometry(0.16, 0.16, 0.36, 10),
    chest: new THREE.BoxGeometry(1.1, 0.7, 0.75), lid: new THREE.BoxGeometry(1.14, 0.12, 0.79), beam: new THREE.CylinderGeometry(0.03, 0.12, 4, 8, 1, true),
    capsule: new THREE.CylinderGeometry(0.55, 0.55, 2.1, 14, 1, true),
    big: new THREE.CylinderGeometry(0.22, 0.22, 0.5, 12), gren: new THREE.SphereGeometry(0.16, 10, 8), smoke: new THREE.CylinderGeometry(0.11, 0.11, 0.36, 10), pop: new THREE.BoxGeometry(0.32, 0.32, 0.32)
  };
  GEO.shadow.rotateX(-Math.PI / 2); GEO.lootRing.rotateX(-Math.PI / 2); GEO.ramp.rotateX(-Math.PI / 4);
  KP.GEO = GEO;

  function paintColor(p) { return p === "rainbow" ? new THREE.Color().setHSL(rnd(), 0.9, 0.55).getStyle() : p; }
  KP.paintColor = paintColor;
  function neon(p) { return p === "rainbow" ? "#ff3d8b" : p; }

  /* цилиндр между двумя точками (для конечностей) */
  var up = new V(0, 1, 0);
  function limb(m, a, b, r0, r1, color) {
    var d = new V().subVectors(b, a), L = d.length(), mid = new V().addVectors(a, b).multiplyScalar(0.5);
    var g = new THREE.CylinderGeometry(r1, r0, L, 7);
    var q = new THREE.Quaternion().setFromUnitVectors(up, d.normalize());
    g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q)); g.translate(mid.x, mid.y, mid.z);
    m.add(g, 0, 0, 0, 0, 0, 0, 1, 1, 1, color);
  }

  /* ---------- оружие (слитая геометрия на вид, кэш) ---------- */
  var gunCache = {};
  function gunGeo(id) {
    if (gunCache[id]) return gunCache[id];
    var m = new KP.Merger(4), D = "#2a2e33", Gr = "#555b63", L = "#7a8088";
    var C = { 1: "#ff3d8b", 2: "#21d4ff", 3: "#ff8a1f", 4: "#8cf03a", 5: "#b06bff", 6: "#ffd21f" }[id] || "#ffffff";
    function cylZ(x, y, z, r, l, c) { m.add(new THREE.CylinderGeometry(r, r, l, 8), x, y, z, Math.PI / 2, 0, 0, 1, 1, 1, c); }
    if (id === 0) {   // монтажный топор
      cylZ(0, 0, 0.25, 0.022, 0.72, "#3a3f46"); m.add(B, 0, 0, 0.02, 0, 0, 0, 0.05, 0.05, 0.14, "#1e2125");
      m.add(B, 0, 0.07, 0.58, 0, 0, 0, 0.025, 0.2, 0.16, "#b9bfc6"); m.add(B, 0, -0.06, 0.58, 0, 0, 0, 0.04, 0.06, 0.08, "#ff8a1f");
    } else if (id === 1) {
      m.add(B, 0, -0.07, -0.02, 0.3, 0, 0, 0.04, 0.13, 0.06, D); m.add(B, 0, 0.0, 0.08, 0, 0, 0, 0.045, 0.06, 0.25, Gr);
      cylZ(0, 0.05, 0.06, 0.018, 0.16, C); cylZ(0, 0, 0.23, 0.014, 0.06, D);
    } else if (id === 2) {
      m.add(B, 0, 0, 0.1, 0, 0, 0, 0.06, 0.09, 0.36, D); m.add(B, 0, -0.08, 0.0, 0.25, 0, 0, 0.04, 0.12, 0.05, D);
      m.add(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 12), 0, -0.07, 0.15, 0, 0, Math.PI / 2, 1, 1, 1, C);
      m.add(B, 0, 0, -0.13, 0, 0, 0, 0.03, 0.06, 0.14, Gr); cylZ(0, 0.01, 0.33, 0.018, 0.12, Gr); m.add(B, 0, 0.06, 0.08, 0, 0, 0, 0.02, 0.03, 0.1, L);
    } else if (id === 3) {
      m.add(B, 0, 0, 0.12, 0, 0, 0, 0.07, 0.09, 0.42, D); cylZ(0, 0.02, 0.5, 0.032, 0.42, Gr); cylZ(0, -0.04, 0.45, 0.022, 0.4, C);
      m.add(B, 0, -0.05, 0.43, 0, 0, 0, 0.065, 0.05, 0.18, "#4a3a2c"); m.add(B, 0, -0.04, -0.18, -0.15, 0, 0, 0.05, 0.11, 0.24, "#4a3a2c"); m.add(B, 0, -0.08, 0.0, 0.3, 0, 0, 0.04, 0.12, 0.05, D);
    } else if (id === 4) {
      m.add(B, 0, 0, 0.1, 0, 0, 0, 0.06, 0.1, 0.44, D); cylZ(0, 0.01, 0.48, 0.019, 0.3, Gr); m.add(B, 0, 0.0, 0.38, 0, 0, 0, 0.065, 0.075, 0.22, Gr);
      m.add(B, 0, -0.11, 0.13, 0.25, 0, 0, 0.04, 0.15, 0.07, C); m.add(B, 0, -0.08, -0.02, 0.3, 0, 0, 0.04, 0.12, 0.05, D);
      m.add(B, 0, -0.01, -0.22, 0, 0, 0, 0.05, 0.1, 0.24, Gr); m.add(B, 0, 0.08, 0.1, 0, 0, 0, 0.04, 0.05, 0.08, "#15181b"); m.add(B, 0, 0.065, 0.32, 0, 0, 0, 0.02, 0.02, 0.18, L);
    } else if (id === 5) {
      m.add(B, 0, 0, 0.08, 0, 0, 0, 0.06, 0.09, 0.5, D); cylZ(0, 0.01, 0.68, 0.02, 0.62, Gr); cylZ(0, 0.1, 0.08, 0.035, 0.32, "#15181b");
      m.add(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 10), 0, 0.1, 0.25, Math.PI / 2, 0, 0, 1, 1, 1, C);
      m.add(B, 0, -0.1, 0.1, 0.2, 0, 0, 0.04, 0.12, 0.06, C); m.add(B, 0, -0.02, -0.27, 0, 0, 0, 0.05, 0.13, 0.32, "#3d4a3a"); m.add(B, 0, -0.08, -0.05, 0.3, 0, 0, 0.04, 0.12, 0.05, D);
    } else if (id === 6) {
      cylZ(0, 0.02, 0.15, 0.085, 0.95, "#3d4a3a"); cylZ(0, 0.02, 0.63, 0.095, 0.06, D); cylZ(0, 0.02, -0.33, 0.095, 0.06, D);
      m.add(new THREE.SphereGeometry(0.07, 10, 8), 0, 0.02, 0.6, 0, 0, 0, 1, 1, 1, C); m.add(B, 0, -0.11, 0.05, 0.3, 0, 0, 0.04, 0.13, 0.05, D); m.add(B, 0.0, 0.13, 0.2, 0, 0, 0, 0.03, 0.06, 0.1, "#15181b");
    }
    gunCache[id] = m.build(); return gunCache[id];
  }
  var wrapMats = {};
  function weaponMesh(id, wrap) {
    var w = wrap && KP.META ? KP.META.WRAPS[wrap] : null, m = gunMat;
    if (w) {
      if (!wrapMats[wrap]) wrapMats[wrap] = new THREE.MeshLambertMaterial({ vertexColors: true, color: w.tint === "prism" ? "#ffffff" : w.tint, emissive: w.tint === "prism" ? "#5a2a6a" : "#000000", map: TX.wall });
      m = wrapMats[wrap];
    }
    var me = new THREE.Mesh(gunGeo(id), m); me.castShadow = true; return me;
  }
  KP.weaponMesh = weaponMesh;

  /* ---------- бойцы ---------- */
  var bodyCache = {}, armsCache = {}, legCache = {};
  function bodyGeo(skin, paint) {
    var key = skin + "|" + paint; if (bodyCache[key]) return bodyCache[key];
    var s = KP.SKINS[skin] || KP.SKINS[0], m = new KP.Merger(3), F = s.f ? 0.9 : 1;
    m.add(B, 0, 0.98, 0, 0, 0, 0, 0.37 * F, 0.24, 0.25, s.pants);
    m.add(new THREE.CylinderGeometry(0.235 * F, 0.19, 0.5, 10), 0, 1.3, 0, 0, 0, 0, 1, 1, 0.75, s.suit);
    m.add(B, 0, 1.33, 0.01, 0, 0, 0, 0.45 * F, 0.34, 0.31, s.vest);
    [-0.1, 0, 0.1].forEach(function (x) { m.add(B, x * F, 1.22, 0.15, 0, 0, 0, 0.08, 0.09, 0.05, s.vest2 || s.vest); });
    [-1, 1].forEach(function (sd) { m.add(B, sd * 0.26 * F, 1.47, 0, 0, 0, sd * 0.25, 0.14, 0.08, 0.19, s.vest2 || s.vest); });
    m.add(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 8), 0, 1.58, 0, 0, 0, 0, 1, 1, 1, s.skin);
    m.add(new THREE.SphereGeometry(0.115, 12, 10), 0, 1.7, 0.005, 0, 0, 0, 1, 1.13, 1.05, s.skin);
    m.add(B, -0.04, 1.715, 0.108, 0, 0, 0, 0.03, 0.012, 0.01, "#1b1b1f"); m.add(B, 0.04, 1.715, 0.108, 0, 0, 0, 0.03, 0.012, 0.01, "#1b1b1f");
    var hc = s.helmCol || s.vest;
    if (s.helm === "helmet" || s.helm === "mask") {
      m.add(new THREE.SphereGeometry(0.138, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), 0, 1.71, -0.005, 0, 0, 0, 1, 1, 1.05, hc);
      [-1, 1].forEach(function (sd) { m.add(B, sd * 0.125, 1.69, 0, 0, 0, 0, 0.04, 0.1, 0.12, "#22252a"); });
      if (s.helm === "mask") m.add(B, 0, 1.64, 0.105, 0, 0, 0, 0.13, 0.08, 0.06, "#2b2e33");
    } else if (s.helm === "cap") {
      m.add(new THREE.SphereGeometry(0.125, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), 0, 1.73, 0, 0, 0, 0, 1, 1, 1, hc);
      m.add(B, 0, 1.745, 0.13, 0, 0, 0, 0.15, 0.02, 0.1, hc);
    } else if (s.helm === "hood") {
      m.add(new THREE.SphereGeometry(0.15, 12, 10, Math.PI, Math.PI), 0, 1.71, 0, 0, 0, 0, 1.05, 1.15, 1.1, hc);
      m.add(new THREE.SphereGeometry(0.15, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.3), 0, 1.72, 0, 0, 0, 0, 1.05, 1.1, 1.1, hc);
    } else if (s.helm === "hair") {
      m.add(new THREE.SphereGeometry(0.128, 12, 10, Math.PI, Math.PI), 0, 1.72, 0, 0, 0, 0, 1, 1.05, 1.05, hc);
      m.add(new THREE.SphereGeometry(0.128, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.32), 0, 1.72, 0, 0, 0, 0, 1, 1, 1.03, hc);
      m.add(new THREE.CylinderGeometry(0.035, 0.02, 0.22, 6), 0, 1.62, -0.15, 0.4, 0, 0, 1, 1, 1, hc);
    } else if (s.helm === "hat") {
      m.add(new THREE.CylinderGeometry(0.25, 0.25, 0.02, 14), 0, 1.79, 0, 0, 0, 0, 1, 1, 1, hc); m.add(new THREE.CylinderGeometry(0.12, 0.13, 0.12, 12), 0, 1.84, 0, 0, 0, 0, 1, 1, 1, hc);
    }
    // баллоны с краской на спине
    [-0.075, 0.075].forEach(function (x) { m.add(new THREE.CylinderGeometry(0.065, 0.065, 0.42, 10), x, 1.32, -0.2, 0, 0, 0, 1, 1, 1, "#3a3f46"); m.add(new THREE.CylinderGeometry(0.067, 0.067, 0.12, 10), x, 1.3, -0.2, 0, 0, 0, 1, 1, 1, neon(paint)); });
    bodyCache[key] = m.build(); return bodyCache[key];
  }
  function accentGeo(skin) {   // светящиеся полосы и визор (отдельный меш со свечением)
    var s = KP.SKINS[skin] || KP.SKINS[0], m = new KP.Merger(1);
    [-1, 1].forEach(function (sd) { m.add(B, sd * 0.227 * (s.f ? 0.9 : 1), 1.33, 0.03, 0, 0, 0, 0.012, 0.26, 0.04, "#ffffff"); });
    if (s.helm === "helmet" || s.helm === "mask") m.add(B, 0, 1.705, 0.112, 0, 0, 0, 0.19, 0.05, 0.03, "#ffffff");
    else m.add(B, 0, 1.47, 0.14, 0, 0, 0, 0.12, 0.012, 0.01, "#ffffff");
    return m.build();
  }
  function legGeo(skin) {
    if (legCache[skin]) return legCache[skin];
    var s = KP.SKINS[skin] || KP.SKINS[0], m = new KP.Merger(3);
    m.add(new THREE.CylinderGeometry(0.095, 0.075, 0.46, 8), 0, -0.23, 0, 0, 0, 0, 1, 1, 1, s.pants);
    m.add(B, 0, -0.46, 0.06, 0, 0, 0, 0.1, 0.1, 0.05, s.vest2 || s.vest);
    m.add(new THREE.CylinderGeometry(0.075, 0.06, 0.4, 8), 0, -0.66, 0, 0, 0, 0, 1, 1, 1, s.pants);
    m.add(B, 0, -0.87, 0.04, 0, 0, 0, 0.13, 0.12, 0.27, s.boots || "#2a2622");
    legCache[skin] = m.build(); return legCache[skin];
  }
  function armsGeo(skin) {   // обе руки держат оружие перед грудью; узел — на уровне плеч
    if (armsCache[skin]) return armsCache[skin];
    var s = KP.SKINS[skin] || KP.SKINS[0], m = new KP.Merger(3), F = s.f ? 0.9 : 1;
    limb(m, new V(0.25 * F, 0, 0), new V(0.23, -0.24, 0.16), 0.072, 0.06, s.suit);
    limb(m, new V(0.23, -0.24, 0.16), new V(0.08, -0.17, 0.4), 0.06, 0.05, s.suit);
    limb(m, new V(-0.25 * F, 0, 0), new V(-0.22, -0.2, 0.22), 0.072, 0.06, s.suit);
    limb(m, new V(-0.22, -0.2, 0.22), new V(0.0, -0.14, 0.58), 0.06, 0.05, s.suit);
    m.add(new THREE.SphereGeometry(0.048, 8, 6), 0.08, -0.17, 0.42, 0, 0, 0, 1, 1, 1, s.gloves || "#24272b");
    m.add(new THREE.SphereGeometry(0.048, 8, 6), 0.0, -0.14, 0.6, 0, 0, 0, 1, 1, 1, s.gloves || "#24272b");
    armsCache[skin] = m.build(); return armsCache[skin];
  }
  var gliderGeo = (function () {
    var m = new KP.Merger(1);
    m.add(B, -0.75, 3.05, 0, 0, 0, 0.14, 1.6, 0.05, 1.0, "#2a2e33"); m.add(B, 0.75, 3.05, 0, 0, 0, -0.14, 1.6, 0.05, 1.0, "#2a2e33");
    m.add(B, -0.75, 3.06, 0.35, 0, 0, 0.14, 1.6, 0.06, 0.12, "#ffffff"); m.add(B, 0.75, 3.06, 0.35, 0, 0, -0.14, 1.6, 0.06, 0.12, "#ffffff");
    [-1, 1].forEach(function (sd) { limb(m, new V(sd * 0.22, 1.5, 0), new V(sd * 1.2, 2.95, 0), 0.008, 0.008, "#dddddd"); limb(m, new V(sd * 0.2, 1.5, -0.1), new V(sd * 0.5, 3.0, -0.2), 0.008, 0.008, "#dddddd"); });
    return m.build();
  })();
  var droneGeo = (function () {
    var m = new KP.Merger(1);
    m.add(B, 0, 0, 0, 0, 0, 0, 0.6, 0.18, 0.6, "#2a2e33");
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (o) { m.add(B, o[0] * 0.35, 0, o[1] * 0.35, 0, Math.atan2(o[0], o[1]), 0, 0.06, 0.05, 0.5, "#555b63"); m.add(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 12), o[0] * 0.5, 0.06, o[1] * 0.5, 0, 0, 0, 1, 1, 1, "#9aa0a6"); });
    m.add(B, 0, -0.12, 0.25, 0, 0, 0, 0.12, 0.05, 0.05, "#ff3d3d");
    return m.build();
  })();

  function charMesh(skin, paint) {
    var g = new THREE.Group(), parts = {}, quality = KP.quality || "low";
    var body = new THREE.Mesh(bodyGeo(skin, paint), bodyMat); body.castShadow = true; g.add(body);
    var acc = new THREE.Mesh(accentGeo(skin), mat(neon(paint), "glow")); g.add(acc);
    var legs = [-0.11, 0.11].map(function (x) { var p = new THREE.Group(); p.position.set(x, 0.92, 0); var l = new THREE.Mesh(legGeo(skin), bodyMat); l.castShadow = true; p.add(l); g.add(p); return p; });
    var arms = new THREE.Group(); arms.position.set(0, 1.45, 0); var am = new THREE.Mesh(armsGeo(skin), bodyMat); am.castShadow = true; arms.add(am); g.add(arms);
    var hand = new THREE.Group(); hand.position.set(0.05, -0.16, 0.36); arms.add(hand);
    var sh = new THREE.Mesh(GEO.shadow, shadowMat); sh.position.y = 0.03; sh.visible = quality !== "high"; g.add(sh);
    var umb = new THREE.Mesh(gliderGeo, gunMat); umb.visible = false; g.add(umb);
    var gl = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.02, 0.1), mat(neon(paint), "glow")); gl.position.set(0, 3.12, 0.42); umb.add(gl);
    parts.legs = legs; parts.umb = umb; parts.hand = hand; parts.body = body; parts.arms = arms; parts.shadow = sh; parts.acc = acc;
    g.userData.parts = parts;
    return g;
  }
  KP.charMesh = charMesh;
  /* выбывание: костюм гаснет, вокруг — энергокапсула, сверху — дрон эвакуации */
  KP.koVisual = function (ch) {
    var g = ch.mesh; if (!g) return;
    g.traverse(function (o) { if (o.isMesh && o.material !== shadowMat && o.material !== capsMat) o.material = grayMat; });
    var cap = new THREE.Mesh(GEO.capsule, capsMat); cap.position.y = 1.0; g.add(cap);
    var dr = new THREE.Mesh(droneGeo, gunMat); dr.position.y = 2.6; g.add(dr); g.userData.drone = dr;
  };

  /* ---------- эффекты ---------- */
  var MAXP = 200, MAXFX = 300, MAXSPL = 110, MAXFL = 16;
  var dmy = new THREE.Object3D(), tmpC = new THREE.Color(), tv = new V();
  function initFx(scene) {
    var add = { blending: THREE.AdditiveBlending, transparent: true, depthWrite: false };
    var pm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial(Object.assign({ color: "#ffffff" }, add)), MAXP);
    var fm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.06, 0), new THREE.MeshBasicMaterial({ color: "#ffffff" }), MAXFX);
    var sm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.05, 0), new THREE.MeshBasicMaterial(Object.assign({ color: "#ffffff" }, add)), MAXFX);
    [pm, fm, sm].forEach(function (m) { m.frustumCulled = false; scene.add(m); });
    var hide = new THREE.Matrix4().makeScale(0, 0, 0), c = new THREE.Color("#ffffff");
    for (var i = 0; i < MAXP; i++) { pm.setMatrixAt(i, hide); pm.setColorAt(i, c); }
    for (var j = 0; j < MAXFX; j++) { fm.setMatrixAt(j, hide); fm.setColorAt(j, c); sm.setMatrixAt(j, hide); sm.setColorAt(j, c); }
    var splG = new THREE.PlaneGeometry(2, 2); splG.rotateX(-Math.PI / 2);
    var spl = [];
    for (var k = 0; k < MAXSPL; k++) { var m = new THREE.Mesh(splG, new THREE.MeshLambertMaterial({ color: "#ffffff", map: TX.splat, transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); m.visible = false; scene.add(m); spl.push(m); }
    var fl = [];
    for (var f = 0; f < MAXFL; f++) { var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.glow, color: "#ffe9b0", blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); sp.visible = false; scene.add(sp); fl.push(sp); }
    G.fx = { pm: pm, fm: fm, sm: sm, parts: [], sparks: [], spl: spl, splI: 0, fl: fl, flI: 0, hide: hide };
  }
  KP.initFx = initFx;
  /* брызги краски (не светятся) */
  function burst(x, y, z, col, n, sp) {
    if (G.headless || !G.fx) return;
    var f = G.fx; for (var i = 0; i < n; i++) { if (f.parts.length >= MAXFX) break; f.parts.push({ x: x, y: y, z: z, vx: (rnd() - 0.5) * sp, vy: rnd() * sp * 0.7, vz: (rnd() - 0.5) * sp, t: 0.45 + rnd() * 0.4, c: col }); }
  }
  /* искры (светятся) */
  function sparks(x, y, z, n, col) {
    if (G.headless || !G.fx) return;
    var f = G.fx; for (var i = 0; i < n; i++) { if (f.sparks.length >= MAXFX) break; f.sparks.push({ x: x, y: y, z: z, vx: (rnd() - 0.5) * 9, vy: rnd() * 6, vz: (rnd() - 0.5) * 9, t: 0.15 + rnd() * 0.25, c: col || (rnd() < 0.5 ? "#fff1c2" : "#ffb347") }); }
  }
  function flash(x, y, z, s, col) {
    if (G.headless || !G.fx) return;
    var f = G.fx, sp = f.fl[f.flI]; f.flI = (f.flI + 1) % MAXFL;
    sp.visible = true; sp.position.set(x, y, z); sp.scale.set(s, s, s); sp.material.color.set(col || "#ffe9b0"); sp.material.opacity = 1; sp.userData.t = 0.06;
  }
  function splat(x, y, z, col, s) {
    if (G.headless || !G.fx) return;
    var f = G.fx, m = f.spl[f.splI]; f.splI = (f.splI + 1) % MAXSPL;
    m.visible = true; m.position.set(x, y + 0.05, z); var sc = s * (0.6 + rnd() * 0.5); m.scale.set(sc, 1, sc); m.rotation.y = rnd() * 6;
    m.material.color.set(col); m.material.opacity = 0.85; m.userData.t = 16;
  }
  KP.burst = burst; KP.splat = splat; KP.sparks = sparks; KP.flash = flash;
  function updateFx(dt) {
    var f = G.fx; if (!f) return;
    var i, k = 0;
    for (i = 0; i < G.proj.length && k < MAXP; i++, k++) {
      var p = G.proj[i];
      if (p.grav) { dmy.position.set(p.x, p.y, p.z); dmy.rotation.set(G.time * 8, G.time * 5, 0); dmy.scale.set(0.2, 0.2, 0.28); }
      else {
        var sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy + p.vz * p.vz) || 1, len = Math.min(3.2, sp * 0.018 + 0.6);
        dmy.position.set(p.x - p.vx / sp * len * 0.5, p.y - p.vy / sp * len * 0.5, p.z - p.vz / sp * len * 0.5);
        tv.set(p.x + p.vx, p.y + p.vy, p.z + p.vz); dmy.lookAt(tv); dmy.scale.set(0.045, 0.045, len);
      }
      dmy.updateMatrix(); f.pm.setMatrixAt(k, dmy.matrix); f.pm.setColorAt(k, tmpC.set(p.col));
    }
    for (; k < MAXP; k++) f.pm.setMatrixAt(k, f.hide);
    f.pm.instanceMatrix.needsUpdate = true; if (f.pm.instanceColor) f.pm.instanceColor.needsUpdate = true;
    [[f.parts, f.fm, 16], [f.sparks, f.sm, 9]].forEach(function (L) {
      var arr = L[0], im = L[1], gr = L[2], n = 0;
      for (var j = arr.length - 1; j >= 0; j--) { var q = arr[j]; q.t -= dt; if (q.t <= 0) { arr.splice(j, 1); continue; } q.vy -= gr * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; }
      for (var a = 0; a < arr.length && n < MAXFX; a++, n++) { var r = arr[a]; dmy.position.set(r.x, r.y, r.z); dmy.rotation.set(0, 0, 0); var ss = Math.min(1, r.t * 3); dmy.scale.set(ss, ss, ss); dmy.updateMatrix(); im.setMatrixAt(n, dmy.matrix); im.setColorAt(n, tmpC.set(r.c)); }
      for (; n < MAXFX; n++) im.setMatrixAt(n, f.hide);
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    });
    f.spl.forEach(function (m) { if (!m.visible) return; m.userData.t -= dt; if (m.userData.t < 3) m.material.opacity = Math.max(0, m.userData.t / 3 * 0.85); if (m.userData.t <= 0) m.visible = false; });
    f.fl.forEach(function (s) { if (!s.visible) return; s.userData.t -= dt; if (s.userData.t <= 0) s.visible = false; });
  }
  KP.updateFx = updateFx;
  /* облако дыма: несколько больших полупрозрачных спрайтов */
  var smokeMat = new THREE.SpriteMaterial({ map: TX.glow, color: "#c9d0d6", transparent: true, opacity: 0.55, depthWrite: false });
  KP.smokeVisual = function (s) {
    var g = new THREE.Group(), list = [];
    for (var i = 0; i < 14; i++) { var sp = new THREE.Sprite(smokeMat.clone()); sp.position.set((rnd() - 0.5) * 6, (rnd() - 0.3) * 3, (rnd() - 0.5) * 6); sp.userData.k = 0.6 + rnd() * 0.6; g.add(sp); list.push(sp); }
    g.position.set(s.x, s.y, s.z); G.scene.add(g);
    s.vis = function (end) {
      if (end) { G.scene.remove(g); return; }
      list.forEach(function (sp) { var sc = s.r * 2.2 * sp.userData.k; sp.scale.set(sc, sc, sc); sp.material.opacity = Math.min(0.6, s.t / 3); });
    };
  };
  KP.clearFx = function () { var f = G.fx; if (!f) return; f.parts.length = 0; f.sparks.length = 0; f.spl.forEach(function (m) { m.visible = false; }); f.fl.forEach(function (s) { s.visible = false; }); };
})(window.KP);
