/**
 * Eliel Engenharia — Servidor de sincronização do app de obras
 * ------------------------------------------------------------
 * Este código roda no Google Apps Script, ligado a uma planilha do Google.
 * A planilha guarda: obras (sem valores), diários de obra e os acessos dos encarregados.
 *
 * IMPORTANTE: valores em R$ (diárias, empreita, extras, vales) NUNCA são enviados
 * para cá. Eles ficam só no celular do engenheiro. O servidor também descarta
 * qualquer campo de valor que chegue por engano.
 *
 * Instalação: veja o passo a passo no app (Menu → Nuvem e encarregados).
 */

const VERSAO_SERVIDOR = 1;

function doGet() {
  return saida({ok: true, app: 'eliel-rdo', versao: VERSAO_SERVIDOR});
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
    const req = JSON.parse(e.postData.contents);
    return saida(tratar(req));
  } catch (err) {
    return saida({ok: false, erro: String(err && err.message || err)});
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

function saida(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------------- tabelas na planilha ---------------- */
const TAB = {
  obras:    {nome: 'Obras',    cols: ['id', 'nome', 'json', 'atualizado', 'excluido']},
  diarios:  {nome: 'Diarios',  cols: ['id', 'obraId', 'obra', 'data', 'lancadoPor', 'presentes', 'etapas', 'servicos', 'ocorrencias', 'clima', 'json', 'atualizado', 'excluido']},
  acessos:  {nome: 'Acessos',  cols: ['token', 'nome', 'obras', 'criado', 'ativo']}
};

function aba(t) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(t.nome);
  if (!sh) {
    sh = ss.insertSheet(t.nome);
    sh.getRange(1, 1, 1, t.cols.length).setValues([t.cols]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}
function lerTabela(t) {
  const sh = aba(t);
  const vals = sh.getDataRange().getValues();
  const linhas = [];
  for (let i = 1; i < vals.length; i++) {
    if (vals[i][0] === '' || vals[i][0] == null) continue;
    const o = {_linha: i + 1};
    t.cols.forEach((c, j) => o[c] = vals[i][j]);
    linhas.push(o);
  }
  return {sh, linhas};
}
function gravar(t, tab, obj, chave) {
  const valores = [t.cols.map(c => obj[c] === undefined ? '' : obj[c])];
  const limpa = v => String(v == null ? '' : v).replace(/^'/, '');
  const existe = tab.linhas.find(l => limpa(l[chave]) === limpa(obj[chave]));
  if (existe) {
    tab.sh.getRange(existe._linha, 1, 1, t.cols.length).setValues(valores);
    Object.assign(existe, obj);
  } else {
    tab.sh.appendRow(valores[0]);
    tab.linhas.push(Object.assign({_linha: tab.sh.getLastRow()}, obj));
  }
}
// evita que a planilha transforme texto em fórmula/número/data
const seguro = v => { v = String(v == null ? '' : v); return /^[=+\-@0-9]/.test(v) ? "'" + v : v; };
const parse = s => { try { return JSON.parse(s); } catch (e) { return null; } };
const agora = () => Date.now();

/* ---------------- limpeza dos dados (sem valores!) ---------------- */
const txt = (v, max) => String(v == null ? '' : v).slice(0, max || 500);
const dataOk = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : '';
function obraPublica(o) {
  return {
    id: txt(o.id, 60), nome: txt(o.nome, 200), endereco: txt(o.endereco, 200), contratante: txt(o.contratante, 200),
    equipe: (o.equipe || []).slice(0, 200).map(c => ({id: txt(c.id, 60), nome: txt(c.nome, 100), cargo: txt(c.cargo, 100)})),
    etapas: (o.etapas || []).slice(0, 500).map(e => ({id: txt(e.id, 60), nome: txt(e.nome, 200), inicio: dataOk(e.inicio), fim: dataOk(e.fim), exec: limitar(e.exec)}))
  };
}
function diarioPublico(d) {
  const execs = {};
  Object.keys(d.execs || {}).slice(0, 100).forEach(k => execs[txt(k, 60)] = limitar(d.execs[k]));
  return {
    id: txt(d.id, 60), obraId: txt(d.obraId, 60), data: dataOk(d.data), clima: txt(d.clima, 40),
    atividades: txt(d.atividades, 20000), ocorrencias: txt(d.ocorrencias, 20000),
    presentes: (d.presentes || []).slice(0, 200).map(p => ({colabId: p.colabId ? txt(p.colabId, 60) : null, nome: txt(p.nome, 100), cargo: txt(p.cargo, 100), fracao: p.fracao === 0.5 ? 0.5 : 1})),
    etapaIds: (d.etapaIds || []).slice(0, 100).map(x => txt(x, 60)),
    execs: execs, criadoEm: txt(d.criadoEm, 40), editadoEm: txt(d.editadoEm, 40)
  };
}
function limitar(v) { v = Number(v) || 0; return Math.max(0, Math.min(100, v)); }

/* ---------------- quem está chamando ---------------- */
function identificar(token, chaveAdmin) {
  if (!token) throw new Error('SEM_ACESSO');
  if (chaveAdmin && token === chaveAdmin) return {admin: true, nome: 'Engenheiro', obras: null};
  const ac = lerTabela(TAB.acessos).linhas.find(a => String(a.token) === String(token));
  if (!ac || String(ac.ativo) !== 'sim') throw new Error('ACESSO_REMOVIDO');
  return {admin: false, nome: String(ac.nome), obras: String(ac.obras).split(',').filter(Boolean)};
}
const podeObra = (quem, obraId) => quem.admin || quem.obras.indexOf(String(obraId)) >= 0;
function soAdmin(quem) { if (!quem.admin) throw new Error('SOMENTE_ENGENHEIRO'); }

/* ---------------- ações ---------------- */
function tratar(req) {
  const props = PropertiesService.getScriptProperties();
  const chaveAdmin = props.getProperty('CHAVE_ADMIN');

  if (req.acao === 'registrarAdmin') {
    if (!req.chave || String(req.chave).length < 20) throw new Error('CHAVE_INVALIDA');
    if (!chaveAdmin) {
      props.setProperty('CHAVE_ADMIN', String(req.chave));
      Object.keys(TAB).forEach(k => aba(TAB[k]));
      return {ok: true, novo: true};
    }
    if (chaveAdmin === String(req.chave)) return {ok: true, novo: false};
    throw new Error('JA_TEM_ENGENHEIRO');
  }

  const quem = identificar(req.token, chaveAdmin);

  switch (req.acao) {
    case 'quemSou': {
      const obras = lerTabela(TAB.obras).linhas.filter(o => podeObra(quem, o.id) && o.excluido !== 'sim').map(o => String(o.nome));
      return {ok: true, admin: quem.admin, nome: quem.nome, obras: obras};
    }

    case 'puxar': {
      const desde = Number(req.desde) || 0, t = agora();
      const obras = lerTabela(TAB.obras).linhas
        .filter(o => podeObra(quem, o.id) && Number(o.atualizado) > desde)
        .map(o => o.excluido === 'sim' ? {id: String(o.id), excluido: true} : Object.assign(parse(o.json) || {}, {atualizado: Number(o.atualizado)}));
      const diarios = lerTabela(TAB.diarios).linhas
        .filter(d => podeObra(quem, d.obraId) && Number(d.atualizado) > desde)
        .map(d => d.excluido === 'sim' ? {id: String(d.id), obraId: String(d.obraId), excluido: true}
                                      : Object.assign(parse(d.json) || {}, {lancadoPor: String(d.lancadoPor || ''), atualizado: Number(d.atualizado)}));
      return {ok: true, agora: t, obras: obras, diarios: diarios, nome: quem.nome, admin: quem.admin};
    }

    case 'salvarDiario': {
      const d = diarioPublico(req.diario || {});
      if (!d.id || !d.obraId || !d.data) throw new Error('DIARIO_INCOMPLETO');
      if (!podeObra(quem, d.obraId)) throw new Error('SEM_ACESSO_OBRA');
      const tObras = lerTabela(TAB.obras);
      const obraLinha = tObras.linhas.find(o => String(o.id) === d.obraId && o.excluido !== 'sim');
      if (!obraLinha) throw new Error('OBRA_NAO_EXISTE');
      const obra = parse(obraLinha.json) || {etapas: []};
      const tDi = lerTabela(TAB.diarios);
      const antigo = tDi.linhas.find(x => String(x.id) === d.id);
      if (antigo && !podeObra(quem, antigo.obraId)) throw new Error('SEM_ACESSO_OBRA');
      if (antigo && antigo.excluido === 'sim' && !quem.admin) throw new Error('DIARIO_EXCLUIDO');
      const t = agora();
      const lancadoPor = antigo && antigo.lancadoPor ? String(antigo.lancadoPor) : quem.nome;
      const nomesEt = {}; (obra.etapas || []).forEach(e => nomesEt[e.id] = e.nome);
      gravar(TAB.diarios, tDi, {
        id: seguro(d.id), obraId: seguro(d.obraId), obra: seguro(obra.nome || ''), data: seguro(d.data.split('-').reverse().join('/')), lancadoPor: seguro(lancadoPor),
        presentes: seguro(d.presentes.map(p => p.nome + (p.fracao === 0.5 ? ' (½)' : '')).join(', ')),
        etapas: seguro(d.etapaIds.map(id => nomesEt[id]).filter(Boolean).join(', ')),
        servicos: seguro(d.atividades), ocorrencias: seguro(d.ocorrencias), clima: seguro(d.clima),
        json: JSON.stringify(d), atualizado: t, excluido: ''
      }, 'id');
      // % executado das etapas informado no diário
      let mudou = false;
      (obra.etapas || []).forEach(e => { if (d.execs[e.id] != null && d.etapaIds.indexOf(e.id) >= 0 && e.exec !== d.execs[e.id]) { e.exec = d.execs[e.id]; mudou = true; } });
      if (mudou) gravar(TAB.obras, tObras, {id: seguro(obra.id), nome: seguro(obra.nome), json: JSON.stringify(obra), atualizado: t, excluido: ''}, 'id');
      return {ok: true, id: d.id, atualizado: t, lancadoPor: lancadoPor};
    }

    case 'excluirDiario': {
      soAdmin(quem);
      const tDi = lerTabela(TAB.diarios);
      const l = tDi.linhas.find(x => String(x.id) === String(req.id));
      if (l) { const o = Object.assign({}, l); o.excluido = 'sim'; o.atualizado = agora(); gravar(TAB.diarios, tDi, o, 'id'); }
      return {ok: true};
    }

    case 'salvarObra': {
      soAdmin(quem);
      const o = obraPublica(req.obra || {});
      if (!o.id || !o.nome) throw new Error('OBRA_INCOMPLETA');
      const tObras = lerTabela(TAB.obras), t = agora();
      gravar(TAB.obras, tObras, {id: seguro(o.id), nome: seguro(o.nome), json: JSON.stringify(o), atualizado: t, excluido: ''}, 'id');
      return {ok: true, atualizado: t};
    }

    case 'excluirObra': {
      soAdmin(quem);
      const tObras = lerTabela(TAB.obras);
      const l = tObras.linhas.find(x => String(x.id) === String(req.id));
      if (l) { const o = Object.assign({}, l); o.excluido = 'sim'; o.atualizado = agora(); gravar(TAB.obras, tObras, o, 'id'); }
      return {ok: true};
    }

    case 'criarAcesso': {
      soAdmin(quem);
      const nome = txt(req.nome, 100).trim();
      const obras = (req.obras || []).map(x => txt(x, 60)).filter(Boolean);
      if (!nome || !obras.length) throw new Error('INFORME_NOME_E_OBRA');
      const token = 'k' + Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8);
      const tAc = lerTabela(TAB.acessos);
      gravar(TAB.acessos, tAc, {token: token, nome: seguro(nome), obras: obras.join(','), criado: new Date().toISOString(), ativo: 'sim'}, 'token');
      return {ok: true, token: token};
    }

    case 'listarAcessos': {
      soAdmin(quem);
      return {ok: true, acessos: lerTabela(TAB.acessos).linhas.filter(a => String(a.ativo) === 'sim')
        .map(a => ({token: String(a.token), nome: String(a.nome), obras: String(a.obras).split(',').filter(Boolean), criado: String(a.criado)}))};
    }

    case 'removerAcesso': {
      soAdmin(quem);
      const tAc = lerTabela(TAB.acessos);
      const l = tAc.linhas.find(a => String(a.token) === String(req.tokenAcesso));
      if (l) { const o = Object.assign({}, l); o.ativo = 'não'; gravar(TAB.acessos, tAc, o, 'token'); }
      return {ok: true};
    }
  }
  throw new Error('ACAO_DESCONHECIDA');
}
