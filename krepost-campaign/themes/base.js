/* =====================================================================
   themes/base.js — реестр отрисовки ландшафта и крепостей кампании «Крепость».
   Загружается ПЕРВЫМ, до битв и до движка.

   ИНТЕРФЕЙС (зафиксирован; другие файлы themes/<style>.js только ДОБАВЛЯЮТ функции):

   window.THEMES = {
     fortress: { [style]: function(ctx, W, yTop, battle) },
         Рисует крепость внизу поля в МИРОВЫХ координатах (поле 390×1700).
         Слой крепости — полоса y ∈ [yTop, yTop+160] (yTop = 1540), рисуется поверх врагов,
         поэтому выше зубцов слой должен оставаться прозрачным.
         Требования: верх зубцов стены ≈ yTop+40…50; ворота по центру x = W/2, арка ворот
         ≈ yTop+60…yTop+160 (враги уходят в ворота при y≈1640); стена закрывает всю ширину до низа слоя.
         Надписи: battle.fortress.name — на табличке, battle.fortress.banner (1–4 символа) — на штандарте над воротами.
     skyline:  { [kind]:  function(ctx, W, H, battle) },
         Верхний фон «откуда идут враги»: рисует поверх земли полосу y ∈ [−4, ≈120] и плавно
         сводит её в землю. Цвет неба — battle.theme.palette.sky. kind ∈ alps|mountains|desert|sea|forest|steppe|none.
     decor:    { [type]:  function(ctx, x, y, rnd) },
         Один элемент декора; (x, y) — точка, где предмет стоит на земле (низ по центру).
         Обычные предметы укладываются в ~30×40; «площадные» (vineyard, field) — в ~56×56 с центром в (x, y).
         rnd() — детерминированный генератор 0..1.
     ground:   { [kind]:  function(ctx, W, H, palette, rnd) },
         Заливка всего поля 0..H по x ∈ [−4, W+4] + пятна/фактура в палитре palette (ground, groundDark, …).
     decorSize:{ [type]: радиус «занятого места» для расстановки (по умолчанию 11) },
     portrait: { [id]: function(g) } — НЕОБЯЗАТЕЛЬНО: свой портрет-медальон (центр 0,0, радиус 60);
     util:     общие примитивы рисования (E, P, Ln, RR, limb, curve, spear, head, eye, star, shadeOf, mix, rng, signpost, INK, TAU, FONT_D, FONT_C)
   };

   Регистрация из своего файла:  THEMES.fortress.greek = function(ctx, W, yTop, battle){ ... };
   Если стиля/вида нет в реестре, движок берёт fortress.roman / skyline.mountains / ground.grass и не падает.
   Стиль — «детская книжка»: плоские цвета, тёмный контур THEMES.util.INK, мягкие тени rgba(50,40,14,.25).
   ===================================================================== */
