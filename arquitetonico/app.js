/* Desenho Arquitetônico — interface */
"use strict";
const $=id=>document.getElementById(id);
const KEY="arq-v1";
const hoje=()=>{const d=new Date();return String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear();};
const PAR0={t:0.15,pd:2.80,hp:0.10,forro:"forro",cob:"duas",telha:"ceramica",inc:30,beiral:0.60,cume:"par",queda:"fundos",hplat:1.00};
const DADOS0={emp:"Eliel Ribeiro Engenharia & Arquitetura",rtNome:"Eliel Dias Ribeiro — Eng. Civil",crea:"CREA-PA 1520297858"};
function exemplo(){ return {obra:"Residência térrea 42 m²",cliente:"",local:"",...DADOS0,data:hoje(),rev:"00",par:{...PAR0},cuts:{},frente:null,
  sel:{AA:true,BB:true,frontal:true,dir:true,esq:false,posterior:false},
  walls:[{x1:0,y1:0,x2:7,y2:0},{x1:7,y1:0,x2:7,y2:6},{x1:7,y1:6,x2:0,y2:6},{x1:0,y1:6,x2:0,y2:0},{x1:3,y1:0,x2:3,y2:6},{x1:0,y1:3,x2:3,y2:3},{x1:3,y1:1.8,x2:7,y2:1.8},{x1:4.8,y1:0,x2:4.8,y2:1.8}],
  rooms:[{n:"Quarto 1",x:1.5,y:1.5},{n:"Quarto 2",x:1.5,y:4.5},{n:"Sala / Cozinha",x:5,y:3.9},{n:"Banho",x:3.9,y:0.9},{n:"Lavanderia",x:5.9,y:0.9}],
  ab:[{n:"P1",t:"PG",l:0.8,a:2.1,p:0,w:2,d:1.0},{n:"P2",t:"PG",l:0.7,a:2.1,p:0,w:4,d:2.0},{n:"P2",t:"PG",l:0.7,a:2.1,p:0,w:4,d:3.3},
    {n:"P2",t:"PG",l:0.7,a:2.1,p:0,w:6,d:0.7,inv:true},{n:"P3",t:"PG",l:0.8,a:2.1,p:0,w:6,d:2.6,inv:true},
    {n:"J1",t:"JC",l:1.2,a:1.0,p:1.1,w:3,d:4.2},{n:"J1",t:"JC",l:1.2,a:1.0,p:1.1,w:3,d:1.2},{n:"J2",t:"JC",l:1.5,a:1.2,p:1.0,w:2,d:2.3},
    {n:"J3",t:"JC",l:1.2,a:1.0,p:1.1,w:1,d:3.0},{n:"J4",t:"JB",l:0.6,a:0.6,p:1.5,w:0,d:3.6}]}; }
let S;
try{ const o=JSON.parse(localStorage.getItem(KEY)); S=o&&o.walls?o:exemplo(); }catch(e){ S=exemplo(); }
S.par=Object.assign({...PAR0},S.par||{}); S.sel=Object.assign({AA:true,BB:true,frontal:true,dir:true},S.sel||{}); S.cuts=S.cuts||{}; S.ab=S.ab||[]; S.rooms=S.rooms||[];
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} }
const f2=(v,d=2)=>ARQ.fm(+v,d);
const esc=s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");

/* ---------- abas ---------- */
let TAB="planta";
document.querySelectorAll("nav.tabs button").forEach(b=>b.onclick=()=>{ TAB=b.dataset.tab;
  document.querySelectorAll("nav.tabs button").forEach(x=>x.setAttribute("aria-selected",x===b?"true":"false"));
  document.querySelectorAll("section[id^=tab-]").forEach(s=>s.hidden=s.id!=="tab-"+TAB); render(); window.scrollTo(0,0); });
document.querySelectorAll("[data-zoom]").forEach(b=>b.onclick=()=>{ const d=$(b.dataset.zoom); d.classList.toggle("zoom"); b.textContent=d.classList.contains("zoom")?"Reduzir":"Ampliar"; });

