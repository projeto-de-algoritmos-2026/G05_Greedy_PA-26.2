import heapq
import math

def dijkstra(adj, origem, destino):
    dist = {origem: 0}          
    pai = {origem: None}        
    heap = [(0, origem)]       
    fechado = set()             

    while heap:
        d, u = heapq.heappop(heap)
        if u in fechado:                 
            continue
        fechado.add(u)
        if u == destino:
            break
        for v, w in adj[u]:
            nd = d + w                    
            if nd < dist.get(v, math.inf):  
                dist[v] = nd
                pai[v] = u
                heapq.heappush(heap, (nd, v))

    if destino not in dist:
        return None, math.inf

    caminho = []
    n = destino
    while n is not None:
        caminho.append(n)                  
        n = pai[n]                          
    return caminho[::-1], dist[destino]


def distancias_acumuladas(adj, caminho):
    acum = [0]
    for u, v in zip(caminho, caminho[1:]):
        acum.append(acum[-1] + min(w for x, w in adj[u] if x == v))
    return acum

if __name__ == "__main__":
    adj_t = {n: [] for n in "RABCKX"}
    for u, v, m in [("R", "A", 3000), ("A", "B", 2000), ("B", "C", 4000), ("C", "K", 3000),
                    ("R", "X", 10000), ("X", "K", 10000)]:
        adj_t[u].append((v, m))
        adj_t[v].append((u, m))
    print(dijkstra(adj_t, "R", "K"))