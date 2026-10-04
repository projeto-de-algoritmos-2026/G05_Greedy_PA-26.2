import heapq


def alocar_motos(entregas):
    """Aloca o menor número de motos para cobrir um conjunto de entregas.

    entregas: lista de (saida, volta).

    Guloso (Interval Partitioning): ordena as entregas por horário de
    saída e usa um min-heap de (livre_em, id_moto). Se a moto do topo já
    voltou (livre_em <= saida), reaproveita essa moto; senão, usa uma
    moto nova.

    Retorna (numero_de_motos, moto_de_cada_entrega), onde
    moto_de_cada_entrega[i] é o id da moto que atende entregas[i].
    """
    ordem = sorted(range(len(entregas)), key=lambda i: entregas[i][0])

    moto_de_cada_entrega = [None] * len(entregas)
    heap = []
    proxima_moto = 0

    for i in ordem:
        saida, volta = entregas[i]

        if heap and heap[0][0] <= saida:
            _, moto = heapq.heappop(heap)
        else:
            moto = proxima_moto
            proxima_moto += 1

        moto_de_cada_entrega[i] = moto
        heapq.heappush(heap, (volta, moto))

    return proxima_moto, moto_de_cada_entrega