/* ---------- desenhos na tela ---------- */
function svgInto(el,D,k=60){ el.innerHTML=ARQR.toSVG(D,{k}); return el.querySelector("svg"); }
let PICK=null; // índice da abertura sendo posicionada
function drawPlan(el){
  const D=ARQ.plan(S,50); const svg=svgInto(el,D,60);
  el.classList.toggle("pick",PICK!=null);
  svg.onclick=ev=>{ if(PICK==null) return; const r=svg.getBoundingClientRect(), vb=svg.viewBox.baseVal, px=(ev.clientX-r.left)*vb.width/r.width, py=(ev.clientY-r.top)*vb.height/r.height;
    const k=+svg.dataset.k, x=+svg.dataset.x0+px/k, Y=+svg.dataset.y1-py/k, p=[x,-Y]; placeAt(p); };
  return D;
}
function placeAt(p){
  const o=S.ab[PICK]; if(!o) return stopPick(); let best=null;
  S.walls.forEach((w,i)=>{ const a=[+w.x1,+w.y1],b=[+w.x2,+w.y2],d=ARQ.dseg(p,a,b); if(!best||d<best.d)best={d,i,a,b}; });
  if(!best||best.d>0.8){ $("pickTxt").textContent=`Toque mais perto de uma parede para posicionar ${o.n}.`; return; }
  const u=ARQ.nrm(ARQ.sub(best.b,best.a)), L=ARQ.len(ARQ.sub(best.b,best.a)), s=ARQ.dot(ARQ.sub(p,best.a),u), n=ARQ.left(u);
  o.w=best.i; o.d=+Math.max(0,Math.min(L-(+o.l),s-(+o.l)/2)).toFixed(2); o.inv=ARQ.dot(ARQ.sub(p,best.a),n)<0; o.autoSw=false;
  stopPick(); save(); render();
}
function stopPick(){ PICK=null; $("pickBar").hidden=true; render(); }
$("pickStop").onclick=stopPick;

function geoMessages(G){
  const m=[...G.msg]; const R=G.outers.length?ARQ.roofModel(S,G):null; if(R&&R.warn) m.push(R.warn);
  const un=S.ab.filter(o=>!S.walls[o.w]).map(o=>o.n); if(un.length) m.push(`Sem posição na planta: ${[...new Set(un)].join(", ")}. Posicione na aba Esquadrias.`);
  return m.map(t=>`<div class="alert warn">${esc(t)}</div>`).join("");
}

/* ---------- PLANTA ---------- */
function renderPlanta(){
  const D=drawPlan($("planDraw")), G=D.G;
  $("geoMsg").innerHTML=geoMessages(G);
  $("totals").innerHTML=G.outers.length?[["Área construída",f2(G.areaC)+" m²"],["Área útil",f2(G.areaU)+" m²"],["Ambientes",G.rooms.length],["Esquadrias",S.ab.length]].map(([a,b])=>`<div class="tot"><span>${a}</span><b>${b}</b></div>`).join(""):"";
  const fs=$("frente"); fs.innerHTML=G.sides.filter(s=>s.L>=0.6).map(s=>{ const ang=Math.atan2(s.n[1],s.n[0]); const dir=["leste","sudeste","sul","sudoeste","oeste","noroeste","norte","nordeste"][((Math.round(ang/(Math.PI/4))%8)+8)%8];
    return `<option value="${ang}" ${G.front===s?"selected":""}>Lado de ${f2(s.L)} m (${({sul:"embaixo",norte:"em cima",leste:"à direita",oeste:"à esquerda"})[dir]||dir} na planta)</option>`; }).join("");
  fs.onchange=()=>{ S.frente=+fs.value; save(); render(); };
  $("wtab").innerHTML=`<tr><th>#</th><th>x1</th><th>y1</th><th>x2</th><th>y2</th><th>esp.</th><th></th></tr>`+S.walls.map((w,i)=>`<tr><td>${i+1}</td>${["x1","y1","x2","y2"].map(c=>`<td><input type="number" step="0.05" data-w="${i}" data-c="${c}" value="${w[c]}"></td>`).join("")}<td><input type="number" step="0.01" data-w="${i}" data-c="t" value="${w.t||""}" placeholder="${S.par.t}"></td><td><button class="btn x" data-dw="${i}" aria-label="Remover parede ${i+1}">×</button></td></tr>`).join("");
  $("rtab").innerHTML=`<tr><th>Nome</th><th>x</th><th>y</th><th>Nível</th><th></th></tr>`+S.rooms.map((r,i)=>`<tr><td><input type="text" data-r="${i}" data-c="n" value="${esc(r.n)}"></td><td><input type="number" step="0.1" data-r="${i}" data-c="x" value="${r.x}"></td><td><input type="number" step="0.1" data-r="${i}" data-c="y" value="${r.y}"></td><td><input type="number" step="0.05" data-r="${i}" data-c="nv" value="${r.nv==null?"":r.nv}" placeholder="${S.par.hp}"></td><td><button class="btn x" data-dr="${i}" aria-label="Remover ambiente">×</button></td></tr>`).join("");
}
$("wtab").onchange=e=>{ const t=e.target; if(t.dataset.w==null) return; const w=S.walls[+t.dataset.w]; if(t.dataset.c==="t"){ if(t.value==="") delete w.t; else w.t=+t.value; } else w[t.dataset.c]=+t.value; save(); render(); };
$("wtab").onclick=e=>{ const b=e.target.closest("[data-dw]"); if(!b) return; const i=+b.dataset.dw; S.walls.splice(i,1); S.ab.forEach(o=>{ if(o.w===i)o.w=-1; else if(o.w>i)o.w--; }); save(); render(); };
$("addWall").onclick=()=>{ const l=S.walls[S.walls.length-1]||{x2:0,y2:0}; S.walls.push({x1:l.x2,y1:l.y2,x2:+l.x2+3,y2:l.y2}); save(); render(); };
$("rtab").onchange=e=>{ const t=e.target; if(t.dataset.r==null) return; const r=S.rooms[+t.dataset.r], c=t.dataset.c; if(c==="n") r.n=t.value; else if(c==="nv"){ if(t.value==="") delete r.nv; else r.nv=+t.value; } else r[c]=+t.value; save(); render(); };
$("rtab").onclick=e=>{ const b=e.target.closest("[data-dr]"); if(!b) return; S.rooms.splice(+b.dataset.dr,1); save(); render(); };
$("addRoom").onclick=()=>{ S.rooms.push({n:"Ambiente",x:1,y:1}); save(); render(); };

