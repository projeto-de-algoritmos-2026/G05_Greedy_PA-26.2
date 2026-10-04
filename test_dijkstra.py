import math
from dijkstra import dijkstra, distancias_acumuladas


def grafo_teste():
    adj = {n: [] for n in "RABCKX"}
    for u, v, m in [("R", "A", 3000), ("A", "B", 2000), ("B", "C", 4000), ("C", "K", 3000),
                    ("R", "X", 10000), ("X", "K", 10000)]:
        adj[u].append((v, m))
        adj[v].append((u, m))
    return adj


def test_menor_caminho():
    assert dijkstra(grafo_teste(), "R", "K") == (["R", "A", "B", "C", "K"], 12000)


def test_origem_igual_destino():
    assert dijkstra(grafo_teste(), "R", "R") == (["R"], 0)


def test_sem_caminho():
    adj = {"R": [("A", 1)], "A": [], "Z": []}
    assert dijkstra(adj, "R", "Z") == (None, math.inf)


def test_mao_unica():
    adj = {"X": [("Y", 7)], "Y": []}
    assert dijkstra(adj, "X", "Y") == (["X", "Y"], 7)
    assert dijkstra(adj, "Y", "X") == (None, math.inf)


def test_entrada_velha_do_heap():
    adj = {"R": [("A", 1), ("B", 5)], "A": [("B", 1)], "B": []}
    assert dijkstra(adj, "R", "B") == (["R", "A", "B"], 2)


def test_distancias_acumuladas():
    adj = grafo_teste()
    caminho, _ = dijkstra(adj, "R", "K")
    assert distancias_acumuladas(adj, caminho) == [0, 3000, 5000, 9000, 12000]