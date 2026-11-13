/* Держи Шмыга! · модели: героиня Мика (скелет из групп, полуреалистичные пропорции), вор-енот Шмыг, образы костюмов.
   Рост героини ≈1.72 м, голова ≈1/7 роста. Анимация — поворотами суставов (бедро, колено, стопа, плечо, локоть, корпус, голова). */
window.MODELS = (function () {
  "use strict";
  var T = window.THREE, G = window.GFX;
  var geoCache = {};
  function geo(key, make) { return geoCache[key] || (geoCache[key] = make()); }
  function cyl(rt, rb, h, seg) { return geo("c" + rt + ":" + rb + ":" + h + ":" + (seg || 10), function () { return new T.CylinderGeometry(rt, rb, h, seg || 10); }); }
  function sph(r, ws, hs) { return geo("s" + r + ":" + (ws || 14), function () { return new T.SphereGeometry(r, ws || 14, hs || 10); }); }
  function box(w, h, d) { return geo("b" + w + ":" + h + ":" + d, function () { return new T.BoxGeometry(w, h, d); }); }
  function cone(r, h, seg) { return geo("k" + r + ":" + h + ":" + (seg || 10), function () { return new T.ConeGeometry(r, h, seg || 10); }); }
  function mesh(g, m, x, y, z, parent, shadow) {
    var o = new T.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0);
    if (shadow !== false) o.castShadow = true;
    if (parent) parent.add(o); return o;
  }
  function grp(x, y, z, parent) { var g = new T.Group(); g.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(g); return g; }
  /* закруглённый «капсульный» сегмент конечности: цилиндр + сфера на конце */
  function limbSeg(parent, rt, rb, len, m, endCap) {
    mesh(cyl(rt, rb, len, 10), m, 0, -len / 2, 0, parent);
    if (endCap) mesh(sph(rb * 1.02, 10, 8), m, 0, -len, 0, parent);
  }

  /* ---------- Скелет человека ----------
     o: { s: масштаб, skin, hair, top, sleeve, pants, shoe, glove, kinds:{top,pants,shoe}, female } */
  function rig(o) {
    var s = o.s || 1, M = function (hex, kind, ex) { return G.mat(hex, kind, ex); };
    var mTop = M(o.top, (o.kinds && o.kinds.top) || "fabric", o.topEx), mSleeve = M(o.sleeve != null ? o.sleeve : o.top, (o.kinds && o.kinds.sleeve) || (o.kinds && o.kinds.top) || "fabric", o.topEx);
    var mPants = M(o.pants, (o.kinds && o.kinds.pants) || "fabric", o.pantsEx), mShoe = M(o.shoe, (o.kinds && o.kinds.shoe) || "leather");
    var mSkin = M(o.skin, o.fur ? "fur" : "skin"), mGlove = M(o.glove != null ? o.glove : o.skin, o.glove != null ? "leather" : (o.fur ? "fur" : "skin"));
    var root = new T.Group(), body = grp(0, 0, 0, root);   // body — для подката/падения
    var hips = grp(0, 0.93, 0, body);
    var pelvis = mesh(cyl(0.15, 0.135, 0.22, 12), mPants, 0, 0.0, 0, hips); pelvis.scale.set(1, 1, 0.76);
    var spine = grp(0, 0.08, 0, hips);
    // корпус: талия уже, грудь шире
    var torso = mesh(cyl(o.female ? 0.18 : 0.19, 0.145, 0.44, 14), mTop, 0, 0.22, 0, spine); torso.scale.set(1, 1, 0.7);
    var chest = mesh(sph(0.178, 14, 10), mTop, 0, 0.36, 0.01, spine); chest.scale.set(1.12, 0.64, 0.78);
    var neck = grp(0, 0.44, 0, spine);
    mesh(cyl(0.052, 0.058, 0.09, 10), mSkin, 0, 0.03, 0, neck);
    var head = grp(0, 0.065, 0.005, neck); head.scale.setScalar(1.12);
    var skull = mesh(sph(0.1, 16, 12), mSkin, 0, 0.11, 0, head); skull.scale.set(0.9, 1.12, 1.0);
    var jaw = mesh(sph(0.075, 12, 8), mSkin, 0, 0.055, 0.022, head); jaw.scale.set(0.95, 0.8, 0.95);
    // лицо (видно в меню): глаза, брови, нос, губы
    if (!o.noFace) {
      [-1, 1].forEach(function (k) {
        mesh(sph(0.016, 8, 6), M(0xffffff, "plastic"), k * 0.034, 0.118, 0.083, head, false);
        mesh(sph(0.01, 8, 6), M(o.eyes || 0x3a2a1e, "glass"), k * 0.034, 0.118, 0.096, head, false);
        var br = mesh(box(0.032, 0.007, 0.01), M(o.hair, "fabric"), k * 0.034, 0.142, 0.092, head, false); br.rotation.z = -k * 0.12;
      });
      mesh(cone(0.012, 0.03, 6), mSkin, 0, 0.098, 0.1, head, false).rotation.x = Math.PI / 2;
      mesh(box(0.034, 0.008, 0.01), M(0xc8706a, "skin"), 0, 0.068, 0.092, head, false);
    }
    // волосы
    var hair = grp(0, 0, 0, head);
    if (o.hairStyle !== "none") {
      var hc = mesh(sph(0.107, 16, 12), M(o.hair, "fabric"), 0, 0.125, -0.012, hair); hc.scale.set(0.95, 1.08, 1.04);
      var fringe = mesh(sph(0.06, 10, 8), M(o.hair, "fabric"), 0.03, 0.19, 0.06, hair); fringe.scale.set(1.4, 0.45, 0.6);
      if (o.ponytail !== false) {
        var pt = grp(0, 0.16, -0.1, hair); pt.rotation.x = -0.5;
        mesh(sph(0.05, 10, 8), M(o.hair, "fabric"), 0, -0.04, -0.02, pt).scale.set(0.9, 1.6, 0.9);
        mesh(sph(0.04, 10, 8), M(o.hair, "fabric"), 0, -0.13, -0.03, pt).scale.set(0.8, 1.6, 0.8);
        hair.userData.tail = pt;
      }
    }
    // руки
    function arm(side) {
      var sh = grp(side * 0.225, 0.39, 0, spine);
      mesh(sph(0.076, 12, 8), mSleeve, 0, 0, 0, sh);
      var up = grp(0, 0, 0, sh); limbSeg(up, 0.07, 0.057, 0.27, mSleeve, true);
      var el = grp(0, -0.27, 0, up); limbSeg(el, 0.056, 0.043, 0.24, o.forearm != null ? M(o.forearm, "skin") : mSleeve, false);
      var hand = grp(0, -0.25, 0, el); mesh(sph(0.05, 10, 8), mGlove, 0, -0.03, 0.005, hand).scale.set(0.8, 1.2, 0.62);
      sh.rotation.z = side * 0.06;
      return { sh: sh, up: up, el: el, hand: hand };
    }
    function leg(side) {
      var hp = grp(side * 0.092, -0.02, 0, hips);
      var th = grp(0, 0, 0, hp); limbSeg(th, 0.106, 0.076, 0.43, mPants, true);
      var kn = grp(0, -0.43, 0, th); limbSeg(kn, 0.075, 0.052, 0.42, o.shin != null ? M(o.shin, o.shinKind || "fabric") : mPants, false);
      var ft = grp(0, -0.44, 0, kn);
      var shoe = mesh(box(0.11, 0.09, 0.27), mShoe, 0, -0.01, 0.05, ft);
      mesh(box(0.115, 0.025, 0.28), M(o.sole != null ? o.sole : 0xf2f2f2, "rubber"), 0, -0.05, 0.05, ft);
      return { hp: hp, th: th, kn: kn, ft: ft, shoe: shoe };
    }
    var aL = arm(1), aR = arm(-1), lL = leg(1), lR = leg(-1);
    return { root: root, body: body, hips: hips, spine: spine, torso: torso, chest: chest, neck: neck, head: head, hair: hair,
      aL: aL, aR: aR, lL: lL, lR: lR, M: M, mTop: mTop, mPants: mPants };
  }

  /* ---------- Аксессуары образов ---------- */
  var ACC = {
    cap: function (r, c) { var h = r.head; mesh(sph(0.112, 16, 10), r.M(c, "fabric"), 0, 0.15, -0.005, h).scale.set(1, 0.62, 1.05); var b = mesh(box(0.15, 0.012, 0.11), r.M(c, "fabric"), 0, 0.165, -0.13, h); b.rotation.x = -0.15; mesh(sph(0.012, 6, 4), r.M(c, "fabric"), 0, 0.215, 0, h); },
    band: function (r, c) { var b = mesh(cyl(0.104, 0.104, 0.03, 16), r.M(c, "fabric"), 0, 0.17, 0, r.head); b.scale.set(0.96, 1, 1.06); },
    beanie: function (r, c) { mesh(sph(0.115, 14, 10), r.M(c, "fabric"), 0, 0.16, -0.01, r.head).scale.set(1, 0.85, 1.05); mesh(cyl(0.112, 0.112, 0.04, 14), r.M(G.lin ? c : c, "fabric"), 0, 0.14, -0.01, r.head).scale.set(0.98, 1, 1.05); },
    toque: function (r, c) { mesh(cyl(0.1, 0.095, 0.12, 14), r.M(0xffffff, "fabric"), 0, 0.24, 0, r.head); mesh(sph(0.11, 14, 10), r.M(0xffffff, "fabric"), 0, 0.31, 0, r.head).scale.set(1, 0.6, 1); },
    firehelmet: function (r, c) { mesh(sph(0.125, 14, 10), r.M(c, "paint"), 0, 0.16, -0.01, r.head).scale.set(1, 0.8, 1.15); var br = mesh(cyl(0.16, 0.16, 0.012, 16), r.M(c, "paint"), 0, 0.13, -0.03, r.head); br.scale.set(0.9, 1, 1.15); mesh(box(0.05, 0.06, 0.02), r.M(0xffd23a, "metal"), 0, 0.18, 0.12, r.head); },
    captain: function (r, c) { mesh(cyl(0.12, 0.105, 0.07, 16), r.M(c, "fabric"), 0, 0.2, 0, r.head); mesh(cyl(0.125, 0.125, 0.02, 16), r.M(0xffffff, "fabric"), 0, 0.24, 0, r.head); var v = mesh(box(0.13, 0.01, 0.06), r.M(0x111111, "leather"), 0, 0.17, 0.11, r.head); v.rotation.x = 0.3; mesh(box(0.04, 0.03, 0.01), r.M(0xffd23a, "gold"), 0, 0.205, 0.115, r.head); },
    ninja: function (r, c) { mesh(sph(0.113, 14, 10), r.M(c, "fabric"), 0, 0.12, -0.005, r.head).scale.set(0.96, 1.12, 1.04); mesh(box(0.15, 0.05, 0.09), r.M(c, "fabric"), 0, 0.07, 0.06, r.head); var b = mesh(cyl(0.11, 0.11, 0.02, 14), r.M(0xc8202a, "fabric"), 0, 0.17, 0, r.head); var t1 = mesh(box(0.025, 0.12, 0.01), r.M(0xc8202a, "fabric"), 0.03, 0.1, -0.12, r.head); t1.rotation.x = 0.4; },
    astro: function (r, c) { mesh(sph(0.17, 18, 14), r.M(0xbfe4ff, "glass", { opacity: 0.32 }), 0, 0.12, 0.01, r.head, false); mesh(cyl(0.12, 0.12, 0.05, 16), r.M(0xe8e8e8, "plastic"), 0, -0.02, 0, r.head); },
    knight: function (r, c) { mesh(sph(0.12, 14, 10), r.M(0xc0c8d0, "metal"), 0, 0.14, -0.005, r.head).scale.set(1, 1.08, 1.08); mesh(box(0.012, 0.09, 0.15), r.M(0xc8202a, "fabric"), 0, 0.27, -0.02, r.head); mesh(box(0.15, 0.015, 0.02), r.M(0x222222, "metal"), 0, 0.12, 0.105, r.head); },
    eyemask: function (r, c) { mesh(box(0.15, 0.035, 0.03), r.M(0x111111, "leather"), 0, 0.12, 0.085, r.head); },
    ranger: function (r, c) { mesh(cyl(0.2, 0.2, 0.015, 18), r.M(c, "leather"), 0, 0.2, 0, r.head).scale.set(1, 1, 0.9); mesh(cyl(0.085, 0.1, 0.1, 14), r.M(c, "leather"), 0, 0.25, 0, r.head); mesh(cyl(0.1, 0.1, 0.02, 14), r.M(0x3a2a1a, "leather"), 0, 0.215, 0, r.head); },
    safari: function (r, c) { mesh(cyl(0.18, 0.18, 0.012, 18), r.M(c, "fabric"), 0, 0.2, 0, r.head); mesh(sph(0.11, 14, 10), r.M(c, "fabric"), 0, 0.2, 0, r.head).scale.set(1, 0.6, 1); },
    flatcap: function (r, c) { mesh(sph(0.118, 14, 10), r.M(c, "fabric"), 0, 0.17, 0.0, r.head).scale.set(1.02, 0.45, 1.12); var b = mesh(box(0.13, 0.01, 0.07), r.M(c, "fabric"), 0, 0.17, 0.12, r.head); b.rotation.x = 0.25; },
    hardhat: function (r, c) { mesh(sph(0.12, 14, 10), r.M(c, "plastic"), 0, 0.17, 0, r.head).scale.set(1, 0.72, 1.08); mesh(cyl(0.15, 0.15, 0.01, 16), r.M(c, "plastic"), 0, 0.15, 0.01, r.head).scale.set(1, 1, 1.1); },
    hood: function (r, c) { mesh(sph(0.13, 14, 10), r.M(c, "fabric"), 0, 0.12, -0.025, r.head).scale.set(1, 1.1, 1.05); },
    wrap: function (r, c) { mesh(sph(0.125, 14, 10), r.M(c, "fabric"), 0, 0.16, -0.01, r.head).scale.set(1, 0.8, 1.06); mesh(box(0.14, 0.06, 0.06), r.M(c, "fabric"), 0, 0.06, 0.07, r.head); mesh(sph(0.015, 8, 6), r.M(0xc8202a, "gold"), 0, 0.2, 0.115, r.head); },
    skihelmet: function (r, c) { mesh(sph(0.122, 14, 10), r.M(c, "plastic"), 0, 0.15, -0.005, r.head).scale.set(1, 0.9, 1.08); var g = mesh(box(0.17, 0.045, 0.05), r.M(0xff8a1a, "glass", { emissive: 0x552200, ei: 0.4 }), 0, 0.17, 0.1, r.head); },
    pompom: function (r, c) { mesh(sph(0.115, 14, 10), r.M(c, "fabric"), 0, 0.16, -0.01, r.head).scale.set(1, 0.85, 1.05); mesh(sph(0.04, 10, 8), r.M(0xffffff, "fabric"), 0, 0.26, -0.01, r.head); },
    headphones: function (r, c) { var a = mesh(new T.TorusGeometry(0.115, 0.012, 6, 18, Math.PI), r.M(0x222222, "plastic"), 0, 0.13, 0, r.head); [-1, 1].forEach(function (k) { mesh(cyl(0.04, 0.04, 0.035, 12), r.M(c, "plastic"), k * 0.11, 0.12, 0, r.head).rotation.z = Math.PI / 2; }); },
    crown: function (r, c) { mesh(cyl(0.07, 0.075, 0.035, 10), r.M(0xffcf3a, "gold"), 0, 0.235, -0.01, r.head); for (var i = 0; i < 5; i++) { var a = i / 5 * Math.PI * 2; mesh(cone(0.012, 0.04, 4), r.M(0xffcf3a, "gold"), Math.cos(a) * 0.065, 0.27, Math.sin(a) * 0.065 - 0.01, r.head); } mesh(sph(0.012, 8, 6), r.M(0xc8202a, "glass"), 0, 0.24, 0.065, r.head); },
    visor: function (r, c) { var v = mesh(box(0.17, 0.04, 0.06), r.M(c, "glass", { emissive: c, ei: 1.2 }), 0, 0.12, 0.085, r.head, false); },
    racer: function (r, c) { mesh(box(0.02, 0.03, 0.02), r.M(0x222222, "plastic"), 0.1, 0.11, 0.02, r.head); },
    hockey: function (r, c) { mesh(sph(0.122, 14, 10), r.M(c, "plastic"), 0, 0.15, -0.01, r.head).scale.set(1, 0.92, 1.08); mesh(box(0.16, 0.06, 0.02), r.M(0xddeeff, "glass", { opacity: 0.4 }), 0, 0.12, 0.115, r.head, false); },
    horns: function (r, c) { mesh(sph(0.12, 14, 10), r.M(c, "metal"), 0, 0.15, -0.005, r.head).scale.set(1, 1, 1.08); [-1, 1].forEach(function (k) { var h = mesh(cone(0.025, 0.14, 8), r.M(0xffcf3a, "gold"), k * 0.08, 0.26, -0.04, r.head); h.rotation.z = -k * 0.4; h.rotation.x = -0.4; }); },
    sorchood: function (r, c) { var h = mesh(sph(0.135, 14, 10), r.M(c, "fabric"), 0, 0.13, -0.03, r.head); h.scale.set(1, 1.15, 1.08); mesh(cone(0.06, 0.12, 10), r.M(c, "fabric"), 0, 0.27, -0.09, r.head).rotation.x = -0.6; },
    kabuto: function (r, c) { mesh(sph(0.125, 14, 10), r.M(0xf2f2f2, "paint"), 0, 0.15, -0.005, r.head).scale.set(1, 0.9, 1.08); var cr = mesh(box(0.2, 0.012, 0.03), r.M(0xff2a3a, "paint", { emissive: 0xff2a3a, ei: 1.5 }), 0, 0.24, 0.07, r.head); cr.rotation.x = -0.3; mesh(box(0.16, 0.025, 0.02), r.M(0xff2a3a, "glass", { emissive: 0xff2a3a, ei: 2 }), 0, 0.12, 0.1, r.head, false); },
    goggles: function (r, c) { var b = mesh(cyl(0.106, 0.106, 0.03, 16), r.M(0x3a2a1a, "leather"), 0, 0.17, 0, r.head); b.scale.set(0.97, 1, 1.07); [-1, 1].forEach(function (k) { var g = mesh(cyl(0.035, 0.035, 0.03, 12), r.M(c, "metal"), k * 0.045, 0.19, 0.1, r.head); g.rotation.x = Math.PI / 2 - 0.4; mesh(cyl(0.026, 0.026, 0.032, 12), r.M(0x6ad8ff, "glass", { emissive: 0x2a8aaa, ei: 0.6 }), k * 0.045, 0.19, 0.104, r.head, false).rotation.x = Math.PI / 2 - 0.4; }); },
    aviator: function (r, c) { mesh(sph(0.117, 14, 10), r.M(c, "leather"), 0, 0.14, -0.005, r.head).scale.set(1, 0.95, 1.06); [-1, 1].forEach(function (k) { mesh(box(0.03, 0.09, 0.06), r.M(c, "leather"), k * 0.105, 0.07, 0.0, r.head); var g = mesh(cyl(0.032, 0.032, 0.025, 12), r.M(0xc8a060, "metal"), k * 0.045, 0.21, 0.08, r.head); g.rotation.x = 1.1; }); },
    // на спине и на теле
    bag: function (r, c) { var b = mesh(box(0.06, 0.22, 0.28), r.M(c || 0x7a4a26, "leather"), -0.19, 0.0, 0.02, r.hips); var s = mesh(box(0.025, 0.62, 0.012), r.M(0x4a2a14, "leather"), 0, 0.27, 0.0, r.spine); s.rotation.z = 0.72; s.position.z = 0.1; var s2 = s.clone(); s2.position.z = -0.1; r.spine.add(s2); },
    backpack: function (r, c) { mesh(box(0.26, 0.32, 0.13), r.M(c, "fabric"), 0, 0.28, -0.15, r.spine); },
    lifepack: function (r, c) { mesh(box(0.3, 0.36, 0.16), r.M(0xeeeeee, "plastic"), 0, 0.27, -0.16, r.spine); mesh(cyl(0.04, 0.04, 0.3, 10), r.M(0xff7a1a, "plastic"), 0.08, 0.27, -0.25, r.spine); },
    cape: function (r, c) { var cp = grp(0, 0.42, -0.1, r.spine); var m = mesh(box(0.4, 0.85, 0.02), r.M(c, "fabric", { side: true }), 0, -0.42, 0, cp); r.body.userData.cape = cp; },
    apron: function (r, c) { mesh(box(0.26, 0.42, 0.02), r.M(c, "fabric"), 0, -0.1, 0.1, r.hips); },
    vest: function (r, c) { var v = mesh(cyl(0.165, 0.128, 0.42, 12), r.M(c, "fabric", { emissive: c, ei: 0.08 }), 0, 0.22, 0, r.spine); v.scale.set(1.05, 1, 0.7); mesh(box(0.3, 0.025, 0.24), r.M(0xe8e8e8, "metal"), 0, 0.12, 0, r.spine); },
    bib: function (r, c) { mesh(box(0.15, 0.12, 0.01), r.M(0xffffff, "fabric"), 0, 0.25, 0.1, r.spine); },
    sash: function (r, c) { var s = mesh(box(0.04, 0.55, 0.012), r.M(c, "fabric"), 0, 0.22, 0.105, r.spine); s.rotation.z = 0.6; },
    belt: function (r, c) { var b = mesh(cyl(0.14, 0.14, 0.05, 12), r.M(c, "leather"), 0, 0.05, 0, r.hips); b.scale.set(1, 1, 0.75); },
    scarf: function (r, c) { mesh(cyl(0.075, 0.08, 0.06, 12), r.M(c, "fabric"), 0, 0.03, 0, r.neck); var t = grp(0.03, 0.02, -0.05, r.neck); mesh(box(0.06, 0.25, 0.015), r.M(c, "fabric"), 0, -0.12, 0, t); r.body.userData.scarf = t; },
    trench: function (r, c) { var t = mesh(cyl(0.16, 0.2, 0.55, 12), r.M(c, "fabric"), 0, -0.17, 0, r.hips); t.scale.set(1, 1, 0.75); },
    robe: function (r, c) { var t = mesh(cyl(0.16, 0.26, 0.7, 14), r.M(c, "fabric"), 0, -0.25, 0, r.hips); t.scale.set(1, 1, 0.8); },
    skirt: function (r, c) { var t = mesh(cyl(0.14, 0.22, 0.28, 14), r.M(c, "fabric"), 0, -0.1, 0, r.hips); t.scale.set(1, 1, 0.8); },
    armor: function (r, c) { var a = mesh(cyl(0.18, 0.14, 0.3, 12), r.M(c, "metal"), 0, 0.3, 0.01, r.spine); a.scale.set(1, 1, 0.72); [r.aL, r.aR].forEach(function (A, i) { mesh(sph(0.075, 10, 8), r.M(c, "metal"), 0, 0.01, 0, A.sh).scale.set(1.1, 0.8, 1); }); },
    dwings: function (r, c) { [-1, 1].forEach(function (k) { var w = grp(k * 0.1, 0.36, -0.12, r.spine); var m = mesh(new T.ConeGeometry(0.22, 0.5, 3), r.M(c, "metal", { side: true }), k * 0.18, 0.05, -0.05, w); m.rotation.z = k * 1.25; m.scale.z = 0.12; r.body.userData["wing" + k] = w; }); },
    lines: function (r, c) {   // светящиеся полосы (неон, киборг, самурай)
      var m = r.M(c, "plastic", { emissive: c, ei: 2.2 });
      mesh(box(0.012, 0.4, 0.012), m, 0.07, 0.22, 0.108, r.spine, false); mesh(box(0.012, 0.4, 0.012), m, -0.07, 0.22, 0.108, r.spine, false);
      [r.lL, r.lR].forEach(function (L) { mesh(box(0.012, 0.38, 0.012), m, 0, -0.2, 0.06, L.th, false); mesh(box(0.012, 0.36, 0.012), m, 0, -0.2, 0.045, L.kn, false); });
      [r.aL, r.aR].forEach(function (A) { mesh(box(0.01, 0.22, 0.01), m, 0, -0.13, 0.05, A.up, false); });
    },
    staff: function (r, c) { var s = mesh(cyl(0.015, 0.015, 1.3, 8), r.M(0x5a3a1e, "wood"), 0, -0.1, 0.04, r.aR.hand); s.rotation.x = 0.1; mesh(sph(0.045, 10, 8), r.M(c, "glass", { emissive: c, ei: 2 }), 0, 0.56, 0.1, r.aR.hand, false); },
    skate: function (r, c) { var b = mesh(box(0.2, 0.7, 0.03), r.M(c, "wood"), 0, 0.22, -0.16, r.spine); b.rotation.z = 0.3; },
    stick: function (r, c) { var s = mesh(box(0.025, 1.0, 0.025), r.M(0x222222, "plastic"), 0, 0.2, -0.15, r.spine); s.rotation.z = 0.5; },
    net: function (r, c) { var s = mesh(cyl(0.012, 0.012, 0.9, 6), r.M(0x6a4a2a, "wood"), 0.12, 0.25, -0.15, r.spine); s.rotation.z = -0.4; },
    goldglow: function (r, c) { r.root.userData.glow = c; }
  };

  /* ---------- Героиня в костюме ---------- */
  function hero(skin) {
    var L = skin.look;
    var r = rig({ s: 1, female: !L.male, skin: L.skinTone || 0xf2c6a0, hair: L.hair || 0x4a2a18, top: L.top, sleeve: L.sleeve, pants: L.pants, shoe: L.shoe,
      glove: L.glove, sole: L.sole, forearm: L.forearm, shin: L.shin, kinds: L.kinds, topEx: L.topEx, pantsEx: L.pantsEx, ponytail: L.male ? false : L.ponytail, eyes: L.male ? 0x4a2a14 : 0x3d5a2a });
    if (L.male) { r.male = true; r.root.scale.setScalar(1.04); r.chest.scale.set(1.18, 0.7, 0.8); r.hair.children.forEach(function (h) { h.scale.y *= 0.82; }); }
    (L.acc || []).forEach(function (a) { var p = a.split(":"); if (ACC[p[0]]) ACC[p[0]](r, p[1] ? parseInt(p[1], 16) : L.accC || L.top); });
    if (L.hat && ACC[L.hat]) ACC[L.hat](r, L.hatC != null ? L.hatC : L.top);
    if (L.hideHair) r.hair.visible = false;
    // щит-пузырь и джетпак (общие для всех костюмов)
    var shield = new T.Mesh(sph(1.05, 24, 16), G.mat(0x8fd8ff, "glass", { opacity: 0.22, emissive: 0x3a8aff, ei: 0.6 }));
    shield.position.y = 0.95; shield.visible = false; shield.userData.keep = true; r.root.add(shield);
    var jet = grp(0, 0.28, -0.17, r.spine); [-1, 1].forEach(function (k) { mesh(cyl(0.055, 0.06, 0.32, 12), G.mat(0xff8a1a, "metal"), k * 0.07, 0, 0, jet); mesh(cone(0.06, 0.06, 12), G.mat(0x333333, "metal"), k * 0.07, -0.19, 0, jet).rotation.x = Math.PI; });
    var flame = new T.Mesh(cone(0.05, 0.38, 10), G.basic(0xffb21a, 0.85)); flame.rotation.x = Math.PI; flame.position.y = -0.4; jet.add(flame);
    var flame2 = flame.clone(); flame.position.x = 0.07; flame2.position.x = -0.07; jet.add(flame2); flame.userData.keep = flame2.userData.keep = true;
    jet.visible = false;
    var stars = grp(0, 2.0, 0, r.root); for (var i = 0; i < 3; i++) mesh(sph(0.05, 8, 6), G.basic(0xffe25a), Math.cos(i * 2.1) * 0.28, 0, Math.sin(i * 2.1) * 0.28, stars, false);
    stars.visible = false;
    r.shield = shield; r.jet = jet; r.flames = [flame, flame2]; r.stars = stars; r.skin = skin;
    return r;
  }

  /* ---------- Вор: антропоморфный енот ---------- */
  function thief() {
    var r = rig({ s: 1, skin: 0x8b8a90, fur: true, hair: 0x5a5a60, hairStyle: "none", top: 0x2e2f36, sleeve: 0x2e2f36, pants: 0x1c1c22, shoe: 0x3a2a1e, glove: 0x111111, noFace: true, ponytail: false });
    var h = r.head, M = r.M;
    // морда: вытянутый нос, маска, уши, белые брови
    var fur = M(0x8b8a90, "fur"), dark = M(0x1a1a1e, "fur"), white = M(0xe8e6e0, "fur");
    var sn = mesh(cone(0.05, 0.13, 12), M(0xd8d4cc, "fur"), 0, 0.075, 0.12, h); sn.rotation.x = Math.PI / 2;
    mesh(sph(0.018, 8, 6), M(0x111111, "plastic"), 0, 0.075, 0.185, h);
    var mask = mesh(sph(0.105, 16, 8), dark, 0, 0.115, 0.012, h); mask.scale.set(1.02, 0.36, 0.98);
    [-1, 1].forEach(function (k) {
      mesh(sph(0.017, 8, 6), M(0xfff6d8, "glass", { emissive: 0x332200, ei: 0.4 }), k * 0.04, 0.12, 0.092, h, false);
      mesh(sph(0.01, 8, 6), M(0x111111, "glass"), k * 0.04, 0.12, 0.105, h, false);
      var b = mesh(box(0.04, 0.01, 0.012), white, k * 0.042, 0.15, 0.09, h, false); b.rotation.z = k * 0.35;
      var e = mesh(cone(0.04, 0.08, 8), fur, k * 0.07, 0.21, -0.01, h); e.rotation.z = -k * 0.35;
      mesh(cone(0.022, 0.05, 8), dark, k * 0.07, 0.205, 0.005, h);
      mesh(sph(0.04, 10, 8), white, k * 0.05, 0.06, 0.07, h).scale.set(1, 0.6, 0.8);
    });
    // капюшон худи лежит на плечах
    var hood = mesh(new T.TorusGeometry(0.11, 0.04, 8, 16), M(0x2e2f36, "fabric"), 0, 0.46, -0.03, r.spine); hood.rotation.x = Math.PI / 2 - 0.3;
    mesh(box(0.33, 0.04, 0.24), M(0xc8202a, "fabric"), 0, 0.27, 0, r.spine);
    // хвост
    var tail = grp(0, -0.02, -0.11, r.hips), seg = tail;
    for (var i = 0; i < 7; i++) { var s = grp(0, 0, -0.07, seg); mesh(sph(0.07 - i * 0.004, 10, 8), i % 2 ? dark : fur, 0, 0, 0, s).scale.set(1, 1, 1.3); s.rotation.x = 0.18; seg = s; if (i === 0) tail.userData.first = s; }
    tail.rotation.x = 0.9;
    // мешок с золотом через плечо
    var sack = grp(0.06, 0.5, -0.22, r.spine);
    var sm = mesh(sph(0.3, 16, 12), M(0xa07a4a, "fabric"), 0, 0, 0, sack); sm.scale.set(1, 1.15, 0.9);
    mesh(cyl(0.07, 0.11, 0.12, 10), M(0x8a6238, "fabric"), 0.0, 0.36, 0.02, sack);
    mesh(new T.TorusGeometry(0.075, 0.012, 6, 14), M(0x5a3a1a, "leather"), 0, 0.33, 0.02, sack).rotation.x = Math.PI / 2;
    for (var k2 = 0; k2 < 6; k2++) mesh(cyl(0.045, 0.045, 0.012, 14), G.mat(0xffc93a, "gold"), (Math.random() - 0.5) * 0.12, 0.42 + Math.random() * 0.04, (Math.random() - 0.5) * 0.1, sack, false).rotation.set(Math.random(), Math.random(), Math.random());
    r.aR.sh.rotation.x = -2.6; r.aR.el.rotation.x = -0.8;   // держит мешок
    r.tail = tail; r.sack = sack;
    r.root.scale.setScalar(0.95); r.holdsSack = true;
    return r;
  }

  /* ---------- Анимация бега / прыжка / подката / меню ---------- */
  function pose(r, st, t, dt) {
    var p = st.phase, a = st.anim;
    var L = r.lL, R = r.lR, AL = r.aL, AR = r.aR;
    function set(o, x, y, z) { o.rotation.x = x; if (y != null) o.rotation.y = y; if (z != null) o.rotation.z = z; }
    if (a === "run") {
      var s = Math.sin(p), c = Math.cos(p);
      set(L.th, -s * 0.95 - 0.15); set(R.th, s * 0.95 - 0.15);
      set(L.kn, Math.max(0.15, Math.sin(p + 1.9) * 1.5 + 0.55)); set(R.kn, Math.max(0.15, -Math.sin(p + 1.9) * 1.5 + 0.55));
      set(L.ft, -0.25 + s * 0.3); set(R.ft, -0.25 - s * 0.3);
      if (!r.holdsSack) { set(AL.up, s * 0.9 + 0.1); set(AL.el, -1.35 - Math.max(0, s) * 0.3); }
      set(AR.up, -s * 0.9 + 0.1, null, null); set(AR.el, -1.35 - Math.max(0, -s) * 0.3);
      if (r.holdsSack) { AR.up.rotation.x = -2.5 + s * 0.08; AR.el.rotation.x = -0.9; set(AL.up, s * 0.9 + 0.1); set(AL.el, -1.35); }
      r.spine.rotation.x = 0.2 + Math.abs(c) * 0.04; r.spine.rotation.y = s * 0.12; r.hips.rotation.y = -s * 0.1;
      r.hips.position.y = 0.93 + Math.abs(c) * 0.05 - 0.03;
      r.head.rotation.x = -0.12; r.head.rotation.y = -s * 0.06;
      r.body.rotation.x += (0 - r.body.rotation.x) * Math.min(1, dt * 14); r.body.position.y += (0 - r.body.position.y) * Math.min(1, dt * 14);
    } else if (a === "jump") {
      set(L.th, -1.1); set(L.kn, 1.6); set(R.th, -0.2); set(R.kn, 1.2); set(L.ft, 0.2); set(R.ft, 0.3);
      set(AL.up, -2.2); set(AL.el, -0.5); set(AR.up, 0.6); set(AR.el, -1.0);
      r.spine.rotation.x = 0.15; r.hips.position.y = 0.93;
      r.body.rotation.x += (st.flip || 0);
    } else if (a === "slide") {
      set(L.th, -1.45); set(L.kn, 0.2); set(R.th, -1.0); set(R.kn, 1.4); set(L.ft, 0.4); set(R.ft, 0.2);
      set(AL.up, -0.6, null, 0.6); set(AL.el, -0.4); set(AR.up, 0.4, null, -0.4); set(AR.el, -0.3);
      r.spine.rotation.x = -0.35; r.hips.position.y = 0.93;
      r.body.rotation.x += (-0.95 - r.body.rotation.x) * Math.min(1, dt * 18); r.body.position.y += (-0.48 - r.body.position.y) * Math.min(1, dt * 18);
    } else if (a === "fly") {
      set(L.th, -0.3); set(L.kn, 0.6); set(R.th, 0.1); set(R.kn, 0.3); set(AL.up, -0.2, null, 0.5); set(AR.up, -0.2, null, -0.5); set(AL.el, -0.3); set(AR.el, -0.3);
      r.spine.rotation.x = 0.55; r.body.rotation.x = 0; r.body.position.y = 0;
    } else if (a === "fall") {
      r.body.rotation.x += (-1.45 - r.body.rotation.x) * Math.min(1, dt * 6); r.body.position.y += (-0.7 - r.body.position.y) * Math.min(1, dt * 6);
      set(L.th, -0.6); set(R.th, -0.9); set(L.kn, 0.4); set(R.kn, 0.9); set(AL.up, -1.2, null, 0.8); set(AR.up, -1.0, null, -0.8);
      r.spine.rotation.x = 0;
    } else if (a === "idle") {
      var b = Math.sin(t * 1.8);
      set(L.th, 0.02); set(R.th, -0.08); set(L.kn, 0.05); set(R.kn, 0.18); set(L.ft, 0); set(R.ft, 0);
      set(AL.up, 0.05, 0, 0.25); set(AL.el, -0.25); set(AR.up, -0.15, 0, -0.55); set(AR.el, -1.6); AR.el.rotation.y = 0.6;   // рука на поясе
      r.spine.rotation.x = 0.02 + b * 0.012; r.spine.rotation.y = Math.sin(t * 0.5) * 0.1; r.hips.position.y = 0.93 + b * 0.004; r.hips.rotation.y = 0;
      r.head.rotation.y = Math.sin(t * 0.37) * 0.35; r.head.rotation.x = 0.03;
      r.body.rotation.x = 0; r.body.position.y = 0;
    }
    if (r.male && a === "idle") { set(AL.up, 0.18, 0, 0.14); set(AL.el, -0.35); AL.el.rotation.y = 0; set(AR.up, 0.18, 0, -0.14); set(AR.el, -0.35); AR.el.rotation.y = 0; r.head.rotation.x = -0.05; }   // руки в карманах
    if (r.male) { if (a === "jump") { r._jt = (r._jt || 0) + dt; r.body.rotation.y = Math.min(1, r._jt / 0.55) * Math.PI * 2; } else { r._jt = 0; r.body.rotation.y = 0; } }
    if (a === "wave") {
      set(AR.up, -2.7, 0, -0.3); set(AR.el, -0.4 + Math.sin(t * 9) * 0.35); r.head.rotation.y = 0.2;
    }
    if (r.hair.userData.tail) r.hair.userData.tail.rotation.x = -0.5 - (a === "run" ? 0.5 + Math.sin(p * 2) * 0.15 : 0) + (a === "jump" ? 0.6 : 0);
    var cape = r.body.userData.cape; if (cape) cape.rotation.x = a === "run" || a === "fly" ? 0.7 + Math.sin(t * 13) * 0.08 : a === "jump" ? 1.1 : 0.12;
    var sc = r.body.userData.scarf; if (sc) sc.rotation.x = a === "run" ? 1.0 + Math.sin(t * 15) * 0.1 : 0.2;
    if (r.tail) { r.tail.rotation.x = 0.9 + Math.sin(t * 9) * 0.15; r.tail.rotation.y = Math.sin(t * 6) * 0.35; }
  }

  return { hero: hero, thief: thief, pose: pose, ACC: ACC, geo: { cyl: cyl, sph: sph, box: box, cone: cone }, mesh: mesh, grp: grp };
})();
