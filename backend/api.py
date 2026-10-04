"""API FastAPI. Rodar da raiz do repositório: uvicorn backend.api:app --reload"""
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from . import algoritmos, calculo, config, estado
from .mapa import GerenciadorMapa

MODO_MOCK = os.environ.get("MODO_MOCK") == "1"

app = FastAPI(title="Sistema de Entregas")
app.add_middleware(CORSMiddleware, allow_origins=config.ORIGENS_PERMITIDAS,
                   allow_methods=["*"], allow_headers=["*"])

mapa = GerenciadorMapa(carregador=(lambda c, r: {"adj": {}, "coords": {}, "postos": []})
                       if MODO_MOCK else None)
_haversine = None


def distancia_m(a, b):
    global _haversine
    if _haversine is None:
        _haversine = algoritmos.reais().haversine
    return _haversine(a, b)


class LojaIn(BaseModel):
    nome: str = Field(min_length=1, max_length=80)
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class VeiculosIn(BaseModel):
    quantidade: int = Field(ge=1, le=1000)
    autonomia_cheio_km: float = Field(gt=0)
    autonomia_atual_km: float = Field(gt=0)


class EntregaIn(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    horario_saida: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")


def _fora_do_raio(lat, lon):
    return distancia_m((estado.loja["lat"], estado.loja["lon"]), (lat, lon)) > config.RAIO_M


@app.get("/api/estado")
def get_estado():
    return {"loja": estado.loja, "veiculos": estado.veiculos, "entregas": estado.entregas,
            "raio_m": config.RAIO_M, "mapa": mapa.status(), "modo_mock": MODO_MOCK}


@app.post("/api/loja")
def post_loja(dados: LojaIn):
    estado.loja = dados.model_dump()
    removidas = [e["id"] for e in estado.entregas if _fora_do_raio(e["lat"], e["lon"])]
    for entrega_id in removidas:   # a loja mudou: entregas fora da nova área saem
        estado.remover_entrega(entrega_id)
    mapa.iniciar(dados.lat, dados.lon)
    return {"loja": estado.loja, "entregas_removidas": removidas, "mapa": mapa.status()}


@app.get("/api/loja/mapa-status")
def get_mapa_status():
    return mapa.status()


@app.post("/api/veiculos")
def post_veiculos(dados: VeiculosIn):
    if dados.autonomia_atual_km > dados.autonomia_cheio_km:
        raise HTTPException(422, "A autonomia atual não pode ser maior que a autonomia com tanque cheio.")
    estado.veiculos = dados.model_dump()
    return estado.veiculos


@app.post("/api/entregas", status_code=201)
def post_entrega(dados: EntregaIn):
    if estado.loja is None:
        raise HTTPException(409, "Cadastre a loja antes de adicionar entregas.")
    if _fora_do_raio(dados.lat, dados.lon):
        raise HTTPException(422, f"Entrega fora da área de cobertura ({config.RAIO_M / 1000:g} km ao redor da loja).")
    return estado.nova_entrega(dados.lat, dados.lon, dados.horario_saida)


@app.delete("/api/entregas/{entrega_id}")
def delete_entrega(entrega_id: int):
    if not estado.remover_entrega(entrega_id):
        raise HTTPException(404, "Entrega não encontrada.")
    return {"ok": True}


@app.post("/api/calcular")
def post_calcular():
    if estado.loja is None:
        raise HTTPException(409, "Cadastre a loja primeiro.")
    if estado.veiculos is None:
        raise HTTPException(409, "Cadastre os veículos primeiro.")
    if not estado.entregas:
        raise HTTPException(409, "Adicione pelo menos uma entrega.")

    if MODO_MOCK:
        from .mock_calcular import resposta_falsa
        return resposta_falsa(estado.loja, estado.veiculos, estado.entregas)

    status = mapa.status()
    if status["estado"] == "carregando":
        return JSONResponse({"status": "carregando", "mensagem": "O mapa ainda está sendo baixado."},
                            status_code=202)
    if status["estado"] != "pronto":
        raise HTTPException(503, status["mensagem"] or "O mapa não está disponível. Salve a loja novamente.")

    return calculo.calcular(estado.loja, estado.veiculos, list(estado.entregas), mapa.grafo())
