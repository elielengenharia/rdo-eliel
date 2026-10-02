/* Importação de planta: PDF vetorial (CAD), DXF e código de projeto. Paredes em qualquer ângulo. */
"use strict";
(function(root){
const A=root.ARQ, {add,sub,mul,dot,len,nrm,left}=A;
const cr=(a,b)=>a[0]*b[1]-a[1]*b[0];

/* linhas do PDF em coordenadas de tela (y para baixo), com marca de preenchimento */
async function pdfLines(page,lib){
  const OPS=lib.OPS, ol=await page.getOperatorList(), vp=page.getViewport({scale:1}), VT=vp.transform;
  const mulM=(m,n)=>[m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]];
  const ap=(m,x,y)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
  let ctm=[1,0,0,1,0,0], fillG=0; const st=[], segs=[]; let pend=[];
  const FILL=new Set([OPS.fill,OPS.eoFill,OPS.fillStroke,OPS.eoFillStroke,OPS.closeFillStroke,OPS.closeEOFillStroke].filter(v=>v!=null));
  const STROKE=new Set([OPS.stroke,OPS.closeStroke].filter(v=>v!=null));
  const flush=(filled)=>{ pend.forEach(s=>{s.f=filled?fillG:-1; segs.push(s);}); pend=[]; };
  for(let i=0;i<ol.fnArray.length;i++){ const fn=ol.fnArray[i], ar=ol.argsArray[i];
    if(fn===OPS.save) st.push([ctm,fillG]);
    else if(fn===OPS.restore){ const s=st.pop(); if(s){ctm=s[0];fillG=s[1];} }
    else if(fn===OPS.transform) ctm=mulM(ctm,ar);
    else if(fn===OPS.paintFormXObjectBegin){ st.push([ctm,fillG]); if(Array.isArray(ar[0])&&ar[0].length===6) ctm=mulM(ctm,ar[0]); }
    else if(fn===OPS.paintFormXObjectEnd){ const s=st.pop(); if(s){ctm=s[0];fillG=s[1];} }
    else if(fn===OPS.setFillRGBColor){ const c=ar; if(typeof c[0]==="string"){ const h=c[0].replace("#",""); fillG=(parseInt(h.slice(0,2),16)+parseInt(h.slice(2,4),16)+parseInt(h.slice(4,6),16))/765; } else { const k=(c[0]>1||c[1]>1||c[2]>1)?255:1; fillG=(c[0]+c[1]+c[2])/3/k; } }
    else if(fn===OPS.setFillGray) fillG=ar[0];
    else if(fn===OPS.constructPath){ const ops=ar[0], co=ar[1]; let k=0, cur=null, start=null; const M=mulM(VT,ctm);
      const addL=(a,b)=>{ const p=ap(M,a[0],a[1]), q=ap(M,b[0],b[1]); if(Math.hypot(q[0]-p[0],q[1]-p[1])>0.2) pend.push({a:p,b:q}); };
      for(const op of ops){
        if(op===OPS.moveTo){ cur=[co[k],co[k+1]]; start=cur; k+=2; }
        else if(op===OPS.lineTo){ const p=[co[k],co[k+1]]; if(cur) addL(cur,p); cur=p; k+=2; }
        else if(op===OPS.curveTo){ cur=[co[k+4],co[k+5]]; k+=6; }
        else if(op===OPS.curveTo2||op===OPS.curveTo3){ cur=[co[k+2],co[k+3]]; k+=4; }
        else if(op===OPS.closePath){ if(cur&&start) addL(cur,start); cur=start; }
        else if(op===OPS.rectangle){ const [x,y,w,h]=co.slice(k,k+4); const P=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]; for(let j=0;j<4;j++) addL(P[j],P[(j+1)%4]); cur=[x,y]; start=cur; k+=4; } }
      // pdf.js 3.x: o operador de pintura vem em seguida
      const nx=ol.fnArray[i+1]; if(FILL.has(nx)) flush(true); else if(STROKE.has(nx)) flush(false); }
    else if(FILL.has(fn)) flush(true); else if(STROKE.has(fn)) flush(false); else if(fn===OPS.endPath) pend=[];
  }
  flush(false);
  const tc=await page.getTextContent(), texts=[];
  tc.items.forEach(it=>{ const s=(it.str||"").trim(); if(!s) return; const m=lib.Util.transform(VT,it.transform); texts.push({s,x:m[4],y:m[5],h:Math.hypot(m[2],m[3])}); });
  return {segs,texts};
}