/* ---------- ESQUADRIAS ---------- */
$("addType").innerHTML=Object.entries(ARQ.TIPOS).map(([k,t])=>`<option value="${k}">${t.n}</option>`).join("");
function nextName(t){ const pref=ARQ.TIPOS[t].pref; let n=1; while(S.ab.some(o=>o.n===pref+n)) n++; return pref+n; }
$("addAb").onclick=()=>{ const t=$("addType").value, T=ARQ.TIPOS[t]; S.ab.push({n:nextName(t),t,l:T.l,a:T.a,p:T.p,w:-1,d:0}); PICK=S.ab.length-1; startPick(); save(); render(); };
function startPick(){ $("pickBar").hidden=false; $("pickTxt").textContent=`Toque na planta, na parede onde fica ${S.ab[PICK].n}. A porta abre para o lado do toque.`; }
function renderEsq(){
  const wl=S.walls.map((w,i)=>`<option value="${i}">${i+1}</option>`).join("");
  $("atab").innerHTML=`<tr><th>Cód.</th><th>Tipo</th><th>Larg.</th><th>Alt.</th><th>Peit.</th><th>Parede</th><th>Dist.</th><th></th><th></th></tr>`+S.ab.map((o,i)=>`<tr>
    <td><input type="text" data-a="${i}" data-c="n" value="${esc(o.n)}" style="width:62px"></td>
    <td><select data-a="${i}" data-c="t">${Object.entries(ARQ.TIPOS).map(([k,t])=>`<option value="${k}" ${o.t===k?"selected":""}>${t.n}</option>`).join("")}</select></td>
    ${["l","a","p"].map(c=>`<td><input type="number" step="0.05" data-a="${i}" data-c="${c}" value="${o[c]}" style="width:70px"></td>`).join("")}
    <td><select data-a="${i}" data-c="w"><option value="-1">—</option>${wl}</select></td>
    <td><input type="number" step="0.05" data-a="${i}" data-c="d" value="${o.d}" style="width:70px"></td>
    <td style="white-space:nowrap"><button class="btn sm" data-pick="${i}">Posicionar</button> ${o.t==="PG"?`<button class="btn sm" data-flip="${i}" title="Lado de abertura">⇅</button> <button class="btn sm" data-hg="${i}" title="Lado da dobradiça">⇆</button>`:""}</td>
    <td><button class="btn x" data-da="${i}" aria-label="Remover ${esc(o.n)}">×</button></td></tr>`).join("");
  S.ab.forEach((o,i)=>{ const s=$("atab").querySelector(`select[data-a="${i}"][data-c="w"]`); if(s) s.value=S.walls[o.w]?o.w:-1; });
  drawPlan($("planDraw2"));
}
$("atab").onchange=e=>{ const t=e.target; if(t.dataset.a==null) return; const o=S.ab[+t.dataset.a], c=t.dataset.c;
  if(c==="n") o.n=t.value; else if(c==="t"){ o.t=t.value; const T=ARQ.TIPOS[o.t]; o.p=T.p; o.a=T.a; } else o[c]=+t.value; save(); render(); };
