"""Colador entre os módulos de algoritmos. Funções puras, sem rede.

Unidades: metros nas distâncias e minutos desde a meia-noite nos horários.
"""
import math
import re

from . import config

_HHMM = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")


def hhmm_para_min(texto):
    m = _HHMM.match(texto)
    if not m:
        raise ValueError(f"horário inválido: {texto!r} (use HH:MM)")
    return int(m.group(1)) * 60 + int(m.group(2))


def min_para_hhmm(minutos):
    minutos = int(minutos) % 1440
    return f"{minutos // 60:02d}:{minutos % 60:02d}"


def montar_intervalo(saida_min, metros, velocidade_kmh=None, tempo_cliente_min=None):
    """(saida, volta): ida e volta pelo mesmo caminho, mais o tempo no cliente."""
    velocidade_kmh = config.VELOCIDADE_KMH if velocidade_kmh is None else velocidade_kmh
    tempo_cliente_min = config.TEMPO_NO_CLIENTE_MIN if tempo_cliente_min is None else tempo_cliente_min
    metros_por_min = velocidade_kmh * 1000 / 60
    volta = saida_min + math.ceil(2 * metros / metros_por_min + tempo_cliente_min)
    return saida_min, volta


def _ponto_da_parada(posicao, total_ida, caminho, acum, coords):
    """Esquina da rota que corresponde à posição (ida e volta) de um posto."""
    sentido = "ida"
    if posicao > total_ida:
        posicao = 2 * total_ida - posicao      # volta espelhada
        sentido = "volta"
    i = min(range(len(caminho)), key=lambda k: abs(acum[k] - posicao))
    return coords[caminho[i]], sentido


def _paradas(caminho, metros, grafo, veiculos, alg):
    """Retorna (paradas, autonomia_insuficiente)."""
    adj, coords = grafo["adj"], grafo["coords"]
    na_rota = alg.postos_na_rota(grafo["postos"], caminho, coords, adj, config.RAIO_POSTO_M)
    # recomendar_paradas exige 0 < posicao < total
    na_rota = [(p, nome) for p, nome in na_rota if 0 < p < metros]
    completos, total = alg.postos_ida_e_volta(na_rota, metros)
    escolhidas = alg.recomendar_paradas(
        completos, total,
        veiculos["autonomia_atual_km"] * 1000,
        veiculos["autonomia_cheio_km"] * 1000,
    )
    if escolhidas is None:
        return [], True

    acum = alg.distancias_acumuladas(adj, caminho)
    paradas = []
    for posicao, nome in escolhidas:
        (lat, lon), sentido = _ponto_da_parada(posicao, metros, caminho, acum, coords)
        paradas.append({"nome": nome, "posicao_km": round(posicao / 1000, 2),
                        "sentido": sentido, "lat": lat, "lon": lon})
    return paradas, False


def calcular(loja, veiculos, entregas, grafo, alg=None):
    """Fluxo completo do despacho.

    loja: {"lat", "lon"}; veiculos: {"quantidade", "autonomia_cheio_km",
    "autonomia_atual_km"}; entregas: [{"id", "lat", "lon", "horario_saida"}];
    grafo: {"adj", "coords", "postos"}.
    """
    if alg is None:
        from . import algoritmos
        alg = algoritmos.reais()

    adj, coords = grafo["adj"], grafo["coords"]
    origem = alg.esquina_mais_proxima(coords, (loja["lat"], loja["lon"]))

    resultados = []
    for e in entregas:
        destino = alg.esquina_mais_proxima(coords, (e["lat"], e["lon"]))
        caminho, metros = alg.dijkstra(adj, origem, destino)
        r = {"id": e["id"], "veiculo": None, "saida": e["horario_saida"], "volta": None,
             "volta_dia_seguinte": False, "distancia_km": None, "rota": [], "paradas": [],
             "autonomia_insuficiente": False, "sem_rota": caminho is None}
        if caminho is not None:
            r["_caminho"], r["_metros"] = caminho, metros
            r["distancia_km"] = round(metros / 1000, 2)
            r["rota"] = [list(coords[n]) for n in caminho]
        resultados.append(r)

    com_rota = [r for r in resultados if not r["sem_rota"]]
    intervalos = []
    for r in com_rota:
        saida = hhmm_para_min(r["saida"])
        intervalos.append(montar_intervalo(saida, r["_metros"]))
    necessarios, veiculo_de = alg.alocar_motos(intervalos) if intervalos else (0, [])

    for r, (_, volta), veiculo in zip(com_rota, intervalos, veiculo_de):
        r["veiculo"] = veiculo + 1                 # alocar_motos numera a partir de 0
        r["volta"] = min_para_hhmm(volta)
        r["volta_dia_seguinte"] = volta >= 1440
        r["paradas"], r["autonomia_insuficiente"] = _paradas(
            r["_caminho"], r["_metros"], grafo, veiculos, alg)

    for r in resultados:
        r.pop("_caminho", None)
        r.pop("_metros", None)

    return {
        "veiculos_necessarios": necessarios,
        "veiculos_disponiveis": veiculos["quantidade"],
        "faltam_veiculos": necessarios > veiculos["quantidade"],
        "entregas": resultados,
    }
