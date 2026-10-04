"""RESPOSTA SIMULADA para a demonstração, sem baixar o mapa (modo mock).

Ativada com a variável de ambiente MODO_MOCK=1.

Por que existe: o mapa vem do Overpass (servidor público do OpenStreetMap), que
costuma ficar sobrecarregado e dar timeout. Para a demonstração, os postos são
os postos REAIS do OpenStreetMap num raio de 5 km da Rodoviária do Plano Piloto
(Brasília-DF), gravados abaixo. Use a loja perto da Rodoviária (-15.7939, -47.8828).

O que é real: os postos, o Interval Partitioning (`alocar_motos`) e o guloso de
abastecimento (`recomendar_paradas`), que são os mesmos módulos de `algoritmo/`.
O que é simulado: as ruas. A rota é uma linha reta da loja ao cliente, e a
distância é essa reta vezes FATOR_RUAS (em vez do Dijkstra no grafo de ruas).
"""
import math

from . import algoritmos, config
from .calculo import hhmm_para_min, min_para_hhmm, montar_intervalo

FATOR_RUAS = 1.3      # uma rua real é mais longa que a linha reta

# (nome, (lat, lon)): amenity=fuel do OpenStreetMap, a 5 km da Rodoviária do Plano Piloto
POSTOS_DF = [
    ('Shell', (-15.74992, -47.88755)),
    ('BR', (-15.75327, -47.88317)),
    ('Posto sem nome', (-15.75433, -47.88716)),
    ('Posto Jade', (-15.7548, -47.88268)),
    ('Posto Fratelli 311 Norte', (-15.75528, -47.89019)),
    ('Posto Ipiranga', (-15.7558, -47.88573)),
    ('BR', (-15.75752, -47.88941)),
    ('Posto BR', (-15.75754, -47.88932)),
    ('Posto sem nome', (-15.75864, -47.88143)),
    ('Shell', (-15.7606, -47.88506)),
    ('Posto 309 Norte', (-15.76065, -47.8884)),
    ('Postinho da UnB', (-15.7608, -47.87426)),
    ('BR', (-15.76199, -47.8837)),
    ('BR', (-15.76598, -47.87915)),
    ('BR', (-15.76674, -47.8832)),
    ('Shell', (-15.76678, -47.88652)),
    ('Genérico', (-15.76829, -47.87862)),
    ('Jar Jour', (-15.76866, -47.88174)),
    ('Shell', (-15.76916, -47.88586)),
    ('Posto da 405 Norte', (-15.77275, -47.8777)),
    ('BR', (-15.77283, -47.88511)),
    ('Ipiranga', (-15.77306, -47.88184)),
    ('Ipiranga', (-15.77472, -47.88069)),
    ('BR', (-15.77781, -47.9104)),
    ('BR', (-15.77852, -47.87718)),
    ('Shell', (-15.77888, -47.88751)),
    ('BR', (-15.77946, -47.88033)),
    ('BR', (-15.77955, -47.88112)),
    ('BR', (-15.77981, -47.8843)),
    ('BR', (-15.78146, -47.88421)),
    ('Posto Monumental', (-15.78792, -47.91518)),
    ('BR', (-15.78808, -47.89162)),
    ('Posto da Vila', (-15.78941, -47.84958)),
    ('BR', (-15.7898, -47.886)),
    ('Posto da Torre', (-15.79335, -47.89247)),
    ('Posto Imperial', (-15.79437, -47.88889)),
    ('Posto sem nome', (-15.79643, -47.9125)),
    ('Posto sem nome', (-15.79667, -47.91174)),
    ('BR', (-15.80305, -47.89156)),
    ('BR', (-15.80431, -47.89249)),
    ('BR', (-15.80554, -47.88828)),
    ('BR', (-15.80637, -47.8902)),
    ('Posto sem nome', (-15.80894, -47.89678)),
    ('BR', (-15.80951, -47.88759)),
    ('Ipiranga', (-15.81051, -47.89271)),
    ('BR', (-15.8112, -47.89464)),
    ('BR', (-15.81205, -47.90027)),
    ('Shell', (-15.81352, -47.9022)),
    ('BR', (-15.81445, -47.89226)),
    ('Shell', (-15.81502, -47.89753)),
    ('Auto Lus', (-15.8155, -47.89956)),
    ('BR', (-15.8169, -47.90665)),
    ('BR', (-15.8175, -47.89558)),
    ('BR', (-15.81901, -47.90285)),
    ('Shell', (-15.81906, -47.89752)),
    ('BR', (-15.81932, -47.90489)),
    ('BR', (-15.81982, -47.91082)),
    ('Posto Ipiranga', (-15.82039, -47.8465)),
    ('BR', (-15.82128, -47.91281)),
    ('Jarjour', (-15.82309, -47.90838)),
    ('BR', (-15.82312, -47.90308)),
    ('Posto sem nome', (-15.82548, -47.9064)),
    ('BR', (-15.82683, -47.91363)),
    ('Posto sem nome', (-15.82693, -47.90842)),
    ('Posto sem nome', (-15.82792, -47.88823)),
    ('Posto sem nome', (-15.83026, -47.87586)),
    ('Gasol', (-15.83219, -47.86847)),
]


