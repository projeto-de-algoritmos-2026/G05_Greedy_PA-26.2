import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from despacho_motos import alocar_motos


def test_criterio_de_pronto_tres_motos_sem_sobreposicao():
    entregas = [
        (9, 12),  # a
        (9, 10),  # b
        (10, 11),  # c
        (10, 13),  # d
        (11, 14),  # e
        (12, 15),  # f
    ]

    numero_de_motos, moto_de_cada_entrega = alocar_motos(entregas)

    assert numero_de_motos == 3

    agenda_por_moto = {}
    for (saida, volta), moto in zip(entregas, moto_de_cada_entrega):
        agenda_por_moto.setdefault(moto, []).append((saida, volta))

    for intervalos in agenda_por_moto.values():
        intervalos.sort()
        for (_, volta_anterior), (proxima_saida, _) in zip(intervalos, intervalos[1:]):
            assert volta_anterior <= proxima_saida


def test_entregas_sem_sobreposicao_usam_uma_moto():
    entregas = [(0, 1), (1, 2), (2, 3)]
    numero_de_motos, moto_de_cada_entrega = alocar_motos(entregas)
    assert numero_de_motos == 1
    assert moto_de_cada_entrega == [0, 0, 0]


def test_entregas_todas_simultaneas_usam_uma_moto_cada():
    entregas = [(0, 5), (0, 5), (0, 5)]
    numero_de_motos, moto_de_cada_entrega = alocar_motos(entregas)
    assert numero_de_motos == 3
    assert sorted(moto_de_cada_entrega) == [0, 1, 2]