$("atab").onclick=e=>{ const b=e.target.closest("button"); if(!b) return;
  if(b.dataset.da!=null){ S.ab.splice(+b.dataset.da,1); }
  else if(b.dataset.pick!=null){ PICK=+b.dataset.pick; startPick(); }
  else if(b.dataset.flip!=null){ const o=S.ab[+b.dataset.flip]; o.inv=!o.inv; o.autoSw=false; }
  else if(b.dataset.hg!=null){ const o=S.ab[+b.dataset.hg]; o.hg=!o.hg; }
  save(); render(); };

/* ---------- COBERTURA ---------- */
const PF=["pd","t","hp","forro","cob","telha","inc","beiral","cume","queda","hplat"];
function renderCob(){
  PF.forEach(k=>{ const el=$("p."+k); if(document.activeElement!==el) el.value=S.par[k]; });
  document.querySelectorAll("[data-for]").forEach(l=>l.hidden=!l.dataset.for.split(" ").includes(S.par.cob));
  const G=ARQ.geom(S); $("cobWarn").innerHTML=G.outers.length?geoMessages({msg:[],outers:G.outers,...G}).replace(/Sem posição[^<]*/,""):"";
  if(!G.outers.length) return;
  svgInto($("cobFr"),ARQ.elevation(S,75,"frontal"),45); svgInto($("cobAA"),ARQ.section(S,75,"A"),45);
}
PF.forEach(k=>$("p."+k).onchange=e=>{ const v=e.target.value; S.par[k]=["forro","cob","telha","cume","queda"].includes(k)?v:+v;
  if(k==="telha"){ S.par.inc=ARQ.TELHAS[v].inc*(S.par.cob==="plat"?(v==="ceramica"?1:1):1); }
  if(k==="cob"&&v==="plat"&&S.par.telha==="ceramica"){ S.par.telha="termo"; S.par.inc=10; }
  save(); render(); });

/* ---------- CORTES E FACHADAS ---------- */
const VIEWS=[["AA","Corte AA",()=>ARQ.section(S,50,"A")],["BB","Corte BB",()=>ARQ.section(S,50,"B")],["frontal","Fachada frontal",()=>ARQ.elevation(S,50,"frontal")],
  ["dir","Fachada lateral direita",()=>ARQ.elevation(S,50,"dir")],["esq","Fachada lateral esquerda",()=>ARQ.elevation(S,50,"esq")],["posterior","Fachada posterior",()=>ARQ.elevation(S,50,"posterior")]];
function renderVistas(){
  const G=ARQ.geom(S); if(!G.outers.length){ $("views").innerHTML=`<div class="alert warn">Feche as paredes na aba Planta para gerar cortes e fachadas.</div>`; return; }
  const C=ARQ.cutDefs(S,G); const fa=(C[0].c-C[0].v0)/(C[0].v1-C[0].v0), fb=(C[1].c-C[1].v0)/(C[1].v1-C[1].v0);
  $("cutA").value=fa; $("cutB").value=fb; $("cAv").textContent=S.cuts.a==null?"(automático)":""; $("cBv").textContent=S.cuts.b==null?"(automático)":"";
  $("selBox").innerHTML=VIEWS.map(([k,t])=>`<label class="chk"><input type="checkbox" data-sel="${k}" ${S.sel[k]?"checked":""}>${t}</label>`).join("");
  $("views").innerHTML=VIEWS.map(([k,t])=>`<div class="sheet"><div class="vhead"><b>${t}</b></div><div class="draw" id="v-${k}"></div></div>`).join("");
  VIEWS.forEach(([k,,fn])=>svgInto($("v-"+k),fn(),45));
}
$("cutA").oninput=e=>{ S.cuts.a=+e.target.value; save(); renderVistas(); };
$("cutB").oninput=e=>{ S.cuts.b=+e.target.value; save(); renderVistas(); };
$("cutAuto").onclick=()=>{ S.cuts={}; save(); render(); };
$("selBox").onchange=e=>{ const k=e.target.dataset.sel; if(k){ S.sel[k]=e.target.checked; save(); } };

