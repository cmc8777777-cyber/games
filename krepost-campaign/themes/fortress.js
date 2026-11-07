/* =====================================================================
   themes/fortress.js — крепости кампании (кроме roman — она в base.js).
   Каждая функция рисует полосу y ∈ [yTop, yTop+164] в мировых координатах (поле 390 по ширине):
   постройки за стеной, стену с зубцами (верх ≈ yTop+44…52), ворота по центру x = W/2 (арка от ≈ yTop+58),
   штандарт с battle.fortress.banner над воротами и табличку с battle.fortress.name.
   ===================================================================== */
(function(){
'use strict';
const T = window.THEMES, U = T.util;
const {E,P,Ln,RR,rng,shadeOf,mix,rgba,INK,TAU,FONT_D,FONT_C} = U;
const F = T.fortress;

/* ---------- общие детали ---------- */
function courses(g,x0,x1,top,bot,c1,c2,h,w,seed,line){
  const gr = g.createLinearGradient(0,top,0,bot); gr.addColorStop(0,c1); gr.addColorStop(1,c2);
  g.fillStyle = gr; g.fillRect(x0,top,x1-x0,bot-top);
  const R = rng(seed || 7), lc = line || 'rgba(110,78,44,.42)';
  for (let y=top+1.5, row=0; y<bot; y+=h, row++){
    for (let x=x0-(row%2?w/2:0); x<x1; x+=w){ g.fillStyle = ['rgba(150,96,52,.16)','rgba(255,240,210,.14)','rgba(120,70,40,.10)','rgba(0,0,0,0)'][(R()*4)|0]; g.fillRect(x+.6,y+.5,w-1.2,h-1); }
    Ln(g,x0,y,x1,y,lc,.55);
    for (let x=x0-(row%2?w/2:0); x<x1; x+=w) Ln(g,x,y,x,y+h,lc,.5);
  }
}
function polygonal(g,x0,x1,top,bot,c,seed){   // кладка из крупных многоугольных камней
  g.fillStyle = c; g.fillRect(x0,top,x1-x0,bot-top);
  const R = rng(seed || 11);
  for (let y=top+2; y<bot; y+=9+R()*3){ let x = x0 - R()*10; while (x < x1){ const w = 12+R()*14, h = 8+R()*4;
    P(g,[x+1,y+R()*2,x+w-R()*3,y+R()*1.5,x+w,y+h*.6,x+w-2,y+h,x+2+R()*2,y+h-R(),x,y+h*.5],R()<.5?shadeOf(c,.93):mix(c,'#ffffff',.08),'rgba(80,64,44,.55)',.6); x += w; } }
}
function merlons(g,x0,x1,y,w,h,gap,c){ for (let x=x0+2; x<x1; x+=w+gap){ RR(g,x,y-h,w,h+1,.6,c,INK,.6); g.fillStyle='rgba(0,0,0,.12)'; g.fillRect(x+w*.68,y-h+.5,w*.28,h); } }
function stepped(g,x0,x1,y,w,c){ for (let x=x0; x<x1; x+=w+3){ P(g,[x,y,x,y-4,x+w*.2,y-4,x+w*.2,y-7,x+w*.4,y-7,x+w*.4,y-10,x+w*.6,y-10,x+w*.6,y-7,x+w*.8,y-7,x+w*.8,y-4,x+w,y-4,x+w,y],c,INK,.6); } }
function swallow(g,x0,x1,y,w,c){ for (let x=x0+1; x<x1; x+=w+3.4){ P(g,[x,y,x,y-9,x+w*.18,y-12,x+w*.5,y-8,x+w*.82,y-12,x+w,y-9,x+w,y],c,INK,.6); g.fillStyle='rgba(0,0,0,.12)'; g.fillRect(x+w*.7,y-9,w*.26,9); } }
function archGate(g,cx,top,bot,hw,frame,door,iron){
  g.beginPath(); g.moveTo(cx-hw-4,bot); g.lineTo(cx-hw-4,top+hw+4); g.arc(cx,top+hw+4,hw+4,Math.PI,0); g.lineTo(cx+hw+4,bot); g.closePath(); g.fillStyle=frame; g.fill(); g.strokeStyle=INK; g.lineWidth=1; g.stroke();
  g.beginPath(); g.moveTo(cx-hw,bot); g.lineTo(cx-hw,top+hw+4); g.arc(cx,top+hw+4,hw,Math.PI,0); g.lineTo(cx+hw,bot); g.closePath();
  const gr = g.createLinearGradient(cx-hw,0,cx+hw,0); gr.addColorStop(0,shadeOf(door,.85)); gr.addColorStop(.5,door); gr.addColorStop(1,shadeOf(door,.78));
  g.fillStyle = gr; g.fill(); g.strokeStyle=INK; g.lineWidth=1; g.stroke();
  for (let x=cx-hw+3.9; x<cx+hw; x+=3.9) Ln(g,x,top+hw,x,bot,'rgba(50,28,10,.45)',.6);
  Ln(g,cx,top+hw-11,cx,bot,INK,1.2);
  if (iron) for (const y of [top+hw+10, top+hw+26]){ Ln(g,cx-hw+1,y,cx+hw-1,y,'#3e2c1c',1.8); for (let x=cx-hw+3;x<cx+hw-1;x+=4.2) E(g,x,y,.6,.6,'#c7c0b0'); }
}
function rectGate(g,cx,top,bot,hw,frame,door){
  RR(g,cx-hw-5,top-4,hw*2+10,6,1,frame,INK,1);
  RR(g,cx-hw,top,hw*2,bot-top,0,door,INK,1); for (let x=cx-hw+4; x<cx+hw; x+=4) Ln(g,x,top+1,x,bot,'rgba(40,24,10,.4)',.6); Ln(g,cx,top,cx,bot,INK,1.1);
}
function banner(g,cx,y,text,cloth,fg,trim){
  text = String(text || '');
  Ln(g,cx-17,y,cx+17,y,'#6b4423',1.6); E(g,cx-17,y,1.3,1.3,'#e2b44a'); E(g,cx+17,y,1.3,1.3,'#e2b44a');
  P(g,[cx-14.5,y+.4,cx+14.5,y+.4,cx+14.5,y+19,cx,y+23.4,cx-14.5,y+19],cloth,INK,1);
  P(g,[cx-12.6,y+2,cx+12.6,y+2,cx+12.6,y+18,cx,y+21.8,cx-12.6,y+18],null,trim || '#e2b44a',.7);
  g.fillStyle = fg || '#f6d47a'; g.textAlign='center'; g.textBaseline='middle';
  g.font = '700 '+(text.length > 3 ? 8.4 : text.length > 1 ? 10 : 13)+'px '+FONT_D+',"Segoe UI Symbol","Noto Sans Symbols",sans-serif'; g.fillText(text,cx,y+11);
}
function plaque(g,cx,y,name,bg,fg,edge){
  name = String(name || ''); let fs = 12.5; g.font = fs+'px '+FONT_C; let tw = g.measureText(name).width;
  while (tw > 128 && fs > 8) { fs -= .5; g.font = fs+'px '+FONT_C; tw = g.measureText(name).width; }
  const w = Math.max(40, tw + 12);
  RR(g,cx-w/2,y,w,18,2,bg || '#f1eadc',INK,.9); RR(g,cx-w/2+2.5,y+2.4,w-5,13.2,1.4,null,edge || 'rgba(180,133,43,.8)',.6);
  g.fillStyle = fg || '#8e2419'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(name,cx,y+9.6);
}
function shieldMedal(g,cx,cy,r,c,text){ E(g,cx,cy,r,r,c,INK,1); E(g,cx,cy,r-2,r-2,null,'#e2c27a',1); g.fillStyle='#f6d47a'; g.textAlign='center'; g.textBaseline='middle'; g.font='700 '+(r*1.1)+'px '+FONT_D+',"Segoe UI Symbol",sans-serif'; g.fillText(String(text||''),cx,cy+.6); }
function tentRoof(g,cx,y,hw,h,c,ball){ P(g,[cx-hw,y,cx,y-h,cx+hw,y],c,INK,1); for (let k=1;k<5;k++){ const yy=y-h+h*k/5, ww=hw*k/5; Ln(g,cx-ww,yy,cx+ww,yy,rgba(shadeOf(c,.6),.5),.6); } P(g,[cx,y-h,cx+hw,y,cx+hw*.35,y],'rgba(0,0,0,.14)'); if (ball) { Ln(g,cx,y-h,cx,y-h-5,INK,1); E(g,cx,y-h-6,1.6,1.6,ball,INK,.5); } }
function onion(g,cx,y,r,c,cross){
  g.beginPath(); g.moveTo(cx-r,y); g.bezierCurveTo(cx-r*1.3,y-r*1.1,cx-r*.2,y-r*1.4,cx,y-r*2.2); g.bezierCurveTo(cx+r*.2,y-r*1.4,cx+r*1.3,y-r*1.1,cx+r,y); g.closePath();
  g.fillStyle=c; g.fill(); g.strokeStyle=INK; g.lineWidth=.9; g.stroke(); P(g,[cx,y-r*2.2,cx+r*.4,y-r*1.2,cx+r,y,cx+r*.3,y],'rgba(0,0,0,.14)');
  E(g,cx-r*.35,y-r*.9,r*.18,r*.4,'rgba(255,255,255,.35)');
  if (cross) { Ln(g,cx,y-r*2.2,cx,y-r*2.2-7,'#c9a227',1.1); Ln(g,cx-2.6,y-r*2.2-5,cx+2.6,y-r*2.2-5,'#c9a227',1); Ln(g,cx-2,y-r*2.2-2.4,cx+2,y-r*2.2-3.2,'#c9a227',.8); }
}
function drum(g,cx,y,hw,h,c){ RR(g,cx-hw,y-h,hw*2,h,.6,c,INK,.9); for (let x=cx-hw+2; x<cx+hw-1; x+=3.4) RR(g,x,y-h+2,1.6,h-4,.6,'rgba(60,40,20,.45)'); }
function church(g,cx,base,w,wall,roof,domeC){
  RR(g,cx-w/2,base-w*.62,w,w*.62,1,wall,INK,.9); P(g,[cx-w/2-2,base-w*.62,cx,base-w*.95,cx+w/2+2,base-w*.62],roof,INK,.9);
  drum(g,cx,base-w*.85,w*.16,w*.26,wall); onion(g,cx,base-w*1.11,w*.2,domeC,true);
  RR(g,cx-w*.1,base-w*.36,w*.2,w*.36,2,'#4a3020',INK,.6);
}
function tower(g,cx,top,bot,hw,body,line,roofFn){
  RR(g,cx-hw,top,hw*2,bot-top,1,body,INK,1);
  for (let y=top+4; y<bot; y+=5.2) Ln(g,cx-hw,y,cx+hw,y,line || 'rgba(110,78,44,.4)',.55);
  g.fillStyle='rgba(0,0,0,.10)'; g.fillRect(cx+hw*.45,top+1,hw*.5,bot-top-1);
  g.beginPath(); g.moveTo(cx-2.6,top+30); g.lineTo(cx-2.6,top+23); g.arc(cx,top+23,2.6,Math.PI,0); g.lineTo(cx+2.6,top+30); g.closePath(); g.fillStyle='#3a2616'; g.fill();
  if (roofFn) roofFn(cx,top,hw);
}
const BOT = 164;

/* ---------- Греция: Фокидская стена ---------- */
F.greek = function(g,W,yTop,b){
  const fz = (b && b.fortress) || {}, cx = W/2, top = yTop+50, bot = yTop+BOT;
  // храм за стеной
  const tx = 92, ty = yTop+48;
  RR(g,tx-36,ty-3,72,5,1,'#e6dccb',INK,.8); P(g,[tx-38,ty-3,tx,ty-17,tx+38,ty-3],'#efe7d6',INK,1); P(g,[tx-30,ty-5,tx,ty-14,tx+30,ty-5],'#d9cdb6');
  for (let x=tx-30;x<=tx+30;x+=10) RR(g,x-2.4,ty+2,4.8,10,.8,'#f2ebdc','rgba(58,38,22,.6)',.6);
  for (const [x,s] of [[300,1],[330,.8],[270,.7]]) { E(g,x,yTop+40-8*s,10*s,8*s,'#7f9461',INK,.6); E(g,x-3*s,yTop+37-8*s,5*s,3.4*s,'#a4b380'); }
  polygonal(g,-4,W+4,top,bot,'#c9bea6',21);
  RR(g,-4,top-3,W+8,4,0,'#d8cfbb',INK,.6);
  merlons(g,-4,W+4,top-2,10,7,5,'#d3c8b0');
  for (const x of [34, W-34]) { RR(g,x-20,top-14,40,bot-top+14,1,'#c2b69c',INK,1); polygonal(g,x-19,x+19,top-12,bot,'#c2b69c',x); merlons(g,x-20,x+20,top-14,8,6,3.6,'#cbbfa5'); }
  rectGate(g,cx,yTop+68,bot+2,17,'#bfb39a','#7a4a22');
  P(g,[cx-24,yTop+62,cx,yTop+50,cx+24,yTop+62],'#d8cfbb',INK,1);
  shieldMedal(g,cx,yTop+58,8.4,'#b3261e',fz.banner || 'Λ');
  plaque(g,cx-96,yTop+82,fz.name || 'ФЕРМОПИЛЫ','#f1eadc','#7c1f16');
  for (const x of [cx+62, cx+94]) { E(g,x,yTop+90,7,7,'#b8862f',INK,.8); E(g,x,yTop+90,5,5,null,'#e8c25a',.8); Ln(g,x-3,yTop+93,x+3,yTop+87,'#7c1f16',1.4); }
};

/* ---------- Персия: лагерь Дария ---------- */
F.persian = function(g,W,yTop,b){
  const fz = (b && b.fortress) || {}, cx = W/2, top = yTop+52, bot = yTop+BOT;
  // царский шатёр и пальмы за стеной
  P(g,[cx-60,yTop+52,cx-30,yTop+16,cx+30,yTop+16,cx+60,yTop+52],'#7d2390',INK,1);
  for (let x=cx-24; x<cx+30; x+=12) Ln(g,x,yTop+17,x-6+(x-cx)*.4,yTop+52,'rgba(240,200,90,.6)',1);
  Ln(g,cx,yTop+16,cx,yTop+4,INK,1.2); P(g,[cx,yTop+4,cx+10,yTop+8,cx,yTop+12],'#e2b44a',INK,.6);
  for (const x of [40, 336, 362]) { if (T.decor.palm) T.decor.palm(g,x,yTop+50,rng(x)); }
  courses(g,-4,W+4,top,bot,'#e0c48a','#c9a46a',5.4,13,33,'rgba(130,95,50,.4)');
  // голубой изразцовый пояс со «звёздами»
  RR(g,-4,top+12,W+8,11,0,'#2f5f9e',INK,.6); for (let x=6; x<W; x+=18) { E(g,x,top+17.5,3.2,3.2,'#f2ece0',INK,.4); E(g,x,top+17.5,1.2,1.2,'#e2b44a'); }
  Ln(g,-4,top+12,W+4,top+12,'#e2b44a',1); Ln(g,-4,top+23,W+4,top+23,'#e2b44a',1);
  stepped(g,-4,W+4,top+1,11,'#d9b878');
  for (const x of [36, W-36]) { RR(g,x-18,top-12,36,bot-top+12,1,'#d6b47c',INK,1); courses(g,x-17,x+17,top-10,bot,'#dcbd84','#c9a46a',5.4,9,x,'rgba(130,95,50,.4)'); RR(g,x-18,top+2,36,9,0,'#2f5f9e',INK,.5); stepped(g,x-18,x+18,top-11,9,'#d9b878'); }
  archGate(g,cx,yTop+60,bot+2,16,'#2f5f9e','#8a5a2b',true);
  banner(g,cx,yTop+34,fz.banner || '☀','#7d2390','#f6d47a');
  plaque(g,cx-98,yTop+90,fz.name || 'ЛАГЕРЬ','#f6ead0','#2f5f9e','rgba(47,95,158,.7)');
};

/* ---------- Галлия: оппидум, «галльская стена» ---------- */
F.gallic = function(g,W,yTop,b){
  const fz = (b && b.fortress) || {}, cx = W/2, top = yTop+56, bot = yTop+BOT;
  // круглые хижины с соломенной крышей
  for (const [x,s] of [[60,1],[100,.8],[290,1.1],[334,.85]]) { const y = yTop+52; RR(g,x-11*s,y-10*s,22*s,10*s,2,'#c9a77a',INK,.8); P(g,[x-14*s,y-9*s,x,y-28*s,x+14*s,y-9*s],'#c8a25a',INK,.9); for (let i=0;i<5;i++) Ln(g,x,y-28*s,x-14*s+28*s*(i+1)/6,y-9*s,'rgba(120,85,30,.45)',.6); }
  // каменная стена с торцами брёвен
  courses(g,-4,W+4,top,bot,'#b8ad98','#9f9480',7,16,51,'rgba(70,60,45,.45)');
  for (let y=top+5; y<bot; y+=14) for (let x=4; x<W; x+=16) { E(g,x+((y-top)%28?8:0),y,2.3,2.3,'#6b4a2a',INK,.5); E(g,x+((y-top)%28?8:0),y,1,1,'#a07a4a'); }
  // частокол поверху
  for (let x=-4; x<W+4; x+=6.4) { P(g,[x,top+1,x,top-12,x+3.2,top-16,x+6.4,top-12,x+6.4,top+1],'#8a5a2b',INK,.6); }
  Ln(g,-4,top-6,W+4,top-6,'#5a3a1e',1.6);
  // деревянная надвратная башня
  for (const s of [-1,1]) { const x = cx + s*30; RR(g,x-9,yTop+30,18,bot-yTop-30,1,'#9a6a34',INK,1); for (let y=yTop+34; y<bot; y+=5) Ln(g,x-9,y,x+9,y,'rgba(60,35,15,.5)',.6); P(g,[x-12,yTop+31,x,yTop+16,x+12,yTop+31],'#c8a25a',INK,.9); }
  RR(g,cx-34,yTop+42,68,8,1,'#7a5230',INK,1); for (let x=cx-32; x<cx+32; x+=6) RR(g,x,yTop+36,4,7,.6,'#8a5a2b',INK,.5);
  rectGate(g,cx,yTop+62,bot+2,18,'#6b4423','#7a4a22');
  banner(g,cx,yTop+50,fz.banner || '◉','#2f6b3a','#f6d47a');
  plaque(g,cx-100,yTop+92,fz.name || 'ОППИДУМ','#efe2c6','#2f4a2a','rgba(107,74,42,.8)');
};

/* ---------- Лагерь Спартака: частокол ---------- */
F.slaveCamp = function(g,W,yTop,b){
  const fz = (b && b.fortress) || {}, cx = W/2, top = yTop+60, bot = yTop+BOT;
  // палатки и шалаши за частоколом, дым костра
  const R = rng(61);
  for (const [x,c] of [[50,'#e8dcc0'],[86,'#d9c49a'],[300,'#c7a882'],[340,'#e8dcc0'],[122,'#c7a882'],[264,'#d9c49a']]) { const y = yTop+56, w = 22; P(g,[x-w/2,y,x,y-w*.8,x+w/2,y],c,INK,.9); P(g,[x,y-w*.8,x+w/2,y,x+w*.12,y],'rgba(0,0,0,.12)'); P(g,[x-2.4,y,x,y-w*.36,x+2.4,y],'#5a3a1e'); }
  for (let i=0;i<6;i++) E(g,322+i*3,yTop+20-i*6,4+i*1.5,3+i,'rgba(200,195,185,'+(.5-i*.07)+')');
  // земляной вал
  P(g,[-4,bot,-4,top+16,W+4,top+16,W+4,bot],'#9a7a50'); for (let i=0;i<60;i++) E(g,R()*W,top+20+R()*(bot-top-20),1.2,.8,'rgba(60,40,20,.4)');
  // частокол из заострённых брёвен
  for (let x=-4; x<W+4; x+=7.2) { const h = 30+R()*6; P(g,[x,top+18,x,top+18-h,x+3.6,top+12-h,x+7.2,top+18-h,x+7.2,top+18],R()<.5?'#8a5a2b':'#7a4e24',INK,.6); Ln(g,x+3.6,top+16-h+6,x+3.6,top+14,'rgba(255,230,190,.25)',.6); }
  Ln(g,-4,top-4,W+4,top-4,'#4a3020',1.4); Ln(g,-4,top+6,W+4,top+6,'#4a3020',1.4);
  // ворота между двумя вышками
  for (const s of [-1,1]) { const x = cx + s*28; for (const dx of [-6,6]) Ln(g,x+dx,bot,x+dx,yTop+26,INK,2.6), Ln(g,x+dx,bot,x+dx,yTop+26,'#8a5a2b',1.6); RR(g,x-10,yTop+22,20,8,1,'#9a6a34',INK,.9); P(g,[x-12,yTop+22,x,yTop+12,x+12,yTop+22],'#d9c49a',INK,.8); }
  RR(g,cx-20,yTop+70,40,bot-yTop-68,0,'#5a3a1e',INK,1); for (let x=cx-18; x<cx+20; x+=5) Ln(g,x,yTop+72,x,bot,'rgba(30,18,6,.5)',.8); Ln(g,cx-20,yTop+90,cx+20,yTop+84,'#8a6a3a',2);
  Ln(g,cx-34,yTop+30,cx-34,yTop+8,INK,1.4); P(g,[cx-34,yTop+8,cx-18,yTop+12,cx-34,yTop+17],'#b8281e',INK,.8);
  banner(g,cx,yTop+48,fz.banner || '⚔','#b8281e','#f6ead0');
  plaque(g,cx-102,yTop+100,fz.name || 'ЛАГЕРЬ','#efe2c6','#7c1f16','rgba(107,74,42,.8)');
};

/* ---------- Византия: стены Феодосия ---------- */
F.byzantine = function(g,W,yTop,b){
  const fz = (b && b.fortress) || {}, cx = W/2, top = yTop+52, bot = yTop+BOT;
  // купольный храм за стеной
  const hx = 296, hy = yTop+52;
  RR(g,hx-44,hy-16,88,16,1,'#e6d6b8',INK,.9); RR(g,hx-24,hy-30,48,15,1,'#ead9bc',INK,.9);
  g.beginPath(); g.ellipse(hx,hy-30,22,16,0,Math.PI,0); g.closePath(); g.fillStyle='#c7b48a'; g.fill(); g.strokeStyle=INK; g.lineWidth=1; g.stroke();
  for (let a=-3;a<=3;a++){ g.beginPath(); g.ellipse(hx,hy-30,Math.abs(a)*6.4+.1,16,0,Math.PI,0); g.strokeStyle='rgba(110,90,60,.35)'; g.lineWidth=.6; g.stroke(); }
  Ln(g,hx,hy-46,hx,hy-55,'#c9a227',1.4); Ln(g,hx-3,hy-52,hx+3,hy-52,'#c9a227',1.2);
  for (const s of [-1,1]) { g.beginPath(); g.ellipse(hx+s*30,hy-16,9,7,0,Math.PI,0); g.fillStyle='#c7b48a'; g.fill(); g.strokeStyle=INK; g.lineWidth=.8; g.stroke(); }
  for (const x of [70, 100]) { RR(g,x-1.6,yTop+22,3.2,30,1,'#efe7d6',INK,.6); E(g,x,yTop+21,3,1.6,'#d8cdb6',INK,.5); }
  // стена: известняк с поясами красного кирпича
  courses(g,-4,W+4,top,bot,'#e3d5b8','#cdbd9c',5.2,14,71,'rgba(120,100,70,.38)');
  for (let y=top+10; y<bot; y+=22) { RR(g,-4,y,W+8,6,0,'#b25a3a'); Ln(g,-4,y+2,W+4,y+2,'rgba(80,30,15,.5)',.5); Ln(g,-4,y+4,W+4,y+4,'rgba(80,30,15,.5)',.5); }
  merlons(g,-4,W+4,top,9,8,5,'#dccdae');
  for (const x of [28, 128, W-128, W-28]) { RR(g,x-15,top-18,30,bot-top+18,1,'#dccdae',INK,1); for (let y=top-6; y<bot; y+=22) RR(g,x-15,y,30,6,0,'#b25a3a'); merlons(g,x-15,x+15,top-18,6,6,3,'#e3d5b8'); g.fillStyle='rgba(0,0,0,.1)'; g.fillRect(x+7,top-17,7,bot-top+17); }
  archGate(g,cx,yTop+58,bot+2,17,'#d9b45a','#7a4a22',true);
  banner(g,cx,yTop+30,fz.banner || '☧','#6b1d7a','#f6d47a');
  plaque(g,cx-95,yTop+80,fz.name || 'КОНСТАНТИНОПОЛЬ','#f4ecd8','#6b1d7a','rgba(107,29,122,.6)');
};

/* ---------- Франки: старые римские стены Тура и церковь ---------- */
F.frankish = function(g,W,yTop,b){
  const fz = (b && b.fortress) || {}, cx = W/2, top = yTop+54, bot = yTop+BOT;
  // церковь с колокольней
  const hx = 300, hy = yTop+54;
  RR(g,hx-34,hy-20,50,20,1,'#d9cdb3',INK,.9); P(g,[hx-36,hy-20,hx-9,hy-34,hx+18,hy-20],'#8a4a2a',INK,.9);
  RR(g,hx+14,hy-46,16,46,1,'#d3c6aa',INK,.9); P(g,[hx+12,hy-46,hx+22,hy-62,hx+32,hy-46],'#6e4a2a',INK,.9); RR(g,hx+19,hy-40,6,8,3,'#3a2414');
  Ln(g,hx+22,hy-62,hx+22,hy-70,'#c9a227',1.2); Ln(g,hx+19,hy-67,hx+25,hy-67,'#c9a227',1.1);
  for (const [x,s] of [[56,1],[86,.8]]) { RR(g,x-10*s,yTop+52-12*s,20*s,12*s,1,'#9a6a3c',INK,.8); P(g,[x-12*s,yTop+52-11*s,x,yTop+52-24*s,x+12*s,yTop+52-11*s],'#6e4a2a',INK,.9); }
  courses(g,-4,W+4,top,bot,'#c9b896','#ad9b78',6,11,81,'rgba(90,72,48,.45)');
  for (let y=top+16; y<bot; y+=24) RR(g,-4,y,W+8,4,0,'#a8573a');
  merlons(g,-4,W+4,top,10,8,5,'#c2b190');
  // деревянные навесы-«галереи» над стеной
  for (const x of [48, W-48]) { RR(g,x-20,top-20,40,bot-top+20,1,'#bfae8c',INK,1); RR(g,x-23,top-24,46,8,1,'#8a5a2b',INK,.9); P(g,[x-25,top-24,x,top-40,x+25,top-24],'#6e4a2a',INK,1); }
  archGate(g,cx,yTop+62,bot+2,17,'#bfae8c','#6b4423',true);
  banner(g,cx,yTop+34,fz.banner || '✝','#2f4f8e','#f6ead0','#e2c27a');
  plaque(g,cx-96,yTop+86,fz.name || 'ТУР','#f1eadc','#2f4f8e','rgba(47,79,142,.6)');
};

/* ---------- Русь: деревянная крепость ---------- */
F.rusWood = function(g,W,yTop,b){
  const fz = (b && b.fortress) || {}, cx = W/2, top = yTop+56, bot = yTop+BOT;
  church(g,300,yTop+52,40,'#c9a87a','#6e4a2a','#7d8f9e');
  for (const [x,s] of [[60,1],[96,.85],[262,.8]]) { RR(g,x-10*s,yTop+52-12*s,20*s,12*s,1,'#9a6a3c',INK,.8); P(g,[x-12*s,yTop+52-11*s,x,yTop+52-22*s,x+12*s,yTop+52-11*s],'#6e4a2a',INK,.9); }
  // стена из горизонтальных брёвен с кровлей
  g.fillStyle='#9a6a34'; g.fillRect(-4,top,W+8,bot-top);
  for (let y=top+1; y<bot; y+=6){ RR(g,-4,y,W+8,5.6,2.8,'#a8763e','rgba(60,35,15,.6)',.6); Ln(g,-4,y+1.4,W+4,y+1.4,'rgba(255,230,180,.25)',.6); }
  P(g,[-4,top+1,-4,top-8,W+4,top-8,W+4,top+1],'#6e4a2a',INK,.9); for (let x=-2; x<W; x+=5) Ln(g,x,top-8,x+1,top+1,'rgba(30,18,6,.35)',.5);
  for (const x of [34, W-34]) tower(g,x,top-22,bot,17,'#a8763e','rgba(60,35,15,.55)',(c,t,hw)=>tentRoof(g,c,t,hw+4,30,'#7a5230','#c9a227'));
  for (const s of [-1,1]) { const x = cx + s*30; RR(g,x-12,yTop+34,24,bot-yTop-34,1,'#a8763e',INK,1); for (let y=yTop+38; y<bot; y+=6) Ln(g,x-12,y,x+12,y,'rgba(60,35,15,.55)',.6); tentRoof(g,x,yTop+35,15,24,'#7a5230','#c9a227'); }
  RR(g,cx-18,yTop+60,36,bot-yTop-58,1,'#7a5230',INK,1);
  rectGate(g,cx,yTop+70,bot+2,15,'#5a3a1e','#6b4423');
  banner(g,cx,yTop+44,fz.banner || '☦','#b8281e','#f6d47a');
  plaque(g,cx-100,yTop+92,fz.name || 'КРЕПОСТЬ','#efe2c6','#7c1f16','rgba(107,74,42,.8)');
};

/* ---------- Русь: белокаменная крепость ---------- */
F.rusStone = function(g,W,yTop,b){
  const fz = (b && b.fortress) || {}, cx = W/2, top = yTop+54, bot = yTop+BOT;
  church(g,92,yTop+52,40,'#f1ebdd','#7d8f9e','#e2b44a');
  church(g,300,yTop+52,34,'#f1ebdd','#7d8f9e','#e2b44a');
  courses(g,-4,W+4,top,bot,'#f2ede1','#ddd5c3',6,15,91,'rgba(140,130,110,.4)');
  merlons(g,-4,W+4,top,10,9,4.6,'#ece6d6');
  for (const x of [30, W-30]) { RR(g,x-17,top-20,34,bot-top+20,8,'#eee8da',INK,1); for (let y=top-14; y<bot; y+=6) Ln(g,x-16,y,x+16,y,'rgba(140,130,110,.4)',.55); tentRoof(g,x,top-19,20,30,'#6b7f6a','#c9a227'); }
  RR(g,cx-24,yTop+26,48,bot-yTop-26,1,'#eee8da',INK,1); for (let y=yTop+30; y<bot; y+=6) Ln(g,cx-24,y,cx+24,y,'rgba(140,130,110,.4)',.55);
  tentRoof(g,cx,yTop+27,28,26,'#6b7f6a','#c9a227');
  archGate(g,cx,yTop+64,bot+2,15,'#d8cfbd','#6b4423',true);
  banner(g,cx,yTop+40,fz.banner || '☦','#b8281e','#f6d47a');
  plaque(g,cx-98,yTop+88,fz.name || 'КРЕПОСТЬ','#f4f0e6','#7c1f16','rgba(140,130,110,.8)');
};

/* ---------- Москва: Кремль ---------- */
F.moscow = function(g,W,yTop,b){
  const fz = (b && b.fortress) || {}, cx = W/2, top = yTop+56, bot = yTop+BOT;
  // колокольня Ивана Великого и соборы за стеной
  const bx = 300; RR(g,bx-9,yTop+2,18,52,1,'#f1ebdd',INK,.9); RR(g,bx-7,yTop-12,14,14,1,'#f1ebdd',INK,.9); for (const y of [yTop+12, yTop+28]) Ln(g,bx-9,y,bx+9,y,'rgba(140,130,110,.6)',.8); onion(g,bx,yTop-12,7,'#e2b44a',true);
  church(g,250,yTop+54,34,'#f1ebdd','#7d8f9e','#e2b44a'); church(g,96,yTop+54,38,'#f1ebdd','#7d8f9e','#e2b44a');
  for (const x of [64,128]) onion(g,x,yTop+30,5,'#e2b44a',true);
  // красная кирпичная стена с «ласточкиными хвостами»
  courses(g,-4,W+4,top,bot,'#b8483a','#9a3a2e',4.6,11,101,'rgba(70,20,12,.4)');
  swallow(g,-4,W+4,top+1,9,'#b8483a');
  for (const x of [28, W-28]) { RR(g,x-16,top-16,32,bot-top+16,1,'#b04436',INK,1); courses(g,x-15,x+15,top-14,bot,'#b8483a','#9a3a2e',4.6,8,x,'rgba(70,20,12,.4)'); swallow(g,x-16,x+16,top-15,6,'#b8483a'); tentRoof(g,x,top-24,13,26,'#4f7a5a','#e2b44a'); }
  // надвратная башня
  RR(g,cx-26,yTop+20,52,bot-yTop-20,1,'#b04436',INK,1); courses(g,cx-25,cx+25,yTop+22,bot,'#b8483a','#9a3a2e',4.6,8,7,'rgba(70,20,12,.4)');
  swallow(g,cx-26,cx+26,yTop+22,7,'#b8483a'); RR(g,cx-20,yTop+6,40,15,1,'#ead9bc',INK,.9); tentRoof(g,cx,yTop+7,22,22,'#4f7a5a','#e2b44a');
  archGate(g,cx,yTop+66,bot+2,15,'#ead9bc','#6b4423',true);
  banner(g,cx,yTop+38,fz.banner || '☦','#b8281e','#f6d47a');
  plaque(g,cx-100,yTop+92,fz.name || 'МОСКВА','#f4ecd8','#7c1f16','rgba(122,40,30,.6)');
};
})();
