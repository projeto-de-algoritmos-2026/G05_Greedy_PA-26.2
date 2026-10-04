import { useState } from 'react'
import { Circle, Marker, Tooltip } from 'react-leaflet'
import { MapPin, PackagePlus, Trash2 } from 'lucide-react'
import { api } from '../api'
import { AoClicar, COR_ACENTO, COR_LOJA, CORES, Mapa, pinColorido } from '../mapa'
import { Aviso, Cabecalho } from '../ui'

export default function Entregas({ estado, aoMudar }) {
  const { loja, entregas } = estado
  const [pos, setPos] = useState(null)
  const [horario, setHorario] = useState('09:00')
  const [erro, setErro] = useState(null)

  if (!loja) {
    return (
      <>
        <Cabecalho passo="03 / Entregas" titulo="Cadastre a loja primeiro" texto="As entregas são marcadas no mapa ao redor da loja." />
        <Aviso tipo="info">Nenhuma loja cadastrada ainda.</Aviso>
      </>
    )
  }

  async function adicionar(e) {
    e.preventDefault()
    setErro(null)
    try {
      await api.adicionarEntrega({ lat: pos[0], lon: pos[1], horario_saida: horario })
      setPos(null)
      await aoMudar()
    } catch (e) {
      setErro(e.message)
    }
  }

  async function remover(id) {
    await api.removerEntrega(id)
    await aoMudar()
  }

  return (
    <>
      <Cabecalho passo="03 / Entregas" titulo="Quem vai receber?" texto="Clique no mapa, dentro do círculo tracejado, para marcar o cliente. Depois informe o horário de saída." />
      <div className="split rise">
        <div className="col">
          <form className="panel panel-pad form" onSubmit={adicionar}>
            <div className="field">
              <label htmlFor="hora">Horário de saída</label>
              <input id="hora" type="time" value={horario} onChange={(e) => setHorario(e.target.value)} required />
            </div>
            <div className="mono" style={{ fontSize: '.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={15} aria-hidden style={{ color: pos ? 'var(--accent)' : 'var(--muted)' }} />
              {pos ? `${pos[0].toFixed(5)}, ${pos[1].toFixed(5)}` : <span className="muted">marque o cliente no mapa</span>}
            </div>
            {erro && <Aviso tipo="err">{erro}</Aviso>}
            <button className="btn primary" disabled={!pos || !horario}>
              <PackagePlus size={16} /> Adicionar entrega
            </button>
          </form>

          <section className="panel" aria-label="Entregas cadastradas">
            <div className="panel-title">
              <span>Entregas</span>
              <span>{String(entregas.length).padStart(2, '0')}</span>
            </div>
            {entregas.length === 0 ? (
              <div className="empty">
                <MapPin size={22} aria-hidden />
                Nenhuma entrega adicionada ainda.
              </div>
            ) : (
              <ul className="list rise-rows">
                {entregas.map((e, i) => (
                  <li key={e.id} style={{ '--i': i }}>
                    <div className="li-main">
                      <span className="tag" style={{ background: CORES[i % CORES.length] }}>{i + 1}</span>
                      <div className="li-text">
                        <b>Entrega {i + 1} · saída {e.horario_saida}</b>
                        <span>{e.lat.toFixed(4)}, {e.lon.toFixed(4)}</span>
                      </div>
                    </div>
                    <button className="icon-btn" onClick={() => remover(e.id)} aria-label={`Remover entrega ${i + 1}`} title="Remover entrega">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="sticky">
          <Mapa centro={[loja.lat, loja.lon]} zoom={13}>
            <AoClicar onClick={setPos} />
            <Circle center={[loja.lat, loja.lon]} radius={estado.raio_m} pathOptions={{ color: COR_ACENTO, weight: 1.5, dashArray: '6 6', fillOpacity: 0.06 }} />
            <Marker position={[loja.lat, loja.lon]} icon={pinColorido(COR_LOJA, 'L')}>
              <Tooltip>{loja.nome}</Tooltip>
            </Marker>
            {entregas.map((e, i) => (
              <Marker key={e.id} position={[e.lat, e.lon]} icon={pinColorido(CORES[i % CORES.length], i + 1)} />
            ))}
            {pos && <Marker position={pos} />}
          </Mapa>
        </div>
      </div>
    </>
  )
}
