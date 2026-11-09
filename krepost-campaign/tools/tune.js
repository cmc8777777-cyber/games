/* tools/tune.js — помощники балансировки для консоли (не для игроков). Подключать вручную:
   (0,eval)(await fetch('tools/tune.js').then(r=>r.text()))
   __tune3(id, [{hpK,hpG,bossK}, ...]) — пять стратегий для каждого набора; __diag(id, bal, strat) — стены по волнам и кто прорвался. */
window.__S = [{mix:'strong'},{mix:'strong',quiz:'wrong',events:'wrong'},{mix:'ranged'},{mix:'main',upgrades:false},{mix:'two',maxTowers:2}];
window.__tune3 = function(id, sets){
  const b = __sim.BATTLES[id], keep = b.balance, rows = [];
  for (const o of sets){ b.balance = Object.assign({}, keep || {}, o);
    rows.push(JSON.stringify(o)+': '+__S.map(s => { const r = __sim.run(id, s); return r.win ? 'W'+r.lives : 'L'+r.wave; }).join(' ')); }
  b.balance = keep; return id+' [strong wrong ranged main two]\n'+rows.join('\n');
};
window.__diag = function(id, bal, strat){
  const b = __sim.BATTLES[id], keep = b.balance; if (bal) b.balance = Object.assign({}, keep || {}, bal);
  const r = __sim.run(id, strat || {mix:'strong'}); b.balance = keep;
  return (r.win ? 'W'+r.lives : 'L'+r.wave)+' | '+r.perWave.map(p => p.lives).join(' ')+' | прорвались: '+JSON.stringify(r.leaks);
};
