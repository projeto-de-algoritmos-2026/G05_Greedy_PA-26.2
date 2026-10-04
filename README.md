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

## Interface web

Uma loja marca no mapa onde fica, quantos veículos tem e as entregas do dia. O sistema responde: o menor caminho até cada cliente (Dijkstra), quantos veículos são necessários e qual leva cada entrega (Interval Partitioning) e onde abastecer em cada rota (Selecting Breakpoints).

- `backend/`: API em FastAPI. `calculo.py` é o "colador" que chama os módulos de `algoritmo/` sem alterá-los.
- `frontend/`: React (Vite) com mapa Leaflet/OpenStreetMap, sem chave de API.

Detalhes que valem saber:
- Raio de cobertura fixo (5 km), velocidade (30 km/h) e tempo no cliente (5 min) ficam em `backend/config.py`.
- O mapa é baixado em segundo plano assim que a loja é salva (pode levar alguns segundos).
- A volta é feita pelo mesmo caminho da ida, mesmo que haja ruas de mão única.
- A autonomia informada vale para cada entrega, que sai do estado atual dos veículos.

## Como rodar

Requer Python 3 e Node.js.

```bash
# dependências do backend (na raiz)
pip install -r requirements.txt

# terminal 1: backend em modo mock (rodar da raiz do repositório)
MODO_MOCK=1 uvicorn backend.api:app --reload

# terminal 2: frontend
cd frontend
npm install
npm run dev        # abre em http://localhost:5173
```

Na tela, posicione a loja perto da **Rodoviária do Plano Piloto (Brasília-DF)**, em torno de `-15.7939, -47.8828`, e marque as entregas dentro do círculo.

### Por que o modo mock

O mapa de ruas e os postos vêm do Overpass, um servidor público do OpenStreetMap que costuma ficar sobrecarregado e responder com timeout (`Read timed out`), o que torna a demonstração imprevisível. No modo mock o backend não baixa nada:

- **Real:** os postos são os de verdade do OpenStreetMap num raio de 5 km da Rodoviária (gravados em `backend/mock_calcular.py`), e o resultado usa os mesmos algoritmos gulosos do projeto: `alocar_motos` (Interval Partitioning) para os veículos e `recomendar_paradas` (Selecting Breakpoints) para onde abastecer.
- **Simulado:** as ruas. A rota é uma linha reta da loja ao cliente e a distância é essa reta vezes 1,3, em vez do Dijkstra no grafo de ruas. Por isso só aparecem como paradas os postos a até 200 m dessa reta.

Só funciona com a loja perto da Rodoviária, pois é a única região com postos gravados.

### Modo real (mapa baixado)

Sem o `MODO_MOCK`, o backend baixa o mapa da região da loja e roda tudo de verdade, incluindo o Dijkstra nas ruas:

```bash
uvicorn backend.api:app --reload
```

O download pode demorar e falhar por timeout do Overpass. O backend tenta alguns servidores em sequência (`OVERPASS_URLS` em `backend/config.py`).

### Testes

```bash
python -m pytest            # algoritmos e backend, sem rede
```

### Só os algoritmos

```bash
cd algoritmo
python -m pytest
python load_map.py   # baixa o mapa e mostra quantas esquinas e postos foram encontrados
```

O mapa é baixado na primeira execução e fica em cache na pasta `cache/`.