(function(){
'use strict';
const INK = '#3a2616', TAU = Math.PI*2;
const FONT_D = '"Cinzel","Forum","Palatino Linotype",Georgia,serif', FONT_C = '"Forum","Cinzel","Palatino Linotype",Georgia,serif';
function E(g,x,y,rx,ry,f,s,lw,rot){ g.beginPath(); g.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),rot||0,0,TAU); if(f){g.fillStyle=f;g.fill();} if(s){g.strokeStyle=s;g.lineWidth=lw||1;g.stroke();} }
function P(g,p,f,s,lw){ g.beginPath(); g.moveTo(p[0],p[1]); for(let i=2;i<p.length;i+=2) g.lineTo(p[i],p[i+1]); g.closePath(); if(f){g.fillStyle=f;g.fill();} if(s){g.strokeStyle=s;g.lineWidth=lw||1;g.lineJoin='round';g.stroke();} }
function Ln(g,x1,y1,x2,y2,c,lw){ g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.strokeStyle=c; g.lineWidth=lw; g.lineCap='round'; g.stroke(); }
function RR(g,x,y,w,h,r,f,s,lw){ r=Math.max(0,Math.min(r,Math.abs(w)/2,Math.abs(h)/2)); g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); if(f){g.fillStyle=f;g.fill();} if(s){g.strokeStyle=s;g.lineWidth=lw||1;g.stroke();} }
function limb(g,x1,y1,x2,y2,c,w){ Ln(g,x1,y1,x2,y2,INK,w+1.5); Ln(g,x1,y1,x2,y2,c,w); }
function curve(g,pts,c,w,outline){ const draw=(col,lw)=>{ g.beginPath(); g.moveTo(pts[0],pts[1]); for(let i=2;i<pts.length;i+=4) g.quadraticCurveTo(pts[i],pts[i+1],pts[i+2],pts[i+3]); g.strokeStyle=col; g.lineWidth=lw; g.lineCap='round'; g.lineJoin='round'; g.stroke(); }; if(outline!==false) draw(INK,w+1.5); draw(c,w); }
function spear(g,x1,y1,x2,y2,col,tl,tc,lw){
  lw = lw||1.3; Ln(g,x1,y1,x2,y2,INK,lw+1.2); Ln(g,x1,y1,x2,y2,col,lw);
  const dx=x2-x1, dy=y2-y1, l=Math.hypot(dx,dy)||1, ux=dx/l, uy=dy/l, bx=x2-ux*tl, by=y2-uy*tl, hw=1.5;
  P(g,[x2+ux*1.2,y2+uy*1.2,bx-uy*hw,by+ux*hw,bx+uy*hw,by-ux*hw],tc||'#b9bec4',INK,.7);
}
function eye(g,x,y){ E(g,x,y,.8,.95,INK); }
function head(g,x,y,r,skin){ E(g,x,y,r,r,skin,INK,1); E(g,x+r*.95,y+.6,1.1,1.2,skin,INK,.6); E(g,x+r*.95-.4,y+.6,1,1.1,skin); eye(g,x+r*.42,y-.6); }
function star(g,x,y,r,f){ g.beginPath(); for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, rr=i%2?r*.45:r; g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);} g.closePath(); g.fillStyle=f; g.fill(); g.strokeStyle=INK; g.lineWidth=.8; g.stroke(); }
function hex(c){ c = String(c||'#888').trim(); if (c[0] !== '#') return [136,136,136]; if (c.length === 4) c = '#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3]; const n = parseInt(c.slice(1,7),16); return isNaN(n) ? [136,136,136] : [n>>16,(n>>8)&255,n&255]; }
function toHex(r,g,b){ const f=v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0'); return '#'+f(r)+f(g)+f(b); }
function shadeOf(c,k){ const [r,g,b] = hex(c); k = k == null ? .76 : k; return toHex(r*k,g*k,b*k); }
function mix(a,b,t){ const A=hex(a), B=hex(b); return toHex(A[0]+(B[0]-A[0])*t, A[1]+(B[1]-A[1])*t, A[2]+(B[2]-A[2])*t); }
function rgba(c,a){ const [r,g,b] = hex(c); return 'rgba('+r+','+g+','+b+','+a+')'; }
function rng(seed){ let s = seed>>>0; return () => { s = (s*1664525 + 1013904223)>>>0; return s/4294967296; }; }
function seedOf(str){ let h = 2166136261; str = String(str||''); for (let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h,16777619); } return h>>>0; }
function signpost(g,x,y,text,dir,size){
  // деревянный указатель со стрелкой; dir = 1 вправо, −1 влево; (x,y) — центр доски
  const fs = size || 10; g.font='bold '+fs+'px '+FONT_C; const tw = g.measureText(text).width, bw = tw + 12, bh = fs + 8;
  const L = x - bw/2, R = x + bw/2, T = y - bh/2, B = y + bh/2;
  Ln(g,x,B-2,x,B+14,INK,3.4); Ln(g,x,B-2,x,B+14,'#8a5a2b',2.2); E(g,x+2,B+14,5,1.6,'rgba(50,40,14,.3)');
  const pts = dir > 0 ? [L,T,R,T,R+6,y,R,B,L,B] : dir < 0 ? [R,T,L,T,L-6,y,L,B,R,B] : [L,T,R,T,R,B,L,B];
  P(g,pts,'#b9834a',INK,1); Ln(g,L+1,T+4.5,R-1,T+4.5,'rgba(90,55,25,.35)',.6); Ln(g,L+1,B-4.5,R-1,B-4.5,'rgba(90,55,25,.35)',.6);
  g.fillStyle='#2f1e10'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(text,x+(dir>0?-1:dir<0?1:0),y+.4);
}
const util = {E,P,Ln,RR,limb,curve,spear,eye,head,star,shadeOf,mix,rgba,hex,rng,seedOf,signpost,INK,TAU,FONT_D,FONT_C};

const THEMES = window.THEMES = window.THEMES || {};
THEMES.fortress = THEMES.fortress || {};
THEMES.skyline = THEMES.skyline || {};
THEMES.decor = THEMES.decor || {};
THEMES.ground = THEMES.ground || {};
THEMES.decorSize = THEMES.decorSize || {};
THEMES.portrait = THEMES.portrait || {};
THEMES.util = util;

/* ---------------- ground ---------------- */
function dapple(g,W,H,R,light,dark,n,y0,y1){
  for (let i=0;i<n;i++){
    const x=-4+R()*(W+8), y=y0+R()*(y1-y0), r=16+R()*44, l=R()<.5;
    const b=g.createRadialGradient(x,y,0,x,y,r), c = l ? light : dark;
    b.addColorStop(0,c); b.addColorStop(1,c.replace(/[\d.]+\)$/,'0)'));
    g.fillStyle=b; g.fillRect(x-r,y-r,r*2,r*2);
  }
}
function hills(g,W,H,R,base,n){
  for (let i=0;i<n;i++){
    const left = R()<.5, x = left ? 10+R()*40 : W-10-R()*40, y = 120+R()*(H-320), rx=40+R()*24, ry=16+R()*14;
    const h=g.createLinearGradient(x-rx*.4,y-ry,x+rx*.3,y+ry);
    h.addColorStop(0,rgba(mix(base,'#fff6c0',.35),.6)); h.addColorStop(.6,rgba(base,.3)); h.addColorStop(1,rgba(shadeOf(base,.8),.35));
    E(g,x,y,rx,ry,h); E(g,x+rx*.18,y+ry*.45,rx*.75,ry*.4,'rgba(60,80,30,.12)');
  }
}
THEMES.ground.grass = function(g,W,H,pal,R){
  const c = pal.ground || '#a6bd62', d = pal.groundDark || shadeOf(c,.85);
  const gr = g.createLinearGradient(0,30,0,H);
  gr.addColorStop(0,mix(c,'#f4f0b0',.18)); gr.addColorStop(.4,c); gr.addColorStop(.75,mix(c,d,.35)); gr.addColorStop(.92,mix(c,'#b39a64',.45)); gr.addColorStop(1,mix(c,'#bf9a62',.7));
  g.fillStyle=gr; g.fillRect(-4,-4,W+8,H+8);
  for (let i=0;i<14;i++){ const x=-4+R()*(W+8), y=H-260+R()*140, r=30+R()*40; const b=g.createRadialGradient(x,y,0,x,y,r); b.addColorStop(0,'rgba(196,120,74,.25)'); b.addColorStop(1,'rgba(196,120,74,0)'); g.fillStyle=b; g.fillRect(x-r,y-r,r*2,r*2); }
  dapple(g,W,H,R,'rgba(240,236,170,.30)',rgba(shadeOf(d,.8),.22),260,40,H-140);
  hills(g,W,H,R,c,16);
};
THEMES.ground.steppe = function(g,W,H,pal,R){
  const c = pal.ground || '#c9c27a', d = pal.groundDark || shadeOf(c,.85);
  const gr = g.createLinearGradient(0,0,0,H); gr.addColorStop(0,mix(c,'#f6eec0',.2)); gr.addColorStop(.6,c); gr.addColorStop(1,mix(c,d,.5));
  g.fillStyle=gr; g.fillRect(-4,-4,W+8,H+8);
  dapple(g,W,H,R,'rgba(250,240,190,.28)',rgba(d,.25),200,40,H-140);
  for (let i=0;i<520;i++){ const x=-4+R()*(W+8), y=40+R()*(H-180), h=3+R()*4, col = R()<.5 ? rgba(shadeOf(d,.85),.55) : 'rgba(240,226,160,.6)';
    Ln(g,x,y,x-1.2,y-h,col,.8); Ln(g,x,y,x+1.4,y-h*.8,col,.8); }
};
THEMES.ground.sand = function(g,W,H,pal,R){
  const c = pal.ground || '#e2c88a', d = pal.groundDark || shadeOf(c,.86);
  const gr = g.createLinearGradient(0,0,0,H); gr.addColorStop(0,mix(c,'#fff4d0',.25)); gr.addColorStop(1,mix(c,d,.4));
  g.fillStyle=gr; g.fillRect(-4,-4,W+8,H+8);
  dapple(g,W,H,R,'rgba(255,246,210,.35)',rgba(d,.28),160,40,H-140);
  for (let i=0;i<90;i++){ const x=-20+R()*(W+20), y=50+R()*(H-200), w=30+R()*50;
    g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+w/2,y-5-R()*4,x+w,y); g.strokeStyle=rgba(shadeOf(d,.8),.35); g.lineWidth=1.1; g.stroke();
    g.beginPath(); g.moveTo(x+2,y-1.5); g.quadraticCurveTo(x+w/2,y-6.5,x+w-2,y-1.5); g.strokeStyle='rgba(255,250,225,.4)'; g.lineWidth=.8; g.stroke(); }
};
THEMES.ground.dirt = function(g,W,H,pal,R){
  const c = pal.ground || '#b59a6a', d = pal.groundDark || shadeOf(c,.85);
  const gr = g.createLinearGradient(0,0,0,H); gr.addColorStop(0,mix(c,'#efe0b8',.18)); gr.addColorStop(1,mix(c,d,.45));
  g.fillStyle=gr; g.fillRect(-4,-4,W+8,H+8);
  dapple(g,W,H,R,'rgba(245,230,190,.28)',rgba(shadeOf(d,.85),.26),240,40,H-140);
  for (let i=0;i<260;i++){ const x=-4+R()*(W+8), y=40+R()*(H-180), s=.8+R()*1.6; E(g,x,y,s,s*.7,R()<.5?rgba(shadeOf(d,.7),.55):'rgba(235,225,200,.6)'); }
  for (let i=0;i<120;i++){ const x=-4+R()*(W+8), y=40+R()*(H-180); for (let k=-1;k<=1;k++) Ln(g,x,y,x+k*1.6,y-3-R()*2,'rgba(110,130,60,.55)',.8); }
};
THEMES.ground.snow = function(g,W,H,pal,R){
  const c = pal.ground || '#eef3f7', d = pal.groundDark || '#c9d6e2';
  const gr = g.createLinearGradient(0,0,0,H); gr.addColorStop(0,mix(c,'#ffffff',.4)); gr.addColorStop(1,mix(c,d,.35));
  g.fillStyle=gr; g.fillRect(-4,-4,W+8,H+8);
  dapple(g,W,H,R,'rgba(255,255,255,.55)',rgba(d,.35),220,40,H-140);
  for (let i=0;i<60;i++){ const x=-20+R()*(W+20), y=50+R()*(H-200), w=26+R()*40; g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+w/2,y-4,x+w,y); g.strokeStyle=rgba(shadeOf(d,.85),.35); g.lineWidth=1.2; g.stroke(); }
  for (let i=0;i<200;i++){ const x=-4+R()*(W+8), y=40+R()*(H-180); E(g,x,y,.7,.7,'rgba(255,255,255,.95)'); }
};
THEMES.ground.ice = function(g,W,H,pal,R){
  const c = pal.ground || '#d6ecf4', d = pal.groundDark || '#a9cfe0';
  const gr = g.createLinearGradient(0,0,0,H); gr.addColorStop(0,mix(c,'#ffffff',.35)); gr.addColorStop(1,mix(c,d,.4));
  g.fillStyle=gr; g.fillRect(-4,-4,W+8,H+8);
  dapple(g,W,H,R,'rgba(255,255,255,.45)',rgba(d,.35),160,40,H-140);
  for (let i=0;i<70;i++){ let x=-4+R()*(W+8), y=40+R()*(H-180); g.beginPath(); g.moveTo(x,y);
    for (let k=0;k<4;k++){ x += (R()-.5)*30; y += (R()-.3)*16; g.lineTo(x,y); } g.strokeStyle=rgba(shadeOf(d,.7),.45); g.lineWidth=.8; g.stroke(); }
  for (let i=0;i<40;i++){ const x=-4+R()*(W+8), y=40+R()*(H-180), r=10+R()*22; E(g,x,y,r,r*.4,'rgba(255,255,255,.55)'); }
};

