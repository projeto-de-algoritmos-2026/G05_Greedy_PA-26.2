from types import SimpleNamespace

import pytest

from backend import calculo

# grafo falso: A - B - C em linha (1000 m cada) e Z isolado
GRAFO = {
    "adj": {"A": [("B", 1000)], "B": [("C", 1000)], "C": [], "Z": []},
    "coords": {"A": (0, 0), "B": (0, 1), "C": (0, 2), "Z": (9, 9)},
    "postos": [("Posto B", (0, 1))],
}
LOJA = {"lat": 0, "lon": 0}
VEICULOS = {"quantidade": 2, "autonomia_cheio_km": 10, "autonomia_atual_km": 10}


def alg_falso(paradas=(), caminhos=None):
    """Algoritmos substituídos por respostas fixas."""
    caminhos = caminhos or {"C": (["A", "B", "C"], 2000), "B": (["A", "B"], 1000), "Z": (None, float("inf"))}
    return SimpleNamespace(
        esquina_mais_proxima=lambda coords, ponto: {(0, 0): "A", (0, 1): "B", (0, 2): "C", (9, 9): "Z"}[ponto],
        dijkstra=lambda adj, o, d: caminhos[d],
        alocar_motos=lambda ints: (2, [0, 1, 0][: len(ints)]),
        postos_na_rota=lambda *a, **k: [(1000, "Posto B")],
        postos_ida_e_volta=lambda p, t: (sorted(p + [(2 * t - x, n) for x, n in p]), 2 * t),
        recomendar_paradas=lambda *a: None if paradas is None else list(paradas),
        distancias_acumuladas=lambda adj, caminho: [0, 1000, 2000][: len(caminho)],
    )


def test_hhmm():
    assert calculo.hhmm_para_min("09:30") == 570
    assert calculo.min_para_hhmm(570) == "09:30"
    assert calculo.min_para_hhmm(1450) == "00:10"
    with pytest.raises(ValueError):
        calculo.hhmm_para_min("25:00")


def test_montar_intervalo():
    # 3 km a 30 km/h = 6 min cada trecho -> 12 min de ida e volta + 5 no cliente
    assert calculo.montar_intervalo(540, 3000, 30, 5) == (540, 557)


def test_fluxo_basico():
    entregas = [{"id": 1, "lat": 0, "lon": 2, "horario_saida": "09:00"},
                {"id": 2, "lat": 0, "lon": 1, "horario_saida": "09:05"}]
    r = calculo.calcular(LOJA, VEICULOS, entregas, GRAFO, alg_falso())
    assert r["veiculos_necessarios"] == 2
    assert r["faltam_veiculos"] is False
    assert [e["veiculo"] for e in r["entregas"]] == [1, 2]      # +1: ids começam em 0
    assert r["entregas"][0]["distancia_km"] == 2.0
    assert r["entregas"][0]["saida"] == "09:00"
    assert r["entregas"][0]["rota"] == [[0, 0], [0, 1], [0, 2]]


def test_faltam_veiculos():
    entregas = [{"id": 1, "lat": 0, "lon": 2, "horario_saida": "09:00"}]
    r = calculo.calcular(LOJA, {**VEICULOS, "quantidade": 1}, entregas, GRAFO, alg_falso())
    assert r["faltam_veiculos"] is True


def test_entrega_sem_rota_nao_entra_no_despacho():
    entregas = [{"id": 1, "lat": 9, "lon": 9, "horario_saida": "09:00"},
                {"id": 2, "lat": 0, "lon": 2, "horario_saida": "09:00"}]
    alg = alg_falso()
    chamadas = []
    original = alg.alocar_motos
    alg.alocar_motos = lambda ints: chamadas.append(len(ints)) or original(ints)
    r = calculo.calcular(LOJA, VEICULOS, entregas, GRAFO, alg)
    assert r["entregas"][0]["sem_rota"] is True
    assert r["entregas"][0]["veiculo"] is None
    assert r["entregas"][1]["sem_rota"] is False
    assert chamadas == [1]


def test_parada_na_ida_e_na_volta():
    entregas = [{"id": 1, "lat": 0, "lon": 2, "horario_saida": "09:00"}]
    paradas = [(1000, "Posto B"), (3000, "Posto B")]
    r = calculo.calcular(LOJA, VEICULOS, entregas, GRAFO, alg_falso(paradas))
    ida, volta = r["entregas"][0]["paradas"]
    assert (ida["sentido"], ida["posicao_km"], ida["lat"], ida["lon"]) == ("ida", 1.0, 0, 1)
    assert (volta["sentido"], volta["posicao_km"], volta["lat"], volta["lon"]) == ("volta", 3.0, 0, 1)


def test_autonomia_insuficiente():
    entregas = [{"id": 1, "lat": 0, "lon": 2, "horario_saida": "09:00"}]
    r = calculo.calcular(LOJA, VEICULOS, entregas, GRAFO, alg_falso(paradas=None))
    assert r["entregas"][0]["autonomia_insuficiente"] is True
    assert r["entregas"][0]["paradas"] == []


def test_volta_depois_da_meia_noite():
    entregas = [{"id": 1, "lat": 0, "lon": 2, "horario_saida": "23:55"}]
    r = calculo.calcular(LOJA, VEICULOS, entregas, GRAFO, alg_falso())
    assert r["entregas"][0]["volta_dia_seguinte"] is True