def _haversine(a, b):
    lat1, lon1, lat2, lon2 = map(math.radians, (*a, *b))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))


def _projetar(origem, destino, ponto):
    """(fração ao longo da reta origem->destino, distância do ponto à reta, em metros)."""
    m_lat = 111_320.0
    m_lon = 111_320.0 * math.cos(math.radians(origem[0]))
    bx, by = (destino[1] - origem[1]) * m_lon, (destino[0] - origem[0]) * m_lat
    px, py = (ponto[1] - origem[1]) * m_lon, (ponto[0] - origem[0]) * m_lat
    t = (px * bx + py * by) / (bx * bx + by * by) if bx or by else 0.0
    t = max(0.0, min(1.0, t))
    return t, math.hypot(px - t * bx, py - t * by)


def _paradas(origem, destino, metros, veiculos):
    """(paradas, autonomia_insuficiente) com o guloso real de abastecimento."""
    import caminhoneiro

    candidatos = []
    for nome, ponto in POSTOS_DF:
        t, dist = _projetar(origem, destino, ponto)
        if dist <= config.RAIO_POSTO_M and 0 < t * metros < metros:
            candidatos.append((t * metros, nome, ponto, t))
    candidatos.sort()
    completos, total = caminhoneiro.postos_ida_e_volta([(p, n) for p, n, _, _ in candidatos], metros)
    escolhidas = caminhoneiro.recomendar_paradas(
        completos, total, veiculos["autonomia_atual_km"] * 1000, veiculos["autonomia_cheio_km"] * 1000)
    if escolhidas is None:
        return [], True

    paradas = []
    for posicao, nome in escolhidas:
        sentido = "ida"
        if posicao > metros:
            posicao, sentido = 2 * metros - posicao, "volta"
        _, _, ponto, _ = min(candidatos, key=lambda c: abs(c[0] - posicao))
        paradas.append({"nome": nome, "posicao_km": round(posicao / 1000, 2),
                        "sentido": sentido, "lat": ponto[0], "lon": ponto[1]})
    return paradas, False


def resposta_falsa(loja, veiculos, entregas):
    algoritmos.reais  # garante a pasta `algoritmo/` no sys.path
    from despacho_motos import alocar_motos

    origem = (loja["lat"], loja["lon"])
    itens = []
    for e in entregas:
        destino = (e["lat"], e["lon"])
        metros = _haversine(origem, destino) * FATOR_RUAS
        itens.append((e, destino, metros, montar_intervalo(hhmm_para_min(e["horario_saida"]), metros)))

    necessarios, moto_de = alocar_motos([it[3] for it in itens]) if itens else (0, [])

    resultados = []
    for (e, destino, metros, (_, volta)), moto in zip(itens, moto_de):
        paradas, insuficiente = _paradas(origem, destino, metros, veiculos)
        resultados.append({
            "id": e["id"], "veiculo": moto + 1, "saida": e["horario_saida"],
            "volta": min_para_hhmm(volta), "volta_dia_seguinte": volta >= 1440,
            "distancia_km": round(metros / 1000, 2),
            "rota": [list(origem), *([p["lat"], p["lon"]] for p in sorted(paradas, key=lambda p: p["posicao_km"]) if p["sentido"] == "ida"), list(destino)],
            "paradas": paradas, "autonomia_insuficiente": insuficiente, "sem_rota": False,
        })
    return {"veiculos_necessarios": necessarios,
            "veiculos_disponiveis": veiculos["quantidade"],
            "faltam_veiculos": necessarios > veiculos["quantidade"],
            "entregas": resultados}