/* ---------------- skyline ---------------- */
function skyBand(g,W,battle,to){
  const sky = (battle && battle.theme && battle.theme.palette && battle.theme.palette.sky) || '#cfe3f0';
  const gr = g.createLinearGradient(0,-4,0,to); gr.addColorStop(0,mix(sky,'#a9c8e2',.35)); gr.addColorStop(1,mix(sky,'#f2f2e2',.5));
  g.fillStyle = gr; g.fillRect(-4,-4,W+8,to+4);
}
function groundCol(battle){ return (battle && battle.theme && battle.theme.palette && battle.theme.palette.ground) || '#a6bd62'; }
function fadeToGround(g,W,battle,y0,y1,col){
  const gr = g.createLinearGradient(0,y0,0,y1); gr.addColorStop(0,rgba(col,.9)); gr.addColorStop(1,rgba(groundCol(battle),0));
  g.fillStyle = gr; g.fillRect(-4,y0,W+8,y1-y0);
}
function peaks(g,W,layers){
  for (const L of layers){
    const r = rng(L.seed), pts = [-14, L.base+12]; let x = -14; const pk = [];
    while (x < W+34){ const px = x + L.step[0]*.5 + r()*L.step[1]*.5, py = L.top[0] + r()*(L.top[1]-L.top[0]); pts.push(px,py); pk.push([px,py]); x = px + L.step[0]*.5 + r()*L.step[1]*.5; pts.push(x, L.base - r()*6); }
    pts.push(W+44, L.base+12);
    P(g,pts,L.col);
    if (L.snow) for (const [px,py] of pk){ const d=(L.base-py)*.38; P(g,[px,py, px+d*.75,py+d, px+d*.3,py+d*.78, px,py+d*1.05, px-d*.35,py+d*.8, px-d*.8,py+d],L.snow); P(g,[px,py,px+d*.75,py+d,px+d*.3,py+d*.78],'rgba(150,175,205,.35)'); }
    else if (L.trees) for (const [px,py] of pk){ for (let k=0;k<3;k++){ const tx=px-6+k*5+r()*3, ty=py+6+r()*6; P(g,[tx,ty-6,tx+2.6,ty+1.5,tx-2.6,ty+1.5],L.trees); } }
    const hz = g.createLinearGradient(0,L.base-14,0,L.base+10); hz.addColorStop(0,'rgba(236,242,236,0)'); hz.addColorStop(1,'rgba(236,242,236,.45)');
    g.fillStyle = hz; g.fillRect(-4,L.base-14,W+8,24);
  }
}
THEMES.skyline.alps = function(g,W,H,battle){
  skyBand(g,W,battle,46);
  peaks(g,W,[
    {base:30, top:[1,9], col:'#c3d1e2', snow:'#f7fafc', step:[22,34], seed:3},
    {base:38, top:[8,18], col:'#98abc4', snow:'#f2f6fa', step:[26,40], seed:5},
    {base:46, top:[22,33], col:'#7f9488', snow:null, trees:'#56705a', step:[18,30], seed:9}
  ]);
  fadeToGround(g,W,battle,40,64,'#7f9488');
};
THEMES.skyline.mountains = function(g,W,H,battle){
  skyBand(g,W,battle,52);
  const gc = groundCol(battle);
  peaks(g,W,[
    {base:34, top:[4,14], col:'#b8c4cf', snow:'#eef3f7', step:[30,40], seed:13},
    {base:44, top:[14,26], col:mix('#8e9c8a',gc,.25), snow:null, trees:null, step:[26,36], seed:17},
    {base:54, top:[28,40], col:mix('#6f8a5c',gc,.45), snow:null, trees:shadeOf(mix('#6f8a5c',gc,.45),.75), step:[18,30], seed:19}
  ]);
  fadeToGround(g,W,battle,48,74,mix('#6f8a5c',gc,.45));
};
THEMES.skyline.desert = function(g,W,H,battle){
  skyBand(g,W,battle,50);
  E(g,W*.78,18,10,10,'#fff2c0','rgba(255,220,140,.6)',2);
  const gc = groundCol(battle);
  for (const [base,col,seed] of [[36,mix('#e8cf98',gc,.2),21],[48,mix('#d9b878',gc,.45),23],[58,mix('#cfa868',gc,.6),29]]){
    const r = rng(seed); g.beginPath(); g.moveTo(-10,base+16); let x=-10;
    while (x < W+20){ const w = 50+r()*70, h = 8+r()*12; g.quadraticCurveTo(x+w*.4,base-h,x+w,base-r()*3); x += w; }
    g.lineTo(W+20,base+16); g.closePath(); g.fillStyle=col; g.fill();
  }
  fadeToGround(g,W,battle,52,78,mix('#cfa868',gc,.6));
};
THEMES.skyline.sea = function(g,W,H,battle){
  skyBand(g,W,battle,26);
  const wc = (battle && battle.theme && battle.theme.palette && battle.theme.palette.water) || '#4f9fd0';
  const gr = g.createLinearGradient(0,22,0,62); gr.addColorStop(0,mix(wc,'#cfe6f3',.4)); gr.addColorStop(1,wc);
  g.fillStyle = gr; g.fillRect(-4,22,W+8,40);
  const r = rng(31);
  for (let i=0;i<40;i++){ const x=r()*W, y=26+r()*32; Ln(g,x,y,x+5+r()*5,y,'rgba(255,255,255,.6)',.9); }
  for (const [x,y,s] of [[W*.2,36,1],[W*.62,30,.75],[W*.84,44,.9]]){
    P(g,[x-10*s,y,x+12*s,y,x+8*s,y+4*s,x-7*s,y+4*s],'#7a4a24',INK,.7);
    Ln(g,x,y,x,y-14*s,INK,1); P(g,[x+.5,y-13*s,x+8*s,y-3*s,x+.5,y-2*s],'#f3ead6',INK,.6);
  }
  // берег
  const gc = groundCol(battle); g.beginPath(); g.moveTo(-10,70); const rr = rng(33); let x=-10;
  while (x < W+20){ const w = 30+rr()*40; g.quadraticCurveTo(x+w/2,58+rr()*6,x+w,62+rr()*5); x += w; }
  g.lineTo(W+20,80); g.lineTo(-10,80); g.closePath(); g.fillStyle=mix('#e6d6a6',gc,.25); g.fill();
  g.strokeStyle='rgba(255,255,255,.7)'; g.lineWidth=1.2; g.stroke();
  fadeToGround(g,W,battle,72,92,mix('#e6d6a6',gc,.25));
};
THEMES.skyline.forest = function(g,W,H,battle){
  skyBand(g,W,battle,40);
  const gc = groundCol(battle);
  for (const [base,col,seed,s] of [[34,'#6f8d84',41,.8],[48,'#4c6e52',43,1],[62,'#355a3d',47,1.15]]){
    const r = rng(seed); g.fillStyle=col; g.fillRect(-4,base,W+8,20);
    for (let x=-8; x<W+10; x+=6+r()*5){ const h=(14+r()*12)*s; P(g,[x,base-h,x+5*s,base+2,x-5*s,base+2],col); }
  }
  fadeToGround(g,W,battle,66,90,'#355a3d');
};
THEMES.skyline.steppe = function(g,W,H,battle){
  skyBand(g,W,battle,40);
  const gc = groundCol(battle);
  const r = rng(51); g.beginPath(); g.moveTo(-10,46); let x=-10;
  while (x < W+20){ const w=60+r()*80; g.quadraticCurveTo(x+w/2,34+r()*8,x+w,40+r()*6); x+=w; }
  g.lineTo(W+20,70); g.lineTo(-10,70); g.closePath(); g.fillStyle=mix('#b8b47a',gc,.4); g.fill();
  E(g,W*.3,44,22,8,mix('#a8a46a',gc,.5)); E(g,W*.72,42,16,6,mix('#a8a46a',gc,.5));   // курганы
  for (let i=0;i<5;i++){ const bx=W*.15+i*W*.17, by=30+r()*6; g.strokeStyle='rgba(60,50,40,.5)'; g.lineWidth=.8; g.beginPath(); g.moveTo(bx-3,by); g.lineTo(bx,by-2); g.lineTo(bx+3,by); g.stroke(); }
  fadeToGround(g,W,battle,50,80,mix('#b8b47a',gc,.4));
};
THEMES.skyline.none = function(){};

