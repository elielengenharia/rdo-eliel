/* Desenho Arquitetônico — núcleo de geometria e desenho (sem DOM).
   Planta em metros, y para baixo (como na tela). Alturas z para cima, terreno em z = 0. */
"use strict";
(function(root){

const TIPOS={
  PG:{n:"Porta de giro",l:0.80,a:2.10,p:0,pref:"P"},
  PC:{n:"Porta de correr",l:1.60,a:2.10,p:0,pref:"P"},
  JC:{n:"Janela de correr",l:1.50,a:1.20,p:1.00,pref:"J"},
  JB:{n:"Basculante / maxim-ar",l:0.60,a:0.60,p:1.50,pref:"J"},
  PT:{n:"Portão",l:3.00,a:2.50,p:0,pref:"PT"},
  VL:{n:"Vão livre",l:1.00,a:2.10,p:0,pref:"V"}
};
const TELHAS={ceramica:{n:"Telha cerâmica",e:0.12,inc:30},fibro:{n:"Telha de fibrocimento",e:0.06,inc:15},termo:{n:"Telha termoacústica (sanduíche)",e:0.05,inc:10}};

/* ---------- vetores ---------- */
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]], sub=(a,b)=>[a[0]-b[0],a[1]-b[1]], mul=(a,k)=>[a[0]*k,a[1]*k];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1], cr=(a,b)=>a[0]*b[1]-a[1]*b[0], len=a=>Math.hypot(a[0],a[1]);
const nrm=a=>{const l=Math.hypot(a[0],a[1])||1;return[a[0]/l,a[1]/l];}, left=d=>[-d[1],d[0]];
function lineInt(p,d,q,e){const den=cr(d,e); if(Math.abs(den)<1e-9) return null; const t=cr(sub(q,p),e)/den; return add(p,mul(d,t));}
function area(P){let s=0;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];s+=a[0]*b[1]-b[0]*a[1];}return s/2;}
function pip(pt,P){let ins=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>pt[1])!==(b[1]>pt[1])&&pt[0]<(b[0]-a[0])*(pt[1]-a[1])/(b[1]-a[1])+a[0])ins=!ins;}return ins;}
function dseg(p,a,b){const d=sub(b,a),L2=dot(d,d);let t=L2?dot(sub(p,a),d)/L2:0;t=Math.max(0,Math.min(1,t));return len(sub(p,add(a,mul(d,t))));}
function dpoly(p,P){let m=1e9;for(let i=0;i<P.length;i++)m=Math.min(m,dseg(p,P[i],P[(i+1)%P.length]));return m;}
function centroid(P){let A=0,x=0,y=0;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],c=a[0]*b[1]-b[0]*a[1];A+=c;x+=(a[0]+b[0])*c;y+=(a[1]+b[1])*c;}return Math.abs(A)<1e-9?P[0]:[x/(3*A),y/(3*A)];}
function labelPt(P){ // ponto bem dentro do polígono
  const c=centroid(P); let best=pip(c,P)?c:null, bd=best?dpoly(c,P):-1;
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; P.forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);});
  for(let i=1;i<12;i++)for(let j=1;j<12;j++){const q=[x0+(x1-x0)*i/12,y0+(y1-y0)*j/12]; if(!pip(q,P))continue; const d=dpoly(q,P)-0.15*len(sub(q,c)); if(d>bd){bd=d;best=q;}}
  return best||c;
}
/* intervalos de uma reta/segmento dentro de polígonos (par-ímpar) */
function segInPolys(a,b,polys){
  const d=sub(b,a), ts=[0,1];
  polys.forEach(P=>{for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length],e=sub(q,p),den=cr(d,e); if(Math.abs(den)<1e-12)continue;
    const t=cr(sub(p,a),e)/den, s=cr(sub(p,a),d)/den; if(t>0&&t<1&&s>=-1e-9&&s<=1+1e-9) ts.push(t);}});
  ts.sort((x,y)=>x-y); const out=[];
  for(let i=0;i+1<ts.length;i++){const t0=ts[i],t1=ts[i+1]; if(t1-t0<1e-9)continue; const m=add(a,mul(d,(t0+t1)/2)); let n=0; polys.forEach(P=>{if(pip(m,P))n++;});
    if(n%2===1){ if(out.length&&Math.abs(out[out.length-1][1]-t0)<1e-9) out[out.length-1][1]=t1; else out.push([t0,t1]); }}
  return out;
}
function subIntervals(base,cuts){ // base [a,b], cuts lista [c0,c1] -> partes restantes
  let parts=[base]; cuts.forEach(([c0,c1])=>{const np=[];parts.forEach(([a,b])=>{ if(c1<=a||c0>=b){np.push([a,b]);return;} if(c0>a)np.push([a,c0]); if(c1<b)np.push([c1,b]); }); parts=np;});
  return parts.filter(([a,b])=>b-a>1e-6);
}
function offsetPoly(P,dist){ // desloca para o lado [-dy,dx] de cada aresta (poligono qualquer)
  const N=P.length, L=P.map((p,k)=>{const q=P[(k+1)%N],d=nrm(sub(q,p));return{o:add(p,mul(left(d),dist)),d,p};});
  return L.map((c,k)=>{const pv=L[(k-1+N)%N]; const X=lineInt(pv.o,pv.d,c.o,c.d); return (!X||len(sub(X,c.p))>Math.abs(dist)*6+0.5)?add(c.p,mul(left(c.d),dist)):X;});
}
function simplify(P){ // remove vértices alinhados
  let Q=P.slice(), ch=true; while(ch&&Q.length>3){ ch=false; for(let i=0;i<Q.length;i++){ const a=Q[(i-1+Q.length)%Q.length],b=Q[i],c=Q[(i+1)%Q.length];
    if(len(sub(b,a))<1e-6||Math.abs(cr(nrm(sub(b,a)),nrm(sub(c,b))))<1e-4&&dot(sub(b,a),sub(c,b))>0){ Q.splice(i,1); ch=true; break; } } } return Q; }
function clipHalf(P,k,c,keepGE){ // mantém p·k >= c (ou <=)
  const out=[], f=p=>keepGE?dot(p,k)-c:c-dot(p,k);
  for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],fa=f(a),fb=f(b);
    if(fa>=0)out.push(a); if((fa>=0)!==(fb>=0)){const t=fa/(fa-fb);out.push(add(a,mul(sub(b,a),t)));}}
  return out;
}