/* espessura de parede no papel: moda das distâncias entre linhas paralelas com boa sobreposição */
function lineInfo(s){ const d=sub(s.b,s.a), L=len(d); let u=mul(d,1/L); let ang=Math.atan2(u[1],u[0]); if(ang<0){ang+=Math.PI;} if(ang>=Math.PI-1e-9)ang-=Math.PI; u=[Math.cos(ang),Math.sin(ang)]; const n=left(u);
  const a0=dot(s.a,u), b0=dot(s.b,u); return {u,n,ang,c:dot(s.a,n),s0:Math.min(a0,b0),s1:Math.max(a0,b0),L,f:s.f}; }
function clusters(lines){ const cl=[]; lines.sort((p,q)=>p.ang-q.ang).forEach(l=>{ let c=cl.find(c=>{let d=Math.abs(c.ang-l.ang); d=Math.min(d,Math.PI-d); return d<0.012;});
  if(!c){c={ang:l.ang,ls:[]};cl.push(c);} if(Math.abs(c.ang-l.ang)>Math.PI/2){ l.c=-l.c; const t=-l.s0; l.s0=-l.s1; l.s1=t; } c.ls.push(l); }); return cl; }
function thicknessMode(lines,ext){
  const cl=clusters(lines.map(l=>({...l}))), H=new Map();
  cl.forEach(c=>{ const ls=c.ls.sort((p,q)=>p.c-q.c); for(let i=0;i<ls.length;i++)for(let j=i+1;j<ls.length;j++){ const d=ls[j].c-ls[i].c; if(d>ext*0.03)break; if(d<ext*0.001)continue;
    const ov=Math.min(ls[i].s1,ls[j].s1)-Math.max(ls[i].s0,ls[j].s0); if(ov<d*2.5)continue; const key=Math.round(Math.log(d)*40); H.set(key,(H.get(key)||0)+ov); } });
  let best=null; H.forEach((v,k)=>{ if(!best||v>best[1])best=[k,v]; }); return best?Math.exp(best[0]/40):null;
}

