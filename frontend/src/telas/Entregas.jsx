import { useState } from 'react'
import { Circle, Marker, Tooltip } from 'react-leaflet'
import { api } from '../api'
import { AoClicar, CORES, Mapa, pinColorido } from '../mapa'

export default function Entregas({ estado, aoMudar }) {
  const { loja, entregas } = estado
  const [pos, setPos] = useState(null)
  const [horario, setHorario] = useState('09:00')
  const [erro, setErro] = useState(null)

  if (!loja) {
    return (
      <div className="cartao">
        <h2>Cadastrar entregas</h2>
        <p className="suave">Cadastre a loja primeiro: as entregas são marcadas no mapa ao redor dela.</p>
      </div>
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
    <div className="cartao">
      <h2>Cadastrar entregas</h2>
      <p className="suave">Clique no mapa, dentro do círculo, para marcar o cliente. Depois informe o horário de saída.</p>
      <Mapa centro={[loja.lat, loja.lon]} zoom={13}>
        <AoClicar onClick={setPos} />
        <Circle center={[loja.lat, loja.lon]} radius={estado.raio_m} pathOptions={{ color: '#2563eb', fillOpacity: 0.05 }} />
        <Marker position={[loja.lat, loja.lon]} icon={pinColorido('#111827', 'L')}>
          <Tooltip>{loja.nome}</Tooltip>
        </Marker>
        {entregas.map((e, i) => (
          <Marker key={e.id} position={[e.lat, e.lon]} icon={pinColorido(CORES[i % CORES.length], i + 1)} />
        ))}
        {pos && <Marker position={pos} />}
      </Mapa>
      <form onSubmit={adicionar}>
        <label htmlFor="hora">Horário de saída (HH:MM)</label>
        <input id="hora" type="time" value={horario} onChange={(e) => setHorario(e.target.value)} required />
        {erro && <div className="erro">{erro}</div>}
        <button className="primario" disabled={!pos || !horario}>
          Adicionar entrega
        </button>
        {!pos && <span className="suave"> Marque o cliente no mapa.</span>}
      </form>

      <h2 style={{ marginTop: 20 }}>Entregas ({entregas.length})</h2>
      {entregas.length === 0 ? (
        <p className="suave">Nenhuma entrega adicionada ainda.</p>
      ) : (
        <ul className="lista">
          {entregas.map((e, i) => (
            <li key={e.id}>
              <span>
                <b>Entrega {i + 1}</b> · saída {e.horario_saida}{' '}
                <span className="suave">
                  ({e.lat.toFixed(4)}, {e.lon.toFixed(4)})
                </span>
              </span>
              <button className="link" onClick={() => remover(e.id)}>
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
