"""Ponto único de import dos módulos de algoritmos (pasta `algoritmo/`).

Os módulos usam imports simples (`from dijkstra import ...`), então a pasta
entra no sys.path em vez de ser alterada.
"""
import os
import sys
from types import SimpleNamespace

_PASTA = os.path.join(os.path.dirname(__file__), "..", "algoritmo")
if _PASTA not in sys.path:
    sys.path.insert(0, os.path.abspath(_PASTA))


def reais():
    from caminhoneiro import postos_ida_e_volta, recomendar_paradas
    from despacho_motos import alocar_motos
    from dijkstra import dijkstra, distancias_acumuladas
    from load_map import (carregar_dados, converter_grafo, esquina_mais_proxima,
                          extrair_postos, haversine, postos_na_rota)

    return SimpleNamespace(
        postos_ida_e_volta=postos_ida_e_volta, recomendar_paradas=recomendar_paradas,
        alocar_motos=alocar_motos, dijkstra=dijkstra,
        distancias_acumuladas=distancias_acumuladas, carregar_dados=carregar_dados,
        converter_grafo=converter_grafo, esquina_mais_proxima=esquina_mais_proxima,
        extrair_postos=extrair_postos, haversine=haversine, postos_na_rota=postos_na_rota,
    )
