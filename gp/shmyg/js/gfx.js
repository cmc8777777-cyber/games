/* Держи Шмыга! · графика: рендерер, свет, небо, отражения, материалы, процедурные фактуры, смена дня и ночи.
   Стиль — полуреализм (решение владельца 12.11): физичные материалы (MeshStandard), ACES-кривая, мягкие тени у героя и препятствий,
   туман на дальности, отражения неба в металле. На слабых телефонах качество снижается автоматически (тени, плотность пикселей). */
window.GFX = (function () {
  "use strict";
  var T = window.THREE;
  var renderer, scene, camera, sun, hemi, sky, skyU, envRT = null, pmrem = null, headLamp;
  var mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  var quality = { shadows: true, ratio: Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2), level: 2 };
  var matCache = {}, texCache = {};
  var nightMats = [];               // материалы, которые светятся ночью (окна, фонари)
  var curPal = null, night = 0;

  /* ---------- Цвет: hex (sRGB) → линейный ---------- */
  function lin(hex) { return new T.Color(hex).convertSRGBToLinear(); }
  function lerpHex(a, b, t) { var ca = new T.Color(a), cb = new T.Color(b); return ca.lerp(cb, t).getHex(); }

  /* ---------- Материалы ---------- */
  /* kind: fabric | leather | skin | plastic | metal | gold | glass | stone | wood | paint | emissive | fur */
  var KINDS = {
    fabric: { r: 0.88, m: 0 }, leather: { r: 0.55, m: 0 }, skin: { r: 0.62, m: 0 }, plastic: { r: 0.4, m: 0 },
    metal: { r: 0.32, m: 0.85 }, gold: { r: 0.22, m: 1 }, glass: { r: 0.08, m: 0.2 }, stone: { r: 0.92, m: 0 },
    wood: { r: 0.8, m: 0 }, paint: { r: 0.45, m: 0.15 }, fur: { r: 0.95, m: 0 }, rubber: { r: 0.75, m: 0 }, ice: { r: 0.15, m: 0.1 }
  };
  function mat(hex, kind, extra) {
    kind = kind || "paint";
    var key = hex + ":" + kind + (extra ? ":" + JSON.stringify(extra, function (k, v) { return v && v.isTexture ? v.uuid : v; }) : "");
    if (matCache[key]) return matCache[key];
    var k = KINDS[kind] || KINDS.paint;
    var o = { color: lin(hex), roughness: k.r, metalness: k.m };
    if (extra) {
      if (extra.emissive != null) { o.emissive = lin(extra.emissive); o.emissiveIntensity = extra.ei != null ? extra.ei : 1; }
      if (extra.opacity != null) { o.transparent = true; o.opacity = extra.opacity; o.depthWrite = extra.opacity > 0.6; }
      if (extra.map) o.map = extra.map;
      if (extra.emissiveMap) o.emissiveMap = extra.emissiveMap;
      if (extra.flat) o.flatShading = true;
      if (extra.side) o.side = T.DoubleSide;
    }
    var m = new T.MeshStandardMaterial(o);
    if (extra && extra.night) { m.userData.nightEi = extra.night; m.emissiveIntensity = 0; nightMats.push(m); }
    matCache[key] = m;
    return m;
  }
  function basic(hex, opacity) {
    var key = "b:" + hex + ":" + (opacity || 1);
    if (!matCache[key]) matCache[key] = new T.MeshBasicMaterial({ color: lin(hex), transparent: opacity != null && opacity < 1, opacity: opacity == null ? 1 : opacity, depthWrite: !(opacity < 1), fog: true });
    return matCache[key];
  }

  /* ---------- Процедурные фактуры (canvas) ---------- */
  function canvas(w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h || w; return c; }
  function tex(c, rx, ry, srgb) {
    var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx || 1, ry || 1);
    t.anisotropy = Math.min(4, renderer ? renderer.capabilities.getMaxAnisotropy() : 1);
    if (srgb !== false) t.encoding = T.sRGBEncoding;
    return t;
  }
  function hexs(n) { return "#" + ("00000" + (n >>> 0).toString(16)).slice(-6); }
  function shade(hex, f) { var c = new T.Color(hex); if (f > 0) c.lerp(new T.Color(0xffffff), f); else c.lerp(new T.Color(0x000000), -f); return hexs(c.getHex()); }
  function noise(g, w, h, n, a, sz) { for (var i = 0; i < n; i++) { g.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255," + Math.random() * a + ")" : "rgba(0,0,0," + Math.random() * a + ")"; var s = (sz || 3) * (0.5 + Math.random()); g.fillRect(Math.random() * w, Math.random() * h, s, s); } }
  /* дорога: рисует painter мира на 512×512, повтор вдоль трассы */
  function roadTex(key, painter) {
    if (texCache[key]) return texCache[key];
    var c = canvas(512), g = c.getContext("2d"); painter(g, 512);
    var t = tex(c, 1, 6); texCache[key] = t; return t;
  }
  function groundTex(key, base, painter) {
    if (texCache[key]) return texCache[key];
    var c = canvas(256), g = c.getContext("2d"); g.fillStyle = hexs(base); g.fillRect(0, 0, 256, 256);
    if (painter) painter(g, 256); else noise(g, 256, 256, 900, 0.09, 4);
    var t = tex(c, 60, 60); texCache[key] = t; return t;
  }
  /* фасад: стена + окна (карта цвета) и светящиеся окна (карта свечения для ночи) */
  function facade(key, o) {
    if (texCache[key]) return texCache[key];
    var W = 256, H = 384, c = canvas(W, H), g = c.getContext("2d"), e = canvas(W, H), ge = e.getContext("2d");
    g.fillStyle = hexs(o.wall); g.fillRect(0, 0, W, H);
    if (o.brick) { for (var y = 0; y < H; y += 12) for (var x = (y / 12) % 2 ? -12 : 0; x < W; x += 24) { g.fillStyle = shade(o.wall, (Math.random() - 0.5) * 0.25); g.fillRect(x + 1, y + 1, 22, 10); } }
    else if (o.wood) { for (var y2 = 0; y2 < H; y2 += 16) { g.fillStyle = shade(o.wall, (Math.random() - 0.5) * 0.2); g.fillRect(0, y2, W, 14); g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(0, y2 + 14, W, 2); } }
    else noise(g, W, H, 1400, 0.08, 3);
    // карниз и цоколь
    g.fillStyle = shade(o.wall, -0.35); g.fillRect(0, H - 34, W, 34); g.fillStyle = shade(o.wall, 0.25); g.fillRect(0, 0, W, 8);
    ge.fillStyle = "#000"; ge.fillRect(0, 0, W, H);
    var cols = o.cols || 3, rows = o.rows || 4, ww = W / cols * 0.5, wh = (H - 50) / rows * 0.55;
    for (var r = 0; r < rows; r++) for (var q = 0; q < cols; q++) {
      var wx = (q + 0.5) * W / cols - ww / 2, wy = 16 + (r + 0.2) * (H - 50) / rows;
      g.fillStyle = shade(o.wall, -0.45); g.fillRect(wx - 4, wy - 4, ww + 8, wh + 8);
      var gl = g.createLinearGradient(wx, wy, wx + ww, wy + wh); gl.addColorStop(0, o.glass || "#5d7fa8"); gl.addColorStop(1, "#1f2f48"); g.fillStyle = gl; g.fillRect(wx, wy, ww, wh);
      g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(wx + 3, wy + 3, ww * 0.25, wh - 6);
      g.fillStyle = shade(o.wall, 0.3); g.fillRect(wx - 6, wy + wh + 2, ww + 12, 5);
      if (o.shutters) { g.fillStyle = o.shutters; g.fillRect(wx - 14, wy, 9, wh); g.fillRect(wx + ww + 5, wy, 9, wh); }
      if (Math.random() < 0.6) { ge.fillStyle = Math.random() < 0.5 ? "#ffcf7a" : "#ffe6a8"; ge.fillRect(wx, wy, ww, wh); }
    }
    if (o.door) { g.fillStyle = shade(o.wall, -0.6); g.fillRect(W / 2 - 22, H - 80, 44, 80); g.fillStyle = "#c9a35a"; g.fillRect(W / 2 + 12, H - 44, 5, 5); ge.fillStyle = "#ffb85a"; ge.fillRect(W / 2 - 18, H - 76, 36, 12); }
    var res = { map: tex(c), emissive: tex(e) };
    texCache[key] = res; return res;
  }
  /* иконки-спрайты */
  function spriteTex(key, draw, size) {
    if (texCache[key]) return texCache[key];
    var c = canvas(size || 128), g = c.getContext("2d"); draw(g, size || 128);
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; texCache[key] = t; return t;
  }
  function glowTex() {
    return spriteTex("glow", function (g, s) { var r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); r.addColorStop(0, "rgba(255,240,200,1)"); r.addColorStop(0.25, "rgba(255,200,120,.55)"); r.addColorStop(1, "rgba(255,180,80,0)"); g.fillStyle = r; g.fillRect(0, 0, s, s); }, 64);
  }

  /* ---------- Небо: градиент + солнце (шейдер), тот же градиент — в отражения ---------- */
  var SKY_VS = "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }";
  var SKY_FS = [
    "uniform vec3 top; uniform vec3 hor; uniform vec3 bot; uniform vec3 sunDir; uniform vec3 sunCol; uniform float sunSize; uniform float stars;",
    "varying vec3 vP;",
    "float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453); }",
    "void main(){ float y = vP.y; vec3 c = y > 0.0 ? mix(hor, top, pow(clamp(y,0.0,1.0), 0.55)) : mix(hor, bot, clamp(-y*4.0,0.0,1.0));",
    " float d = max(dot(vP, normalize(sunDir)), 0.0); c += sunCol * (pow(d, 900.0/sunSize) * 2.0 + pow(d, 12.0) * 0.25);",
    " if (stars > 0.0 && y > 0.05) { vec3 q = floor(vP * 260.0); float s = step(0.9975, h(q)); c += vec3(s) * stars * smoothstep(0.05, 0.4, y); }",
    " gl_FragColor = vec4(c, 1.0); }"
  ].join("\n");
  function makeSky() {
    skyU = { top: { value: new T.Color() }, hor: { value: new T.Color() }, bot: { value: new T.Color() }, sunDir: { value: new T.Vector3(0.3, 0.5, 1) }, sunCol: { value: new T.Color() }, sunSize: { value: 1 }, stars: { value: 0 } };
    var m = new T.ShaderMaterial({ uniforms: skyU, vertexShader: SKY_VS, fragmentShader: SKY_FS, side: T.BackSide, depthWrite: false, fog: false });
    sky = new T.Mesh(new T.SphereGeometry(300, 32, 16), m); sky.renderOrder = -10; sky.frustumCulled = false;
    scene.add(sky);
  }
  /* отражения: сфера с вертексными цветами (линейными) → PMREM */
  function rebuildEnv(p) {
    if (!pmrem) return;
    try {
      var es = new T.Scene(), g = new T.SphereGeometry(50, 24, 12), col = [], pos = g.attributes.position;
      var top = lin(p.top), hor = lin(p.hor), bot = lin(p.ground || p.bot), sc = lin(p.sunCol);
      var sd = new T.Vector3().copy(skyU.sunDir.value).normalize(), v = new T.Vector3();
      for (var i = 0; i < pos.count; i++) {
        v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize();
        var c = v.y > 0 ? hor.clone().lerp(top, Math.pow(v.y, 0.55)) : hor.clone().lerp(bot, Math.min(1, -v.y * 3));
        var d = Math.max(0, v.dot(sd)); c.add(sc.clone().multiplyScalar(Math.pow(d, 16) * 3 * p.sunI));
        col.push(c.r, c.g, c.b);
      }
      g.setAttribute("color", new T.Float32BufferAttribute(col, 3));
      es.add(new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
      if (envRT) envRT.dispose();
      envRT = pmrem.fromScene(es, 0.04);
      scene.environment = envRT.texture;
      g.dispose();
    } catch (e) { scene.environment = null; }
  }

  /* ---------- Палитры времени суток ----------
     p: top, hor, bot(низ неба), ground(для отражений), sunCol, sunI, hemiSky, hemiGround, hemiI, fog, fogNear, fogFar, sunEl(высота солнца, рад), stars, exposure */
  function mixPal(a, b, t) {
    var o = {};
    Object.keys(a).forEach(function (k) {
      var x = a[k], y = b[k] != null ? b[k] : x;
      o[k] = (typeof x === "number" && k.length && /top|hor|bot|ground|Col|Sky|Ground|fog$/.test(k)) ? lerpHex(x, y, t) : (typeof x === "number" ? x + (y - x) * t : x);
    });
    return o;
  }
  function applyPal(p, rebuild) {
    curPal = p;
    skyU.top.value.set(p.top); skyU.hor.value.set(p.hor); skyU.bot.value.set(p.bot);
    skyU.sunCol.value.set(p.sunCol).multiplyScalar(Math.min(1, p.sunI));
    skyU.stars.value = p.stars || 0;
    var el = p.sunEl, az = 0.55;
    skyU.sunDir.value.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    sun.color.copy(lin(p.sunCol)); sun.intensity = p.sunI * 2.2;
    hemi.color.copy(lin(p.hemiSky)); hemi.groundColor.copy(lin(p.hemiGround)); hemi.intensity = p.hemiI * 0.95;
    if (!scene.fog) scene.fog = new T.Fog(0, 1, 2);
    scene.fog.color.copy(lin(p.fog)); scene.fog.near = p.fogNear; scene.fog.far = p.fogFar;
    renderer.setClearColor(new T.Color(p.hor), 1);
    renderer.toneMappingExposure = p.exposure || 1;
    night = p.night || 0;
    nightMats.forEach(function (m) { m.emissiveIntensity = m.userData.nightEi * night; });
    if (headLamp) { headLamp.intensity = night * 1.6; headLamp.visible = night > 0.05; }
    if (rebuild) rebuildEnv(p);
  }

  /* ---------- Создание ---------- */
  function init(cv) {
    renderer = new T.WebGLRenderer({ canvas: cv, antialias: !mobile, powerPreference: "high-performance" });
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.setPixelRatio(quality.ratio);
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(60, 1, 0.15, 650);
    hemi = new T.HemisphereLight(0xffffff, 0x444444, 1); scene.add(hemi);
    sun = new T.DirectionalLight(0xffffff, 2.5);
    sun.castShadow = true; sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
    var sc = sun.shadow.camera; sc.left = -11; sc.right = 11; sc.top = 22; sc.bottom = -14; sc.near = 1; sc.far = 90;
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
    scene.add(sun); scene.add(sun.target);
    headLamp = new T.PointLight(0xffd9a0, 0, 18, 1.6); scene.add(headLamp);
    makeSky();
    try { pmrem = new T.PMREMGenerator(renderer); } catch (e) { pmrem = null; }
    addEventListener("resize", resize); resize();
    return { renderer: renderer, scene: scene, camera: camera };
  }
  function resize() {
    var w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.userData.baseFov = w / h < 0.8 ? 70 : 56; camera.fov = camera.userData.baseFov; camera.updateProjectionMatrix();
  }
  /* солнце и его тени следуют за героем */
  function follow(x, z) {
    var d = skyU.sunDir.value;
    var far = sun.shadow.camera.far > 100 ? 70 : 40;
    sun.position.set(x + d.x * far, d.y * far + 4, z + d.z * far + 4);
    sun.target.position.set(x, 0, z + 4);
    sky.position.set(x, 0, z);
    headLamp.position.set(x, 3.2, z + 2.5);
  }
  /* размер области теней: обычный для трассы, большой для площади стройки */
  function shadowBox(big) {
    var sc = sun.shadow.camera;
    if (big) { sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.far = 140; } else { sc.left = -11; sc.right = 11; sc.top = 22; sc.bottom = -14; sc.far = 90; }
    sc.updateProjectionMatrix();
  }
  /* понижение качества, если кадры тяжёлые */
  function setQuality(level) {
    quality.level = level;
    quality.shadows = level >= 1;
    renderer.shadowMap.enabled = quality.shadows; sun.castShadow = quality.shadows;
    var ms = level >= 2 ? (mobile ? 1024 : 2048) : 512;
    if (sun.shadow.mapSize.x !== ms) { sun.shadow.mapSize.set(ms, ms); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
    quality.ratio = level >= 2 ? Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2) : level === 1 ? Math.min(window.devicePixelRatio || 1, 1.25) : 1;
    renderer.setPixelRatio(quality.ratio); resize();
    scene.traverse(function (o) { if (o.material) o.material.needsUpdate = true; });
  }

  /* ---------- Склейка геометрии: меньше вызовов отрисовки ----------
     merge(root): все неподвижные меши внутри root (кроме userData.keep и веток userData.noMerge) склеиваются по материалам.
     mergeBones(root): у каждого узла склеиваются только прямые дети-меши (для скелета героини: суставы продолжают двигаться). */
  function concatGeos(list) {
    var n = 0, hasUv = list.every(function (g) { return !!g.attributes.uv; });
    list.forEach(function (g) { n += g.attributes.position.count; });
    var pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = hasUv ? new Float32Array(n * 2) : null, o = 0;
    list.forEach(function (g) {
      pos.set(g.attributes.position.array, o * 3);
      if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3);
      if (uv) uv.set(g.attributes.uv.array, o * 2);
      o += g.attributes.position.count; g.dispose();
    });
    var out = new T.BufferGeometry();
    out.setAttribute("position", new T.BufferAttribute(pos, 3)); out.setAttribute("normal", new T.BufferAttribute(nor, 3));
    if (uv) out.setAttribute("uv", new T.BufferAttribute(uv, 2));
    out.computeBoundingSphere();
    return out;
  }
  function prepGeo(mesh, mtx) {
    var g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    g.applyMatrix4(mtx);
    if (mtx.determinant() < 0) { /* зеркальные масштабы не используем */ }
    return g;
  }
  function merge(root) {
    root.updateMatrixWorld(true);
    var inv = new T.Matrix4().copy(root.matrixWorld).invert(), buckets = {}, remove = [];
    (function walk(o) {
      o.children.forEach(function (c) {
        if (c.userData.noMerge) return;
        if (c.isMesh && !c.isInstancedMesh && !c.userData.keep && !Array.isArray(c.material) && !c.isSkinnedMesh) {
          var m = c.material, b = buckets[m.uuid] || (buckets[m.uuid] = { m: m, list: [], cast: false, recv: false });
          b.list.push(prepGeo(c, new T.Matrix4().multiplyMatrices(inv, c.matrixWorld))); b.cast = b.cast || c.castShadow; b.recv = b.recv || c.receiveShadow;
          remove.push(c);
        }
        walk(c);
      });
    })(root);
    remove.forEach(function (c) { if (c.children.length) { var keep = c.children.slice(); keep.forEach(function (k) { c.parent.add(k); }); } c.parent.remove(c); });
    Object.keys(buckets).forEach(function (k) { var b = buckets[k]; if (!b.list.length) return; var ms = new T.Mesh(concatGeos(b.list), b.m); ms.castShadow = b.cast; ms.receiveShadow = b.recv; root.add(ms); });
    return root;
  }
  function mergeBones(root) {
    var nodes = []; root.traverse(function (o) { if (!o.isMesh) nodes.push(o); });
    nodes.forEach(function (node) {
      var buckets = {}, list = node.children.filter(function (c) { return c.isMesh && !c.userData.keep && !Array.isArray(c.material) && c.children.length === 0; });
      list.forEach(function (c) { (buckets[c.material.uuid] = buckets[c.material.uuid] || []).push(c); });
      Object.keys(buckets).forEach(function (k) {
        var arr = buckets[k]; if (arr.length < 2) return;
        var geos = arr.map(function (c) { c.updateMatrix(); return prepGeo(c, c.matrix); });
        var ms = new T.Mesh(concatGeos(geos), arr[0].material); ms.castShadow = arr.some(function (c) { return c.castShadow; });
        arr.forEach(function (c) { node.remove(c); }); node.add(ms);
      });
    });
    return root;
  }

  return {
    merge: merge, mergeBones: mergeBones, shadowBox: shadowBox,
    init: init, mat: mat, basic: basic, lin: lin, hexs: hexs, shade: shade, noise: noise, canvas: canvas, tex: tex,
    roadTex: roadTex, groundTex: groundTex, facade: facade, spriteTex: spriteTex, glowTex: glowTex,
    mixPal: mixPal, applyPal: applyPal, rebuildEnv: rebuildEnv, follow: follow, setQuality: setQuality, quality: function () { return quality; },
    night: function () { return night; }, pal: function () { return curPal; }, mobile: mobile,
    get renderer() { return renderer; }, get scene() { return scene; }, get camera() { return camera; }
  };
})();
