/* Краскопад · сцена, матч, ввод (ПК + телефон), камера, интерфейс, прогресс, звук, автоигрок. */
(function (KP) {
  "use strict";
  var G = KP.G, W3 = KP.world, PF = window.PF, rnd = Math.random, $ = function (id) { return document.getElementById(id); };
  var DT = 1 / 60;
  var isTouch = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;

  /* ---------- настройки и прогресс ---------- */
  function jget(k, d) { try { var v = JSON.parse(PF.get(k)); return v && typeof v === "object" ? v : d; } catch (e) { return d; } }
  var SET = { sens: 1, snd: 1, mus: 1, q: isTouch ? "low" : "high", qmode: "auto", lang: "", map: "isle" };
  /* уровень качества (Э14): 2 — тени и трава, 1 — без теней, 0 — облегчённый (меньше пикселей, короче дальность, без кустов).
     «Авто»: старт по устройству, при просадке FPS во время матча понижается сам. */
  var QL = 2, fpsAcc = 0, fpsN = 0, fpsT = 0, qlCd = 0;
  function qlFromSet() { return SET.qmode === "high" ? 2 : SET.qmode === "low" ? 0 : (isTouch ? 1 : 2); }
  var PROG = { v: 2, xp: 0, pp: 0, st: {}, ch: {}, own: {}, skin: 0, paint: 0, wrap: 0, emote: 0 };
  function saveSet() { PF.put("kp.set", JSON.stringify(SET)); }
  function saveProg() { PF.put("kp.prog", JSON.stringify(PROG)); }
  function loadAll() {
    var s = jget("kp.set", {}); Object.keys(s).forEach(function (k) { SET[k] = s[k]; });
    var p = jget("kp.prog", {}); PROG.xp = Number(p.xp) || 0; PROG.pp = Number(p.pp) || 0; PROG.pp2 = Number(p.pp2) || 0; PROG.sq = p.sq; PROG.ach = p.ach || {}; PROG.ws = p.ws || {}; PROG.chal = p.chal || {}; PROG.st = p.st || {}; PROG.ch = p.ch || {}; PROG.own = p.own || {};
    PROG.skin = p.skin || 0; PROG.paint = p.paint || 0; PROG.wrap = p.wrap || 0; PROG.emote = p.emote || 0; PROG.dq = p.dq; PROG.wq = p.wq;
    if (!p.v && (PROG.skin === 10 || PROG.skin === 11)) PROG.skin = PROG.skin === 10 ? 24 : 12;   // перенос номеров скинов из v0.1
    if (PROG.skin >= KP.SKINS.length) PROG.skin = 0;
    PROG.v = 2; KP.META.ensureQuests(PROG); KP.META.ensureSeason(PROG);
  }
  function lvlInfo(xp) { return KP.META.lvlInfo(xp); }
  function isOpen(kind, i) { return KP.META.isOpen(PROG, kind, i); }
  function st(k) { return Number(PROG.st[k]) || 0; }

  /* ---------- сцена ---------- */
  var aurora = null;
  var renderer, scene, camera, world, sun, sky, hemi, rain, zoneMesh, planeMesh, millBlades, beacon;
  /* время суток и погода (Э3): выбирается на каждый матч */
  var ATMOS = {
    day: { sun: [0.45, 0.62, 0.35], sc: "#fff0d4", si: 0.95, hs: "#d4e8ff", hg: "#5d5a43", hi: 0.62, fog: "#c6d8e0", far: 1, top: "#2f6fb8", mid: "#8cc4ea", hor: "#dcebf2", glow: "#fff3d6" },
    sunset: { sun: [-0.7, 0.2, 0.45], sc: "#ffb070", si: 1.05, hs: "#ffc9a0", hg: "#4a3e3a", hi: 0.55, fog: "#e8b994", far: 0.95, top: "#3a4f8a", mid: "#d98a6a", hor: "#ffcf9a", glow: "#ffd09a" },
    morning: { sun: [0.6, 0.3, -0.5], sc: "#ffe2bd", si: 0.85, hs: "#d8e4f0", hg: "#5b5a48", hi: 0.7, fog: "#d8dfe4", far: 0.8, top: "#5a86c0", mid: "#a9c7e2", hor: "#e9e6df", glow: "#fff1d9" },
    storm: { sun: [0.3, 0.8, 0.2], sc: "#c9d2dc", si: 0.45, hs: "#a8b4c0", hg: "#3e423f", hi: 0.75, fog: "#8e9aa4", far: 0.72, top: "#4a5560", mid: "#7c8792", hor: "#9aa4ad", glow: "#c9d2dc", rain: true },
    desert: { sun: [0.4, 0.8, 0.3], sc: "#fff1d8", si: 1.05, hs: "#e8dcc8", hg: "#a8784a", hi: 0.6, fog: "#e6d2b0", far: 1, top: "#3f78c0", mid: "#9cc6e6", hor: "#f0e2c4", glow: "#fff6e0" },
    dustset: { sun: [-0.75, 0.22, 0.3], sc: "#ffa060", si: 1.05, hs: "#ffc8a0", hg: "#7a4a32", hi: 0.55, fog: "#e8a878", far: 0.95, top: "#4a3a6a", mid: "#d98a5a", hor: "#ffc890", glow: "#ffc890" },
    sandstorm: { sun: [0.3, 0.7, 0.2], sc: "#f0d0a0", si: 0.6, hs: "#d8b890", hg: "#8a6a4a", hi: 0.85, fog: "#c9a070", far: 0.5, top: "#a88a64", mid: "#c9a878", hor: "#d8b88a", glow: "#f0d0a0", dust: true },
    frost: { sun: [0.5, 0.45, -0.4], sc: "#f2f6ff", si: 0.95, hs: "#dcecff", hg: "#9aa6b0", hi: 0.75, fog: "#d6e2ea", far: 0.9, top: "#3f74b5", mid: "#9cc2e2", hor: "#e6eef4", glow: "#ffffff" },
    snow: { sun: [0.3, 0.8, 0.2], sc: "#e2e8ef", si: 0.5, hs: "#c8d2dc", hg: "#8a949c", hi: 0.85, fog: "#c3ccd4", far: 0.65, top: "#7a8794", mid: "#a8b3bd", hor: "#c9d1d8", glow: "#e2e8ef", snow: true },
    polar: { sun: [-0.7, 0.18, 0.4], sc: "#ffb9a0", si: 0.9, hs: "#ffd2c4", hg: "#8a8090", hi: 0.62, fog: "#e7c2c0", far: 0.95, top: "#36477a", mid: "#c58fa8", hor: "#ffd2b8", glow: "#ffd2b8" },
    dusk: { sun: [0.2, 0.12, -0.9], sc: "#9fb2ff", si: 0.5, hs: "#6f7fb0", hg: "#2c2a35", hi: 0.6, fog: "#4e5a7a", far: 0.85, top: "#141c3a", mid: "#3c4a7a", hor: "#8a7aa0", glow: "#b0b8ff" }
  };
  var atm = ATMOS.day;
  function applyAtmos(name) {
    atm = ATMOS[name] || ATMOS.day; G.atmos = name;
    SUN_DIR.set(atm.sun[0], atm.sun[1], atm.sun[2]).normalize();
    sun.color.set(atm.sc); sun.intensity = atm.si; hemi.color.set(atm.hs); hemi.groundColor.set(atm.hg); hemi.intensity = atm.hi;
    FOGC.set(atm.fog); scene.fog.color.copy(FOGC); scene.background.copy(FOGC);
    var u = sky.material.uniforms; u.top.value.set(atm.top); u.mid.value.set(atm.mid); u.hor.value.set(atm.hor); u.sunCol.value.set(atm.glow); u.sun.value.copy(SUN_DIR);
    sun.position.copy(SUN_DIR).multiplyScalar(120);
    if (aurora) aurora.visible = name === "polar" || name === "dusk";
    if (rain) { rain.visible = !!(atm.rain || atm.snow || atm.dust); rain.material.color.set(atm.snow ? "#ffffff" : atm.dust ? "#d8b07a" : "#c8d6e2"); rain.material.opacity = atm.snow ? 0.8 : atm.dust ? 0.55 : 0.45; rain.userData.snow = !!atm.snow; rain.userData.dust = !!atm.dust; }
    applyQuality();
  }
  function makeRain() {
    var n = SET.q === "high" ? 1800 : 700, pos = new Float32Array(n * 6);
    for (var i = 0; i < n; i++) { var x = (Math.random() - 0.5) * 50, y = Math.random() * 24, z = (Math.random() - 0.5) * 50; pos.set([x, y, z, x + 0.05, y - 0.7, z], i * 6); }
    var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    rain = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: "#c8d6e2", transparent: true, opacity: 0.45, depthWrite: false }));
    rain.frustumCulled = false; rain.visible = false; scene.add(rain);
  }
  var FOGC = new THREE.Color("#c6d8e0"), GREY = new THREE.Color("#8d949c"), SUN_DIR = new THREE.Vector3(0.45, 0.62, 0.35).normalize();
  function initScene() {
    var cv = $("cv");
    QL = qlFromSet(); SET.q = QL === 2 ? "high" : "low"; KP.quality = SET.q;
    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: SET.q === "high", powerPreference: "high-performance" });
    renderer.shadowMap.enabled = SET.q === "high"; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    applyQuality();
    scene = new THREE.Scene(); G.scene = scene;
    scene.background = FOGC.clone(); scene.fog = new THREE.Fog(FOGC.clone(), 45, SET.q === "high" ? 175 : 130);
    camera = new THREE.PerspectiveCamera(70, 1, 0.1, 420);
    hemi = new THREE.HemisphereLight("#d4e8ff", "#5d5a43", 0.62); scene.add(hemi);
    sun = new THREE.DirectionalLight("#fff0d4", 0.95); sun.position.copy(SUN_DIR).multiplyScalar(120); scene.add(sun); scene.add(sun.target);
    if (SET.q === "high") {
      sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); var sc = sun.shadow.camera; sc.left = -42; sc.right = 42; sc.top = 42; sc.bottom = -42; sc.near = 10; sc.far = 260; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
    }
    sky = KP.makeSky(scene, SUN_DIR); makeRain(); aurora = KP.makeAurora(scene);
    KP.initFx(scene);
    W3.load(SET.map || "isle"); setupWorld();
    // зона — стена серой хмари
    var zg = new THREE.CylinderGeometry(1, 1, 160, 64, 1, true);
    zoneMesh = new THREE.Mesh(zg, new THREE.MeshBasicMaterial({ color: "#77818c", transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false, fog: false }));
    zoneMesh.position.y = 40; scene.add(zoneMesh);
    // дирижабль организаторов
    var pm = new KP.Merger(0.5);
    pm.add(new THREE.SphereGeometry(1, 20, 12), 0, 0, 0, 0, 0, 0, 4.2, 4.2, 13, "#d9dde1");
    pm.add(new THREE.CylinderGeometry(4.25, 4.25, 1.2, 20), 0, 0, 2, Math.PI / 2, 0, 0, 1, 1, 1, "#2a2e33");
    pm.add(new THREE.CylinderGeometry(4.25, 4.25, 0.5, 20), 0, 0, -4, Math.PI / 2, 0, 0, 1, 1, 1, "#ff3d8b");
    pm.add(new THREE.BoxGeometry(2.6, 1.8, 6), 0, -4.7, 0.5, 0, 0, 0, 1, 1, 1, "#3a4048");
    pm.add(new THREE.BoxGeometry(2.62, 0.5, 4.5), 0, -4.4, 0.8, 0, 0, 0, 1, 1, 1, "#9fd8ff");
    [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach(function (r) { pm.add(new THREE.BoxGeometry(0.3, 3.6, 3.2), Math.sin(r) * 1.6, Math.cos(r) * 1.6, -12, 0, 0, r, 1, 1, 1, "#2a2e33"); });
    planeMesh = new THREE.Mesh(pm.build(), new THREE.MeshLambertMaterial({ vertexColors: true, map: KP.tex().wall }));
    planeMesh.visible = false; scene.add(planeMesh);
    window.addEventListener("resize", onResize); onResize();
    buildMinimapBase();
  }
  /* мир текущей карты: остров, ящики снабжения, анимированные объекты (всё в world.root — для смены карты) */
  function setupWorld() {
    millBlades = null; beacon = null;
    world = W3.build(scene, SET.q);
    // ящики снабжения (сундуки)
    world.chests.forEach(function (c) { makeChestMesh(c, world.root); });
    KP.makeChestMesh = function (c) { makeChestMesh(c, scene); };
    if (false) world.chests.forEach(function (c) {
      c.y = W3.height(c.x, c.z);
      var g = new THREE.Group(), box = new THREE.Mesh(KP.GEO.chest, KP.mat("#2b3036")); box.position.y = 0.35; box.castShadow = true; g.add(box);
      var trim = new THREE.Mesh(KP.GEO.box, KP.mat("#ffc531", "glow")); trim.scale.set(1.16, 0.06, 0.81); trim.position.y = 0.52; g.add(trim);
      var lid = new THREE.Mesh(KP.GEO.lid, KP.mat("#3a4048")); lid.position.y = 0.76; g.add(lid);
      var beam = new THREE.Mesh(KP.GEO.beam, new THREE.MeshBasicMaterial({ color: "#ffc531", transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = 3.6; g.add(beam);
      g.position.set(c.x, c.y, c.z); g.rotation.y = c.x * 7 % 6.28; g.userData.lid = lid; g.userData.beam = beam; c.mesh = g; world.root.add(g);
    });
    KP.chests = world.chests;
    KP.trainSetup(world.root);
    // анимированные объекты локаций
    world.anim.forEach(function (a) {
      if (a.kind === "mill") {
        millBlades = new THREE.Group(); millBlades.position.set(a.x, a.y, a.z);
        for (var b = 0; b < 4; b++) { var bl = new THREE.Mesh(KP.GEO.box, KP.mat(b % 2 ? "#e9e2d2" : "#8a6a4c")); bl.scale.set(0.8, 6.5, 0.1); bl.position.y = 3.3; var piv = new THREE.Group(); piv.rotation.z = b * Math.PI / 2; piv.add(bl); millBlades.add(piv); }
        world.root.add(millBlades);
      } else if (a.kind === "beacon") {
        beacon = new THREE.Sprite(new THREE.SpriteMaterial({ map: KP.tex().glow, color: "#fff2b0", blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
        beacon.position.set(a.x, a.y, a.z); beacon.scale.set(6, 6, 6); world.root.add(beacon);
      }
    });
  }
  function makeChestMesh(c, parent) {
    c.y = W3.height(c.x, c.z);
    var g = new THREE.Group(), box = new THREE.Mesh(KP.GEO.chest, KP.mat("#2b3036")); box.position.y = 0.35; box.castShadow = true; g.add(box);
    var trim = new THREE.Mesh(KP.GEO.box, KP.mat(c.legend ? "#7ff7ff" : "#ffc531", "glow")); trim.scale.set(1.16, 0.06, 0.81); trim.position.y = 0.52; g.add(trim);
    var lid = new THREE.Mesh(KP.GEO.lid, KP.mat("#3a4048")); lid.position.y = 0.76; g.add(lid);
    var beam = new THREE.Mesh(KP.GEO.beam, new THREE.MeshBasicMaterial({ color: c.legend ? "#7ff7ff" : "#ffc531", transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = 3.6; g.add(beam);
    g.position.set(c.x, c.y, c.z); g.rotation.y = c.x * 7 % 6.28; g.userData.lid = lid; g.userData.beam = beam; c.mesh = g; parent.add(g);
  }
  function switchMap(id, temp) {
    if (id === W3.map && world) return;
    clearMatch();
    if (world && world.root) { scene.remove(world.root); world.root.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); }
    (G.vehicles || []).forEach(function (v) { if (v.mesh) scene.remove(v.mesh); }); G.vehicles = [];
    W3.load(id); setupWorld(); buildMinimapBase(); showcaseSpot = null;
    if (!temp) { SET.map = id; saveSet(); }
  }
  function applyQuality() {
    if (!renderer) return;
    var dpr = window.devicePixelRatio || 1;
    renderer.setPixelRatio(QL === 2 ? Math.min(dpr, 2) : QL === 1 ? Math.min(dpr, isTouch ? 1.25 : 1) : Math.min(dpr, 0.8));
    if (scene) scene.fog.far = (QL === 2 ? 175 : QL === 1 ? 135 : 105) * (atm ? atm.far : 1);
    var sh = QL === 2;
    if (sun && (renderer.shadowMap.enabled !== sh || sun.castShadow !== sh)) {
      renderer.shadowMap.enabled = sh; sun.castShadow = sh;
      if (sh && !sun.shadow.map) { sun.shadow.mapSize.set(2048, 2048); var sc = sun.shadow.camera; sc.left = -42; sc.right = 42; sc.top = 42; sc.bottom = -42; sc.near = 10; sc.far = 260; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sc.updateProjectionMatrix(); }
      if (scene) scene.traverse(function (o) { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { m.needsUpdate = true; }); });
    }
    KP.quality = sh ? "high" : "low";
    if (world) { if (world.grass) world.grass.visible = QL === 2; if (world.bushes) world.bushes.visible = QL > 0; }
  }
  function setQL(n, why) { if (n === QL) return; QL = n; applyQuality(); if (why && G.running) toast(KP.t("qAuto"), 2); }
  function onResize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    document.body.classList.toggle("portrait", h > w);
  }

  /* ---------- звук: audio.js ---------- */
  var AC = null;
  function audioInit() { KP.audio.init(SET); AC = KP.audio.ctx(); }

  /* ---------- ввод ---------- */
  var IN = { keys: {}, fire: false, aim: false, mx: 0, mz: 0, yaw: 0, pitch: -0.12, jump: false };
  var locked = false;
  function bindInput() {
    window.addEventListener("keydown", function (e) {
      if (e.repeat) { if (["Space"].indexOf(e.code) >= 0) e.preventDefault(); return; }
      IN.keys[e.code] = true; audioInit();
      if (!G.running) return;
      var p = G.player; if (!p) return;
      if (e.code === "Space") { e.preventDefault(); IN.jump = true; }
      if (e.code === "KeyQ") act("wall"); if (e.code === "KeyF") act("ramp"); if (e.code === "KeyE") act("take");
      if (e.code === "KeyR") act("reload"); if (e.code === "KeyH") act("heal");
      if (e.code === "KeyM" && !G.running) return;
      if (e.code === "KeyG") act("throw"); if (e.code === "KeyB") act("cycle"); if (e.code === "KeyT") act("emote");
      if (/^Digit[1-5]$/.test(e.code)) act("slot", Number(e.code.slice(5)) - 1);
      if (e.code === "KeyP") togglePause(true);
      if (e.code === "KeyM") toggleMap();
      if (e.code === "KeyC") act("crouch"); if (e.code === "KeyV") act("roll");
    });
    window.addEventListener("keyup", function (e) { IN.keys[e.code] = false; });
    var cv = $("cv");
    cv.addEventListener("mousedown", function (e) {
      audioInit();
      if (!G.running || isTouch) return;
      if (!locked) { lockPtr(); return; }
      if (e.button === 0) IN.fire = true; if (e.button === 2) IN.aim = true;
    });
    window.addEventListener("mouseup", function (e) { if (e.button === 0) IN.fire = false; if (e.button === 2) IN.aim = false; });
    window.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    document.addEventListener("pointerlockchange", function () {
      locked = document.pointerLockElement === cv;
      $("lockHint").style.display = (!locked && G.running && !isTouch && !G.ended && !G.paused) ? "block" : "none";
      if (!locked && G.running && !G.ended && !isTouch && !G.paused) togglePause(true);
    });
    window.addEventListener("mousemove", function (e) {
      if (!locked) return;
      var s = 0.0024 * SET.sens * (IN.aim && zoomW() ? 0.4 : 1);
      IN.yaw -= e.movementX * s; IN.pitch = Math.max(-1.2, Math.min(0.95, IN.pitch - e.movementY * s));
    });
    window.addEventListener("wheel", function (e) { if (!G.running || !G.player) return; var p = G.player, d = e.deltaY > 0 ? 1 : -1, s = p.cur; for (var i = 0; i < 5; i++) { s = (s + d + 5) % 5; if (s === 0 || p.slots[s]) break; } KP.equip(p, s); }, { passive: true });

    // сенсор
    var stickId = null, sx = 0, sy = 0, lookId = null, lx = 0, ly = 0;
    var tl = $("touch");
    tl.addEventListener("touchstart", function (e) {
      e.preventDefault(); audioInit(); document.body.classList.add("touch"); isTouch = true;
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.clientX < window.innerWidth * 0.45 && stickId === null) { stickId = t.identifier; sx = t.clientX; sy = t.clientY; showStick(sx, sy, 0, 0); }
        else if (lookId === null) { lookId = t.identifier; lx = t.clientX; ly = t.clientY; }
      }
    }, { passive: false });
    function tmove(e) {
      e.preventDefault();
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.identifier === stickId) { var dx = t.clientX - sx, dy = t.clientY - sy, L = Math.hypot(dx, dy), R = 55; if (L > R) { dx *= R / L; dy *= R / L; } IN.mx = dx / R; IN.mz = -dy / R; showStick(sx, sy, dx, dy); }
        else if (t.identifier === lookId) { var s = 0.0055 * SET.sens * (IN.aim && zoomW() ? 0.35 : 1); IN.yaw -= (t.clientX - lx) * s; IN.pitch = Math.max(-1.2, Math.min(0.95, IN.pitch - (t.clientY - ly) * s * 0.8)); lx = t.clientX; ly = t.clientY; }
      }
    }
    function tend(e) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.identifier === stickId) { stickId = null; IN.mx = 0; IN.mz = 0; hideStick(); }
        if (t.identifier === lookId) { lookId = null; if (fireTouch === t.identifier) { IN.fire = false; fireTouch = null; } }
      }
    }
    window.addEventListener("touchmove", tmove, { passive: false });
    window.addEventListener("touchend", tend); window.addEventListener("touchcancel", tend);
    var fireTouch = null;
    // кнопка «Огонь»: держать = стрелять, вести пальцем = поворот камеры
    $("bFire").addEventListener("touchstart", function (e) { e.preventDefault(); e.stopPropagation(); var t = e.changedTouches[0]; IN.fire = true; fireTouch = t.identifier; if (lookId === null) { lookId = t.identifier; lx = t.clientX; ly = t.clientY; } }, { passive: false });
    var btn = { bCrouch: "crouch", bRoll: "roll", bEmote: "emote", bGren: "throw", bCyc: "cycle", bJump: "jump", bWall: "wall", bRamp: "ramp", bHeal: "heal", bReload: "reload", bTake: "take", bAim: "aim", bPauseT: "pause" };
    Object.keys(btn).forEach(function (id) {
      $(id).addEventListener("touchstart", function (e) { e.preventDefault(); e.stopPropagation(); audioInit(); act(btn[id]); }, { passive: false });
      $(id).addEventListener("click", function () { if (!isTouch) act(btn[id]); });
    });
    for (var s = 0; s < 5; s++) (function (s) {
      var el = $("slot" + s);
      el.addEventListener("touchstart", function (e) { e.preventDefault(); e.stopPropagation(); act("slot", s); }, { passive: false });
      el.addEventListener("click", function () { act("slot", s); });
    })(s);
  }
  function lockPtr() { try { var pr = $("cv").requestPointerLock(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {} }
  function showStick(x, y, dx, dy) { var b = $("stickBase"), k = $("stickKnob"); b.style.display = "block"; b.style.left = (x - 60) + "px"; b.style.top = (y - 60) + "px"; k.style.transform = "translate(" + dx + "px," + dy + "px)"; }
  function hideStick() { $("stickBase").style.display = "none"; }
  function zoomW() { var p = G.player; return p && p.cur > 0 && p.slots[p.cur] && KP.WEAPONS[p.slots[p.cur].id].zoom; }

  function act(a, arg) {
    var p = G.player; if (!G.running || !p) return;
    if (a === "pause") { togglePause(true); return; }
    if (p.state === "plane") { if (a === "jump") IN.jump = true; return; }
    if (p.state === "drive") { if (a === "take" && !KP.exitVehicle(p)) toast(KP.t("noShore")); return; }
    if (!p.alive || p.state !== "ground") { if (a === "jump") IN.jump = true; return; }
    if (a === "jump") IN.jump = true;
    else if (a === "crouch") p.crouch = !p.crouch;
    else if (a === "roll") { if (p.onGround && !(p.rollT > 0)) { var rd = inputDir(), rl = Math.hypot(rd[0], rd[1]); if (rl < 0.2) { rd = [Math.sin(IN.yaw), Math.cos(IN.yaw)]; rl = 1; } p.rollT = 0.55; p.rollX = rd[0] / rl; p.rollZ = rd[1] / rl; p.healT = 0; KP.sfx("swing", 0, 0, true); } }
    else if (a === "emote") { p.emote = { anim: KP.META.EMOTES[PROG.emote].anim, t: 0 }; }
    else if (a === "throw") { p.yaw = IN.yaw; var tp = aimPoint(false); if (!KP.throwItem(p, tp.x, tp.y, tp.z)) toast(KP.t("noGren")); }
    else if (a === "cycle") { var ks = ["gren", "smoke", "pop"], ci = ks.indexOf(p.thr); for (var q = 1; q <= 3; q++) { var nk = ks[(ci + q) % 3]; if (p.items[nk] > 0 || q === 3) { p.thr = nk; break; } } toast(KP.t("i_" + p.thr)); }
    else if (a === "wall" || a === "ramp") { p.yaw = IN.yaw; var r = KP.place(p, a); if (r === "noWood") toast(KP.t("noWood")); }
    else if (a === "reload") KP.reload(p);
    else if (a === "heal") { if (KP.startHeal(p)) toast(KP.t("healing")); }
    else if (a === "slot") KP.equip(p, arg);
    else if (a === "aim") IN.aim = !IN.aim;
    else if (a === "take") takeNear(p, true);
  }
  function nearestLoot(p, r) { var best = null, bd = r; G.loot.forEach(function (it) { var d = Math.hypot(it.x - p.x, it.z - p.z); if (d < bd) { bd = d; best = it; } }); return best; }
  function takeNear(p, manual) {
    var c = KP.nearChest(p, 2.2); if (c && manual) { KP.openChest(c, p); return; }
    var it = nearestLoot(p, 2.2);
    if (!it) { var vh = manual && KP.nearVehicle(p, 2.6); if (vh) KP.enterVehicle(p, vh); return; }
    if (it.t === "w") {
      var free = 0; for (var i = 1; i <= 4; i++) if (!p.slots[i]) { free = i; break; }
      if (free) KP.pickup(p, it); else if (manual) { var s = p.cur; if (s === 0) { var ws = 1, wv = 9; for (var j = 1; j <= 4; j++) { var v = KP.wScore(p.slots[j]); if (v < wv) { wv = v; ws = j; } } s = ws; } KP.pickup(p, it, s); }
    } else KP.pickup(p, it);
  }

  /* ---------- матч ---------- */
  var MATCH = null;
  function clearMatch() {
    G.chars.forEach(function (c) { if (c.mesh) scene.remove(c.mesh); }); G.chars.length = 0;
    G.loot.slice().forEach(KP.removeLoot); G.loot.length = 0; G.proj.length = 0;
    G.buildList.slice().forEach(function (b) { W3.removeCol(b); if (b.mesh) scene.remove(b.mesh); }); G.buildList.length = 0; G.builds = {};
    world.trees.concat(world.crates).forEach(function (c) { c.hp = c.kind === "tree" ? 60 : 40; if (!c.alive) { W3.addCol(c); if (c.setVis) c.setVis(true); } });
    world.chests.forEach(function (c) { c.open = false; if (c.mesh) { c.mesh.userData.lid.rotation.x = 0; c.mesh.userData.lid.position.z = 0; } });
    if (KP.clearFx) KP.clearFx(); if (KP.modeClear) KP.modeClear(); if (KP.eventClear) KP.eventClear();
    (G.smokes || []).forEach(function (s) { if (s.vis) s.vis(true); }); if (G.smokes) G.smokes.length = 0;
  }
  function startMatch(mode, headless) {
    G.headless = !!headless; if (!headless) applyQuality();
    clearMatch();
    var M = mode === "chal" ? KP.chalMode(G.chalId || 0) : KP.MODES[mode], L = lvlInfo(PROG.xp).L, first = st("m") === 0;
    if (mode === "chal") { KP.MODES.chal = M; var cmap = KP.CHAL[M.chal].map; if (W3.map !== cmap) { switchMap(cmap, true); clearMatch(); } }
    if (M.rules === "pve" && W3.map !== "isle") { switchMap("isle", true); clearMatch(); }   // маяк есть только на тропическом острове
    var skillBase = first ? 0.12 : Math.min(0.8, 0.16 + 0.03 * (L - 1));   // сложность растёт с уровнем игрока
    G.botDmgMul = first ? 0.6 : Math.min(1, 0.62 + 0.02 * L);
    var names = KP.botNames().slice().sort(function () { return rnd() - 0.5; });
    var TS = M.team || 1;   // размер команды: 1 — соло, 3 — трио
    G.mods = mode === "event" ? KP.todayEvent() : null; G.grav = (G.mods && G.mods.grav) || 1; G.train = !!M.train;
    var p = KP.makeChar({ name: KP.t("you"), isPlayer: true, skin: PROG.skin, paint: KP.PAINTS[PROG.paint].c, team: 0 });
    G.player = p; p.wrap = PROG.wrap;
    if (showcase) { scene.remove(showcase.mesh); showcase = null; }
    if (G.auto || headless) p.ai = KP.makeAI("auto", G.autoSkill || 0.7);
    var types = first ? ["rookie", "rookie", "looter", "rookie", "sneaky", "looter"] : ["rookie", "looter", "rusher", "sniper", "builder", "sneaky", "looter", "rookie", "builder"];
    for (var i = 1; i < M.n; i++) {
      var team = Math.floor(i / TS), ally = team === 0 && !M.rules;
      var ty = M.botType || (ally ? "ally" : M.train ? "dummy" : types[Math.floor(rnd() * types.length)]);
      var sk = M.botSkill ? M.botSkill : M.rules === "pve" ? 0.7 : ally ? Math.min(0.85, 0.45 + 0.03 * L) : Math.max(0.05, Math.min(0.95, skillBase + (rnd() - 0.5) * 0.3 + (ty === "rookie" ? -0.15 : 0)));
      KP.makeChar({ name: names[i % names.length], skin: Math.floor(rnd() * KP.SKINS.length), paint: ally ? p.paint : KP.PAINTS[Math.floor(rnd() * 7)].c, ai: KP.makeAI(ty, sk), team: team, ally: ally && !p.ai });
    }
    G.teamSize = TS; G.nTeams = Math.ceil(M.n / TS);
    // лут
    world.lootSpots.forEach(function (s) {
      var P0 = s.poi >= 0 ? W3.POIS[s.poi] : null;
      if (rnd() < (P0 ? 0.7 : 0.4)) KP.spawnLoot(s.x, s.z, rnd() < 0.65 / ((P0 && P0.items) || 1) ? KP.randomWeapon(0, P0 && P0.bias) : KP.randomItem());
    });
    KP.spawnVehicles();
    // маршрут дирижабля
    var a = rnd() * Math.PI * 2, off = (rnd() - 0.5) * 100, px = -Math.sin(a), pz = Math.cos(a);
    G.plane = { ax: -Math.cos(a) * 230 + px * off, az: -Math.sin(a) * 230 + pz * off, bx: Math.cos(a) * 230 + px * off, bz: Math.sin(a) * 230 + pz * off, t: 0, y: 115 };
    G.plane.len = Math.hypot(G.plane.bx - G.plane.ax, G.plane.bz - G.plane.az);
    var leads = {};
    G.chars.forEach(function (c) {
      if (!c.ai) return;
      var lead = leads[c.team];
      KP.aiDropPlan(c, G.plane, lead ? lead.ai.land : null);
      if (lead) c.ai.dropAt = lead.ai.dropAt + 0.004 * (c.id % 3);
      else leads[c.team] = c;
    });
    KP.zoneInit(mode);
    if (!headless) { var an = W3.MAP.atmos; applyAtmos(G.forceAtmos || (M.train ? an[0] : an[Math.floor(rnd() * an.length)])); KP.audio.music(M.train ? "match" : "drop"); KP.audio.ambience(G.atmos); }
    if (M.train && !M.tutor) {   // тренировка: всё оружие, доски и предметы сразу, мишени-боты не стреляют, хмари нет
      p.slots = [{ id: 0 }, { id: 4, r: 2, mag: 25 }, { id: 3, r: 2, mag: 5 }, { id: 5, r: 2, mag: 4 }, { id: 6, r: 2, mag: 4 }];
      p.wood = 300; p.items.tube = 6; p.items.pal = 2; p.items.lac = 4; p.items.gren = 4; p.items.smoke = 3; p.items.pop = 3; p.hp = 100; p.sh = 50;
      G.plane.t = 0.35;
    }
    if (G.mods && G.mods.wood) G.chars.forEach(function (c) { c.wood = G.mods.wood; });
    if (M.rules) KP.modeSetup(M);
    KP.eventSetup(M, mode);
    G.spec = null; G.teamPlace = {}; G.killcam = null; G.rec = []; G.pveRes = null; G.chalRes = null; G.tutor = null; $("tut").style.display = "none"; G.locShown = -2; G.time = 0; G.zoneKO = 0; G.calmT = M.train || M.rules ? 0 : mode === "quick" ? 75 : 160; G.running = true; G.ended = false; G.paused = false; G.mode = mode; G.zoneAcc = 0; G.endT = 0;
    MATCH = { mode: mode, n: M.n, start: Date.now(), dmg0: 0 };
    IN.yaw = Math.atan2(G.plane.bx - G.plane.ax, G.plane.bz - G.plane.az); IN.pitch = -0.25; IN.fire = false; IN.aim = false; IN.jump = false;
    if (M.tutor) setupTutor(p);
    if (!headless) {
      show(null); $("hud").style.display = "block"; document.body.classList.add("inmatch");
      if (!M.train && !M.rules) toast(KP.t("jumpHint"), 5); else if (M.rules === "chal") toast(KP.t("chalHint_" + KP.CHAL[M.chal].t), 5); else if (M.rules) toast(KP.t(mode + "Hint"), 5);
      if (st("m") < 2 && !M.train) setTimeout(function () { if (G.running) toast(KP.t("tutorial"), 6); }, 6000);
      PF.setPlaying(true);
      planeMesh.visible = true;
      if (!isTouch) { lockPtr(); }
      feed = []; renderFeed();
    }
  }

  /* ---------- обучение новичка: 9 шагов на тренировочной площадке ---------- */
  var TUT = [
    function (p, s) { return Math.hypot(p.x - s.x, p.z - s.z) > 6; },
    function (p, s) { return Math.abs(Math.atan2(Math.sin(IN.yaw - s.yaw), Math.cos(IN.yaw - s.yaw))) > 1.2; },
    function (p) { return !!(p.slots[1] || p.slots[2] || p.slots[3] || p.slots[4]); },
    function (p) { return p.dmg > 0; },
    function (p) { return p.wood >= 10; },
    function (p) { return (p.built || 0) >= 2; },
    function (p) { return (p.heals || 0) >= 1; },
    function (p) { return (p.thrown || 0) >= 1; },
    function (p) { return p.state === "drive"; }
  ];
  function setupTutor(p) {
    var sx = 0, sz = 0;
    for (var a = 0; a < 80; a++) { var x = 38 + Math.cos(a) * a * 0.7, z = -20 + Math.sin(a) * a * 0.7; if (W3.height(x, z) > 1.5 && W3.slope(x, z) < 0.2 && !W3.query(x - 3, z - 3, x + 3, z + 3).length) { sx = x; sz = z; break; } }
    G.plane.t = 1; G.tutor = { i: 0, x: sx, z: sz, yaw: 0, doneT: 0 };
    G.chars.forEach(function (c, k) {
      var a2 = k * 2.1; c.state = "ground"; c.x = c.isPlayer ? sx : sx + Math.cos(a2) * 18; c.z = c.isPlayer ? sz : sz + Math.sin(a2) * 18; c.y = W3.height(c.x, c.z); if (c.mesh) c.mesh.visible = true;
    });
    p.wood = 0; p.hp = 60; p.items.tube = 2; p.items.gren = 2;
    G.tutor.yaw = IN.yaw;
    KP.spawnLoot(sx + Math.sin(IN.yaw) * 4, sz + Math.cos(IN.yaw) * 4, { t: "w", id: 4, r: 1 });
    if (G.vehicles && G.vehicles[0]) { var v = G.vehicles[0]; v.x = sx - 8; v.z = sz + 6; v.y = W3.height(v.x, v.z); }
    showTut();
  }
  function showTut() { var T = G.tutor; $("tut").style.display = "block"; $("tut").innerHTML = "<small>" + KP.t("tutStep", T.i + 1, TUT.length) + "</small>" + KP.t("tut" + (T.i + 1) + (isTouch ? "t" : "")); }
  function tutorStep(p) {
    var T = G.tutor; if (T.i >= TUT.length) { T.doneT += DT; if (T.doneT > 3.5 && G.running) { G.running = false; PF.setPlaying(false); menu(); } return; }
    if (TUT[T.i](p, T)) {
      T.i++; KP.sfx("chest", 0, 0, true);
      if (T.i >= TUT.length) {
        $("tut").innerHTML = KP.t("tutDone"); bigMsg(KP.t("tutDone"), 3);
        if (!PROG.tut) { PROG.tut = 1; PROG.xp += 100; PROG.pp2 = (PROG.pp2 || 0) + 100; KP.META.checkAch(PROG).forEach(function () { PROG.xp += 100; }); saveProg(); }
      } else showTut();
    }
  }
  function jumpOut(c) { if (c.isPlayer && !G.headless) KP.sfx("jump"); var P = G.plane; c.state = "fall"; c.x = P.ax + (P.bx - P.ax) * P.t; c.z = P.az + (P.bz - P.az) * P.t; c.y = P.y - 6; c.vy = 0; if (c.mesh) c.mesh.visible = true; }

  function step(dt) {
    if (!G.running || G.paused) return;
    G.time += dt;
    var P = G.plane, p = G.player;
    if (P.t < 1) {
      P.t = Math.min(1, P.t + 26 * dt / P.len);
      G.chars.forEach(function (c) {
        if (c.state !== "plane") return;
        if (c.ally) { if (p.state !== "plane" || P.t >= 0.97) jumpOut(c); }
        else if (c.ai && (!c.isPlayer || G.auto || G.headless)) { if (P.t >= c.ai.dropAt) jumpOut(c); }
        else if (IN.jump || P.t >= 0.97) jumpOut(c);
      });
      if (P.t >= 1) G.chars.forEach(function (c) { if (c.state === "plane") jumpOut(c); });
    }
    var Z = G.zone;
    G.zoneAcc += dt; var tick = G.zoneAcc >= 1; if (tick) G.zoneAcc -= 1;
    for (var i = 0; i < G.chars.length; i++) {
      var c = G.chars[i];
      if (c.state === "out") { c.outT += dt; continue; }
      if (c.state === "plane") continue;
      var ctrlAI = c.ai && (!c.isPlayer || G.auto || G.headless);
      if (c.state === "fall" || c.state === "glide") {
        var hx = 0, hz = 0;
        if (c.ally && p.state !== "plane") { c.ai.land = { x: p.x + (c.id % 2 ? 4 : -4), z: p.z + 3 }; }
        if (ctrlAI) { var dx = c.ai.land.x - c.x, dz = c.ai.land.z - c.z, L = Math.hypot(dx, dz); if (L > 2) { hx = dx / L; hz = dz / L; } }
        else { var f = inputDir(); hx = f[0]; hz = f[1]; c.yaw = IN.yaw; }
        var gh = W3.height(c.x, c.z);
        if (gh < -0.3) { var cl = Math.hypot(c.x, c.z) || 1; hx = hx * 0.5 - c.x / cl * 0.7; hz = hz * 0.5 - c.z / cl * 0.7; var hl = Math.hypot(hx, hz) || 1; hx /= hl; hz /= hl; }   // над морем зонтик сам тянет к острову
        if (c.state === "fall") { c.vy = -32; var sp = 18; c.x += hx * sp * dt; c.z += hz * sp * dt; if (c.y - Math.max(gh, 0) < 34) c.state = "glide"; }
        else { c.vy = -7; c.x += hx * 9 * dt; c.z += hz * 9 * dt; }
        var rr = Math.hypot(c.x, c.z); if (rr > 190) { c.x *= 190 / rr; c.z *= 190 / rr; }
        if (hx || hz) c.yaw = ctrlAI ? Math.atan2(hx, hz) : c.yaw;
        c.y += c.vy * dt;
        var g = KP.groundAt(c.x, c.z, c.y);
        if (c.y <= g) { c.y = g; c.vy = 0; c.state = "ground"; c.onGround = true; var bl = W3.query(c.x - 1, c.z - 1, c.x + 1, c.z + 1); if (bl.length) { c.mvx = c.mvz = 0; KP.moveChar(c, 0); } }
        continue;
      }
      // на земле
      c.bloom = Math.max(0, (c.bloom || 0) - dt * 2.2);
      if (c.state === "drive") {
        var v = c.veh;
        if (ctrlAI) {   // бот за рулём: думает как обычно, едет к цели
          c.ai.think -= dt; if (c.ai.think <= 0) { c.ai.think = 0.25; KP.aiThink(c); }
          var dr = KP.aiDrive(c, dt);
          if (dr.exit) { if (KP.exitVehicle(c)) continue; dr = { thr: 0, steer: 0 }; }
          KP.driveVehicle(v, dr.thr, dr.steer, dt);
        } else {
          var fw = IN.mz + (IN.keys.KeyW || IN.keys.ArrowUp ? 1 : 0) - (IN.keys.KeyS || IN.keys.ArrowDown ? 1 : 0), st2 = IN.mx + (IN.keys.KeyD || IN.keys.ArrowRight ? 1 : 0) - (IN.keys.KeyA || IN.keys.ArrowLeft ? 1 : 0);
          KP.driveVehicle(v, Math.max(-1, Math.min(1, fw)), -Math.max(-1, Math.min(1, st2)), dt);
        }
        c.x = v.x; c.z = v.z; c.y = v.y + v.T.h; c.yaw = v.yaw; c.mvx = v.mvx; c.mvz = v.mvz;
        if (tick && KP.outside(c)) KP.damage(c, Math.max(1, Z.dps || 1), null, "zone");
        if (!c.alive) KP.exitVehicle(c, true);
        continue;
      }
      c.cd = Math.max(0, c.cd - dt); c.swapT = Math.max(0, c.swapT - dt); if (c.swingT) c.swingT = Math.max(0, c.swingT - dt);
      if (c.reloadT > 0) { c.reloadT -= dt; if (c.reloadT <= 0) { c.reloadT = 0; var s = c.slots[c.cur]; if (s) s.mag = KP.WEAPONS[s.id].mag; } }
      if (c.healT > 0) { c.healT -= dt; if (c.healT <= 0) { var it = KP.ITEMS[c.healKind]; if (c.items[c.healKind] > 0) { c.items[c.healKind]--; if (it.hp) c.hp = Math.min(100, c.hp + it.hp); if (it.sh) c.sh = Math.min(100, c.sh + it.sh); c.heals = (c.heals || 0) + 1; } c.healT = 0; } }
      if (ctrlAI) KP.aiAct(c, dt);
      else playerControl(c, dt);
      if (c.rollT > 0) { c.rollT -= dt; c.mvx = c.rollX * 9; c.mvz = c.rollZ * 9; c.crouch = false; }
      KP.moveChar(c, dt); KP.vehicleBlock(c);
      if (tick && KP.outside(c)) KP.damage(c, Math.max(1, Z.dps || 1), null, "zone");
    }
    KP.updateProj(dt); KP.smokeTick(dt); KP.eventStep(dt); KP.trainStep(dt);
    if (!G.headless) { G.recT = (G.recT || 0) + dt; if (G.recT >= 0.1) { G.recT = 0; G.rec = G.rec || []; G.rec.push(G.chars.map(function (c) { return [c.x, c.y, c.z, c.yaw, c.alive && c.state !== "plane" ? 1 : 0]; })); if (G.rec.length > 40) G.rec.shift(); } }
    (G.vehicles || []).forEach(function (v) { if (!v.driver && Math.abs(v.speed) > 0.1) KP.driveVehicle(v, 0, 0, dt); });
    if (P.t > 0.05) KP.zoneUpdate(dt);
    for (var k = 0; k < G.loot.length; k++) if (G.loot[k].noPick > 0) G.loot[k].noPick -= dt;
    if (p.alive && p.state === "ground" && !p.ai) takeNear(p, false);
    if (!G.headless) {
      var aliveN = 0; for (var an2 = 0; an2 < G.chars.length; an2++) if (G.chars[an2].alive) aliveN++;
      KP.audio.music(G.train ? "match" : (Z.ph >= 4 || aliveN <= 6) ? "final" : p.state === "plane" || p.state === "fall" || p.state === "glide" ? "drop" : "match");
      if (p.state === "ground" && p.onGround && Math.hypot(p.mvx, p.mvz) > 1) { G.stepAcc = (G.stepAcc || 0) + Math.hypot(p.mvx, p.mvz) * dt; if (G.stepAcc > 1.7) { G.stepAcc = 0; KP.sfx("step", 0, 0, true); } }
    }
    IN.jump = false;
    if (G.tutor) tutorStep(p);
    if (G.train) {
      G.chars.forEach(function (c) {
        if (c.state === "out" && c.outT > 4 && !c.isPlayer) {
          var a = rnd() * 6.28; c.x = p.x + Math.cos(a) * 25; c.z = p.z + Math.sin(a) * 25; c.y = W3.height(c.x, c.z) + 0.2; c.vy = 0;
          c.alive = true; c.hp = 100; c.sh = 0; c.state = "ground"; c.outT = 0;
          if (c.mesh) { scene.remove(c.mesh); c.mesh = KP.charMesh(c.skin, c.paint); scene.add(c.mesh); KP.equip(c, 0); c.cur = -1; KP.equip(c, 0); }
        }
      });
      if (!p.alive) { p.alive = true; p.hp = 100; p.state = "ground"; if (p.mesh) { scene.remove(p.mesh); p.mesh = KP.charMesh(p.skin, p.paint); scene.add(p.mesh); p.cur = -1; KP.equip(p, 0); } }
      IN.jump = false; return;
    }
    // конец матча: командные и раундовые режимы — свои правила
    if (G.modeState) {
      if (!G.ended) { if (KP.modeStep(dt)) { G.ended = true; G.endT = G.time; if (!G.headless) { KP.sfx(G.win ? "win" : "lose", 0, 0, true); bigMsg(KP.t(G.win ? "win" : "lose"), 3); } } }
      else if (G.time - G.endT > (G.headless ? 0 : 2.6) && G.running) finishMatch();
      IN.jump = false; return;
    }
    if (!G.ended) {
      var teams = {}, nt = 0, alive = 0;
      G.chars.forEach(function (c) { if (c.alive) { alive++; if (!teams[c.team]) { teams[c.team] = 1; nt++; } } });
      var myAlive = !!teams[p.team];
      if (!myAlive && !(G.headless && G.fullSim && nt > 1)) { G.ended = true; G.win = false; G.endT = G.time; }
      else if (nt <= 1) { G.ended = true; G.win = myAlive; if (myAlive) p.place = 1; G.endT = G.time; if (!G.headless && myAlive) { KP.sfx("win", 0, 0, true); KP.audio.music("off"); bigMsg(KP.t("win"), 3); } }
      else if (G.time > 900) { G.ended = true; G.win = false; p.place = nt; G.endT = G.time; }
      // игрок выбит, команда ещё в игре — наблюдаем за союзником
      if (!p.alive && myAlive && !G.headless) { if (!G.spec || !G.spec.alive) { G.spec = null; G.chars.forEach(function (c) { if (c.alive && c.team === p.team && !G.spec) G.spec = c; }); } }
    } else if (G.time - G.endT > (G.headless ? 0 : G.killcam ? 3.8 : 2.6) && G.running) finishMatch();
  }
  function inputDir() {
    var f = IN.mz, r = IN.mx, k = IN.keys;
    if (k.KeyW || k.ArrowUp) f += 1; if (k.KeyS || k.ArrowDown) f -= 1; if (k.KeyD || k.ArrowRight) r += 1; if (k.KeyA || k.ArrowLeft) r -= 1;
    var L = Math.hypot(f, r); if (L > 1) { f /= L; r /= L; }
    var sy = Math.sin(IN.yaw), cy = Math.cos(IN.yaw);
    return [sy * f - cy * r, cy * f + sy * r];
  }
  function playerControl(p, dt) {
    var d = inputDir(), sp = (p.healT > 0 ? 2.8 : (IN.aim ? 4.2 : 6.2)) * (p.crouch ? 0.55 : 1);
    p.mvx = d[0] * sp; p.mvz = d[1] * sp; p.yaw = IN.yaw; p.aiming = IN.aim;
    if (IN.jump && p.onGround) { p.vy = 8.6; p.onGround = false; p.crouch = false; }
    if (IN.fire) {
      if (p.cur === 0) KP.fire(p, 0, 0, 0);
      else { var t = aimPoint(true); if (KP.fire(p, t.x, t.y, t.z)) { var ww = KP.WEAPONS[p.slots[p.cur].id]; IN.pitch = Math.min(0.95, IN.pitch + (ww.kick || 0) * 0.6); IN.yaw += (Math.random() - 0.5) * (ww.kick || 0) * 0.3; } }
    }
  }
  /* точка, куда смотрит прицел (луч от камеры) */
  var aimV = new THREE.Vector3();
  function camDir() { var cp = Math.cos(IN.pitch); return [Math.sin(IN.yaw) * cp, Math.sin(IN.pitch), Math.cos(IN.yaw) * cp]; }
  function aimPoint(assist) {
    var d = camDir(), o = camPos(), best = 260, i;
    for (i = 0; i < G.chars.length; i++) {
      var c = G.chars[i]; if (c === G.player || !c.alive || c.state === "plane") continue;
      var wx = c.x - o[0], wy = c.y + 1.05 - o[1], wz = c.z - o[2], t = wx * d[0] + wy * d[1] + wz * d[2];
      if (t < 0 || t > best) continue;
      var qx = wx - d[0] * t, qy = wy - d[1] * t, qz = wz - d[2] * t;
      if (qx * qx + qy * qy + qz * qz < 0.8) best = t;
    }
    var ex = o[0] + d[0] * 260, ey = o[1] + d[1] * 260, ez = o[2] + d[2] * 260;
    var bx = world.boxes.concat(G.buildList);
    for (i = 0; i < bx.length; i++) { var tb = KP.segBox(o[0], o[1], o[2], ex, ey, ez, bx[i]); if (tb >= 0 && tb * 260 < best && tb * 260 > 1.5) best = tb * 260; }
    for (var s = 3; s < best; s += 1.5) { if (W3.height(o[0] + d[0] * s, o[2] + d[2] * s) > o[1] + d[1] * s) { best = s; break; } }
    var pt = { x: o[0] + d[0] * best, y: o[1] + d[1] * best, z: o[2] + d[2] * best };
    if (assist && isTouch) {   // мягкая доводка на телефоне
      var p = G.player, w = p.slots[p.cur], rng = w ? KP.WEAPONS[w.id].rng : 3, ba = 0.09, tgt = null;
      G.chars.forEach(function (c) {
        if (c === p || !c.alive || c.state !== "ground") return;
        var vx = c.x - o[0], vy = c.y + 1 - o[1], vz = c.z - o[2], L = Math.sqrt(vx * vx + vy * vy + vz * vz); if (L > rng) return;
        var ang = Math.acos(Math.max(-1, Math.min(1, (vx * d[0] + vy * d[1] + vz * d[2]) / L)));
        if (ang < ba) { ba = ang; tgt = c; }
      });
      if (tgt) pt = { x: tgt.x, y: tgt.y + 1, z: tgt.z };
    }
    return pt;
  }
  function camPos() {
    var p = G.spec && !G.player.alive ? G.spec : G.player, d = camDir();
    if (!p || p.state === "plane") { var P = G.plane; return [P.ax + (P.bx - P.ax) * P.t - d[0] * 34, P.y + 16 - d[1] * 34, P.az + (P.bz - P.az) * P.t - d[2] * 34]; }
    var dist = p.state === "ground" ? (IN.aim ? (zoomW() ? 1.4 : 2.3) : 4.1) : p.state === "drive" ? 6 : 7.5, sh = p.state === "ground" ? 0.72 : 0;
    var rx = -Math.cos(IN.yaw), rz = Math.sin(IN.yaw);
    var x = p.x - d[0] * dist + rx * sh, y = p.y + 1.72 - d[1] * dist, z = p.z - d[2] * dist + rz * sh;
    // камера не уходит в стены: луч от плеча бойца до камеры против домов и построек
    var ox = p.x + rx * sh * 0.5, oy = p.y + 1.72, oz = p.z + rz * sh * 0.5, best = 1;
    var near = W3.query(Math.min(ox, x) - 1, Math.min(oz, z) - 1, Math.max(ox, x) + 1, Math.max(oz, z) + 1);
    for (var i = 0; i < near.length; i++) {
      var c = near[i]; if (c.r) continue;
      var bb = { x0: c.x0 - 0.25, x1: c.x1 + 0.25, y0: c.y0, y1: (c.kind === "ramp" ? c.base + 4 : c.y1) + 0.25, z0: c.z0 - 0.25, z1: c.z1 + 0.25 };
      var t = KP.segBox(ox, oy, oz, x, y, z, bb); if (t >= 0 && t < best) best = t;
    }
    if (best < 1) { best = Math.max(0.12, best - 0.05); x = ox + (x - ox) * best; y = oy + (y - oy) * best; z = oz + (z - oz) * best; }
    var g = W3.height(x, z) + 0.4; if (y < g) y = g;
    return [x, y, z];
  }

  /* ---------- конец матча и опыт ---------- */
  function finishMatch() {
    G.running = false;
    var p = G.player, N = G.teamSize > 1 ? G.nTeams : MATCH.n, win = G.win, place = win ? 1 : Math.min(N, (G.teamPlace && G.teamPlace[p.team]) || p.place || N);
    var sec = Math.round(G.endT);
    var xpPlace = Math.round(100 * (N - place) / (N - 1)), xpKo = p.kos * 25, xpWin = win ? 100 : 0, xpTime = Math.floor(sec / 6);
    var gain = Math.round((xpPlace + xpKo + xpWin + xpTime) * ((G.mods && G.mods.xp) || 1)) + (G.pveRes ? G.pveRes.xp : 0);
    if (G.chalRes) { PROG.chal = PROG.chal || {}; var old = PROG.chal[G.chalRes.id] || 0; G.chalRes.isNew = Math.max(0, G.chalRes.stars - old); PROG.chal[G.chalRes.id] = Math.max(old, G.chalRes.stars); gain = 20 + G.chalRes.isNew * 60 + p.kos * 5; }
    var res = { win: win, place: place, n: N, kos: p.kos, dmg: Math.round(p.dmg), sec: sec, gain: gain, built: p.built, chests: p.chests || 0, thrown: p.thrown || 0, driven: p.driven || 0, heals: p.heals || 0, crystals: p.crystals || 0, drops: p.drops || 0 };
    G.lastRes = res;
    if (G.headless) return;
    var L0 = lvlInfo(PROG.xp).L, T0 = KP.META.passTier(PROG).tier, before = KP.META.openList(PROG);
    var q = KP.META.applyMatch(PROG, res);
    res.quests = q.done; res.qxp = q.xp;
    PROG.xp += gain + q.xp; PROG.pp2 = (PROG.pp2 || 0) + gain + q.xp;
    PROG.st.m = st("m") + 1; if (win) PROG.st.w = st("w") + 1; PROG.st.ko = st("ko") + p.kos; PROG.st.dmg = st("dmg") + res.dmg;
    PROG.st.kmax = Math.max(st("kmax"), p.kos); PROG.st.bp = Math.max(st("bp"), 100 - place);
    if (place <= 5) PROG.st.t5 = st("t5") + 1; PROG.st.chests = st("chests") + res.chests; PROG.st.built = st("built") + (p.built || 0);
    PROG.st.time = st("time") + sec; PROG.st.drv = st("drv") + Math.round(res.driven);
    if (win) PROG.ch.win = 1; if (p.kos >= 5) PROG.ch.ko5 = 1; if (st("w") >= 10) PROG.ch.win10 = 1;
    PROG.st.thr = st("thr") + res.thrown; PROG.st.cryst = st("cryst") + res.crystals; PROG.st.drops = st("drops") + res.drops;
    if (win) { var wkey = { trio: "wTrio", cap: "wCap", tdm: "wTdm", lr: "wLr" }[G.mode]; if (wkey) PROG.st[wkey] = st(wkey) + 1; if (W3.map === "frost") PROG.st.wFrost = st("wFrost") + 1; }
    PROG.ws = PROG.ws || {};
    Object.keys(p.koW || {}).concat(Object.keys(p.dmgW || {})).forEach(function (w) { var o = PROG.ws[w] = PROG.ws[w] || { k: 0, d: 0 }; o.k += (p.koW && p.koW[w]) || 0; o.d += Math.round((p.dmgW && p.dmgW[w]) || 0); });
    Object.keys(p.dmgW || {}).forEach(function (w) { PROG.ws[w].k -= 0; });
    if (G.chalRes) res.chal = G.chalRes;
    if (G.pveRes) { res.pve = G.pveRes; PROG.st.pveWave = Math.max(st("pveWave"), G.pveRes.waves); PROG.st.pveStars = Math.max(st("pveStars"), G.pveRes.stars); }
    res.ach = KP.META.checkAch(PROG); res.ach.forEach(function () { PROG.xp += 100; PROG.pp2 = (PROG.pp2 || 0) + 100; });
    var L1 = lvlInfo(PROG.xp).L, T1 = KP.META.passTier(PROG).tier, after = KP.META.openList(PROG);
    saveProg();
    res.newLvl = L1 > L0 ? L1 : 0; res.newTier = T1 > T0 ? T1 : 0;
    res.unl = after.filter(function (x) { return before.indexOf(x) < 0; }).map(KP.META.itemName);
    PF.setPlaying(false);
    if (document.pointerLockElement) document.exitPointerLock();
    showResults(res);
  }


  /* ---------- события для интерфейса ---------- */
  var feed = [];
  KP.onKO = function (ch, by, kind) {
    if (kind === "zone" || !by) G.zoneKO = (G.zoneKO || 0) + 1;
    if (G.headless) return;
    var s = kind === "zone" || !by ? KP.t("koZone", ch.name) : KP.t("ko", by.name, ch.name);
    feed.unshift({ s: s, t: G.time, me: ch.isPlayer || (by && by.isPlayer) }); if (feed.length > 4) feed.pop(); renderFeed();
    if (by && by.isPlayer && ch !== by) { bigMsg(KP.t("youKo", ch.name), 1.6); KP.sfx("ko"); }
    if (by && by.ai && !by.isPlayer && Math.random() < 0.3) by.emote = { anim: KP.META.EMOTES[Math.floor(Math.random() * KP.META.EMOTES.length)].anim, t: 0 };
    if (ch.isPlayer && by && by !== ch && !by.isDrone && by.id !== undefined && G.rec && G.rec.length > 5) G.killcam = { by: by.id, me: ch.id, t0: G.time, frames: G.rec.slice(-32), wname: ch.koWid !== undefined && KP.WEAPONS[ch.koWid] ? KP.t("w" + ch.koWid) : "", hp: Math.max(0, Math.round(by.hp)) };
    if (ch.isPlayer) { bigMsg(KP.t("lose"), 2.5); KP.sfx("lose", 0, 0, true); if (by && by !== ch) toast(KP.t("byWho", by.name), 3); }
  };
  KP.onHit = function (ch, d, by, kind) {
    if (G.headless) return;
    if (by && by.isPlayer && ch !== by) { dmgNum(ch, d); KP.sfx(ch.sh > 0 ? "hitShield" : "hit", 0, 0, true); var hm = $("hitm"); hm.classList.remove("on"); void hm.offsetWidth; hm.classList.add("on"); }
    if (ch.isPlayer) { var v = $("vig"); v.classList.remove("on"); void v.offsetWidth; v.classList.add("on"); if (kind !== "zone") KP.sfx("hurt"); if (by && by !== ch) dirMark(by); }
  };
  KP.onZone = function () { if (!G.headless) { toast(KP.t("zoneMove", ""), 3); KP.sfx("zone"); } };
  function renderFeed() { $("feed").innerHTML = feed.map(function (f) { return "<div" + (f.me ? " class=me" : "") + ">" + esc(f.s) + "</div>"; }).join(""); }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  var nums = [], numI = 0;
  function dmgNum(ch, d) {
    var el = nums[numI]; if (!el) { el = document.createElement("div"); el.className = "dnum"; $("hud").appendChild(el); nums[numI] = el; }
    numI = (numI + 1) % 10;
    el.textContent = Math.round(d); el.userData = { x: ch.x + (rnd() - 0.5) * 0.6, y: ch.y + 2.2, z: ch.z, t: 0.9 }; el.style.display = "block";
    el.style.color = ch.sh > 0 ? "#7ee8fa" : "#ffffff";
  }
  function dirMark(by) {
    var a = Math.atan2(by.x - G.player.x, by.z - G.player.z) - IN.yaw, el = $("dirm");
    el.style.transform = "translate(-50%,-50%) rotate(" + (-a) + "rad)"; el.classList.remove("on"); void el.offsetWidth; el.classList.add("on");
  }
  var toastT = 0;
  function toast(s, sec) { var el = $("toast"); el.textContent = s; el.style.opacity = 1; toastT = sec || 2; }
  var msgT = 0;
  function bigMsg(s, sec) { var el = $("msg"); el.textContent = s; el.style.opacity = 1; el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); msgT = sec || 2; }

  /* ---------- мини-карта ---------- */
  var mini, miniCtx, miniBase, miniT = 0;
  function buildMinimapBase() {
    mini = $("mini"); miniCtx = mini.getContext("2d");
    miniBase = document.createElement("canvas"); miniBase.width = miniBase.height = W3.N;
    var c = miniBase.getContext("2d"), img = c.createImageData(W3.N, W3.N);
    for (var i = 0; i < W3.N; i++) for (var j = 0; j < W3.N; j++) {
      var h = W3.H[i * W3.N + j], o = (i * W3.N + j) * 4, col = W3.MAP.desert ? (h < -0.3 ? [42, 138, 154] : h < 0.8 ? [217, 183, 126] : h > 9 ? [168, 87, 58] : [212, 176, 118]) : W3.MAP.winter ? (h < -0.3 ? [42, 95, 120] : h < 0.5 ? [180, 214, 228] : h > 13 ? [120, 128, 136] : [226, 233, 238]) : (h < -0.3 ? [29, 110, 135] : h < 1.0 ? [205, 182, 138] : h > 13 ? [140, 136, 128] : [84, 128, 62]);
      img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
    }
    c.putImageData(img, 0, 0);
    world.boxes.forEach(function (b) { c.fillStyle = "#d9d4c8"; c.fillRect((b.x0 + 220) / 4, (b.z0 + 220) / 4, Math.max(1, (b.x1 - b.x0) / 4), Math.max(1, (b.z1 - b.z0) / 4)); });
  }
  var mapOn = false;
  function toggleMap(on) {
    mapOn = on === undefined ? !mapOn : on; if (!G.running) mapOn = false;
    $("bigmap").style.display = mapOn ? "block" : "none"; if (mapOn) drawBig();
  }
  function drawBig() {
    var cv = $("bigmap"), S = Math.min(window.innerWidth, window.innerHeight) * 0.86, ctx = cv.getContext("2d");
    cv.width = cv.height = Math.round(S); cv.style.width = cv.style.height = Math.round(S) + "px";
    var save = mini; mini = cv; miniCtx = ctx; drawMini(true); mini = save; miniCtx = save.getContext("2d");
  }
  function drawMini(big) {
    var S = mini.width, k = S / 440, ctx = miniCtx, Z = G.zone, p = G.player;
    ctx.clearRect(0, 0, S, S); ctx.imageSmoothingEnabled = true; ctx.drawImage(miniBase, 0, 0, S, S);
    function X(x) { return (x + 220) * k; }
    ctx.save(); ctx.fillStyle = "rgba(90,90,110,0.45)"; ctx.beginPath(); ctx.rect(0, 0, S, S); ctx.arc(X(Z.cx), X(Z.cz), Z.r * k, 0, 6.3, true); ctx.fill(); ctx.restore();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X(Z.tx), X(Z.tz), Math.max(1, Z.tr * k), 0, 6.3); ctx.stroke();
    var P = G.plane; if (P && P.t < 1) { ctx.strokeStyle = "rgba(255,80,160,0.9)"; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(X(P.ax), X(P.az)); ctx.lineTo(X(P.bx), X(P.bz)); ctx.stroke(); ctx.setLineDash([]); }
    W3.POIS.forEach(function (q) { ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.font = "bold " + (big ? Math.round(S / 45) : 8) + "px sans-serif"; ctx.textAlign = "center"; ctx.fillText(KP.t(q.key), X(q.x), X(q.z) - 3); });
    G.chars.forEach(function (c) { if (c !== p && c.alive && c.team === p.team && c.state !== "plane") { ctx.fillStyle = "#2fd6ff"; ctx.beginPath(); ctx.arc(X(c.x), X(c.z), 3.2, 0, 6.3); ctx.fill(); } });
    if (KP.modeMini) KP.modeMini(ctx, X, k); KP.eventMini(ctx, X);
    if (W3.RAIL) { ctx.strokeStyle = "rgba(60,40,30,.8)"; ctx.lineWidth = 1.5; ctx.beginPath(); W3.RAIL.pts.forEach(function (q, qi) { if (qi) ctx.lineTo(X(q[0]), X(q[1])); else ctx.moveTo(X(q[0]), X(q[1])); }); ctx.closePath(); ctx.stroke(); KP.trainPos().forEach(function (c, ci) { ctx.fillStyle = ci ? "#8a6a4c" : "#c43b32"; ctx.fillRect(X(c.x) - 2.5, X(c.z) - 2.5, 5, 5); }); }
    var px = p.state === "plane" ? P.ax + (P.bx - P.ax) * P.t : p.x, pz = p.state === "plane" ? P.az + (P.bz - P.az) * P.t : p.z;
    ctx.save(); ctx.translate(X(px), X(pz)); ctx.rotate(-IN.yaw + Math.PI);
    ctx.fillStyle = "#ffe14d"; ctx.strokeStyle = "#222"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4.5, 5); ctx.lineTo(-4.5, 5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }

  /* ---------- отрисовка ---------- */
  var v3 = new THREE.Vector3();
  function render(dt) {
    var p = G.player;
    if (G.running || G.ended) {
      if (G.auto && p && p.state !== "plane") { IN.yaw += Math.atan2(Math.sin(p.yaw - IN.yaw), Math.cos(p.yaw - IN.yaw)) * Math.min(1, dt * 4); IN.pitch = -0.15; }
      var cp = camPos(), d = camDir();
      if (G.debugFront && p) { cp = [p.x + Math.sin(p.yaw) * 3, p.y + 1.5, p.z + Math.cos(p.yaw) * 3]; d = [-Math.sin(p.yaw), -0.08, -Math.cos(p.yaw)]; }
      camera.position.set(cp[0], cp[1], cp[2]); camera.lookAt(cp[0] + d[0], cp[1] + d[1], cp[2] + d[2]);
      var fov = IN.aim && p && p.state === "ground" ? (zoomW() ? 22 : 55) : 70;
      if (Math.abs(camera.fov - fov) > 0.1) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 12); camera.updateProjectionMatrix(); }
    } else if (G.menuView === "ward" && showcase && showcaseSpot) {
      // 3D-просмотр: бойца можно крутить пальцем/мышью и приближать колесом; без касаний он медленно поворачивается сам
      if (!wardDrag.on && performance.now() - wardDrag.last > 2500) wardDrag.yaw += dt * 0.4;
      showcase.mesh.rotation.y = wardDrag.yaw;
      var land = window.innerWidth > window.innerHeight, zd = wardDrag.zoom;
      if (land) { camera.position.set(showcaseSpot.x - 1.6 * zd, showcaseSpot.y + 1.35, showcaseSpot.z + 4.6 * zd); camera.lookAt(showcaseSpot.x - 1.1 * zd, showcaseSpot.y + 0.95, showcaseSpot.z); }
      else { camera.position.set(showcaseSpot.x, showcaseSpot.y + 1.0, showcaseSpot.z + 5.4 * zd); camera.lookAt(showcaseSpot.x, showcaseSpot.y + 0.15, showcaseSpot.z); }
      if (camera.fov !== 45) { camera.fov = 45; camera.updateProjectionMatrix(); }
      if (showcaseEmote > 0) { showcaseEmote -= dt; emotePose(showcase.mesh, KP.META.EMOTES[PROG.emote].anim, 2.5 - showcaseEmote); } else emotePose(showcase.mesh, null, 0);
    } else {   // меню: камера кружит над островом
      var a = performance.now() / 22000;
      camera.position.set(Math.cos(a) * 70, 26, Math.sin(a) * 70); camera.lookAt(0, 6, 0); scene.fog.far = 320;
      if (camera.fov !== 60) { camera.fov = 60; camera.updateProjectionMatrix(); }
    }
    var cx = camera.position.x, cz = camera.position.z;
    G.chars.forEach(function (c) {
      var m = c.mesh; if (!m) return;
      if (c.state === "plane") { m.visible = false; return; }
      if (c.state === "out") { var lift = Math.max(0, c.outT - 0.6); m.position.y = c.y + lift * lift * 2.2; m.visible = c.outT < 4; if (m.userData.drone) m.userData.drone.rotation.y += dt * 9; return; }
      var md = Math.abs(c.x - cx) + Math.abs(c.z - cz), far = md > 210; m.visible = !far;
      var lod = md > 75 && !G.killcam;   // дальний боец: только тело (меньше вызовов отрисовки)
      if (m.userData.lod !== lod) { m.userData.lod = lod; var PP = m.userData.parts; PP.arms.visible = !lod; PP.acc.visible = !lod; PP.legs[0].visible = PP.legs[1].visible = !lod; }
      if (far) return;
      m.position.set(c.x, c.y, c.z); m.rotation.y = c.yaw;
      var P = m.userData.parts, sw = c.state === "ground" ? Math.sin(c.walk) * 0.6 : 0.3;
      var moving = Math.hypot(c.mvx, c.mvz) > 0.5 && c.state === "ground";
      if (c.state === "drive") { P.legs[0].rotation.x = P.legs[1].rotation.x = -1.3; P.arms.rotation.x = 0.5; P.umb.visible = false; m.rotation.x = 0; return; }
      P.legs[0].rotation.x = moving ? sw : (c.state === "ground" ? 0 : 0.35); P.legs[1].rotation.x = moving ? -sw : (c.state === "ground" ? 0 : -0.2);
      P.umb.visible = c.state === "glide";
      m.rotation.x = c.state === "fall" ? 0.75 : 0;
      P.shadow.visible = c.state === "ground" && QL < 2;
      var pitch = c.isPlayer && !G.auto ? IN.pitch : (c.aimPt ? Math.atan2(c.aimPt.y - c.y - 1.4, Math.hypot(c.aimPt.x - c.x, c.aimPt.z - c.z)) : 0);
      c.kick = Math.max(0, (c.kick || 0) - dt * 0.35);
      P.arms.rotation.x = c.swingT ? -1.6 * c.swingT * 4 + 0.6 : (c.reloadT > 0 ? 0.55 : (c.healT > 0 ? 0.8 : -pitch * 0.8 - c.kick * 3)) + (moving ? Math.sin(c.walk * 2) * 0.04 : 0);
      P.arms.position.y = 1.45 + (moving ? Math.abs(Math.sin(c.walk)) * 0.03 : 0);
      m.userData.yoff = 0; m.userData.spin = 0; m.rotation.z = 0;
      if (c.rollT > 0) { m.rotation.x = (1 - c.rollT / 0.55) * Math.PI * 2; m.userData.yoff = -0.35 * Math.sin((1 - c.rollT / 0.55) * Math.PI); P.legs[0].rotation.x = P.legs[1].rotation.x = -1.2; }
      else if (c.crouch && c.state === "ground") { P.legs[0].rotation.x = -0.75 + (moving ? sw * 0.4 : 0); P.legs[1].rotation.x = -0.75 - (moving ? sw * 0.4 : 0); m.userData.yoff = -0.32; }
      if (c.reloadT > 0) P.hand.rotation.z = Math.sin(c.reloadT * 9) * 0.35; else P.hand.rotation.z = 0;
      if (c.emote) { c.emote.t += dt; if (c.emote.t > 2.6 || moving || c.cd > 0.05) c.emote = null; else emotePose(m, c.emote.anim, c.emote.t); }
      m.position.y = c.y + (m.userData.yoff || 0); if (m.userData.spin) m.rotation.y = c.yaw + m.userData.spin;
      if (p && c !== p && c.team === p.team && G.teamSize > 1) {   // метка союзника над головой
        if (!m.userData.tag) { m.userData.tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: KP.tex().glow, color: "#2fd6ff", depthTest: false, transparent: true })); m.userData.tag.position.y = 2.35; m.userData.tag.scale.set(0.45, 0.45, 0.45); m.add(m.userData.tag); }
        m.userData.tag.visible = true;
      } else if (m.userData.tag) m.userData.tag.visible = false;
    });
    G.loot.forEach(function (it) { if (!it.mesh) return; var vis = Math.abs(it.x - cx) + Math.abs(it.z - cz) < 75; it.mesh.visible = vis; if (vis) it.mesh.userData.spin.rotation.y += dt * 1.6; });
    G.buildList.forEach(function (b) {
      var m = b.mesh; if (!m) return;
      if (m.userData.grow < 1) { m.userData.grow = Math.min(1, m.userData.grow + dt * 6); var s = 0.2 + 0.8 * m.userData.grow; m.scale.set(s, s, s); }
      if (m.userData.shake > 0) { m.userData.shake -= dt; m.position.x = b.cx + (rnd() - 0.5) * 0.1; } else m.position.x = b.cx;
    });
    if (G.zone) { zoneMesh.visible = (G.running || G.ended) && G.zone.r < 185; zoneMesh.scale.set(Math.max(0.5, G.zone.r), 1, Math.max(0.5, G.zone.r)); zoneMesh.position.x = G.zone.cx; zoneMesh.position.z = G.zone.cz; }
    else zoneMesh.visible = false;
    if (G.plane && planeMesh.visible) {
      var P2 = G.plane; planeMesh.position.set(P2.ax + (P2.bx - P2.ax) * P2.t, P2.y, P2.az + (P2.bz - P2.az) * P2.t);
      planeMesh.rotation.y = Math.atan2(P2.bx - P2.ax, P2.bz - P2.az); if (P2.t >= 1) planeMesh.visible = false;
    }
    if (millBlades) millBlades.rotation.z += dt * 0.8;
    KP.renderVehicles(); if (KP.modeRender) KP.modeRender(dt); KP.eventRender(dt); KP.trainRender(dt, !G.running);
    if (aurora && aurora.visible) { aurora.material.uniforms.t.value = performance.now() / 1000; aurora.position.set(camera.position.x, 0, camera.position.z); }
    if (beacon) beacon.material.opacity = 0.55 + 0.45 * Math.sin(performance.now() / 400);
    sky.position.copy(camera.position); KP.audio.listener(camera.position.x, camera.position.z, IN.yaw);
    if (SET.q === "high") { var fp = p && (G.running || G.ended) ? p : { x: 0, y: 0, z: 0 }; sun.target.position.set(fp.x, fp.y, fp.z); sun.position.set(fp.x + SUN_DIR.x * 120, fp.y + SUN_DIR.y * 120, fp.z + SUN_DIR.z * 120); }
    KP.chests.forEach(function (c) { if (c.mesh && c.mesh.userData.beam) c.mesh.userData.beam.visible = !c.open; });
    KP.updateFx(dt);
    // туман серее в хмари
    var out = p && G.running && p.alive && p.state === "ground" && KP.outside(p);
    var tgt = out ? GREY : FOGC; scene.fog.color.lerp(tgt, Math.min(1, dt * 3)); scene.background.copy(scene.fog.color);
    scene.fog.near = out ? 8 : (atm.rain ? 25 : 45); sky.visible = !out;
    if (rain && rain.visible) {
      rain.position.set(camera.position.x, camera.position.y - 8, camera.position.z);
      var rp = rain.geometry.attributes.position, ra = rp.array, snowy = rain.userData.snow, dusty = rain.userData.dust, fallD = dt * (snowy ? 3 : dusty ? 1.2 : 26), tt = performance.now() / 1000;
      for (var ri = 0; ri < ra.length; ri += 6) {
        ra[ri + 1] -= fallD; ra[ri + 4] -= fallD;
        if (dusty) { ra[ri] += dt * 22; if (ra[ri] > 25) ra[ri] -= 50; ra[ri + 3] = ra[ri] + 1.4; ra[ri + 4] = ra[ri + 1] - 0.05; ra[ri + 5] = ra[ri + 2]; }
        else if (snowy) { var sw = Math.sin(tt + ri) * dt * 0.6; ra[ri] += sw; ra[ri + 3] = ra[ri] + 0.06; ra[ri + 4] = ra[ri + 1] - 0.08; ra[ri + 5] = ra[ri + 2]; }
        if (ra[ri + 4] < 0) { ra[ri + 1] += 24; ra[ri + 4] += 24; }
      }
      rp.needsUpdate = true;
    }
    $("grey").style.opacity = out ? 1 : 0;
    var kc = G.killcam, kt = kc ? G.time - kc.t0 : 99;
    if (kc && kt < 3.3) {   // повтор: последние 3 с глазами выбившего
      var fr = kc.frames[Math.min(kc.frames.length - 1, Math.floor(kt / 0.1))];
      G.chars.forEach(function (c, ci) { var f = fr[ci]; if (!f || !c.mesh) return; c.mesh.visible = !!f[4] || ci === kc.me; c.mesh.position.set(f[0], f[1], f[2]); c.mesh.rotation.y = f[3]; c.mesh.rotation.x = 0; });
      var kf = fr[kc.by], vf = fr[kc.me];
      if (kf && vf) { var ka = Math.atan2(vf[0] - kf[0], vf[2] - kf[2]); camera.position.set(kf[0] - Math.sin(ka) * 3.2 - Math.cos(ka) * 0.8, kf[1] + 2.1, kf[2] - Math.cos(ka) * 3.2 + Math.sin(ka) * 0.8); camera.lookAt(vf[0], vf[1] + 1.1, vf[2]); }
      $("kcam").style.display = "block"; setHTML("kcam", "<b>" + KP.t("replay") + "</b>" + esc(G.chars[kc.by].name) + (kc.wname ? " · " + esc(kc.wname) : "") + " · " + KP.t("hpLeft", kc.hp));
    } else if ($("kcam").style.display !== "none") $("kcam").style.display = "none";
    renderer.render(scene, camera);
    nums.forEach(function (el) {
      if (!el || el.style.display === "none") return; var u = el.userData; u.t -= dt; u.y += dt * 1.5;
      if (u.t <= 0) { el.style.display = "none"; return; }
      v3.set(u.x, u.y, u.z).project(camera);
      if (v3.z > 1) { el.style.display = "none"; return; }
      el.style.transform = "translate(" + ((v3.x + 1) / 2 * window.innerWidth) + "px," + ((1 - v3.y) / 2 * window.innerHeight) + "px)"; el.style.opacity = Math.min(1, u.t * 2);
    });
  }

  /* ---------- HUD ---------- */
  var hudCache = {};
  /* картинки Художника (KP.ART из art.js); нет картинки — прежний цветной кружок */
  function hasArt(n) { return !!(KP.ART && KP.ART.icons && KP.ART.icons.indexOf(n) >= 0); }
  function icA(n, col) { return hasArt(n) ? "<img class=ici src='img/" + n + ".webp' alt=''>" : "<i class=ic style='background:" + col + "'></i>"; }
  var GREN_ART = { gren: "g_paint", smoke: "g_smoke", pop: "g_wall" };
  var WRAP_ART = { 1: "wrap_neon", 2: "wrap_camo", 6: "wrap_gold", 7: "wrap_splash" };   // образцы Художника для «Неон», «Камуфляж», «Золото», «Призма»
  /* значки на сенсорных кнопках и кнопке пропуска: класс на body, сами картинки — в CSS (body.art_ui_fire и т. п.) */
  function artBodyClasses() { ["ui_fire", "ui_jump", "ui_reload", "ui_heal", "ui_wall", "ui_ramp", "ui_pass", "g_paint", "g_smoke", "g_wall", "i_chest", "v_quad"].forEach(function (n) { document.body.classList.toggle("art_" + n, hasArt(n)); }); }
  function setTxt(id, s) { if (hudCache[id] !== s) { hudCache[id] = s; $(id).textContent = s; } }
  function setHTML(id, s) { if (hudCache[id] !== s) { hudCache[id] = s; $(id).innerHTML = s; } }
  function fmt(sec) { sec = Math.ceil(sec); return Math.floor(sec / 60) + ":" + ("0" + sec % 60).slice(-2); }
  function updateHud(dt) {
    var p = G.player; if (!p || !G.running) return;
    $("hpFill").style.width = Math.max(0, p.hp) + "%"; $("shFill").style.width = p.sh + "%";
    setTxt("hpTxt", Math.ceil(Math.max(0, p.hp)) + (p.sh > 0 ? " + " + Math.ceil(p.sh) : ""));
    setHTML("wood", icA("ui_wood", "#c49a66") + p.wood);
    var alive = 0; G.chars.forEach(function (c) { if (c.alive) alive++; });
    setTxt("alive", KP.t("alive", alive)); setTxt("kos", KP.t("kos", p.kos));
    var mh = KP.modeHud && KP.modeHud();
    var Z = G.zone, zt = mh ? mh : G.train ? KP.t("trainHud") : Z.final ? KP.t("zoneFinal") : Z.shrinking ? KP.t("zoneMove", fmt(KP.zoneLeft())) : KP.t("zoneWait", fmt(KP.zoneLeft()));
    setTxt("zoneTxt", zt); $("zoneTxt").classList.toggle("warn", Z.shrinking);
    var s = p.slots[p.cur], w = s ? KP.WEAPONS[s.id] : KP.WEAPONS[0];
    setHTML("ammo", w.melee ? KP.t("w0") : (p.reloadT > 0 ? "<small>" + KP.t("reloading") + "</small>" : s.mag + " <small>/ " + w.mag + "</small>"));
    var sl = "";
    for (var i = 0; i < 5; i++) {
      var x = p.slots[i], cls = "slot" + (i === p.cur ? " cur" : "") + (x ? "" : " empty"), col = x && i ? KP.RAR[x.r].c : "#ffffff";
      sl += i + ":" + (x ? x.id + "." + (x.r || 0) : "-") + (i === p.cur ? "*" : "") + ";";
      var el = $("slot" + i); el.className = cls; el.style.borderColor = x ? col : "rgba(255,255,255,0.25)";
      var lab = x ? KP.t("w" + x.id) : "", key = "sl" + i + lab; if (hudCache["slt" + i] !== key) { hudCache["slt" + i] = key; el.innerHTML = "<b>" + (i + 1) + "</b>" + (x && hasArt("w_" + x.id) ? "<img class=wimg src='img/w_" + x.id + ".webp' alt='' onerror=\"this.remove()\">" : "") + "<span>" + lab + "</span>"; }
    }
    if (G.teamSize > 1 && G.teamSize <= 3) {
      var th = ""; G.chars.forEach(function (c) { if (c !== p && c.team === p.team) th += "<div class=tm" + (c.alive ? "" : " dead") + "><span>" + esc(c.name) + "</span><i style='width:" + Math.max(0, c.hp) * 0.6 + "px'></i><u style='width:" + c.sh * 0.6 + "px'></u></div>"; });
      setHTML("team", th);
    } else setHTML("team", "");
    setHTML("items", icA("i_tube", "#57e08a") + p.items.tube + " " + icA("i_pal", "#e8efe9") + p.items.pal + " " + icA("i_lac", "#3fb6ff") + p.items.lac + " " + icA("i_bigshield", "#2a7bff") + p.items.big);
    var nv = p.state === "ground" && p.alive && !nearestLoot(p, 2.2) && !KP.nearChest(p, 2.2) ? KP.nearVehicle(p, 2.6) : null;
    var showTake = p.alive && (p.state === "drive" || (p.state === "ground" && (KP.nearChest(p, 2.2) || nearestLoot(p, 2.2) || nv)));
    setTxt("bTake", p.state === "drive" ? KP.t("exitV") : nv ? KP.t("enter_" + nv.kind) : KP.t("take"));
    var gk = p.items[p.thr] > 0 ? p.thr : (["gren", "smoke", "pop"].filter(function (q) { return p.items[q] > 0; })[0] || p.thr);
    var tk = p.state === "drive" ? "" : nv ? (nv.kind === "quad" ? "quad" : "") : KP.nearChest(p, 2.2) ? "chest" : "";
    if ($("bTake").getAttribute("data-ic") !== tk) $("bTake").setAttribute("data-ic", tk);
    $("bGren").setAttribute("data-ic", gk);
    setHTML("grenChip", icA(GREN_ART[gk], KP.ITEMS[gk].col) + KP.t("i_" + gk) + " " + p.items[gk] + (isTouch ? "" : " <small>[G] [B]</small>"));
    $("bTake").style.display = showTake ? "flex" : "none";
    if (showTake && !isTouch && (p.state === "drive" || nv)) { setHTML("takeHint", "<kbd>E</kbd>" + (p.state === "drive" ? KP.t("exitV") : KP.t("enter_" + nv.kind))); $("takeHint").style.display = "block"; }
    else if (showTake && !isTouch) { var it = nearestLoot(p, 2.2), ch = KP.nearChest(p, 2.2); setHTML("takeHint", "<kbd>E</kbd>" + (ch ? KP.t("chest") : it.t === "w" ? "<span style='color:" + KP.RAR[it.r].c + "'>" + KP.t("w" + it.id) + " · " + KP.t("r" + it.r) + "</span>" : KP.t("i_" + it.id))); $("takeHint").style.display = "block"; }
    else $("takeHint").style.display = "none";
    $("bJumpPlane").style.display = p.state === "plane" ? "block" : "none";
    $("healBar").style.display = p.healT > 0 ? "block" : "none";
    if (p.healT > 0) $("healFill").style.width = (100 * (1 - p.healT / KP.ITEMS[p.healKind].time)) + "%";
    $("cross").className = "cross" + (w.pel ? " wide" : "") + (w.melee ? " melee" : "");
    $("scope").style.display = IN.aim && zoomW() && p.state === "ground" ? "block" : "none";
    if (toastT > 0) { toastT -= dt; if (toastT <= 0) $("toast").style.opacity = 0; }
    if (msgT > 0) { msgT -= dt; if (msgT <= 0) $("msg").style.opacity = 0; }
    var out = p.alive && p.state === "ground" && KP.outside(p); $("outWarn").style.display = out ? "block" : "none";
    miniT -= dt; if (miniT <= 0) { miniT = 0.12; drawMini(); if (mapOn) drawBig(); }
    // название локации при входе
    if (p.state === "ground") {
      var here = -1; W3.POIS.forEach(function (q, qi) { if (Math.hypot(p.x - q.x, p.z - q.z) < q.r + 6) here = qi; });
      if (here !== G.locShown) { G.locShown = here; if (here >= 0) { var le = $("loc"); le.textContent = KP.t(W3.POIS[here].key); le.classList.remove("on"); void le.offsetWidth; le.classList.add("on"); } }
    }
    feed = feed.filter(function (f) { return G.time - f.t < 6; }); if (feed.length !== hudCache.fl) { hudCache.fl = feed.length; renderFeed(); }
  }

  /* ---------- экраны ---------- */
  function show(id) {
    G.menuView = id === "scrWard" ? "ward" : null;
    ["scrChal", "scrLoad", "scrMenu", "scrWard", "scrSet", "scrStats", "scrRes", "scrPause", "scrPass", "scrQuest"].forEach(function (s) { $(s).style.display = s === id ? "flex" : "none"; });
    if (id) { $("hud").style.display = id === "scrPause" ? "block" : "none"; }
  }
  function applyLang() {
    document.documentElement.lang = KP.lang;
    document.title = KP.t("title");
    Array.prototype.forEach.call(document.querySelectorAll("[data-t]"), function (el) { el.textContent = KP.t(el.getAttribute("data-t")); });
    hudCache = {};
  }
  function menu() {
    G.running = false; G.ended = false; document.body.classList.remove("inmatch"); $("hud").style.display = "none";
    if (planeMesh) planeMesh.visible = false;
    clearMatch(); G.zone = null; if (SET.map && W3.map !== SET.map && world) switchMap(SET.map); if (sky) applyAtmos(W3.MAP.winter ? "polar" : W3.MAP.desert ? "dustset" : "sunset");
    $("bMap").innerHTML = (W3.map === "isle" && KP.ART && KP.ART.bg && KP.ART.bg.indexOf("map_island") >= 0 ? "<img class=mapth src='img/map_island.webp' alt='' onerror=\"this.remove()\">" : "") + KP.t("mapLbl") + ": <b>" + KP.t("map_" + W3.map) + "</b>";
    KP.audio.music("menu"); KP.audio.ambience("menu"); $("bTutor").className = PROG.tut ? "" : "gold"; toggleMap(false);
    var I = lvlInfo(PROG.xp);
    $("mLvl").textContent = KP.t("lvl", I.L); $("mXpFill").style.width = (100 * I.cur / I.need) + "%"; $("mXp").textContent = KP.t("xp", I.cur, I.need);
    var PT = KP.META.passTier(PROG); $("mPass").textContent = KP.t("tier", PT.tier, KP.META.TIERS); $("mPassFill").style.width = (100 * PT.cur / PT.size) + "%";
    KP.META.ensureQuests(PROG); var qd = PROG.dq.l.filter(function (q) { return q.d; }).length + PROG.wq.l.filter(function (q) { return q.d; }).length; $("mQuest").textContent = KP.t("questsDone", qd, 6);
    $("bLang").textContent = "🌐 " + KP.lang.toUpperCase();
    $("bGift").style.display = window.Premium && window.Premium.giftAvailable && window.Premium.giftAvailable() ? "" : "none";
    var ev = KP.todayEvent(); $("bEvent").innerHTML = KP.t("event") + ": " + KP.t(ev.key) + "<small>" + KP.t(ev.key + "d") + " · ×" + ev.xp + " " + KP.t("resXp") + "</small>";
    $("pcHelp").style.display = isTouch ? "none" : "block";
    artBodyClasses();
    $("scrMenu").classList.toggle("artbg",!!(KP.ART && KP.ART.bg && KP.ART.bg.indexOf("bg_menu") >= 0 && W3.map === "isle"));   // фон Художника на тропической карте
    $("scrMenu").classList.toggle("artbg2", !!(KP.ART && KP.ART.bg && KP.ART.bg.indexOf("bg_season2") >= 0 && W3.map === "frost"));   // зимний фон сезона 2 на «Ледяном перевале"

    show("scrMenu");
  }
  /* снаряжение: вкладки «Бойцы», «Раскраски», «Эмоции», «Краска»; справа — живая 3D-витрина */
  var wardTab = "skin";
  function wardrobe() {
    var tabs = [["skin", "skins"], ["wrap", "wraps"], ["emote", "emotes"], ["paint", "paints"]], h = "<div class=tabs>";
    tabs.forEach(function (t) { h += "<button class='small" + (wardTab === t[0] ? " on" : "") + "' data-tab=" + t[0] + ">" + KP.t(t[1]) + "</button>"; });
    h += "</div><div class=grid>";
    var list = wardTab === "skin" ? KP.SKINS : wardTab === "wrap" ? KP.META.WRAPS : wardTab === "emote" ? KP.META.EMOTES : KP.PAINTS;
    var cur = wardTab === "skin" ? PROG.skin : wardTab === "wrap" ? PROG.wrap : wardTab === "emote" ? PROG.emote : PROG.paint;
    list.forEach(function (s, i) {
      var open = isOpen(wardTab, i), name, pic;
      if (wardTab === "skin") { name = KP.t("sk" + i); pic = (KP.ART && KP.ART.skin && KP.ART.skin.indexOf(i) >= 0 ? "<img class=port src='img/skin_" + i + ".webp' alt='' onerror=\"this.style.display='none';this.nextSibling.style.display='block'\"><div class=fig style='display:none'>" : "<div class=fig>") + "<s style='background:" + s.vest + "'></s><em style='background:" + s.pants + "'></em><i style='background:" + s.skin + "'></i><u style='background:" + (s.helmCol || "transparent") + "'></u></div>"; }
      else if (wardTab === "wrap") { name = KP.t(s.key); var wa = WRAP_ART[i]; pic = wa && hasArt(wa) ? "<div class='dot wrapimg' style=\"background:url(img/" + wa + ".webp) center/cover " + (s.tint === "prism" ? "#ff3d8b" : s.tint) + "\"></div>" : "<div class=dot style='border-radius:4px;background:" + (s.tint === "prism" ? "linear-gradient(135deg,#ff3d8b,#ffc531,#2fd6ff)" : s.tint) + "'></div>"; }
      else if (wardTab === "emote") { name = KP.t(s.key); var ea = "emote_" + s.anim; pic = hasArt(ea) ? "<img class='port" + (open ? "" : " lk") + "' src='img/" + ea + ".webp' alt='' onerror=\"this.outerHTML='<div class=dot></div>'\">" : "<div class=dot style='background:#2b3036;line-height:36px;font-size:18px'>" + (i + 1) + "</div>"; }
      else { name = KP.t("pc" + i); pic = "<div class=dot style='background:" + (s.c === "rainbow" ? "conic-gradient(#ff3d8b,#ffc61a,#7be03a,#2f9bff,#9b5cff,#ff3d8b)" : s.c) + "'></div>"; }
      if (wardTab === "skin" && !open) pic = pic.replace("class=port", "class='port lk'");
      h += "<div class='card" + (cur === i ? " sel" : "") + (open ? "" : " locked") + "' data-i=" + i + ">" + pic + "<b>" + name + "</b><small>" + (open ? (cur === i ? KP.t("selected") : KP.t("choose")) : KP.META.lockText(wardTab, i)) + "</small></div>";
    });
    h += "</div>";
    $("wardList").innerHTML = h;
    Array.prototype.forEach.call($("wardList").querySelectorAll("[data-tab]"), function (el) { el.onclick = function () { wardTab = el.getAttribute("data-tab"); wardrobe(); }; });
    Array.prototype.forEach.call($("wardList").querySelectorAll("[data-i]"), function (el) {
      el.onclick = function () {
        var i = +el.getAttribute("data-i"); if (!isOpen(wardTab, i)) return;
        if (wardTab === "skin") PROG.skin = i; else if (wardTab === "wrap") PROG.wrap = i; else if (wardTab === "emote") { PROG.emote = i; showcaseEmote = 2.5; } else PROG.paint = i;
        saveProg(); wardrobe(); buildShowcase();
      };
    });
    show("scrWard"); buildShowcase();
  }
  /* эмоции: поза по времени t (сек); anim = null — сброс */
  function emotePose(m, anim, t) {
    var P = m.userData.parts; m.userData.yoff = 0; m.rotation.z = 0;
    if (!anim) { P.arms.position.y = 1.45; return; }
    var s = Math.sin(t * 8);
    if (anim === "wave") P.arms.rotation.x = -2.1 + Math.sin(t * 10) * 0.35;
    else if (anim === "salute") P.arms.rotation.x = -1.85;
    else if (anim === "dance") { P.legs[0].rotation.x = s * 0.6; P.legs[1].rotation.x = -s * 0.6; P.arms.rotation.x = s * 0.9 - 0.5; m.rotation.z = Math.sin(t * 4) * 0.15; m.userData.yoff = Math.abs(s) * 0.12; }
    else if (anim === "laugh") { P.arms.rotation.x = 0.7; m.rotation.x = Math.sin(t * 22) * 0.06; }
    else if (anim === "flex") { P.arms.rotation.x = -2.7; P.arms.position.y = 1.45 + Math.abs(s) * 0.05; }
    else if (anim === "sit") { P.legs[0].rotation.x = P.legs[1].rotation.x = -1.45; P.arms.rotation.x = 0.7; m.userData.yoff = -0.42; }
    else if (anim === "spin") { P.arms.rotation.x = -2.4; m.userData.spin = t * 9; }
  }
  /* витрина бойца в мире (камера смотрит на неё, пока открыт экран снаряжения) */
  var showcase = null, showcaseSpot = null, showcaseEmote = 0, wardDrag = { on: false, x: 0, yaw: 0, zoom: 1, last: 0 };
  function bindWardDrag() {
    var el = $("scrWard");
    function down(x, t) { if (t && t.closest && t.closest(".panel,button")) return; wardDrag.on = true; wardDrag.x = x; }
    function move(x) { if (!wardDrag.on) return; wardDrag.yaw += (x - wardDrag.x) * 0.012; wardDrag.x = x; wardDrag.last = performance.now(); }
    function up() { wardDrag.on = false; wardDrag.last = performance.now(); }
    el.addEventListener("mousedown", function (e) { down(e.clientX, e.target); });
    window.addEventListener("mousemove", function (e) { move(e.clientX); });
    window.addEventListener("mouseup", up);
    el.addEventListener("touchstart", function (e) { down(e.touches[0].clientX, e.target); }, { passive: true });
    el.addEventListener("touchmove", function (e) { move(e.touches[0].clientX); }, { passive: true });
    el.addEventListener("touchend", up);
    el.addEventListener("wheel", function (e) { if (e.target.closest && e.target.closest(".panel")) return; wardDrag.zoom = Math.max(0.6, Math.min(1.4, wardDrag.zoom + (e.deltaY > 0 ? 0.08 : -0.08))); }, { passive: true });
  }
  function buildShowcase() {
    if (!showcaseSpot) {
      for (var a = 0; a < 60 && !showcaseSpot; a++) { var x = 34 + Math.cos(a) * a * 0.6, z = -34 + Math.sin(a) * a * 0.6; if (W3.height(x, z) > 1.5 && W3.slope(x, z) < 0.2 && !W3.query(x - 5, z - 5, x + 5, z + 5).length) showcaseSpot = { x: x, z: z, y: W3.height(x, z) }; }
      if (!showcaseSpot) showcaseSpot = { x: 30, z: -30, y: W3.height(30, -30) };
    }
    if (showcase) scene.remove(showcase.mesh);
    showcase = { mesh: KP.charMesh(PROG.skin, KP.PAINTS[PROG.paint].c), slots: [{ id: 0 }, { id: 4, r: 3, mag: 1 }], cur: 0, wrap: PROG.wrap };
    showcase.mesh.position.set(showcaseSpot.x, showcaseSpot.y, showcaseSpot.z); scene.add(showcase.mesh);
    KP.equip(showcase, 1);
  }
  function stats() {
    var I = lvlInfo(PROG.xp), rk = ["rank0", "rank1", "rank2", "rank3", "rank4", "rank5"][Math.min(5, Math.floor(I.L / 10))];
    var h = "<div class=passHead><b>" + KP.t("lvl", I.L) + " · " + KP.t(rk) + "</b><small>" + KP.t("achCount", Object.keys(PROG.ach || {}).length, KP.META.ACH.length) + "</small></div><div class=prof><div>";
    var rows = [["stM", st("m")], ["stW", st("w")], ["stT5", st("t5")], ["stKo", st("ko")], ["stKmax", st("kmax")], ["stBest", st("bp") ? 100 - st("bp") : "—"], ["stDmg", st("dmg")], ["stBuilt", st("built")], ["stChests", st("chests")], ["stDrv", st("drv") + " " + KP.t("unitM")], ["stTime", Math.round(st("time") / 60) + " " + KP.t("unitMin")]];
    h += "<h3>" + KP.t("stats") + "</h3>" + rows.map(function (r) { return "<div class=row><span>" + KP.t(r[0]) + "</span><b>" + r[1] + "</b></div>"; }).join("");
    h += "<h3>" + KP.t("byWeapon") + "</h3><div class=row><span>" + KP.t("weapon") + "</span><span>" + KP.t("resKos") + " · " + KP.t("resDmg") + "</span></div>";
    [0, 1, 2, 3, 4, 5, 6, "gren", "ram"].forEach(function (w) { var o = (PROG.ws || {})[w]; if (!o) return; h += "<div class=row><span>" + (typeof w === "number" ? KP.t("w" + w) : KP.t(w === "gren" ? "i_gren" : "ramKo")) + "</span><b>" + o.k + " · " + o.d + "</b></div>"; });
    h += "</div><div><h3>" + KP.t("achs") + "</h3><div class=achs>";
    KP.META.achList(PROG).forEach(function (a) { h += "<div class='ach" + (a.done ? " done" : "") + "'><b>" + KP.t(a.key) + "</b><div class=bar><i style='width:" + (100 * a.cur / a.goal) + "%'></i></div><small>" + a.cur + " / " + a.goal + "</small></div>"; });
    h += "</div></div></div>";
    $("statList").innerHTML = h;
    show("scrStats");
  }
  /* боевой пропуск: 50 ступеней, бесплатная ветка и ветка Премиума */
  var passSeason = 0;
  function passScreen() {
    var S = passSeason || KP.META.SEASON, PT = KP.META.passTier(PROG, S), R = KP.META.passRewards(S), prem = KP.META.premOn();
    var h = "<div class=tabs>" + [1, 2].map(function (n) { return "<button class='small" + (n === S ? " on" : "") + "' data-season=" + n + ">" + KP.t("season" + n) + "</button>"; }).join("") + "</div>";
    if (S < KP.META.SEASON) h += "<small class=dim>" + KP.t("seasonOld") + "</small>";
    var ic2 = function (n) { return KP.ART && KP.ART.icons && KP.ART.icons.indexOf(n) >= 0 ? "<img class=passIc src='img/" + n + ".webp' alt='' onerror=\"this.style.display='none'\">" : ""; };
    $("scrPass").classList.toggle("s2bg", S === 2 && !!(KP.ART && KP.ART.bg && KP.ART.bg.indexOf("bg_season2") >= 0));
    h += "<div class=passHead><b>" + (S === 2 ? ic2("i_crystal") : "") + KP.t("season" + S) + (S === 2 ? ic2("i_drop2") : "") + "</b><span>" + KP.t("tier", PT.tier, KP.META.TIERS) + "</span><div class=bar><i style='width:" + (100 * PT.cur / PT.size) + "%'></i></div><small>" + KP.t("passHow", KP.META.TIER_SIZE) + " · " + (prem ? KP.t("premOn") : KP.t("premOff")) + "</small></div><div class=passRow>";
    for (var t = 1; t <= KP.META.TIERS; t++) {
      var got = PT.tier >= t, f = R.free[t] || [], pr = R.prem[t] || [];
      if (!f.length && !pr.length && t % 5) continue;
      h += "<div class='tierC" + (got ? " got" : "") + (t === PT.tier + 1 ? " next" : "") + "'><b>" + t + "</b>";
      h += "<div class=rw>" + (f.length ? f.map(KP.META.itemName).join("<br>") : "<span class=dim>+" + KP.t("resXp") + "</span>") + "</div>";
      h += "<div class='rw pr'>" + (pr.length ? pr.map(KP.META.itemName).join("<br>") : "") + "</div></div>";
    }
    h += "</div>";
    $("passList").innerHTML = h; show("scrPass");
    Array.prototype.forEach.call($("passList").querySelectorAll("[data-season]"), function (el) { el.onclick = function () { passSeason = +el.getAttribute("data-season"); passScreen(); }; });
  }
  function questScreen() {
    KP.META.ensureQuests(PROG);
    var h = "";
    KP.META.ensureSeason(PROG);
    [["daily", PROG.dq.l, 150], ["weekly", PROG.wq.l, 500], ["seasonQ", PROG.sq.l, 600]].forEach(function (g) {
      h += "<h3>" + KP.t(g[0]) + " · +" + g[2] + " " + KP.t("resXp") + "</h3>";
      g[1].forEach(function (q) { h += "<div class='quest" + (q.d ? " done" : "") + "'><span>" + esc(KP.META.questText(q)) + "</span><b>" + Math.min(q.p, q.g) + " / " + q.g + "</b><div class=bar><i style='width:" + (100 * Math.min(1, q.p / q.g)) + "%'></i></div></div>"; });
    });
    $("questList").innerHTML = h; show("scrQuest");
  }
  /* испытания: 20 карточек со звёздами; следующее открывается после ★ в предыдущем */
  function chalScreen() {
    var h = "<div class=passHead><b>" + KP.t("chals") + "</b><small>" + KP.t("chalStars", KP.chalTotal(PROG), KP.CHAL.length * 3) + "</small></div><div class=chals>";
    KP.CHAL.forEach(function (C, i) {
      var open = KP.chalOpen(PROG, i), s = (PROG.chal || {})[i] || 0;
      var lk = C.map === "isle" ? "loc_" + W3.MAPS.isle.pois[Math.min(C.poi, W3.MAPS.isle.pois.length - 1)].kind : "", lb = lk && KP.ART && KP.ART.bg && KP.ART.bg.indexOf(lk) >= 0;   // фото локации Художника
      h += "<div class='chal" + (open ? "" : " locked") + "' data-c=" + i + (lb ? " style=\"background:linear-gradient(90deg,rgba(8,11,16,.9),rgba(8,11,16,.45)),url(img/" + lk + ".webp) center/cover\"" : "") + "><b>" + (i + 1) + ". " + KP.t("chal_" + C.t) + "</b><small>" + KP.t("map_" + C.map) + " · " + KP.t(W3.MAPS[C.map].pois[Math.min(C.poi, W3.MAPS[C.map].pois.length - 1)].key) + "</small><span class=st>" + "★★★".slice(0, s) + "<i>" + "☆☆☆".slice(0, 3 - s) + "</i></span>" + (open ? "" : "<small>" + KP.t("chalLocked") + "</small>") + "</div>";
    });
    $("chalList").innerHTML = h + "</div>";
    Array.prototype.forEach.call($("chalList").querySelectorAll("[data-c]"), function (el) { el.onclick = function () { var i = +el.getAttribute("data-c"); if (!KP.chalOpen(PROG, i)) return; audioInit(); G.chalId = i; startMatch("chal"); }; });
    show("scrChal");
  }
  function settings() {
    $("sSens").value = SET.sens; $("sSnd").textContent = SET.snd ? KP.t("on") : KP.t("off"); $("sMus").textContent = SET.mus ? KP.t("on") : KP.t("off"); $("sQ").textContent = SET.qmode === "auto" ? KP.t("qAutoLbl") : SET.qmode === "high" ? KP.t("qHigh") : KP.t("qLow");
    show("scrSet");
  }
  function showResults(r) {
    var bgk = r.win ? "bg_win" : "bg_lose", hasBg = KP.ART && KP.ART.bg && KP.ART.bg.indexOf(bgk) >= 0;   // фон от Художника, если уже пришёл
    $("scrRes").style.background = hasBg ? "linear-gradient(rgba(8,11,16,.55),rgba(8,11,16,.75)), url(img/" + bgk + ".webp) center/cover" : "";
    $("rTitle").textContent = r.win ? KP.t("win") : KP.t("lose"); $("rTitle").className = r.win ? "win" : "";
    $("rPlace").textContent = KP.t("place", r.place, r.n);
    $("rRows").innerHTML = [["resKos", r.kos], ["resDmg", r.dmg], ["resTime", fmt(r.sec)], ["resXp", "+" + r.gain]].map(function (x) { return "<div class=row><span>" + KP.t(x[0]) + "</span><b>" + x[1] + "</b></div>"; }).join("");
    var I = lvlInfo(PROG.xp);
    $("rLvl").textContent = KP.t("lvl", I.L) + " · " + KP.t("xp", I.cur, I.need); $("rXpFill").style.width = (100 * I.cur / I.need) + "%";
    var notes = []; if (r.chal) notes.push(KP.t("chalRes", r.chal.id + 1, r.chal.t) + " · " + "★★★".slice(0, r.chal.stars) + "☆☆☆".slice(0, 3 - r.chal.stars));
    if (r.pve) notes.push(KP.t("pveRes", r.pve.waves, KP.PVE.WAVES) + " · " + "★★★".slice(0, r.pve.stars) + "☆☆☆".slice(0, 3 - r.pve.stars));
    if (r.newLvl) notes.push(KP.t("newLvl", r.newLvl)); if (r.newTier) notes.push(KP.t("newTier", r.newTier));
    (r.quests || []).forEach(function (u) { notes.push(KP.t("questDone", u)); }); (r.ach || []).forEach(function (a) { notes.push(KP.t("achDone", KP.t(a))); }); r.unl.forEach(function (u) { notes.push(KP.t("unlocked", u)); });
    $("rNotes").innerHTML = notes.map(function (n) { return "<div>▸ " + esc(n) + "</div>"; }).join("");
    $("bX2").style.display = PF.canReward() ? "block" : "none"; $("bX2").disabled = false; $("bX2").textContent = KP.t("x2");
    if (window.Premium && PF.sdk()) setTimeout(function () { if (!G.running) window.Premium.maybeCard(); }, 900);
    show("scrRes");
  }
  function togglePause(on) {
    if (!G.running || G.ended) return;
    G.paused = on; PF.setPlaying(!on);
    if (on) { if (document.pointerLockElement) document.exitPointerLock(); IN.fire = false; show("scrPause"); }
    else { show(null); $("hud").style.display = "block"; if (!isTouch) { lockPtr(); } }
  }
  function bindUI() {
    $("bSolo").onclick = function () { audioInit(); startMatch("solo"); };
    $("bTrio").onclick = function () { audioInit(); startMatch("trio"); };
    $("bCap").onclick = function () { audioInit(); startMatch("cap"); };
    $("bTdm").onclick = function () { audioInit(); startMatch("tdm"); };
    $("bLr").onclick = function () { audioInit(); startMatch("lr"); };
    $("bPve").onclick = function () { audioInit(); startMatch("pve"); };
    $("bChal").onclick = chalScreen;
    $("bMap").onclick = function () { var ids = Object.keys(W3.MAPS), i = ids.indexOf(W3.map); switchMap(ids[(i + 1) % ids.length]); menu(); };
    $("bEvent").onclick = function () { audioInit(); startMatch("event"); };
    $("bTrain").onclick = function () { audioInit(); startMatch("train"); };
    $("bQuick").onclick = function () { audioInit(); startMatch("quick"); };
    $("bWard").onclick = wardrobe; bindWardDrag(); $("bStats").onclick = stats; $("bSet").onclick = settings; $("bPass").onclick = passScreen; $("bQuest").onclick = questScreen;
    Array.prototype.forEach.call(document.querySelectorAll(".bBack"), function (b) { b.onclick = menu; });
    $("bLang").onclick = function () { KP.lang = KP.LANGS[(KP.LANGS.indexOf(KP.lang) + 1) % KP.LANGS.length]; SET.lang = KP.lang; saveSet(); applyLang(); if (window.Premium && window.Premium.setLang) window.Premium.setLang(premLang()); menu(); };

    $("sSens").oninput = function () { SET.sens = +$("sSens").value; saveSet(); };
    $("sSnd").onclick = function () { SET.snd = SET.snd ? 0 : 1; KP.audio.setVol(); saveSet(); settings(); };
    $("sMus").onclick = function () { SET.mus = SET.mus ? 0 : 1; KP.audio.setVol(); saveSet(); settings(); };
    $("bTutor").onclick = function () { audioInit(); startMatch("tutor"); };
    $("mini").addEventListener("click", function () { toggleMap(); }); $("mini").addEventListener("touchstart", function (e) { e.preventDefault(); e.stopPropagation(); toggleMap(); }, { passive: false });
    $("bigmap").addEventListener("click", function () { toggleMap(false); }); $("bigmap").addEventListener("touchstart", function (e) { e.preventDefault(); toggleMap(false); }, { passive: false });
    Array.prototype.forEach.call(document.querySelectorAll("button"), function (b) { b.addEventListener("click", function () { audioInit(); KP.sfx("ui"); }); });
    $("sQ").onclick = function () { SET.qmode = SET.qmode === "auto" ? "low" : SET.qmode === "low" ? "high" : "auto"; setQL(qlFromSet()); saveSet(); settings(); };
    $("bAgain").onclick = function () { PF.interstitial(function () { startMatch(G.mode || "solo"); }); };
    $("bMenu").onclick = function () { PF.interstitial(menu); };
    /* подарок дня Премиума (вместо прежних наград без ролика): раз в сутки, пока Премиум активен */
    $("bGift").onclick = function () { if (window.Premium && window.Premium.claimGift()) menu(); else $("bGift").style.display = "none"; };
    $("bX2").onclick = function () {
      $("bX2").disabled = true;
      PF.rewarded(function (got) {
        if (!got) { $("bX2").disabled = false; return; }
        var r = G.lastRes, L0 = lvlInfo(PROG.xp).L, before = KP.META.openList(PROG); PROG.xp += r.gain; PROG.pp2 = (PROG.pp2 || 0) + r.gain;
        var L1 = lvlInfo(PROG.xp).L, after = KP.META.openList(PROG); saveProg();
        r.newLvl = L1 > L0 ? L1 : r.newLvl; r.unl = r.unl.concat(after.filter(function (x) { return before.indexOf(x) < 0; }).map(KP.META.itemName)); r.gain *= 2;
        showResults(r); $("bX2").style.display = "none"; toast(KP.t("x2done"));
      });
    };
    $("bResume").onclick = function () { togglePause(false); };
    $("bLeave").onclick = function () {
      if (G.train) { G.running = false; G.paused = false; PF.setPlaying(false); menu(); return; } if (G.player) { G.player.alive = false; G.player.place = G.chars.filter(function (c) { return c.alive; }).length + 1; } G.paused = false; G.ended = true; G.win = false; G.endT = G.time - 10; show(null); };
    $("bJumpPlane").addEventListener("click", function () { IN.jump = true; });
    $("bJumpPlane").addEventListener("touchstart", function (e) { e.preventDefault(); e.stopPropagation(); IN.jump = true; }, { passive: false });
    $("lockHint").onclick = function () { lockPtr(); };
  }
  KP.ui = { toast: function (s, t) { toast(s, t); }, big: function (s, t) { bigMsg(s, t); } };
  PF.onPause = function (p) { G.sysPaused = p; KP.audio.pause(p); };

  /* ---------- главный цикл ---------- */
  var last = performance.now(), acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    var raw = (now - last) / 1000, dt = Math.min(0.1, raw); last = now;
    if (G.sysPaused) return;
    // замер FPS во время матча и авто-качество
    if (G.running && !G.paused && raw > 0 && raw < 1) {
      fpsAcc += raw; fpsN++; fpsT += raw; qlCd -= raw;
      if (fpsT > 3) { G.fps = Math.round(fpsN / fpsAcc); fpsAcc = 0; fpsN = 0; fpsT = 0; if (SET.qmode === "auto" && qlCd <= 0 && G.fps < 38 && QL > 0) { setQL(QL - 1, true); qlCd = 6; } }
    }
    if (G.running && !G.paused) {
      acc += dt * (G.timeScale || 1); var n = 0;
      while (acc >= DT && n < 8) { step(DT); acc -= DT; n++; }
      if (n >= 8) acc = 0;
      updateHud(dt);
    }
    render(dt);
  }

  /* ---------- автоигрок и прогоны баланса ---------- */
  
  /* «шаг назад» (кнопка «Назад» Android в сборке Google Play, gp-adapter.js): закрыть карту, пауза/продолжить, окно → меню.
     false — уже в главном меню, назад некуда. */
  window.__app = { back: function () {
    if (G.running && $("bigmap").style.display === "block") { toggleMap(false); return true; }
    if (G.running && !G.ended) { togglePause(!G.paused); return true; }
    if ($("scrMenu").style.display !== "flex" && $("scrLoad").style.display !== "flex") { menu(); return true; }
    return false;
  } };
  /* Премиум знает только ru/en: казахский — по-русски, остальные — по-английски */
  function premLang() { return KP.lang === "ru" || KP.lang === "kk" ? "ru" : "en"; }
  /* подарок дня ≈ 2–3 ролика «×2 опыта»: +500 опыта и +500 очков пропуска текущего сезона */
  var GIFT_XP = 500;
  function grantGift() {
    var before = KP.META.openList(PROG); PROG.xp += GIFT_XP; PROG.pp2 = (PROG.pp2 || 0) + GIFT_XP; saveProg();
    var after = KP.META.openList(PROG).filter(function (x) { return before.indexOf(x) < 0; });
    toast(KP.t("giftGot", GIFT_XP) + (after.length ? " · " + after.map(KP.META.itemName).join(", ") : ""));
    if (!G.running) menu();
  }
  KP.grantGift = grantGift;
  /* ---------- запуск ---------- */
  PF.init().then(function () {
    loadAll();
    var nav = (navigator.language || "ru").slice(0, 2);
    KP.lang = SET.lang && KP.LANGS.indexOf(SET.lang) >= 0 ? SET.lang : KP.pickLang(PF.hasSdk() ? PF.lang() : nav);
    applyLang();
    initScene(); bindInput(); bindUI();
    if (isTouch) document.body.classList.add("touch");
    PF.onCloud = function () { loadAll(); if (!G.running) menu(); };
    if (window.Premium && PF.sdk()) {
      window.Premium.init({ sdk: PF.sdk(), lang: premLang(), gift: { grant: grantGift, text: { ru: KP.DICT.ru.giftWhat, en: KP.DICT.en.giftWhat } }, store: { get: function () { return PF.get("kp.premium"); }, set: function (raw) { PF.put("kp.premium", raw); }, save: function () { return PF.save(); } } })
        .then(function () { if (!G.running) { menu(); window.Premium.maybeCard(); } });
      window.Premium.onChange(function () { if (!G.running) menu(); });
    }
    menu();
    requestAnimationFrame(frame);
    PF.ready();
    if (window.__shot) setTimeout(window.__shot, 50);
    if (window.__autotest) setTimeout(window.__autotest, 80);
  });
})(window.KP);
