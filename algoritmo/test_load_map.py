from load_map import haversine, esquina_mais_proxima, postos_na_rota


def test_haversine():
    assert haversine((0, 0), (0, 0)) == 0
    # 1 grau de latitude ~ 111,19 km
    assert abs(haversine((0, 0), (1, 0)) - 111195) < 100


def test_esquina_mais_proxima():
    coords = {"A": (0.0, 0.0), "B": (0.0, 0.01), "C": (0.0, 0.02)}
    assert esquina_mais_proxima(coords, (0.0, 0.012)) == "B"


def test_postos_na_rota():
    # esquinas a ~1,1 km uma da outra (0.01 grau de longitude no equador)
    coords = {"A": (0.0, 0.0), "B": (0.0, 0.01), "C": (0.0, 0.02), "Z": (0.5, 0.5)}
    adj = {"A": [("B", 1000)], "B": [("C", 2000)], "C": [], "Z": []}
    postos = [
        ("Perto de C", (0.0, 0.0201)),
        ("Perto de B", (0.0, 0.0099)),
        ("Longe", (0.5, 0.5)),
    ]
    assert postos_na_rota(postos, ["A", "B", "C"], coords, adj) == [
        (1000, "Perto de B"),
        (3000, "Perto de C"),
    ]
