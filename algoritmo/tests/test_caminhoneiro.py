import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from caminhoneiro import postos_ida_e_volta, recomendar_paradas

POSTOS = [(3000, "Posto A"), (9000, "Posto B")]
TOTAL = 12000


def test_para_no_posto_mais_longe_dentro_do_alcance():
    resultado = recomendar_paradas(POSTOS, TOTAL, alcance_atual=8000, alcance_cheio=10000)
    assert resultado == [(3000, "Posto A")]


def test_nao_precisa_abastecer():
    resultado = recomendar_paradas(POSTOS, TOTAL, alcance_atual=13000, alcance_cheio=10000)
    assert resultado == []


def test_impossivel_chegar():
    resultado = recomendar_paradas(POSTOS, TOTAL, alcance_atual=2000, alcance_cheio=10000)
    assert resultado is None


def test_precisa_de_duas_paradas():
    resultado = recomendar_paradas(POSTOS, TOTAL, alcance_atual=5000, alcance_cheio=6000)
    assert resultado == [(3000, "Posto A"), (9000, "Posto B")]


def test_postos_ida_e_volta_espelha_e_dobra_total():
    completos, total = postos_ida_e_volta(POSTOS, TOTAL)
    assert total == 24000
    assert completos == [
        (3000, "Posto A"),
        (9000, "Posto B"),
        (15000, "Posto B"),
        (21000, "Posto A"),
    ]
