"""RESPOSTA FALSA, só para desenvolver a interface sem baixar o mapa.

Ativada com a variável de ambiente MODO_MOCK=1. REMOVER na integração.
"""


def resposta_falsa(loja, veiculos, entregas):
    resultados = []
    for i, e in enumerate(entregas):
        dlat, dlon = e["lat"] - loja["lat"], e["lon"] - loja["lon"]
        meio = [loja["lat"] + dlat / 2, loja["lon"] + dlon / 2 + 0.002]
        h, m = map(int, e["horario_saida"].split(":"))
        volta = (h * 60 + m + 40) % 1440
        resultados.append({
            "id": e["id"], "veiculo": i % 2 + 1, "saida": e["horario_saida"],
            "volta": f"{volta // 60:02d}:{volta % 60:02d}", "volta_dia_seguinte": False,
            "distancia_km": 3.4,
            "rota": [[loja["lat"], loja["lon"]], meio, [e["lat"], e["lon"]]],
            "paradas": [{"nome": "Posto (falso)", "posicao_km": 1.7, "sentido": "ida",
                         "lat": meio[0], "lon": meio[1]}],
            "autonomia_insuficiente": False, "sem_rota": False,
        })
    necessarios = min(2, len(entregas))
    return {"veiculos_necessarios": necessarios,
            "veiculos_disponiveis": veiculos["quantidade"],
            "faltam_veiculos": necessarios > veiculos["quantidade"],
            "entregas": resultados}