/* ---------- PRANCHA ---------- */
let PLAN=null;
function makePlan(){ const fmt=$("fmt").value, den=+$("den").value||null; return {fmt,...(ARQR.autoPlan(S,fmt,S.sel,den)||{})}; }
function renderPrancha(){
  const G=ARQ.geom(S); if(!G.outers.length){ $("sheets").innerHTML=""; $("pInfo").textContent="Feche as paredes na aba Planta para montar a prancha."; return; }
  PLAN=makePlan();
  if(!PLAN.B){ $("pInfo").textContent="Os desenhos não couberam neste formato. Escolha um formato maior ou uma escala menor."; $("sheets").innerHTML=""; return; }
  $("pInfo").textContent=`${PLAN.pages} prancha(s) ${PLAN.fmt} na escala 1:${PLAN.den}. Carimbo com os dados da aba Dados.`;
  const pages=ARQR.layout(PLAN.B,PLAN.fmt,PLAN.den), [W,H]=ARQR.SHEETS[PLAN.fmt];
  $("sheets").innerHTML=pages.map((pg,i)=>{
    let o=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#fff"/><rect x="25" y="7" width="${W-32}" height="${H-14}" fill="none" stroke="#111" stroke-width="0.6"/><rect x="${W-187}" y="${H-63}" width="180" height="56" fill="none" stroke="#111" stroke-width="0.4"/><text x="${W-184}" y="${H-53}" font-size="4" font-weight="700" font-family="Helvetica,Arial">${esc((S.emp||"").toUpperCase())}</text><text x="${W-184}" y="${H-42}" font-size="3" font-family="Helvetica,Arial">${esc(S.obra||"")}</text><text x="${W-184}" y="${H-12}" font-size="3" font-family="Helvetica,Arial">ESCALA 1:${PLAN.den} · FOLHA ${i+1}/${pages.length}</text>`;
    pg.forEach(({b,x,y,w,h,bb})=>{ const svg=ARQR.toSVG(b.D,{k:1000/PLAN.den,pad:0,minW:0.08}).replace(/^<svg[^>]*>/,"").replace(/<\/svg>$/,"").replace(/<rect width="100%" height="100%" fill="#fff"\/>/,"");
      const dh=h-(b.title?9:0); o+=`<g transform="translate(${x} ${H-y})">${svg}</g>`;
      if(b.title) o+=`<text x="${x+w/2}" y="${H-(y-h+3.4)}" font-size="4.4" font-weight="700" text-anchor="middle" font-family="Helvetica,Arial">${b.title}</text><text x="${x+w/2}" y="${H-(y-h-1.2)}" font-size="2.4" text-anchor="middle" font-family="Helvetica,Arial">ESC. 1:${PLAN.den}</text>`; });
    return `<div class="sheet"><div class="vhead"><b>Prancha ${i+1} de ${pages.length}</b><button class="btn sm" data-zoom="pg${i}">Ampliar</button></div><div class="draw" id="pg${i}">${o}</svg></div></div>`; }).join("");
  document.querySelectorAll("#sheets [data-zoom]").forEach(b=>b.onclick=()=>{ const d=$(b.dataset.zoom); d.classList.toggle("zoom"); b.textContent=d.classList.contains("zoom")?"Reduzir":"Ampliar"; });
}
$("fmt").onchange=renderPrancha; $("den").onchange=renderPrancha;
async function saveFile(name,data,mime){
  let dl=null; try{ dl=window.claude&&await window.claude.use("downloads"); }catch(e){}
  if(dl){ const r=await dl.save({filename:name,data}); return r.status; }
  if(window.claude) throw {code:"unavailable"};
  const url=URL.createObjectURL(new Blob([data],{type:mime})); const a=document.createElement("a"); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),4000); return "saved";
}
const slug=()=>(S.obra||"projeto").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^A-Za-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40)||"projeto";
$("pdfBtn").onclick=async()=>{ const P=PLAN&&PLAN.B?PLAN:makePlan(); if(!P.B){ $("outMsg").textContent="Não coube neste formato."; return; }
  try{ const r=ARQR.buildPDF(S,P.B,P.fmt,P.den); const st=await saveFile(`${slug()}-arquitetonico-${P.fmt}.pdf`,r.bytes,"application/pdf"); $("outMsg").textContent=st==="saved"?"PDF salvo.":"PDF enviado."; }
  catch(e){ $("outMsg").textContent=e&&e.code==="declined"?"Download cancelado.":"Não foi possível gerar o PDF agora."; } };
