import { useState } from 'react'
import { Circle, Marker } from 'react-leaflet'
import { ArrowRight, LocateFixed, Save } from 'lucide-react'
import { api } from '../api'
import { AoClicar, COR_ACENTO, Mapa, Recentralizar } from '../mapa'
import { Aviso, Cabecalho, Spinner } from '../ui'

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
    <>
      <Cabecalho passo="01 / Loja" titulo="Onde fica a loja?" texto="Clique no mapa para posicionar o ponto de saída. Você pode arrastar o pin para ajustar." />
      <div className="split rise">
        <form className="panel panel-pad form col" onSubmit={salvar}>
          <div className="field">
            <label htmlFor="nome">Nome da loja</label>
            <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Pizzaria Central" autoComplete="off" />
          </div>
          <div>
            <div className="lbl">Posição</div>
            <div className="mono" style={{ fontSize: '.85rem', marginBottom: 8 }}>
              {pos ? `${pos[0].toFixed(5)}, ${pos[1].toFixed(5)}` : <span className="muted">nenhum ponto marcado</span>}
            </div>
            <button type="button" className="btn sm" onClick={usarLocalizacao}>
              <LocateFixed size={14} /> Usar minha localização
            </button>
          </div>
          {erro && <Aviso tipo="err">{erro}</Aviso>}
          {aviso && <Aviso tipo="warn">{aviso}</Aviso>}
          {salva && estado.mapa.estado === 'carregando' && (
            <Aviso tipo="info">
              <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                <Spinner /> Baixando o mapa da região em segundo plano…
              </span>
            </Aviso>
          )}
          {salva && estado.mapa.estado === 'pronto' && (
            <p className="muted" style={{ fontSize: '.85rem' }}>
              Mapa carregado · cobertura de <span className="mono">{estado.raio_m / 1000} km</span>.
            </p>
          )}
          {salva && estado.mapa.estado === 'erro' && <Aviso tipo="err">{estado.mapa.mensagem}</Aviso>}
          <div className="actions">
            <button className="btn primary" disabled={!nome.trim() || !pos || salvando}>
              <Save size={16} />
              {salvando ? 'Salvando…' : 'Salvar loja'}
            </button>
            {salva && (
              <button type="button" className="btn" onClick={() => irPara('veiculos')}>
                Ir para veículos <ArrowRight size={16} className="go" />
              </button>
            )}
          </div>
        </form>

        <div className="sticky">
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
            {salva && <Circle center={[salva.lat, salva.lon]} radius={estado.raio_m} pathOptions={{ color: COR_ACENTO, weight: 1.5, dashArray: '6 6', fillOpacity: 0.06 }} />}
          </Mapa>
        </div>
      </div>
    </>
  )
}
