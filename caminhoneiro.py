def recomendar_paradas(postos, total, alcance_atual, alcance_cheio):
    """Escolhe os postos onde abastecer ao longo de uma rota.

    postos: lista ordenada de (posicao_em_metros, nome), com 0 < posicao < total.
    total: comprimento da rota em metros.
    alcance_atual: quantos metros o tanque atual ainda percorre.
    alcance_cheio: alcance do tanque depois de abastecer.

    Guloso: a cada passo, para no posto mais longe que ainda está dentro
    do alcance atual (maximiza a distância percorrida por parada).

    Retorna a lista de paradas escolhidas, [] se não precisar abastecer,
    ou None se for impossível chegar ao fim da rota.
    """
    paradas = []
    posicao = 0
    alcance = alcance_atual
    restantes = list(postos)

    while posicao + alcance < total:
        limite = posicao + alcance
        candidatos = [p for p in restantes if posicao < p[0] <= limite]
        if not candidatos:
            return None

        escolhido = max(candidatos, key=lambda p: p[0])
        paradas.append(escolhido)
        posicao = escolhido[0]
        alcance = alcance_cheio
        restantes = [p for p in restantes if p[0] > posicao]

    return paradas
