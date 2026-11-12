/* Краскопад · ИИ ботов, союзников и автоигрока. Думает 5 раз в секунду со сдвигом, двигается каждый кадр.
   Типы: rookie (новичок), looter (сборщик), rusher (задира), sniper (снайпер), builder (строитель), sneaky (хитрец), auto (автоигрок), ally (союзник игрока).
   Умения (Э2): укрытия (перезарядка, лечение, мало здоровья), выглядывание из укрытия, стены под огнём, рампы к цели выше, «коробка» из стен при лечении,
   снайпер стреляет стоя и меняет позицию, хитрец подкрадывается к тому, кто его не видит, задира сближается с прыжками,
   общая цель у команды (трио), союзники держатся рядом с лидером, добивание ослабленных. */
window.KP = window.KP || {};
(function (KP) {
  "use strict";
  var G = KP.G, W3 = KP.world, rnd = Math.random;
  var TYPES = {
    dummy: { sight: 0, pref: 10, loot: 0, chop: 0, cover: 0.5, build: true, passive: true },
    rookie: { sight: 30, pref: 16, loot: 0.6, chop: 0.2, cover: 0 },
    looter: { sight: 38, pref: 18, loot: 1, chop: 0.3, shy: true, cover: 0.9 },
    rusher: { sight: 50, pref: 5, loot: 0.5, chop: 0.2, hunt: true, cover: 0.2 },
    sniper: { sight: 85, pref: 55, loot: 0.7, chop: 0.2, cover: 0.8, still: true },
    builder: { sight: 45, pref: 16, loot: 0.6, chop: 0.8, build: true, cover: 0.5 },
    sneaky: { sight: 42, pref: 20, loot: 0.6, chop: 0.3, camp: true, cover: 0.7, ambush: true },
    auto: { sight: 70, pref: 14, loot: 0.9, chop: 0.4, build: true, hunt: true, cover: 0.6 },
    ally: { sight: 60, pref: 14, loot: 0.8, chop: 0.4, build: true, cover: 0.6, follow: true }
  };
  KP.AI_TYPES = TYPES;

  function makeAI(type, skill) {
    return { type: type, T: TYPES[type], skill: skill, aimErr: (10 - 7.5 * skill) * Math.PI / 180, react: 0.95 - 0.65 * skill,
      think: rnd() * 0.2, target: null, see: false, reactT: 0, strafe: rnd() < 0.5 ? 1 : -1, strafeT: 0, goal: null, goalT: 0, goalKind: null,
      stuckT: 0, lx: 0, lz: 0, buildCd: 0, lastSeen: null, dropAt: 0, land: null, cover: null, coverCd: 0, peekT: 0, shots: 0, rampCd: 0 };
  }
  KP.makeAI = makeAI;

  function dist(a, b) { return Math.hypot(a.x - b.x, a.z - b.z); }
  function enemy(a, b) { return a !== b && (a.team === undefined || a.team !== b.team); }
  KP.enemy = enemy;
  function inZoneSoon(x, z, margin) { var Z = G.zone; return Math.hypot(x - Z.tx, z - Z.tz) < Z.tr - (margin || 0) && Math.hypot(x - Z.cx, z - Z.cz) < Z.r - (margin || 0); }
  function armed(ch) { return ch.slots[1] || ch.slots[2] || ch.slots[3] || ch.slots[4]; }

  function bestSlotFor(ch, d) {
    var pref = d < 10 ? [3, 2, 4, 1, 6] : d < 40 ? [4, 2, 1, 3, 5, 6] : [5, 4, 6, 1, 2];
    if (ch.ai && ch.ai.type === "sniper" && d > 25) pref = [5, 4, 1, 2, 6, 3];
    var best = 0, bs = -1;
    for (var i = 1; i <= 4; i++) {
      var s = ch.slots[i]; if (!s) continue;
      var rank = pref.indexOf(s.id); var sc = (rank < 0 ? 0 : 10 - rank) + s.r * 0.6 + (s.mag > 0 ? 3 : 0);
      if (sc > bs) { bs = sc; best = i; }
    }
    return best;
  }

  /* укрытие от угрозы: точка за домом/камнем/деревом/постройкой, где нет прямой видимости */
  function findCover(ch, th) {
    var R = 16, near = W3.query(ch.x - R, ch.z - R, ch.x + R, ch.z + R), best = null, bd = 1e9;
    for (var i = 0; i < near.length; i++) {
      var c = near[i], cx, cz, rad;
      if (c.r) { if (c.top < ch.y + 1.4 || c.kind === "crate") continue; cx = c.x; cz = c.z; rad = c.r + 0.9; }
      else { if (c.y1 < ch.y + 1.5 || c.kind === "ramp") continue; cx = (c.x0 + c.x1) / 2; cz = (c.z0 + c.z1) / 2; rad = Math.hypot(c.x1 - c.x0, c.z1 - c.z0) / 2 + 0.7; }
      var vx = cx - th.x, vz = cz - th.z, vl = Math.hypot(vx, vz) || 1, px = cx + vx / vl * rad, pz = cz + vz / vl * rad;
      var d = Math.hypot(px - ch.x, pz - ch.z); if (d > R || d >= bd) continue;
      if (W3.height(px, pz) < 0.3) continue;
      if (KP.los(th.x, th.y + 1.6, th.z, px, W3.height(px, pz) + 1.2, pz)) continue;
      bd = d; best = { x: px, z: pz };
    }
    return best;
  }

  KP.aiHurt = function (ch, by) {
    var A = ch.ai; if (!A || !enemy(ch, by)) return;
    if (ch.onGround && ch.state === "ground" && !(ch.rollT > 0) && rnd() < A.skill * 0.22) { var ra = Math.atan2(by.x - ch.x, by.z - ch.z) + (rnd() < 0.5 ? 1.57 : -1.57); ch.rollT = 0.55; ch.rollX = Math.sin(ra); ch.rollZ = Math.cos(ra); }
    if (!A.target || !A.see || (A.target !== by && rnd() < 0.6)) { A.target = by; A.reactT = A.react * 0.6; }
    shareTarget(ch, by);
    var canBuild = (A.T.build || (A.skill > 0.6 && rnd() < 0.3)) && A.buildCd <= 0 && ch.wood >= 10 && ch.state === "ground";
    if (canBuild && !(A.cover && dist(ch, A.cover) < 1.5)) {
      var saved = ch.yaw; ch.yaw = Math.atan2(by.x - ch.x, by.z - ch.z);
      if (KP.place(ch, "wall") === "ok") A.buildCd = 3.5 + rnd() * 3 - A.skill * 1.5;
      ch.yaw = saved;
    } else if (A.T.cover && rnd() < A.T.cover * 0.5 && A.coverCd <= 0) { A.cover = findCover(ch, by); A.coverCd = 3; if (A.cover) A.coverUntil = G.time + 2 + rnd() * 2; }
  };
  /* общая цель команды */
  function shareTarget(ch, t) {
    if (ch.team === undefined) return;
    for (var i = 0; i < G.chars.length; i++) {
      var o = G.chars[i];
      if (o === ch || !o.alive || o.team !== ch.team || !o.ai || o.ai.target) continue;
      if (dist(o, ch) < 45) { o.ai.target = t; o.ai.reactT = o.ai.react; }
    }
  }

  function wantItem(ch, it) {
    if (it.noPick > 0 && it.dropper === ch) return false;
    if (it.t === "i") return ch.items[it.id] < KP.ITEMS[it.id].cap;
    var sc = KP.WEAPONS[it.id].score * KP.RAR[it.r].m;
    for (var q = 1; q <= 4; q++) if (ch.slots[q] && ch.slots[q].id === it.id && KP.wScore(ch.slots[q]) >= sc) return false;
    for (var i = 1; i <= 4; i++) if (!ch.slots[i]) return true;
    var worst = 9; for (var j = 1; j <= 4; j++) { var s = KP.wScore(ch.slots[j]); if (s < worst) worst = s; }
    return sc > worst + 0.25;
  }
  /* куда класть оружие: вместо такого же, но хуже; иначе в пустой; иначе вместо худшего */
  function slotFor(ch, it) {
    if (it.t !== "w") return undefined;
    for (var q = 1; q <= 4; q++) if (ch.slots[q] && ch.slots[q].id === it.id) return q;
    for (var i = 1; i <= 4; i++) if (!ch.slots[i]) return i;
    return worstSlot(ch);
  }
  function worstSlot(ch) { var worst = 9, ws = 1; for (var j = 1; j <= 4; j++) { var s = KP.wScore(ch.slots[j]); if (s < worst) { worst = s; ws = j; } } return ws; }
  function leaderOf(ch) {
    if (ch.team === undefined) return null;
    var best = null;
    for (var i = 0; i < G.chars.length; i++) { var o = G.chars[i]; if (o === ch || !o.alive || o.team !== ch.team) continue; if (o.isPlayer) return o; if (!best || o.id < best.id) best = o; }
    return best && best.id < ch.id ? best : null;
  }

  function think(ch) {
    var A = ch.ai, T = A.T, Z = G.zone;
    A.coverCd -= 0.2; A.rampCd -= 0.2;
    // 1. соперник: ближний, с поправкой на ослабленных (добивание)
    var calm = G.time < (G.calmT || 0) && !(ch.lastHitBy && G.time - ch.hitT < 5);
    var best = null, bs = 1e9, lim = calm ? (T.hunt ? 15 : 0) : T.sight;
    for (var i = 0; i < G.chars.length; i++) {
      var o = G.chars[i]; if (!o.alive || (o.state !== "ground" && o.state !== "drive") || !enemy(ch, o)) continue;
      var d = dist(ch, o); if (d > lim) continue;
      var sc = d - (200 - o.hp - o.sh) * 0.08 * A.skill;
      if (sc < bs) { bs = sc; best = o; }
    }
    if (A.target && (!A.target.alive || dist(ch, A.target) > T.sight * 1.3 || !enemy(ch, A.target))) A.target = null;
    var bd = best ? dist(ch, best) : 0;
    if (best && bd > 28 && !T.hunt && !A.target && rnd() > 0.1) best = null;
    if (best && best !== A.target && (!A.target || bd < dist(ch, A.target) * 0.6)) {
      if (KP.los(ch.x, ch.y + 1.6, ch.z, best.x, best.y + 1.2, best.z)) { A.target = best; A.reactT = A.react; shareTarget(ch, best); }
    }
    A.see = A.target ? KP.los(ch.x, ch.y + 1.6, ch.z, A.target.x, A.target.y + 1.2, A.target.z) : false;
    if (A.target && A.see) A.lastSeen = { x: A.target.x, z: A.target.z, t: G.time };
    if (A.target && !A.see && A.lastSeen && G.time - A.lastSeen.t > 4) A.target = null;
    if (!armed(ch) && A.target && dist(ch, A.target) > 5 && !(ch.lastHitBy === A.target && G.time - ch.hitT < 3)) A.target = null;
    if (T.shy && A.target && A.target.lastHitBy !== ch && ch.lastHitBy !== A.target && dist(ch, A.target) > 25) A.target = null;
    // засада хитреца: цель его не видит и не смотрит на него
    A.ambush = false;
    if (T.ambush && A.target && A.see && dist(ch, A.target) > 16 && ch.lastHitBy !== A.target) {
      var tg = A.target, look = Math.atan2(ch.x - tg.x, ch.z - tg.z), dyaw = Math.abs(Math.atan2(Math.sin(look - tg.yaw), Math.cos(look - tg.yaw)));
      A.ambush = dyaw > 1.4 && !(tg.ai && tg.ai.target === ch);
    }
    // 2. зона
    var outNow = Math.hypot(ch.x - Z.cx, ch.z - Z.cz) > Z.r - 3;
    var outNext = Math.hypot(ch.x - Z.tx, ch.z - Z.tz) > Z.tr - 3;
    var hurry = outNow || (outNext && (Z.shrinking || KP.zoneLeft() < 25 || !T.camp));
    A.hurry = hurry; A.outNow = outNow;
    if (hurry && (!A.goal || A.goalKind !== "zone" || !inZoneSoon(A.goal.x, A.goal.z, 2))) {
      var a = Math.atan2(ch.z - Z.tz, ch.x - Z.tx), rr = Z.tr * (0.3 + rnd() * 0.4);
      A.goal = { x: Z.tx + Math.cos(a) * rr, z: Z.tz + Math.sin(a) * rr }; A.goalKind = "zone"; A.cover = null;
    }
    if (ch.state === "drive") return;   // за рулём только цель и зона
    // 3. лечение — по возможности из укрытия или в «коробке» из стен
    A.healWant = (ch.hp < 60 && (ch.items.tube || ch.items.pal)) || (ch.sh < 50 && ch.items.lac);
    if (A.healWant && ch.healT <= 0 && !outNow) {
      var threat = A.target && A.see && dist(ch, A.target) < 40;
      if (!threat) KP.startHeal(ch);
      else if (T.cover && !A.cover && A.coverCd <= 0) { A.cover = findCover(ch, A.target); A.coverCd = 2; A.coverUntil = G.time + 4; }
      else if (A.cover && dist(ch, A.cover) < 1.2) KP.startHeal(ch);
      else if ((T.build || A.skill > 0.7) && ch.wood >= 40 && A.buildCd <= 0) { boxUp(ch); KP.startHeal(ch); A.buildCd = 6; }
    }
    // перезарядка в укрытии
    var cs = ch.cur > 0 ? ch.slots[ch.cur] : null;
    if (A.target && cs && cs.mag === 0 && T.cover && A.coverCd <= 0 && rnd() < T.cover) { A.cover = findCover(ch, A.target); A.coverCd = 2.5; A.coverUntil = G.time + KP.WEAPONS[cs.id].rel + 0.6; }
    if (A.cover && (G.time > A.coverUntil || !A.target)) A.cover = null;
    // 4. оружие
    if (A.target) { var want = bestSlotFor(ch, dist(ch, A.target)); if (want !== ch.cur && ch.swapT <= 0 && ch.reloadT <= 0) KP.equip(ch, want); }
    else if (ch.cur !== 0) { if (cs && cs.mag < KP.WEAPONS[cs.id].mag) KP.reload(ch); }
    // рампа к цели, которая выше (строители и опытные)
    if (A.target && A.see && (T.build || A.skill > 0.65) && A.rampCd <= 0 && ch.wood >= 20 && A.target.y > ch.y + 2.5 && dist(ch, A.target) < 26) {
      var sv = ch.yaw; ch.yaw = Math.atan2(A.target.x - ch.x, A.target.z - ch.z);
      if (KP.place(ch, "ramp") === "ok") { A.rampCd = 1.2; A.climb = G.time + 1.6; }
      ch.yaw = sv;
    }
    if (ch.state === "ground" && !A.target && (A.vehCd || 0) <= G.time) {
      var inWater = W3.height(ch.x, ch.z) < -0.5;
      var far = A.goal && Math.hypot(A.goal.x - ch.x, A.goal.z - ch.z) > 55;
      if (inWater || far) {
        var vh = KP.nearVehicle(ch, inWater ? 30 : 18, !inWater);
        if (vh && (!inWater || vh.T.water)) { A.vehGoal = vh; A.vehCd = G.time + 8; }
      }
    }
    if (A.target && !hurry) return;
    if (hurry) return;
    // 5. командные режимы: к точкам захвата / навстречу соперникам
    var og = KP.objGoal && KP.objGoal(ch);
    if (og) { if (!A.goal || A.goalKind !== "obj" || A.goalT <= 0 || Math.hypot(A.goal.x - ch.x, A.goal.z - ch.z) < 3) { A.goal = og; A.goalKind = "obj"; A.goalT = 6; } A.goalT -= 0.2; return; }
    // 5б. союзник держится рядом с лидером
    var L = T.follow || ch.team !== undefined ? leaderOf(ch) : null;
    if (L && dist(ch, L) > 20) { A.goal = { x: L.x + (rnd() - 0.5) * 8, z: L.z + (rnd() - 0.5) * 8 }; A.goalKind = "follow"; A.goalT = 3; return; }
    // 6. лут, ящики, доски, перемещение
    A.goalT -= 0.2;
    if (A.goal && A.goalKind === "item" && !A.goal.it.alive) A.goal = null;
    if (A.goal && A.goalKind === "chest" && A.goal.c.open) A.goal = null;
    if (A.goal && A.goalKind === "prop" && !A.goal.c.alive) A.goal = null;
    if (A.goal && A.goalKind === "follow") A.goal = null;
    if (!A.goal || A.goalT <= 0 || A.goalKind === "wander") {
      var bi = null, bdi = 30 * T.loot + 6, lr = L ? 25 : 1e9;
      for (var k = 0; k < G.loot.length; k++) {
        var it = G.loot[k]; var di = Math.abs(it.x - ch.x) + Math.abs(it.z - ch.z);
        if (di < bdi && wantItem(ch, it) && inZoneSoon(it.x, it.z, 0) && (!L || dist(it, L) < lr)) { bdi = di; bi = it; }
      }
      var cbest = null, cbd = 35 * T.loot;
      KP.chests.forEach(function (c) { if (c.open) return; var dc = dist(ch, c); if (dc < cbd && (!L || dist(c, L) < lr)) { cbd = dc; cbest = c; } });
      if (cbest && (!bi || cbd < bdi)) { A.goal = { x: cbest.x, z: cbest.z, c: cbest }; A.goalKind = "chest"; A.goalT = 15; }
      else if (bi) { A.goal = { x: bi.x, z: bi.z, it: bi }; A.goalKind = "item"; A.goalT = 12; }
      else if (ch.wood < 40 && rnd() < T.chop * 0.3) {
        var near = W3.query(ch.x - 20, ch.z - 20, ch.x + 20, ch.z + 20), tb = null, td = 99;
        near.forEach(function (c) { if (c.kind === "tree" || c.kind === "crate") { var dc = dist(ch, c); if (dc < td) { td = dc; tb = c; } } });
        if (tb) { A.goal = { x: tb.x, z: tb.z, c: tb }; A.goalKind = "prop"; A.goalT = 10; }
      }
      if ((!A.goal || A.goalT <= 0) && !(T.camp && rnd() < 0.7)) {
        var gx, gz, n = 0, poi = W3.POIS[Math.floor(rnd() * W3.POIS.length)];
        do {
          var aa = rnd() * 6.28, r2 = 10 + rnd() * 25; gx = ch.x + Math.cos(aa) * r2; gz = ch.z + Math.sin(aa) * r2;
          if (!inZoneSoon(gx, gz, 5)) { r2 = Math.sqrt(rnd()) * Math.max(10, Z.tr * 0.7); gx = Z.tx + Math.cos(aa) * r2; gz = Z.tz + Math.sin(aa) * r2; }
          if (rnd() < 0.15 && inZoneSoon(poi.x, poi.z, 5)) { gx = poi.x + (rnd() - 0.5) * 20; gz = poi.z + (rnd() - 0.5) * 20; }
          n++;   // снайпер ищет высоту (условие цикла ниже)
        } while ((W3.height(gx, gz) < 0.5 || (T.still && W3.height(gx, gz) < ch.y + 1)) && n < 6);
        A.goal = { x: gx, z: gz }; A.goalKind = "wander"; A.goalT = 8 + rnd() * 8;
      }
    }
  }
  /* четыре стены вокруг себя */
  function boxUp(ch) {
    var sv = ch.yaw;
    for (var k = 0; k < 4 && ch.wood >= 10; k++) { ch.yaw = k * Math.PI / 2; KP.place(ch, "wall"); }
    ch.yaw = sv;
  }

  function aimAt(ch, o, A) {
    var d = dist(ch, o), w = KP.WEAPONS[ch.slots[ch.cur] ? ch.slots[ch.cur].id : 0];
    var tt = w.spd ? d / w.spd : 0, lead = A.skill * 0.9;
    var tx = o.x + o.mvx * tt * lead, ty = o.y + 1.0, tz = o.z + o.mvz * tt * lead;
    var still = Math.hypot(ch.mvx, ch.mvz) < 0.5;
    var e = A.aimErr * (o.onGround ? 1 : 1.5) * (1 + Math.hypot(o.mvx, o.mvz) / 12) * (still && w.zoom ? 0.55 : 1) * (A.ambushShot ? 0.6 : 1), r = d * Math.tan(e);
    return { x: tx + (rnd() - 0.5) * 2 * r, y: ty + (rnd() - 0.5) * 1.4 * r, z: tz + (rnd() - 0.5) * 2 * r };
  }

  KP.aiThink = think;
  /* один шаг бота на земле */
  function act(ch, dt) {
    var A = ch.ai, T = A.T;
    A.think -= dt; if (A.think <= 0) { A.think = 0.2; think(ch); }
    if (A.vehGoal) {   // бежит к транспорту и садится
      var vg = A.vehGoal;
      if (vg.driver || A.target) A.vehGoal = null;
      else {
        var vx = vg.x - ch.x, vz = vg.z - ch.z, vd = Math.hypot(vx, vz);
        if (vd < vg.rad + 1.4) { A.vehGoal = null; if (KP.enterVehicle(ch, vg)) return; }
        else { ch.mvx = vx / vd * 5.6; ch.mvz = vz / vd * 5.6; ch.yaw = Math.atan2(vx, vz); return; }
      }
    }
    A.buildCd -= dt; A.reactT -= dt;
    var spd = ch.healT > 0 ? 2.5 : 5.6, mx = 0, mz = 0, face = null, fireOk = false;
    var t = A.target;
    if (A.cover && t && t.alive && !A.outNow) {
      // бег в укрытие, стрелять на бегу можно, только если цель видна
      var cx = A.cover.x - ch.x, cz = A.cover.z - ch.z, cd = Math.hypot(cx, cz);
      if (cd > 0.8) { mx = cx / cd; mz = cz / cd; } else if (ch.cur > 0 && ch.slots[ch.cur] && ch.slots[ch.cur].mag < KP.WEAPONS[ch.slots[ch.cur].id].mag) KP.reload(ch);
      face = Math.atan2(t.x - ch.x, t.z - ch.z); fireOk = A.see && cd > 0.8;
    } else if (t && t.alive && !A.outNow && (!A.hurry || dist(ch, t) < 22)) {
      var d = dist(ch, t), dx = (t.x - ch.x) / (d || 1), dz = (t.z - ch.z) / (d || 1);
      face = Math.atan2(t.x - ch.x, t.z - ch.z);
      A.strafeT -= dt;
      if (A.strafeT <= 0) { A.strafeT = 0.8 + rnd() * 1.4; A.strafe = rnd() < 0.5 ? 1 : -1; if (ch.onGround && rnd() < (T.hunt ? 0.35 : 0.12) * (0.5 + A.skill)) ch.vy = 8; }
      var pref = ch.cur === 0 ? 1.5 : (ch.slots[ch.cur] && ch.slots[ch.cur].id === 3 ? 6 : T.pref);
      if (!armed(ch)) pref = T.shy ? 40 : 1.5;
      var app = d > pref + 3 ? 1 : d < pref - 3 ? -1 : 0, strafeK = 0.8;
      if (ch.hp + ch.sh < 45 && A.type !== "rusher" && (A.retreatT || 0) <= 0 && rnd() < 0.02 && (ch.items.tube || ch.items.pal || ch.items.lac || !T.hunt)) { A.retreatT = 3 + rnd() * 3; if (T.cover) { A.cover = findCover(ch, t); A.coverUntil = G.time + 4; } }
      if (A.retreatT > 0) { A.retreatT -= dt; app = -1.4; if (A.retreatT <= 0) { A.target = null; KP.startHeal(ch); } }
      if (A.ambush) { spd = 3.2; app = d > 18 ? 1 : 0; strafeK = 0; }   // подкрадывается, не стреляет
      ch.crouch = false;
      if (T.still && ch.cur > 0 && ch.slots[ch.cur] && KP.WEAPONS[ch.slots[ch.cur].id].zoom && d > 30 && A.see) { app = 0; strafeK = 0; ch.crouch = true; }   // снайпер стоит пригнувшись
      if (A.climb && G.time < A.climb) { app = 1; strafeK = 0; }   // забегает на рампу
      if (!A.see && A.lastSeen) { var lx = A.lastSeen.x - ch.x, lz = A.lastSeen.z - ch.z, ll = Math.hypot(lx, lz) || 1; mx = lx / ll; mz = lz / ll; }
      else { mx = dx * app + (-dz) * A.strafe * strafeK; mz = dz * app + dx * A.strafe * strafeK; }
      fireOk = A.see && !A.ambush && !(A.retreatT > 0);
      if (A.wasAmbush && !A.ambush) A.ambushShot = 3;
      A.wasAmbush = A.ambush;
    } else if (A.goal) {
      if (t && t.alive && A.see) { face = Math.atan2(t.x - ch.x, t.z - ch.z); fireOk = ch.cur !== 0; }
      var gx = A.goal.x - ch.x, gz = A.goal.z - ch.z, gd = Math.hypot(gx, gz);
      if (A.goalKind === "item" && gd < 1.6) { KP.pickup(ch, A.goal.it, slotFor(ch, A.goal.it)); A.goal = null; }
      else if (A.goalKind === "chest" && gd < 1.8) { KP.openChest(A.goal.c, ch); A.goal = null; }
      else if (A.goalKind === "prop" && gd < 2.4) { face = Math.atan2(gx, gz); if (ch.cur !== 0) KP.equip(ch, 0); KP.fire(ch, 0, 0, 0); if (!A.goal.c.alive || ch.wood >= 60) A.goal = null; }
      else if (gd > 1) { mx = gx / gd; mz = gz / gd; if ((A.goalKind === "wander" || A.goalKind === "follow") && gd < 3) A.goal = null; }
    }
    if (T.passive) fireOk = false;
    if (fireOk && t && A.reactT <= 0 && ch.healT <= 0) {
      var d2 = dist(ch, t);
      if (ch.cur === 0) { if (d2 < 2.6) KP.fire(ch, t.x, t.y + 1, t.z); }
      else { var p = aimAt(ch, t, A); ch.aimPt = p; if ((A.type !== "rookie" || rnd() < 0.6) && KP.fire(ch, p.x, p.y, p.z)) { A.shots++; if (A.ambushShot) A.ambushShot--; } }
      // снайпер после нескольких выстрелов меняет позицию
      if (T.still && A.shots >= 3 && A.coverCd <= 0) { A.shots = 0; A.cover = findCover(ch, t); A.coverCd = 6; A.coverUntil = G.time + 2.5; }
    } else if (!t) ch.aimPt = null;
    A.grenCd = (A.grenCd || 0) - dt;
    if (t && t.alive && !A.see && A.lastSeen && G.time - A.lastSeen.t < 3 && ch.items.gren > 0 && A.grenCd <= 0 && A.skill > 0.3 && dist(ch, A.lastSeen) < 26 && dist(ch, A.lastSeen) > 6) {
      ch.thr = "gren"; ch.yaw = Math.atan2(A.lastSeen.x - ch.x, A.lastSeen.z - ch.z); KP.throwItem(ch, A.lastSeen.x, t.y + 0.5, A.lastSeen.z); A.grenCd = 5 + rnd() * 4;
    } else if (A.healWant && t && A.see && ch.items.smoke > 0 && A.grenCd <= 0) { ch.thr = "smoke"; KP.throwItem(ch, ch.x + Math.sin(ch.yaw) * 3, ch.y, ch.z + Math.cos(ch.yaw) * 3); A.grenCd = 8; }
    // авто-подбор рядом
    if (!t || !A.see) {
      for (var k = 0; k < G.loot.length; k++) { var it = G.loot[k]; if (Math.abs(it.x - ch.x) < 1.4 && Math.abs(it.z - ch.z) < 1.4 && wantItem(ch, it)) { KP.pickup(ch, it, slotFor(ch, it)); break; } }
    }
    var ml = Math.hypot(mx, mz);
    if (ml > 0.01) { mx /= ml; mz /= ml; }
    // застревание → прыжок и шаг в сторону
    A.stuckT += dt;
    if (A.stuckT > 0.8) {
      var moved = Math.hypot(ch.x - A.lx, ch.z - A.lz);
      if (ml > 0.1 && moved < 0.8) { if (ch.onGround) ch.vy = 8.5; A.strafe = -A.strafe; A.sideT = 0.7; if (rnd() < 0.3 && (A.goalKind === "wander" || A.goalKind === "follow")) A.goal = null; if (A.cover && rnd() < 0.5) A.cover = null; }
      A.stuckT = 0; A.lx = ch.x; A.lz = ch.z;
    }
    if (A.sideT > 0) { A.sideT -= dt; var sx = -mz * A.strafe, sz = mx * A.strafe; mx = mx * 0.3 + sx; mz = mz * 0.3 + sz; }
    ch.mvx = mx * spd; ch.mvz = mz * spd;
    var fy = face !== null ? face : (ml > 0.1 ? Math.atan2(mx, mz) : ch.yaw);
    var dy = Math.atan2(Math.sin(fy - ch.yaw), Math.cos(fy - ch.yaw));
    ch.yaw += dy * Math.min(1, dt * 10);
  }
  KP.aiAct = act;

  /* высадка: точка и момент прыжка. Союзники игрока прыгают вместе с ним (main.js) */
  KP.aiDropPlan = function (ch, plane, near) {
    var A = ch.ai, tx, tz;
    if (near) { tx = near.x + (rnd() - 0.5) * 14; tz = near.z + (rnd() - 0.5) * 14; }
    else if (rnd() < 0.35) { var p = W3.POIS[Math.floor(rnd() * W3.POIS.length)]; tx = p.x + (rnd() - 0.5) * 30; tz = p.z + (rnd() - 0.5) * 30; }
    else { var n = 0; do { tx = (rnd() * 2 - 1) * 140; tz = (rnd() * 2 - 1) * 140; n++; } while (W3.height(tx, tz) < 1 && n < 10); }
    var dx = plane.bx - plane.ax, dz = plane.bz - plane.az, L2 = dx * dx + dz * dz;
    var t = ((tx - plane.ax) * dx + (tz - plane.az) * dz) / L2;
    A.dropAt = Math.max(0.05, Math.min(0.95, t - 0.08 + rnd() * 0.06)); A.land = { x: tx, z: tz };
  };
})(window.KP);