/* paredes a partir de linhas (em metros) */
function wallsFromLines(lines,tMin=0.06,tMax=0.42){
  const cl=clusters(lines.map(l=>({...l}))), walls=[], gapsAll=[];
  cl.forEach(c=>{ const u=[Math.cos(c.ang),Math.sin(c.ang)], n=left(u), ls=c.ls;
    const cand=[];
    ls.forEach((s,i)=>{ let best=null; ls.forEach((q,j)=>{ if(i===j)return; const d=Math.abs(q.c-s.c); if(d<tMin||d>tMax)return; const ov=Math.min(s.s1,q.s1)-Math.max(s.s0,q.s0); if(ov<0.10)return;
        if(!best||ov>best.ov+0.05||(Math.abs(ov-best.ov)<=0.05&&d<best.d)) best={d,q,ov}; });
      if(best) cand.push({c:(s.c+best.q.c)/2,a:Math.max(s.s0,best.q.s0),b:Math.min(s.s1,best.q.s1),t:best.d}); });
    cand.sort((p,q)=>p.c-q.c||p.a-q.a);
    const groups=[]; cand.forEach(x=>{ const g=groups.find(g=>Math.abs(g.c-x.c)<0.03&&Math.abs(g.t-x.t)<0.05); if(g)g.items.push(x); else groups.push({c:x.c,t:x.t,items:[x]}); });
    const out=[];
    groups.forEach(g=>{ const it=g.items.sort((p,q)=>p.a-q.a), lw=it.reduce((s,x)=>s+(x.b-x.a),0)||1, cc=it.reduce((s,x)=>s+x.c*(x.b-x.a),0)/lw, t=it.reduce((s,x)=>s+x.t*(x.b-x.a),0)/lw;
      let cur={c:cc,a:it[0].a,b:it[0].b,t,gaps:[]};
      for(let k=1;k<it.length;k++){ const x=it[k], gap=x.a-cur.b;
        if(gap<=6.2){ if(gap>=0.45) cur.gaps.push([cur.b,x.a]); cur.b=Math.max(cur.b,x.b); } else { out.push(cur); cur={c:cc,a:x.a,b:x.b,t,gaps:[]}; } }
      out.push(cur); });
    // tira trechos curtos contidos numa parede paralela maior
    const keep=out.filter(w=>!out.some(p=>p!==w&&(p.b-p.a)>(w.b-w.a)&&Math.abs(p.c-w.c)<=Math.max(p.t,0.12)&&p.a<=w.a+0.05&&p.b>=w.b-0.05));
    keep.forEach(w=>{ if(w.b-w.a<0.25)return; walls.push({a:add(mul(u,w.a),mul(n,w.c)),b:add(mul(u,w.b),mul(n,w.c)),t:w.t,gaps:w.gaps.map(([g0,g1])=>[g0-w.a,g1-g0])}); });
  });
  // encontro das pontas (qualquer ângulo)
  for(let pass=0;pass<2;pass++) walls.forEach((w,i)=>{ ["a","b"].forEach(end=>{ const P=w[end], O=end==="a"?w.b:w.a, d=nrm(sub(P,O)); let best=null;
    walls.forEach((v,j)=>{ if(i===j)return; const dv=nrm(sub(v.b,v.a)); if(Math.abs(cr(d,dv))<0.17)return;
      const den=cr(d,dv), X=add(P,mul(d,cr(sub(v.a,P),dv)/den)), s=dot(sub(X,P),d), reach=v.t/2+w.t/2+0.20;
      if(s<-(v.t/2+0.08)||s>reach)return; const tv=dot(sub(X,v.a),dv), Lv=len(sub(v.b,v.a)); if(tv<-(w.t/2+0.2)||tv>Lv+w.t/2+0.2)return;
      if(!best||Math.abs(s)<Math.abs(best.s))best={s,X,j,tv,Lv}; });
    if(best){ const sh=best.s; w[end]=best.X; if(end==="a") w.gaps=w.gaps.map(([g,l])=>[g+sh,l]);
      const v=walls[best.j]; if(best.tv<0) v.a=add(v.a,mul(nrm(sub(v.b,v.a)),best.tv)); else if(best.tv>best.Lv) v.b=add(v.b,mul(nrm(sub(v.b,v.a)),best.tv-best.Lv)); } }); });
  // maior conjunto ligado
  const N=walls.length, par=walls.map((_,i)=>i), fd=i=>par[i]===i?i:(par[i]=fd(par[i]));
  for(let i=0;i<N;i++)for(let j=i+1;j<N;j++){ const a=walls[i],b=walls[j]; if([a.a,a.b].some(p=>A.dseg(p,b.a,b.b)<0.25)||[b.a,b.b].some(p=>A.dseg(p,a.a,a.b)<0.25)) par[fd(i)]=fd(j); }
  const L={}; walls.forEach((w,i)=>{const r=fd(i);L[r]=(L[r]||0)+len(sub(w.b,w.a));}); const best=+Object.keys(L).sort((p,q)=>L[q]-L[p])[0];
  return walls.filter((_,i)=>fd(i)===best);
}

