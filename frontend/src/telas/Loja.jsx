import { useState } from 'react'
import { Circle, Marker } from 'react-leaflet'
import { api } from '../api'
import { AoClicar, Mapa, Recentralizar } from '../mapa'

const BRASIL = [-14.2, -51.9]

export default function Loja({ estado, aoMudar, irPara }) {
  const salva = estado.loja
  const [nome, setNome] = useState(salva?.nome ?? '')
  const [pos, setPos] = useState(salva ? [salva.lat, salva.lon] : null)
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [aviso, setAviso] = useState(null)

  function usarLocalizacao() {
    navigator.geolocation?.getCurrentPosition(
      (p) => setPos([p.coords.latitude, p.coords.longitude]),
      () => setErro('Não foi possível obter a sua localização.'),
    )
  }

  async function salvar(e) {
    e.preventDefault()
    setErro(null)
    setAviso(null)
    setSalvando(true)
    try {
      const r = await api.salvarLoja({ nome: nome.trim(), lat: pos[0], lon: pos[1] })
      if (r.entregas_removidas.length > 0) {
        setAviso(`${r.entregas_removidas.length} entrega(s) ficaram fora da nova área e foram removidas.`)
      }
      await aoMudar()
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="cartao">
      <h2>Cadastrar loja</h2>
      <p className="suave">Clique no mapa para marcar a posição da loja. Você pode arrastar o pin.</p>
      <form onSubmit={salvar}>
        <label htmlFor="nome">Nome da loja</label>
        <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Pizzaria Central" />
        <button type="button" className="link" style={{ color: 'var(--azul)' }} onClick={usarLocalizacao}>
          Usar minha localização
        </button>
        <Mapa centro={pos ?? BRASIL} zoom={pos ? 13 : 4}>
          <AoClicar onClick={setPos} />
          <Recentralizar centro={pos} zoom={13} />
          {pos && (
            <Marker
              position={pos}
              draggable
              eventHandlers={{ dragend: (e) => setPos([e.target.getLatLng().lat, e.target.getLatLng().lng]) }}
            />
          )}
          {salva && <Circle center={[salva.lat, salva.lon]} radius={estado.raio_m} pathOptions={{ color: '#2563eb', fillOpacity: 0.05 }} />}
        </Mapa>
        {erro && <div className="erro">{erro}</div>}
        {aviso && <div className="aviso">{aviso}</div>}
        {salva && estado.mapa.estado === 'carregando' && (
          <p className="suave">
            <span className="spinner" />
            Baixando o mapa da região em segundo plano...
          </p>
        )}
        {salva && estado.mapa.estado === 'pronto' && <p className="suave">Mapa carregado. Área de cobertura: {estado.raio_m / 1000} km.</p>}
        {salva && estado.mapa.estado === 'erro' && <div className="erro">{estado.mapa.mensagem}</div>}
        <button className="primario" disabled={!nome.trim() || !pos || salvando}>
          {salvando ? 'Salvando...' : 'Salvar loja'}
        </button>{' '}
        {salva && (
          <button type="button" className="primario" onClick={() => irPara('veiculos')}>
            Próximo: veículos
          </button>
        )}
      </form>
    </div>
  )
}