$("dxfBtn").onclick=async()=>{ const P=PLAN&&PLAN.B?PLAN:makePlan(); const B=P.B||ARQR.blocksFor(S,50,S.sel), den=P.den||50;
  try{ const st=await saveFile(`${slug()}-arquitetonico.dxf`,ARQR.buildDXF(B,den),"application/dxf"); $("outMsg").textContent=st==="saved"?"DXF salvo. No AutoCAD, abra e salve como .dwg.":"DXF enviado."; }
  catch(e){ $("outMsg").textContent=e&&e.code==="declined"?"Download cancelado.":"Não foi possível gerar o DXF agora."; } };

/* ---------- DADOS e importação ---------- */
const DF=["obra","cliente","local","emp","rtNome","crea","data","rev"];
function renderDados(){ DF.forEach(k=>{ const el=$("d."+k); if(document.activeElement!==el) el.value=S[k]||""; }); }
DF.forEach(k=>$("d."+k).oninput=e=>{ S[k]=e.target.value; save(); stamp(); });
function stamp(){ $("stamp").innerHTML=`<b>${esc(S.obra||"Sem nome")}</b><br>${esc(S.cliente||"")}${S.cliente?" · ":""}${esc(S.data||"")}`; }
$("novo").onclick=()=>$("novoConf").hidden=false; $("novoNao").onclick=()=>$("novoConf").hidden=true;
$("novoSim").onclick=()=>{ S={obra:"",cliente:"",local:"",emp:S.emp,rtNome:S.rtNome,crea:S.crea,data:hoje(),rev:"00",par:{...S.par},cuts:{},frente:null,sel:{...S.sel},walls:[],rooms:[],ab:[]}; $("novoConf").hidden=true; save(); render(); };
$("exemplo").onclick=()=>{ const keep={emp:S.emp,rtNome:S.rtNome,crea:S.crea}; S={...exemplo(),...keep}; save(); render(); };
let IMP=null, impFile=null, pdfLib=null;
const impMsg=t=>$("impMsg").textContent=t;
function loadScript(src){return new Promise((res,rej)=>{const e=document.createElement("script");e.src=src;e.onload=res;e.onerror=()=>rej(new Error("script"));document.head.appendChild(e);});}
async function getPdfLib(){ if(pdfLib) return pdfLib; if(!window.pdfjsLib) await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
  pdfLib=window.pdfjsLib||window["pdfjs-dist/build/pdf"]; pdfLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; return pdfLib; }