/* ---------- geometria da planta ---------- */
function geom(S){
  const T0=S.par.t;
  const W=S.walls.map((w,i)=>({i,a:[+w.x1,+w.y1],b:[+w.x2,+w.y2],t:+(w.t||T0)})).filter(w=>len(sub(w.b,w.a))>0.05&&[...w.a,...w.b].every(Number.isFinite));
  const G={W,rooms:[],outers:[],stubs:[],sides:[],msg:[]};
  if(W.length<3){G.msg.push("Cadastre pelo menos 3 paredes.");return G;}
  // pontos de corte em cada parede
  const cuts=W.map(()=>[0,1]);
  for(let i=0;i<W.length;i++)for(let j=i+1;j<W.length;j++){
    const A=W[i],B=W[j],da=sub(A.b,A.a),db=sub(B.b,B.a),La=len(da),Lb=len(db),den=cr(da,db);
    if(Math.abs(den)/(La*Lb)>1e-3){
      const ta=cr(sub(B.a,A.a),db)/den, tb=cr(sub(B.a,A.a),da)/den, ea=0.04/La, eb=0.04/Lb;
      if(ta>=-ea&&ta<=1+ea&&tb>=-eb&&tb<=1+eb){cuts[i].push(Math.max(0,Math.min(1,ta)));cuts[j].push(Math.max(0,Math.min(1,tb)));}
    } else { // colineares: pontas que tocam
      [[A,B,i],[B,A,j]].forEach(([X,Y,k])=>{[Y.a,Y.b].forEach(p=>{const d=sub(X.b,X.a),L2=dot(d,d),t=dot(sub(p,X.a),d)/L2; if(t>0&&t<1&&dseg(p,X.a,X.b)<0.02)cuts[k].push(t);});});
    }
  }
  const nodes=[], nid=p=>{for(let k=0;k<nodes.length;k++)if(len(sub(nodes[k],p))<0.03)return k; nodes.push(p);return nodes.length-1;};
  let edges=[];
  W.forEach((w,k)=>{const ts=[...new Set(cuts[k].map(t=>+t.toFixed(6)))].sort((x,y)=>x-y), d=sub(w.b,w.a);
    for(let q=0;q+1<ts.length;q++){const u=nid(add(w.a,mul(d,ts[q]))),v=nid(add(w.a,mul(d,ts[q+1]))); if(u!==v)edges.push({u,v,w:w.i,t:w.t});}});
  const ek=new Set(); edges=edges.filter(e=>{const k=Math.min(e.u,e.v)+"-"+Math.max(e.u,e.v); if(ek.has(k))return false; ek.add(k); return true;});
  // poda de pontas soltas (paredes em balanço = "toco")
  let alive=edges.map(()=>true), changed=true;
  while(changed){changed=false; const deg=nodes.map(()=>0); edges.forEach((e,k)=>{if(alive[k]){deg[e.u]++;deg[e.v]++;}});
    edges.forEach((e,k)=>{if(alive[k]&&(deg[e.u]<2||deg[e.v]<2)){alive[k]=false;changed=true;}});}
  edges.forEach((e,k)=>{if(!alive[k])G.stubs.push({a:nodes[e.u],b:nodes[e.v],w:e.w,t:e.t});});
  const E=edges.filter((e,k)=>alive[k]);
  const adj=nodes.map(()=>[]);
  E.forEach((e,k)=>{adj[e.u].push({to:e.v,k});adj[e.v].push({to:e.u,k});});
  adj.forEach((L,n)=>L.forEach(o=>{const d=sub(nodes[o.to],nodes[n]);o.ang=Math.atan2(d[1],d[0]);}));
  adj.forEach(L=>L.sort((x,y)=>x.ang-y.ang));
  const used=new Set(), cycles=[];
  E.forEach((e,k)=>[[e.u,e.v],[e.v,e.u]].forEach(([s0,t0])=>{
    if(used.has(s0+">"+t0))return; const cyc=[]; let u=s0,v=t0,guard=0;
    while(!used.has(u+">"+v)&&guard++<5000){used.add(u+">"+v); const ed=E[adj[u].find(o=>o.to===v).k]; cyc.push({p:nodes[u],q:nodes[v],w:ed.w,t:ed.t});
      const L=adj[v], ix=L.findIndex(o=>o.to===u); const nx=L[(ix-1+L.length)%L.length]; u=v; v=nx.to;}
    cycles.push(cyc);}));
  // face sempre à esquerda algébrica ([-dy,dx]): área > 0 = ambiente, área < 0 = contorno externo
  const offC=cyc=>{const N=cyc.length,L=cyc.map(h=>{const d=nrm(sub(h.q,h.p)),n=left(d);return{o:add(h.p,mul(n,h.t/2)),d,n,h};});
    const pts=L.map((c,k)=>{const pv=L[(k-1+N)%N];const X=lineInt(pv.o,pv.d,c.o,c.d);return(!X||len(sub(X,c.h.p))>Math.max(c.h.t,pv.h.t)*4)?add(c.h.p,mul(c.n,c.h.t/2)):X;});
    return {poly:pts,ed:pts.map((p,k)=>({p,q:pts[(k+1)%N],w:cyc[k].w}))};};
  cycles.forEach(cyc=>{ if(cyc.length<3)return; const ax=cyc.map(h=>h.p), A=area(ax); if(Math.abs(A)<1e-4)return;
    const o=offC(cyc);
    if(A>0){ const a=area(o.poly); if(a>0.05) G.rooms.push({axis:ax,poly:o.poly,ed:o.ed,area:a}); }
    else G.outers.push({axis:ax,poly:o.poly,ed:o.ed,area:-area(o.poly)}); });
  G.outers.sort((a,b)=>b.area-a.area);
  if(!G.outers.length){G.msg.push("As paredes não fecham nenhum ambiente. Confira se as pontas se encontram.");return G;}
  // rótulos dos ambientes
  G.rooms.forEach((r,k)=>{const lab=(S.rooms||[]).find(o=>pip([+o.x,+o.y],r.poly)); r.name=lab?lab.n:("Ambiente "+(k+1)); r.nv=lab&&lab.nv!=null&&lab.nv!==""?+lab.nv:null;
    r.lp=lab?[+lab.x,+lab.y]:labelPt(r.poly); r.src=lab||null;});
  // lados externos (arestas colineares unidas). Normal [-dy,dx] aponta para fora.
  G.outers.forEach((O,oi)=>{const ed=O.ed, N=ed.length; let st=0;
    for(let k=0;k<N;k++){const a=nrm(sub(ed[k].q,ed[k].p)),b=nrm(sub(ed[(k-1+N)%N].q,ed[(k-1+N)%N].p)); if(Math.abs(cr(a,b))>2e-3||dot(a,b)<0){st=k;break;}}
    let cur=null;
    for(let s=0;s<N;s++){const e=ed[(st+s)%N], d=nrm(sub(e.q,e.p)); if(len(sub(e.q,e.p))<1e-6)continue;
      if(cur&&Math.abs(cr(cur.d,d))<2e-3&&dot(cur.d,d)>0){cur.b=e.q;cur.ws.add(e.w);}
      else{ if(cur)G.sides.push(cur); cur={a:e.p,b:e.q,d,ws:new Set([e.w]),o:oi}; }}
    if(cur)G.sides.push(cur);});
  G.sides.forEach((s,k)=>{s.L=len(sub(s.b,s.a)); s.d=nrm(sub(s.b,s.a)); s.n=left(s.d); s.k=k;});
  // quadro geral
  const F=G.outers[0].poly; let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; G.outers.forEach(O=>O.poly.forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);}));
  G.box=[x0,y0,x1,y1]; G.F=F;
  G.areaC=G.outers.reduce((s,O)=>s+O.area,0); G.areaU=G.rooms.reduce((s,r)=>s+r.area,0);
  // frente
  const want=S.frente!=null?[Math.cos(S.frente),Math.sin(S.frente)]:[0,1];
  let best=null; G.sides.forEach(s=>{ if(s.L<0.6)return; const sc=dot(s.n,want)*(S.frente!=null?100:1)+ (S.frente!=null?0:s.L/50); if(!best||sc>best.sc)best={s,sc}; });
  G.front=best?best.s:G.sides[0]; G.m=G.front.n;
  // eixo dominante (para os cortes): direção com mais comprimento de parede
  const bins={}; W.forEach(w=>{ const d=nrm(sub(w.b,w.a)); let a=Math.atan2(d[1],d[0]); a=((a%(Math.PI/2))+Math.PI/2)%(Math.PI/2); const k=Math.round(a*180/Math.PI); bins[k]=(bins[k]||0)+len(sub(w.b,w.a)); });
  const ka=+Object.keys(bins).sort((x,y)=>bins[y]-bins[x])[0]*Math.PI/180, c1=[Math.cos(ka),Math.sin(ka)], c2=[-Math.sin(ka),Math.cos(ka)];
  const cand=[c1,mul(c1,-1),c2,mul(c2,-1)]; G.mA=cand.sort((x,y)=>dot(y,G.m)-dot(x,G.m))[0];
  // normal de cada fachada: lado externo mais alinhado
  const pick=v=>{ let b=null; G.sides.forEach(sd=>{ if(sd.L<0.5)return; const sc=dot(sd.n,v)+0.002*sd.L; if(dot(sd.n,v)>0.6&&(!b||sc>b.sc))b={sc,n:sd.n}; }); return b?b.n:v; };
  const r=[G.m[1],-G.m[0]]; G.views={frontal:G.m,posterior:pick(mul(G.m,-1)),dir:pick(r),esq:pick(mul(r,-1))};
  return G;
}

