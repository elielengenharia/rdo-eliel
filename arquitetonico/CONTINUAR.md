# Projeto Arquitetônico — onde paramos

App: https://elielengenharia.github.io/rdo-eliel/arquitetonico/ (arquivo único `arquitetonico/index.html`).
Detalhador de Fundação: https://elielengenharia.github.io/rdo-eliel/fundacao/

## No ar (main)
- 5.31: carimbo com "ESPAÇO RESERVADO À APROVAÇÃO DOS ÓRGÃOS COMPETENTES" acima dele (aba Dados: Espaço para aprovação sim/não e Órgão que aprova): órgão, carimbo e visto, processo, alvará, data de aprovação, analista, área do terreno, área construída, taxa de ocupação e assinatura do proprietário. Altura ha em pranchas(): A3 48 mm, A2-A0 66 mm; no A4 não entra.
- 4.7: forro e parede de drywall, estrutura convencional e simples (coluninhas prontas, broca 1,20 m),
  fossa séptica + filtro + sumidouro, caixas de esgoto na calçada, lote pelas medidas do mapa,
  planta de situação, parede de tijolo 10 cm + reboco 2,5 cm.
- 4.8 / 4.9: calha da platibanda (NBR 10844) e base do piso de concreto (tela, macrofibra, fibra de aço).
- 5.0: etapa de pintura (aba Pintura, cores por ambiente, material em latas/galões/baldes, prancha).
- 5.25 (feita como 5.22 em outra conversa): situação/implantação/quadra: lado de rua curto (< 6 m) ou chamado "chanfro" entre duas ruas é o chanfro da esquina, não vira rua própria (as duas ruas se encontram nele). Desenho na tela com a letra do PDF (Helvetica/Arial), a mesma usada para medir os textos. Linha de corte (traço e ponto) abre um vão onde passa sobre um texto (desencavala).
- 5.1: instalações elétricas: eletrodutos traçados, fiação por trecho, queda de tensão (4 % / 5 %),
  demanda, entrada, DR, DPS, quadro com reserva, diagrama unifilar e material elétrico.
- 5.2: imóvel comercial com 2+ salas: um quadro e medidor por sala (banheiro vai para a sala de onde se entra).
- 5.3: símbolos elétricos menores (65 %).
- 5.15: nomes de ambiente fora de todos os ambientes ou empilhados no mesmo ponto vão sozinhos para os ambientes sem nome (banheiro no menor, os outros da esquerda para a direita) e o ponto é gravado.
- 5.16: aba Perspectivas. Quatro vistas (frontal pelos dois lados, posterior, aérea) da maquete gerada pela planta (paredes, vergas, peitoris, vãos, platibanda, telhado) ou da maquete anexada (.dae do SketchUp com cores e arestas, .obj, .stl; .skp não abre no navegador, avisa para exportar COLLADA). Maquete guardada por projeto em arq-maquete-v1:<projeto>. Prancha PERSPECTIVAS (sem escala) no PDF e no DXF (camada PERSP), agrupada com banheiro/portas/esquadrias. Funções: maquete3dApp, vista3d (painter + z-buffer para faces e arestas), desenhoPersp, perspFolha, renderPersp. Primitivas g/l aceitam rgb. Renderização (render3d): imagem calculada pixel a pixel com sol e sombra (mapa de sombra), céu em degradê, gramado com névoa, vidro com reflexo do céu, ondas da telha e caixilhos; sai em JPEG no PDF (/XObject DCTDecode, primitiva "img" com .vet para o DXF), cache em CACHE_R. Opções: estilo renderizada/traço, cor das paredes, da platibanda e dos caixilhos, tipo de vidro, botão Baixar imagem (JPG 2400 px). Vidro do .dae: material transparente ou com nome vidro/glass. O sol de cada vista ilumina a fachada principal.
- 5.18: perspectivas: paredes de fora sobem até a telha (oitão do telhado de 2 águas e parede alta do de 1 água, antes ficava vazado),
  vergas acima das janelas também sobem; telhado feito por águas exatas (corte de orelhas + recorte por água), com testeira e forro do beiral;
  arestas só nos cantos de verdade (sem emendas de peças no meio da fachada); vistas na altura do olho com câmera nivelada
  (verticais retas, perspectiva de 2 pontos) e mais céu; sombra sem listras (normal offset no mapa de sombra); arestas escondidas
  com tolerância absoluta (não vazam através do telhado); estilo traço pintado na ordem tirada do z-buffer (1/z) em vez de ordenar por
  profundidade média, chão sempre primeiro, telha só vista de cima e forro só de baixo.
  Textos: função desencavala(D) roda em toda prancha (fim de pranchas()) e na tela (svgDe). Rótulos das camadas MOVEIS (tubos, vigas,
  eixos, códigos...) procuram o lugar livre mais perto (linha de chamada se forem longe); números de cota (mv:"c") deslizam na linha
  ou trocam de lado; notas de detalhe (mv:"n") sobem/descem levando só as linhas de chamada delas (ch, gravadas pela nota); nomes de ambiente (mv:"r") só andam um pouco.
  Nenhum texto sai da extensão do desenho (extTexto, a mesma conta de extensao), e a prancha mede o desenho de novo depois de desencavalar.
  Nome de ambiente usa a largura real da letra e diminui se não couber nem uma linha. Detalhe das portas escolhe as colunas que dão a
  maior escala (no A4 cabe). Teste: 4 modelos x A4..A0 com 0 textos encavalados (só o A4 da hidro de casa pequena fica em 1:500 por causa do lote).
