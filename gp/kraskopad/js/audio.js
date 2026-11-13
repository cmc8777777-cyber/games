/* Краскопад · звук и музыка (Э7). Всё синтезируется WebAudio, внешних файлов нет.
   Эффекты с громкостью по расстоянию и стереопанорамой относительно камеры; окружение (ветер, дождь, птицы);
   процедурная музыка: меню, высадка, матч, финал. KP.sfx(name, x, z, mine) — как раньше. */
window.KP = window.KP || {};
(function (KP) {
  "use strict";
  var AC = null, master = null, sfxBus = null, musBus = null, ambBus = null, noiseBuf = null, comp = null;
  var SET = { snd: 1, mus: 1 };
  var L = { x: 0, z: 0, yaw: 0 };   // слушатель (камера)

  function init(set) {
    if (set) SET = set;
    if (AC) { try { if (AC.state === "suspended") AC.resume(); } catch (e) {} return; }
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      comp = AC.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4; comp.connect(AC.destination);
      master = AC.createGain(); master.connect(comp);
      sfxBus = AC.createGain(); sfxBus.connect(master);
      musBus = AC.createGain(); musBus.connect(master);
      ambBus = AC.createGain(); ambBus.connect(master);
      var n = AC.sampleRate * 1.5; noiseBuf = AC.createBuffer(1, n, AC.sampleRate);
      var d = noiseBuf.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      setVol();
      startAmbience();
      setInterval(schedule, 90);
    } catch (e) { AC = null; }
  }
  function setVol() {
    if (!AC) return;
    master.gain.value = SET.snd ? 0.8 : 0; sfxBus.gain.value = 0.9; musBus.gain.value = SET.mus === 0 ? 0 : 0.32; ambBus.gain.value = 0.5;
  }
  function now() { return AC.currentTime; }

  /* ---------- примитивы ---------- */
  function out(vol, pan, bus) {
    var g = AC.createGain(); g.gain.value = vol;
    if (pan && AC.createStereoPanner) { var p = AC.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); p.connect(bus || sfxBus); }
    else g.connect(bus || sfxBus);
    return g;
  }
  function osc(type, f0, f1, t0, dur, vol, dst) {
    var o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0); if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dst); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, vol, ftype, freq, q, dst, attack) {
    var s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = noiseBuf; s.loop = true; f.type = ftype; f.frequency.value = freq; f.Q.value = q || 0.8;
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + (attack || 0.003)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(dst); s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
  }

  /* ---------- эффекты ---------- */
  function spatial(x, z, mine, range) {
    if (mine || x === undefined) return { v: 1, pan: 0 };
    var dx = x - L.x, dz = z - L.z, d = Math.hypot(dx, dz); if (d > range) return null;
    var ang = Math.atan2(dx, dz) - L.yaw, pan = -Math.sin(ang) * Math.min(1, d / 8);
    return { v: Math.pow(1 - d / range, 1.6), pan: pan };
  }
  var SHOTS = {
    0: function (t, d) { noise(t, 0.12, 0.25, "bandpass", 900, 1.2, d); },
    1: function (t, d) { noise(t, 0.09, 0.6, "bandpass", 1800, 1.4, d); osc("sine", 160, 60, t, 0.08, 0.35, d); },
    2: function (t, d) { noise(t, 0.06, 0.45, "bandpass", 2400, 1.6, d); osc("sine", 140, 70, t, 0.05, 0.25, d); },
    3: function (t, d) { noise(t, 0.22, 0.8, "lowpass", 1400, 0.7, d); osc("sine", 110, 40, t, 0.2, 0.6, d); noise(t + 0.02, 0.3, 0.2, "highpass", 3000, 0.7, d); },
    4: function (t, d) { noise(t, 0.08, 0.55, "bandpass", 1500, 1.2, d); osc("sine", 150, 55, t, 0.07, 0.4, d); },
    5: function (t, d) { noise(t, 0.05, 0.9, "highpass", 2500, 0.7, d); osc("sine", 120, 35, t, 0.35, 0.6, d); noise(t + 0.03, 0.6, 0.18, "lowpass", 700, 0.6, d, 0.05); },
    6: function (t, d) { osc("sine", 90, 35, t, 0.3, 0.8, d); noise(t, 0.25, 0.3, "lowpass", 600, 0.7, d); }
  };
  function sfx(k, x, z, mine) {
    if (!AC || (KP.G && KP.G.headless) || !SET.snd) return;
    var t = now(), sp, d;
    if (k.indexOf("shot") === 0) {
      sp = spatial(x, z, mine, 110); if (!sp) return;
      d = out((mine ? 0.55 : 0.5) * sp.v, sp.pan); SHOTS[k.slice(4)](t, d);
      return;
    }
    sp = spatial(x, z, mine, 60); if (!sp) return;
    d = out(sp.v, sp.pan);
    switch (k) {
      case "hit": osc("sine", 1600, 2200, t, 0.06, 0.25, d); noise(t, 0.05, 0.2, "highpass", 4000, 0.7, d); break;
      case "hitShield": osc("triangle", 2400, 1800, t, 0.12, 0.2, d); break;
      case "hurt": noise(t, 0.12, 0.35, "lowpass", 500, 0.7, d); osc("sine", 90, 50, t, 0.1, 0.4, d); break;
      case "ko": osc("sine", 300, 900, t, 0.35, 0.25, d); osc("sine", 450, 1350, t + 0.05, 0.3, 0.15, d); break;
      case "pick": osc("sine", 700, 1050, t, 0.09, 0.18, d); break;
      case "build": noise(t, 0.14, 0.5, "lowpass", 400, 1, d); osc("square", 120, 80, t, 0.08, 0.12, d); break;
      case "chop": noise(t, 0.08, 0.5, "bandpass", 700, 2, d); osc("sine", 220, 120, t, 0.06, 0.2, d); break;
      case "swing": noise(t, 0.12, 0.18, "bandpass", 1200, 0.5, d, 0.05); break;
      case "chest": osc("sine", 523, 0, t, 0.25, 0.15, d); osc("sine", 784, 0, t + 0.08, 0.3, 0.15, d); osc("sine", 1046, 0, t + 0.16, 0.4, 0.12, d); break;
      case "boom": osc("sine", 80, 30, t, 0.6, 0.9, d); noise(t, 0.7, 0.6, "lowpass", 900, 0.6, d); break;
      case "throw": noise(t, 0.15, 0.2, "bandpass", 900, 0.6, d, 0.04); break;
      case "smoke": noise(t, 1.4, 0.3, "highpass", 2500, 0.5, d, 0.1); break;
      case "engine": osc("sawtooth", 55, 110, t, 0.6, 0.15, d); break;
      case "step": noise(t, 0.05, 0.08, "bandpass", 500 + Math.random() * 300, 1, d); break;
      case "zone": osc("sine", 220, 110, t, 1.2, 0.25, d); osc("sine", 330, 165, t, 1.2, 0.12, d); break;
      case "ui": osc("sine", 880, 1100, t, 0.05, 0.12, d); break;
      case "win": [523, 659, 784, 1046, 1318].forEach(function (f, i) { osc("triangle", f, 0, t + i * 0.12, 0.5, 0.18, d); }); break;
      case "lose": [392, 330, 262].forEach(function (f, i) { osc("triangle", f, 0, t + i * 0.18, 0.5, 0.15, d); }); break;
      case "jump": noise(t, 0.4, 0.15, "lowpass", 600, 0.6, d, 0.1); break;
    }
  }

  /* ---------- окружение: ветер, дождь, птицы ---------- */
  var wind = null, rainG = null, amb = "day", birdT = 0;
  function loopNoise(ftype, freq, vol) {
    var s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = noiseBuf; s.loop = true; f.type = ftype; f.frequency.value = freq; g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(ambBus); s.start(); return g;
  }
  function startAmbience() { wind = loopNoise("lowpass", 380, 0.05); rainG = loopNoise("highpass", 1800, 0); }
  function ambience(name) {
    amb = name; if (!AC) return;
    rainG.gain.setTargetAtTime(name === "storm" ? 0.11 : 0, now(), 0.8);
    wind.gain.setTargetAtTime(name === "storm" ? 0.1 : name === "menu" ? 0.03 : 0.05, now(), 0.8);
  }
  function birds() {
    if (amb === "storm" || amb === "dusk" || amb === "silent") return;
    var t = now(), d = out(0.08, Math.random() * 1.6 - 0.8, ambBus), f = 2200 + Math.random() * 1600;
    for (var i = 0; i < 2 + Math.floor(Math.random() * 3); i++) osc("sine", f, f * (1.2 + Math.random() * 0.3), t + i * 0.13, 0.09, 0.5, d);
  }

  /* ---------- музыка: тональность ля минор, 96 уд/мин, сетка шестнадцатых ---------- */
  var music = "off", nextT = 0, stepI = 0, BPM = 96;
  var PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];   // Am F C G
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function setMusic(name) { if (music === name) return; music = name; if (AC) { nextT = Math.max(nextT, now() + 0.05); } }
  function voice(type, f, t, dur, vol, cut) {
    var o = AC.createOscillator(), o2 = AC.createOscillator(), fl = AC.createBiquadFilter(), g = AC.createGain();
    o.type = type; o2.type = type; o.frequency.value = f; o2.frequency.value = f * 1.006; fl.type = "lowpass"; fl.frequency.value = cut || 1800;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.3, dur * 0.3)); g.gain.setTargetAtTime(0.0001, t + dur * 0.7, dur * 0.2);
    o.connect(fl); o2.connect(fl); fl.connect(g); g.connect(musBus); o.start(t); o2.start(t); o.stop(t + dur + 0.6); o2.stop(t + dur + 0.6);
  }
  function kick(t, v) { osc("sine", 120, 40, t, 0.25, v, musBus); }
  function hat(t, v) { noise(t, 0.04, v, "highpass", 7000, 0.7, musBus); }
  function snare(t, v) { noise(t, 0.16, v, "bandpass", 1800, 0.8, musBus); osc("triangle", 200, 120, t, 0.08, v * 0.5, musBus); }
  function schedule() {
    if (!AC || music === "off" || !SET.snd) return;
    var sixteenth = 60 / BPM / 4;
    while (nextT < now() + 0.35) {
      var t = nextT, s = stepI % 16, bar = Math.floor(stepI / 16) % 4, ch = PROG[bar];
      var hi = music === "drop" || music === "final", lo = music === "match";
      if (s === 0) { voice("sawtooth", mtof(ch[0]), t, sixteenth * 16, lo ? 0.05 : 0.07, hi ? 2400 : 1100); voice("sawtooth", mtof(ch[1]), t, sixteenth * 16, lo ? 0.04 : 0.05, 1100); voice("sawtooth", mtof(ch[2]), t, sixteenth * 16, lo ? 0.035 : 0.05, 1100); }
      if (!lo || s % 8 === 0) if (s % 4 === 0 || (hi && s % 2 === 0)) voice("triangle", mtof(ch[0] - 24), t, sixteenth * (hi ? 2 : 4), hi ? 0.18 : 0.12, 600);
      if (music !== "match") {
        if (s % (hi ? 1 : 2) === 0) { var arp = ch[(s / (hi ? 1 : 2)) % 3] + (s % 8 >= 4 ? 12 : 0); voice("square", mtof(arp + 12), t, sixteenth * 0.9, hi ? 0.035 : 0.025, hi ? 3200 : 1600); }
        if (hi) { if (s % 4 === 0) kick(t, 0.5); if (s === 4 || s === 12) snare(t, 0.25); if (s % 2 === 1) hat(t, 0.06); }
        else { if (s === 0 || s === 10) kick(t, 0.3); if (s % 4 === 2) hat(t, 0.04); }
      } else if (s === 0 && bar % 2 === 0) kick(t, 0.15);
      nextT += sixteenth; stepI++;
    }
    birdT -= 0.09; if (birdT <= 0) { birdT = 3 + Math.random() * 6; birds(); }
  }

  KP.audio = {
    init: init, setVol: setVol, ambience: ambience, music: setMusic, ctx: function () { return AC; },
    listener: function (x, z, yaw) { L.x = x; L.z = z; L.yaw = yaw; },
    pause: function (p) { if (!AC) return; try { if (p) AC.suspend(); else AC.resume(); } catch (e) {} }
  };
  KP.sfx = sfx;
})(window.KP);
