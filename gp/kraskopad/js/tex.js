/* Краскопад · процедурные текстуры (холст) и небо. Без внешних файлов: фактура для рельефа, стен, коры, камня. */
window.KP = window.KP || {};
(function (KP) {
  "use strict";
  function canvas(n) { var c = document.createElement("canvas"); c.width = c.height = n; return c; }
  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  /* серо-белый шум (множитель к цвету вершин): средняя яркость ≈ 0.9, чтобы не темнить */
  function noiseTex(n, seed, contrast, blobs) {
    var c = canvas(n), g = c.getContext("2d"), r = rnd(seed), img = g.createImageData(n, n);
    // базовый шум крупный + мелкий (тайлится: делаем по модулю)
    var big = [], S = 16;
    for (var i = 0; i < S * S; i++) big.push(r());
    function bv(x, y) {
      var fx = x / n * S, fy = y / n * S, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
      tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
      function at(a, b) { return big[((b % S + S) % S) * S + ((a % S + S) % S)]; }
      var a = at(ix, iy), b = at(ix + 1, iy), cc = at(ix, iy + 1), d = at(ix + 1, iy + 1);
      return (a + (b - a) * tx) * (1 - ty) + (cc + (d - cc) * tx) * ty;
    }
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var v = 0.55 * bv(x, y) + 0.45 * r();
      var o = (y * n + x) * 4, k = Math.round(255 * (1 - contrast + contrast * v));
      img.data[o] = img.data[o + 1] = img.data[o + 2] = k; img.data[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    if (blobs) { for (var b = 0; b < blobs; b++) { g.fillStyle = "rgba(0,0,0," + (0.03 + r() * 0.05) + ")"; g.beginPath(); g.arc(r() * n, r() * n, 2 + r() * n * 0.05, 0, 6.3); g.fill(); } }
    var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
    return t;
  }
  /* полосы досок/металла — для построек и ящиков */
  function plankTex() {
    var n = 128, c = canvas(n), g = c.getContext("2d"), r = rnd(77);
    for (var i = 0; i < 8; i++) {
      var k = 200 + Math.floor(r() * 40); g.fillStyle = "rgb(" + k + "," + (k - 8) + "," + (k - 20) + ")"; g.fillRect(0, i * 16, n, 16);
      g.fillStyle = "rgba(60,40,20,0.45)"; g.fillRect(0, i * 16 + 15, n, 1);
      for (var j = 0; j < 30; j++) { g.fillStyle = "rgba(90,60,30," + (r() * 0.12) + ")"; g.fillRect(r() * n, i * 16 + r() * 15, 10 + r() * 30, 1); }
    }
    g.fillStyle = "rgba(40,40,45,0.8)"; g.fillRect(0, 0, 4, n); g.fillRect(n - 4, 0, 4, n);
    var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  /* мягкий круг для вспышек и частиц */
  function glowTex() {
    var n = 64, c = canvas(n), g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,0.6)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, n, n); return new THREE.CanvasTexture(c);
  }
  /* клякса краски с брызгами — для следов */
  function splatTex() {
    var n = 128, c = canvas(n), g = c.getContext("2d"), r = rnd(5);
    g.fillStyle = "#fff";
    g.beginPath(); g.arc(64, 64, 30, 0, 6.3); g.fill();
    for (var i = 0; i < 14; i++) { var a = r() * 6.28, d = 26 + r() * 26, s = 3 + r() * 9; g.beginPath(); g.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, s, 0, 6.3); g.fill(); }
    for (var k = 0; k < 8; k++) { var a2 = r() * 6.28; g.beginPath(); g.ellipse(64 + Math.cos(a2) * 34, 64 + Math.sin(a2) * 34, 14, 5, a2, 0, 6.3); g.fill(); }
    return new THREE.CanvasTexture(c);
  }

  var T = null;
  KP.tex = function () {
    if (T) return T;
    T = { ground: noiseTex(256, 11, 0.32, 60), wall: noiseTex(128, 23, 0.18, 30), bark: noiseTex(64, 31, 0.4, 0), rock: noiseTex(128, 41, 0.45, 40), plank: plankTex(), glow: glowTex(), splat: splatTex() };
    return T;
  };

  /* небо: полусфера с градиентом и солнцем (ShaderMaterial, без освещения, без тумана) */
  KP.makeSky = function (scene, sunDir) {
    var g = new THREE.SphereGeometry(380, 24, 12);
    var m = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color("#2f6fb8") }, mid: { value: new THREE.Color("#8cc4ea") }, hor: { value: new THREE.Color("#dcebf2") }, sun: { value: sunDir.clone().normalize() }, sunCol: { value: new THREE.Color("#fff3d6") } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform vec3 top; uniform vec3 mid; uniform vec3 hor; uniform vec3 sun; uniform vec3 sunCol; varying vec3 vP;" +
        "void main(){ float h = vP.y; vec3 c = h > 0.25 ? mix(mid, top, smoothstep(0.25, 0.9, h)) : mix(hor, mid, smoothstep(-0.02, 0.25, h));" +
        "float s = max(dot(normalize(vP), sun), 0.0); c += sunCol * (pow(s, 600.0) * 1.6 + pow(s, 12.0) * 0.25);" +
        "if (h < -0.02) c = hor; gl_FragColor = vec4(c, 1.0); }"
    });
    var sky = new THREE.Mesh(g, m); sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);
    return sky;
  };
})(window.KP);
