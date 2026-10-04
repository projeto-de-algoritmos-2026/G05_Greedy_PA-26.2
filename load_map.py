import osmnx as ox
ox.settings.log_console = True
ox.settings.use_cache = True

CENTRO = (-15.7939, -47.8828) 
RAIO = 5000                     
G = ox.graph_from_point(CENTRO, dist=RAIO, network_type="drive")
postos_gdf = ox.features_from_point(CENTRO, tags={"amenity": "fuel"}, dist=RAIO)

print(len(G.nodes), "esquinas,", len(G.edges), "ruas")
print(list(G.nodes(data=True))[0])
print(list(G.edges(data=True))[0])
print(len(postos_gdf), "postos")
print(postos_gdf[["name", "geometry"]].head())

def converter_grafo(G):
    adj = {}
    coords = {}
    for no,dados in G.nodes(data=True):
        adj[no] = []
        coords[no] = (dados["y"], dados["x"])

    for u,v,dados in G.edges(data=True):
        adj[u].append((v,dados["lenght"]))

    return adj,coords