/* ---------- aberturas ---------- */
function opGeo(S,o){
  const w=S.walls[o.w]; if(!w) return null; const a=[+w.x1,+w.y1],b=[+w.x2,+w.y2],L=len(sub(b,a)); if(L<0.05)return null;
  const d=nrm(sub(b,a)), t=+(w.t||S.par.t), s0=Math.max(0,Math.min(+o.d||0,L-(+o.l))), A=add(a,mul(d,s0)), B=add(a,mul(d,s0+(+o.l)));
  return {A,B,d,n:left(d),t,L,s0,l:+o.l,h:+o.a,p:+o.p||0,tipo:o.t,inv:!!o.inv,hg:!!o.hg,w:o.w,o};
}
function mergeEd(ed){ // une arestas colineares consecutivas (ciclo) -> [{p,q,ws:Set}]
  const N=ed.length; if(!N) return []; let st=0;
  for(let k=0;k<N;k++){const a=nrm(sub(ed[k].q,ed[k].p)),b=nrm(sub(ed[(k-1+N)%N].q,ed[(k-1+N)%N].p)); if(Math.abs(cr(a,b))>2e-3||dot(a,b)<0){st=k;break;}}
  const out=[]; let cur=null;
  for(let s=0;s<N;s++){const e=ed[(st+s)%N]; if(len(sub(e.q,e.p))<1e-6)continue; const d=nrm(sub(e.q,e.p));
    if(cur&&Math.abs(cr(cur.d,d))<2e-3&&dot(cur.d,d)>0){cur.q=e.q;cur.ws.add(e.w);} else { if(cur)out.push(cur); cur={p:e.p,q:e.q,d,ws:new Set([e.w])}; }}
  if(cur)out.push(cur); return out;
}
function opsOf(S){ return (S.ab||[]).map(o=>opGeo(S,o)).filter(Boolean); }

/* ---------- cobertura ---------- */
function roofModel(S,G){
  const P=S.par, hp=+P.hp, E=hp+(+P.pd), i=(+P.inc)/100, b=+P.beiral, tel=TELHAS[P.telha]||TELHAS.ceramica, e=tel.e;
  const m=G.mA||G.m, r=[m[1],-m[0]], F=simplify(G.F);
  const R={type:P.cob,E,i,e,planes:[],ridge:null,top:E};
  const dirOf=q=>q==="frente"?m:q==="fundos"?mul(m,-1):q==="dir"?r:mul(r,-1);
  if(P.cob==="plat"){
    R.top=E+(+P.hplat);
    const fall=dirOf(P.queda||"fundos"), inner=offsetPoly(F,-(+P.t)); // para dentro (F tem orientação negativa)
    const inn=area(inner)<0?inner:offsetPoly(F,+P.t);
    const hi=Math.max(...inn.map(p=>dot(p,fall))), lo=Math.min(...inn.map(p=>dot(p,fall)));
    const z0=E+0.25; // laje/estrutura até a telha
    R.planes.push({poly:inn,z:p=>z0+i*(hi-dot(p,fall)),fall,low:hi});
    R.rise=i*(hi-lo); R.hiZ=z0+R.rise;
    if(R.hiZ+e>R.top-0.05) R.warn=`A telha embutida (sobe ${R.rise.toFixed(2).replace(".",",")} m) passa da platibanda. Aumente a platibanda para pelo menos ${(R.hiZ+e-E+0.10).toFixed(2).replace(".",",")} m ou reduza a inclinação.`;
    return R;
  }
  const Bp=offsetPoly(F,b); // F orientação negativa: [-dy,dx] aponta para fora
  if(P.cob==="uma"){
    const fall=dirOf(P.queda||"fundos"), lowEdge=Math.max(...F.map(p=>dot(p,fall)));
    const z=p=>E+i*(lowEdge-dot(p,fall));
    R.planes.push({poly:Bp,z,fall}); R.top=Math.max(...Bp.map(z))+e; R.zU=z;
    return R;
  }
  // duas águas
  const k=P.cume==="per"?r:m, vals=F.map(p=>dot(p,k)), mn=Math.min(...vals), mx=Math.max(...vals), mid=(mn+mx)/2, half=(mx-mn)/2;
  const z=p=>E+i*(half-Math.abs(dot(p,k)-mid));
  const A=clipHalf(Bp,k,mid,true), B=clipHalf(Bp,k,mid,false);
  if(A.length>2)R.planes.push({poly:A,z,fall:k,ridgeK:k,mid});
  if(B.length>2)R.planes.push({poly:B,z,fall:mul(k,-1),ridgeK:k,mid});
  R.ridge={k,mid}; R.top=E+i*half+e; R.zU=z;
  return R;
}
function wallTopExt(S,R,p){ if(R.type==="plat") return R.top; return Math.max(R.E,R.zU(p)); }

/* ---------- itens de desenho ----------
   l: polilinha {k:"l",p:[[x,y]..],w(mm),d:dash?,L:layer,c:cinza?}
   f: preenchimento {k:"f",r:[anéis],fill:0..1 (cinza),L}
   t: texto {k:"t",x,y,s,h(mm),al:0|1|2,ang,b,L}
   Coordenadas do desenho em metros com Y para cima. */
function Drw(den){ this.it=[]; this.den=den; this.mm=den/1000; }
Drw.prototype={
  l(p,w=0.25,L="GERAL",d=null,c=0){ if(p.length>1)this.it.push({k:"l",p,w,L,d,c}); },
  f(r,fill=0.5,L="HACHURA"){ this.it.push({k:"f",r,fill,L}); },
  t(x,y,s,h=2,al=0,ang=0,b=false,L="TEXTO",va=0){ if(s!==""&&s!=null)this.it.push({k:"t",x,y,s:String(s),h,al,ang,b,L,va}); },
  bbox(){ let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; const e=(x,y)=>{x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);};
    this.it.forEach(o=>{ if(o.k==="l")o.p.forEach(p=>e(p[0],p[1])); else if(o.k==="f")o.r.forEach(R=>R.forEach(p=>e(p[0],p[1])));
      else { const w=textW(o.s,o.h*this.mm,o.b), h=o.h*this.mm, a=o.ang*Math.PI/180, sh=o.al===1?-w/2:o.al===2?-w:0, vy=o.va===1?-h/2:0;
        [[sh,vy],[sh+w,vy],[sh,vy+h],[sh+w,vy+h]].forEach(([dx,dy])=>e(o.x+dx*Math.cos(a)-dy*Math.sin(a),o.y+dx*Math.sin(a)+dy*Math.cos(a))); } });
    return [x0,y0,x1,y1]; }
};
// larguras Helvetica (1/1000 em) para 32..126
const HW="278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584".split(",").map(Number);
const HWB="278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584".split(",").map(Number);
function textW(s,h,b){ const t=b?HWB:HW; let w=0; for(const ch of String(s)){const c=ch.normalize("NFD").charCodeAt(0); w+=(c>=32&&c<=126?t[c-32]:556);} return w/1000*h/0.72; }

const fm=(v,d=2)=>(Math.round(v*10**d)/10**d).toFixed(d).replace(".",",");

/* cota alinhada entre a e b (pontos do desenho), deslocada off (m) para o lado n */
function dimAl(D,a,b,n,off,txt,ext=null,alt=1){
  const mm=D.mm, d=nrm(sub(b,a)), A=add(a,mul(n,off)), B=add(b,mul(n,off));
  D.l([A,B],0.13,"COTA");
  const tk=1.2*mm, q=add(mul(d,tk),mul(n,tk));
  [A,B].forEach(P=>D.l([sub(P,q),add(P,q)],0.25,"COTA"));
  if(ext!==false){ [a,b].forEach((P,i)=>{const s=ext&&ext[i]!=null?ext[i]:1.5*mm; D.l([add(P,mul(n,s)),add(P,mul(n,off+1.5*mm))],0.13,"COTA");}); }
  let ang=Math.atan2(d[1],d[0])*180/Math.PI, tn=n; if(ang>90.5||ang<-89.5){ang+=180;}
  const L=len(sub(b,a)), tw=textW(txt,2*mm), mid=mul(add(A,B),0.5);
  const up=[-Math.sin(ang*Math.PI/180),Math.cos(ang*Math.PI/180)]; const sgn=dot(up,tn)>=0?1:-1;
  let pos=add(mid,mul(up,sgn*0.9*mm)); if(sgn<0) pos=add(pos,mul(up,-2*mm*1.0));
  if(tw>L-0.6*mm){ if(alt>0) pos=add(pos,mul(up,sgn*2.6*mm)); else pos=add(mid,mul(up,-sgn*(sgn<0?0.9:3.0)*mm)); }
  D.t(pos[0],pos[1],txt,2,1,ang,false,"COTA");
  return tw>L-0.6*mm;
}

