/* tools/autoplay.js — автоигрок для балансировки (не для игроков).
   Работает и с движком кампании (window.__sim), и с v4 (window.__game): одинаковые имена функций.
   window.KREPOST_AUTOPLAY(api, strat) → {win, lives, wave, coins, quiz, perWave:[{w,lives,coins,towers}], ms}
   strat: {mix:'strong'|'ranged'|'main'|'two'|'cheap', upgrades:true, maxTowers:24, quiz:'right'|'wrong'|'skip', events:'right'|'wrong', abilities:true, dt:1/30} */
window.KREPOST_AUTOPLAY = function(api, strat){
  'use strict';
  const st = Object.assign({mix:'strong', upgrades:true, maxTowers:24, quiz:'right', events:'right', abilities:true, dt:1/30}, strat || {});
  const t0 = Date.now();
  if (api.manual) api.manual(true);
  api.startGame();
  const G = api.G, defs = api.TOWERS, PADS = api.PADS, PATH = api.PATH;
  const ids = Object.keys(defs);
  // роли по цене и параметрам (как в эталоне шкалы)
  const fighters = ids.filter(k => (defs[k].dmg || 0) > 0);
  const byCost = fighters.slice().sort((a,b) => defs[a].cost - defs[b].cost);
  const siege = fighters.filter(k => (defs[k].splash || 0) > 0).sort((a,b) => defs[b].cost - defs[a].cost)[0] || byCost[byCost.length-1];
  const rest = fighters.filter(k => k !== siege);
  const ranged = rest.slice().sort((a,b) => defs[b].range - defs[a].range)[0];
  const cheap = rest.filter(k => k !== ranged).sort((a,b) => defs[a].cost - defs[b].cost)[0] || ranged;
  const heavy = rest.filter(k => k !== ranged && k !== cheap).sort((a,b) => (defs[b].dmg/defs[b].cd) - (defs[a].dmg/defs[a].cd))[0] || cheap;
  const main = rest.filter(k => k !== ranged && k !== cheap && k !== heavy).sort((a,b) => Math.abs(defs[a].cost-80) - Math.abs(defs[b].cost-80))[0] || heavy;
  const support = ids.filter(k => !((defs[k].dmg || 0) > 0))[0] || null;
  const roles = {main, cheap, heavy, ranged, siege, support};
  const cycle = st.mix === 'ranged' ? [ranged] : st.mix === 'main' ? [main] : st.mix === 'cheap' ? [cheap]
    : st.mix === 'two' ? [main, heavy]
    : [main, cheap, ranged, heavy, siege].concat(support ? [support] : []).concat([main, siege, heavy, ranged, cheap, main]);
  // площадки: сначала те, откуда видно больше дороги
  const samples = []; for (let i=0;i<PATH.length-1;i++){ const [x1,y1]=PATH[i],[x2,y2]=PATH[i+1], l=Math.hypot(x2-x1,y2-y1), n=Math.max(1,Math.round(l/10)); for (let k=0;k<n;k++) samples.push([x1+(x2-x1)*k/n, y1+(y2-y1)*k/n]); }
  const cover = p => samples.filter(([x,y]) => (x-p[0])**2 + (y-p[1])**2 < 100*100).length;
  const order = PADS.map((p,i) => ({i, c:cover(p)})).sort((a,b) => b.c - a.c).map(o => o.i);
  let ci = 0, supportN = 0;
  const towerCount = () => G.towers.filter(Boolean).length;
  function spend(){
    for (let guard=0; guard<60; guard++){
      let type = cycle[ci % cycle.length];
      if (type === support && supportN >= 2) { ci++; type = cycle[ci % cycle.length]; }
      const pad = order.find(i => !G.towers[i]);
      if (type && pad !== undefined && towerCount() < st.maxTowers && G.coins >= defs[type].cost) {
        if (api.build(pad, type)) { ci++; if (type === support) supportN++; continue; }
      }
      if (st.upgrades) {
        let best = -1, bc = 1e9;
        G.towers.forEach((t,i) => { if (!t || t.lvl >= 3 || !((defs[t.type].dmg||0) > 0)) return; const c = api.upgradeCost(t); if (c <= G.coins && c < bc) { bc = c; best = i; } });
        const wantBuild = type && pad !== undefined && towerCount() < st.maxTowers;
        if (best >= 0 && (!wantBuild || G.coins - bc >= 0 && towerCount() >= 6)) { api.upgrade(best); continue; }
      }
      break;
    }
  }
  function answer(){
    const n = G.wave + 1, q = api.quizFor(n);
    if (q && G.quiz[n] === undefined) api.answerQuiz(st.quiz === 'wrong' ? (q.answer+1) % q.options.length : st.quiz === 'skip' ? -1 : q.answer);
    const e = api.eventAfter(G.wave);
    if (e && G.events[e.afterWave] === undefined) { const c = e.options.findIndex(o => o.correct); api.chooseEvent(st.events === 'wrong' ? (c+1) % e.options.length : c); }
    if (api.closeEvent) api.closeEvent();
  }
  const perWave = [];
  let steps = 0;
  while (G.state === 'intermission' || G.state === 'wave') {
    if (G.state === 'intermission') { answer(); spend(); api.startWave(); }
    let tAcc = 0;
    while (G.state === 'wave') {
      api.update(st.dt); tAcc += st.dt;
      if (st.abilities && tAcc >= 1) { tAcc = 0;
        const crowd = G.enemies.length >= 10 || G.enemies.some(e => e.def.boss);
        if (crowd) for (const k in G.abil) if (G.abil[k].cd <= 0) api.useAbility(k);
      }
      if (++steps > 3e6) break;
    }
    perWave.push({w:G.wave, lives:G.lives, coins:G.coins, towers:towerCount()});
    if (steps > 3e6) break;
  }
  if (api.manual) api.manual(false);
  let quizN = 0; for (const k in G.quiz) { const q = api.quizFor(+k); if (q && G.quiz[k] === q.answer) quizN++; }
  return {win: G.state === 'won', lives: G.lives, wave: G.wave, coins: G.coins, quiz: quizN, roles, perWave, leaks: Object.assign({}, G.leaks || {}), ms: Date.now() - t0};
};