/* ---------------- decor ---------------- */
const D = THEMES.decor;
function shadow(g,x,y,w,h){ E(g,x+3,y,w,h,'rgba(50,40,14,.26)',null,0,-.12); }
D.cypress = function(g,x,y,R){
  const s = .85+R()*.35, h=24*s, w=4.4*s;
  E(g,x+4,y,6*s,2*s,'rgba(50,40,14,.28)',null,0,-.15);
  g.beginPath(); g.moveTo(x,y-h); g.quadraticCurveTo(x+w*1.35,y-h*.45,x+w*.55,y); g.lineTo(x-w*.55,y); g.quadraticCurveTo(x-w*1.35,y-h*.45,x,y-h); g.closePath();
  g.fillStyle='#2f5833'; g.fill(); g.strokeStyle='rgba(30,40,20,.7)'; g.lineWidth=.7; g.stroke();
  g.beginPath(); g.moveTo(x-.4,y-h+2); g.quadraticCurveTo(x-w*1.1,y-h*.45,x-w*.35,y-1.5); g.quadraticCurveTo(x-w*.35,y-h*.5,x-.4,y-h+2); g.fillStyle='#4f8447'; g.fill();
  Ln(g,x,y,x,y+1.2,'#5a3a1a',1.2);
};
D.olive = function(g,x,y,R){
  const s = .85+R()*.35, r=6.2*s, cy=y-6.5*s;
  E(g,x+3,y,r*1.1,r*.38,'rgba(50,40,14,.25)');
  limb(g,x,y,x+.6,cy+2,'#6b5338',1.4);
  E(g,x+r*.45,cy+r*.25,r*.75,r*.62,'#6f8452'); E(g,x-r*.45,cy+r*.2,r*.7,r*.6,'#7f9461'); E(g,x,cy-r*.25,r*.8,r*.66,'#8fa26c');
  E(g,x-r*.3,cy-r*.45,r*.38,r*.28,'#b3c08f'); E(g,x+r*.4,cy-r*.05,r*.22,r*.18,'#a7b884');
};
D.pine = function(g,x,y,R){   // пиния — «зонтик»
  const s = .9+R()*.35;
  shadow(g,x,y,9*s,2.6*s);
  limb(g,x,y,x+1,y-14*s,'#7a5232',1.6*s); Ln(g,x+.5,y-11*s,x-4*s,y-15*s,'#7a5232',1.1);
  E(g,x,y-17*s,11*s,5*s,'#3f6b3a',INK,.7); E(g,x-2*s,y-18.5*s,7*s,2.6*s,'#5c8a4c'); E(g,x+4*s,y-17.6*s,3*s,1.5*s,'#6f9b58');
};
D.birch = function(g,x,y,R){
  const s = .9+R()*.3;
  shadow(g,x,y,6*s,2*s);
  RR(g,x-1.3*s,y-20*s,2.6*s,20*s,1,'#f2efe6',INK,.6);
  for (let i=0;i<4;i++) Ln(g,x-1*s,y-4*s-i*4.4*s,x+.6*s,y-4.4*s-i*4.4*s,'#2e2a26',.9);
  E(g,x,y-22*s,6.4*s,8*s,'#8fbf5a',INK,.6); E(g,x-2.4*s,y-24*s,3*s,3.6*s,'#b3d878'); E(g,x+2.6*s,y-19*s,2.4*s,2.8*s,'#7aa84a');
};
D.spruce = function(g,x,y,R,snow){
  const s = .9+R()*.4, c1='#2e5a3e', c2='#3f7450';
  shadow(g,x,y,7*s,2.2*s);
  Ln(g,x,y,x,y-4*s,'#5a3a1a',1.6*s);
  for (let i=0;i<3;i++){ const yy=y-3*s-i*6.5*s, w=(8-i*2.2)*s; P(g,[x,yy-10*s,x+w,yy,x-w,yy],i%2?c2:c1,INK,.6);
    if (snow) P(g,[x,yy-10*s,x+w*.45,yy-5.4*s,x+w*.1,yy-6*s,x-w*.2,yy-5*s,x-w*.45,yy-5.4*s],'#f6fafc'); }
};
D.snowpine = function(g,x,y,R){ D.spruce(g,x,y,R,true); };
D.palm = function(g,x,y,R){
  const s = .9+R()*.35;
  shadow(g,x,y,7*s,2*s);
  curve(g,[x,y,x+3*s,y-12*s,x+1*s,y-24*s],'#8a6436',2*s);
  for (let i=0;i<5;i++) Ln(g,x+.6*s,y-4*s-i*4*s,x+2.6*s,y-4.4*s-i*4*s,'rgba(60,40,20,.5)',.7);
  const tx=x+1*s, ty=y-24*s;
  for (const [a,l] of [[-2.7,12],[-2.1,13],[-1.4,10],[-.7,13],[-.1,12],[.5,9]]){ const ex=tx+Math.cos(a)*l*s, ey=ty+Math.sin(a)*l*s*.7+4*s;
    curve(g,[tx,ty,(tx+ex)/2,ty-3*s,ex,ey],'#4f8a3a',2.2*s); }
  E(g,tx,ty+1,1.6*s,1.4*s,'#6b4a24');
};
D.rock = function(g,x,y,R){
  const s=(.85+R()*.35)*3.4;
  E(g,x+1.2,y+.8,s*1.3,s*.55,'rgba(50,40,14,.22)');
  P(g,[x-s,y,x-s*.7,y-s*.9,x+s*.2,y-s*1.15,x+s,y-s*.4,x+s*.9,y],'#a9a395','rgba(60,50,40,.6)',.6);
  P(g,[x-s*.7,y-s*.9,x+s*.2,y-s*1.15,x+s*.1,y-s*.5,x-s*.5,y-s*.45],'#cbc5b6');
};
D.vineyard = function(g,x,y){
  const vw=52, vh=56, vx=x-vw/2, vy=y-vh/2;
  RR(g,vx,vy,vw,vh,5,'rgba(186,146,92,.55)');
  for (let yy=vy+5; yy<vy+vh-2; yy+=6.5){ Ln(g,vx+3,yy+1.5,vx+vw-3,yy+1.5,'rgba(90,60,30,.25)',1.4); for (let xx=vx+4; xx<vx+vw-3; xx+=4.2){ E(g,xx,yy,2.3,2,'#5f7f37'); E(g,xx-.6,yy-.7,1.2,1,'#86a64e'); } }
};
D.field = function(g,x,y){
  const vw=56, vh=58, vx=x-vw/2, vy=y-vh/2;
  RR(g,vx,vy,vw,vh,5,'rgba(222,186,96,.75)');
  for (let yy=vy+4; yy<vy+vh-2; yy+=4.2) Ln(g,vx+3,yy,vx+vw-3,yy+.6,'rgba(170,128,50,.45)',1.1);
};
D.tiledHouse = function(g,x,y,R){
  const w = 16+R()*8, h = w*.62, rh = w*.42;
  E(g,x+3,y+1,w*.62,w*.16,'rgba(50,40,14,.28)');
  RR(g,x-w/2,y-h,w,h,1,'#efe2c6',INK,.8);
  g.fillStyle='rgba(0,0,0,.10)'; g.fillRect(x+w*.18,y-h+.5,w*.32-.5,h-1);
  RR(g,x-w*.12,y-h*.62,w*.24,h*.62,.8,'#6b4423',INK,.6);
  RR(g,x-w*.40,y-h*.72,w*.16,w*.14,.5,'#3a2a1e'); if (w > 18) RR(g,x+w*.24,y-h*.72,w*.16,w*.14,.5,'#3a2a1e');
  P(g,[x-w/2-2.4,y-h+.6,x,y-h-rh,x+w/2+2.4,y-h+.6],'#c25a34',INK,.9);
  for (let i=1;i<4;i++){ const yy = y-h-rh+rh*i/4+.4, hw = (w/2+2.4)*i/4; Ln(g,x-hw,yy,x+hw,yy,'rgba(110,30,15,.45)',.6); }
  P(g,[x,y-h-rh,x+w/2+2.4,y-h+.6,x+w*.18,y-h+.6],'rgba(0,0,0,.12)');
  if (R() < .6) RR(g,x+w*.18,y-h-rh*.9,3,rh*.5,.4,'#d9c7a6',INK,.5);
};
D.woodHouse = function(g,x,y,R){
  const w = 18+R()*6, h = w*.6, rh = w*.5;
  E(g,x+3,y+1,w*.62,w*.16,'rgba(50,40,14,.28)');
  RR(g,x-w/2,y-h,w,h,1,'#9a6a3c',INK,.8);
  for (let yy=y-h+2.6; yy<y; yy+=2.8) Ln(g,x-w/2+.6,yy,x+w/2-.6,yy,'rgba(60,35,15,.55)',.6);
  RR(g,x-w*.12,y-h*.62,w*.24,h*.62,.8,'#5a3a1e',INK,.6);
  RR(g,x+w*.2,y-h*.75,w*.16,w*.14,.5,'#f2d27a',INK,.4);
  P(g,[x-w/2-3,y-h+.8,x,y-h-rh,x+w/2+3,y-h+.8],'#6e4a2a',INK,.9);
  P(g,[x,y-h-rh,x+w/2+3,y-h+.8,x+w*.15,y-h+.8],'rgba(0,0,0,.15)');
  Ln(g,x-2,y-h-rh-1.5,x+2,y-h-rh+1.5,'#6e4a2a',1.2); Ln(g,x+2,y-h-rh-1.5,x-2,y-h-rh+1.5,'#6e4a2a',1.2);
};
D.hut = function(g,x,y,R){
  const w = 14+R()*6;
  E(g,x+3,y+1,w*.7,w*.18,'rgba(50,40,14,.28)');
  RR(g,x-w/2,y-w*.5,w,w*.5,2,'#c9a77a',INK,.8);
  RR(g,x-w*.13,y-w*.36,w*.26,w*.36,1,'#4a3020',INK,.5);
  P(g,[x-w/2-3,y-w*.45,x,y-w*1.15,x+w/2+3,y-w*.45],'#c8a25a',INK,.9);
  for (let i=0;i<5;i++){ const t=(i+1)/6; Ln(g,x,y-w*1.15,x-w/2-3+(w+6)*t,y-w*.45,'rgba(120,85,30,.45)',.6); }
};
D.tent = function(g,x,y,R){
  const w = 16+R()*6, c = ['#e8dcc0','#d9c49a','#c7a882'][(R()*3)|0];
  E(g,x+3,y+1,w*.7,w*.16,'rgba(50,40,14,.28)');
  P(g,[x-w/2,y,x,y-w*.85,x+w/2,y],c,INK,.9);
  P(g,[x,y-w*.85,x+w/2,y,x+w*.12,y],'rgba(0,0,0,.12)');
  P(g,[x-2.4,y,x,y-w*.4,x+2.4,y],'#5a3a1e');
  Ln(g,x,y-w*.85,x,y-w*1.05,INK,1); P(g,[x,y-w*1.05,x+5,y-w*.98,x,y-w*.92],'#b8281e');
};
D.ruin = function(g,x,y,R){
  shadow(g,x,y,12,3);
  RR(g,x-12,y-4,24,4,1,'#d8cfbd',INK,.7);
  const h1 = 12+R()*8, h2 = 6+R()*6;
  RR(g,x-9,y-4-h1,5,h1,1,'#ebe4d6',INK,.7); RR(g,x-10,y-6-h1,7,2.4,.6,'#d8cfbd',INK,.6);
  RR(g,x+4,y-4-h2,5,h2,1,'#ebe4d6',INK,.7); P(g,[x+4,y-4-h2,x+6,y-6-h2,x+9,y-4-h2],'#ebe4d6',INK,.6);
  E(g,x+14,y-1,4,2,'#d8cfbd',INK,.6);
};
D.reed = function(g,x,y,R){
  for (let i=0;i<6;i++){ const dx=(i-2.5)*1.8, h=9+R()*7; Ln(g,x+dx,y,x+dx+(R()-.5)*3,y-h,'#5f7f37',1);
    if (i%2) E(g,x+dx+(R()-.5)*2,y-h+1,1,2.4,'#7a4a24'); }
};
Object.assign(THEMES.decorSize, {vineyard:34, field:36, tiledHouse:16, woodHouse:16, hut:14, tent:14, ruin:16, palm:12, pine:13, rock:8, reed:8});