/* ---------- PLANTA ---------- */
function plan(S,den,opt={}){
  const G=geom(S), D=new Drw(den), mm=D.mm, Y=p=>[p[0],-p[1]];
  D.G=G; if(!G.outers.length) return D;
  const ops=opsOf(S);
  // pochê
  const rings=[...G.outers.map(O=>O.poly),...G.rooms.map(r=>r.poly)].map(R=>R.map(Y));
  D.f(rings,0.42,"PAREDE");
  G.stubs.forEach(s=>{const d=nrm(sub(s.b,s.a)),n=left(d),h=s.t/2,a=sub(s.a,mul(d,h)),b=add(s.b,mul(d,h)); D.f([[add(a,mul(n,h)),add(b,mul(n,h)),sub(b,mul(n,h)),sub(a,mul(n,h))].map(Y)],0.42,"PAREDE");});
  // vãos (branco)
  ops.forEach(g=>{const h=g.t/2+0.004; D.f([[add(g.A,mul(g.n,h)),add(g.B,mul(g.n,h)),sub(g.B,mul(g.n,h)),sub(g.A,mul(g.n,h))].map(Y)],1,"VAO");});
  // contornos menos os vãos
  const allEd=[...G.outers.flatMap(O=>O.ed),...G.rooms.flatMap(r=>r.ed)];
  allEd.forEach(e=>{const d=sub(e.q,e.p),L=len(d); if(L<1e-6)return; const u=mul(d,1/L);
    const cuts=ops.filter(g=>g.w===e.w&&Math.abs(cr(g.d,u))<1e-3).map(g=>{const s0=dot(sub(g.A,e.p),u),s1=dot(sub(g.B,e.p),u);return[Math.min(s0,s1),Math.max(s0,s1)];});
    subIntervals([0,L],cuts).forEach(([s0,s1])=>D.l([Y(add(e.p,mul(u,s0))),Y(add(e.p,mul(u,s1)))],0.35,"PAREDE"));});
  G.stubs.forEach(s=>{const d=nrm(sub(s.b,s.a)),n=left(d),h=s.t/2,a=sub(s.a,mul(d,h)),b=add(s.b,mul(d,h));D.l([add(a,mul(n,h)),add(b,mul(n,h)),sub(b,mul(n,h)),sub(a,mul(n,h)),add(a,mul(n,h))].map(Y),0.35,"PAREDE");});
  // esquadrias
  const out=p=>!G.outers.some(O=>pip(p,O.poly))||G.rooms.some(r=>false);
  ops.forEach(g=>{
    const h=g.t/2, n=g.n, A=g.A, B=g.B, d=g.d;
    [A,B].forEach(P=>D.l([Y(add(P,mul(n,h))),Y(sub(P,mul(n,h)))],0.35,"PAREDE"));
    if(g.tipo==="PG"){ const s=g.inv?-1:1, H=g.hg?B:A, O=g.hg?A:B, Hf=add(H,mul(n,s*h)), Of=add(O,mul(n,s*h)), lf=add(Hf,mul(n,s*g.l));
      D.l([Y(Hf),Y(lf)],0.25,"ESQUADRIA");
      const a0=Math.atan2(lf[1]-Hf[1],lf[0]-Hf[0]), a1=Math.atan2(Of[1]-Hf[1],Of[0]-Hf[0]); let da=a1-a0; while(da>Math.PI)da-=2*Math.PI; while(da<-Math.PI)da+=2*Math.PI;
      const arc=[]; for(let k=0;k<=18;k++){const a=a0+da*k/18; arc.push(Y([Hf[0]+g.l*Math.cos(a),Hf[1]+g.l*Math.sin(a)]));} D.l(arc,0.13,"ESQUADRIA");
    } else if(g.tipo==="PC"||g.tipo==="PT"){ const half=g.l/2+0.05, o=Math.min(h*0.35,0.04);
      [[A,add(A,mul(d,half)),o],[sub(B,mul(d,half)),B,-o]].forEach(([p,q,of])=>{const k=0.015; D.l([add(p,mul(n,of+k)),add(q,mul(n,of+k)),add(q,mul(n,of-k)),add(p,mul(n,of-k)),add(p,mul(n,of+k))].map(Y),0.18,"ESQUADRIA");});
    } else if(g.tipo==="JC"||g.tipo==="JB"){
      [h,-h].forEach(of=>D.l([Y(add(A,mul(n,of))),Y(add(B,mul(n,of)))],0.13,"ESQUADRIA"));
      if(g.tipo==="JC"){ const half=g.l/2+0.03; D.l([Y(add(A,mul(n,0.02))),Y(add(add(A,mul(d,half)),mul(n,0.02)))],0.25,"ESQUADRIA"); D.l([Y(add(sub(B,mul(d,half)),mul(n,-0.02))),Y(add(B,mul(n,-0.02)))],0.25,"ESQUADRIA"); }
      else D.l([Y(A),Y(B)],0.25,"ESQUADRIA");
    }
    // etiqueta
    const mid=mul(add(A,B),0.5), side=out(add(mid,mul(n,h+0.05)))?1:(out(add(mid,mul(n,-h-0.05)))?-1:(g.tipo==="PG"&&!g.inv?-1:1));
    const tp=add(mid,mul(n,side*(h+3.2*mm))); const ang=Math.atan2(-d[1],d[0])*180/Math.PI; const a2=ang>90.5?ang-180:ang<-89.5?ang+180:ang;
    D.t(tp[0],-tp[1],g.o.n||"",2.2,1,a2,true,"ESQUADRIA",1);
  });
  // ambientes
  G.rooms.forEach(r=>{ const p=r.lp; D.t(p[0],-p[1]+1.2*mm,(r.name||"").toUpperCase(),2.6,1,0,true,"TEXTO");
    D.t(p[0],-p[1]-2.6*mm,"A="+fm(r.area)+"m²",1.9,1,0,false,"TEXTO");
    const nv=r.nv!=null?r.nv:+S.par.hp; const q=[p[0]-3*mm,-p[1]-6*mm];
    D.l([[q[0]-1.3*mm,q[1]],[q[0]+1.3*mm,q[1]]],0.18,"TEXTO"); D.l([[q[0],q[1]-1.3*mm],[q[0],q[1]+1.3*mm]],0.18,"TEXTO");
    D.t(q[0]+2*mm,q[1]-0.8*mm,(nv>=0?"+":"")+fm(nv),1.8,0,0,false,"TEXTO"); });
  // projeção da cobertura
  if(opt.roof!==false){ const R=roofModel(S,G);
    R.planes.forEach(pl=>{ D.l([...pl.poly,pl.poly[0]].map(Y),0.18,"COBERTURA",[3,1.5]); });
    if(R.ridge){ const k=R.ridge.k, t=[k[1],-k[0]], pts=G.F.map(p=>dot(p,t)); const s0=Math.min(...pts)-(+S.par.beiral), s1=Math.max(...pts)+(+S.par.beiral);
      const P0=add(mul(k,R.ridge.mid),mul(t,s0)),P1=add(mul(k,R.ridge.mid),mul(t,s1)); D.l([Y(P0),Y(P1)],0.18,"COBERTURA",[6,1.5,1,1.5]); }
    const avoid=[...G.rooms.map(r=>r.lp),...ops.map(g=>mul(add(g.A,g.B),0.5))];
    R.planes.forEach(pl=>{ let c=labelPt(pl.poly), bd=-1; { let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; pl.poly.forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);});
        for(let i=1;i<16;i++)for(let j=1;j<16;j++){const q=[x0+(x1-x0)*i/16,y0+(y1-y0)*j/16]; if(!pip(q,pl.poly)||dpoly(q,pl.poly)<0.7)continue; const d=Math.min(...avoid.map(a=>len(sub(a,q))),2.5)+Math.min(1,dpoly(q,pl.poly))*0.3; if(d>bd){bd=d;c=q;}} }
      const f=pl.fall, a=add(c,mul(f,-0.5)), b=add(c,mul(f,0.5)), hd=1.8*mm, s=left(f);
      D.l([Y(a),Y(b)],0.18,"COBERTURA"); D.l([Y(add(sub(b,mul(f,hd)),mul(s,hd*0.5))),Y(b),Y(sub(sub(b,mul(f,hd)),mul(s,hd*0.5)))],0.18,"COBERTURA");
      const ang=Math.atan2(-f[1],f[0])*180/Math.PI, a2=ang>90.5?ang-180:ang<-89.5?ang+180:ang; const tp=add(c,mul(s,2.2*mm));
      D.t(tp[0],-tp[1],"i="+fm(+S.par.inc,0)+"%",1.8,1,a2,false,"COBERTURA",1); });
  }
  // cotas externas
  if(opt.dims!==false){
    G.sides.forEach(sd=>{ if(sd.L<0.25)return; const u=sd.d, n=sd.n, ps=[0,sd.L];
      const inner=add(sd.a,mul(n,-(S.par.t))); // linha da face interna (aprox.)
      G.W.forEach(w=>{ const dw=nrm(sub(w.b,w.a)); if(Math.abs(cr(dw,u))<0.85)return;
        const nearA=dseg(w.a,sub(sd.a,mul(n,w.t)),sub(sd.b,mul(n,w.t)))<w.t, nearB=dseg(w.b,sub(sd.a,mul(n,w.t)),sub(sd.b,mul(n,w.t)))<w.t;
        const cross=segInPolys(w.a,w.b,[[add(sd.a,mul(n,0.01)),add(sd.b,mul(n,0.01)),sub(sd.b,mul(n,2*w.t)),sub(sd.a,mul(n,2*w.t))]]).length>0;
        if(!nearA&&!nearB&&!cross)return;
        const nw=left(dw); [1,-1].forEach(sg=>{const X=lineInt(add(w.a,mul(nw,sg*w.t/2)),dw,sub(sd.a,mul(n,+(w.t))),u); if(!X)return; const s=dot(sub(X,sd.a),u); if(s>0.005&&s<sd.L-0.005)ps.push(s);}); });
      ops.forEach(g=>{ if(!sd.ws.has(g.w))return; [g.A,g.B].forEach(P=>{const s=dot(sub(P,sd.a),u); if(s>0.005&&s<sd.L-0.005)ps.push(s);}); });
      const pp=[...new Set(ps.map(s=>+s.toFixed(3)))].sort((a,b)=>a-b).filter((s,i,a)=>i===0||s-a[i-1]>0.035); if(pp.length>1&&sd.L-pp[pp.length-1]>1e-6){ if(sd.L-pp[pp.length-1]<0.035) pp[pp.length-1]=sd.L; else pp.push(sd.L); }
      const bei=S.par.cob==="plat"?0:+S.par.beiral, off1=Math.max(7*mm,bei+4*mm), off2=off1+7*mm, Ya=p=>Y(p), nY=[n[0],-n[1]];
      let alt=1; for(let k=0;k+1<pp.length;k++){ const a=add(sd.a,mul(u,pp[k])),b=add(sd.a,mul(u,pp[k+1])); const short=dimAl(D,Ya(a),Ya(b),nY,off1,fm(pp[k+1]-pp[k]),null,alt); alt=short?-alt:1; }
      if(pp.length>2) dimAl(D,Ya(sd.a),Ya(sd.b),nY,off2,fm(sd.L),[off1+1.5*mm,off1+1.5*mm]);
    });
  }
  // linhas de corte
  if(opt.cuts!==false){ const C=cutDefs(S,G);
    C.forEach(c=>{ const k=c.m, t=[k[1],-k[0]], us=G.F.map(p=>dot(p,t)), u0=Math.min(...us)-1.2, u1=Math.max(...us)+1.2;
      const P0=add(mul(k,c.c),mul(t,u0)),P1=add(mul(k,c.c),mul(t,u1)); D.l([Y(P0),Y(P1)],0.25,"CORTE",[8,2,1.5,2]);
      [P0,P1].forEach((P,i)=>{ const a=add(P,mul(k,0.05)), b=add(P,mul(k,9*mm)); D.l([Y(P),Y(b)],0.35,"CORTE");
        const hd=2*mm; D.l([Y(add(sub(b,mul(k,hd)),mul(t,hd*0.6))),Y(b),Y(sub(sub(b,mul(k,hd)),mul(t,hd*0.6)))],0.35,"CORTE");
        const tp=add(add(P,mul(k,5*mm)),mul(t,(i?1:-1)*3.2*mm)); D.t(tp[0],-tp[1],c.id,3.2,1,0,true,"CORTE",1); }); });
  }
  return D;
}
function cutDefs(S,G){
  const m=G.mA||G.m, r=[m[1],-m[0]];
  const mk=(id,k,frac,name)=>{ const vs=G.F.map(p=>dot(p,k)), v0=Math.min(...vs), v1=Math.max(...vs); return {id,m:k,c:v0+(v1-v0)*frac,v0,v1,name}; };
  const C=S.cuts||{};
  return [mk("A",m,C.a!=null&&C.a!==""?+C.a:autoFrac(S,G,m),"CORTE AA"),mk("B",r,C.b!=null&&C.b!==""?+C.b:autoFrac(S,G,r),"CORTE BB")];
}
function autoFrac(S,G,k){
  const t=[k[1],-k[0]], vs=G.F.map(p=>dot(p,k)), v0=Math.min(...vs), v1=Math.max(...vs), us=G.F.map(p=>dot(p,t)), u0=Math.min(...us)-1, u1=Math.max(...us)+1;
  const allP=[...G.outers.map(O=>O.poly),...G.rooms.map(r=>r.poly)], ops=opsOf(S); let best=null;
  for(let f=0.2;f<=0.801;f+=0.0125){ const c=v0+(v1-v0)*f, a=add(mul(k,c),mul(t,u0)), b=add(mul(k,c),mul(t,u1)), L=len(sub(b,a));
    const roomL=G.rooms.reduce((s,r)=>s+segInPolys(a,b,[r.poly]).reduce((q,[x,y])=>q+(y-x)*L,0),0);
    const poch=segInPolys(a,b,allP), pl=poch.reduce((q,[x,y])=>q+(y-x)*L,0), maxp=Math.max(0,...poch.map(([x,y])=>(y-x)*L));
    let bon=0; ops.forEach(g=>{ if(Math.abs(cr(g.d,t))<0.2)return; const h=g.t/2+0.01; if(segInPolys(a,b,[[add(g.A,mul(g.n,h)),add(g.B,mul(g.n,h)),sub(g.B,mul(g.n,h)),sub(g.A,mul(g.n,h))]]).length) bon+=g.tipo[0]==="J"?1.2:0.6; });
    const sc=roomL-8*Math.max(0,maxp-0.4)-2*pl+bon-1.5*Math.abs(f-0.5);
    if(!best||sc>best.sc)best={f,sc}; }
  return best?best.f:0.5;
}