$("impFile").onchange=e=>{ impFile=e.target.files[0]; $("impName").textContent=impFile?impFile.name:""; $("impPage").innerHTML=`<option value="1">1</option>`; runImport(); };
["impT","impDen","impPage"].forEach(id=>$(id).onchange=()=>{ if(impFile) runImport(); });
async function runImport(){
  $("impRes").hidden=true; $("impImg").hidden=true; IMP=null; if(!impFile) return; const name=impFile.name.toLowerCase();
  try{
    if(name.endsWith(".dxf")){ const r=ARQI.fromDXFText(await impFile.text()); if(!r){ impMsg("Não encontrei paredes neste DXF."); return; } showImport(r,"DXF"); return; }
    if(name.endsWith(".pdf")){ impMsg("Lendo o PDF..."); const lib=await getPdfLib();
      const r=await ARQI.fromPDF(impFile,+$("impPage").value,{t:+$("impT").value||0.15,den:+$("impDen").value||null},lib);
      if(r.doc&&$("impPage").options.length!==r.doc.numPages){ $("impPage").innerHTML=Array.from({length:r.doc.numPages},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join(""); }
      if(r.err){ impMsg(r.err); return; } showImport(r,`PDF (escala aprox. 1:${Math.round(r.den)})`); return; }
    // imagem
    const img=await createImageBitmap(impFile), cv=$("impCanvas"), sc=Math.min(1,2000/Math.max(img.width,img.height)); cv.width=img.width*sc; cv.height=img.height*sc;
    const ctx=cv.getContext("2d"); ctx.fillStyle="#fff"; ctx.fillRect(0,0,cv.width,cv.height); ctx.drawImage(img,0,0,cv.width,cv.height); $("impImg").hidden=false;
    impMsg(window.claude?"Imagem carregada. Toque em Reconhecer com o Claude (30 s a 2 min).":"Foto só pode ser lida com o app aberto dentro do Claude. Aqui use o PDF do CAD ou o DXF.");
  }catch(err){ impMsg("Não consegui ler este arquivo."+(String(err).includes("script")?" Sem internet para carregar o leitor de PDF.":"")); }
}
function showImport(r,src){
  IMP={walls:r.walls,rooms:r.rooms||[],ab:r.ab||[]};
  const T={...S,walls:IMP.walls,rooms:IMP.rooms,ab:IMP.ab.map(o=>({...o}))}; ARQ.autoSwing(T); IMP.ab=T.ab;
  const G=ARQ.geom(T); const D=ARQ.plan(T,75,{roof:false,cuts:false}); svgInto($("impPrev"),D,40);
  const big=Math.max(...IMP.walls.map(w=>Math.hypot(w.x2-w.x1,w.y2-w.y1))); $("impReal").value=big.toFixed(2); $("impReal").dataset.base=big;
  $("impSum").textContent=`${src}: ${IMP.walls.length} paredes, ${G.rooms.length} ambientes (${G.rooms.map(r=>r.name+" "+f2(r.area)+" m²").join(", ")}), ${IMP.ab.length} vãos de porta. Área construída ${f2(G.areaC||0)} m². Janelas não aparecem como vão na planta: cadastre na aba Esquadrias.`;
  $("impRes").hidden=false; impMsg("");
}
$("impReal").onchange=()=>{ if(!IMP) return; const base=+$("impReal").dataset.base, real=+$("impReal").value; if(!(base>0&&real>0)) return; const k=real/base; if(Math.abs(k-1)<1e-4) return;
  IMP.walls.forEach(w=>["x1","y1","x2","y2"].forEach(c=>w[c]=+(w[c]*k).toFixed(3))); IMP.rooms.forEach(r=>{r.x*=k;r.y*=k;}); IMP.ab.forEach(o=>{o.d=+(o.d*k).toFixed(3);o.l=+(o.l*k).toFixed(2);});
  showImport({...IMP},"Escala corrigida"); };
$("impDrop").onclick=()=>{ IMP=null; $("impRes").hidden=true; };
$("impApply").onclick=()=>{ if(!IMP) return; if((!S.obra||S.obra===exemplo().obra)&&impFile) S.obra=impFile.name.replace(/\.[^.]+$/,"").replace(/[_-]+/g," "); S.walls=IMP.walls; S.rooms=IMP.rooms; S.ab=IMP.ab; S.cuts={}; S.frente=null; IMP=null; $("impRes").hidden=true; impMsg("Planta aplicada. Confira na aba Planta."); save(); render(); };
$("impAiGo").onclick=async()=>{
  if(!window.claude){ impMsg("A leitura de foto pelo Claude só funciona com o app aberto dentro do Claude."); return; }
  let sample=null; try{ sample=await window.claude.use("sample"); }catch(e){}
  if(!sample){ impMsg("A leitura com o Claude não está disponível nesta tela."); return; }
  const blob=await new Promise(r=>$("impCanvas").toBlob(r,"image/png")); impMsg("Lendo a planta... 30 s a 2 min.");
  const prompt=`A imagem é uma planta baixa (Brasil). Preciso da geometria das paredes para gerar o desenho arquitetônico.
Regras: use as COTAS escritas (metros). Coordenadas dos EIXOS das paredes, origem no canto superior esquerdo, x para a direita, y para BAIXO, arredonde a 0,01 m. Paredes podem ser inclinadas. Cada parede reta é um segmento contínuo passando por cima de portas e janelas; paredes que se encontram devem se tocar exatamente. Informe a espessura t de cada parede se não for 0,15.
Aberturas: parede = índice da parede na lista, d = distância do início da parede até a lateral da abertura, l = largura, t = "PG" (porta de giro), "PC" (porta de correr), "JC" (janela de correr), "JB" (basculante), "PT" (portão).
Responda SOMENTE JSON: {"paredes":[{"x1":0,"y1":0,"x2":7,"y2":0,"t":0.15}],"aberturas":[{"n":"P1","t":"PG","parede":0,"d":1.2,"l":0.8}],"ambientes":[{"n":"Sala","x":2,"y":3}],"obs":"dúvidas"}`;
  try{ const r=await sample.json(prompt,{images:blob,modelTier:"complex",cache:false}); if(!r||!Array.isArray(r.paredes)){ impMsg("Resposta sem paredes. Tente uma imagem mais nítida."); return; }
    const walls=r.paredes.map(w=>{const o={x1:+w.x1,y1:+w.y1,x2:+w.x2,y2:+w.y2}; if(w.t&&Math.abs(+w.t-0.15)>0.01)o.t=+w.t; return o;});
    const ab=(r.aberturas||[]).map(a=>{const T=ARQ.TIPOS[a.t]||ARQ.TIPOS.PG; return {n:String(a.n||"P").slice(0,8),t:ARQ.TIPOS[a.t]?a.t:"PG",l:+a.l||T.l,a:T.a,p:T.p,w:Number.isInteger(+a.parede)?+a.parede:-1,d:+a.d||0};});
    showImport({walls,rooms:(r.ambientes||[]).map(a=>({n:String(a.n||""),x:+a.x,y:+a.y})),ab},"Leitura do Claude"+(r.obs?" ("+r.obs+")":""));
  }catch(e){ impMsg("Não foi possível ler agora. Tente de novo."); } };
$("pasteGo").onclick=()=>{ const t=$("impPaste").value.trim(); if(!t){ impMsg("Cole algo primeiro."); return; }
  try{ const o=ARQI.parseCode(t); if(o){ ["walls","rooms","ab"].forEach(k=>{ if(Array.isArray(o[k])) S[k]=o[k]; }); ["obra","cliente","local"].forEach(k=>{ if(typeof o[k]==="string") S[k]=o[k]; });
      if(o.par) S.par=Object.assign({...PAR0},o.par); S.cuts=o.cuts||{}; S.frente=o.frente!=null?o.frente:null; ARQ.autoSwing(S); save(); render(); impMsg("Projeto carregado."+(S.ab.some(a=>a.w<0)?" Posicione as esquadrias na aba Esquadrias.":"")); $("impPaste").value=""; return; }
    if(/SECTION/.test(t)&&/ENTITIES/.test(t)){ const r=ARQI.fromDXFText(t); if(r){ showImport(r,"DXF colado"); return; } }
    impMsg("Não reconheci o que foi colado."); }catch(e){ impMsg("Código inválido. Copie de novo, inteiro."); } };
async function copyTxt(txt,ok){ try{ await navigator.clipboard.writeText(txt); impMsg(ok); }catch(e){ $("impPaste").value=txt; $("impPaste").select(); impMsg("Selecione o código na caixa acima e copie."); } }
$("copyArq").onclick=()=>copyTxt(ARQI.codeOf(S),"Código copiado. Guarde no bloco de notas ou mande no chat.");
$("copyFdn").onclick=()=>copyTxt(ARQI.fdncOf(S),"Código FDNC1 copiado. No app de fundação, cole em Dados > Usar o que colei.");

/* ---------- geral ---------- */
function render(){
  stamp();
  try{
    if(TAB==="planta") renderPlanta(); else if(TAB==="esq") renderEsq(); else if(TAB==="cob") renderCob();
    else if(TAB==="vistas") renderVistas(); else if(TAB==="prancha") renderPrancha(); else renderDados();
  }catch(err){ console.error(err); const s=document.querySelector(`#tab-${TAB} .sheet`); if(s) s.insertAdjacentHTML("afterbegin",`<div class="alert bad">Não consegui desenhar com estes dados. Confira as paredes. (${esc(err.message)})</div>`); }
  if(PICK!=null&&TAB!=="planta"&&TAB!=="esq"){ PICK=null; $("pickBar").hidden=true; }
}
render();
