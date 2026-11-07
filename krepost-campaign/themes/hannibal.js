/* =====================================================================
   themes/hannibal.js — особые рисунки битвы «Ганнибал у ворот», перенесённые из v4 (game/krepost.html) один в один:
   фигурки защитников и врагов, ландшафт (Альпы, Тразименское озеро, река с мостом, брод, деревни) и портрет Ганнибала.
   Движок берёт их вместо общего генератора, если battle.id === 'hannibal'.
   ===================================================================== */
(function(){
'use strict';
const T = window.THEMES, U = T.util, F = T.fig;
const {E,P,Ln,RR,limb,curve,spear,eye,head,star,shadeOf,rng,signpost,INK,TAU} = U;
const {stride,legs,tunic,shadeTorso,horse,SKIN,SKIN2,SKIN3} = F;

const DRAW_T = {
  velites(g){
    legs(g,-1,SKIN);
    tunic(g,'#c79b5f','#8a5a2a',-22,-9); shadeTorso(g,-22,-9);
    Ln(g,-6.6,-14,6.6,-14,'#6b4423',1.6);
    E(g,-4.5,-16,6.6,6.6,'#8c5a2b',INK,1.1); E(g,-4.5,-16,4.6,4.6,null,'#d6b268',1); E(g,-4.5,-16,1.7,1.7,'#e2c07a',INK,.5);
    head(g,1,-27.5,5,SKIN);
    P(g,[-5.8,-27,-5.6,-32.5,-2.8,-35.6,2.4,-35.8,6,-33.4,9.4,-31,6.2,-30,2,-31.4,-2.6,-30.6,-5.4,-23.5,-7.2,-24],'#7b5a3d',INK,1);
    P(g,[-3,-35,-2.2,-39,.2,-35.6],'#7b5a3d',INK,.8); P(g,[1,-35.8,2.6,-39.4,3.9,-35.3],'#7b5a3d',INK,.8);
    E(g,7.6,-31.2,.6,.6,INK); Ln(g,-1,-33.5,4,-33.8,'#a07a52',1);
    limb(g,4,-20.5,8.6,-27,SKIN,2.4);
    spear(g,-7,-24.5,19,-33.5,'#7a5230',4.5,'#c3c8cd',1.3);
    E(g,8.6,-27.4,1.6,1.6,SKIN,INK,.6);
  },
  legion(g){
    spear(g,-9.5,-4,1.5,-44,'#7a5230',4,'#c3c8cd',1.4); Ln(g,-1.6,-30,.9,-40,'#8d939a',1.5);
    legs(g,-1,SKIN);
    tunic(g,'#b3261e','#7c1f16',-17,-9);
    P(g,[-6,-23.5,6,-23.5,6.6,-15,-6.6,-15],'#bcc2c9',INK,1); shadeTorso(g,-23.5,-15);
    Ln(g,-6,-20.5,6.2,-20.5,'#7d848d',.8); Ln(g,-6.3,-17.8,6.4,-17.8,'#7d848d',.8);
    head(g,1,-28,5,SKIN);
    g.beginPath(); g.arc(1,-28.8,5.7,Math.PI,0); g.closePath(); g.fillStyle='#c9ced4'; g.fill(); g.strokeStyle=INK; g.lineWidth=1; g.stroke();
    P(g,[-4.7,-28.8,-7,-25.8,-4.4,-26.6],'#aeb4bb',INK,.8); P(g,[3.2,-28.8,6.2,-28.8,5,-24.4,3.4,-25.2],'#aeb4bb',INK,.8);
    g.beginPath(); g.ellipse(.6,-33.8,5.6,3.4,0,Math.PI,0); g.closePath(); g.fillStyle='#c0231a'; g.fill(); g.strokeStyle=INK; g.lineWidth=.9; g.stroke();
    for (let i=-4;i<=5;i+=1.8) Ln(g,.6+i,-34,.6+i*1.05,-36.4+Math.abs(i)*.35,'#e0473a',.5);
    RR(g,3,-26.5,8.6,21,2,'#b3261e',INK,1.1); RR(g,4.2,-25.3,6.2,18.6,1.2,null,'#e8b84a',.9);
    E(g,7.3,-16,2,2,'#e8b84a',INK,.6);
    Ln(g,4.8,-21.4,7.3,-19.2,'#e8b84a',.9); Ln(g,9.8,-21.4,7.3,-19.2,'#e8b84a',.9);
    Ln(g,4.8,-10.6,7.3,-12.8,'#e8b84a',.9); Ln(g,9.8,-10.6,7.3,-12.8,'#e8b84a',.9);
    Ln(g,7.3,-24,7.3,-18.6,'#e8b84a',.9); Ln(g,7.3,-13.4,7.3,-8,'#e8b84a',.9);
  },
  triarii(g){
    legs(g,-1,SKIN);
    tunic(g,'#6d2a5a','#46163a',-17,-9);
    P(g,[-6,-23.5,6,-23.5,6.8,-14,-6.8,-14],'#d3d8de',INK,1); shadeTorso(g,-23.5,-14);
    for (let y=-22;y<-15;y+=2.1) for (let x=-5;x<6;x+=2.1) E(g,x+((y|0)%2?1:0),y,.45,.45,'#8e959e');
    head(g,1,-28,5,SKIN);
    g.beginPath(); g.arc(1,-28.8,5.8,Math.PI,0); g.closePath(); g.fillStyle='#e3e7ec'; g.fill(); g.strokeStyle=INK; g.lineWidth=1; g.stroke();
    P(g,[3.2,-28.8,6.3,-28.8,5,-24.2,3.4,-25],'#c7ccd2',INK,.8);
    curve(g,[-1.5,-34,-4,-39,-4.5,-45],'#2d2a2a',1.6); curve(g,[1,-34.4,1,-40,1.6,-46.5],'#7a2a6a',1.7); curve(g,[3.4,-34,5.6,-39,7,-44.5],'#2d2a2a',1.6);
    E(g,5.8,-17,5,10.6,'#6d2a5a',INK,1.1); E(g,5.8,-17,3.9,9.4,null,'#e3e7ec',1); E(g,5.8,-17,1.9,1.9,'#e3e7ec',INK,.6);
    limb(g,2,-20,7,-21,SKIN,2.4);
    spear(g,-14,-19.2,25,-22,'#7a5230',5,'#dfe3e8',1.5);
    E(g,7.2,-21.2,1.6,1.6,SKIN,INK,.6);
  },
  archer(g){
    P(g,[-9.2,-28.6,-5.6,-29.4,-3,-12.6,-6.6,-11.8],'#7a4a24',INK,1);
    Ln(g,-8.3,-28.8,-10,-33,'#efe7d4',1.6); Ln(g,-6.8,-29.2,-7.4,-33.6,'#c0392b',1.6); Ln(g,-5.4,-29.4,-4.6,-33.2,'#efe7d4',1.6);
    legs(g,-1,SKIN);
    tunic(g,'#2f5f9e','#1d3d6b',-22,-9); shadeTorso(g,-22,-9);
    Ln(g,-6.6,-14,6.6,-14,'#6b4423',1.6); Ln(g,-5,-22,3,-14,'#6b4423',1.3);
    head(g,1,-27.5,5,SKIN);
    P(g,[-4.6,-29.4,1.2,-37.4,6.4,-29.4],'#d8b878',INK,1); Ln(g,-4.8,-29.4,6.6,-29.4,'#a78452',1.1);
    limb(g,3,-20.5,10.2,-21.5,SKIN,2.3);
    curve(g,[9.6,-32,17.8,-21.5,9.6,-11],'#6b3f1e',1.9);
    Ln(g,9.6,-32,3.4,-21.5,'#f1e9d6',.6); Ln(g,3.4,-21.5,9.6,-11,'#f1e9d6',.6);
    spear(g,3.4,-21.5,19,-21.5,'#5a3a1a',3,'#c3c8cd',.9);
    E(g,10.4,-21.5,1.6,1.6,SKIN,INK,.6);
  },
  ballista(g){
    function mini(x,s,flip){ g.save(); g.translate(x,0); g.scale(s*(flip?-1:1),s); legs(g,-1,SKIN); tunic(g,'#b3261e','#7c1f16',-22,-9); P(g,[-6,-23,6,-23,6.4,-15,-6.4,-15],'#bcc2c9',INK,1); head(g,1,-28,5,SKIN); g.beginPath(); g.arc(1,-28.8,5.7,Math.PI,0); g.closePath(); g.fillStyle='#c9ced4'; g.fill(); g.strokeStyle=INK; g.lineWidth=1; g.stroke(); g.beginPath(); g.ellipse(.6,-33.8,5.4,3.2,0,Math.PI,0); g.fillStyle='#c0231a'; g.fill(); g.restore(); }
    mini(-21,.52,false);
    limb(g,-4,-12,-13,-.5,'#8a5a2b',2.4); limb(g,4,-12,13,-.5,'#8a5a2b',2.4); limb(g,-10,-4,10,-4,'#8a5a2b',1.6);
    P(g,[-3.6,-2,3.6,-2,2.6,-29,-2.6,-29],'#a86e35',INK,1); Ln(g,0,-4,0,-27,'#6e4520',1.2);
    limb(g,-8,-25,-20,-17,'#8a5a2b',2.4); limb(g,8,-25,20,-17,'#8a5a2b',2.4);
    Ln(g,-20,-17,0,-8.5,'#efe6d2',.8); Ln(g,20,-17,0,-8.5,'#efe6d2',.8);
    RR(g,-12.5,-29.5,25,7.5,1.5,'#b07639',INK,1);
    E(g,-8,-25.8,3.2,5.4,'#4a3424',INK,.9); E(g,8,-25.8,3.2,5.4,'#4a3424',INK,.9);
    for (const sx of [-8,8]) for (let y=-29;y<-22;y+=1.6) Ln(g,sx-2.6,y,sx+2.6,y+.6,'#7a5f44',.6);
    E(g,-12,-26,1.1,1.1,'#d0d4d8',INK,.4); E(g,12,-26,1.1,1.1,'#d0d4d8',INK,.4);
    E(g,0,-12,3.8,3.4,'#9a958c',INK,.9); E(g,-1,-13,1.4,1.1,'#c9c4ba');
    mini(21,.52,true);
  },
  trumpet(g){
    legs(g,-1,SKIN);
    tunic(g,'#a33a22','#6e2414',-22,-9); shadeTorso(g,-22,-9);
    P(g,[-6,-23,6,-23,6.4,-15,-6.4,-15],'#8b5a33',INK,1);
    const arc=(c,w)=>{ g.beginPath(); g.arc(-2.5,-21,12,.3*Math.PI,1.36*Math.PI); g.strokeStyle=c; g.lineWidth=w; g.lineCap='round'; g.stroke(); };
    arc(INK,3.8); arc('#d4a634',2.3); arc('rgba(255,240,180,.75)',.7);
    Ln(g,-13.6,-21,7.6,-21,'#7a5230',1.2);
    limb(g,1.2,-9.6,5.2,-26.4,'#d4a634',1.3);
    head(g,1,-27.5,5,SKIN);
    P(g,[-5.8,-27,-5.8,-32.5,-2.8,-35.8,2.6,-35.8,6,-33.2,8.2,-31.2,5.6,-30.4,1.6,-31.6,-2.6,-30.6,-5.6,-23,-7.4,-24],'#4a3426',INK,1);
    P(g,[-2.6,-35.2,-2,-38.4,.2,-35.6],'#4a3426',INK,.8); P(g,[1.4,-35.8,2.6,-38.8,3.8,-35.3],'#4a3426',INK,.8);
    P(g,[-7.6,-31,-5.2,-33.8,8.2,-42.6,4.4,-46.6],'#e0b443',INK,1);
    E(g,6.4,-44.8,2.4,3.6,'#8a6418',INK,.8,-.75);
    limb(g,3,-20.5,6.4,-14,SKIN,2.3);
  }
};
const T_SIZE = {velites:[56,56,50], legion:[56,58,52], triarii:[64,62,56], archer:[56,56,50], ballista:[64,48,44], trumpet:[56,58,52]};

const DRAW_E = {
  gaul(g,f){
    curve(g,[-1.5,-20.5,-6,-28,-9.5,-33.5],'#6b4423',1.7);
    P(g,[-11.8,-36.6,-6.6,-35.6,-7.8,-30.8,-12.6,-31.4],'#b4bac0',INK,.9);
    const [a,b]=stride(f); limb(g,-1.8,-11,a,-1.4,'#4f7a3a',3.2); limb(g,1.8,-11,b,-1.4,'#4f7a3a',3.2);
    Ln(g,a*.5-1,-7,a*.5+1,-7,'#d8b34a',.8); Ln(g,b*.5,-6,b*.5+2,-6,'#d8b34a',.8);
    E(g,a+.9,-1,2.2,1.1,SKIN,INK,.6); E(g,b+.9,-1,2.2,1.1,SKIN,INK,.6);
    P(g,[-5.6,-23.4,5.6,-23.4,6.2,-11,-6.2,-11],SKIN,INK,1); shadeTorso(g,-23.4,-11);
    Ln(g,-6,-12,6,-12,'#6b4423',1.8); Ln(g,-1,-18,1.6,-18,SKIN2,.6);
    g.beginPath(); g.arc(1,-23.4,3.2,.15*Math.PI,.85*Math.PI); g.strokeStyle='#e0b23e'; g.lineWidth=1.2; g.stroke();
    head(g,1,-28.4,5,SKIN);
    P(g,[-5.4,-27,-7.4,-33.4,-4,-32,-2.8,-36.2,.2,-33,2.4,-36.6,3.8,-32.8,7,-34,5.6,-30.6,2,-31.8,-3.4,-30.6,-4.6,-24.8],'#d9652b',INK,.9);
    P(g,[2.6,-25.8,6.4,-25.2,7.4,-23.6,4.6,-24.6,2.4,-24.4],'#d9652b',INK,.6);
    limb(g,-3,-21.5,-2,-21,SKIN,2.3);
    E(g,6.6,-16.5,4.3,9.4,'#3d6f8e',INK,1.1); Ln(g,6.6,-25.6,6.6,-7.4,'#e5d6a8',1.1); E(g,6.6,-16.5,1.8,2.2,'#c9a84a',INK,.6);
  },
  iber(g,f){
    curve(g,[-2,-21,-12.4,-27.5,-8.4,-37.6],'#cdd2d8',2.3); Ln(g,-2.6,-20.4,-.6,-22.2,'#6b4423',1.8);
    legs(g,f,SKIN2);
    tunic(g,'#f3efe4','#b8281e',-23,-9); shadeTorso(g,-23,-9);
    Ln(g,-3,-23,3,-23,'#b8281e',1.6); Ln(g,-6.6,-14,6.6,-14,'#6b4423',1.5);
    head(g,1,-28,5,SKIN2);
    g.beginPath(); g.arc(.6,-28.8,5.6,Math.PI*.95,Math.PI*2.02); g.lineTo(-4.4,-25); g.closePath(); g.fillStyle='#3a2a1e'; g.fill(); g.strokeStyle=INK; g.lineWidth=.8; g.stroke();
    E(g,6.6,-17,5.6,5.6,'#9a3a22',INK,1.1); E(g,6.6,-17,3.8,3.8,null,'#e2c27a',1); E(g,6.6,-17,1.5,1.5,'#e2c27a',INK,.5);
  },
  libyan(g,f){
    spear(g,-7,-3,-3.6,-42,'#7a5230',4,'#c3c8cd',1.3);
    legs(g,f,SKIN3);
    tunic(g,'#9b4a2b','#6e2a14',-17,-9);
    P(g,[-6.2,-23.6,6.2,-23.6,7.2,-12,-7.2,-12],'#a6abb0',INK,1); shadeTorso(g,-23.6,-12);
    for (let y=-22.4;y<-12.5;y+=2) for (let x=-5.4;x<6.4;x+=2) E(g,x+(Math.round(y)%2?1:0),y,.5,.5,'#6f757c');
    head(g,1,-28,5,SKIN3);
    g.beginPath(); g.arc(1,-28.6,5.9,Math.PI,0); g.closePath(); g.fillStyle='#c79a3a'; g.fill(); g.strokeStyle=INK; g.lineWidth=1; g.stroke();
    Ln(g,-5.6,-28.4,7,-28.4,'#9c7426',1.2); E(g,1,-35,1.3,1.6,'#c79a3a',INK,.6);
    P(g,[3.4,-28.6,6.4,-28.6,5,-24.4,3.4,-25],'#b18731',INK,.8);
    E(g,6.4,-16.5,5.8,11.2,'#ddcb9e',INK,1.1); E(g,6.4,-16.5,4.6,10,null,'#9c7426',.8);
    g.beginPath(); g.arc(6.4,-18,2.6,.15*Math.PI,.85*Math.PI,true); g.strokeStyle='#7a2a14'; g.lineWidth=1.3; g.stroke(); E(g,6.4,-19.2,1.1,1.1,'#7a2a14');
  },
  slinger(g,f){
    legs(g,f,'#d9a374');
    tunic(g,'#cfc5ad','#8b7a58',-22,-11); shadeTorso(g,-22,-11);
    Ln(g,-6.2,-15,6.2,-15,'#6b4423',1.3); E(g,-6,-13,2.4,3,'#a07a52',INK,.7);
    head(g,1,-27.5,4.8,'#d9a374');
    g.beginPath(); g.arc(.8,-28.4,5.2,Math.PI*.95,Math.PI*2.02); g.closePath(); g.fillStyle='#2e2219'; g.fill();
    Ln(g,-4.6,-29.2,5.6,-29.6,'#b8281e',1.3);
    limb(g,2.6,-21,5,-31,'#d9a374',2.2);
    limb(g,-2.6,-20.5,-5.4,-15,'#d9a374',2.1);
  },
  numid(g,f){
    horse(g,f,'#9a6233','#3a2414',1);
    spear(g,-6,-20,-1,-47,'#7a5230',3.6,'#c3c8cd',1.1); spear(g,-4,-20,2.4,-46.5,'#7a5230',3.6,'#c3c8cd',1.1);
    E(g,-4.6,-26,3.8,3.8,'#c9a227',INK,.8); E(g,-4.6,-26,1.4,1.4,'#8a6418');
    limb(g,-1.4,-20.6,4,-13.4,'#e8d9a8',2.8);
    P(g,[-3.4,-32,3.4,-32,4,-20,-4,-20],'#e8d9a8',INK,1); Ln(g,-3.6,-23,3.8,-23,'#b8281e',1.2);
    head(g,.8,-36,4.6,'#6b4026');
    g.beginPath(); g.arc(.6,-36.8,5,Math.PI*.95,Math.PI*2.02); g.closePath(); g.fillStyle='#24180f'; g.fill();
    limb(g,2,-29,7.6,-26,'#6b4026',2);
  },
  elephant(g,f){
    const dx = f===1 ? 2.4 : -1.6;
    curve(g,[-20,-25,-24,-21,-23.4,-14],INK,1,false);
    limb(g,-12,-15,-13+dx,-1,'#6c6f78',5.6); limb(g,10,-15,11-dx,-1,'#6c6f78',5.6);
    E(g,-1,-23,20.5,13.4,'#8a8d96',INK,1.2);
    E(g,-1,-17.5,17,7,'rgba(0,0,0,.08)');
    P(g,[-14,-34.5,10.6,-34.5,9,-25.8,-12.4,-25.8],'#b3261e',INK,1);
    for (let x=-12;x<9;x+=2.4) Ln(g,x,-25.8,x+.2,-24.4,'#e2b44a',1);
    RR(g,-9.6,-45,16,10.6,1,'#8b5a2b',INK,1);
    for (let x=-9.6;x<6;x+=4) RR(g,x,-47.6,2.6,3,.4,'#8b5a2b',INK,.7);
    Ln(g,-9.6,-41,6.4,-41,'#6b4423',.8); Ln(g,-1.6,-45,-1.6,-35,'#6b4423',.8);
    head(g,-1.8,-49,3,SKIN2); g.beginPath(); g.arc(-1.8,-49.6,3.3,Math.PI,0); g.fillStyle='#c79a3a'; g.fill();
    spear(g,1.4,-42,7.8,-57,'#7a5230',3,'#c3c8cd',1);
    limb(g,-7.6,-15,-8.6-dx,0,'#8a8d96',6.6); limb(g,13,-15,14+dx*.8,0,'#8a8d96',6.6);
    for (const x of [-8.6-dx,14+dx*.8]) { E(g,x-1.6,-.8,.9,.7,'#e8e2d4'); E(g,x+1.4,-.8,.9,.7,'#e8e2d4'); }
    E(g,19,-27,9.8,9.4,'#8a8d96',INK,1.2);
    curve(g,[25.6,-24.6,32.4,-16.4+(f?1:0),29.8,-6.4,29,-2,32.4,-3.2-(f?1:0)],'#8a8d96',4.4);
    curve(g,[23.4,-20.6,30.6,-19,33,-24.4],'#f4ecd8',2.1);
    E(g,12.6,-26.6,5.8,8.4,'#7b7e87',INK,1); E(g,12.4,-26.2,3.6,5.8,'#a9867f');
    E(g,22.4,-29.6,1.5,1.6,'#fff'); E(g,22.8,-29.4,1,1.1,INK); Ln(g,20.6,-31.6,23.6,-31.8,'#5e616a',.8);
    E(g,12.8,-38.6,3.6,3.2,'#d9c08a',INK,.8);
    head(g,13.4,-43.4,3,'#7a4a2a'); E(g,13,-45.6,3.4,2,'#efe7d4',INK,.6);
    Ln(g,15.4,-38,21.4,-42.6,'#5a3a1a',1);
  },
  hannibal(g,f){
    Ln(g,-10,-20,-10,-64,INK,2.6); Ln(g,-10,-20,-10,-64,'#6b4423',1.5);
    P(g,[-10,-60,3,-60,1.2,-55.4,3,-50.6,-10,-50.6],'#6b1d7a',INK,1); Ln(g,-10,-50.6,3,-50.6,'#e2b44a',1);
    E(g,-10,-66,2.6,2.6,'#e2b44a',INK,.7); g.beginPath(); g.arc(-10,-63.2,3.8,.1*Math.PI,.9*Math.PI); g.strokeStyle='#e2b44a'; g.lineWidth=1.3; g.stroke();
    horse(g,f,'#5a3b28','#1a120d',1.22);
    P(g,[-10,-25,9,-25,10,-15,-11,-15],'#6b1d7a',INK,1); for (let x=-10;x<10;x+=2.2) Ln(g,x,-15,x+.2,-13.4,'#e2b44a',1);
    P(g,[-1,-43,-15,-34,-19,-22,-11,-25,-6,-30],'#7d2390',INK,1); P(g,[-12,-27,-17,-23,-11,-25],'#5a1466');
    limb(g,-1.6,-26,4.4,-18,'#7d2390',2.8);
    P(g,[-3.6,-40,3.6,-40,4.2,-27,-4.2,-27],'#e0b041',INK,1); Ln(g,-3.4,-35,3.6,-35,'#b4852b',.8); Ln(g,-3.8,-31,3.9,-31,'#b4852b',.8);
    head(g,.8,-45.4,5.2,'#d9a374');
    P(g,[-1.6,-43.4,5,-42.6,5.8,-40.2,2,-38.8,-2.8,-40.6],'#3a2a1e',INK,.7);
    Ln(g,-4.2,-47.2,5.8,-45,'#1a120d',.9); E(g,3.2,-46,1.9,1.6,'#1a120d');
    g.beginPath(); g.arc(.8,-46.4,6,Math.PI,0); g.closePath(); g.fillStyle='#e8b93e'; g.fill(); g.strokeStyle=INK; g.lineWidth=1; g.stroke();
    Ln(g,-5.2,-46.4,6.8,-46.4,'#a87c22',1.2);
    g.beginPath(); g.ellipse(-.4,-52.6,6.4,4,0,Math.PI,0); g.closePath(); g.fillStyle='#c0231a'; g.fill(); g.strokeStyle=INK; g.lineWidth=.9; g.stroke();
    limb(g,2,-36,7.4,-31,'#d9a374',2.2);
  },
  celtiber(g,f){
    P(g,[-6,-24,-11,-10,-9.5,-6,-4,-9,-2,-23],'#24201e',INK,1);
    curve(g,[-1,-21,-9,-25,-10.5,-33],'#cdd2d8',2.1); Ln(g,-1.6,-20.6,.4,-22.4,'#6b4423',1.8);
    legs(g,f,SKIN2,'#3a2a1e');
    tunic(g,'#4a4440','#8a2a1e',-23,-9); shadeTorso(g,-23,-9);
    Ln(g,-6.6,-14,6.6,-14,'#2a1a10',1.6);
    head(g,1,-28,5,SKIN2);
    g.beginPath(); g.arc(1,-28.8,5.8,Math.PI,0); g.closePath(); g.fillStyle='#8f8a80'; g.fill(); g.strokeStyle=INK; g.lineWidth=1; g.stroke();
    P(g,[-2.4,-33.8,-1,-39.6,3.4,-40.2,4.6,-34.4],'#8a2a1e',INK,.8);
    P(g,[3.4,-28.8,6.4,-28.8,5,-24.6,3.4,-25.2],'#7d786f',INK,.7);
    E(g,6.4,-17,6.2,6.2,'#3d3734',INK,1.1); E(g,6.4,-17,4.4,4.4,null,'#b3a28a',1); E(g,6.4,-17,2,2,'#c9b48a',INK,.6);
  },
  gaulcav(g,f){
    horse(g,f,'#d6d0c4','#6b5a48',1);
    spear(g,-8,-18,4,-50,'#7a5230',4,'#c3c8cd',1.3);
    E(g,-6,-26,3.6,6.2,'#3d6f8e',INK,.9); Ln(g,-6,-31.6,-6,-20.4,'#e5d6a8',.9);
    P(g,[-3.6,-32,3.6,-32,4.2,-20,-4.2,-20],'#5d7f3a',INK,1);
    for (let x=-3;x<4;x+=2.2) Ln(g,x,-31.4,x+.4,-20.4,'rgba(200,60,40,.55)',.7);
    Ln(g,-4,-25,4,-25.4,'rgba(200,60,40,.55)',.7);
    limb(g,-1.2,-20.6,4,-13.4,'#5d7f3a',2.8);
    head(g,.8,-36,4.6,SKIN);
    P(g,[-4.6,-35,-6.6,-40.6,-3.4,-39.6,-2,-43,.6,-40.4,3,-43.2,4.2,-39.8,6,-40.2,4.6,-37.6,1.4,-38.6,-3,-38],'#d9652b',INK,.8);
    P(g,[2.2,-33.6,5.8,-33.2,6.6,-31.6,4,-32.4],'#d9652b',INK,.5);
    limb(g,2,-29,7.6,-26,SKIN,2);
  },
  sacred(g,f){
    spear(g,-7.2,-3,-3.4,-44,'#7a5230',4.2,'#dfe3e8',1.4);
    legs(g,f,SKIN2,'#4a3424',2.8);
    tunic(g,'#f6f2ea','#6b1d7a',-17,-8); Ln(g,-7.4,-10.4,7.4,-10.4,'#6b1d7a',1.1);
    P(g,[-6.4,-24,6.4,-24,7.4,-12.6,-7.4,-12.6],'#e9ecef',INK,1); shadeTorso(g,-24,-12.6);
    Ln(g,0,-24,0,-13,'rgba(120,120,130,.45)',.7); Ln(g,-6.4,-18.4,6.6,-18.4,'#b4852b',.9);
    head(g,1,-28.4,5,SKIN2);
    g.beginPath(); g.arc(1,-29,6,Math.PI,0); g.closePath(); g.fillStyle='#e2b44a'; g.fill(); g.strokeStyle=INK; g.lineWidth=1; g.stroke();
    P(g,[-4.2,-34.2,-3.2,-40,5,-41,5.8,-34.8],'#f6f2ea',INK,.8); Ln(g,-3.6,-37.4,5.4,-38.2,'#6b1d7a',.8);
    P(g,[3.4,-29,6.6,-29,5.2,-24.6,3.4,-25.2],'#c99a3a',INK,.7);
    E(g,7,-17,7.2,7.2,'#f6f2ea',INK,1.2); E(g,7,-17,5.6,5.6,null,'#6b1d7a',1.1);
    g.beginPath(); g.arc(7,-18.4,2.6,.15*Math.PI,.85*Math.PI,true); g.strokeStyle='#6b1d7a'; g.lineWidth=1.3; g.stroke(); E(g,7,-19.6,1.1,1.1,'#6b1d7a');
  },
  maharbal(g,f){
    horse(g,f,'#3a2a22','#14100c',1.12);
    P(g,[-10,-25,9,-25,10,-15,-11,-15],'#b8281e',INK,1); for (let x=-10;x<10;x+=2.4) Ln(g,x,-15,x+.2,-13.6,'#e2b44a',1);
    spear(g,-9,-22,2,-58,'#7a5230',4.4,'#dfe3e8',1.4);
    P(g,[-1,-42,-14,-33,-17,-24,-10,-26,-6,-30],'#b8281e',INK,1);
    limb(g,-1.6,-26,4.4,-18,'#e8d9a8',2.8);
    P(g,[-3.6,-40,3.6,-40,4.2,-27,-4.2,-27],'#e8d9a8',INK,1); Ln(g,-3.8,-31,3.9,-31,'#b8281e',1.3);
    head(g,.8,-45,5,'#6b4026');
    g.beginPath(); g.arc(.8,-46,5.8,Math.PI,0); g.closePath(); g.fillStyle='#e8b93e'; g.fill(); g.strokeStyle=INK; g.lineWidth=1; g.stroke();
    P(g,[-2.4,-51.4,-1,-57,4.6,-56,4.4,-51.2],'#f4ecd8',INK,.8);
    limb(g,2,-36,7.6,-32,'#6b4026',2.2);
  },
  hasdrubal(g,f){
    P(g,[-5,-25,-12,-6,-9,-2,-3,-7,0,-24],'#7d2390',INK,1);
    spear(g,-8,-2,-4.4,-46,'#7a5230',4.4,'#dfe3e8',1.5);
    legs(g,f,SKIN2,'#4a3424',3);
    Ln(g,-2.6,-7,-1.6,-4,'#c79a3a',2); Ln(g,2.6,-7,3.4,-4,'#c79a3a',2);
    tunic(g,'#9b4a2b','#e2b44a',-16,-8);
    P(g,[-6.8,-25,6.8,-25,7.6,-13,-7.6,-13],'#d9a640',INK,1.1); shadeTorso(g,-25,-13);
    g.beginPath(); g.arc(0,-21,3.2,.1*Math.PI,.9*Math.PI); g.strokeStyle='#8a6418'; g.lineWidth=.9; g.stroke();
    Ln(g,-6.6,-16,6.8,-16,'#8a6418',.9);
    head(g,1,-29.4,5.2,SKIN2);
    P(g,[-1,-27,5.6,-26.4,6.2,-24,2.4,-22.8,-2.6,-24.4],'#2e2219',INK,.7);
    g.beginPath(); g.arc(1,-30,6.2,Math.PI,0); g.closePath(); g.fillStyle='#c79a3a'; g.fill(); g.strokeStyle=INK; g.lineWidth=1; g.stroke();
    P(g,[3.4,-30,6.8,-30,5.4,-25.4,3.4,-26],'#b18731',INK,.7);
    curve(g,[-4.6,-35,0,-45,6,-38],'#b8281e',3.2);
    E(g,7.4,-17.4,7.6,12,'#6b1d7a',INK,1.2); E(g,7.4,-17.4,6,10.4,null,'#e2b44a',1);
    E(g,7.4,-17.4,2.4,2.4,'#e2b44a',INK,.6);
  },
  mago(g,f){
    legs(g,f,SKIN2,'#2a2030');
    P(g,[-6.4,-25,6,-25,9,-6,-9,-6],'#3d3550',INK,1); shadeTorso(g,-25,-6);
    Ln(g,-8.4,-8,8.4,-8,'#8c7aa8',1); Ln(g,0,-25,0,-8,'rgba(140,122,168,.6)',.8);
    curve(g,[-1,-22,-10,-26,-12,-36],'#cdd2d8',2);
    head(g,1.4,-29.6,4.8,SKIN2);
    P(g,[-5.6,-24,-6.4,-31,-3,-37.4,3,-38,7.6,-33,8,-28,5.6,-31,1,-34,-2.6,-31,-3,-24],'#2c2540',INK,1);
    E(g,6.4,-16,5,9,'#2c2540',INK,1); E(g,6.4,-16,1.8,2,'#8c7aa8',INK,.5);
    limb(g,3,-21,8,-19,SKIN2,2.2);
  }
};
const E_SIZE = {gaul:[48,48,44,38,7], iber:[48,48,44,40,7], libyan:[48,52,48,43,7], slinger:[44,46,42,36,7], numid:[56,54,50,47,8], elephant:[78,66,62,58,11], hannibal:[78,92,86,84,10],
  celtiber:[48,48,44,40,7], gaulcav:[56,58,52,50,8], sacred:[50,52,48,43,7], maharbal:[72,80,74,70,10], hasdrubal:[62,70,64,60,9], mago:[58,64,58,52,9]};
const E_SCALE = {gaul:1.02, iber:1.02, libyan:1.02, slinger:1, numid:1.02, elephant:1.05, hannibal:1.18, celtiber:1.02, gaulcav:1.02, sacred:1.04, maharbal:1.1, hasdrubal:1.3, mago:1.25};

const SD = T.spriteDraw.hannibal = {};
for (const k in DRAW_T) { const [w,h,ay] = T_SIZE[k]; SD[k] = {draw:DRAW_T[k], box:[w,h,ay,40,5], scale:1.1}; }
for (const k in DRAW_E) SD[k] = {draw:DRAW_E[k], box:E_SIZE[k], scale:E_SCALE[k]};

/* ---------- портрет Ганнибала ---------- */
T.portrait.hannibal = function(g){
  const gr = g.createRadialGradient(-10,-14,4,0,0,60); gr.addColorStop(0,'#f2d79a'); gr.addColorStop(1,'#c7863f');
  E(g,0,0,60,60,gr,'#8a5a1e',3); E(g,0,0,55,55,null,'#f3dc9a',1.4);
  g.save(); g.beginPath(); g.arc(0,0,54,0,TAU); g.clip();
  E(g,40,14,20,16,'#9a9da5',INK,1.2); E(g,50,4,10,11,'#9a9da5',INK,1.2); curve(g,[56,8,60,22,55,32],'#9a9da5',5); curve(g,[53,12,59,12,61,6],'#f4ecd8',2.2); E(g,44,4,6.5,9,'#878a93',INK,1); eye(g,52,0);
  g.restore();
  P(g,[-44,60,-38,30,-18,18,18,18,38,30,44,60],'#6b1d7a',INK,1.6); P(g,[-16,60,-14,22,14,22,16,60],'#e0b041',INK,1.4); Ln(g,-13,34,13,34,'#b4852b',1.4); Ln(g,-14,44,14,44,'#b4852b',1.4);
  E(g,-26,24,7,5,'#e2b44a',INK,1.2); E(g,26,24,7,5,'#e2b44a',INK,1.2);
  RR(g,-6,6,12,14,4,'#d9a374',INK,1.2);
  E(g,0,-8,17,19,'#d9a374',INK,1.6);
  P(g,[-15,-2,-14,10,-6,20,6,20,14,10,15,-2,10,4,0,6,-10,4],'#3a2a1e',INK,1.2);
  P(g,[-8,8,8,8,4,11,-4,11],'#7a3a2a');
  eye(g,6.5,-9); Ln(g,3,-13,10,-13.6,INK,1.4);
  Ln(g,-17,-16,17,-6,'#1a120d',2); E(g,-6.5,-9.5,5.2,4.4,'#1a120d');
  P(g,[0,-6,2.6,2,-2.6,2],'rgba(150,90,50,.5)');
  g.beginPath(); g.arc(0,-12,19.5,Math.PI*1.02,Math.PI*1.98); g.lineTo(19,-8); g.lineTo(-19,-8); g.closePath(); g.fillStyle='#e8b93e'; g.fill(); g.strokeStyle=INK; g.lineWidth=1.6; g.stroke();
  Ln(g,-19,-10,19,-10,'#a87c22',2.4); P(g,[-19,-10,-21,4,-15,2,-14,-8],'#e8b93e',INK,1.2); P(g,[19,-10,21,4,15,2,14,-8],'#e8b93e',INK,1.2);
  g.beginPath(); g.ellipse(0,-30,17,9,0,Math.PI,0); g.closePath(); g.fillStyle='#c0231a'; g.fill(); g.strokeStyle=INK; g.lineWidth=1.4; g.stroke();
  for (let i=-14;i<=14;i+=3) Ln(g,i,-30.5,i*1.05,-36.5+Math.abs(i)*.22,'#e0473a',.8);
};

/* ---------- ландшафт v4 ----------
   env: {W,H,PATH,PADS,segDist,paintRoad(g),paintPlates(g)} — дорогу и площадки рисует движок, порядок слоёв как в v4 */
T.land = T.land || {};
const riverY = x => 700 + 2.2*Math.sin(x/38) + 1.2*Math.sin(x/13+1);
const fordY = x => 1372 + 1.6*Math.sin(x/31+.6) + .9*Math.sin(x/11);
const LAKE = {x:122, y:531, rx:60, ry:27};
const VILLAGES = [[[178,1010,22],[206,1000,18],[234,1014,24],[262,998,18]], [[236,1414,18],[262,1403,16],[292,1416,20]]];
const FOREST = {x0:166, y0:858, x1:236, y1:930};
const VINES = [[330,326,52,58,'vine'],[286,634,50,44,'vine'],[8,1146,54,62,'vine'],[6,128,58,62,'wheat']];
function house(g,x,y,w,R){
  const h = w*.62, rh = w*.42;
  E(g,x+3,y+1,w*.62,w*.16,'rgba(50,40,14,.28)');
  RR(g,x-w/2,y-h,w,h,1,'#efe2c6',INK,.8);
  g.fillStyle='rgba(0,0,0,.10)'; g.fillRect(x+w*.18,y-h+.5,w*.32-.5,h-1);
  RR(g,x-w*.12,y-h*.62,w*.24,h*.62,.8,'#6b4423',INK,.6);
  RR(g,x-w*.40,y-h*.72,w*.16,w*.14,.5,'#3a2a1e'); if (w > 18) RR(g,x+w*.24,y-h*.72,w*.16,w*.14,.5,'#3a2a1e');
  P(g,[x-w/2-2.4,y-h+.6,x,y-h-rh,x+w/2+2.4,y-h+.6],'#c25a34',INK,.9);
  for (let i=1;i<4;i++){ const yy = y-h-rh+rh*i/4+.4, hw = (w/2+2.4)*i/4; Ln(g,x-hw,yy,x+hw,yy,'rgba(110,30,15,.45)',.6); }
  P(g,[x,y-h-rh,x+w/2+2.4,y-h+.6,x+w*.18,y-h+.6],'rgba(0,0,0,.12)');
  if (R() < .6) { RR(g,x+w*.18,y-h-rh*.9,3,rh*.5,.4,'#d9c7a6',INK,.5); }
}
function cypress(g,x,y,s){
  const h=24*s, w=4.4*s;
  E(g,x+4,y,6*s,2*s,'rgba(50,40,14,.28)',null,0,-.15);
  g.beginPath(); g.moveTo(x,y-h); g.quadraticCurveTo(x+w*1.35,y-h*.45,x+w*.55,y); g.lineTo(x-w*.55,y); g.quadraticCurveTo(x-w*1.35,y-h*.45,x,y-h); g.closePath();
  g.fillStyle='#2f5833'; g.fill(); g.strokeStyle='rgba(30,40,20,.7)'; g.lineWidth=.7; g.stroke();
  g.beginPath(); g.moveTo(x-.4,y-h+2); g.quadraticCurveTo(x-w*1.1,y-h*.45,x-w*.35,y-1.5); g.quadraticCurveTo(x-w*.35,y-h*.5,x-.4,y-h+2); g.fillStyle='#4f8447'; g.fill();
  Ln(g,x,y,x,y+1.2,'#5a3a1a',1.2);
}
function signV4(g,x,y,text,dir,size){
  g.font='bold 10px '+U.FONT_C; const tw = g.measureText(text).width, fs = size || 10, bw = tw*fs/10 + 12, bh = fs + 8;
  const L = x - bw/2, R = x + bw/2, T0 = y - bh/2, B = y + bh/2;
  Ln(g,x,B-2,x,B+14,INK,3.4); Ln(g,x,B-2,x,B+14,'#8a5a2b',2.2); E(g,x+2,B+14,5,1.6,'rgba(50,40,14,.3)');
  const pts = dir > 0 ? [L,T0,R,T0,R+6,y,R,B,L,B] : [R,T0,L,T0,L-6,y,L,B,R,B];
  P(g,pts,'#b9834a',INK,1); Ln(g,L+1,T0+4.5,R-1,T0+4.5,'rgba(90,55,25,.35)',.6); Ln(g,L+1,B-4.5,R-1,B-4.5,'rgba(90,55,25,.35)',.6);
  g.fillStyle='#2f1e10'; g.textAlign='center'; g.textBaseline='middle'; g.font='bold '+fs+'px '+U.FONT_C; g.fillText(text,x+(dir>0?-1:1),y+.4);
}
T.land.hannibal = function(g, env){
  const {W,H,PADS,segDist} = env, X0 = -4, Y0 = -4, X1 = W+4, Y1 = H+4, R = rng(11);
  let gr;
  // фон из картинки, если движок её дал; иначе — земля кодом, как в v4
  if (!(env.paintGround && env.paintGround(g))) {
  gr = g.createLinearGradient(0,30,0,H);
  gr.addColorStop(0,'#b7c66e'); gr.addColorStop(.18,'#aec468'); gr.addColorStop(.4,'#a6bd62'); gr.addColorStop(.62,'#adbd63');
  gr.addColorStop(.8,'#a8b45e'); gr.addColorStop(.92,'#b3a964'); gr.addColorStop(1,'#bf9a62');
  g.fillStyle = gr; g.fillRect(X0,0,X1-X0,Y1);
  for (let i=0;i<14;i++){ const x=X0+R()*(X1-X0), y=1440+R()*140, r=30+R()*40; const b=g.createRadialGradient(x,y,0,x,y,r); b.addColorStop(0,'rgba(196,120,74,.32)'); b.addColorStop(1,'rgba(196,120,74,0)'); g.fillStyle=b; g.fillRect(x-r,y-r,r*2,r*2); }
  for (let i=0;i<260;i++){
    const x=X0+R()*(X1-X0), y=40+R()*1520, r=16+R()*44, light=R()<.5;
    const b=g.createRadialGradient(x,y,0,x,y,r);
    b.addColorStop(0, light?'rgba(240,236,170,.30)':'rgba(84,118,48,.22)'); b.addColorStop(1, light?'rgba(240,236,170,0)':'rgba(84,118,48,0)');
    g.fillStyle=b; g.fillRect(x-r,y-r,r*2,r*2);
  }
  for (const [x,y,rx,ry] of [[26,190,62,30],[372,200,58,30],[214,266,46,16],[196,40,70,14],[372,70,50,22],[24,360,40,26],[372,420,50,30],
      [380,560,40,30],[30,820,56,32],[372,860,44,30],[210,780,50,14],[20,1000,40,30],[372,1010,44,28],[372,1220,40,30],[28,1280,40,20],[372,1470,60,30],[60,1440,50,18]]){
    const h=g.createLinearGradient(x-rx*.4,y-ry,x+rx*.3,y+ry);
    h.addColorStop(0,'rgba(214,222,140,.65)'); h.addColorStop(.6,'rgba(160,184,92,.35)'); h.addColorStop(1,'rgba(110,140,60,.35)');
    E(g,x,y,rx,ry,h);
    E(g,x+rx*.18,y+ry*.45,rx*.75,ry*.4,'rgba(90,120,50,.14)');
  }
  }
  gr = g.createLinearGradient(0,Y0,0,42); gr.addColorStop(0,'#bcd8ec'); gr.addColorStop(1,'#e7efe2');
  g.fillStyle = gr; g.fillRect(X0,Y0,X1-X0,46-Y0);
  const layers = [
    {base:30, top:[1,9], col:'#c3d1e2', snow:'#f7fafc', step:[22,34], seed:3},
    {base:38, top:[8,18], col:'#98abc4', snow:'#f2f6fa', step:[26,40], seed:5},
    {base:46, top:[22,33], col:'#7f9488', snow:null, step:[18,30], seed:9}
  ];
  for (const L of layers){
    const r = rng(L.seed), pts = [X0-10, L.base+12]; let x = X0-10;
    const peaks = [];
    while (x < X1+30){ const px = x + L.step[0]*.5 + r()*L.step[1]*.5, py = L.top[0] + r()*(L.top[1]-L.top[0]); pts.push(px,py); peaks.push([px,py]); x = px + L.step[0]*.5 + r()*L.step[1]*.5; pts.push(x, L.base - r()*6); }
    pts.push(X1+40, L.base+12);
    P(g,pts,L.col);
    if (L.snow) for (const [px,py] of peaks){ const d=(L.base-py)*.38; P(g,[px,py, px+d*.75,py+d, px+d*.3,py+d*.78, px,py+d*1.05, px-d*.35,py+d*.8, px-d*.8,py+d],L.snow); P(g,[px,py,px+d*.75,py+d,px+d*.3,py+d*.78],'rgba(150,175,205,.35)'); }
    else for (const [px,py] of peaks){ for (let k=0;k<3;k++){ const tx=px-6+k*5+r()*3, ty=py+6+r()*6; P(g,[tx,ty-6,tx+2.6,ty+1.5,tx-2.6,ty+1.5],'#56705a'); } }
    const hz = g.createLinearGradient(0,L.base-14,0,L.base+10); hz.addColorStop(0,'rgba(236,242,236,0)'); hz.addColorStop(1,'rgba(236,242,236,.45)');
    g.fillStyle = hz; g.fillRect(X0,L.base-14,X1-X0,24);
  }
  gr = g.createLinearGradient(0,40,0,64); gr.addColorStop(0,'rgba(127,148,136,.9)'); gr.addColorStop(1,'rgba(160,184,100,0)');
  g.fillStyle = gr; g.fillRect(X0,40,X1-X0,24);
  for (const [vx,vy,vw,vh,kind] of VINES){
    if (kind === 'wheat') {
      RR(g,vx,vy,vw,vh,5,'rgba(222,186,96,.75)');
      for (let y=vy+4; y<vy+vh-2; y+=4.2) Ln(g,vx+3,y,vx+vw-3,y+.6,'rgba(170,128,50,.45)',1.1);
      continue;
    }
    RR(g,vx,vy,vw,vh,5,'rgba(186,146,92,.55)');
    for (let y=vy+5; y<vy+vh-2; y+=6.5){ Ln(g,vx+3,y+1.5,vx+vw-3,y+1.5,'rgba(90,60,30,.25)',1.4); for (let x=vx+4; x<vx+vw-3; x+=4.2){ E(g,x,y,2.3,2,'#5f7f37'); E(g,x-.6,y-.7,1.2,1,'#86a64e'); } }
  }
  { const {x,y,rx,ry} = LAKE;
    E(g,x+2,y+3,rx+5,ry+5,'rgba(60,50,20,.18)');
    E(g,x,y,rx+5,ry+5,'#d3c08e');
    const lg = g.createRadialGradient(x-rx*.2,y-ry*.3,4,x,y,rx); lg.addColorStop(0,'#86c3e0'); lg.addColorStop(.6,'#5a9fc6'); lg.addColorStop(1,'#3f7ea6');
    E(g,x,y,rx,ry,lg,'#3a6f8f',1);
    E(g,x-rx*.25,y-ry*.35,rx*.5,ry*.22,'rgba(255,255,255,.18)');
    for (let i=0;i<9;i++){ const a=R()*TAU, rr=.25+R()*.5; const wx=x+Math.cos(a)*rx*rr, wy=y+Math.sin(a)*ry*rr; Ln(g,wx-4,wy,wx+4,wy-.2,'rgba(255,255,255,.7)',1); }
    E(g,x+rx*.45,y-ry*.05,7,4.5,'#9fb466','rgba(60,80,30,.6)',.6);
    cypress(g,x+rx*.45,y-ry*.05+1,.55);
    for (let i=0;i<22;i++){ const a=Math.PI*.15+R()*Math.PI*.7+(i%2?Math.PI:0), px=x+Math.cos(a)*(rx+2), py=y+Math.sin(a)*(ry+2); Ln(g,px,py,px+(R()-.5)*2,py-5-R()*4,'#5f7f37',1); }
    signV4(g,x+4,y-ry-22,'Тразименское озеро',-1,9.4);
  }
  const stream = (fy,lw,col,dy) => { g.beginPath(); for (let x=X0-5;x<=X1+5;x+=4){ const y=fy(x)+(dy||0); x===X0-5?g.moveTo(x,y):g.lineTo(x,y);} g.strokeStyle=col; g.lineWidth=lw; g.lineCap='round'; g.stroke(); };
  stream(riverY,18,'#cdb98a'); stream(riverY,13,'#4f8db2'); stream(riverY,8.5,'#72b2d6',-.8); stream(riverY,2.4,'rgba(200,232,248,.6)',-2.2);
  for (let x=X0+6; x<X1; x+=17+((x*7)%9)){ const y=riverY(x)+((x*13)%5)-2.5; Ln(g,x,y,x+5,y-.3,'rgba(255,255,255,.75)',1); }
  stream(fordY,13,'#cdb98a'); stream(fordY,9,'#5f9cc0'); stream(fordY,5.5,'#86c0de',-.6);
  for (let x=X0+10; x<X1; x+=21+((x*5)%7)){ const y=fordY(x)+((x*11)%3)-1.5; Ln(g,x,y,x+4,y-.2,'rgba(255,255,255,.7)',.9); }
  env.paintRoad(g);
  { const bx = 70, by = riverY(bx);
    g.fillStyle='rgba(30,60,80,.35)'; g.fillRect(bx-34,by-7,10,14); g.fillRect(bx+24,by-7,12,14);
    for (const s of [-1,1]){ const x = bx + s*24; P(g,[x,by-5.5, x+s*9,by, x,by+5.5],'#cbbd9c',INK,.7); P(g,[x,by+1.5,x+s*9,by,x,by+5.5],'rgba(0,0,0,.14)'); }
    for (const x of [bx-25.5,bx+19]) {
      RR(g,x+1,by-13,6.5,28,1.6,'rgba(40,30,10,.3)');
      RR(g,x,by-14,6.5,28,1.6,'#d3c5a6',INK,.9); Ln(g,x+.8,by-13,x+.8,by+13,'rgba(255,250,235,.6)',1);
      for (let y=by-9.5; y<by+14; y+=4.6) Ln(g,x+.4,y,x+6.1,y,'rgba(110,92,62,.7)',.6);
    }
  }
  { const fx = 70, fy = fordY(fx);
    g.save(); g.beginPath(); g.rect(fx-22,fy-9,44,18); g.clip();
    g.globalAlpha=.55; stream(fordY,9,'#6aa8cc'); g.globalAlpha=.6; stream(fordY,3,'#bfe2f2',-.8); g.globalAlpha=1;
    g.restore();
    for (const dx of [-14,-5,4,13]) { E(g,fx+dx+.6,fy+1.4,3.6,2.4,'rgba(30,50,60,.3)'); E(g,fx+dx,fy+.6,3.4,2.3,'#bdb7a6',INK,.6); E(g,fx+dx-.8,fy,1.4,.9,'#e2ddd0'); }
    for (const s of [-1,1]) for (let i=0;i<4;i++){ const x=fx+s*(26+i*4), y=fordY(x); Ln(g,x,y+3,x+(i%2?1:-1),y-5,'#5f7f37',1); }
  }
  const HR = rng(57);
  for (const v of VILLAGES) for (const [x,y,w] of v) house(g,x,y,w,HR);
  { const FR = rng(91), {x0,y0,x1,y1} = FOREST, pts = [];
    for (let y=y0; y<=y1; y+=11) for (let x=x0+((y/11)%2?5:0); x<=x1; x+=11) pts.push([x+(FR()-.5)*5, y+(FR()-.5)*4]);
    for (const [x,y] of pts) if (segDist(x,y) > 30) cypress(g,x,y,.8+FR()*.45);
  }
  const free = (x,y,pad) => {
    if (y < 64 || y > 1548) return false;
    if (segDist(x,y) < 24+pad) return false;
    for (const [px,py] of PADS) if (Math.hypot(px-x,py-y) < 24+pad) return false;
    if (Math.abs(y - riverY(x)) < 12+pad) return false;
    if (Math.abs(y - fordY(x)) < 10+pad) return false;
    if (((x-LAKE.x)/(LAKE.rx+10+pad))**2 + ((y-LAKE.y)/(LAKE.ry+10+pad))**2 < 1) return false;
    if (x > LAKE.x-70 && x < LAKE.x+80 && y > LAKE.y-LAKE.ry-40 && y < LAKE.y-LAKE.ry) return false;
    for (const [vx,vy,vw,vh] of VINES) if (x>vx-6 && x<vx+vw+6 && y>vy-4 && y<vy+vh+10) return false;
    for (const v of VILLAGES) for (const [hx,hy,hw] of v) if (Math.abs(x-hx) < hw*.8+12+pad && y > hy-hw-12 && y < hy+14) return false;
    if (x > FOREST.x0-10 && x < FOREST.x1+10 && y > FOREST.y0-14 && y < FOREST.y1+8) return false;
    if (x > 90 && x < 180 && y < 90) return false;
    return x > X0+4 && x < X1-4;
  };
  const props = [], PR = rng(41);
  const place = (n,kind,pad,minGap) => { let tries=0; while (n>0 && tries++<9000){ const x=X0+PR()*(X1-X0), y=64+PR()*1484; if (!free(x,y,pad)) continue; if (props.some(p=>Math.hypot(p.x-x,p.y-y)<minGap)) continue; props.push({x,y,kind,s:.85+PR()*.35}); n--; } };
  place(62,'cypress',2,13); place(38,'olive',4,16); place(26,'rock',0,10);
  props.sort((a,b)=>a.y-b.y);
  for (const p of props){
    if (p.kind==='cypress') cypress(g,p.x,p.y,p.s);
    else if (p.kind==='olive'){ const r=6.2*p.s, cy=p.y-6.5*p.s;
      E(g,p.x+3,p.y,r*1.1,r*.38,'rgba(50,40,14,.25)');
      limb(g,p.x,p.y,p.x+.6,cy+2,'#6b5338',1.4);
      E(g,p.x+r*.45,cy+r*.25,r*.75,r*.62,'#6f8452'); E(g,p.x-r*.45,cy+r*.2,r*.7,r*.6,'#7f9461'); E(g,p.x,cy-r*.25,r*.8,r*.66,'#8fa26c');
      E(g,p.x-r*.3,cy-r*.45,r*.38,r*.28,'#b3c08f'); E(g,p.x+r*.4,cy-r*.05,r*.22,r*.18,'#a7b884');
    } else { const s=p.s*3.4;
      E(g,p.x+1.2,p.y+.8,s*1.3,s*.55,'rgba(50,40,14,.22)');
      P(g,[p.x-s,p.y,p.x-s*.7,p.y-s*.9,p.x+s*.2,p.y-s*1.15,p.x+s,p.y-s*.4,p.x+s*.9,p.y],'#a9a395','rgba(60,50,40,.6)',.6);
      P(g,[p.x-s*.7,p.y-s*.9,p.x+s*.2,p.y-s*1.15,p.x+s*.1,p.y-s*.5,p.x-s*.5,p.y-s*.45],'#cbc5b6');
    }
  }
  for (let i=0;i<330;i++){ const x=X0+PR()*(X1-X0), y=64+PR()*1480; if (!free(x,y,-6)) continue; E(g,x,y,.9,.9,['#d8452f','#f4efe0','#e9c54a','#c95a8a'][(PR()*4)|0]); }
  signV4(g,135,64,'Из-за Альп',-1,10);
  env.paintPlates(g);
};
T.land.hannibal.mini = function(g,sx,sy,MMW){
  g.fillStyle = 'rgba(160,190,215,.9)'; g.fillRect(1,1,MMW-2,60*sy);
  g.beginPath(); for (let x=0;x<=390;x+=20){ const y=riverY(x)*sy; x?g.lineTo(x*sx,y):g.moveTo(0,y); } g.strokeStyle='rgba(63,126,166,.9)'; g.lineWidth=1.4; g.stroke();
  g.beginPath(); for (let x=0;x<=390;x+=20){ const y=fordY(x)*sy; x?g.lineTo(x*sx,y):g.moveTo(0,y); } g.strokeStyle='rgba(63,126,166,.7)'; g.lineWidth=1; g.stroke();
  E(g,LAKE.x*sx,LAKE.y*sy,LAKE.rx*sx,LAKE.ry*sy,'rgba(63,126,166,.85)');
};
})();