/* ---------- vistas 3D: fachadas e cortes ---------- */
function frameOf(m){ const r=[m[1],-m[0]]; return {m,r,P:(p,z)=>[dot(p,r),z,dot(p,m)]}; }
function newell(P){ let nx=0,ny=0,nz=0; for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length]; nx+=(a[1]-b[1])*(a[2]+b[2]); ny+=(a[2]-b[2])*(a[0]+b[0]); nz+=(a[0]-b[0])*(a[1]+b[1]);} return [nx,ny,nz]; }
function clipV(P,c){ // mantém v <= c (pontos [u,z,v])
  const out=[]; for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],fa=c-a[2],fb=c-b[2];
    if(fa>=0)out.push(a); if((fa>=0)!==(fb>=0)){const t=fa/(fa-fb);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]);}}
  return out;
}
/* remoção de linhas ocultas: faces planas (u,z,v), segmentos 3D. v maior = mais perto. */
function hlr(faces,segs){
  const F=faces.map((f,id)=>{ const N=newell(f.P); if(Math.abs(N[2])<1e-6*(Math.abs(N[0])+Math.abs(N[1])+1e-12)||Math.abs(N[2])<1e-9) return null;
    const p0=f.P[0], P2=f.P.map(p=>[p[0],p[1]]); let a=1e9,b=1e9,A=-1e9,B=-1e9; P2.forEach(p=>{a=Math.min(a,p[0]);A=Math.max(A,p[0]);b=Math.min(b,p[1]);B=Math.max(B,p[1]);});
    return {id:f.id!=null?f.id:id,P2,box:[a,b,A,B],v:(u,z)=>p0[2]-(N[0]*(u-p0[0])+N[1]*(z-p0[1]))/N[2]}; }).filter(Boolean);
  const out=[];
  segs.forEach(s=>{ const a=s.a,b=s.b, du=b[0]-a[0], dz=b[1]-a[1], dv=b[2]-a[2]; if(Math.hypot(du,dz)<1e-7)return;
    const sb=[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])]; const hid=[];
    F.forEach(f=>{ if(f.id===s.own)return; if(f.box[0]>sb[2]+1e-9||f.box[2]<sb[0]-1e-9||f.box[1]>sb[3]+1e-9||f.box[3]<sb[1]-1e-9)return;
      const ts=[0,1], P=f.P2;
      for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length],e=[q[0]-p[0],q[1]-p[1]],den=du*e[1]-dz*e[0]; if(Math.abs(den)<1e-14)continue;
        const t=((p[0]-a[0])*e[1]-(p[1]-a[1])*e[0])/den, w=((p[0]-a[0])*dz-(p[1]-a[1])*du)/den; if(t>0&&t<1&&w>=-1e-9&&w<=1+1e-9)ts.push(t);}
      ts.sort((x,y)=>x-y);
      for(let i=0;i+1<ts.length;i++){ const t0=ts[i],t1=ts[i+1]; if(t1-t0<1e-9)continue; const tm=(t0+t1)/2, m=[a[0]+du*tm,a[1]+dz*tm];
        if(!pip(m,P)||dpoly(m,P)<1e-6)continue;
        const g=t=>f.v(a[0]+du*t,a[1]+dz*t)-(a[2]+dv*t), g0=g(t0),g1=g(t1), eps=2e-3;
        if(g0>eps&&g1>eps)hid.push([t0,t1]); else if(g0>eps||g1>eps){const tc=t0+(t1-t0)*(eps-g0)/(g1-g0); if(g0>eps)hid.push([t0,tc]); else hid.push([tc,t1]);} } });
    subIntervals([0,1],hid).forEach(([t0,t1])=>{ if((t1-t0)*Math.hypot(du,dz)<1e-4)return; out.push({p:[[a[0]+du*t0,a[1]+dz*t0],[a[0]+du*t1,a[1]+dz*t1]],w:s.w,L:s.L,d:s.d,c:s.c}); });
  });
  return out;
}
function faceSegs(P,own,w,L,skip){ const s=[]; for(let i=0;i<P.length;i++){ if(skip&&skip(i))continue; s.push({a:P[i],b:P[(i+1)%P.length],own,w,L}); } return s; }

