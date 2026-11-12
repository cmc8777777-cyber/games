/* Держи Шмыга! · звук: эффекты и музыка синтезом WebAudio (без файлов, всё своё).
   Музыка — процедурная: у каждого мира свой лад, темп, аккорды и тембр солиста; в меню — спокойная тема.
   Громкость: эффекты 0.5, музыка 0.22. Режимы звука: всё / без музыки / тишина. */
window.AUDIO = (function () {
  "use strict";
  var ac = null, master, sfxBus, musBus, comp, noiseBuf = null;
  var on = true, musicOn = true, suspended = false;
  function ctx() {
    if (ac) return ac;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(ac.destination);
      master = ac.createGain(); master.gain.value = 0.9; master.connect(comp);
      sfxBus = ac.createGain(); sfxBus.gain.value = 0.5; sfxBus.connect(master);
      musBus = ac.createGain(); musBus.gain.value = 0.22; musBus.connect(master);
      var len = ac.sampleRate; noiseBuf = ac.createBuffer(1, len, ac.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ac = null; }
    return ac;
  }
  function unlock() { if (!ctx()) return; if (ac.state === "suspended" && !suspended) ac.resume(); }
  function apply() { if (!ac) return; master.gain.setTargetAtTime(on && !suspended ? 0.9 : 0, ac.currentTime, 0.05); musBus.gain.setTargetAtTime(musicOn ? 0.22 : 0, ac.currentTime, 0.1); }

  /* ---------- примитивы ---------- */
  function env(g, t, a, d, peak, sus, rel) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * (sus || 0.0001)), t + a + d); if (rel) g.gain.exponentialRampToValueAtTime(0.0001, t + a + d + rel); }
  function tone(bus, type, f, t, dur, vol, o) {
    o = o || {};
    var osc = ac.createOscillator(), g = ac.createGain(), out = g;
    osc.type = type; osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide || dur));
    if (o.detune) osc.detune.value = o.detune;
    if (o.lp) { var fl = ac.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.setValueAtTime(o.lp, t); if (o.lpTo) fl.frequency.exponentialRampToValueAtTime(o.lpTo, t + dur); fl.Q.value = o.q || 1; osc.connect(fl); fl.connect(g); } else osc.connect(g);
    env(g, t, o.a || 0.005, dur, vol, o.sus || 0.0001, o.rel || 0.04);
    if (o.pan != null && ac.createStereoPanner) { var p = ac.createStereoPanner(); p.pan.value = o.pan; g.connect(p); out = p; }
    out.connect(bus); osc.start(t); osc.stop(t + dur + (o.rel || 0.04) + 0.05);
  }
  function noise(bus, t, dur, vol, type, f, q) {
    var s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; fl.type = type || "highpass"; fl.frequency.value = f || 6000; fl.Q.value = q || 0.7;
    s.connect(fl); fl.connect(g); g.connect(bus); env(g, t, 0.002, dur, vol, 0.0001, 0.02);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.1);
  }

  /* ---------- эффекты ---------- */
  var coinStreak = 0, coinAt = 0;
  var SFX = {
    coin: function (t) { if (t - coinAt < 0.6) coinStreak = Math.min(coinStreak + 1, 12); else coinStreak = 0; coinAt = t; var f = 1046 * Math.pow(2, (coinStreak % 8) / 24); tone(sfxBus, "square", f, t, 0.05, 0.08, { lp: 5000 }); tone(sfxBus, "square", f * 1.5, t + 0.045, 0.09, 0.07, { lp: 6000 }); },
    jump: function (t) { tone(sfxBus, "triangle", 260, t, 0.18, 0.3, { to: 620, glide: 0.15 }); noise(sfxBus, t, 0.12, 0.08, "bandpass", 1800, 0.8); },
    slide: function (t) { noise(sfxBus, t, 0.28, 0.16, "bandpass", 900, 0.6); tone(sfxBus, "sine", 180, t, 0.22, 0.15, { to: 90 }); },
    whoosh: function (t) { noise(sfxBus, t, 0.14, 0.12, "bandpass", 2600, 1.2); },
    bump: function (t) { tone(sfxBus, "sine", 120, t, 0.12, 0.3, { to: 70 }); },
    stumble: function (t) { tone(sfxBus, "square", 240, t, 0.12, 0.15, { to: 120, lp: 1500 }); noise(sfxBus, t, 0.15, 0.2, "lowpass", 600); },
    crash: function (t) { noise(sfxBus, t, 0.45, 0.45, "lowpass", 900); tone(sfxBus, "sawtooth", 180, t, 0.5, 0.2, { to: 40, lp: 1200 }); tone(sfxBus, "sine", 70, t, 0.35, 0.5, { to: 35 }); },
    boost: function (t) { [523, 659, 784, 1046].forEach(function (f, i) { tone(sfxBus, "triangle", f, t + i * 0.05, 0.12, 0.18); }); noise(sfxBus, t, 0.3, 0.06, "highpass", 5000); },
    shield: function (t) { tone(sfxBus, "sine", 880, t, 0.3, 0.2, { to: 440 }); noise(sfxBus, t, 0.2, 0.12, "bandpass", 3000, 2); },
    bar: function (t) { [784, 988, 1318].forEach(function (f, i) { tone(sfxBus, "triangle", f, t + i * 0.06, 0.18, 0.2); tone(sfxBus, "sine", f * 2, t + i * 0.06, 0.25, 0.06); }); },
    caught: function (t) { [523, 659, 784, 1046, 1318].forEach(function (f, i) { tone(sfxBus, "square", f, t + i * 0.08, 0.16, 0.12, { lp: 3500 }); }); tone(sfxBus, "triangle", 1568, t + 0.42, 0.5, 0.15, { sus: 0.3, rel: 0.3 }); },
    boing: function (t) { tone(sfxBus, "sine", 160, t, 0.4, 0.35, { to: 700, glide: 0.25 }); },
    build: function (t) { for (var i = 0; i < 6; i++) noise(sfxBus, t + i * 0.09, 0.07, 0.18, "bandpass", 1200 + i * 300, 3); [392, 523, 659, 784].forEach(function (f, i) { tone(sfxBus, "triangle", f, t + 0.55 + i * 0.07, 0.25, 0.16); }); },
    token: function (t) { tone(sfxBus, "triangle", 1568, t, 0.08, 0.1); tone(sfxBus, "sine", 2093, t + 0.05, 0.14, 0.08); },
    warn: function (t) { tone(sfxBus, "square", 880, t, 0.08, 0.12, { lp: 3000 }); tone(sfxBus, "square", 880, t + 0.14, 0.08, 0.12, { lp: 3000 }); },
    fire: function (t) { noise(sfxBus, t, 0.45, 0.3, "bandpass", 700, 0.7); tone(sfxBus, "sawtooth", 140, t, 0.35, 0.12, { to: 60, lp: 900 }); },
    click: function (t) { tone(sfxBus, "sine", 1200, t, 0.03, 0.08); },
    chest: function (t) { noise(sfxBus, t, 0.2, 0.15, "lowpass", 800); [659, 784, 988, 1318, 1568].forEach(function (f, i) { tone(sfxBus, "triangle", f, t + 0.2 + i * 0.05, 0.2, 0.14); }); }
  };
  function sfx(name) { if (!on || !ctx() || ac.state !== "running") return; var f = SFX[name]; if (f) try { f(ac.currentTime + 0.005); } catch (e) {} }

  /* ---------- музыка ---------- */
  var NOTE = function (n) { return 440 * Math.pow(2, (n - 69) / 12); };
  var SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], phryg: [0, 1, 4, 5, 7, 8, 10], mixo: [0, 2, 4, 5, 7, 9, 10], lydian: [0, 2, 4, 6, 7, 9, 11], penta: [0, 2, 4, 7, 9, 12, 14], mpenta: [0, 3, 5, 7, 10, 12, 15] };
  /* стиль: корень (MIDI), лад, темп, аккорды (ступени), тембр солиста, плотность ударных */
  var STYLES = {
    menu: { root: 57, scale: "major", bpm: 92, prog: [0, 5, 3, 4], lead: "sine", drums: 0.3, pad: true },
    town: { root: 60, scale: "major", bpm: 124, prog: [0, 4, 5, 3], lead: "triangle", drums: 1, swing: 0 },
    dunes: { root: 52, scale: "phryg", bpm: 108, prog: [0, 1, 0, 6], lead: "sawtooth", drums: 0.9, pluck: true },
    snow: { root: 64, scale: "penta", bpm: 116, prog: [0, 3, 4, 3], lead: "sine", drums: 0.7, bells: true },
    jungle: { root: 57, scale: "mpenta", bpm: 120, prog: [0, 3, 2, 4], lead: "triangle", drums: 1.2, toms: true },
    harbor: { root: 55, scale: "mixo", bpm: 118, prog: [0, 6, 3, 0], lead: "square", drums: 0.9 },
    mine: { root: 50, scale: "minor", bpm: 104, prog: [0, 5, 6, 4], lead: "sawtooth", drums: 1, dark: true },
    sky: { root: 62, scale: "lydian", bpm: 112, prog: [0, 1, 4, 3], lead: "sine", drums: 0.6, pad: true, bells: true },
    moon: { root: 53, scale: "minor", bpm: 100, prog: [0, 5, 3, 6], lead: "square", drums: 0.9, arp: true, pad: true }
  };
  var mus = { style: null, step: 0, next: 0, timer: 0, seed: 1, mel: [], energy: 0.5 };
  function rand() { mus.seed = (mus.seed * 16807) % 2147483647; return (mus.seed - 1) / 2147483646; }
  function deg(st, d, oct) { var sc = SCALES[st.scale], n = sc.length; var o = Math.floor(d / n), i = ((d % n) + n) % n; return st.root + sc[i] + 12 * (o + (oct || 0)); }
  function makeMelody(st) {   // 4 такта × 16 шагов, привязка к аккордам
    var m = [];
    for (var bar = 0; bar < 4; bar++) for (var s = 0; s < 16; s++) {
      var strong = s % 4 === 0, p = strong ? 0.75 : s % 2 === 0 ? 0.45 : 0.18;
      if (rand() < p) { var ch = st.prog[bar], d = ch + [0, 2, 4, 7, 2, 4][Math.floor(rand() * 6)]; m.push({ i: bar * 16 + s, d: d, len: strong && rand() < 0.4 ? 3 : 1 }); }
    }
    return m;
  }
  function playStep(t, st, i) {
    var bar = Math.floor(i / 16) % 4, s = i % 16, ch = st.prog[bar], b16 = 60 / st.bpm / 4, e = mus.energy;
    // ударные
    if (st.drums > 0) {
      if (s % 4 === 0) tone(musBus, "sine", 110, t, 0.18, 0.9 * st.drums, { to: 40, glide: 0.12 });
      if (s === 4 || s === 12) noise(musBus, t, 0.12, 0.35 * st.drums, "bandpass", 1800, 0.8);
      if (s % 2 === 0 || (e > 0.6 && st.drums >= 0.9)) noise(musBus, t, 0.03, (s % 4 === 2 ? 0.18 : 0.09) * st.drums, "highpass", 8000);
      if (st.toms && (s === 7 || s === 14 || s === 15)) tone(musBus, "sine", s === 7 ? 180 : 140, t, 0.15, 0.4, { to: 80 });
    }
    // бас
    if (s % 4 === 0 || (s % 4 === 3 && rand() < 0.35)) tone(musBus, st.dark ? "sawtooth" : "triangle", NOTE(deg(st, ch, -2)), t, b16 * (s % 4 === 0 ? 3 : 1), 0.38, { lp: 700, lpTo: 300 });
    // подклад
    if (st.pad && s === 0) [0, 2, 4].forEach(function (k) { tone(musBus, "triangle", NOTE(deg(st, ch + k, 0)), t, b16 * 15, 0.06, { a: 0.4, sus: 0.6, rel: 0.5, detune: k * 4 - 4 }); });
    // арпеджио
    if ((st.arp || e > 0.75) && s % 2 === 1) tone(musBus, "square", NOTE(deg(st, ch + [0, 2, 4, 7][(s >> 1) % 4], 1)), t, b16 * 0.8, 0.035, { lp: 2600 });
    // мелодия
    mus.mel.forEach(function (n) { if (n.i === i % 64) {
      var f = NOTE(deg(st, n.d, st.bells ? 1 : 0));
      if (st.pluck) tone(musBus, "sawtooth", f, t, b16 * n.len, 0.1, { lp: 2600, lpTo: 500, q: 2, pan: 0.15 });
      else tone(musBus, st.lead, f, t, b16 * n.len, st.lead === "square" ? 0.05 : 0.11, { lp: 3800, pan: 0.1, sus: 0.3, rel: 0.08 });
      if (st.bells) tone(musBus, "sine", f * 2, t, b16 * 2, 0.04, { sus: 0.2, rel: 0.3 });
    } });
  }
  function schedule() {
    if (!ac || !mus.style || ac.state !== "running") return;
    var st = STYLES[mus.style], b16 = 60 / st.bpm / 4;
    while (mus.next < ac.currentTime + 0.12) { try { playStep(mus.next, st, mus.step); } catch (e) {} mus.step++; mus.next += b16; if (mus.step % 64 === 0 && rand() < 0.5) mus.mel = makeMelody(st); }
  }
  function music(style) {
    if (!ctx()) return;
    if (mus.style === style) return;
    mus.style = style; mus.step = 0; mus.next = ac.currentTime + 0.1;
    mus.seed = 7 + Object.keys(STYLES).indexOf(style) * 101;
    mus.mel = style ? makeMelody(STYLES[style]) : [];
    if (!mus.timer) mus.timer = setInterval(schedule, 30);
  }
  function setEnergy(e) { mus.energy = e; }

  return {
    unlock: unlock, sfx: sfx, music: music, setEnergy: setEnergy,
    setOn: function (v) { on = !!v; ctx(); apply(); },
    setMusic: function (v) { musicOn = !!v; ctx(); apply(); },
    suspend: function (v) { suspended = !!v; if (!ac) return; if (v) { try { ac.suspend(); } catch (e) {} } else { try { ac.resume(); } catch (e) {} } apply(); },
    state: function () { return { on: on, music: musicOn, ctx: ac ? ac.state : "none", style: mus.style }; }
  };
})();
