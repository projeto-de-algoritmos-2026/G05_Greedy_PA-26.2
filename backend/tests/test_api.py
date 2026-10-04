import time

import pytest
from fastapi.testclient import TestClient

from backend import api, estado
from backend.mapa import GerenciadorMapa

BRASILIA = {"nome": "Loja", "lat": -15.7939, "lon": -47.8828}
VEICULOS = {"quantidade": 2, "autonomia_cheio_km": 10, "autonomia_atual_km": 5}
GRAFO = {"adj": {}, "coords": {}, "postos": []}


@pytest.fixture(autouse=True)
def limpo():
    estado.resetar()
    api.mapa = GerenciadorMapa(carregador=lambda c, r: GRAFO)
    yield
    estado.resetar()


cliente = TestClient(api.app)


def esperar_mapa():
    for _ in range(100):
        if api.mapa.status()["estado"] != "carregando":
            return
        time.sleep(0.01)


def test_calcular_exige_loja_veiculos_e_entregas():
    assert cliente.post("/api/calcular").status_code == 409
    cliente.post("/api/loja", json=BRASILIA)
    assert cliente.post("/api/calcular").status_code == 409
    cliente.post("/api/veiculos", json=VEICULOS)
    assert cliente.post("/api/calcular").status_code == 409


def test_entrega_exige_loja_e_respeita_raio():
    corpo = {"lat": -15.7939, "lon": -47.8828, "horario_saida": "09:00"}
    assert cliente.post("/api/entregas", json=corpo).status_code == 409
    cliente.post("/api/loja", json=BRASILIA)
    assert cliente.post("/api/entregas", json=corpo).status_code == 201
    longe = {**corpo, "lat": -16.5}
    r = cliente.post("/api/entregas", json=longe)
    assert r.status_code == 422 and "fora da área" in r.json()["detail"]


def test_horario_invalido():
    cliente.post("/api/loja", json=BRASILIA)
    r = cliente.post("/api/entregas", json={"lat": -15.79, "lon": -47.88, "horario_saida": "9h"})
    assert r.status_code == 422


def test_autonomia_atual_maior_que_cheio():
    r = cliente.post("/api/veiculos", json={**VEICULOS, "autonomia_atual_km": 20})
    assert r.status_code == 422


def test_remover_entrega():
    cliente.post("/api/loja", json=BRASILIA)
    e = cliente.post("/api/entregas", json={"lat": -15.79, "lon": -47.88, "horario_saida": "09:00"}).json()
    assert cliente.delete(f"/api/entregas/{e['id']}").status_code == 200
    assert cliente.delete(f"/api/entregas/{e['id']}").status_code == 404


def test_mapa_baixando_devolve_202(monkeypatch):
    cliente.post("/api/loja", json=BRASILIA)
    cliente.post("/api/veiculos", json=VEICULOS)
    cliente.post("/api/entregas", json={"lat": -15.79, "lon": -47.88, "horario_saida": "09:00"})
    api.mapa._estado = {"estado": "carregando", "mensagem": None}
    assert cliente.post("/api/calcular").status_code == 202


def test_falha_de_rede_vira_503():
    def falha(c, r):
        raise ConnectionError("sem internet")
    api.mapa = GerenciadorMapa(carregador=falha)
    cliente.post("/api/loja", json=BRASILIA)
    cliente.post("/api/veiculos", json=VEICULOS)
    cliente.post("/api/entregas", json={"lat": -15.79, "lon": -47.88, "horario_saida": "09:00"})
    esperar_mapa()
    r = cliente.post("/api/calcular")
    assert r.status_code == 503 and "baixar o mapa" in r.json()["detail"]


def test_mudar_loja_descarta_mapa_e_entregas_fora():
    cliente.post("/api/loja", json=BRASILIA)
    esperar_mapa()
    assert api.mapa.grafo() is not None
    cliente.post("/api/entregas", json={"lat": -15.79, "lon": -47.88, "horario_saida": "09:00"})
    r = cliente.post("/api/loja", json={"nome": "Outra", "lat": -23.55, "lon": -46.63}).json()
    assert len(r["entregas_removidas"]) == 1
    assert estado.entregas == []
