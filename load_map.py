import math
import osmnx as ox

ox.settings.use_cache = True

CENTRO = (-15.7939, -47.8828)
RAIO = 5000


def carregar_dados(centro, raio):
    """Baixa as ruas de carro e os postos de combustível ao redor do centro."""
    G = ox.graph_from_point(centro, dist=raio, network_type="drive")
    postos_gdf = ox.features_from_point(centro, tags={"amenity": "fuel"}, dist=raio)
    return G, postos_gdf


def converter_grafo(G):
    adj = {}
    coords = {}
    for no, dados in G.nodes(data=True):
        adj[no] = []
        coords[no] = (dados["y"], dados["x"])

    for u, v, dados in G.edges(data=True):
        adj[u].append((v, dados["length"]))

    return adj, coords


def extrair_postos(postos_gdf):
    postos = []
    for _, linha in postos_gdf.iterrows():
        ponto = linha.geometry.centroid
        nome = linha.get("name")
        if not isinstance(nome, str):
            nome = "Posto sem nome"
        postos.append((nome, (ponto.y, ponto.x)))   # y = latitude, x = longitude
    return postos


def haversine(a, b):
    lat1, lon1 = map(math.radians, a)
    lat2, lon2 = map(math.radians, b)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))   # 6371000 = raio da Terra em metros


def esquina_mais_proxima(coords, ponto):
    return min(coords, key=lambda n: haversine(coords[n], ponto))


# TODO: provisória
def distancias_acumuladas(adj, caminho):
    acum = [0]
    for u, v in zip(caminho, caminho[1:]):
        acum.append(acum[-1] + min(w for x, w in adj[u] if x == v))
    return acum


def postos_na_rota(postos, caminho, coords, adj, raio_m=200):
    acum = distancias_acumuladas(adj, caminho)
    na_rota = []
    for nome, ponto in postos:
        # índice (dentro do caminho) da esquina do caminho mais perto do posto
        i = min(range(len(caminho)), key=lambda k: haversine(coords[caminho[k]], ponto))
        if haversine(coords[caminho[i]], ponto) <= raio_m:
            na_rota.append((acum[i], nome))
    return sorted(na_rota)


if __name__ == "__main__":
    G, postos_gdf = carregar_dados(CENTRO, RAIO)
    adj, coords = converter_grafo(G)
    postos = extrair_postos(postos_gdf)
    print(len(adj), "esquinas")
    print(len(postos), "postos")