/* monta o modelo 3D para uma direção de vista (m = normal apontando para o observador) */
function scene(S,G,m,cut){
  const P=S.par, hp=+P.hp, E=hp+(+P.pd), R=roofModel(S,G), fr=frameOf(m), ops=opsOf(S);
  const faces=[], segs=[]; let fid=0;
  const pushFace=(pts,L,w,extra)=>{ let Q=pts; if(cut)Q=clipV(Q,cut.c-1e-6); if(Q.length<3)return null; const id=fid++; faces.push({P:Q,id}); faceSegs(Q,id,w,L).forEach(s=>segs.push(s)); return id; };
  const pr=(p,z)=>fr.P(p,z);
  // paredes: faces externas (contorno) e, no corte, faces internas dos ambientes
  const wallFaces=[];
  G.outers.forEach(O=>mergeEd(O.ed).forEach(e=>wallFaces.push({e,ext:true})));
  if(cut) G.rooms.forEach(r=>mergeEd(r.ed).forEach(e=>wallFaces.push({e,ext:false})));
  wallFaces.forEach(({e,ext})=>{
    const d=sub(e.q,e.p), L=len(d); if(L<1e-4)return; const nO=left(nrm(d)); // aponta para o lado da face (fora, ou para dentro do ambiente)
    if(dot(nO,m)<0.02)return;
    const zb=ext?0:hp, top=p=>ext?wallTopExt(S,R,p):E;
    const tsBreak=[0,1]; if(ext&&R.ridge&&R.type!=="plat"){ const k=R.ridge.k, a=dot(e.p,k)-R.ridge.mid, b=dot(e.q,k)-R.ridge.mid; if(a*b<0)tsBreak.splice(1,0,a/(a-b)); }
    const topPts=tsBreak.map(t=>{const p=add(e.p,mul(d,t));return pr(p,top(p));});
    const poly=[pr(e.p,zb),pr(e.q,zb),...topPts.slice().reverse()];
    const id=pushFace(poly,"VISTA",0.25);
    if(id==null)return;
    // aberturas desta face
    ops.filter(g=>e.ws.has(g.w)&&Math.abs(cr(g.d,nrm(d)))<1e-3).forEach(g=>{
      const u=nrm(d), s0=dot(sub(g.A,e.p),u), s1=dot(sub(g.B,e.p),u), a=Math.max(0,Math.min(s0,s1)), b=Math.min(L,Math.max(s0,s1)); if(b-a<0.05)return;
      const z0=hp+g.p, z1=hp+g.p+g.h, pa=add(e.p,mul(u,a)), pb=add(e.p,mul(u,b)), N=mul(nO,0.001);
      const q=(p,z)=>pr(add(p,N),z), rect=[q(pa,z0),q(pb,z0),q(pb,z1),q(pa,z1)];
      const add3=(A,B,w=0.18)=>{ let a3=A,b3=B; if(cut&&(a3[2]>cut.c||b3[2]>cut.c))return; segs.push({a:a3,b:b3,own:id,w,L:"ESQUADRIA"}); };
      for(let k=0;k<4;k++) add3(rect[k],rect[(k+1)%4],0.25);
      const ins=0.05, ri=[q(add(pa,mul(u,ins)),z0+(g.p>0?ins:0)),q(sub(pb,mul(u,ins)),z0+(g.p>0?ins:0)),q(sub(pb,mul(u,ins)),z1-ins),q(add(pa,mul(u,ins)),z1-ins)];
      for(let k=0;k<4;k++) if(!(g.p===0&&k===0)) add3(ri[k],ri[(k+1)%4],0.13);
      const mid=add(pa,mul(u,(b-a)/2));
      if(g.tipo==="PC"||g.tipo==="JC") add3(q(mid,z0+(g.p>0?ins:0)),q(mid,z1-ins),0.18);
      if(g.tipo==="JB"){ const zm=(z0+z1)/2; add3(q(add(pa,mul(u,ins)),zm),q(sub(pb,mul(u,ins)),zm),0.13); }
      if(g.tipo==="PG"){ const hx=g.hg?add(pa,mul(u,0.12)):sub(pb,mul(u,0.12)); add3(q(hx,hp+1.0),q(hx,hp+1.1),0.35); }
      if(g.tipo==="PT"){ const nlam=Math.max(2,Math.round((b-a)/0.3)); for(let k=1;k<nlam;k++){const px=add(pa,mul(u,(b-a)*k/nlam)); add3(q(px,z0+ins),q(px,z1-ins),0.09);} }
    });
  });
  // toquinhos de parede (só fachada)
  // cobertura aparente
  if(R.type!=="plat"){
    const tel=P.telha;
    R.planes.forEach(pl=>{
      const poly=pl.poly, z=pl.z;
      const top=poly.map(p=>pr(p,z(p)+R.e));
      const tid=pushFace(top,"COBERTURA",0.25);
      // testeiras (bordas) exceto cumeeira
      for(let k=0;k<poly.length;k++){ const p=poly[k],q=poly[(k+1)%poly.length];
        if(pl.ridgeK&&Math.abs(dot(p,pl.ridgeK)-pl.mid)<1e-6&&Math.abs(dot(q,pl.ridgeK)-pl.mid)<1e-6)continue;
        pushFace([pr(p,z(p)),pr(q,z(q)),pr(q,z(q)+R.e),pr(p,z(p)+R.e)],"COBERTURA",0.25); }
      // hachura da telha
      if(tid!=null&&dot(pl.fall,m)>-1e-6){ const f=pl.fall, sdir=left(f), along=tel==="ceramica"?sdir:f, step=tel==="ceramica"?0.40:tel==="fibro"?0.18:0.25;
        const across=tel==="ceramica"?f:sdir; const vs=poly.map(p=>dot(p,across)), v0=Math.min(...vs), v1=Math.max(...vs), us=poly.map(p=>dot(p,along)), u0=Math.min(...us)-1, u1=Math.max(...us)+1;
        for(let v=v0+step/2;v<v1;v+=step){ const a=add(mul(across,v),mul(along,u0)), b=add(mul(across,v),mul(along,u1));
          segInPolys(a,b,[poly]).forEach(([t0,t1])=>{ const A=add(a,mul(sub(b,a),t0)),B=add(a,mul(sub(b,a),t1)); let a3=pr(A,z(A)+R.e+0.002),b3=pr(B,z(B)+R.e+0.002);
            if(cut){ if(a3[2]>cut.c&&b3[2]>cut.c)return; if(a3[2]>cut.c||b3[2]>cut.c){const tt=(cut.c-a3[2])/(b3[2]-a3[2]); const X=[a3[0]+(b3[0]-a3[0])*tt,a3[1]+(b3[1]-a3[1])*tt,cut.c]; if(a3[2]>cut.c)a3=X; else b3=X;} }
            segs.push({a:a3,b:b3,own:tid,w:0.09,L:"COBERTURA",c:0.45}); }); } }
    });
  }
  return {faces,segs,R,fr,ops};
}

