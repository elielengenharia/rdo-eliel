/* Saídas: SVG (tela), PDF (prancha com carimbo) e DXF (AutoCAD) */
"use strict";
(function(root){
const A=root.ARQ;
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const gray=g=>{const v=Math.round(255*g);return `rgb(${v},${v},${v})`;};

/* SVG de um desenho: px por metro = k */
function toSVG(D,opt={}){
  const [x0,y0,x1,y1]=D.bbox(), pad=opt.pad!=null?opt.pad:0.3, k=opt.k||60, mm=D.mm;
  const W=(x1-x0+2*pad)*k, H=(y1-y0+2*pad)*k, X=x=>((x-x0+pad)*k).toFixed(2), Y=y=>((y1-y+pad)*k).toFixed(2);
  const pw=w=>Math.max(opt.minW!=null?opt.minW:0.5,w*k*mm*0.9).toFixed(2);
  let o=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}" data-x0="${x0-pad}" data-y1="${y1+pad}" data-k="${k}">`;
  o+=`<rect width="100%" height="100%" fill="#fff"/>`;
  D.it.forEach(it=>{
    if(it.k==="f"){ const d=it.r.map(R=>"M"+R.map(p=>X(p[0])+" "+Y(p[1])).join("L")+"Z").join(""); o+=`<path d="${d}" fill="${gray(it.fill)}" fill-rule="evenodd" stroke="none"/>`; }
    else if(it.k==="l"){ const d="M"+it.p.map(p=>X(p[0])+" "+Y(p[1])).join("L"); const da=it.d?` stroke-dasharray="${it.d.map(v=>(v*k*mm).toFixed(1)).join(" ")}"`:"";
      o+=`<path d="${d}" fill="none" stroke="${it.c?gray(it.c):"#111"}" stroke-width="${pw(it.w)}" stroke-linecap="round" stroke-linejoin="round"${da}/>`; }
    else { const h=it.h*mm*k, an=it.al===1?"middle":it.al===2?"end":"start", dy=it.va===1?` dominant-baseline="central"`:"";
      o+=`<text x="${X(it.x)}" y="${Y(it.y)}" font-size="${(h/0.72).toFixed(2)}" text-anchor="${an}"${dy} font-family="Helvetica,Arial,sans-serif" font-weight="${it.b?700:400}" fill="#111"${it.ang?` transform="rotate(${(-it.ang).toFixed(2)} ${X(it.x)} ${Y(it.y)})"`:""}>${esc(it.s)}</text>`; }
  });
  return o+"</svg>";
}

/* ---------- PDF ---------- */
function pdfTxt(t){ return String(t).replace(/²/g,"\xB2").replace(/³/g,"\xB3").replace(/×/g,"x").replace(/[—–]/g,"-").replace(/[±]/g,"\xB1").replace(/[^\x20-\xFF]/g,"?").replace(/[\\()]/g,m=>"\\"+m); }
function to1252(str){ const o=new Uint8Array(str.length); for(let i=0;i<str.length;i++){const c=str.charCodeAt(i); o[i]=c<256?c:63;} return o; }
const SHEETS={A4:[297,210],A3:[420,297],A2:[594,420],A1:[841,594]};
const ML=25, MO=7, CW=180, CH=56;

/* organiza os desenhos nas pranchas. blocks: [{D,title}] (D gerado na escala den) */
function layout(blocks,fmt,den){
  const [W,H]=SHEETS[fmt], x0=ML+5, x1=W-MO-5, yT=H-MO-5, yB=MO+5, gap=8, titleH=9;
  const pages=[]; let pg=null, cx, cy, rowH;
  const newPage=()=>{ pg=[]; pages.push(pg); cx=x0; cy=yT; rowH=0; };
  newPage();
  for(const b of blocks){
    const bb=b.D.bbox(), w=(bb[2]-bb[0])*1000/den, h=(bb[3]-bb[1])*1000/den+(b.title?titleH:0);
    let placed=false, tries=0;
    while(!placed&&tries<3){ tries++;
      const avail=y=>(y-h<yB+CH+4)?x1-CW-gap:x1; // ao lado do carimbo
      if(cx+w<=avail(cy)&&cy-h>=yB){ pg.push({b,x:cx,y:cy,w,h,bb}); cx+=w+gap; rowH=Math.max(rowH,h); placed=true; break; }
      if(cx>x0){ cx=x0; cy-=rowH+gap; rowH=0; if(cx+w<=avail(cy)&&cy-h>=yB){ pg.push({b,x:cx,y:cy,w,h,bb}); cx+=w+gap; rowH=Math.max(rowH,h); placed=true; break; } }
      if(w>x1-x0||h>yT-yB) return null;
      newPage();
    }
    if(!placed) return null;
  }
  return pages;
}

function buildPDF(S,blocks,fmt,den){
  const pages=layout(blocks,fmt,den); if(!pages) return null;
  const [W,H]=SHEETS[fmt], n=v=>(+v).toFixed(3), out=[];
  pages.forEach((pg,pi)=>{
    const c=[]; c.push("2.834646 0 0 2.834646 0 0 cm 1 J 1 j");
    const col=(g,f)=>c.push(`${n(g)} ${f?"g":"G"}`);
    const text=(x,y,sz,t,b=false,al=0,rot=0)=>{ if(t==null||t==="")return; t=String(t); const w=A.textW(t,sz*0.72,b)*(al===1?.5:al===2?1:0); const a=rot*Math.PI/180,cs=Math.cos(a),sn=Math.sin(a);
      let x0=x-w*cs, y0=y-w*sn; const parts=t.split(/([²³])/);
      parts.forEach(pt=>{ if(!pt)return; const sup=pt==="²"||pt==="³", s2=sup?sz*0.62:sz, tx=sup?(pt==="²"?"2":"3"):pt, dy=sup?sz*0.38:0;
        c.push(`BT /${b?"F2":"F1"} ${n(s2)} Tf ${n(cs)} ${n(sn)} ${n(-sn)} ${n(cs)} ${n(x0-dy*sn)} ${n(y0+dy*cs)} Tm (${pdfTxt(tx)}) Tj ET`);
        const adv=A.textW(tx,s2*0.72,b); x0+=adv*cs; y0+=adv*sn; }); };
    const line=(x1,y1,x2,y2)=>c.push(`${n(x1)} ${n(y1)} m ${n(x2)} ${n(y2)} l S`);
    // moldura e carimbo
    col(0); col(0,true); c.push(`0.6 w`); c.push(`${n(ML)} ${n(MO)} ${n(W-ML-MO)} ${n(H-2*MO)} re S`);
    const cx=W-MO-CW, cy=MO; c.push(`0.4 w`); c.push(`${n(cx)} ${n(cy)} ${n(CW)} ${n(CH)} re S`);
    const rows=[12,9,8,7,12]; let yy=cy+CH; const yl=[]; rows.forEach(h=>{yy-=h; yl.push(yy); if(yy>cy+0.1){c.push("0.25 w"); line(cx,yy,cx+CW,yy);}});
    const lab=1.6, ts=2.2;
    text(cx+3,yl[0]+4.6,4.2,(S.emp||"").toUpperCase(),true);
    text(cx+3,yl[1]+6.2,lab,"OBRA"); text(cx+3,yl[1]+2.2,2.8,S.obra||"",true);
    line(cx+105,yl[2],cx+105,yl[1]); text(cx+3,yl[2]+5.6,lab,"CLIENTE"); text(cx+3,yl[2]+1.8,ts,S.cliente||"-"); text(cx+108,yl[2]+5.6,lab,"LOCAL"); text(cx+108,yl[2]+1.8,ts,S.local||"-");
    text(cx+3,yl[3]+5,lab,"CONTEÚDO"); text(cx+3,yl[3]+1.6,ts,pg.map(p=>p.b.title).filter(Boolean).join(", ").slice(0,95));
    text(cx+3,yl[4]+9.2,lab,"RESPONSÁVEL TÉCNICO"); text(cx+3,yl[4]+5.2,2.6,S.rtNome||"",true); text(cx+3,yl[4]+1.6,ts,S.crea||"");
    c.push("0.2 w"); line(cx+100,yl[4]+4.5,cx+CW-6,yl[4]+4.5); text(cx+100+(CW-106)/2,yl[4]+1.5,lab,"assinatura",false,1);
    const bx=[0,45,90,135]; bx.slice(1).forEach(x=>line(cx+x,cy,cx+x,yl[4]));
    [["ESCALA",`1:${den}`],["DATA",S.data||""],["REVISÃO",S.rev||"00"],["FOLHA",`${String(pi+1).padStart(2,"0")}/${String(pages.length).padStart(2,"0")}`]].forEach(([a,b],i)=>{text(cx+bx[i]+3,cy+4.4,lab,a);text(cx+bx[i]+3,cy+1.0,ts,b,true);});
    // desenhos
    pg.forEach(({b,x,y,w,h,bb})=>{
      const f=1000/den, ox=x-bb[0]*f, oy=y-(b.title?0:0)-bb[3]*f, P=(px,py)=>[ox+px*f, oy+py*f], mm=den/1000;
      b.D.it.forEach(it=>{
        if(it.k==="f"){ col(it.fill,true); c.push(it.r.map(R=>R.map((p,i)=>{const q=P(p[0],p[1]);return `${n(q[0])} ${n(q[1])} ${i?"l":"m"}`;}).join(" ")+" h").join(" ")+" f*"); }
        else if(it.k==="l"){ col(it.c||0); c.push(`${n(Math.max(0.09,it.w))} w ${it.d?`[${it.d.map(n).join(" ")}] 0 d`:"[] 0 d"}`);
          c.push(it.p.map((p,i)=>{const q=P(p[0],p[1]);return `${n(q[0])} ${n(q[1])} ${i?"l":"m"}`;}).join(" ")+" S"); }
        else { col(0,true); c.push("[] 0 d"); const q=P(it.x,it.y); const sz=it.h/0.72; let yv=q[1]; if(it.va===1){ const a=it.ang*Math.PI/180; q[0]+=Math.sin(a)*it.h/2; yv-=Math.cos(a)*it.h/2; }
          text(q[0],yv,sz,it.s,it.b,it.al,it.ang); }
      });
      c.push("[] 0 d"); col(0); col(0,true);
      if(b.title){ const ty=y-h+3.4; text(x+w/2,ty,4.4,b.title,true,1); c.push("0.35 w"); const tw=A.textW(b.title,4.4*0.72,true); line(x+w/2-tw/2,ty-1.2,x+w/2+tw/2,ty-1.2);
        if(!b.D.noScale) text(x+w/2,ty-4.6,2.4,`ESC. 1:${den}`,false,1); }
    });
    out.push(c.join("\n"));
  });
  const objs=["<< /Type /Catalog /Pages 2 0 R >>",`<< /Type /Pages /Kids [${out.map((_,i)=>`${5+2*i} 0 R`).join(" ")}] /Count ${out.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>","<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"];
  out.forEach((content,i)=>{ objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(W*2.834646)} ${n(H*2.834646)}] /Contents ${6+2*i} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>`);
    objs.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`); });
  let s="%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"; const offs=[];
  objs.forEach((o,i)=>{offs.push(s.length); s+=`${i+1} 0 obj\n${o}\nendobj\n`;});
  const xr=s.length; s+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`+offs.map(o=>String(o).padStart(10,"0")+" 00000 n \n").join("");
  s+=`trailer\n<< /Size ${objs.length+1} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF\n`;
  return {bytes:to1252(s),pages:pages.length};
}

/* ---------- DXF ---------- */
const LAY={PAREDE:[7,"CONTINUOUS"],"PAREDE-CORTE":[7,"CONTINUOUS"],ESQUADRIA:[4,"CONTINUOUS"],COTA:[3,"CONTINUOUS"],TEXTO:[2,"CONTINUOUS"],COBERTURA:[6,"CONTINUOUS"],
  CORTE:[1,"CONTINUOUS"],VISTA:[8,"CONTINUOUS"],TERRENO:[42,"CONTINUOUS"],FUNDACAO:[8,"CONTINUOUS"],PISO:[8,"CONTINUOUS"],LAJE:[8,"CONTINUOUS"],FORRO:[8,"CONTINUOUS"],QUADRO:[7,"CONTINUOUS"],TITULOS:[6,"CONTINUOUS"],GERAL:[7,"CONTINUOUS"],TRACEJADO:[6,"DASHED"]};
function dxfEnc(t){ return String(t).replace(/²/g,"2").replace(/³/g,"3").replace(/±/g,"%%p").replace(/[—–]/g,"-").replace(/[^\x20-\xFF]/g,"?"); }
function buildDXF(blocks,den){
  const ents=[]; let ox=0;
  blocks.forEach(b=>{ const bb=b.D.bbox(), dx=ox-bb[0], mm=den/1000;
    b.D.it.forEach(it=>{
      if(it.k==="l"){ const L=it.d?"TRACEJADO":(LAY[it.L]?it.L:"GERAL"); for(let i=0;i+1<it.p.length;i++) ents.push(["L",L,[it.p[i][0]+dx,it.p[i][1]],[it.p[i+1][0]+dx,it.p[i+1][1]]]); }
      else if(it.k==="t"){ let x=it.x+dx, y=it.y; if(it.va===1){const a=it.ang*Math.PI/180; x+=Math.sin(a)*it.h*mm/2; y-=Math.cos(a)*it.h*mm/2;} ents.push(["T",LAY[it.L]?it.L:"TEXTO",[x,y],it.h*mm,it.s,it.ang||0,it.al||0]); }
    });
    if(b.title) ents.push(["T","TITULOS",[(bb[0]+bb[2])/2+dx,bb[1]-8*mm],4.4*mm,b.title,0,1]);
    ox+=(bb[2]-bb[0])+15*mm*4; });
  const o=[], p=(c,v)=>o.push(String(c),String(v)), n=v=>(+v).toFixed(4);
  p(0,"SECTION");p(2,"HEADER");p(9,"$ACADVER");p(1,"AC1009");p(9,"$INSUNITS");p(70,6);p(9,"$DWGCODEPAGE");p(3,"ANSI_1252");p(9,"$LTSCALE");p(40,(den/50).toFixed(2));p(0,"ENDSEC");
  p(0,"SECTION");p(2,"TABLES");p(0,"TABLE");p(2,"LTYPE");p(70,2);
  p(0,"LTYPE");p(2,"CONTINUOUS");p(70,0);p(3,"Solid line");p(72,65);p(73,0);p(40,"0.0");
  p(0,"LTYPE");p(2,"DASHED");p(70,0);p(3,"__ __ __");p(72,65);p(73,2);p(40,"0.30");p(49,"0.20");p(49,"-0.10");
  p(0,"ENDTAB");p(0,"TABLE");p(2,"LAYER");p(70,Object.keys(LAY).length);
  Object.entries(LAY).forEach(([k,[cc,lt]])=>{p(0,"LAYER");p(2,"ARQ-"+k);p(70,0);p(62,cc);p(6,lt);});
  p(0,"ENDTAB");p(0,"ENDSEC");p(0,"SECTION");p(2,"ENTITIES");
  ents.forEach(e=>{ if(e[0]==="L"){p(0,"LINE");p(8,"ARQ-"+e[1]);p(10,n(e[2][0]));p(20,n(e[2][1]));p(30,0);p(11,n(e[3][0]));p(21,n(e[3][1]));p(31,0);}
    else {p(0,"TEXT");p(8,"ARQ-"+e[1]);p(10,n(e[2][0]));p(20,n(e[2][1]));p(30,0);p(40,n(e[3]));p(1,dxfEnc(e[4]));if(e[5])p(50,n(e[5]));if(e[6]){p(72,e[6]);p(11,n(e[2][0]));p(21,n(e[2][1]));p(31,0);}} });
  p(0,"ENDSEC");p(0,"EOF");
  return to1252(o.join("\r\n")+"\r\n");
}

/* todos os blocos da prancha, na escala den */
function blocksFor(S,den,sel){
  const B=[]; const P=A.plan(S,den); B.push({D:P,title:"PLANTA BAIXA"});
  const q=A.quadro(S,den); B.push({D:q,title:null});
  if(sel.AA!==false){ const d=A.section(S,den,"A"); B.push({D:d,title:"CORTE AA"}); }
  if(sel.BB!==false){ const d=A.section(S,den,"B"); B.push({D:d,title:"CORTE BB"}); }
  [["frontal","FACHADA FRONTAL"],["dir","FACHADA LATERAL DIREITA"],["esq","FACHADA LATERAL ESQUERDA"],["posterior","FACHADA POSTERIOR"]].forEach(([k,t])=>{ if(sel[k]){ B.push({D:A.elevation(S,den,k),title:t}); } });
  return B;
}
function autoPlan(S,fmt,sel,fixed){
  const prefs=fixed?[[1,fixed],[2,fixed],[3,fixed],[4,fixed]]:[[1,50],[1,75],[2,50],[1,100],[2,75],[2,100],[3,100],[3,125],[4,150],[4,200]];
  for(const [np,den] of prefs){ const B=blocksFor(S,den,sel); const L=layout(B,fmt,den); if(L&&L.length<=np) return {den,B,pages:L.length}; }
  return null;
}
root.ARQR={toSVG,buildPDF,buildDXF,blocksFor,autoPlan,layout,SHEETS};
if(typeof module!=="undefined") module.exports=root.ARQR;
})(typeof window!=="undefined"?window:globalThis);
