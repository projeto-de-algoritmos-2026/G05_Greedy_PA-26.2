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


def postos_ida_e_volta(postos, total):
    """Espelha os postos da ida para montar a rota de ida e volta.

    postos: lista ordenada de (posicao_em_metros, nome) na ida, com
    posicao entre 0 e total.
    total: comprimento da rota de ida em metros.

    Cada posto da ida aparece também na volta, na posicao 2*total - p.
    Retorna (postos_completos, total_ida_e_volta), com postos_completos
    ordenada pela posicao e total_ida_e_volta = 2*total.
    """
    postos_volta = [(2 * total - posicao, nome) for posicao, nome in postos]
    completos = sorted(list(postos) + postos_volta, key=lambda p: p[0])
    return completos, 2 * total
