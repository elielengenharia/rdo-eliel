# Projeto Arquitetônico — onde paramos

App: https://elielengenharia.github.io/rdo-eliel/arquitetonico/ (arquivo único `arquitetonico/index.html`).
Detalhador de Fundação: https://elielengenharia.github.io/rdo-eliel/fundacao/

## No ar (main)
- 4.7: forro e parede de drywall, estrutura convencional e simples (coluninhas prontas, broca 1,20 m),
  fossa séptica + filtro + sumidouro, caixas de esgoto na calçada, lote pelas medidas do mapa,
  planta de situação, parede de tijolo 10 cm + reboco 2,5 cm.
- 4.8 / 4.9: calha da platibanda (NBR 10844) e base do piso de concreto (tela, macrofibra, fibra de aço).
- 5.0: etapa de pintura (aba Pintura, cores por ambiente, material em latas/galões/baldes, prancha).
- 5.1: instalações elétricas: eletrodutos traçados, fiação por trecho, queda de tensão (4 % / 5 %),
  demanda, entrada, DR, DPS, quadro com reserva, diagrama unifilar e material elétrico.
- 5.2: imóvel comercial com 2+ salas: um quadro e medidor por sala (banheiro vai para a sala de onde se entra).
- 5.3: símbolos elétricos menores (65 %).
- 5.15: nomes de ambiente fora de todos os ambientes ou empilhados no mesmo ponto vão sozinhos para os ambientes sem nome (banheiro no menor, os outros da esquerda para a direita) e o ponto é gravado.
- 5.16: aba Perspectivas. Quatro vistas (frontal pelos dois lados, posterior, aérea) da maquete gerada pela planta (paredes, vergas, peitoris, vãos, platibanda, telhado) ou da maquete anexada (.dae do SketchUp com cores e arestas, .obj, .stl; .skp não abre no navegador, avisa para exportar COLLADA). Maquete guardada por projeto em arq-maquete-v1:<projeto>. Prancha PERSPECTIVAS (sem escala) no PDF e no DXF (camada PERSP), agrupada com banheiro/portas/esquadrias. Funções: maquete3dApp, vista3d (painter + z-buffer para faces e arestas), desenhoPersp, perspFolha, renderPersp. Primitivas g/l aceitam rgb. Renderização (render3d): imagem calculada pixel a pixel com sol e sombra (mapa de sombra), céu em degradê, gramado com névoa, vidro com reflexo do céu, ondas da telha e caixilhos; sai em JPEG no PDF (/XObject DCTDecode, primitiva "img" com .vet para o DXF), cache em CACHE_R. Opções: estilo renderizada/traço, cor das paredes, da platibanda e dos caixilhos, tipo de vidro, botão Baixar imagem (JPG 2400 px). Vidro do .dae: material transparente ou com nome vidro/glass. O sol de cada vista ilumina a fachada principal.
- 5.17: fachadas: folha de porta ou janela vista muito de lado (parede inclinada, menos de 2,2 mm no papel) fica só com o contorno; "FIXA" só aparece com folha de 5 mm ou mais.
- 5.14: modelo das salas com pé-direito 3,50 m e platibanda até 5,00 m (campo novo "Altura final da platibanda"), telhado em uma água caindo da Av. Paraná para o fundo, calha do fundo 35x20 (campos novos de largura/altura mínima da calha na aba Cobertura).
- 5.13: formato A0 (1189 x 841), até 9 desenhos por folha; fachadas, paginação, fundação e vistas do banheiro também agrupam. Salas: A0 6 folhas, A1 9.
- 5.12: pranchas agrupadas: no A1 até 6 desenhos por folha e no A2 até 4, por disciplina (arquitetura, estrutura, instalações, acabamentos, detalhes), plantas na mesma escala, tabelas juntas na faixa de baixo; opção "Desenhos por folha" ao lado do formato. Salas: A1 24→9-10 folhas, A2 24→13.
- 5.11: cotas da planta sem os cantos do chanfro na cadeia de cima/esquerda (sala 1 = 6,00), sem cota inclinada curta junto das cadeias; texto dos ambientes num tamanho só (nome 2,0 · área 1,6 · NV 1,4) em todas as plantas; ambiente pequeno mostra só as linhas que cabem.
- 5.10: nome, área e nível dos ambientes diminuem para caber dentro do ambiente (planta baixa, pluvial, hidro, reforma), desviando do giro das portas.
- 5.9: revisão das 24 pranchas das salas: modelo sem laje (estrutura simples), portas da fachada em alumínio e vidro temperado (folha "vidro temperado 10 mm", contramarco), detalhe do piso sem a parte de veículo quando não há garagem, notas dos cortes sem laje.
- 5.8: vários projetos no aparelho (aba Dados: trocar, duplicar, renomear, excluir, baixar/abrir .json); modelo "Salas comerciais Av. Paraná" (do PDF WALISSON_PALMEIRA_REV_2: 2 salas + banheiro, fachada chanfrada, platibanda caindo para a frente, pluvial para a Guarani); verificação contra goteira e umidade na aba Cobertura. Lote 277 ainda pelas medidas do mapa (o prédio não cabe na frente de 11,14): esperar o DWG da situação.
- 5.7: calha cortada nos cortes AA/BB (platibanda e beiral) e calha de beiral no detalhe do beiral.
- 5.6: escolha da rua de saída da água pluvial (a mais baixa do terreno; lote 277: Rua Guarani); campos de texto ap.beiral, ap.dest, ele.rede e ele.qdSala passaram a gravar certo.
- 5.5: águas pluviais (calha da platibanda ou do beiral, condutores AP, caixas de areia, rede enterrada pelo anel do esgoto, saída sob a calçada até a sarjeta ou galeria).
- 5.4: revisão geral: tabelas do PDF não invadem a coluna do lado, títulos dos desenhos cabem na
  caixa (A4 com 4 desenhos), detalhe da porta de correr sem texto saindo da folha.

## Como testar (resumo)
Servidor local `python3 -m http.server 8766` na raiz; Playwright com Chromium em /opt/pw-browsers/chromium.
Revisão geral: abrir todas as abas (casa padrão, salas comerciais, casa com gesso/220 V/ar/estrutura simples),
procurar NaN/undefined, gerar PDF A4/A3/A2/A1 e DXF, conferir textos fora da folha e sobrepostos.

## A fazer depois
- Planta de situação definitiva do lote 277 quando chegar o DXF da situação
  (salvar o DWG como DXF). Lote: frente Av. Paraná 11,14; 243 21,31; 290 14,15;
  Rua Guarani 14,69; chanfro 4,04; área 259,17 m². Construção encostada no 243 e na avenida.
- Banheiro com mais de uma parede inclinada ainda fica sem louças (só retangular ou 1 inclinada).
- Drywall: o desenho usa a espessura geral das paredes (só o orçamento usa 9,5 cm).
- Elétrica: limites mono/bi/trifásico são de referência; conferir com a norma da Equatorial Pará.
- Hidrossanitário em banheiro muito pequeno: rótulos ficam apertados.
