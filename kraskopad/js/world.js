/* Краскопад · остров (полуреалистичный стиль): рельеф с фактурой, 10 локаций, постройки, природа, вода, коллизии.
   Статичные постройки слиты в один меш (цвет вершин + общая фактура с мировыми UV), деревья/камни/ящики/трава — InstancedMesh.
   Высота рельефа считается по той же сетке 4 м, что и меш (совпадение с треугольниками). */
window.KP = window.KP || {};
(function (KP) {
  "use strict";
  var HALF = 220, STEP = 4, N = 111, IR = 168;
  var CELL = 8, GN = 56;

  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  KP.mulberry = mulberry;
  function hash(i, j) { var h = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function sm(t) { return t * t * (3 - 2 * t); }
  function vnoise(x, z) {
    var i = Math.floor(x), j = Math.floor(z), fx = sm(x - i), fz = sm(z - j);
    var a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
    return (a + (b - a) * fx) + ((c + (d - c) * fx) - (a + (b - a) * fx)) * fz;
  }
  function fbm(x, z) { return vnoise(x, z) * 0.6 + vnoise(x * 2.1 + 7, z * 2.1 + 3) * 0.3 + vnoise(x * 4.3 + 1, z * 4.3 + 9) * 0.1; }
  function smoothstep(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return sm(t); }

  /* ---------- карты (Э10): у каждой свой рельеф, локации, палитра, погода ---------- */
  function gauss(x, z, cx, cz, r, h) { var dx = x - cx, dz = z - cz; return h * Math.exp(-(dx * dx + dz * dz) / (2 * r * r)); }
  var MAPS = {
    isle: {
      seed: 20261112, winter: false, atmos: ["day", "day", "sunset", "morning", "storm", "dusk"],
      pois: [
        { key: "poi0", kind: "port", x: -138, z: 22, r: 26, flat: 1.5, bias: { 4: 1.6, 2: 1.3 } },
        { key: "poi1", kind: "city", x: 2, z: 4, r: 36, bias: { 1: 1.2, 2: 1.4, 3: 1.2 } },
        { key: "poi2", kind: "forest", x: -56, z: -86, r: 38, bias: { 3: 1.5 } },
        { key: "poi3", kind: "peak", x: 108, z: -32, r: 18, bias: { 5: 3 } },
        { key: "poi4", kind: "factory", x: 88, z: 86, r: 28, bias: { 6: 2.5, 4: 1.2 } },
        { key: "poi5", kind: "camp", x: -122, z: -48, r: 18, bias: { 4: 1.4, 5: 1.4 }, items: 1.6 },
        { key: "poi6", kind: "beach", x: 26, z: -144, r: 20, flat: 1.1, bias: { 1: 1.4, 3: 1.4 } },
        { key: "poi7", kind: "farm", x: -76, z: 96, r: 26, bias: { 3: 1.5, 2: 1.2 } },
        { key: "poi8", kind: "lighthouse", x: 6, z: 150, r: 14, bias: { 5: 2 } },
        { key: "poi9", kind: "dam", x: 36, z: 86, r: 20, bias: { 4: 1.5, 6: 1.3 } }
      ],
      lake: { x: 40, z: 108, r: 17, h: -2.2 },
      noflat: { peak: 1, lighthouse: 1, forest: 1 },
      raw: function (x, z) {
        var d = Math.sqrt(x * x + z * z) / IR + (vnoise(x * 0.025 + 11, z * 0.025 + 5) - 0.5) * 0.2;
        var land = smoothstep(1.02, 0.84, d);
        var h = -3.4 + land * 4.8 + land * land * (fbm(x * 0.013, z * 0.013) * 10 - 3.6);
        h += gauss(x, z, 108, -32, 24, 26) + gauss(x, z, 6, 150, 14, 9) + gauss(x, z, 70, 40, 30, 8);
        return h;
      }
    },
    frost: {
      seed: 20261113, winter: true, atmos: ["frost", "snow", "polar", "frost", "snow"],
      pois: [
        { key: "wpoi0", kind: "station", x: -34, z: 112, r: 24, bias: { 4: 1.5, 2: 1.2 }, items: 1.4 },
        { key: "wpoi1", kind: "resort", x: 92, z: 66, r: 28, bias: { 1: 1.3, 3: 1.4 } },
        { key: "wpoi2", kind: "harbor", x: -142, z: -8, r: 26, flat: 1.4, bias: { 4: 1.6, 6: 1.3 } },
        { key: "wpoi3", kind: "mine", x: 64, z: -96, r: 22, bias: { 3: 1.6, 6: 1.6 } },
        { key: "wpoi4", kind: "village", x: -62, z: -54, r: 32, bias: { 1: 1.3, 2: 1.4 } },
        { key: "wpoi5", kind: "observatory", x: 18, z: 8, r: 16, bias: { 5: 3 } },
        { key: "wpoi6", kind: "radar", x: -112, z: 78, r: 18, bias: { 4: 1.4, 5: 1.6 } },
        { key: "wpoi7", kind: "icelake", x: 120, z: -30, r: 26, flat: 0.15, bias: { 2: 1.4, 3: 1.3 } }
      ],
      lake: null,
      noflat: { observatory: 1 },
      raw: function (x, z) {
        var d = Math.sqrt(x * x * 0.85 + z * z * 1.1) / IR + (vnoise(x * 0.02 + 31, z * 0.02 + 7) - 0.5) * 0.28;
        var land = smoothstep(1.02, 0.82, d);
        var h = -3.6 + land * 5.2 + land * land * (fbm(x * 0.011 + 5, z * 0.011) * 12 - 4.2);
        // хребет с северо-востока на юго-запад и пик обсерватории в центре
        var t = Math.max(0, Math.min(1, ((x + 90) * 0.7 + (z + 70) * 0.7) / 260)), rx = -90 + t * 182, rz = -70 + t * 182, rd = Math.hypot(x - rx, z - rz);
        h += land * 14 * Math.exp(-rd * rd / (2 * 22 * 22)) * (0.6 + 0.4 * vnoise(x * 0.03, z * 0.03));
        h += gauss(x, z, 18, 8, 20, 22);
        return h;
      }
    }
  };
  var MAP = MAPS.isle, POIS = [], LAKE = null, H = new Float32Array(N * N), mapId = "isle";
  function rawH(x, z) {
    var h = MAP.raw(x, z);
    if (LAKE) { var ld = Math.hypot(x - LAKE.x, z - LAKE.z); if (ld < LAKE.r + 10) h = h + (LAKE.h - h) * smoothstep(LAKE.r + 10, LAKE.r - 4, ld); }
    return h;
  }
  /* загрузить карту: рельеф, локации, пустая сетка коллизий */
  function load(id) {
    mapId = MAPS[id] ? id : "isle"; MAP = MAPS[mapId];
    POIS = MAP.pois.map(function (p) { return Object.assign({}, p); }); LAKE = MAP.lake;
    POIS.forEach(function (p) { if (!MAP.noflat[p.kind]) p.level = p.flat !== undefined ? p.flat : Math.max(1.8, rawH(p.x, p.z)); });
    for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) {
      var x = -HALF + j * STEP, z = -HALF + i * STEP, h = rawH(x, z);
      for (var q = 0; q < POIS.length; q++) {
        var pp = POIS[q]; if (pp.level === undefined) continue;
        var dd = Math.sqrt((x - pp.x) * (x - pp.x) + (z - pp.z) * (z - pp.z)), w = smoothstep(pp.r + 18, pp.r + 2, dd);
        h = h + (pp.level - h) * w;
      }
      H[i * N + j] = h;
    }
    for (var g2 = 0; g2 < grid.length; g2++) grid[g2].length = 0;
    if (KP.world) { KP.world.POIS = POIS; KP.world.LAKE = LAKE; KP.world.map = mapId; KP.world.MAP = MAP; }
  }
  function height(x, z) {
    var fx = (x + HALF) / STEP, fz = (z + HALF) / STEP;
    if (fx < 0) fx = 0; if (fz < 0) fz = 0; if (fx > N - 1.001) fx = N - 1.001; if (fz > N - 1.001) fz = N - 1.001;
    var j = Math.floor(fx), i = Math.floor(fz), u = fx - j, v = fz - i, k = i * N + j;
    if (u + v <= 1) return H[k] + (H[k + 1] - H[k]) * u + (H[k + N] - H[k]) * v;
    return H[k + N + 1] + (H[k + N] - H[k + N + 1]) * (1 - u) + (H[k + 1] - H[k + N + 1]) * (1 - v);
  }
  function slope(x, z) { return Math.hypot(height(x + 2, z) - height(x - 2, z), height(x, z + 2) - height(x, z - 2)) / 4; }

  /* ---------- коллизии: сетка 8 м ---------- */
  var grid = []; for (var g = 0; g < GN * GN; g++) grid.push([]);
  function cellsOf(x0, z0, x1, z1, fn) {
    var a = Math.max(0, Math.floor((x0 + HALF) / CELL)), b = Math.min(GN - 1, Math.floor((x1 + HALF) / CELL));
    var c = Math.max(0, Math.floor((z0 + HALF) / CELL)), d = Math.min(GN - 1, Math.floor((z1 + HALF) / CELL));
    for (var i = c; i <= d; i++) for (var j = a; j <= b; j++) fn(grid[i * GN + j]);
  }
  function addCol(c) {
    if (c.r) cellsOf(c.x - c.r, c.z - c.r, c.x + c.r, c.z + c.r, function (l) { l.push(c); });
    else cellsOf(c.x0, c.z0, c.x1, c.z1, function (l) { l.push(c); });
    c.alive = true;
  }
  function removeCol(c) {
    c.alive = false;
    var f = function (l) { var i = l.indexOf(c); if (i >= 0) l.splice(i, 1); };
    if (c.r) cellsOf(c.x - c.r, c.z - c.r, c.x + c.r, c.z + c.r, f); else cellsOf(c.x0, c.z0, c.x1, c.z1, f);
  }
  var qStamp = 1;
  function query(x0, z0, x1, z1) {
    var out = []; qStamp++;
    cellsOf(x0, z0, x1, z1, function (l) { for (var k = 0; k < l.length; k++) { var c = l[k]; if (c._q !== qStamp) { c._q = qStamp; out.push(c); } } });
    return out;
  }

  /* ---------- слияние геометрии с цветом вершин и мировыми UV ---------- */
  function Merger(uvScale) { this.parts = []; this.s = uvScale || 0.25; }
  var _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _sc = new THREE.Vector3(), _p = new THREE.Vector3();
  Merger.prototype.add = function (geo, x, y, z, rx, ry, rz, sx, sy, sz, color) {
    _e.set(rx || 0, ry || 0, rz || 0); _q.setFromEuler(_e); _sc.set(sx || 1, sy || 1, sz || 1); _p.set(x, y, z);
    _m.compose(_p, _q, _sc);
    var g2 = geo.index ? geo.toNonIndexed() : geo.clone(); g2.applyMatrix4(_m);
    this.parts.push({ g: g2, c: new THREE.Color(color) });
  };
  Merger.prototype.build = function (flat) {
    var total = 0, s = this.s; this.parts.forEach(function (p) { total += p.g.attributes.position.count; });
    var P = new Float32Array(total * 3), NN = new Float32Array(total * 3), C = new Float32Array(total * 3), U = new Float32Array(total * 2), o = 0;
    this.parts.forEach(function (p) {
      if (flat) p.g.computeVertexNormals();
      var a = p.g.attributes.position, nn = p.g.attributes.normal;
      for (var k = 0; k < a.count; k++) {
        var x = a.getX(k), y = a.getY(k), z = a.getZ(k), nx = nn.getX(k), ny = nn.getY(k), nz = nn.getZ(k);
        P[o * 3] = x; P[o * 3 + 1] = y; P[o * 3 + 2] = z; NN[o * 3] = nx; NN[o * 3 + 1] = ny; NN[o * 3 + 2] = nz;
        var ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
        if (ay >= ax && ay >= az) { U[o * 2] = x * s; U[o * 2 + 1] = z * s; } else if (ax >= az) { U[o * 2] = z * s; U[o * 2 + 1] = y * s; } else { U[o * 2] = x * s; U[o * 2 + 1] = y * s; }
        C[o * 3] = p.c.r; C[o * 3 + 1] = p.c.g; C[o * 3 + 2] = p.c.b; o++;
      }
      p.g.dispose();
    });
    var sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(P, 3)); sg.setAttribute("normal", new THREE.BufferAttribute(NN, 3));
    sg.setAttribute("color", new THREE.BufferAttribute(C, 3)); sg.setAttribute("uv", new THREE.BufferAttribute(U, 2));
    sg.computeBoundingSphere();
    return sg;
  };
  KP.Merger = Merger;

  /* ---------- построение мира ---------- */
  function build(scene0, quality) {
    var rnd = mulberry(MAP.seed), TX = KP.tex(), hi = quality === "high", WIN = MAP.winter;
    var scene = new THREE.Group(); scene0.add(scene);   // всё мира — в одной группе, чтобы сменить карту
    var M = new Merger(0.25);
    var B = new THREE.BoxGeometry(1, 1, 1), CYL = new THREE.CylinderGeometry(1, 1, 1, 10), CYL6 = new THREE.CylinderGeometry(1, 1, 1, 6);
    var boxes = [], circles = [], chests = [], lootSpots = [], anim = [];

    function solid(x0, x1, z0, z1, y0, y1, kind) { var b = { x0: x0, x1: x1, z0: z0, z1: z1, y0: y0, y1: y1, kind: kind || "house" }; addCol(b); boxes.push(b); return b; }
    function pillar(x, z, r, top, kind) { var c = { x: x, z: z, r: r, top: top, kind: kind || "rock" }; addCol(c); circles.push(c); return c; }
    function free(x, z, rad) {
      var near = query(x - rad, z - rad, x + rad, z + rad);
      for (var k = 0; k < near.length; k++) {
        var c = near[k];
        if (c.r) { if (Math.hypot(c.x - x, c.z - z) < c.r + rad) return false; }
        else if (x > c.x0 - rad && x < c.x1 + rad && z > c.z0 - rad && z < c.z1 + rad) return false;
      }
      return height(x, z) > 0.5;
    }
    function baseY(x, z, w, d) { return Math.min(height(x - w / 2, z - d / 2), height(x + w / 2, z + d / 2), height(x - w / 2, z + d / 2), height(x + w / 2, z - d / 2), height(x, z)); }
    function spots(x, z, R, n, poi) { for (var k = 0; k < n; k++) { var a = rnd() * 6.28, rr = R + 1.2 + rnd() * 2.5; lootSpots.push({ x: x + Math.cos(a) * rr, z: z + Math.sin(a) * rr, poi: poi }); } }

    var STUCCO = ["#d9cdb8", "#cbb79a", "#c4ccc8", "#d8bfa8", "#b7c0c6", "#e0d6c4", "#c9b8a6"];
    var ROOF = ["#8f4a35", "#7d4231", "#4b5058", "#3d5b58", "#6a5a4e"];
    function pick(a) { return a[Math.floor(rnd() * a.length)]; }
    function windows(x, z, W, D, gy, floors, rot) {
      var glass = "#2b3944", frame = "#e8e4dc";
      for (var f = 0; f < floors; f++) {
        var wy = gy + 1.7 + f * 3;
        [-1, 1].forEach(function (s) {
          // по длинным сторонам (±z)
          for (var t = -1; t <= 1; t += 2) {
            var wx = x + t * W / 4;
            M.add(B, wx, wy, z + s * (D / 2 + 0.03), 0, 0, 0, 1.2, 1.3, 0.06, frame);
            M.add(B, wx, wy, z + s * (D / 2 + 0.06), 0, 0, 0, 1.0, 1.1, 0.04, glass);
          }
          M.add(B, x + s * (W / 2 + 0.03), wy, z, 0, 0, 0, 0.06, 1.3, 1.2, frame);
          M.add(B, x + s * (W / 2 + 0.06), wy, z, 0, 0, 0, 0.04, 1.1, 1.0, glass);
        });
      }
    }
    function house(x, z, w, d, floors, poi, flatRoof) {
      var gy = baseY(x, z, w, d), base = gy - 0.8, hh = floors * 3 + 0.4, col = pick(STUCCO);
      M.add(B, x, base + (hh + 0.8) / 2, z, 0, 0, 0, w, hh + 0.8, d, col);
      M.add(B, x, gy + 0.25, z, 0, 0, 0, w + 0.15, 0.5, d + 0.15, "#7c766c");   // цоколь
      M.add(B, x, gy + 1.15, z + d / 2 + 0.05, 0, 0, 0, 1.2, 2.3, 0.1, "#5b3f2c"); // дверь
      M.add(B, x, gy + 2.4, z + d / 2 + 0.35, 0, 0, 0, 1.8, 0.12, 0.7, "#6b6259"); // козырёк
      windows(x, z, w, d, gy, floors);
      var top = base + hh + 0.8;
      if (flatRoof) {
        M.add(B, x, top + 0.25, z, 0, 0, 0, w + 0.2, 0.5, d + 0.2, "#8d877d");
        M.add(B, x + w / 4, top + 0.9, z - d / 4, 0, 0, 0, 1.2, 0.9, 1.2, "#9aa0a4");  // вентиляция
        solid(x - w / 2, x + w / 2, z - d / 2, z + d / 2, base, top + 0.5);
      } else {
        var roof = new THREE.ConeGeometry(0.75, 1, 4); roof.rotateY(Math.PI / 4);
        M.add(roof, x, top + 1.25, z, 0, 0, 0, w * 1.25, 2.5, d * 1.25, pick(ROOF));
        solid(x - w / 2, x + w / 2, z - d / 2, z + d / 2, base, top + 2.5);
      }
      spots(x, z, Math.max(w, d) / 2, 3 + floors, poi);
      if (rnd() < 0.55) { var a2 = rnd() * 6.28, r2 = Math.max(w, d) / 2 + 1.5; chests.push({ x: x + Math.cos(a2) * r2, z: z + Math.sin(a2) * r2, poi: poi }); }
    }
    function container(x, z, rotX, y, color) {
      var w = rotX ? 2.5 : 6, d = rotX ? 6 : 2.5, gy = y !== undefined ? y : baseY(x, z, w, d);
      M.add(B, x, gy + 1.3, z, 0, 0, 0, w, 2.6, d, color);
      for (var k = -2; k <= 2; k++) M.add(B, x + (rotX ? 0 : k * 1.15), gy + 1.3, z + (rotX ? k * 1.15 : 0), 0, 0, 0, rotX ? w + 0.06 : 0.12, 2.5, rotX ? 0.12 : d + 0.06, new THREE.Color(color).multiplyScalar(0.8).getStyle());
      solid(x - w / 2, x + w / 2, z - d / 2, z + d / 2, gy - 0.5, gy + 2.6, "house");
      return gy + 2.6;
    }
    function car(x, z, ry, color) {
      var gy = height(x, z), sw = Math.abs(Math.sin(ry)) > 0.5, L = 4.2, W = 1.9;
      M.add(B, x, gy + 0.65, z, 0, ry, 0, W, 0.75, L, color);
      M.add(B, x, gy + 1.3, z - (sw ? 0 : 0.2), 0, ry, 0, W * 0.9, 0.6, L * 0.5, "#2b3944");
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { var ox = q[0] * W / 2, oz = q[1] * L * 0.32; var rx = sw ? oz : ox, rz = sw ? ox : oz; M.add(CYL, x + rx, gy + 0.35, z + rz, 0, 0, Math.PI / 2, 0.35, 0.25, 0.35, "#1d1f22"); });
      var hw = sw ? L / 2 : W / 2, hd = sw ? W / 2 : L / 2;
      solid(x - hw, x + hw, z - hd, z + hd, gy - 0.3, gy + 1.6, "house");
    }
    function sandbags(x, z, len, rotX) {
      var gy = height(x, z), w = rotX ? 0.8 : len, d = rotX ? len : 0.8;
      for (var r = 0; r < 2; r++) M.add(B, x, gy + 0.3 + r * 0.45, z, 0, 0, 0, w - r * 0.1, 0.45, d - r * 0.1, r ? "#a3946f" : "#978a66");
      solid(x - w / 2, x + w / 2, z - d / 2, z + d / 2, gy - 0.3, gy + 1.15, "house");
    }
    function fence(x0, z0, x1, z1) {
      var L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / 2.5), ry = Math.atan2(x1 - x0, z1 - z0);
      for (var k = 0; k <= n; k++) { var t = k / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t, gy = height(x, z); M.add(B, x, gy + 0.55, z, 0, 0, 0, 0.14, 1.1, 0.14, "#7b5a3f"); }
      for (var s = 0; s < n; s++) { var t2 = (s + 0.5) / n, xx = x0 + (x1 - x0) * t2, zz = z0 + (z1 - z0) * t2, g2 = height(xx, zz); M.add(B, xx, g2 + 0.75, zz, 0, ry, 0, 0.06, 0.12, L / n, "#8c6a4c"); M.add(B, xx, g2 + 0.4, zz, 0, ry, 0, 0.06, 0.12, L / n, "#8c6a4c"); }
    }

    /* --- локации --- */
    POIS.forEach(function (p, pi) {
      var cx = p.x, cz = p.z, k, a, x, z;
      if (p.kind === "city") {
        // кварталы по сетке, площадь с часовой башней
        for (var gx = -2; gx <= 2; gx++) for (var gz = -2; gz <= 2; gz++) {
          if (gx === 0 && gz === 0) continue;
          if (rnd() < 0.18) continue;
          x = cx + gx * 14 + (rnd() - 0.5) * 2; z = cz + gz * 14 + (rnd() - 0.5) * 2;
          if (Math.hypot(x - cx, z - cz) > p.r + 4 || !free(x, z, 5)) continue;
          house(x, z, 7 + rnd() * 2.5, 6.5 + rnd() * 2, rnd() < 0.45 ? 2 : (rnd() < 0.3 ? 3 : 1), pi, rnd() < 0.5);
        }
        var ty = height(cx, cz);
        M.add(B, cx, ty + 8, cz, 0, 0, 0, 3.6, 16, 3.6, "#c7b59a"); M.add(B, cx, ty + 16.6, cz, 0, 0, 0, 4.2, 1.2, 4.2, "#8a7a63");
        var cone = new THREE.ConeGeometry(0.75, 1, 4); cone.rotateY(Math.PI / 4); M.add(cone, cx, ty + 19, cz, 0, 0, 0, 5, 3.6, 5, "#4b5058");
        [[0, 1.85], [0, -1.85]].forEach(function (o) { M.add(CYL, cx, ty + 13.5, cz + o[1], Math.PI / 2, 0, 0, 1.1, 0.08, 1.1, "#f0ebe0"); });
        solid(cx - 1.8, cx + 1.8, cz - 1.8, cz + 1.8, ty - 0.5, ty + 21);
        for (k = 0; k < 6; k++) { a = rnd() * 6.28; x = cx + Math.cos(a) * (8 + rnd() * 20); z = cz + Math.sin(a) * (8 + rnd() * 20); if (free(x, z, 3)) car(x, z, rnd() < 0.5 ? 0 : Math.PI / 2, pick(["#8a2f2f", "#2f4f8a", "#d9d4c8", "#3a3d42", "#6b7d4a"])); }
        chests.push({ x: cx + 3, z: cz + 3, poi: pi });
      } else if (p.kind === "port") {
        for (k = 0; k < 3; k++) {   // склады
          x = cx + 6 + k * 13; z = cz - 14 + (k % 2) * 4; var gy = baseY(x, z, 10, 16);
          M.add(B, x, gy + 3.5, z, 0, 0, 0, 10, 7, 16, pick(["#7b8790", "#8c7f6f", "#6f7f7a"]));
          M.add(B, x, gy + 7.2, z, 0, 0, 0, 10.6, 0.4, 16.6, "#4e555c");
          M.add(B, x + 5.03, gy + 2.2, z, 0, 0, 0, 0.1, 4.4, 4.5, "#4a4f55");
          solid(x - 5, x + 5, z - 8, z + 8, gy - 0.5, gy + 7.4); spots(x, z, 8, 5, pi);
          chests.push({ x: x - 6.4, z: z + 3, poi: pi });
        }
        var CC = ["#a5452f", "#2f6a8a", "#3f7a4a", "#c98a2f", "#6a6f75"];
        for (k = 0; k < 9; k++) {   // контейнеры, кое-где в два яруса
          x = cx + 2 + (k % 3) * 7.5; z = cz + 8 + Math.floor(k / 3) * 3.2;
          if (!free(x, z, 1)) continue;
          var top = container(x, z, false, undefined, pick(CC));
          if (rnd() < 0.35) container(x, z, false, top, pick(CC));
        }
        spots(cx + 9, cz + 12, 6, 5, pi);
        for (k = 0; k < 2; k++) {   // краны
          x = cx - 12; z = cz - 10 + k * 22; var cy = height(x, z);
          [[-2, -2], [2, -2], [-2, 2], [2, 2]].forEach(function (o) { M.add(B, x + o[0], cy + 7, z + o[1], 0, 0, 0, 0.5, 14, 0.5, "#d8a531"); pillar(x + o[0], z + o[1], 0.4, cy + 14); });
          M.add(B, x - 6, cy + 14.5, z, 0, 0, 0, 20, 1, 1.2, "#d8a531"); M.add(B, x + 1, cy + 12.5, z, 0, 0, 0, 3, 2.5, 2.5, "#c9c2b5");
        }
        for (k = 0; k < 6; k++) M.add(B, cx - 22 - k * 4, 0.45, cz + 2, 0, 0, 0, 4, 0.3, 4, "#7a5a3e");   // причал
        for (k = 0; k < 6; k++) M.add(CYL6, cx - 22 - k * 4, -0.6, cz + 0.2, 0, 0, 0, 0.18, 2.2, 0.18, "#5a432f");
      } else if (p.kind === "forest") {
        for (k = 0; k < 4; k++) {   // домики лесников
          a = rnd() * 6.28; x = cx + Math.cos(a) * (6 + rnd() * 22); z = cz + Math.sin(a) * (6 + rnd() * 22);
          if (!free(x, z, 5)) continue;
          var gy2 = baseY(x, z, 5, 5);
          M.add(B, x, gy2 + 1.6, z, 0, 0, 0, 5, 3.6, 5, "#6e5039");
          for (var lg = 0; lg < 5; lg++) M.add(B, x, gy2 + 0.4 + lg * 0.7, z + 2.53, 0, 0, 0, 5.1, 0.08, 0.05, "#58402d");
          var r3 = new THREE.ConeGeometry(0.75, 1, 4); r3.rotateY(Math.PI / 4); M.add(r3, x, gy2 + 4.4, z, 0, 0, 0, 6.6, 2.2, 6.6, "#3e4a3a");
          M.add(B, x, gy2 + 1.1, z + 2.55, 0, 0, 0, 1, 2.1, 0.08, "#3a2a1e");
          solid(x - 2.5, x + 2.5, z - 2.5, z + 2.5, gy2 - 0.5, gy2 + 5.5); spots(x, z, 2.5, 3, pi);
          if (rnd() < 0.7) chests.push({ x: x + 3.6, z: z, poi: pi });
        }
      } else if (p.kind === "peak") {
        var py = height(cx, cz);
        M.add(CYL6, cx - 2, py + 11, cz - 2, 0, 0, 0, 0.25, 22, 0.25, "#c9cdd2"); pillar(cx - 2, cz - 2, 0.35, py + 22);
        for (k = 0; k < 5; k++) M.add(B, cx - 2, py + 4 + k * 4, cz - 2, 0, k, 0, 2.2, 0.08, 0.08, "#b0b6bc");
        M.add(CYL, cx - 2, py + 22.3, cz - 2, 0, 0, 0, 0.18, 0.4, 0.18, "#ff3d3d");
        var hy = baseY(cx + 4, cz + 3, 4, 4);
        M.add(B, cx + 4, hy + 1.5, cz + 3, 0, 0, 0, 4, 3.4, 4, "#b9b3a8"); M.add(B, cx + 4, hy + 3.3, cz + 3, 0, 0, 0, 4.6, 0.3, 4.6, "#4b5058");
        solid(cx + 2, cx + 6, cz + 1, cz + 5, hy - 0.5, hy + 3.5); spots(cx + 4, cz + 3, 2.5, 4, pi);
        chests.push({ x: cx + 1, z: cz + 6, poi: pi }); chests.push({ x: cx - 7, z: cz + 2, poi: pi });
        for (k = 0; k < 3; k++) { a = rnd() * 6.28; sandbags(cx + Math.cos(a) * 8, cz + Math.sin(a) * 8, 3, rnd() < 0.5); }
      } else if (p.kind === "factory") {
        var fy = baseY(cx, cz, 22, 14);
        M.add(B, cx, fy + 4.5, cz, 0, 0, 0, 22, 9, 14, "#8a8f94"); M.add(B, cx, fy + 9.2, cz, 0, 0, 0, 22.6, 0.4, 14.6, "#4a5056");
        for (k = -2; k <= 2; k++) M.add(B, cx + k * 4.4, fy + 6, cz + 7.05, 0, 0, 0, 2.6, 2, 0.06, "#2b3944");
        M.add(B, cx - 6, fy + 2.4, cz + 7.05, 0, 0, 0, 4, 4.8, 0.08, "#5c6166");
        solid(cx - 11, cx + 11, cz - 7, cz + 7, fy - 0.5, fy + 9.4); spots(cx, cz, 10, 8, pi);
        for (k = 0; k < 3; k++) {   // силосы с неоновой краской
          x = cx - 8 + k * 8; z = cz - 13; var sy = height(x, z);
          M.add(CYL, x, sy + 6, z, 0, 0, 0, 3, 12, 3, "#c4c8cc"); var sc2 = new THREE.ConeGeometry(1, 1, 10); M.add(sc2, x, sy + 13.2, z, 0, 0, 0, 3.1, 2.4, 3.1, "#9aa0a6");
          M.add(CYL, x, sy + 4, z, 0, 0, 0, 3.05, 0.6, 3.05, ["#ff2f8c", "#21d4ff", "#8cf03a"][k]);
          pillar(x, z, 3.1, sy + 14);
        }
        M.add(B, cx, fy + 11, cz - 10, 0, 0, 0, 18, 0.6, 0.6, "#9aa0a6");   // трубы
        M.add(CYL, cx + 12, fy + 9, cz + 4, 0, 0, 0, 0.9, 18, 0.9, "#7d6a5c"); pillar(cx + 12, cz + 4, 1, fy + 18);
        for (k = 0; k < 4; k++) { x = cx - 10 + k * 6; z = cz + 12; if (free(x, z, 2)) container(x, z, true, undefined, pick(["#a5452f", "#2f6a8a", "#c98a2f"])); }
        chests.push({ x: cx + 12, z: cz - 3, poi: pi }); chests.push({ x: cx - 13, z: cz + 2, poi: pi });
      } else if (p.kind === "camp") {
        for (k = 0; k < 6; k++) {   // палатки
          a = k / 6 * 6.28; x = cx + Math.cos(a) * 9; z = cz + Math.sin(a) * 9; var ty2 = height(x, z);
          var tent = new THREE.CylinderGeometry(0, 1, 1, 4, 1); tent.rotateY(Math.PI / 4);
          M.add(tent, x, ty2 + 1.3, z, 0, a, 0, 3, 2.6, 3.6, pick(["#5a6b4a", "#6b6a52", "#4f5f55"]));
          pillar(x, z, 1.9, ty2 + 2.6); spots(x, z, 2.2, 2, pi);
        }
        var wy = height(cx, cz);
        [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]].forEach(function (o) { M.add(B, cx + o[0], wy + 3.5, cz + o[1], 0, 0, 0, 0.3, 7, 0.3, "#6e5039"); pillar(cx + o[0], cz + o[1], 0.3, wy + 7); });
        M.add(B, cx, wy + 7.1, cz, 0, 0, 0, 3.8, 0.3, 3.8, "#7a5a3e"); M.add(B, cx, wy + 8.8, cz, 0, 0, 0, 4.2, 0.3, 4.2, "#4f5f45");
        for (k = 0; k < 4; k++) { a = rnd() * 6.28; sandbags(cx + Math.cos(a) * 14, cz + Math.sin(a) * 14, 3.5, Math.abs(Math.cos(a)) > 0.7); }
        for (k = 0; k < 2; k++) { a = rnd() * 6.28; x = cx + Math.cos(a) * 16; z = cz + Math.sin(a) * 16; if (free(x, z, 3)) car(x, z, a, "#4f5f45"); }
        chests.push({ x: cx + 2.5, z: cz - 3, poi: pi }); chests.push({ x: cx - 3, z: cz + 2.5, poi: pi });
      } else if (p.kind === "beach") {
        for (k = 0; k < 5; k++) {   // домики на сваях (под ними можно пройти)
          x = cx - 16 + k * 8; z = cz - 4 + (k % 2) * 6; var by = height(x, z);
          [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].forEach(function (o) { M.add(CYL6, x + o[0], by + 1.2, z + o[1], 0, 0, 0, 0.12, 2.6, 0.12, "#7a5a3e"); pillar(x + o[0], z + o[1], 0.15, by + 2.6); });
          M.add(B, x, by + 2.6, z, 0, 0, 0, 4, 0.2, 4, "#8c6a4c"); M.add(B, x, by + 3.9, z, 0, 0, 0, 3.6, 2.4, 3.6, pick(["#e8dcc4", "#c9dcd8", "#e3c9b5"]));
          var rr = new THREE.ConeGeometry(0.75, 1, 4); rr.rotateY(Math.PI / 4); M.add(rr, x, by + 6, z, 0, 0, 0, 5.4, 1.8, 5.4, "#b8a06a");
          solid(x - 1.8, x + 1.8, z - 1.8, z + 1.8, by + 2.5, by + 6.9); spots(x, z, 2.2, 2, pi);
        }
        var ly = height(cx + 14, cz - 10);
        M.add(B, cx + 14, ly + 2, cz - 10, 0, 0, 0, 0.2, 4, 0.2, "#e8e4dc"); M.add(B, cx + 14, ly + 4.2, cz - 10, 0, 0, 0, 2.4, 1.6, 2.4, "#d84a3a"); pillar(cx + 14, cz - 10, 0.5, ly + 5);
        chests.push({ x: cx - 4, z: cz + 6, poi: pi }); chests.push({ x: cx + 12, z: cz - 6, poi: pi });
      } else if (p.kind === "farm") {
        var fy2 = baseY(cx, cz, 10, 14);   // амбар
        M.add(B, cx, fy2 + 3, cz, 0, 0, 0, 10, 6, 14, "#8a3b2e");
        var bar = new THREE.CylinderGeometry(1, 1, 1, 3, 1); bar.rotateZ(Math.PI / 2); bar.rotateX(Math.PI / 2); M.add(bar, cx, fy2 + 7.2, cz, 0, Math.PI / 2, 0, 3.3, 14.2, 5.8, "#4b4f55");
        M.add(B, cx, fy2 + 2.2, cz + 7.05, 0, 0, 0, 4, 4.4, 0.08, "#e8e4dc");
        solid(cx - 5, cx + 5, cz - 7, cz + 7, fy2 - 0.5, fy2 + 9); spots(cx, cz, 7, 6, pi);
        house(cx + 14, cz - 6, 7, 6, 1, pi, false);
        var mx = cx - 12, mz = cz - 6, my = height(mx, mz);   // мельница
        M.add(new THREE.CylinderGeometry(1.6, 2.6, 9, 8), mx, my + 4.5, mz, 0, 0, 0, 1, 1, 1, "#d6cdbd");
        M.add(new THREE.ConeGeometry(2.2, 2.6, 8), mx, my + 10.3, mz, 0, 0, 0, 1, 1, 1, "#5c4a3c");
        pillar(mx, mz, 2.6, my + 11.6);
        anim.push({ kind: "mill", x: mx, y: my + 8.6, z: mz + 2.3 });
        fence(cx - 20, cz + 12, cx + 20, cz + 12); fence(cx + 20, cz + 12, cx + 20, cz - 16);
        chests.push({ x: cx + 6.5, z: cz + 2, poi: pi });
      } else if (p.kind === "lighthouse") {
        var hy2 = height(cx, cz);
        for (k = 0; k < 6; k++) M.add(new THREE.CylinderGeometry(1.6 - k * 0.14, 1.75 - k * 0.14, 3, 12), cx, hy2 + 1.5 + k * 3, cz, 0, 0, 0, 1, 1, 1, k % 2 ? "#c43b32" : "#efeae0");
        M.add(new THREE.CylinderGeometry(1.1, 1.1, 1.6, 10), cx, hy2 + 19, cz, 0, 0, 0, 1, 1, 1, "#ffe9a8");
        M.add(new THREE.ConeGeometry(1.4, 1.4, 10), cx, hy2 + 20.5, cz, 0, 0, 0, 1, 1, 1, "#3a3d42");
        pillar(cx, cz, 1.8, hy2 + 21);
        house(cx + 7, cz - 4, 6, 5, 1, pi, false);
        anim.push({ kind: "beacon", x: cx, y: hy2 + 19, z: cz });
        chests.push({ x: cx - 3, z: cz - 3, poi: pi });
      } else if (p.kind === "dam") {
        var dz = cz + 5, dy = height(cx, dz) ;
        M.add(B, cx, dy + 2, dz, 0, 0, 0, 40, 7, 4, "#a7a59f"); M.add(B, cx, dy + 5.6, dz, 0, 0, 0, 40, 0.3, 4.4, "#8d8a83");
        for (k = -4; k <= 4; k++) M.add(B, cx + k * 4.5, dy + 1.5, dz - 2.1, 0, 0, 0, 0.6, 6, 0.4, "#94918a");
        solid(cx - 20, cx + 20, dz - 2, dz + 2, dy - 2, dy + 5.6);
        house(cx - 6, cz - 7, 7, 5, 2, pi, true);
        for (k = 0; k < 3; k++) sandbags(cx + 8 + k * 3, cz - 8, 2.5, false);
        chests.push({ x: cx + 6, z: cz - 3, poi: pi }); spots(cx, cz - 5, 8, 6, pi);
      } else if (p.kind === "station") {   // полярная станция: купола, модули, антенны
        for (k = 0; k < 4; k++) {
          a = k * 1.57 + 0.4; x = cx + Math.cos(a) * 12; z = cz + Math.sin(a) * 12; var sy = height(x, z);
          M.add(new THREE.SphereGeometry(4.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), x, sy - 0.2, z, 0, 0, 0, 1, 0.8, 1, k % 2 ? "#e9edf0" : "#d84a3a");
          M.add(B, x, sy + 1, z + 4.4, 0, 0, 0, 1.6, 2.2, 0.3, "#3a4048");
          solid(x - 3.2, x + 3.2, z - 3.2, z + 3.2, sy - 0.5, sy + 3.6); spots(x, z, 4.5, 3, pi);
        }
        for (k = 0; k < 3; k++) { x = cx - 6 + k * 6; z = cz; if (free(x, z, 2)) container(x, z, true, undefined, pick(["#c43b32", "#e9edf0", "#2f6a8a"])); }
        var ay = height(cx + 2, cz - 8);
        M.add(CYL6, cx + 2, ay + 9, cz - 8, 0, 0, 0, 0.2, 18, 0.2, "#c9cdd2"); M.add(new THREE.CylinderGeometry(1.4, 0.2, 1, 12), cx + 2, ay + 15, cz - 8, 0.6, 0, 0, 1, 1, 1, "#e9edf0"); pillar(cx + 2, cz - 8, 0.4, ay + 18);
        chests.push({ x: cx, z: cz + 4, poi: pi }); chests.push({ x: cx + 9, z: cz - 3, poi: pi });
      } else if (p.kind === "resort") {   // горнолыжный курорт: шале и опоры подъёмника
        for (k = 0; k < 6; k++) {
          a = rnd() * 6.28; x = cx + Math.cos(a) * (6 + rnd() * 18); z = cz + Math.sin(a) * (6 + rnd() * 18);
          if (!free(x, z, 6)) continue;
          var gy3 = baseY(x, z, 7, 7), hh3 = rnd() < 0.5 ? 3.4 : 6.4;
          M.add(B, x, gy3 + hh3 / 2 - 0.4, z, 0, 0, 0, 7, hh3 + 0.8, 7, pick(["#8a5a3a", "#6e4a32", "#9a6b45"]));
          var ch2 = new THREE.CylinderGeometry(1, 1, 1, 3, 1); ch2.rotateZ(Math.PI / 2); ch2.rotateX(Math.PI / 2);
          M.add(ch2, x, gy3 + hh3 + 1.7, z, 0, Math.PI / 2, 0, 4.2, 7.6, 4.4, "#f2f5f7");
          windows(x, z, 7, 7, gy3, hh3 > 4 ? 2 : 1);
          solid(x - 3.5, x + 3.5, z - 3.5, z + 3.5, gy3 - 0.5, gy3 + hh3 + 3.4); spots(x, z, 3.5, 3, pi);
          if (rnd() < 0.5) chests.push({ x: x + 4.6, z: z, poi: pi });
        }
        for (k = 0; k < 5; k++) { x = cx - 20 - k * 14; z = cz - 10 - k * 12; var py2 = height(x, z); M.add(B, x, py2 + 5, z, 0, 0.8, 0, 0.5, 10, 0.5, "#9aa0a6"); M.add(B, x, py2 + 10, z, 0, 0.8, 0, 4, 0.4, 0.4, "#9aa0a6"); pillar(x, z, 0.4, py2 + 10); }
      } else if (p.kind === "harbor") {   // ледокольная гавань: корпус судна, контейнеры, краны
        var hx = cx - 26, hz = cz, hy = -0.4;
        M.add(B, hx, hy + 2.5, hz, 0, 0, 0, 9, 6, 34, "#b8322a"); M.add(B, hx, hy + 5.8, hz, 0, 0, 0, 9.2, 0.6, 34.2, "#2a2e33");
        M.add(B, hx, hy + 9, hz - 8, 0, 0, 0, 7, 6, 7, "#e9edf0"); M.add(B, hx, hy + 10.5, hz - 4.4, 0, 0, 0, 6, 1.2, 0.1, "#2b3944");
        M.add(CYL, hx, hy + 14, hz - 9, 0, 0, 0, 1, 4, 1, "#c9a13a");
        solid(hx - 4.5, hx + 4.5, hz - 17, hz + 17, hy - 2, hy + 12.5);
        for (k = 0; k < 2; k++) { x = cx + 6 + k * 13; z = cz - 12; var wy = baseY(x, z, 10, 14); M.add(B, x, wy + 3.5, z, 0, 0, 0, 10, 7, 14, pick(["#7b8790", "#6f7f7a"])); M.add(B, x, wy + 7.2, z, 0, 0, 0, 10.6, 0.5, 14.6, "#e9edf0"); solid(x - 5, x + 5, z - 7, z + 7, wy - 0.5, wy + 7.4); spots(x, z, 7, 5, pi); chests.push({ x: x - 6.3, z: z + 2, poi: pi }); }
        var HC = ["#a5452f", "#2f6a8a", "#3f7a4a", "#c98a2f"];
        for (k = 0; k < 8; k++) { x = cx + 2 + (k % 4) * 7; z = cz + 8 + Math.floor(k / 4) * 3.2; if (free(x, z, 1)) { var tp2 = container(x, z, false, undefined, pick(HC)); if (rnd() < 0.3) container(x, z, false, tp2, pick(HC)); } }
        spots(cx + 10, cz + 10, 6, 5, pi);
      } else if (p.kind === "mine") {   // шахта: вход в штольню, сараи, вагонетки
        var my2 = height(cx, cz + 14);
        M.add(B, cx, my2 + 3, cz + 14, 0, 0, 0, 8, 6, 6, "#5a5148"); M.add(B, cx, my2 + 2, cz + 11, 0, 0, 0, 4.4, 4, 0.2, "#151515");
        M.add(B, cx, my2 + 4.4, cz + 10.9, 0, 0, 0, 5.6, 0.6, 0.6, "#6e4a32");
        solid(cx - 4, cx + 4, cz + 11, cz + 17, my2 - 0.5, my2 + 6);
        for (k = -6; k <= 6; k++) M.add(B, cx, height(cx, cz + k * 2) + 0.06, cz + k * 2, 0, 0, 0, 1.6, 0.08, 0.25, "#4a3a2c");
        for (k = 0; k < 3; k++) { x = cx + (k - 1) * 0.0 + 0.5; z = cz - 6 + k * 5; var cy2 = height(x, z); M.add(B, x, cy2 + 0.8, z, 0, 0, 0, 1.3, 1, 1.8, "#6a6f75"); solid(x - 0.65, x + 0.65, z - 0.9, z + 0.9, cy2 - 0.3, cy2 + 1.3, "house"); }
        for (k = 0; k < 3; k++) { a = rnd() * 6.28; x = cx + Math.cos(a) * 14; z = cz + Math.sin(a) * 14; if (free(x, z, 5)) house(x, z, 6, 5, 1, pi, true); }
        chests.push({ x: cx + 5, z: cz + 9, poi: pi }); chests.push({ x: cx - 6, z: cz - 2, poi: pi }); spots(cx, cz, 5, 6, pi);
      } else if (p.kind === "village") {   // деревня: дома и колокольня
        for (k = 0; k < 9; k++) {
          a = rnd() * 6.28; x = cx + Math.cos(a) * (8 + rnd() * 22); z = cz + Math.sin(a) * (8 + rnd() * 22);
          if (!free(x, z, 5.5)) continue;
          house(x, z, 6.5 + rnd() * 2, 6 + rnd() * 2, rnd() < 0.3 ? 2 : 1, pi, false);
        }
        var vy = height(cx, cz);
        M.add(B, cx, vy + 6, cz, 0, 0, 0, 3.6, 12, 3.6, "#e2ddd2"); var cn = new THREE.ConeGeometry(0.75, 1, 4); cn.rotateY(Math.PI / 4); M.add(cn, cx, vy + 14, cz, 0, 0, 0, 4.4, 4, 4.4, "#3d5b58");
        solid(cx - 1.8, cx + 1.8, cz - 1.8, cz + 1.8, vy - 0.5, vy + 16);
        chests.push({ x: cx + 3, z: cz + 3, poi: pi });
      } else if (p.kind === "observatory") {   // обсерватория на пике
        var oy = height(cx, cz);
        M.add(CYL, cx, oy + 2.5, cz, 0, 0, 0, 4.5, 5, 4.5, "#e2e6ea"); M.add(new THREE.SphereGeometry(4.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), cx, oy + 5, cz, 0, 0, 0, 1, 1, 1, "#c9cdd2");
        M.add(B, cx, oy + 8.2, cz + 1, 0.5, 0, 0, 1.2, 0.3, 4, "#2b3944");
        pillar(cx, cz, 4.6, oy + 9.6); spots(cx, cz, 5, 6, pi);
        chests.push({ x: cx + 6, z: cz + 2, poi: pi }); chests.push({ x: cx - 6, z: cz - 3, poi: pi });
        for (k = 0; k < 3; k++) { a = rnd() * 6.28; sandbags(cx + Math.cos(a) * 9, cz + Math.sin(a) * 9, 3, rnd() < 0.5); }
      } else if (p.kind === "radar") {   // радарная база
        var ry = height(cx, cz);
        M.add(CYL6, cx, ry + 6, cz, 0, 0, 0, 0.6, 12, 0.6, "#9aa0a6"); M.add(new THREE.SphereGeometry(4, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), cx, ry + 12, cz, 2.2, 0, 0, 1, 0.35, 1, "#e9edf0");
        pillar(cx, cz, 0.8, ry + 14);
        for (k = 0; k < 6; k++) { a = k / 6 * 6.28; sandbags(cx + Math.cos(a) * 11, cz + Math.sin(a) * 11, 3.5, Math.abs(Math.cos(a)) > 0.7); }
        house(cx + 14, cz - 4, 7, 5, 1, pi, true); house(cx - 12, cz + 8, 6, 5, 1, pi, true);
        chests.push({ x: cx + 3, z: cz + 3, poi: pi }); spots(cx, cz, 6, 5, pi);
      } else if (p.kind === "icelake") {   // лагерь на льду: рыбацкие домики
        for (k = 0; k < 7; k++) {
          a = rnd() * 6.28; x = cx + Math.cos(a) * (4 + rnd() * 18); z = cz + Math.sin(a) * (4 + rnd() * 18);
          if (!free(x, z, 2.6)) continue;
          var iy = height(x, z); M.add(B, x, iy + 1.2, z, 0, 0, 0, 2.6, 2.4, 2.6, pick(["#c43b32", "#2f6a8a", "#e8c31f", "#3f7a4a"]));
          M.add(B, x, iy + 2.5, z, 0, 0, 0, 2.9, 0.25, 2.9, "#2a2e33");
          solid(x - 1.3, x + 1.3, z - 1.3, z + 1.3, iy - 0.3, iy + 2.6); spots(x, z, 1.4, 2, pi);
          if (rnd() < 0.4) chests.push({ x: x + 2.2, z: z, poi: pi });
        }
      }
    });
    // одиночные фермерские домики и укрытия в поле
    for (var hk = 0; hk < 14; hk++) {
      var hx = (rnd() * 2 - 1) * 140, hz = (rnd() * 2 - 1) * 140;
      if (height(hx, hz) < 1.5 || slope(hx, hz) > 0.35 || !free(hx, hz, 12)) continue;
      if (POIS.some(function (p) { return Math.hypot(p.x - hx, p.z - hz) < p.r + 12; })) continue;
      if (rnd() < 0.5) house(hx, hz, 6, 5.5, 1, -1, rnd() < 0.3); else { sandbags(hx, hz, 4, rnd() < 0.5); spots(hx, hz, 2, 2, -1); }
    }

    // Рельеф
    var tg = new THREE.PlaneGeometry(HALF * 2, HALF * 2, N - 1, N - 1); tg.rotateX(-Math.PI / 2);
    var pos = tg.attributes.position, cols = new Float32Array(pos.count * 3), col = new THREE.Color(), c2 = new THREE.Color();
    var PAL = WIN ? ["#b9c4cc", "#7f8d96", "#eef3f6", "#e2e9ee", "#cdd8de", "#6f747a", "#8d949a", "#9aa2a8", "#d7e0e6"] : ["#cdb68a", "#9f8a63", "#4f7f34", "#6d9440", "#8f8f4c", "#7d7a73", "#9a958b", "#7a6449", "#3f6a2c"];
    var SAND = new THREE.Color(PAL[0]), WETS = new THREE.Color(PAL[1]), G1 = new THREE.Color(PAL[2]), G2 = new THREE.Color(PAL[3]), DRY = new THREE.Color(PAL[4]),
      ROCK = new THREE.Color(PAL[5]), ROCK2 = new THREE.Color(PAL[6]), DIRT = new THREE.Color(PAL[7]), FOR = new THREE.Color(PAL[8]), ICE = new THREE.Color("#a9d6e6");
    for (var v = 0; v < pos.count; v++) {
      var x = pos.getX(v), z = pos.getZ(v), jj = Math.round((x + HALF) / STEP), ii = Math.round((z + HALF) / STEP), h = H[ii * N + jj];
      pos.setY(v, h);
      var n1 = vnoise(x * 0.06, z * 0.06), n2 = vnoise(x * 0.015 + 9, z * 0.015), sl = slope(x, z);
      if (h < 0.2) col.copy(WETS).lerp(SAND, smoothstep(-1.5, 0.2, h));
      else if (h < 1.3) col.copy(SAND).lerp(G2, smoothstep(0.9, 1.3, h));
      else {
        col.copy(G1).lerp(G2, n1); col.lerp(DRY, smoothstep(0.55, 0.85, n2) * 0.7);
        POIS.forEach(function (fp) { if (fp.kind === "forest" && Math.hypot(x - fp.x, z - fp.z) < fp.r + 10) col.lerp(FOR, 0.6); if (fp.kind === "icelake" && Math.hypot(x - fp.x, z - fp.z) < fp.r + 6) col.copy(ICE).lerp(new THREE.Color("#ffffff"), n1 * 0.3); });
        POIS.forEach(function (p) { if (p.level !== undefined && p.kind !== "beach" && p.kind !== "icelake" && Math.hypot(x - p.x, z - p.z) < p.r * 0.8) col.lerp(p.kind === "city" || p.kind === "factory" || p.kind === "port" || p.kind === "dam" ? new THREE.Color("#8a8679") : DIRT, 0.55); });
        if (sl > 0.45 || h > 14) { c2.copy(ROCK).lerp(ROCK2, n1); col.lerp(c2, Math.min(1, Math.max(smoothstep(0.45, 0.8, sl), smoothstep(14, 18, h)))); }
      }
      cols[v * 3] = col.r; cols[v * 3 + 1] = col.g; cols[v * 3 + 2] = col.b;
    }
    tg.setAttribute("color", new THREE.BufferAttribute(cols, 3)); tg.computeVertexNormals();
    var gt = TX.ground; gt.repeat.set(110, 110);
    var terrain = new THREE.Mesh(tg, new THREE.MeshLambertMaterial({ vertexColors: true, map: gt }));
    terrain.receiveShadow = true; scene.add(terrain);

    var water = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600, 1, 1), new THREE.MeshPhongMaterial({ color: WIN ? "#2a5f78" : "#1d7f96", specular: "#bfefff", shininess: 90, transparent: true, opacity: 0.86, map: TX.rock }));
    water.material.map.repeat.set(160, 160);
    water.rotation.x = -Math.PI / 2; water.position.y = -0.25; scene.add(water);

    // статичные постройки — один меш
    var statics = new THREE.Mesh(M.build(), new THREE.MeshLambertMaterial({ vertexColors: true, map: TX.wall }));
    statics.castShadow = true; statics.receiveShadow = true; scene.add(statics);

    /* --- деревья (3 вида), камни, ящики, кусты, трава --- */
    var trees = [], rocks = [], crates = [];
    var maxTrees = hi ? 520 : 380;
    for (var t = 0; t < 4000 && trees.length < maxTrees; t++) {
      var x2 = (rnd() * 2 - 1) * 175, z2 = (rnd() * 2 - 1) * 175, h2 = height(x2, z2);
      if (h2 < 0.9 || slope(x2, z2) > 0.6) continue;
      var inForest = POIS.some(function (fp) { return fp.kind === "forest" && Math.hypot(x2 - fp.x, z2 - fp.z) < fp.r + 8; }) || (WIN && vnoise(x2 * 0.02 + 3, z2 * 0.02) > 0.55);
      if (!inForest && vnoise(x2 * 0.03 + 50, z2 * 0.03) < 0.5 && rnd() < 0.8) continue;
      if (POIS.some(function (p) { return p.kind !== "forest" && p.kind !== "beach" && Math.hypot(p.x - x2, p.z - z2) < p.r * 0.75; })) continue;
      if (WIN && h2 < 0.5) continue;
      if (!free(x2, z2, 2.2)) continue;
      var type = WIN ? "snowpine" : h2 < 2.4 && Math.hypot(x2, z2) > 118 ? "palm" : (h2 > 10 ? "pine" : (inForest && rnd() < 0.45 ? "pine" : "broad"));
      var tr = { x: x2, z: z2, r: 0.5, top: h2 + 7, y: h2, hp: 60, wood: 15, kind: "tree", type: type, s: 0.85 + rnd() * 0.45, rot: rnd() * 6.28 };
      addCol(tr); trees.push(tr); circles.push(tr);
    }
    for (var r = 0; r < 400 && rocks.length < 90; r++) {
      var x3 = (rnd() * 2 - 1) * 170, z3 = (rnd() * 2 - 1) * 170, h3 = height(x3, z3);
      if (h3 < 0.5) continue;
      var rr3 = 0.7 + rnd() * 1.8 + (h3 > 10 ? 1 : 0);
      if (!free(x3, z3, rr3 + 1)) continue;
      var rk = { x: x3, z: z3, r: rr3 * 0.9, top: h3 + rr3 * 1.1, y: h3, kind: "rock", s: rr3, i: rocks.length };
      addCol(rk); rocks.push(rk); circles.push(rk);
    }
    POIS.forEach(function (p) {
      for (var c = 0; c < 10; c++) {
        var a = rnd() * 6.28, rr4 = 4 + rnd() * (p.r + 6), x4 = p.x + Math.cos(a) * rr4, z4 = p.z + Math.sin(a) * rr4;
        if (!free(x4, z4, 1.4)) continue;
        var cr = { x: x4, z: z4, r: 0.75, top: height(x4, z4) + 1.2, y: height(x4, z4), hp: 40, wood: 15, kind: "crate", loot: rnd() < 0.5, i: crates.length };
        addCol(cr); crates.push(cr); circles.push(cr);
      }
    });
    for (var c3 = 0; c3 < 50; c3++) {
      var x5 = (rnd() * 2 - 1) * 150, z5 = (rnd() * 2 - 1) * 150;
      if (!free(x5, z5, 1.5)) continue;
      var cr2 = { x: x5, z: z5, r: 0.75, top: height(x5, z5) + 1.2, y: height(x5, z5), hp: 40, wood: 15, kind: "crate", loot: rnd() < 0.4, i: crates.length };
      addCol(cr2); crates.push(cr2); circles.push(cr2);
    }
    for (var l = 0; l < 170; l++) { var x6 = (rnd() * 2 - 1) * 160, z6 = (rnd() * 2 - 1) * 160; if (free(x6, z6, 1)) lootSpots.push({ x: x6, z: z6, poi: -1 }); }
    chests = chests.filter(function (c) { return free(c.x, c.z, 0.7); });

    // геометрии деревьев
    function treeGeo(type) {
      var m = new Merger(1);
      if (type === "broad") {
        m.add(new THREE.CylinderGeometry(0.18, 0.32, 3.2, 6), 0, 1.6, 0, 0, 0, 0, 1, 1, 1, "#5e4632");
        m.add(new THREE.CylinderGeometry(0.08, 0.12, 1.6, 5), 0.5, 2.9, 0, 0, 0, -0.7, 1, 1, 1, "#5e4632");
        [[0, 4.3, 0, 1.9], [1.1, 3.8, 0.4, 1.4], [-0.9, 3.9, -0.5, 1.5], [0.2, 5.2, -0.3, 1.3]].forEach(function (b, i) { m.add(new THREE.IcosahedronGeometry(1, 0), b[0], b[1], b[2], i, i * 2, 0, b[3], b[3] * 0.85, b[3], ["#3f6e2e", "#4d7d34", "#466f2c", "#55853a"][i]); });
      } else if (type === "pine" || type === "snowpine") {
        m.add(new THREE.CylinderGeometry(0.15, 0.28, 2.2, 6), 0, 1.1, 0, 0, 0, 0, 1, 1, 1, "#5a4330");
        [[2.1, 2.4, 2.6], [3.6, 1.9, 2.2], [4.9, 1.4, 1.9], [6.0, 0.9, 1.6]].forEach(function (c, i) {
          m.add(new THREE.ConeGeometry(1, 1, 7), 0, c[0], 0, 0, i, 0, c[1], c[2], c[1], ["#2f5634", "#355e38", "#3a663c", "#3f6d40"][i]);
          if (type === "snowpine") m.add(new THREE.ConeGeometry(1, 1, 7), 0, c[0] + c[2] * 0.22, 0, 0, i, 0, c[1] * 0.78, c[2] * 0.55, c[1] * 0.78, "#eef3f6");   // снег на лапах
        });
      } else {   // пальма: изогнутый ствол + листья
        for (var s = 0; s < 6; s++) m.add(new THREE.CylinderGeometry(0.17 - s * 0.01, 0.2 - s * 0.01, 1.1, 6), s * s * 0.03, 0.55 + s * 1.0, 0, 0, 0, -0.05 - s * 0.03, 1, 1, 1, s % 2 ? "#8a7253" : "#7d6648");
        for (var f = 0; f < 7; f++) { var a = f / 7 * 6.28; m.add(new THREE.BoxGeometry(0.5, 0.05, 2.6), 0.75 + Math.sin(a) * 1.1, 6.2, Math.cos(a) * 1.1, -0.35, a, 0, 1, 1, 1, f % 2 ? "#4f8a3a" : "#5c9842"); }
        m.add(new THREE.IcosahedronGeometry(0.35, 0), 0.75, 6.1, 0, 0, 0, 0, 1, 1, 1, "#6b5a2e");
      }
      return m.build();
    }
    var dummy = new THREE.Object3D(), treeMeshes = {}, barkMat = new THREE.MeshLambertMaterial({ vertexColors: true, map: TX.bark });
    ["broad", "pine", "palm", "snowpine"].forEach(function (type) {
      var list = trees.filter(function (tr) { return tr.type === type; });
      if (!list.length) return;   // пустой InstancedMesh без цветов ломает общий шейдер
      var im = new THREE.InstancedMesh(treeGeo(type), barkMat, Math.max(1, list.length));
      im.castShadow = true; im.receiveShadow = false;
      list.forEach(function (tr, k) {
        tr.setVis = function (on) {
          var s = on ? tr.s : 0.0001; dummy.position.set(tr.x, tr.y - 0.1, tr.z); dummy.rotation.set(0, tr.rot, 0); dummy.scale.set(s, s, s); dummy.updateMatrix();
          im.setMatrixAt(k, dummy.matrix); im.instanceMatrix.needsUpdate = true;
        };
        tr.setVis(true);
        var tint = 0.85 + hash(k, 7) * 0.3; im.setColorAt(k, new THREE.Color(tint, tint, tint * 0.95));
      });
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      scene.add(im); treeMeshes[type] = im;
    });
    var rg = new THREE.IcosahedronGeometry(1, 1), rp = rg.attributes.position;
    for (var q = 0; q < rp.count; q++) { var vx = rp.getX(q), vy = rp.getY(q), vz = rp.getZ(q), f2 = 0.8 + hash(Math.round(vx * 9), Math.round(vz * 9 + vy * 5)) * 0.35; rp.setXYZ(q, vx * f2, vy * f2 * 0.8, vz * f2); }
    rg = rg.toNonIndexed(); rg.computeVertexNormals();
    var rockM = new THREE.InstancedMesh(rg, new THREE.MeshLambertMaterial({ color: "#ffffff", map: TX.rock, flatShading: true }), Math.max(1, rocks.length));
    var rockCols = ["#8d8a83", "#9b968c", "#7e7c78", "#a39c90"];
    rocks.forEach(function (rk, k) {
      dummy.position.set(rk.x, rk.y + rk.s * 0.2, rk.z); dummy.rotation.set(k * 0.7, k * 2, 0); dummy.scale.set(rk.s, rk.s, rk.s); dummy.updateMatrix(); rockM.setMatrixAt(k, dummy.matrix);
      rockM.setColorAt(k, new THREE.Color(rockCols[k % 4]));
    });
    if (rockM.instanceColor) rockM.instanceColor.needsUpdate = true;
    rockM.castShadow = true; rockM.receiveShadow = true; scene.add(rockM);
    var cm = new Merger(1);
    cm.add(B, 0, 0.6, 0, 0, 0, 0, 1.25, 1.2, 1.25, "#b98a5a");
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (o) { cm.add(B, o[0] * 0.6, 0.6, o[1] * 0.6, 0, 0, 0, 0.12, 1.25, 0.12, "#6b5640"); });
    cm.add(B, 0, 0.6, 0, 0, Math.PI / 4, 0, 0.1, 1.15, 1.6, "#8a6a48");
    var crateM = new THREE.InstancedMesh(cm.build(), new THREE.MeshLambertMaterial({ vertexColors: true, map: TX.plank }), Math.max(1, crates.length));
    crates.forEach(function (cr, k) {
      cr.setVis = function (on) { var s = on ? 1 : 0.0001; dummy.position.set(cr.x, cr.y, cr.z); dummy.rotation.set(0, k, 0); dummy.scale.set(s, s, s); dummy.updateMatrix(); crateM.setMatrixAt(k, dummy.matrix); crateM.instanceMatrix.needsUpdate = true; };
      cr.setVis(true);
    });
    crateM.castShadow = true; scene.add(crateM);
    // кусты (без коллизий) и трава
    var bushG = (function () { var m = new Merger(1); [[0, 0.5, 0, 0.8], [0.6, 0.4, 0.2, 0.6], [-0.5, 0.45, -0.2, 0.65]].forEach(function (b, i) { m.add(new THREE.IcosahedronGeometry(1, 0), b[0], b[1], b[2], i, i, 0, b[3], b[3] * 0.8, b[3], ["#3e6a2c", "#4a7832", "#567f38"][i]); }); return m.build(); })();
    var bushes = [], grass = [];
    for (var bb = 0; bb < 3000 && bushes.length < (WIN ? 120 : hi ? 420 : 220); bb++) { var bx = (rnd() * 2 - 1) * 170, bz = (rnd() * 2 - 1) * 170; if (height(bx, bz) > 1.2 && slope(bx, bz) < 0.45 && free(bx, bz, 1.2)) bushes.push([bx, height(bx, bz), bz, 0.45 + rnd() * 0.6]); }
    var bushM = new THREE.InstancedMesh(bushG, new THREE.MeshLambertMaterial({ vertexColors: true, map: TX.bark }), Math.max(1, bushes.length));
    bushes.forEach(function (b, k) { dummy.position.set(b[0], b[1] - 0.1, b[2]); dummy.rotation.set(0, k, 0); dummy.scale.set(b[3], b[3], b[3]); dummy.updateMatrix(); bushM.setMatrixAt(k, dummy.matrix); });
    scene.add(bushM);
    if (hi && !WIN) {
      var gg = new Merger(1);
      for (var bl = 0; bl < 5; bl++) { var ga = bl / 5 * 3.14; gg.add(new THREE.PlaneGeometry(0.07, 0.45), Math.cos(ga) * 0.12, 0.3, Math.sin(ga) * 0.12, 0.25 * (bl % 2 ? 1 : -1), ga, 0, 1, 1, 1, bl % 2 ? "#5d8a3a" : "#6f9a44"); }
      for (var gr = 0; gr < 9000 && grass.length < 3200; gr++) { var gx2 = (rnd() * 2 - 1) * 165, gz2 = (rnd() * 2 - 1) * 165, gh = height(gx2, gz2); if (gh > 1.4 && gh < 12 && slope(gx2, gz2) < 0.35 && vnoise(gx2 * 0.05, gz2 * 0.05) > 0.35) grass.push([gx2, gh, gz2]); }
      var grassM = new THREE.InstancedMesh(gg.build(), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), Math.max(1, grass.length));
      grass.forEach(function (g3, k) { dummy.position.set(g3[0], g3[1] - 0.05, g3[2]); dummy.rotation.set(0, k, 0); var s3 = 0.6 + hash(k, 3) * 0.6; dummy.scale.set(s3, s3, s3); dummy.updateMatrix(); grassM.setMatrixAt(k, dummy.matrix); });
      scene.add(grassM);
    }
    return { root: scene, grass: typeof grassM !== "undefined" ? grassM : null, bushes: bushM, terrain: terrain, water: water, boxes: boxes, circles: circles, trees: trees, rocks: rocks, crates: crates, chests: chests, lootSpots: lootSpots, pois: POIS, anim: anim };
  }

  function vehSpots() {
    if (mapId === "isle") return null;
    var land = [], water = [];
    POIS.forEach(function (p, i) { var a = i * 1.7; land.push([i % 3 === 0 ? "buggy" : "quad", p.x + Math.cos(a) * (p.r + 6), p.z + Math.sin(a) * (p.r + 6)]); });
    for (var k = 0; k < 6; k++) { var a2 = k / 6 * 6.28 + 0.3; water.push([Math.cos(a2) * 172, Math.sin(a2) * 172]); }
    return { land: land, water: water };
  }
  KP.world = { MAPS: MAPS, load: load, VEH: vehSpots, HALF: HALF, IR: IR, height: height, slope: slope, build: build, query: query, addCol: addCol, removeCol: removeCol, POIS: POIS, LAKE: LAKE, vnoise: vnoise, H: H, N: N, STEP: STEP, map: mapId };
  load("isle");
})(window.KP);
