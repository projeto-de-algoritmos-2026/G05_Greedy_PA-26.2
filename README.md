# G05_Greedy_PA-26.2

Projeto da disciplina de Projeto de Algoritmos (2026.2) sobre **algoritmos greedy aplicados a logística urbana**, usando o mapa real de uma cidade como base (OSMnx).

## Proposta

O trabalho simula um cenário de logística em que diferentes problemas são resolvidos com estratégias gulosas sobre um grafo viário real:

- Um caminhoneiro percorre uma rota e precisa decidir em quais postos abastecer sem ficar sem combustível.
- Uma frota de motos precisa atender um conjunto de entregas usando o menor número possível de motos.

Cada módulo é independente e testável com dados falsos, sem depender do mapa real, sendo todos integrados no final.

## Módulos

### 1. Mapa da cidade (OSMnx)
Baixa as ruas (`network_type="drive"`) e os postos de combustível (`amenity=fuel`) de uma região com OSMnx e converte tudo para estruturas próprias:
- `adj[u] = [(v, metros), ...]` — lista de adjacência do grafo viário;
- `coords[n] = (lat, lon)` — coordenadas de cada nó;
- lista de postos como `(nome, (lat, lon))`.

OSMnx é usado **apenas para o download** dos dados. Também implementa:
- `esquina_mais_proxima(coords, ponto)` — nó mais próximo de um ponto, via haversine implementada do zero;
- `postos_na_rota(postos, caminho, coords, adj, raio_m=200)` — postos a até ~200 m do caminho, ordenados pela posição ao longo da rota.

### 2. Dijkstra próprio
Implementação própria do algoritmo de Dijkstra (sem usar `networkx.shortest_path`, `ox.shortest_path` ou qualquer menor caminho pronto):
- `dijkstra(adj, origem, destino) -> (caminho, distancia_em_metros)`, usando `heapq`;
- `distancias_acumuladas(adj, caminho)` — distância acumulada do início do caminho até cada nó, usada para localizar os postos na rota.

### 3. Recomendação de abastecimento (caminhoneiro)
Algoritmo guloso clássico de reabastecimento: a partir da posição atual, para sempre no posto **mais longe que ainda está dentro do alcance** do tanque. Suporta ida e volta pelo mesmo caminho (postos da ida espelhados na volta).

### 4. Despacho de motos (Interval Partitioning)
Aloca o menor número de motos para cobrir um conjunto de entregas (cada entrega é um intervalo de saída/volta), usando Interval Partitioning com um min-heap que guarda o horário em que cada moto fica livre.

## Estrutura de desenvolvimento

Cada módulo corresponde a uma issue e uma branch própria:

| Módulo | Branch |
|---|---|
| Mapa com OSMnx | `feat/mapa-osmnx` |
| Dijkstra próprio | `feat/dijkstra` |
| Recomendação de abastecimento | `feat/caminhoneiro` |
| Despacho de motos | `feat/despacho-motos` |
