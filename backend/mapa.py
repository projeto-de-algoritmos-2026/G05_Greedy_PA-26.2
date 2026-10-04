"""Download do mapa em segundo plano, guardado em memória por posição da loja."""
import threading

from . import config


class GerenciadorMapa:
    def __init__(self, carregador=None):
        self._carregador = carregador or _carregar_real
        self._trava = threading.Lock()
        self._geracao = 0
        self._estado = {"estado": "nenhum", "mensagem": None}
        self._chave = None
        self._grafo = None

    def iniciar(self, lat, lon):
        """Começa a baixar o mapa da loja. Descarta o mapa anterior."""
        with self._trava:
            self._geracao += 1
            geracao = self._geracao
            self._chave = (lat, lon)
            self._grafo = None
            self._estado = {"estado": "carregando", "mensagem": None}
        threading.Thread(target=self._trabalhar, args=(geracao, lat, lon), daemon=True).start()

    def _trabalhar(self, geracao, lat, lon):
        try:
            grafo = self._carregador((lat, lon), config.RAIO_M)
            novo = ({"estado": "pronto", "mensagem": None}, grafo)
        except Exception as erro:  # rede, timeout do Overpass etc.
            msg = f"Não foi possível baixar o mapa: {erro}"
            novo = ({"estado": "erro", "mensagem": msg}, None)
        with self._trava:
            if geracao == self._geracao:      # a loja pode ter mudado no meio do download
                self._estado, self._grafo = novo

    def limpar(self):
        with self._trava:
            self._geracao += 1
            self._chave, self._grafo = None, None
            self._estado = {"estado": "nenhum", "mensagem": None}

    def status(self):
        with self._trava:
            return dict(self._estado)

    def grafo(self):
        with self._trava:
            return self._grafo


def _carregar_real(centro, raio):
    """Tenta cada servidor do Overpass até um responder."""
    import osmnx as ox
    ox.settings.requests_timeout = config.OVERPASS_TIMEOUT_S
    ultimo_erro = None
    for url in config.OVERPASS_URLS:
        ox.settings.overpass_url = url
        try:
            return _baixar(centro, raio)
        except Exception as erro:
            ultimo_erro = erro
    raise ultimo_erro


def _baixar(centro, raio):
    from . import algoritmos
    alg = algoritmos.reais()
    try:
        G, postos_gdf = alg.carregar_dados(centro, raio)
    except Exception as erro:
        if type(erro).__name__ != "InsufficientResponseError":
            raise
        # sem nenhum posto no raio: carregar_dados falha na 2ª consulta.
        # O grafo já está em cache do osmnx, então baixa-lo de novo é rápido.
        import osmnx as ox
        G = ox.graph_from_point(centro, dist=raio, network_type="drive")
        postos_gdf = None
    adj, coords = alg.converter_grafo(G)
    postos = alg.extrair_postos(postos_gdf) if postos_gdf is not None else []
    return {"adj": adj, "coords": coords, "postos": postos}
