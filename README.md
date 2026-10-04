# G05_Greedy_PA-26.2

Sistema de entregas desenvolvido para a disciplina de Projeto de Algoritmos (2026.2). O projeto usa o mapa real de uma cidade (OpenStreetMap) e aplica algoritmos gulosos para planejar rotas, paradas para abastecer e a alocação de motos.

## Módulos (`algoritmo/`)

| Arquivo | O que faz |
|---|---|
| `load_map.py` | Baixa o mapa com o OSMnx, converte em grafo (lista de adjacência), extrai os postos de combustível, calcula distâncias (haversine) e encontra os postos que ficam na rota. |
| `dijkstra.py` | `dijkstra()` calcula o menor caminho entre duas esquinas. `distancias_acumuladas()` calcula a distância percorrida até cada esquina da rota. |
| `caminhoneiro.py` | Guloso para escolher em quais postos o caminhoneiro deve abastecer ao longo da rota (ida e volta). |
| `despacho_motos.py` | Guloso (Interval Partitioning) para alocar o menor número de motos que cobre um conjunto de entregas. |

Os testes ficam em `algoritmo/test_*.py` e `algoritmo/tests/`.

## Como rodar

Requer Python 3.

```bash
pip install -r requirements.txt

# testes
cd algoritmo
python -m pytest

# baixa o mapa e mostra quantas esquinas e postos foram encontrados
python load_map.py
```

O mapa é baixado na primeira execução e fica em cache na pasta `cache/`.