function levelMark(D,x,y,txt,ty){ const mm=D.mm, s=1.6*mm; ty=ty==null?y:ty;
  D.l([[x-s,y+s*1.4],[x+s,y+s*1.4],[x,y],[x-s,y+s*1.4]],0.18,"COTA"); D.l([[x-s*2.2,y],[x+s*9,y]],0.13,"COTA");
  if(ty-y>0.5*mm) D.l([[x+s*1.1,y+s*1.4],[x+s*1.1,ty+s*1.4]],0.09,"COTA");
  D.t(x+s*1.3,ty+s*1.9,txt,1.9,0,0,false,"COTA"); }
function levels(D,x,L){ L.sort((a,b)=>a[0]-b[0]); let last=-1e9; const gap=3.4*D.mm; L.forEach(([z,t])=>{ const ty=Math.max(z,last+gap); levelMark(D,x,z,t,ty); last=ty; }); }
const nvTxt=z=>(z>=0?"+":"")+fm(z);

function elevation(S,den,which){
  const G=geom(S), D=new Drw(den), mm=D.mm; D.G=G; if(!G.outers.length) return D;
  const m=G.views[which]||G.m;
  const {faces,segs,R,fr}=scene(S,G,m,null);
  const vis=hlr(faces,segs);
  vis.forEach(s=>D.l(s.p,s.w,s.L,s.d,s.c));
  // terreno
  const us=G.outers.flatMap(O=>O.poly.map(p=>dot(p,fr.r))), u0=Math.min(...us), u1=Math.max(...us), b=R.type==="plat"?0:+S.par.beiral;
  D.l([[u0-b-1.0,0],[u1+b+1.0,0]],0.5,"TERRENO");
  // níveis
  const P=S.par, hp=+P.hp, E=hp+(+P.pd), xL=u1+b+1.0+4*mm;
  const LV=[[0,"±0,00 TERRENO"],[hp,nvTxt(hp)+" PISO"]];
  if(R.type==="plat"){ LV.push([E,nvTxt(E)+" FORRO"],[R.top,nvTxt(R.top)+" PLATIBANDA"]); }
  else { const zt=Math.max(...faces.flatMap(f=>f.P.map(p=>p[1]))); LV.push([E,nvTxt(E)+" BEIRAL"],[zt,nvTxt(zt)+(R.type==="duas"?" CUMEEIRA":" TOPO")]); }
  levels(D,xL,LV);
  // cota da largura
  dimAl(D,[u0,0],[u1,0],[0,-1],6*mm,fm(u1-u0),false);
  D.title={frontal:"FACHADA FRONTAL",posterior:"FACHADA POSTERIOR",dir:"FACHADA LATERAL DIREITA",esq:"FACHADA LATERAL ESQUERDA"}[which];
  return D;
}