- 5.18 (DXF rev03): modelo "Salas comerciais Av. principal" refeito pela planta ajustada no lote: frente na Av. principal
  (P 3,00 e P 4,00 de correr, janela 1,20x2,00 peitoril 0,60), parede no chanfro, jardim na esquina com janela 1,20 da sala 1, banheiro
  (2,74 m², porta 0,70) encostado na Rua lateral, divisória inclinada; salas 27,40 e 48,22 m² (DXF 48,19), NV +0,10.
  Lote pelos cantos do DXF: terr.pts (mesmas coordenadas da planta, um canto por lado; vale enquanto as medidas dos lados batem, lotePts()).
  Banheiro girado (nenhuma parede no eixo): retUtil procura o retângulo útil alinhado com cada parede (r.fr = giro), layoutBanheiro trabalha
  no sistema dele, lbMundo/rodaPrims levam louças para a planta, desenhoBanheiroGirado faz o detalhe na posição da obra.
- 5.18: planta baixa mais cotada: cada parede de fora tem cadeia pela face externa com trechos e vãos (cadeiaAlinhada, qualquer
  direção) e o total; cotas internas de cada ambiente (faces e portas; ambiente retangular só nas paredes com vão). Locação virou
  estrutural: "LOCAÇÃO DOS EIXOS DOS PILARES" (desenhoLocPilares) com o eixo de cada pilar, cotas acumuladas X/Y a partir do P0 e
  quadro de coordenadas (quebra em colunas); sem estrutura volta a locação pelas paredes.
