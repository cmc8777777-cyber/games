/* Держи Шмыга! · миниатюры костюмов: каждый образ рендерится в картинку отдельным маленьким WebGL-холстом один раз,
   результат кешируется (dataURL). Холст закрывается после пачки, чтобы не держать второй контекст. */
window.THUMBS = (function () {
  "use strict";
  var T = window.THREE, G = window.GFX, MD = window.MODELS;
  var cache = {}, W = 168, H = 220;
  function renderAll(skins, done) {
    var todo = skins.filter(function (s) { return !cache[(s.pet ? "pet:" : "") + s.id]; });
    if (!todo.length) { done && done(); return; }
    var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    var r;
    try { r = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch (e) { done && done(); return; }
    r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.setPixelRatio(1); r.setSize(W, H, false);
    var sc = new T.Scene();
    sc.add(new T.HemisphereLight(0xdfeaff, 0x5a4a3a, 1.0));
    var key = new T.DirectionalLight(0xfff2e0, 2.2); key.position.set(2, 4, 4); sc.add(key);
    var rim = new T.DirectionalLight(0x9ac8ff, 1.4); rim.position.set(-3, 3, -3); sc.add(rim);
    // отражения для металла и золота
    try {
      var pm = new T.PMREMGenerator(r), es = new T.Scene(), g = new T.SphereGeometry(20, 16, 8), col = [], p = g.attributes.position;
      for (var i = 0; i < p.count; i++) { var y = p.getY(i) / 20, c = y > 0 ? new T.Color(0x9ac8ff).lerp(new T.Color(0xffffff), 1 - y) : new T.Color(0x6a5a4a); c.convertSRGBToLinear(); col.push(c.r, c.g, c.b); }
      g.setAttribute("color", new T.Float32BufferAttribute(col, 3)); es.add(new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
      sc.environment = pm.fromScene(es, 0.04).texture;
    } catch (e) {}
    var cam = new T.PerspectiveCamera(30, W / H, 0.1, 20); cam.position.set(0.75, 1.15, 3.55); cam.lookAt(0, 0.95, 0);
    var i2 = 0;
    function next() {
      if (i2 >= todo.length) { try { r.dispose(); r.forceContextLoss(); } catch (e) {} done && done(); return; }
      var s = todo[i2++], obj;
      if (s.pet) { obj = window.PETS.build(s.id); obj.rotation.y = 0.6; window.PETS.animate(obj, 0.3, false, false); obj.userData.parts.b.position.y = 0; obj.scale.setScalar(1.85); obj.position.set(0.05, 0.4, 0); }
      else { var h = MD.hero(s); h.root.rotation.y = 0.45; MD.pose(h, { phase: 0, anim: "idle" }, 1.2, 0.016); h.head.rotation.y = 0.2; obj = h.root; }
      sc.add(obj); r.render(sc, cam); cache[(s.pet ? "pet:" : "") + s.id] = cv.toDataURL("image/png"); sc.remove(obj);
      setTimeout(next, 0);
      if (window.THUMBS.onOne) try { var key = (s.pet ? "pet:" : "") + s.id; window.THUMBS.onOne(key, cache[key]); } catch (e) {}
    }
    next();
  }
  return { renderAll: renderAll, get: function (id) { return cache[id] || null; }, onOne: null };
})();