function finish(walls,texts,scale,tReal){
  if(!walls.length) return null;
  const xs=walls.flatMap(w=>[w.a[0],w.b[0]]), ys=walls.flatMap(w=>[w.a[1],w.b[1]]), x0=Math.min(...xs), y0=Math.min(...ys);
  const r2=v=>Math.round(v*1000)/1000, T=w=>Math.abs(w.t-tReal)<0.025?undefined:Math.round(w.t*100)/100;
  const W=walls.map(w=>{ const o={x1:r2(w.a[0]-x0),y1:r2(w.a[1]-y0),x2:r2(w.b[0]-x0),y2:r2(w.b[1]-y0)}; const t=T(w); if(t)o.t=t; return o; });
  const ab=[]; let np=0;
  walls.forEach((w,i)=>w.gaps.forEach(([g,l])=>{ np++; ab.push({n:"P"+np,t:l>=2.2?"PC":"PG",l:Math.round(l*100)/100,a:2.10,p:0,w:i,d:Math.round(g*1000)/1000}); }));
  // nomes de ambientes
  const rooms=[]; const words=(texts||[]).map(t=>({s:t.s,x:t.x*scale-x0,y:t.y*scale-y0,h:t.h*scale}))
    .filter(t=>/^[A-ZÀ-Úa-zà-ú][A-ZÀ-Úa-zà-ú\s\/\-\.]{2,}$/.test(t.s)&&!/^(PORTA|PORT|JANELA|A\s*COR|RER|COR)$/i.test(t.s)&&!/^A=/.test(t.s));
  const used=new Set();
  words.forEach((t,i)=>{ if(used.has(i))return; let s=t.s, x=t.x, y=t.y, n=1; used.add(i);
    words.forEach((q,j)=>{ if(used.has(j))return; if(Math.abs(q.x-x)<Math.max(1.2,q.h*8)&&q.y>y&&q.y-y<t.h*3.2+0.25){ s+=" "+q.s; y=(y*n+q.y)/(n+1); n++; used.add(j);} });
    rooms.push({n:s.replace(/\s+/g," ").trim().toLowerCase().replace(/(^|\s|\/)(\S)/g,(m,a,b)=>a+b.toUpperCase()),x:Math.round(x*100)/100,y:Math.round((y+t.h)*100)/100}); });
  return {walls:W,ab,rooms,scale};
}

async function fromPDF(file,pageNo,opt,lib){
  const doc=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false}).promise;
  const page=await doc.getPage(pageNo||1), raw=await pdfLines(page,lib);
  const lines=raw.segs.map(s=>({...lineInfo(s)})).filter(l=>l.L>0.5);
  if(lines.length<8) return {err:"Este PDF não tem linhas de desenho (parece escaneado). Use a leitura pelo Claude ou um DXF.",doc};
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; raw.segs.forEach(s=>[s.a,s.b].forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);}));
  const ext=Math.max(x1-x0,y1-y0);
  const filled=lines.filter(l=>l.f>=0&&l.f<0.92), useF=filled.reduce((s,l)=>s+l.L,0)>0.15*lines.reduce((s,l)=>s+l.L,0)&&filled.length>12;
  const base=useF?filled:lines, tReal=opt.t||0.15;
  let scale;
  if(opt.den){ scale=0.0254/72*opt.den; }
  else { const tp=thicknessMode(base,ext); if(!tp) return {err:"Não consegui achar a espessura das paredes. Escolha a escala da planta.",doc}; scale=tReal/tp; }
  const L2=base.map(l=>({...l,c:l.c*scale,s0:l.s0*scale,s1:l.s1*scale,L:l.L*scale}));
  const walls=wallsFromLines(L2);
  const res=finish(walls.map(w=>({...w})),raw.texts,scale,tReal);
  if(!res||res.walls.length<3) return {err:"Não encontrei paredes nesta página. Tente outra página ou informe a escala.",doc};
  res.doc=doc; res.filled=useF; res.den=scale/(0.0254/72); return res;
}