/* ---------------- fortress: roman (стены Рима из «Ганнибала») ---------------- */
THEMES.fortress.roman = function(g,W,yTop,battle){
  const fz = (battle && battle.fortress) || {}, name = fz.name || window.T('РИМ'), banner = fz.banner || 'SPQR';
  g.save(); g.translate(-5 + (W-390)/2, yTop - 500);   // рисунок сделан в старой рамке 400×600
  const X0 = 0, X1 = 400 + Math.max(0, W-390), Y1 = 664;
  // храм с фронтоном и купол над стеной
  RR(g,58,526,72,5,1,'#e6dccb',INK,.8);
  P(g,[56,526,94,511,132,526],'#efe7d6',INK,1); P(g,[64,524,94,514.6,124,524],'#d9cdb6');
  Ln(g,56,526,94,511,'#b0432c',1.4); Ln(g,94,511,132,526,'#b0432c',1.4);
  for (let x=64;x<=124;x+=10){ RR(g,x-2.4,531,4.8,22,.8,'#f2ebdc','rgba(58,38,22,.6)',.6); Ln(g,x-.6,532,x-.6,552,'rgba(150,135,110,.45)',.6); }
  g.fillStyle='rgba(60,40,20,.25)'; g.fillRect(59,531,70,3);
  E(g,320,536,26,19,'#ddd2bb',INK,1);
  for (let a=-3;a<=3;a++) { g.beginPath(); g.ellipse(320,536,Math.abs(a)*7.6+.1,19,0,Math.PI,0); g.strokeStyle='rgba(120,100,70,.35)'; g.lineWidth=.6; g.stroke(); }
  RR(g,316,513,8,6,1,'#ddd2bb',INK,.8); E(g,320,512.6,4.6,2,'#b0432c',INK,.6);
  RR(g,292,536,56,14,1,'#e6dccb',INK,.8); for (let x=297;x<346;x+=7) RR(g,x,538.6,3,8,1.2,'#5d4630');
  for (const [x,w] of [[150,22],[236,18],[270,16],[136,12]]){ RR(g,x,538,w,14,1,'#e9d7b6',INK,.6); P(g,[x-1.6,539,x+w/2,532,x+w+1.6,539],'#b84a2e',INK,.6); }
  E(g,262,542,3,8,'#2f5833'); E(g,148,540,2.6,8,'#2f5833');
  // тело стены
  const top = 552;
  let gr = g.createLinearGradient(0,top,0,Y1); gr.addColorStop(0,'#d4b083'); gr.addColorStop(1,'#b48d5f');
  g.fillStyle=gr; g.fillRect(X0,top,X1-X0,Y1-top);
  const BR = rng(77);
  for (let y=top+2, row=0; y<Y1; y+=5.2, row++){
    for (let x=X0-(row%2?6:0); x<X1; x+=12){ g.fillStyle = ['rgba(150,96,52,.18)','rgba(255,240,210,.14)','rgba(120,70,40,.12)','rgba(0,0,0,0)'][(BR()*4)|0]; g.fillRect(x+.6,y+.5,10.8,4.2); }
    Ln(g,X0,y,X1,y,'rgba(110,78,44,.45)',.55);
    for (let x=X0-(row%2?6:0); x<X1; x+=12) Ln(g,x,y,x,y+5.2,'rgba(110,78,44,.4)',.55);
  }
  RR(g,X0,548,X1-X0,5,0,'#e3cba2'); Ln(g,X0,553,X1,553,'rgba(90,60,30,.5)',1);
  for (let x=X0+2; x<X1; x+=14){ RR(g,x,540.5,9,8,.6,'#d9bb8e',INK,.6); g.fillStyle='rgba(0,0,0,.12)'; g.fillRect(x+6.5,541,2.4,7.4); }
  // две башни
  for (const cx of [38,362]){
    RR(g,cx-17,530,34,Y1-530,1,'#cfa97a',INK,1);
    for (let y=534; y<Y1; y+=5.2) Ln(g,cx-17,y,cx+17,y,'rgba(110,78,44,.4)',.55);
    g.fillStyle='rgba(0,0,0,.10)'; g.fillRect(cx+8,531,8.4,Y1-531);
    g.beginPath(); g.moveTo(cx-3,566); g.lineTo(cx-3,558); g.arc(cx,558,3,Math.PI,0); g.lineTo(cx+3,566); g.closePath(); g.fillStyle='#3a2616'; g.fill();
    P(g,[cx-21,531,cx,506,cx+21,531],'#b84a2e',INK,1.1);
    for (let k=1;k<5;k++){ const y=506+k*5, hw=21*k/5; Ln(g,cx-hw,y,cx+hw,y,'rgba(110,30,15,.5)',.7); }
    P(g,[cx,506,cx+21,531,cx+9,531],'rgba(0,0,0,.14)');
    E(g,cx,505.4,1.6,1.6,'#e2b44a',INK,.5);
  }
  // надвратная башня и ворота
  RR(g,166,534,68,Y1-534,1,'#d6b386',INK,1);
  for (let y=538; y<Y1; y+=5.2) Ln(g,166,y,234,y,'rgba(110,78,44,.4)',.55);
  for (let x=167; x<232; x+=13){ RR(g,x,527,8.4,8,.6,'#dcbf92',INK,.6); }
  g.beginPath(); g.moveTo(181,Y1+2); g.lineTo(181,577); g.arc(200,577,19,Math.PI,0); g.lineTo(219,Y1+2); g.closePath(); g.fillStyle='#e8d4ae'; g.fill(); g.strokeStyle=INK; g.lineWidth=1; g.stroke();
  for (let a=0;a<=8;a++){ const an=Math.PI+a*Math.PI/8; Ln(g,200+Math.cos(an)*15.8,577+Math.sin(an)*15.8,200+Math.cos(an)*19,577+Math.sin(an)*19,'rgba(110,78,44,.7)',.8); }
  g.beginPath(); g.moveTo(184.5,Y1+2); g.lineTo(184.5,577); g.arc(200,577,15.5,Math.PI,0); g.lineTo(215.5,Y1+2); g.closePath();
  gr = g.createLinearGradient(184,0,216,0); gr.addColorStop(0,'#7a4a22'); gr.addColorStop(.5,'#9a6431'); gr.addColorStop(1,'#6e421d');
  g.fillStyle=gr; g.fill(); g.strokeStyle=INK; g.lineWidth=1; g.stroke();
  for (let x=188.4; x<214; x+=3.9) Ln(g,x,566,x,Y1,'rgba(50,28,10,.45)',.6);
  Ln(g,200,562,200,Y1,INK,1.2);
  for (const y of [572,588]){ Ln(g,185,y,215,y,'#3e2c1c',1.8); for (let x=187.5;x<214;x+=4.2) E(g,x,y,.6,.6,'#c7c0b0'); }
  E(g,196.6,580,1.1,1.1,'#d4a634',INK,.4); E(g,203.4,580,1.1,1.1,'#d4a634',INK,.4);
  // штандарт над воротами
  Ln(g,182,536.6,218,536.6,'#6b4423',1.6); E(g,182,536.6,1.3,1.3,'#e2b44a'); E(g,218,536.6,1.3,1.3,'#e2b44a');
  P(g,[184.5,537,215.5,537,215.5,556,200,560.5,184.5,556],'#a8241a',INK,1);
  P(g,[186.4,538.6,213.6,538.6,213.6,555,200,558.8,186.4,555],null,'#e2b44a',.7);
  g.fillStyle='#f6d47a'; g.textAlign='center'; g.textBaseline='middle';
  g.font='700 '+(banner.length > 3 ? 8.4 : banner.length > 1 ? 10 : 12)+'px '+FONT_D; g.fillText(banner,200,547.6);
  // мраморная табличка
  g.font='12.5px '+FONT_C; const tw = Math.max(40, g.measureText(name).width + 12), px = Math.max(52, Math.min(150 - tw/2, 124)) ;
  RR(g,px-tw/2,566,tw,18,2,'#f1eadc',INK,.9); RR(g,px-tw/2+2.5,568.4,tw-5,13.2,1.4,null,'rgba(180,133,43,.8)',.6);
  g.fillStyle='#8e2419'; g.fillText(name,px,575.6);
  for (const x of [268,300]) { E(g,x,573,6.4,6.4,'#b8862f',INK,.8); E(g,x,573,4.4,4.4,null,'#e8c25a',.8); E(g,x,573,1.6,1.6,'#e8c25a'); }
  g.restore();
};
})();
