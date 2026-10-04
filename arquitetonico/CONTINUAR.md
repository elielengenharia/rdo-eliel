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