function fromDXFText(txt,unit){
  const L=txt.split(/\r?\n/), pr=[]; for(let i=0;i+1<L.length;i+=2) pr.push([L[i].trim(),L[i+1].trim()]);
  let units=0, sec="", ent=null; const segs=[];
  const flush=()=>{ if(!ent)return; if(ent.t==="LINE") segs.push({a:[ent[10],-ent[20]],b:[ent[11],-ent[21]]});
    if(ent.t==="LWPOLYLINE"){ const v=ent.v; for(let k=0;k+1<v.length;k++) segs.push({a:[v[k][0],-v[k][1]],b:[v[k+1][0],-v[k+1][1]]}); if(ent.cl&&v.length>2) segs.push({a:[v[v.length-1][0],-v[v.length-1][1]],b:[v[0][0],-v[0][1]]}); } ent=null; };
  for(let i=0;i<pr.length;i++){ const [c,v]=pr[i];
    if(c==="0"){ flush(); if(v==="SECTION"){ sec=pr[i+1]&&pr[i+1][1]; continue; } if(sec==="ENTITIES") ent={t:v,v:[]}; continue; }
    if(sec==="HEADER"&&c==="9"&&v==="$INSUNITS"&&pr[i+1]) units=+pr[i+1][1];
    if(!ent) continue;
    if(ent.t==="LWPOLYLINE"&&c==="10") ent.v.push([+v,0]); else if(ent.t==="LWPOLYLINE"&&c==="20") ent.v[ent.v.length-1][1]=+v;
    else if(c==="70"&&ent.t==="LWPOLYLINE") ent.cl=(+v&1)===1; else if(["10","20","11","21"].includes(c)) ent[c]=+v; }
  flush();
  let k=unit||{4:0.001,5:0.01,6:1}[units];
  if(!k){ const xs=segs.flatMap(s=>[s.a[0],s.b[0]]); const sp=Math.max(...xs)-Math.min(...xs); k=sp>2000?0.001:sp>200?0.01:1; }
  const lines=segs.map(s=>lineInfo({a:mul(s.a,k),b:mul(s.b,k)})).filter(l=>l.L>0.05);
  const walls=wallsFromLines(lines);
  return finish(walls,[],1,0.15);
}

const codeOf=S=>"ARQ1:"+btoa(unescape(encodeURIComponent(JSON.stringify({obra:S.obra,cliente:S.cliente,local:S.local,walls:S.walls,rooms:S.rooms,ab:S.ab,par:S.par,cuts:S.cuts,frente:S.frente}))));
const fdncOf=S=>"FDNC1:"+btoa(unescape(encodeURIComponent(JSON.stringify({obra:S.obra,cliente:S.cliente,local:S.local,walls:S.walls.map(w=>({x1:w.x1,y1:w.y1,x2:w.x2,y2:w.y2})),rooms:S.rooms.map(r=>({n:r.n,x:r.x,y:r.y})),
  ab:S.ab.map(o=>({n:o.n,t:o.t[0]==="J"?"Janela":"Porta",l:o.l,a:o.a,q:1})),off:[]}))));
function parseCode(t){ t=t.trim(); const m=/^(ARQ1|FDNC1):([\s\S]+)$/.exec(t); if(!m) return null;
  const o=JSON.parse(decodeURIComponent(escape(atob(m[2].replace(/\s+/g,""))))); if(m[1]==="FDNC1"){ o.ab=(o.ab||[]).flatMap(a=>Array.from({length:a.q||1},()=>({n:a.n.split(" ")[0],t:/jan/i.test(a.t)?"JC":"PG",l:+a.l,a:+a.a||2.1,p:/jan/i.test(a.t)?1.0:0,w:-1,d:0}))); }
  return o; }

root.ARQI={fromPDF,fromDXFText,codeOf,fdncOf,parseCode,wallsFromLines,thicknessMode,lineInfo};
})(typeof window!=="undefined"?window:globalThis);
