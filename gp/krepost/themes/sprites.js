/* =====================================================================
   themes/sprites.js — фигурки кампании «Крепость» по полям sprite из SCHEMA.md.
   Загружается после themes/base.js. Регистрирует:
     THEMES.fig      — примитивы фигурок (ноги, туника, конь…), общие с особыми спрайтами битв;
     THEMES.figure   — function(g, spec, frame, ctx) рисует фигуру (ноги в 0,0, лицом вправо);
     THEMES.figBox   — function(spec) → {w,h,ay,top,foot} рамка спрайта в единицах мира (до масштаба);
     THEMES.bust     — function(g, spec) портрет-медальон (центр 0,0, радиус 60);
     THEMES.art      — иконки способностей по effect, анахронизмов по названию, венок, разбитые ворота.
   frame: −1 — стоит (защитник), 0/1 — кадры шага. ctx = {era, role:'def'|'foe'}.
   Особые рисунки одной битвы (например, «Ганнибал» из v4): THEMES.spriteDraw[battleId][unitId] =
     {draw(g,f), box:[w,h,ay,top,foot], scale}.
   ===================================================================== */
(function(){
'use strict';
const T = window.THEMES, U = T.util;
const {E,P,Ln,RR,limb,curve,spear,eye,head,star,shadeOf,mix,rgba,INK,TAU,FONT_D} = U;
const SKIN='#e7b58c', SKIN2='#c98f62', SKIN3='#8d5a3b';

/* ---------- примитивы (как в v4) ---------- */
function stride(f){ return f===1 ? [-5,5] : f===0 ? [-1.5,2] : [-2.6,2.6]; }
function legs(g,f,col,shoe,w){ const [a,b]=stride(f); limb(g,-1.8,-11,a,-1.4,col,w||2.6); limb(g,1.8,-11,b,-1.4,col,w||2.6); E(g,a+.9,-1,2.3,1.15,shoe||'#5a3a1a',INK,.6); E(g,b+.9,-1,2.3,1.15,shoe||'#5a3a1a',INK,.6); }
function tunic(g,col,trim,top,bot){ P(g,[-6,top,6,top,7.6,bot,-7.6,bot],col,INK,1); if(trim) Ln(g,-7.3,bot-1,7.3,bot-1,trim,1.4); }
function shadeTorso(g,top,bot){ P(g,[-6,top,-1.5,top,-2.5,bot,-7.6,bot],'rgba(0,0,0,.10)'); }
function horse(g,f,body,mane,s){
  g.save(); g.scale(s,s);
  const fr = f===1 ? [[8,-13,7,-4.5],[6,-13,11,-6],[-8,-13,-6,-3.5],[-6,-13,-11,-5.5]] : [[8,-13,13.5,-2],[6,-13,9,-1],[-8,-13,-13,-2],[-6,-13,-4,-1]];
  limb(g,fr[1][0],fr[1][1],fr[1][2],fr[1][3],shadeOf(body),2.4); limb(g,fr[3][0],fr[3][1],fr[3][2],fr[3][3],shadeOf(body),2.4);
  curve(g,[-11.5,-19.5,-17,-17,-16,-10],mane,2.2);
  E(g,0,-17,12,6.6,body,INK,1.1);
  P(g,[6,-20.5,9.6,-27.6,13.4,-29,12.6,-19],body,INK,1);
  E(g,15.2,-26.6,4.4,2.7,body,INK,1,.5);
  P(g,[11.6,-29.4,12.4,-32,13.6,-29],body,INK,.7);
  curve(g,[7.4,-21,9.6,-28,12.6,-29.6],mane,1.6,false);
  eye(g,14.6,-27.8);
  limb(g,fr[0][0],fr[0][1],fr[0][2],fr[0][3],body,2.5); limb(g,fr[2][0],fr[2][1],fr[2][2],fr[2][3],body,2.5);
  g.restore();
}
T.fig = {stride,legs,tunic,shadeTorso,horse,SKIN,SKIN2,SKIN3};

/* ---------- детали ---------- */
const STEEL='#c3c9cf', STEEL2='#8e959e', BRONZE='#c99a3a', GOLD='#e2b44a', WOOD='#7a5230';
function col(c,d){ return (typeof c === 'string' && c[0] === '#') ? c : d; }
function cloakBack(g,c,dy){ P(g,[-5,-25+dy,-12,-6+dy*.3,-9,-2+dy*.2,-3,-7+dy*.3,0,-24+dy],c,INK,1); P(g,[-9,-10+dy*.3,-12,-6+dy*.3,-9,-2+dy*.2],shadeOf(c,.8)); }
function torsoArmor(g,s,top,bot){
  const a = s.armor || 'none', hw = 6;
  if (a === 'none') return;
  const box = (c) => { P(g,[-hw,top,hw,top,hw+.6,bot,-hw-.6,bot],c,INK,1); shadeTorso(g,top,bot); };
  if (a === 'mail'){ box('#cfd4da'); for (let y=top+1.4;y<bot-.6;y+=2) for (let x=-5;x<6;x+=2) E(g,x+((Math.round(y))%2?1:0),y,.45,.45,STEEL2); }
  else if (a === 'plate'){ box('#bcc2c9'); Ln(g,-hw,top+3,hw,top+3,'#7d848d',.8); Ln(g,-hw,top+5.6,hw+.2,top+5.6,'#7d848d',.8); Ln(g,0,top,0,bot,'rgba(255,255,255,.35)',.8); }
  else if (a === 'linothorax'){ box('#efe6cf'); Ln(g,-hw,top+2.4,hw,top+2.4,'#b4852b',.9); for (let x=-6;x<6.5;x+=2.4) RR(g,x,bot-.4,2,3.6,.4,'#e3d6b4',INK,.5); }
  else if (a === 'lamellar'){ box('#b08a4a'); for (let y=top+2;y<bot;y+=2.2){ Ln(g,-hw,y,hw,y,'rgba(70,45,15,.6)',.6); for (let x=-5;x<6;x+=1.8) Ln(g,x,y-2,x,y,'rgba(70,45,15,.35)',.4); } }
  else if (a === 'scale'){ box('#c9a54a'); for (let y=top+1.6;y<bot;y+=2) for (let x=-5.4;x<6;x+=2){ g.beginPath(); g.arc(x+((Math.round(y))%2?1:0),y,1,0,Math.PI); g.strokeStyle='rgba(110,75,20,.7)'; g.lineWidth=.5; g.stroke(); } }
  else if (a === 'fur'){ box('#8a6a46'); for (let i=0;i<7;i++) P(g,[-6+i*2,bot,-5+i*2,bot+2,-4+i*2,bot],'#8a6a46',INK,.4); Ln(g,-3,top+2,-1,top+5,'rgba(60,40,20,.5)',.6); Ln(g,2,top+3,4,top+6,'rgba(60,40,20,.5)',.6); }
  else if (a === 'leather'){ box('#8b5a33'); Ln(g,-hw+1,top+1,-hw+1.4,bot-1,'rgba(240,210,160,.5)',.5); Ln(g,hw-1,top+1,hw-.6,bot-1,'rgba(240,210,160,.5)',.5); Ln(g,-hw,top+4,hw,top+4,'#5e3a1e',.8); }
}
// голова с причёской, бородой, шлемом; (hx,hy) — центр головы, r = 5
function hairCap(g,hx,hy,c){ P(g,[hx-5.6,hy+1,hx-6.2,hy-4.4,hx-3,hy-7.4,hx+2.4,hy-7.6,hx+5.6,hy-5,hx+5.8,hy-2.8,hx+2,hy-3.6,hx-2.6,hy-2.6,hx-4.4,hy+4,hx-6,hy+3],c,INK,.9); }
function crestOn(g,hx,hy,c,kind){
  if (!c) return;
  if (kind === 'brush'){ g.beginPath(); g.ellipse(hx-.4,hy-5.8,5.6,3.4,0,Math.PI,0); g.closePath(); g.fillStyle=c; g.fill(); g.strokeStyle=INK; g.lineWidth=.9; g.stroke(); for (let i=-4;i<=5;i+=1.8) Ln(g,hx-.4+i,hy-6,hx-.4+i*1.05,hy-8.4+Math.abs(i)*.35,mix(c,'#ffffff',.25),.5); }
  else if (kind === 'ridge'){ P(g,[hx-6,hy-4,hx-4,hy-10.5,hx+1,hy-12.4,hx+4.6,hy-9.6,hx+2,hy-6.2],c,INK,.8); for (let i=0;i<4;i++) Ln(g,hx-4+i*2,hy-9.6+i*.4,hx-3+i*2,hy-6,'rgba(0,0,0,.18)',.5); }
  else { curve(g,[hx-1,hy-6,hx-3.6,hy-11,hx-4,hy-16],c,1.7); curve(g,[hx+1,hy-6.4,hx+1,hy-12,hx+1.6,hy-17],c,1.6); }
}
function helmetOn(g,s,hx,hy){
  const h = s.helmet || 'none', cr = s.crest, hair = col(s.hair,'#3b2a1a');
  if (h === 'none'){ if (s.hair !== null) hairCap(g,hx,hy,hair); if (cr) crestOn(g,hx,hy+2,cr,'plume'); return; }
  if (h === 'roman'){
    g.beginPath(); g.arc(hx,hy-.8,5.7,Math.PI,0); g.closePath(); g.fillStyle='#c9ced4'; g.fill(); g.strokeStyle=INK; g.lineWidth=1; g.stroke();
    P(g,[hx-5.7,hy-.8,hx-8,hy+2.2,hx-5.4,hy+1.4],'#aeb4bb',INK,.8); P(g,[hx+2.2,hy-.8,hx+5.2,hy-.8,hx+4,hy+3.6,hx+2.4,hy+2.8],'#aeb4bb',INK,.8);
    crestOn(g,hx,hy,cr,'brush'); return; }
  if (h === 'corinthian'){
    g.beginPath(); g.arc(hx,hy-.6,6,Math.PI,0); g.lineTo(hx+6,hy+4.6); g.lineTo(hx+3.4,hy+5); g.lineTo(hx+3,hy+1); g.lineTo(hx+1,hy+.6); g.lineTo(hx-1,hy+5.4); g.lineTo(hx-6,hy+5); g.closePath();
    g.fillStyle=BRONZE; g.fill(); g.strokeStyle=INK; g.lineWidth=1; g.stroke();
    P(g,[hx+1.6,hy-1.4,hx+5.8,hy-1.2,hx+5.6,hy+.2,hx+1.8,hy+.2],'#2a1c10'); Ln(g,hx-5,hy-2.4,hx+5.4,hy-2.4,'rgba(255,240,190,.5)',.7);
    crestOn(g,hx,hy,cr || '#b8281e','ridge'); return; }
  if (h === 'phrygian'){ const c = cr && cr !== null ? BRONZE : col(s.trim, '#b8281e');
    P(g,[hx-5.8,hy+1,hx-6,hy-4,hx-2.6,hy-8,hx+3.4,hy-9.6,hx+6.6,hy-7.4,hx+4,hy-6.2,hx+5.8,hy-2,hx+5.8,hy+.4],c,INK,1); Ln(g,hx-6,hy+.6,hx+5.8,hy+.4,shadeOf(c,.7),1.2); return; }
  if (h === 'conical'){ P(g,[hx-5.4,hy-.6,hx+.4,hy-10.4,hx+6,hy-.6],STEEL,INK,1); Ln(g,hx-5.6,hy-.6,hx+6.2,hy-.6,STEEL2,1.2); RR(g,hx+3.6,hy-1,1.4,4.4,.4,STEEL2,INK,.4); if (cr) crestOn(g,hx,hy-3,cr,'plume'); return; }
  if (h === 'kettle'){
    g.beginPath(); g.arc(hx,hy-.6,5.9,Math.PI,0); g.closePath(); g.fillStyle=BRONZE; g.fill(); g.strokeStyle=INK; g.lineWidth=1; g.stroke();
    Ln(g,hx-6.6,hy-.4,hx+6.8,hy-.4,'#9c7426',1.4); E(g,hx,hy-7,1.3,1.6,BRONZE,INK,.6); if (cr) crestOn(g,hx,hy,cr,'brush'); return; }
  if (h === 'rus'){
    P(g,[hx-5.8,hy,hx-5,hy-5,hx-1.6,hy-8.6,hx+.4,hy-13,hx+2,hy-8.6,hx+5.4,hy-5,hx+6,hy],STEEL,INK,1);
    Ln(g,hx-5.9,hy,hx+6.1,hy,'#b4852b',1.3); Ln(g,hx+.4,hy-13,hx+.4,hy-15.4,INK,1);
    P(g,[hx-6,hy,hx-6.6,hy+5.6,hx-3,hy+6.4,hx-3.4,hy+1],'#aeb4bb',INK,.6); for (let y=hy+1.4;y<hy+6;y+=1.4) E(g,hx-5,y,.4,.4,STEEL2);
    if (cr) Ln(g,hx+.4,hy-15,hx-1,hy-18,cr,1.4); return; }
  if (h === 'furHat'){ const c = col(cr, col(s.trim, '#b8281e'));
    g.beginPath(); g.arc(hx,hy-1.4,5.4,Math.PI,0); g.closePath(); g.fillStyle=c; g.fill(); g.strokeStyle=INK; g.lineWidth=.9; g.stroke();
    RR(g,hx-6.6,hy-2.4,13.4,3.4,1.6,'#6b4a2a',INK,.8); for (let x=-6;x<7;x+=1.6) Ln(g,hx+x,hy-2.2,hx+x+.4,hy+.8,'rgba(40,25,10,.45)',.5); return; }
  if (h === 'turban'){ const c = col(cr, '#f2ece0');
    E(g,hx,hy-3.6,6.6,4.4,c,INK,1); Ln(g,hx-6,hy-2.6,hx+6.2,hy-5,shadeOf(c,.82),1); Ln(g,hx-5.6,hy-5.4,hx+5,hy-1.4,shadeOf(c,.82),.9); E(g,hx+1,hy-7.8,1.6,1.4,shadeOf(c,.9),INK,.5); return; }
  if (h === 'hood'){ const c = col(s.cloak, shadeOf(col(s.tunic,'#555'),.75));
    P(g,[hx-6.6,hy+4,hx-7.4,hy-3,hx-4,hy-9.4,hx+2,hy-10,hx+6.6,hy-5,hx+7,hy,hx+4.6,hy-3,hx,hy-6,hx-3.6,hy-3,hx-4,hy+4],c,INK,1); return; }
  if (h === 'wolf'){
    P(g,[hx-6.8,hy+1,hx-6.6,hy-4.5,hx-3.8,hy-7.6,hx+1.4,hy-7.8,hx+5,hy-5.4,hx+8.4,hy-3,hx+5.2,hy-2,hx+1,hy-3.4,hx-3.6,hy-2.6,hx-6.4,hy+4.5,hx-8.2,hy+3.5],'#7b5a3d',INK,1);
    P(g,[hx-4,hy-7,hx-3.2,hy-11,hx-.8,hy-7.6],'#7b5a3d',INK,.8); P(g,[hx,hy-7.8,hx+1.6,hy-11.4,hx+2.9,hy-7.3],'#7b5a3d',INK,.8); E(g,hx+6.6,hy-3.2,.6,.6,INK); return; }
  if (h === 'greatHelm'){
    RR(g,hx-6,hy-7.6,12.2,13.4,1.6,STEEL,INK,1); Ln(g,hx-6,hy-7.6,hx+6.2,hy-7.6,STEEL2,1.4);
    Ln(g,hx+.6,hy-1.6,hx+6.2,hy-1.6,'#2a2420',1.4); Ln(g,hx+3.4,hy-1.6,hx+3.4,hy+4,'#2a2420',.9); for (let y=hy+1.4;y<hy+5;y+=1.6) E(g,hx+5,y,.35,.35,'#2a2420');
    if (cr) { P(g,[hx-4,hy-7.6,hx-2,hy-12,hx+2,hy-12.6,hx+3,hy-7.6],cr,INK,.8); } return; }
  if (h === 'tiara'){ const c = col(cr, GOLD);
    P(g,[hx-5.6,hy-1,hx-5,hy-10,hx+5.4,hy-10,hx+6,hy-1],c,INK,1); for (let x=-4;x<5;x+=2.6) P(g,[hx+x,hy-10,hx+x+1.3,hy-12.6,hx+x+2.6,hy-10],c,INK,.6);
    Ln(g,hx-5.6,hy-3,hx+6,hy-3,shadeOf(c,.75),1); return; }
  if (s.hair !== null) hairCap(g,hx,hy,hair);
}
function face(g,s,hx,hy){
  const skin = col(s.skin, SKIN), hair = col(s.hair,'#3b2a1a');
  if (s.halo) { const hc = col(s.halo,'#ffd700'); E(g,hx-1,hy-1,9.4,9.4,rgba(hc,.32),hc,1.3); }
  head(g,hx,hy,5,skin);
  if (s.beard) P(g,[hx-2,hy+1,hx+4.6,hy+1.6,hx+5.2,hy+4,hx+1.4,hy+5.2,hx-3.6,hy+3.6],hair,INK,.7);
  helmetOn(g,s,hx,hy);
  if (s.eyepatch) { Ln(g,hx-5,hy-1.8,hx+5.2,hy+.2,'#1a120d',.9); E(g,hx+2.4,hy-.4,1.9,1.6,'#1a120d'); }
  if (s.crown) { const top = (s.helmet && s.helmet !== 'none') ? hy-8.2 : hy-5.6;
    P(g,[hx-5,top+3,hx-5,top-1,hx-3,top+1,hx-.6,top-2.4,hx+1.6,top+1,hx+4,top-1,hx+4.6,top+3],GOLD,INK,.8); E(g,hx-.6,top-2.4,.8,.8,'#c0231a'); }
}
const EMB = {
  lambda:(g,x,y,r,c)=>{ Ln(g,x-r*.45,y+r*.5,x,y-r*.55,c,r*.22); Ln(g,x,y-r*.55,x+r*.45,y+r*.5,c,r*.22); },
  cross:(g,x,y,r,c)=>{ Ln(g,x,y-r*.6,x,y+r*.6,c,r*.24); Ln(g,x-r*.45,y-r*.1,x+r*.45,y-r*.1,c,r*.24); },
  eagle:(g,x,y,r,c)=>{ P(g,[x-r*.7,y-r*.3,x-r*.15,y,x,y-r*.45,x+r*.15,y,x+r*.7,y-r*.3,x+r*.25,y+r*.25,x,y+r*.6,x-r*.25,y+r*.25],c); },
  wings:(g,x,y,r,c)=>{ for (const s of [-1,1]) { Ln(g,x+s*r*.15,y,x+s*r*.6,y-r*.45,c,r*.12); Ln(g,x+s*r*.15,y,x+s*r*.6,y+r*.45,c,r*.12); } E(g,x,y,r*.18,r*.18,c); },
  sun:(g,x,y,r,c)=>{ E(g,x,y,r*.3,r*.3,c); for (let i=0;i<8;i++){ const a=i*Math.PI/4; Ln(g,x+Math.cos(a)*r*.42,y+Math.sin(a)*r*.42,x+Math.cos(a)*r*.68,y+Math.sin(a)*r*.68,c,r*.1); } },
  boss:(g,x,y,r,c)=>{ E(g,x,y,r*.3,r*.3,c,INK,.5); E(g,x-r*.08,y-r*.08,r*.1,r*.1,'rgba(255,255,255,.6)'); },
  star:(g,x,y,r,c)=>{ star(g,x,y,r*.5,c); },
  lion:(g,x,y,r,c)=>{ E(g,x,y-r*.1,r*.36,r*.36,c); E(g,x,y-r*.1,r*.2,r*.2,shadeOf(c,.7)); Ln(g,x-r*.25,y+r*.2,x-r*.3,y+r*.55,c,r*.12); Ln(g,x+r*.25,y+r*.2,x+r*.3,y+r*.55,c,r*.12); },
  crescent:(g,x,y,r,c)=>{ g.beginPath(); g.arc(x,y,r*.42,.35*Math.PI,1.65*Math.PI); g.arc(x+r*.16,y,r*.32,1.6*Math.PI,.4*Math.PI,true); g.closePath(); g.fillStyle=c; g.fill(); }
};
function emblemOn(g,s,x,y,r,base){
  const e = s.shieldEmblem; if (!e || e === 'none' || !EMB[e]) return;
  const lum = (()=>{ const h = U.hex(base); return (h[0]*.3+h[1]*.59+h[2]*.11); })();
  EMB[e](g,x,y,r, lum > 150 ? '#7c1f16' : '#f2d27a');
}
function shieldOn(g,s,x,y,k){
  const t = s.shield || 'none'; if (t === 'none') return;
  const c = col(s.shieldColor, '#8c5a2b'), rim = '#e2c27a'; k = k || 1;
  g.save(); g.translate(x,y); g.scale(k,k);
  if (t === 'round'){ E(g,0,0,6.6,6.6,c,INK,1.1); E(g,0,0,4.8,4.8,null,rim,1); emblemOn(g,s,0,0,6,c); if (s.shieldEmblem==='none' || !s.shieldEmblem) E(g,0,0,1.6,1.6,rim,INK,.5); }
  else if (t === 'oval'){ E(g,0,0,4.6,10,c,INK,1.1); E(g,0,0,3.5,8.8,null,rim,.8); Ln(g,0,-8.8,0,8.8,rgba(rim,.8),.9); emblemOn(g,s,0,0,7,c); }
  else if (t === 'scutum'){ RR(g,-4.3,-10.5,8.6,21,2,c,INK,1.1); RR(g,-3.1,-9.3,6.2,18.6,1.2,null,'#e8b84a',.9); emblemOn(g,s,0,0,8,c); E(g,0,0,1.8,1.8,'#e8b84a',INK,.6); }
  else if (t === 'kite'){ P(g,[-4.8,-10,4.8,-10,4.4,-2,0,11,-4.4,-2],c,INK,1.1); P(g,[-3.6,-8.8,3.6,-8.8,3.2,-2.2,0,8.6,-3.2,-2.2],null,rim,.7); emblemOn(g,s,0,-2,7,c); }
  else if (t === 'almond'){ g.beginPath(); g.moveTo(0,-11); g.quadraticCurveTo(6.4,-7,4.6,1); g.quadraticCurveTo(2.6,8,0,11.5); g.quadraticCurveTo(-2.6,8,-4.6,1); g.quadraticCurveTo(-6.4,-7,0,-11); g.closePath(); g.fillStyle=c; g.fill(); g.strokeStyle=INK; g.lineWidth=1.1; g.stroke(); emblemOn(g,s,0,-1,7,c); }
  else if (t === 'tower'){ RR(g,-5.2,-12,10.4,24,1.2,c,INK,1.1); RR(g,-4,-10.8,8,21.6,.8,null,rim,.7); emblemOn(g,s,0,0,8,c); }
  else if (t === 'buckler'){ E(g,0,0,3.8,3.8,c,INK,1); E(g,0,0,1.4,1.4,rim,INK,.5); }
  else if (t === 'wicker'){ RR(g,-4.6,-11,9.2,22,1.6,c,INK,1.1); for (let yy=-9;yy<10;yy+=2.4) Ln(g,-4,yy,4,yy+1.2,rgba(shadeOf(c,.6),.7),.6); for (let xx=-3;xx<4;xx+=2) Ln(g,xx,-10.4,xx,10.4,rgba(shadeOf(c,.75),.6),.5); emblemOn(g,s,0,0,6,c); }
  g.restore();
}
// оружие в правой руке; (sx,sy) — плечо, dy — сдвиг по высоте (для всадника)
function armTo(g,s,x1,y1,x2,y2){ limb(g,x1,y1,x2,y2,col(s.skin,SKIN),2.3); }
function hand(g,s,x,y){ E(g,x,y,1.6,1.6,col(s.skin,SKIN),INK,.6); }
function weaponOn(g,s,dy,hasShield,rider){
  const w = s.weapon || 'none', y = dy;
  if (w === 'spear' || w === 'javelin'){
    if (hasShield && !rider) return;  // древко нарисовано за спиной
    if (w === 'javelin'){ armTo(g,s,4,-20.5+y,8.6,-27+y); spear(g,-7,-24.5+y,19,-33.5+y,WOOD,4.5,'#c3c8cd',1.3); hand(g,s,8.6,-27.4+y); }
    else { armTo(g,s,3,-20.5+y,8,-22+y); spear(g,4,-4+y*.4,9,-48+y,WOOD,4.4,'#d3d8de',1.4); hand(g,s,8.2,-22.4+y); }
    return; }
  if (w === 'pike'){ armTo(g,s,2,-20+y,7,-21+y); spear(g,-14,-19.2+y,25,-22+y,WOOD,5,'#dfe3e8',1.5); hand(g,s,7.2,-21.2+y); return; }
  if (w === 'sword'){ armTo(g,s,3,-20.5+y,8.4,-25+y); RR(g,7.2,-26.6+y,4,1.6,.6,'#b4852b',INK,.5); P(g,[8.6,-26.6+y,10.4,-26.6+y,10.2,-37.4+y,9.4,-39.4+y,8.6,-37.4+y],'#d3d8de',INK,.7); hand(g,s,9,-25.4+y); return; }
  if (w === 'saber'){ armTo(g,s,3,-20.5+y,8.4,-25+y); curve(g,[9,-26+y,13,-31+y,10.6,-39+y],'#d3d8de',1.8); Ln(g,7.4,-26+y,11,-26+y,'#b4852b',1.2); hand(g,s,9,-25.4+y); return; }
  if (w === 'axe'){ armTo(g,s,3,-20.5+y,8.4,-25+y); Ln(g,8.6,-22+y,10.4,-40+y,INK,2.4); Ln(g,8.6,-22+y,10.4,-40+y,WOOD,1.4); P(g,[10.2,-38+y,15.6,-41+y,16,-34.4+y,10.4,-35+y],'#c3c8cd',INK,.8); hand(g,s,9,-25.4+y); return; }
  if (w === 'mace'){ armTo(g,s,3,-20.5+y,8.4,-25+y); Ln(g,8.6,-22+y,10.2,-36+y,INK,2.2); Ln(g,8.6,-22+y,10.2,-36+y,WOOD,1.3); E(g,10.4,-37.6+y,2.8,2.8,'#a9afb6',INK,.8); for (let a=0;a<6;a++){ const an=a*Math.PI/3; Ln(g,10.4+Math.cos(an)*2.6,-37.6+y+Math.sin(an)*2.6,10.4+Math.cos(an)*4,-37.6+y+Math.sin(an)*4,INK,.9); } hand(g,s,9,-25.4+y); return; }
  if (w === 'bow'){ armTo(g,s,3,-20.5+y,10.2,-21.5+y); curve(g,[9.6,-32+y,17.8,-21.5+y,9.6,-11+y],'#6b3f1e',1.9); Ln(g,9.6,-32+y,3.4,-21.5+y,'#f1e9d6',.6); Ln(g,3.4,-21.5+y,9.6,-11+y,'#f1e9d6',.6); spear(g,3.4,-21.5+y,19,-21.5+y,'#5a3a1a',3,'#c3c8cd',.9); hand(g,s,10.4,-21.5+y); return; }
  if (w === 'crossbow'){ armTo(g,s,3,-20.5+y,8,-21+y); RR(g,1,-22.6+y,15,2.6,.8,'#8a5a2b',INK,.8); curve(g,[13,-29+y,15.6,-21.4+y,13,-14+y],'#5a5f66',1.6); Ln(g,13,-29+y,13,-14+y,'#efe6d2',.5); hand(g,s,8,-21.2+y); return; }
  if (w === 'sling'){ armTo(g,s,2.6,-21+y,5,-31+y); hand(g,s,5,-31.2+y); g.beginPath(); g.arc(8,-33+y,3.4,0,TAU); g.strokeStyle='#5a3a1a'; g.lineWidth=.8; g.stroke(); E(g,11.2,-34+y,1.5,1.5,'#7a746a',INK,.4); return; }
  if (w === 'trumpet'){ const arc=(c,lw)=>{ g.beginPath(); g.arc(-2.5,-21+y,12,.3*Math.PI,1.36*Math.PI); g.strokeStyle=c; g.lineWidth=lw; g.lineCap='round'; g.stroke(); }; arc(INK,3.8); arc('#d4a634',2.3); arc('rgba(255,240,180,.75)',.7); Ln(g,-13.6,-21+y,7.6,-21+y,WOOD,1.2); armTo(g,s,3,-20.5+y,6.4,-14+y); return; }
  if (w === 'musket'){ armTo(g,s,3,-20.5+y,8,-19+y); Ln(g,-6,-12+y,20,-28+y,INK,2.6); Ln(g,-6,-12+y,8,-20.6+y,'#7a4a24',1.8); Ln(g,8,-20.6+y,20,-28+y,'#5a5f66',1.3); E(g,-6,-12+y,2,1.4,'#7a4a24',INK,.6); hand(g,s,8,-19.6+y); return; }
  if (w === 'torch'){ armTo(g,s,3,-20.5+y,8.4,-27+y); Ln(g,8.6,-24+y,9.6,-36+y,INK,2.2); Ln(g,8.6,-24+y,9.6,-36+y,WOOD,1.3); P(g,[7,-36+y,9.8,-44+y,12.4,-36.4+y,9.8,-34+y],'#f39c2a',INK,.6); P(g,[8.6,-36.4+y,9.8,-41+y,11,-36.6+y],'#ffe07a'); hand(g,s,9,-27.4+y); return; }
  if (w === 'scythe'){ armTo(g,s,3,-20.5+y,8,-22+y); Ln(g,6,-2+y*.4,9,-44+y,INK,2.2); Ln(g,6,-2+y*.4,9,-44+y,WOOD,1.3); curve(g,[9,-43+y,16,-46+y,20,-38+y],'#c3c8cd',1.6); hand(g,s,8,-22.4+y); return; }
  if (w === 'banner'){ const fc = col(s.cloak, col(s.tunic,'#b8281e'));
    Ln(g,-9,-6+y*.4,-9,-56+y,INK,2.6); Ln(g,-9,-6+y*.4,-9,-56+y,'#6b4423',1.5); P(g,[-9,-53+y,5,-53+y,3,-48+y,5,-43+y,-9,-43+y],fc,INK,1); Ln(g,-9,-43+y,5,-43+y,GOLD,1); E(g,-9,-58+y,2.4,2.4,GOLD,INK,.7);
    armTo(g,s,2,-20.5+y,7,-15+y); return; }
  // none: рука вдоль тела
  armTo(g,s,3,-20.5+y,6,-14+y);
}
function poleBehind(g,s,dy){
  const w = s.weapon;
  if ((w === 'spear' || w === 'javelin') && s.shield && s.shield !== 'none') { spear(g,-9.5,-4+dy*.3,1.5,-44+dy,WOOD,4,'#c3c8cd',1.4); }
  if (w === 'bow'){ P(g,[-9.2,-28.6+dy,-5.6,-29.4+dy,-3,-12.6+dy,-6.6,-11.8+dy],'#7a4a24',INK,1); Ln(g,-8.3,-28.8+dy,-10,-33+dy,'#efe7d4',1.6); Ln(g,-6.8,-29.2+dy,-7.4,-33.6+dy,'#c0392b',1.6); }
  if (w === 'musket'){ E(g,-6,-14+dy,2,2.6,'#8a6a3a',INK,.6); }
}
// верх тела (туника выше пояса, доспех, голова, оружие, щит); dy — сдвиг вверх для всадника
function upper(g,s,dy,rider){
  const tun = col(s.tunic,'#a33a22'), trim = col(s.trim,null), hasShield = s.shield && s.shield !== 'none';
  const top = -23.5+dy, bot = rider ? -12+dy : -14+dy;
  if (rider) { P(g,[-4,top+1,4,top+1,4.4,bot+1,-4.4,bot+1],tun,INK,1); if (trim) Ln(g,-4.2,bot,4.2,bot,trim,1.2); }
  torsoArmor(g,s,top,bot);
  Ln(g,-6.4,bot+.6,6.4,bot+.6,'#6b4423',1.4);
  face(g,s,1,-28+dy);
  weaponOn(g,s,dy,hasShield,rider);
  if (hasShield) shieldOn(g,s,rider ? -4.6 : 6.6, rider ? -24+dy : -17+dy, rider ? .62 : 1);
}
function humanFig(g,s,f,cx){
  const tun = col(s.tunic,'#a33a22'), trim = col(s.trim,null), skin = col(s.skin,SKIN);
  if (s.cloak) cloakBack(g,s.cloak,0);
  poleBehind(g,s,0);
  const med = cx && cx.era === 'medieval', heavy = s.armor === 'mail' || s.armor === 'plate' || s.armor === 'lamellar' || s.armor === 'scale';
  const legCol = med && heavy ? '#a3aab2' : (s.armor === 'fur' || s.armor === 'leather' || s.helmet === 'furHat' || s.helmet === 'turban') ? shadeOf(tun,.68) : skin;
  legs(g,f,legCol, med ? '#3a2a1e' : '#5a3a1a');
  const long = (s.helmet === 'tiara' || s.helmet === 'turban') && (!s.armor || s.armor === 'none');
  tunic(g,tun,trim,-23,long ? -4 : -9); shadeTorso(g,-23,long ? -4 : -9);
  upper(g,s,0,false);
}
function riderFig(g,s,f,cx){
  const hs = s.horse || {}, hc = col(hs.color,'#8b5a2b');
  if (s.cloak) cloakBack(g,s.cloak,-10);
  poleBehind(g,s,-8);
  horse(g,f,hc,shadeOf(hc,.45),1);
  if (hs.barding) { const b = col(hs.barding,'#b8281e'); P(g,[-10,-24,9,-24,10.4,-14,-11.4,-14],b,INK,1); for (let x=-10;x<10;x+=2.4) Ln(g,x,-14,x+.2,-12.6,GOLD,1); }
  limb(g,-1.4,-20.6,4,-13.4,col(s.tunic,'#a33a22'),2.8);
  upper(g,s,-8,true);
}
function mini(g,s,x,k,flip){ g.save(); g.translate(x,0); g.scale(k*(flip?-1:1),k); const m = Object.assign({},s,{shield:'none',weapon:'none',cloak:null}); humanFig(g,m,-1,null); g.restore(); }
function beastFig(g,s,f,cx){
  const b = s.beast || 'elephant';
  if (b === 'elephant'){
    const dx = f===1 ? 2.4 : f===0 ? -1.6 : 0, hide = '#8a8d96', hide2 = '#6c6f78';
    curve(g,[-20,-25,-24,-21,-23.4,-14],INK,1,false);
    limb(g,-12,-15,-13+dx,-1,hide2,5.6); limb(g,10,-15,11-dx,-1,hide2,5.6);
    E(g,-1,-23,20.5,13.4,hide,INK,1.2); E(g,-1,-17.5,17,7,'rgba(0,0,0,.08)');
    const cl = col(s.tunic,'#b3261e'); P(g,[-14,-34.5,10.6,-34.5,9,-25.8,-12.4,-25.8],cl,INK,1); for (let x=-12;x<9;x+=2.4) Ln(g,x,-25.8,x+.2,-24.4,col(s.trim,GOLD),1);
    if (s.tower){ RR(g,-9.6,-45,16,10.6,1,'#8b5a2b',INK,1); for (let x=-9.6;x<6;x+=4) RR(g,x,-47.6,2.6,3,.4,'#8b5a2b',INK,.7); Ln(g,-9.6,-41,6.4,-41,'#6b4423',.8);
      g.save(); g.translate(-1.8,-49); g.scale(.6,.6); face(g,s,0,0); g.restore(); spear(g,1.4,-42,7.8,-57,WOOD,3,'#c3c8cd',1); }
    limb(g,-7.6,-15,-8.6-dx,0,hide,6.6); limb(g,13,-15,14+dx*.8,0,hide,6.6);
    for (const x of [-8.6-dx,14+dx*.8]) { E(g,x-1.6,-.8,.9,.7,'#e8e2d4'); E(g,x+1.4,-.8,.9,.7,'#e8e2d4'); }
    E(g,19,-27,9.8,9.4,hide,INK,1.2);
    curve(g,[25.6,-24.6,32.4,-16.4+(f===1?1:0),29.8,-6.4,29,-2,32.4,-3.2-(f===1?1:0)],hide,4.4);
    curve(g,[23.4,-20.6,30.6,-19,33,-24.4],'#f4ecd8',2.1);
    E(g,12.6,-26.6,5.8,8.4,'#7b7e87',INK,1); E(g,12.4,-26.2,3.6,5.8,'#a9867f');
    E(g,22.4,-29.6,1.5,1.6,'#fff'); E(g,22.8,-29.4,1,1.1,INK);
    g.save(); g.translate(13.4,-41.4); g.scale(.6,.6); face(g,Object.assign({},s,{helmet:'turban',crest:null}),0,0); g.restore();
    return; }
  if (b === 'camel'){
    const dx = f===1 ? 2.2 : f===0 ? -1.4 : 0, hc = '#c9a46a', hc2 = shadeOf(hc,.82);
    limb(g,-9,-16,-10+dx,-1,hc2,3); limb(g,9,-16,10-dx,-1,hc2,3);
    E(g,0,-21,13,7.6,hc,INK,1.1); E(g,-2,-29,6.6,5.4,hc,INK,1);
    curve(g,[10,-22,15,-28,15.4,-36],hc,4.2); E(g,18,-37.4,4.4,2.6,hc,INK,1,.25); eye(g,18.4,-38.4); Ln(g,13.6,-39.4,14.6,-41.6,INK,1);
    const cl = col(s.trim, col(s.tunic,'#b8281e')); P(g,[-8,-27,4,-27,5,-22,-9,-22],cl,INK,.8);
    limb(g,-6,-16,-7-dx,-1,hc,3.2); limb(g,7,-16,8+dx,-1,hc,3.2);
    curve(g,[-13,-22,-16,-18,-15,-13],INK,.9,false);
    g.save(); g.translate(-1,-12); g.scale(.82,.82); limb(g,-1.4,-20.6,3,-14,col(s.tunic,'#a33a22'),2.8); upper(g,s,-8,true); g.restore();
    return; }
  // wolfhound
  const dx = f===1 ? 2 : f===0 ? -1.4 : 0, dc = col(s.tunic,'#8a7a66');
  limb(g,-7,-9,-9+dx,-1,shadeOf(dc,.8),2.2); limb(g,7,-9,8-dx,-1,shadeOf(dc,.8),2.2);
  curve(g,[-10,-12,-15,-16,-17,-13],dc,1.8); E(g,0,-12,10,4.6,dc,INK,1);
  P(g,[7,-14,11,-20,16,-19,17,-15.4,12,-13],dc,INK,.9); P(g,[11,-20,11.6,-23.4,13.2,-20],dc,INK,.7); eye(g,14,-18);
  RR(g,6.6,-15.6,4,2,.8,col(s.trim,'#b8281e'),INK,.5);
  limb(g,-5,-9,-6-dx,-1,dc,2.4); limb(g,6,-9,6+dx,-1,dc,2.4);
}
function machineFig(g,s,f,cx){
  const m = s.machine || 'ballista', wood = '#8a5a2b', wood2 = '#a86e35';
  const wheel = (x,y,r) => { E(g,x,y,r,r,'#6b4423',INK,1); E(g,x,y,r*.35,r*.35,'#4a3020',INK,.6); for (let a=0;a<6;a++){ const an=a*Math.PI/3; Ln(g,x+Math.cos(an)*r*.35,y+Math.sin(an)*r*.35,x+Math.cos(an)*r*.9,y+Math.sin(an)*r*.9,'#4a3020',.7); } };
  if (m === 'ballista'){
    mini(g,s,-21,.52,false);
    limb(g,-4,-12,-13,-.5,wood,2.4); limb(g,4,-12,13,-.5,wood,2.4); limb(g,-10,-4,10,-4,wood,1.6);
    P(g,[-3.6,-2,3.6,-2,2.6,-29,-2.6,-29],wood2,INK,1);
    limb(g,-8,-25,-20,-17,wood,2.4); limb(g,8,-25,20,-17,wood,2.4); Ln(g,-20,-17,0,-8.5,'#efe6d2',.8); Ln(g,20,-17,0,-8.5,'#efe6d2',.8);
    RR(g,-12.5,-29.5,25,7.5,1.5,'#b07639',INK,1); E(g,-8,-25.8,3.2,5.4,'#4a3424',INK,.9); E(g,8,-25.8,3.2,5.4,'#4a3424',INK,.9);
    mini(g,s,21,.52,true); return; }
  if (m === 'catapult'){
    mini(g,s,-20,.52,false);
    RR(g,-14,-9,28,5,1,wood2,INK,1); wheel(-9,-3,3.6); wheel(9,-3,3.6);
    P(g,[-3,-9,3,-9,1.6,-22,-1.6,-22],wood,INK,.9); Ln(g,-2,-20,2,-20,INK,1);
    limb(g,0,-12,-14,-32,'#7a5230',2); E(g,-15,-33,4,2.6,'#6b4423',INK,.8); E(g,-15,-35,2.4,2,'#9a958c',INK,.7);
    mini(g,s,20,.52,true); return; }
  if (m === 'trebuchet'){
    mini(g,s,-22,.5,false);
    RR(g,-15,-6,30,4,1,wood2,INK,1); P(g,[-10,-6,-2,-40,2,-40,10,-6,6,-6,0,-34,-6,-6],wood,INK,1);
    limb(g,0,-38,-18,-56,'#7a5230',2.2); limb(g,0,-38,9,-28,'#7a5230',2.2); RR(g,5,-30,9,8,1,'#7d7a72',INK,1);
    Ln(g,-18,-56,-20,-46,'#efe6d2',.7); E(g,-20,-45,2.4,2,'#9a958c',INK,.6);
    mini(g,s,22,.5,true); return; }
  if (m === 'cannon'){
    mini(g,s,-19,.52,false);
    RR(g,-12,-12,26,6,3,'#4a4a4f',INK,1); E(g,14,-9,2,3.4,'#2c2c30',INK,.7); Ln(g,-10,-10.4,10,-10.4,'rgba(255,255,255,.25)',.8);
    P(g,[-12,-8,4,-8,2,-3,-10,-3],wood,INK,.9); wheel(-4,-4,4.6);
    mini(g,s,20,.52,true); return; }
  if (m === 'gulyayGorod'){
    RR(g,-17,-30,34,26,1.4,'#a8763e',INK,1.1); for (let x=-15;x<16;x+=4.4) Ln(g,x,-30,x,-4,'rgba(70,40,15,.55)',.8);
    for (const x of [-9,0,9]) RR(g,x-1.6,-21,3.2,3.2,.6,'#2a1a0e');
    P(g,[-17,-30,-14,-34,-11,-30,-8,-34,-5,-30,-2,-34,1,-30,4,-34,7,-30,10,-34,13,-30,17,-30],'#9a6a34',INK,.8);
    wheel(-11,-4,4.4); wheel(11,-4,4.4); Ln(g,-6,-18,-14,-24,'#5a5f66',1.2); return; }
  if (m === 'fireSiphon'){
    mini(g,s,-18,.54,false);
    RR(g,-9,-16,14,13,3,'#b4852b',INK,1); E(g,-2,-16,7,2.2,'#d4a634',INK,.8); Ln(g,4,-12,18,-16,INK,3); Ln(g,4,-12,18,-16,'#9c7426',1.8);
    P(g,[18,-17.6,25,-21,26,-14,19,-14.6],'#f39c2a',INK,.6); P(g,[19.4,-17,23.4,-18.6,23.6,-15.6],'#ffe07a');
    mini(g,s,10,.5,true); return; }
  if (m === 'ram'){
    P(g,[-18,-6,-14,-26,14,-26,18,-6],'#8a5a2b',INK,1.1); for (let x=-14;x<15;x+=4) Ln(g,x,-26,x+(x<0?-2:2),-6,'rgba(60,35,15,.5)',.7);
    P(g,[-20,-24,0,-34,20,-24],'#6e4a2a',INK,1); RR(g,-22,-16,40,5,2.4,'#7a5230',INK,1); P(g,[18,-17,24,-13.6,18,-10],'#8e959e',INK,.8);
    wheel(-10,-4,4); wheel(10,-4,4); return; }
  if (m === 'siegeTower'){
    P(g,[-14,-4,-11,-70,11,-70,14,-4],'#9a6a34',INK,1.1); for (let y=-62;y<-4;y+=11) Ln(g,-13,y,13,y,'rgba(60,35,15,.6)',1); for (const x of [-6,6]) Ln(g,x,-70,x,-4,'rgba(60,35,15,.35)',.8);
    RR(g,-15,-74,30,5,1,'#7a5230',INK,1); for (let x=-14;x<15;x+=5) RR(g,x,-78,3,4,.5,'#7a5230',INK,.6);
    RR(g,-5,-58,10,12,1,'#3a2414',INK,.8); P(g,[-12,-46,-12,-24,-2,-36],'rgba(200,180,140,.35)');
    wheel(-9,-4,4.6); wheel(9,-4,4.6); return; }
}
function chariotFig(g,s,f,cx){
  const hs = s.horse || {}, hc = col(hs.color,'#8b5a2b');
  g.save(); g.translate(10,0); horse(g,f,hc,shadeOf(hc,.45),.9); g.restore();
  Ln(g,-6,-16,12,-17,'#6b4423',1.4);
  P(g,[-16,-22,-4,-22,-2,-8,-16,-8],col(s.trim,'#b4852b'),INK,1);
  E(g,-10,-6,6,6,'#6b4423',INK,1.1); E(g,-10,-6,2,2,'#4a3020',INK,.6); for (let a=0;a<4;a++){ const an=a*Math.PI/4+(f===1?.4:0); Ln(g,-10+Math.cos(an)*5.6,-6+Math.sin(an)*5.6,-10-Math.cos(an)*5.6,-6-Math.sin(an)*5.6,'#4a3020',.7); }
  if (s.scythes) { P(g,[-4,-6.6,8,-5,-4,-5.2],'#c3c8cd',INK,.6); }
  g.save(); g.translate(-9,4); upper(g,s,-14,true); g.restore();
}
T.figure = function(g,s,f,cx){
  s = s || {};
  const k = s.kind || 'human';
  if (k === 'rider') riderFig(g,s,f,cx);
  else if (k === 'beast') beastFig(g,s,f,cx);
  else if (k === 'machine') machineFig(g,s,f,cx);
  else if (k === 'chariot') chariotFig(g,s,f,cx);
  else humanFig(g,s,f,cx);
};
// рамка: w,h — размер холста, ay — где ноги, top — высота видимой макушки над ногами, foot — сдвиг ног от логической точки
T.figBox = function(s){
  s = s || {}; const k = s.kind || 'human';
  const tall = s.weapon === 'banner' || s.crest || s.helmet === 'rus' || s.helmet === 'tiara';
  if (k === 'rider') return {w:66, h:tall ? 76 : 68, ay:tall ? 70 : 62, top:tall ? 58 : 48, foot:8};
  if (k === 'beast') { if (s.beast === 'camel') return {w:70,h:66,ay:60,top:52,foot:9}; if (s.beast === 'wolfhound') return {w:52,h:40,ay:36,top:24,foot:6}; return {w:80,h:72,ay:66,top:58,foot:11}; }
  if (k === 'machine') { if (s.machine === 'siegeTower') return {w:60,h:88,ay:84,top:80,foot:10}; if (s.machine === 'trebuchet') return {w:70,h:66,ay:62,top:58,foot:9}; return {w:70,h:52,ay:46,top:36,foot:8}; }
  if (k === 'chariot') return {w:76,h:62,ay:56,top:46,foot:9};
  return {w:64, h:tall ? 66 : 60, ay:tall ? 60 : 54, top:tall ? 46 : 40, foot:7};
};

/* ---------- портрет-медальон по спрайту ---------- */
T.bust = function(g,s){
  s = s || {};
  const gr = g.createRadialGradient(-10,-14,4,0,0,60); gr.addColorStop(0,'#f2d79a'); gr.addColorStop(1,'#c7863f');
  E(g,0,0,60,60,gr,'#8a5a1e',3); E(g,0,0,55,55,null,'#f3dc9a',1.4);
  g.save(); g.beginPath(); g.arc(0,0,54,0,TAU); g.clip();
  const p = Object.assign({}, s, {weapon:'none', shield:'none'});
  const tun = col(p.tunic,'#a33a22'), cl = p.cloak ? col(p.cloak,'#6b1d7a') : null;
  if (cl) P(g,[-46,60,-40,30,-20,18,20,18,40,30,46,60],cl,INK,1.6);
  P(g,[-34,60,-30,26,-14,18,14,18,30,26,34,60],tun,INK,1.6);
  g.save(); g.scale(2.6,2.6); g.translate(0,24);
  torsoArmor(g,p,-23.5,-12);
  face(g,p,1,-28);
  g.restore();
  g.restore();
};

/* ---------- иконки ---------- */
function medal(g,c1,c2,edge){ const gr=g.createRadialGradient(-6,-6,2,0,0,20); gr.addColorStop(0,c1); gr.addColorStop(1,c2); E(g,0,0,19,19,gr,edge||null,edge?1.2:0); }
T.art = {
  ability: {
    slow: g=>{ medal(g,'#5d86b8','#2c4a74'); g.save(); g.scale(1.5,1.5); RR(g,-6,-9,12,2.4,1,'#c99a4a',INK,.7); RR(g,-6,6.6,12,2.4,1,'#c99a4a',INK,.7); P(g,[-4.6,-6.6,4.6,-6.6,1,0,4.6,6.6,-4.6,6.6,-1,0],'rgba(232,244,255,.95)',INK,.8); P(g,[-2.6,-3.6,2.6,-3.6,0,-.6],'#e5c46a'); P(g,[-3.8,6.6,3.8,6.6,0,2.6],'#e5c46a'); Ln(g,0,-.6,0,5,'#e5c46a',.6); g.restore(); },
    buff: g=>{ medal(g,'#c7432f','#7c1f16'); P(g,[3,-15,-7,1,-1,1,-4,15,7,-3,1,-3],'#f2c94e',INK,1); for (const s of [-1,1]) { P(g,[s*5,-2,s*15,-8,s*13,-3,s*16,-1,s*6,2],'#f2c94e',INK,.8); } },
    repair: g=>{ medal(g,'#6f9e4f','#3f6a26'); P(g,[-11,8,-11,-2,-8,-2,-8,-5,-5,-5,-5,-2,-2,-2,-2,-5,1,-5,1,-2,4,-2,4,-5,7,-5,7,-2,11,-2,11,8],'#e3cba2',INK,1); RR(g,-2.6,1,5.2,7,1,'#6b4423',INK,.7); RR(g,6,-14,4,10,1,'#fff6e6',INK,.6); RR(g,3,-11,10,4,1,'#fff6e6',INK,.6); },
    rain: g=>{ medal(g,'#e0a03a','#9a4a14'); for (const [x,y] of [[-9,-12],[-2,-9],[5,-13],[11,-7],[-6,0],[3,1]]) { Ln(g,x,y,x-3,y+10,INK,2.2); Ln(g,x,y,x-3,y+10,'#fff2c8',1.1); P(g,[x-3.6,y+11.6,x-1.4,y+8.6,x-4.6,y+8.4],'#fff2c8',INK,.4); } },
    rally: g=>{ medal(g,'#7d5ab0','#45286e'); Ln(g,-6,12,-6,-14,INK,2.4); Ln(g,-6,12,-6,-14,'#c99a4a',1.4); P(g,[-6,-13,10,-10,6,-5,10,0,-6,-3],'#e2b44a',INK,1); star(g,2,-6,3.4,'#fff6e6'); }
  },
  locked(name){
    const n = String(name||'').toLowerCase();
    if (/пушк|тюфяк|артилл|пищал|мортир/.test(n)) return g=>{ E(g,-6,6,6,6,'#7a5a3a',INK,1); E(g,-6,6,1.6,1.6,INK); P(g,[-14,6,6,-2,8,2,-12,10],'#8a5a2b',INK,1); RR(g,-8,-9,22,8,3.6,'#3d3d42',INK,1); E(g,14,-5,1.8,4,'#1f1f22'); };
    if (/рыцар|латни|катафракт|стремен/.test(n)) return g=>{ RR(g,-9,-12,18,22,4,'#b9bec4',INK,1.1); Ln(g,-7,-3,7,-3,INK,1.8); Ln(g,0,-11,0,8,'rgba(0,0,0,.35)',1); for (let i=-1;i<=1;i++) E(g,i*3.6,3,.9,.9,INK); P(g,[0,-12,-2,-20,4,-17],'#b3261e',INK,.8); };
    if (/арбалет|самостр/.test(n)) return g=>{ curve(g,[-14,-4,0,-14,14,-4],'#6b3f1e',2.2); Ln(g,-14,-4,14,-4,'#efe6d2',.7); RR(g,-2,-8,4,20,1,'#8a5a2b',INK,1); spear(g,0,6,0,-14,'#5a3a1a',3,'#c3c8cd',1); };
    if (/пулем|винтов|ружь|автомат|мушкет|стрельц/.test(n)) return g=>{ RR(g,-14,-6,22,7,2,'#4a4a4f',INK,1); RR(g,8,-4.4,7,3.6,1,'#2c2c30',INK,.8); limb(g,-6,1,-12,12,'#5a5a60',1.6); limb(g,-6,1,0,12,'#5a5a60',1.6); RR(g,-4,1,8,6,1,'#6b6b4a',INK,.8); };
    if (/танк|самол|поезд|машин/.test(n)) return g=>{ RR(g,-14,-2,28,9,4,'#5d6b4a',INK,1); RR(g,-7,-9,14,7,2,'#6e7c58',INK,1); Ln(g,6,-6,17,-8,INK,2); for (let x=-10;x<12;x+=5) E(g,x,6,2.2,2.2,'#3a3a32',INK,.5); };
    if (/требуш|катапул|баллист/.test(n)) return g=>{ RR(g,-13,4,26,4,1,'#a86e35',INK,1); P(g,[-8,4,-1,-14,1,-14,8,4],'#8a5a2b',INK,1); limb(g,0,-12,-12,-18,'#7a5230',1.8); RR(g,5,-14,6,6,1,'#7d7a72',INK,.8); };
    if (/гуляй/.test(n)) return g=>{ RR(g,-14,-10,28,16,1,'#a8763e',INK,1); for (let x=-12;x<13;x+=4) Ln(g,x,-10,x,6,'rgba(70,40,15,.55)',.8); RR(g,-1.6,-5,3.2,3.2,.6,'#2a1a0e'); E(g,-8,8,3,3,'#6b4423',INK,.8); E(g,8,8,3,3,'#6b4423',INK,.8); };
    if (/варяг|викинг|наёмн/.test(n)) return g=>{ E(g,0,0,11,11,'#8c5a2b',INK,1.1); E(g,0,0,3,3,'#c3c8cd',INK,.6); Ln(g,-11,0,11,0,'rgba(240,220,170,.6)',1); Ln(g,0,-11,0,11,'rgba(240,220,170,.6)',1); };
    return g=>{ RR(g,-10,-12,20,24,3,'#e9dcc0',INK,1); g.fillStyle='#7c1f16'; g.font='700 18px '+FONT_D; g.textAlign='center'; g.textBaseline='middle'; g.fillText('?',0,1); };
  },
  lockOn(g){ for (let i=0;i<6;i++) E(g,-14+i*5.4,-10+i*4.4,2.4,1.5,null,'#6f6a62',1.1,.68); RR(g,6,3,10,8,1.4,'#9a948a',INK,.8); g.beginPath(); g.arc(11,3,3,Math.PI,0); g.strokeStyle=INK; g.lineWidth=1.4; g.stroke(); E(g,11,6.6,1,1.2,INK); },
  laurel(g,text){
    const gr = g.createRadialGradient(-8,-10,4,0,0,60); gr.addColorStop(0,'#fff6dc'); gr.addColorStop(1,'#e8d4a2');
    E(g,0,0,58,58,gr,'#b4852b',2.4);
    for (const s of [-1,1]) for (let i=0;i<13;i++){
      const a = Math.PI/2 + s*(.35 + i*.2), r = 40, x = Math.cos(a)*r, y = Math.sin(a)*r;
      for (const off of [-1,1]) { const la = a + s*Math.PI/2 + off*.55; E(g,x+Math.cos(la)*6,y+Math.sin(la)*6,7,2.8,i%2?'#5d7a3a':'#7d9a4a',INK,.9,la); }
    }
    for (const s of [-1,1]) { g.beginPath(); g.arc(0,0,40,Math.PI/2+s*.35,Math.PI/2+s*2.8,s<0); g.strokeStyle='#6b4423'; g.lineWidth=1.6; g.stroke(); }
    P(g,[-6,40,6,40,14,56,6,52,0,58,-6,52,-14,56],'#b3261e',INK,1.2);
    text = String(text||''); g.fillStyle='#8e2419'; g.textAlign='center'; g.textBaseline='middle'; g.font='700 '+(text.length > 3 ? 22 : text.length > 1 ? 28 : 36)+'px '+FONT_D; g.fillText(text,0,1);
    Ln(g,-20,-14,20,-14,'#b4852b',1); Ln(g,-20,15,20,15,'#b4852b',1);
  },
  gate(g){
    const gr = g.createRadialGradient(0,10,4,0,0,60); gr.addColorStop(0,'#ffb35a'); gr.addColorStop(.5,'#c9572e'); gr.addColorStop(1,'#5a2a18');
    E(g,0,0,58,58,gr,'#3a2616',2.4);
    g.save(); g.beginPath(); g.arc(0,0,57,0,TAU); g.clip();
    P(g,[-58,60,-58,-20,-34,-20,-34,60],'#cfa97a',INK,1.2); P(g,[34,60,34,-26,58,-26,58,60],'#cfa97a',INK,1.2);
    g.beginPath(); g.moveTo(-34,60); g.lineTo(-34,-6); g.arc(0,-6,34,Math.PI,0); g.lineTo(34,60); g.lineTo(26,60); g.lineTo(26,-6); g.arc(0,-6,26,0,Math.PI,true); g.lineTo(-26,60); g.closePath(); g.fillStyle='#e8d4ae'; g.fill(); g.strokeStyle=INK; g.lineWidth=1.4; g.stroke();
    P(g,[-26,60,-24,8,-2,14,-6,60],'#8a5a2b',INK,1.4); for (let x=-22;x<-6;x+=5) Ln(g,x,12,x+1,58,'rgba(40,20,5,.5)',1);
    P(g,[4,58,30,40,36,48,10,64],'#7a4a22',INK,1.4); Ln(g,10,56,32,42,'#3e2c1c',2);
    for (const [x,y,r] of [[-30,50,7],[-14,54,6],[18,54,8],[34,50,6],[0,56,5]]) P(g,[x-r,y+r*.6,x-r*.7,y-r*.5,x+r*.4,y-r*.7,x+r,y+r*.6],'#bfa37a',INK,1);
    for (const [x,y,r] of [[-14,-44,9],[4,-50,11],[20,-42,8]]) E(g,x,y,r,r*.8,'rgba(90,80,75,.55)');
    g.restore(); E(g,0,0,58,58,null,'#3a2616',2.4); E(g,0,0,55,55,null,'#e7c46c',1.2);
  },
  kind: {
    person: g=>{ medal(g,'#f3e2b8','#cfa560');
      g.save(); g.beginPath(); g.arc(0,0,18.6,0,TAU); g.clip();
      P(g,[-16,20,-12,8,-4,4,4,4,12,8,16,20],'#f4efe2',INK,1); P(g,[-12,8,-4,4,6,16,2,20,-8,12],'#b3261e',INK,.9);
      RR(g,-3,-1,6,6,2,SKIN,INK,.9); E(g,0,-7,7.6,8.6,SKIN,INK,1.1); E(g,7,-6.4,1.4,1.6,SKIN,INK,.6); eye(g,3.2,-8); Ln(g,1,-10.6,5,-10.8,INK,.8);
      P(g,[-7.6,-8,-7,-13,-2,-15.8,4,-15,7.4,-12,3,-12.6,-3,-11.4,-5,-6],'#5a3a1e',INK,.8);
      g.restore(); E(g,0,0,18.6,18.6,null,'#8a5a1e',1.4); },
    battle: g=>{ medal(g,'#c7432f','#7c1f16','#5a160f'); E(g,0,0,14,14,null,'#e2b44a',1);
      for (const s of [-1,1]) { g.save(); g.rotate(s*Math.PI/4); RR(g,-1.6,-15,3.2,20,1,'#dfe3e8',INK,.8); RR(g,-5.4,5,10.8,2.6,1,'#c79a3a',INK,.7); RR(g,-1.2,7.4,2.4,5.4,.8,'#6b4423',INK,.6); E(g,0,13.6,1.8,1.8,'#c79a3a',INK,.5); g.restore(); } },
    misc: g=>{ medal(g,'#6f93be','#2c4a74','#22385a');
      RR(g,-10,-12,20,3.4,1,'#f1eadc',INK,.8); RR(g,-6,-8.6,12,18,.5,'#efe7d6',INK,.8); for (const x of [-3,0,3]) Ln(g,x,-7.6,x,8.6,'rgba(120,100,70,.55)',.8); RR(g,-9,9.4,18,3.6,.8,'#e6dccb',INK,.8); }
  },
  coin(g,r){ E(g,0,.6,r,r,'#8a8a80'); const gr=g.createRadialGradient(-r*.4,-r*.4,0,0,0,r); gr.addColorStop(0,'#ffffff'); gr.addColorStop(.5,'#dcdcd2'); gr.addColorStop(1,'#a8a89c'); E(g,0,0,r,r,gr,'#6f6f66',r*.12); E(g,0,0,r*.74,r*.74,null,'rgba(110,110,100,.6)',r*.08); Ln(g,-r*.32,-r*.36,r*.32,r*.36,'#6f6f66',r*.16); Ln(g,r*.32,-r*.36,-r*.32,r*.36,'#6f6f66',r*.16); },
  wall(g){ P(g,[-6.5,5,-6.5,-2,-5,-2,-5,-4,-3,-4,-3,-2,-1,-2,-1,-4,1,-4,1,-2,3,-2,3,-4,5,-4,5,-2,6.5,-2,6.5,5],'#d2ae7c',INK,.8); g.beginPath(); g.moveTo(-1.8,5); g.lineTo(-1.8,1.6); g.arc(0,1.6,1.8,Math.PI,0); g.lineTo(1.8,5); g.closePath(); g.fillStyle='#5a3a1a'; g.fill(); Ln(g,-6,1,-3,1,'#a9875a',.5); Ln(g,3,1,6,1,'#a9875a',.5); }
};
T.spriteDraw = T.spriteDraw || {};
})();
