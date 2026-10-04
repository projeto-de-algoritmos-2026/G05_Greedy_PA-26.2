"""Configuração do backend. Distâncias em metros, tempos em minutos."""

RAIO_M = 5000                  # raio de cobertura ao redor da loja
VELOCIDADE_KMH = 30            # velocidade média dos veículos
TEMPO_NO_CLIENTE_MIN = 5       # tempo parado na casa do cliente
RAIO_POSTO_M = 200             # distância máxima do posto até a rota

# Servidores do Overpass, tentados em ordem (o público costuma ficar sobrecarregado)
OVERPASS_URLS = ["https://overpass-api.de/api", "https://overpass.private.coffee/api",
                 "https://overpass.kumi.systems/api"]
OVERPASS_TIMEOUT_S = 120       # por tentativa

ORIGENS_PERMITIDAS = ["http://localhost:5173", "http://127.0.0.1:5173"]
