"""Estado em memória (um usuário só)."""
import threading

_trava = threading.Lock()
loja = None          # {"nome", "lat", "lon"}
veiculos = None      # {"quantidade", "autonomia_cheio_km", "autonomia_atual_km"}
entregas = []        # [{"id", "lat", "lon", "horario_saida"}]
_proximo_id = 1


def nova_entrega(lat, lon, horario_saida):
    global _proximo_id
    with _trava:
        e = {"id": _proximo_id, "lat": lat, "lon": lon, "horario_saida": horario_saida}
        _proximo_id += 1
        entregas.append(e)
        return e


def remover_entrega(entrega_id):
    with _trava:
        antes = len(entregas)
        entregas[:] = [e for e in entregas if e["id"] != entrega_id]
        return len(entregas) < antes


def resetar():
    global loja, veiculos, _proximo_id
    with _trava:
        loja, veiculos, _proximo_id = None, None, 1
        entregas.clear()