- 5.30: cotas curtas: nas cadeias H/V e nas cadeias externas das paredes inclinadas, o trecho curto da ponta sai para fora, na continuação da linha de cota (altCadeia: 3 = antes do início, 4 = depois do fim); nas cotas internas dos ambientes (cadeiaAlinhada com dentro=true) o curto vai mais para dentro do ambiente (6,2 mm) e, no canto, anda para dentro da cadeia; a alternância volta ao começo depois de um trecho comprido. Nome de ambiente estreito e comprido (banheiro) acompanha o comprimento do ambiente (lugarRotuloRot) em vez de passar por cima do giro da porta, sem diminuir a letra.
- 5.29: modelo das salas volta a chamar os vizinhos de "Lote 243" e "Lote 290" (pedido do Eliel); avenida e rua continuam genéricas.
- 5.28: revisão geral: rodapé das pranchas com só o número da versão (VERSAO_N); cabeçalho sem a lista de recursos no celular (.sub .feat); quadro "Como começar" na aba Planta (some com "Entendi", guarda arq-comece-ok); texto do PDF na aba Planta sem o "6 pranchas" antigo; orçamento: porta de alumínio/vidro por m² (porta_vidro 950), cobertura com vigotas (vigota 32/m) e caibros (caibro 14/m) quando a estrutura é de vigotas; modelo das salas com caimento alinhado com a divisa (dir "lado1"); verificação da calha diz o lado da construção (fundo, frente, lateral) e só nomeia a rua se a calha estiver a menos de 2 m dela; manifest com descrição nova.
- 5.27: layers do DXF (AutoCAD): PAREDE verde (3), COTAS cinza escuro (8), TEXTO, TITULOS e MOBILIA na cor natural (7); VIGA passou para ciano (4) para não confundir com as paredes. Só o DXF muda; tela e PDF continuam iguais.
- 5.26: travamento corrigido: ladosCaimento -> terreno -> infoTelhado -> ladosCaimento dava voltas até estourar a pilha a cada chamada (render de 30 s e pranchas de 96 s nas salas com caimento alinhado com a divisa). Agora há uma trava (_lcOcup) e o resultado fica guardado por G e por S.terr/S.frente (_lcMem). Render ~0,4 s, pranchas ~0,6 s, mesmos resultados.
- 5.25: PR #58 da outra conversa (chanfro da esquina sem virar rua, tela com a letra do PDF, corte sem riscar texto) juntado ao main.
- 5.24: vigotas e caibros: a parede da calha (aresta do TI.poly no lado baixo) é achada e o 1º caibro fica paralelo a ela, afastado a largura da calha (bc), mesmo fora do esquadro (VG.p1: dlo, dhi, fora); os outros caibros continuam atravessados ao caimento, começando em max(dlo + ec, dhi + 0,30). Calha: o campo "profundidade (cm)" (tel.chMin) agora é a profundidade usada (mínimo 5 cm); a lâmina d'água fica em até 2/3 dela no cálculo da vazão. Modelo das salas: calha 40x6 (40 cm de largura, 6 cm de profundidade).
- 5.23: estrutura do telhado de uma água com fibrocimento ou metálica: opção "Vigotas e caibros" (tel.estr), comprimento da telha (tel.lt, 1,83 a 3,66 m) e vigotas a cada (tel.ev, padrão 1,00 m). Vigotas no sentido do caimento (alinhado com a divisa, se escolhido); caibros atravessados, o 1º logo depois da calha dimensionada (CL.bMax), os outros a cada (lt - recobrimento)/n na rampa (n = menor número com vão <= 1,69 m), para cada emenda cair num caibro; fiadas de telha, última cortada e total de telhas nas notas, chips e quadro da prancha. estruturaTelhado devolve vigotas, VG e Lv. Modelo das salas já sai com vigotas, telha 3,66 m e vigota a cada 1,00 m.
- 5.22: fossa: campos novos na aba Hidrossanitário: diâmetro do tanque redondo (1,10 a 2,50 m; a profundidade útil sai do volume, no mínimo D/2, aviso se passar do máximo da NBR 7229), largura do tanque retangular (0,80 a 2,00 m; aviso se o comprimento passar de 4x a largura), distância entre tanque, filtro e sumidouro (padrão 1,50 m da NBR 7229; 0,50 a 3,00 m, aviso abaixo de 1,50) e afastamento da casa e das divisas (1,50 a 3,00 m). dimFossa devolve gap, afast, gapU e av (avisos); posFossa separa o espaçamento entre as unidades (gap) do afastamento (afast); no passeio usa 0,50 m, a não ser que a distância tenha sido escolhida.
- 5.21: modelo das salas sem o nome do cliente e sem o endereço do lote (Avenida principal, Rua lateral, Vizinho 1 e 2).
- 5.20: telhado de uma água com platibanda pode cair paralelo a um lado do lote que vai da frente para o fundo (opções novas na
  Direção da aba Cobertura, com o nome do lado: "Caimento para o fundo, alinhado com a divisa do Lote 243"). ladosCaimento(G) lista
  os lados (lote pelas medidas do mapa, |cos| >= 0,7 com a frente, chanfro fica de fora); infoTelhado ganha a borda "rot" (dist linear
  smax - p·d, TI.rot, TI.dist), usada pela estrutura (terças perpendiculares ao caimento), perspectiva (dB.rot) e calhas. Sem platibanda
  cai para o lado reto mais próximo. Salas Av. principal: uma calha só, na parede do fundo (antes saía outra na divisa do 243).
- 5.19: fossa: campos novos na aba Hidrossanitário: tanque séptico retangular ou redondo (cilíndrico, NBR 7229: Ø >= 1,10 m e
  Ø <= 2h), filtro anaeróbio opcional (sem filtro o tanque liga direto no sumidouro) e diâmetro do sumidouro (automático ou fixo
  1,00 a 2,50 m; com diâmetro fixo só aumenta o número de sumidouros se passar de 3 m de altura útil). Vale para a planta, o detalhe,
  a tabela, as notas e o orçamento. Salas Av. principal com tanque redondo, sem filtro e sumidouro Ø1,00: TS Ø1,35 h=1,20 e SM Ø1,00 h=2,70 no fundo.