function section(S,den,id){
  const G=geom(S), D=new Drw(den), mm=D.mm; D.G=G; if(!G.outers.length) return D;
  const cd=cutDefs(S,G).find(c=>c.id===id), m=cd.m, k=m, t=[k[1],-k[0]];
  const P=S.par, hp=+P.hp, E=hp+(+P.pd);
  const {faces,segs,R,fr,ops}=scene(S,G,m,{c:cd.c});
  // linha do corte no plano
  const us=G.F.map(p=>dot(p,t)), uMin=Math.min(...us)-5, uMax=Math.max(...us)+5;
  const L0=add(mul(k,cd.c),mul(t,uMin)), L1=add(mul(k,cd.c),mul(t,uMax)), U=p=>dot(p,t);
  const cutPolys=[]; // [{P:[[u,z]],fill}]
  const allPolys=[...G.outers.map(O=>O.poly),...G.rooms.map(r=>r.poly)];
  const wallInt=segInPolys(L0,L1,allPolys); // trechos dentro do pochê
  const pts=t0=>add(L0,mul(sub(L1,L0),t0));
  const nearOuter=p=>G.outers.some(O=>dpoly(p,O.poly)<(+P.t)*1.6);
  wallInt.forEach(([t0,t1])=>{
    const a=pts(t0), b=pts(t1), mid=mul(add(a,b),0.5), ext=nearOuter(mid), ua=U(a), ub=U(b);
    const zTop=ext?wallTopExt(S,R,mid):E, zBot=ext?0:hp;
    // aberturas que cruzam este trecho
    const holes=[];
    ops.forEach(g=>{ const h=g.t/2+0.01, Q=[add(g.A,mul(g.n,h)),add(g.B,mul(g.n,h)),sub(g.B,mul(g.n,h)),sub(g.A,mul(g.n,h))];
      const iv=segInPolys(a,b,[Q]); if(iv.length) holes.push([hp+g.p,hp+g.p+g.h]); });
    const zs=subIntervals([zBot,zTop],holes);
    zs.forEach(([z0,z1])=>cutPolys.push({P:[[ua,z0],[ub,z0],[ub,z1],[ua,z1]],fill:0.25}));
    // baldrame
    cutPolys.push({P:[[ua-0.025,-0.35],[ub+0.025,-0.35],[ub+0.025,Math.min(0,hp-0.08)],[ua-0.025,Math.min(0,hp-0.08)]],fill:0.75,L:"FUNDACAO"});
  });
  // ambientes cortados: contrapiso e forro/laje
  const roomInt=[]; G.rooms.forEach(r=>segInPolys(L0,L1,[r.poly]).forEach(([t0,t1])=>roomInt.push({r,ua:U(pts(t0)),ub:U(pts(t1))})));
  roomInt.forEach(({r,ua,ub})=>{
    cutPolys.push({P:[[ua,hp-0.08],[ub,hp-0.08],[ub,hp],[ua,hp]],fill:0.75,L:"PISO"});
    if(P.forro==="laje") cutPolys.push({P:[[ua-(+P.t)/2,E],[ub+(+P.t)/2,E],[ub+(+P.t)/2,E+0.10],[ua-(+P.t)/2,E+0.10]],fill:0.6,L:"LAJE"});
  });
  // cobertura cortada
  R.planes.forEach(pl=>{ segInPolys(L0,L1,[pl.poly]).forEach(([t0,t1])=>{ const a=pts(t0),b=pts(t1),za=pl.z(a),zb=pl.z(b);
    cutPolys.push({P:[[U(a),za],[U(b),zb],[U(b),zb+R.e],[U(a),za+R.e]],fill:0.35,L:"COBERTURA"});
    if(R.type==="plat"){ const lowP=[a,b].sort((x,y)=>pl.z(x)-pl.z(y))[0], ul=U(lowP), sg=U(lowP)<(U(a)+U(b))/2?1:-1, zl=pl.z(lowP);
      D.l([[ul,zl],[ul,zl-0.15],[ul+sg*0.30,zl-0.15],[ul+sg*0.30,zl+0.02]],0.25,"COBERTURA"); D.t(ul+sg*0.15,zl-0.15-2.6*mm,"CALHA",1.7,1,0,false,"TEXTO"); }
  }); });
  // faces de corte também ocultam o que está atrás
  cutPolys.forEach(c=>faces.push({P:c.P.map(p=>[p[0],p[1],cd.c]),id:-99}));
  const vis=hlr(faces,segs);
  vis.forEach(s=>D.l(s.p,s.w*0.85,s.L==="VISTA"?"VISTA":s.L,s.d,s.c));
  cutPolys.forEach(c=>{ D.f([c.P],c.fill,"CORTE-HACH"); D.l([...c.P,c.P[0]],c.fill>0.5?0.18:0.4,c.L||"PAREDE-CORTE"); });
  if(P.forro==="forro") roomInt.forEach(({ua,ub})=>{ D.l([[ua,E],[ub,E]],0.25,"FORRO"); D.l([[ua,E-0.01],[ub,E-0.01]],0.13,"FORRO"); });
  // terreno
  const fuA=Math.min(...G.F.map(U)), fuB=Math.max(...G.F.map(U)), bb=R.type==="plat"?0:+P.beiral;
  D.l([[fuA-bb-1,0],[fuB+bb+1,0]],0.5,"TERRENO");
  // nomes dos ambientes
  roomInt.forEach(({r,ua,ub})=>{ if(ub-ua>0.6) D.t((ua+ub)/2,hp+1.1,(r.name||"").toUpperCase(),2.2,1,0,true,"TEXTO"); });
  // níveis
  const xL=fuB+bb+1+4*mm, zt=Math.max(R.top,...cutPolys.map(c=>Math.max(...c.P.map(p=>p[1]))));
  levels(D,xL,[[0,"±0,00 TERRENO"],[hp,nvTxt(hp)+" PISO"],[E,nvTxt(E)+(P.forro==="laje"?" LAJE":" FORRO")],[zt,nvTxt(zt)+(R.type==="plat"?" PLATIBANDA":R.type==="duas"?" CUMEEIRA":" TOPO")]]);
  // cotas verticais à esquerda
  const xV=fuA-bb-1-2*mm; const vz=[0,hp,E,zt].filter((z,i,a)=>i===0||z-a[i-1]>0.01);
  for(let i=0;i+1<vz.length;i++) dimAl(D,[xV,vz[i]],[xV,vz[i+1]],[-1,0],5*mm,fm(vz[i+1]-vz[i]),false);
  // cotas horizontais (paredes e ambientes)
  const hu=[...new Set([...wallInt.flatMap(([t0,t1])=>[U(pts(t0)),U(pts(t1))])].map(v=>+v.toFixed(3)))].sort((a,b)=>a-b);
  for(let i=0;i+1<hu.length;i++) if(hu[i+1]-hu[i]>0.005) dimAl(D,[hu[i],-0.35],[hu[i+1],-0.35],[0,-1],6*mm,fm(hu[i+1]-hu[i]),false);
  D.title="CORTE "+id+id; D.warn=R.warn;
  return D;
}

/* ---------- quadro de esquadrias e áreas (em mm de papel) ---------- */
function quadro(S,den){
  const D=new Drw(den), mm=D.mm, G=geom(S);
  const grp={}; (S.ab||[]).forEach(o=>{ const k=[o.n,o.t,(+o.l).toFixed(2),(+o.a).toFixed(2),(+o.p||0).toFixed(2)].join("|"); grp[k]=(grp[k]||0)+1; });
  const rows=Object.entries(grp).sort((a,b)=>a[0].localeCompare(b[0],"pt",{numeric:true})).map(([k,q])=>{const [n,t,l,a,p]=k.split("|");return [n,(TIPOS[t]||{n:t}).n,fm(+l)+" x "+fm(+a),fm(+p),String(q)];});
  const cw=[16,48,26,18,12], W=cw.reduce((a,b)=>a+b,0), rh=5.5; let y=0;
  const T=(x,yy,s,h=2,al=0,b=false)=>D.t(x*mm,yy*mm,s,h,al,0,b,"QUADRO");
  T(0,y+1.5,"QUADRO DE ESQUADRIAS",3,0,true); y-=2;
  const head=["CÓD.","TIPO","L x H (m)","PEIT.","QUANT."];
  const line=(yy)=>D.l([[0,yy*mm],[W*mm,yy*mm]],0.18,"QUADRO");
  line(y); let x=0; head.forEach((h,i)=>{T(x+1.2,y-rh+1.6,h,1.8,0,true);x+=cw[i];}); y-=rh; line(y);
  rows.forEach(r=>{ x=0; r.forEach((c,i)=>{T(x+1.2,y-rh+1.6,c,1.9);x+=cw[i];}); y-=rh; line(y); });
  x=0; [0,...cw].forEach((c,i)=>{x+=c; D.l([[x*mm,-2*mm],[x*mm,y*mm]],0.18,"QUADRO");});
  y-=8; T(0,y+1.5,"QUADRO DE ÁREAS",3,0,true); y-=2; line(y);
  const ar=[["Área construída",fm(G.areaC||0)+" m²"],["Área útil (ambientes)",fm(G.areaU||0)+" m²"],...G.rooms.map(r=>["   "+r.name,fm(r.area)+" m²"])];
  ar.forEach(([a,b])=>{ T(1.2,y-rh+1.6,a,1.9); T(W-1.2,y-rh+1.6,b,1.9,2); y-=rh; line(y); });
  D.l([[0,(y+rh*ar.length)*mm],[0,y*mm]],0.18,"QUADRO"); D.l([[W*mm,(y+rh*ar.length)*mm],[W*mm,y*mm]],0.18,"QUADRO");
  D.title=null; D.noScale=true;
  return D;
}

function autoSwing(S){ const G=geom(S); (S.ab||[]).forEach(o=>{ if(o.t!=="PG"||o.inv!=null&&o.autoSw!==true)return; const g=opGeo(S,o); if(!g)return; const mid=mul(add(g.A,g.B),0.5);
  const ar=sg=>{ const q=add(mid,mul(g.n,sg*(g.t/2+0.3))), r=G.rooms.find(r=>pip(q,r.poly)); return r?r.area:Infinity; };
  o.inv=ar(1)>ar(-1); o.autoSw=true; }); }
root.ARQ={autoSwing,TIPOS,TELHAS,geom,opsOf,opGeo,roofModel,plan,elevation,section,quadro,cutDefs,Drw,textW,fm,pip,area,dseg,len,sub,add,mul,dot,nrm,left,labelPt,hlr};
if(typeof module!=="undefined") module.exports=root.ARQ;
})(typeof window!=="undefined"?window:globalThis);