- 5.17: fachadas: folha de porta ou janela vista muito de lado (parede inclinada, menos de 2,2 mm no papel) fica só com o contorno; "FIXA" só aparece com folha de 5 mm ou mais.
- 5.14: modelo das salas com pé-direito 3,50 m e platibanda até 5,00 m (campo novo "Altura final da platibanda"), telhado em uma água caindo da Av. principal para o fundo, calha do fundo 35x20 (campos novos de largura/altura mínima da calha na aba Cobertura).
- 5.13: formato A0 (1189 x 841), até 9 desenhos por folha; fachadas, paginação, fundação e vistas do banheiro também agrupam. Salas: A0 6 folhas, A1 9.
- 5.12: pranchas agrupadas: no A1 até 6 desenhos por folha e no A2 até 4, por disciplina (arquitetura, estrutura, instalações, acabamentos, detalhes), plantas na mesma escala, tabelas juntas na faixa de baixo; opção "Desenhos por folha" ao lado do formato. Salas: A1 24→9-10 folhas, A2 24→13.
- 5.11: cotas da planta sem os cantos do chanfro na cadeia de cima/esquerda (sala 1 = 6,00), sem cota inclinada curta junto das cadeias; texto dos ambientes num tamanho só (nome 2,0 · área 1,6 · NV 1,4) em todas as plantas; ambiente pequeno mostra só as linhas que cabem.
- 5.10: nome, área e nível dos ambientes diminuem para caber dentro do ambiente (planta baixa, pluvial, hidro, reforma), desviando do giro das portas.
- 5.9: revisão das 24 pranchas das salas: modelo sem laje (estrutura simples), portas da fachada em alumínio e vidro temperado (folha "vidro temperado 10 mm", contramarco), detalhe do piso sem a parte de veículo quando não há garagem, notas dos cortes sem laje.
- 5.8: vários projetos no aparelho (aba Dados: trocar, duplicar, renomear, excluir, baixar/abrir .json); modelo "Salas comerciais Av. principal" (do PDF planta do cliente: 2 salas + banheiro, fachada chanfrada, platibanda caindo para a frente, pluvial para a rua lateral); verificação contra goteira e umidade na aba Cobertura. Lote de esquina ainda pelas medidas do mapa (o prédio não cabe na frente de 11,14): esperar o DWG da situação.
- 5.7: calha cortada nos cortes AA/BB (platibanda e beiral) e calha de beiral no detalhe do beiral.
- 5.6: escolha da rua de saída da água pluvial (a mais baixa do terreno; lote de esquina: Rua lateral); campos de texto ap.beiral, ap.dest, ele.rede e ele.qdSala passaram a gravar certo.
- 5.5: águas pluviais (calha da platibanda ou do beiral, condutores AP, caixas de areia, rede enterrada pelo anel do esgoto, saída sob a calçada até a sarjeta ou galeria).
- 5.4: revisão geral: tabelas do PDF não invadem a coluna do lado, títulos dos desenhos cabem na
  caixa (A4 com 4 desenhos), detalhe da porta de correr sem texto saindo da folha.

## Como testar (resumo)
Servidor local `python3 -m http.server 8766` na raiz; Playwright com Chromium em /opt/pw-browsers/chromium.
Revisão geral: abrir todas as abas (casa padrão, salas comerciais, casa com gesso/220 V/ar/estrutura simples),
procurar NaN/undefined, gerar PDF A4/A3/A2/A1 e DXF, conferir textos fora da folha e sobrepostos.

## A fazer depois
- Importar a situação direto do DXF pela aba Dados (hoje os cantos do lote de esquina foram passados à mão para terr.pts).
- Banheiro com mais de uma parede inclinada ainda fica sem louças (só retangular ou 1 inclinada).
- Drywall: o desenho usa a espessura geral das paredes (só o orçamento usa 9,5 cm).
- Elétrica: limites mono/bi/trifásico são de referência; conferir com a norma da Equatorial Pará.
- Hidrossanitário em banheiro muito pequeno: rótulos ficam apertados.
