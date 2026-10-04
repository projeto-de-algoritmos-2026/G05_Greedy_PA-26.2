import { Calculator, Clock, Fuel, RotateCw } from 'lucide-react'
import { Marker, Polyline, Tooltip } from 'react-leaflet'
import { Ajustar, COR_LOJA, CORES, Mapa, pinColorido, pinParada } from '../mapa'
import { Aviso, Cabecalho, Spinner } from '../ui'

export default function Resultado({ estado, resultado, calculando, erro, calcular }) {
  const { loja, veiculos, entregas } = estado
  const pode = loja && veiculos && entregas.length > 0

  if (calculando) {
    return (
      <>
        <Cabecalho passo="04 / Resultado" titulo="Calculando o despacho" />
        <div className="center">
          <div className="panel panel-pad">
            <Spinner />
            <p className="muted">Se o mapa ainda estiver baixando, isso pode levar um pouco mais.</p>
          </div>
        </div>
      </>
    )
  }
  if (erro) {
    return (
      <>
        <Cabecalho passo="04 / Resultado" titulo="O cálculo falhou" />
        <div style={{ maxWidth: 560, display: 'grid', gap: 16 }}>
          <Aviso tipo="err">{erro}</Aviso>
          <button className="btn primary" style={{ width: 'fit-content' }} onClick={calcular}>
            <RotateCw size={16} /> Tentar calcular de novo
          </button>
        </div>
      </>
    )
  }
  if (!resultado) {
    return (
      <>
        <Cabecalho passo="04 / Resultado" titulo="Ainda não há resultado" texto={pode ? 'Os dados estão completos. Calcule para ver rotas e paradas.' : 'Cadastre loja, veículos e entregas para calcular.'} />
        <button className="btn primary" disabled={!pode} onClick={calcular}>
          <Calculator size={16} /> Calcular despacho
        </button>
      </>
    )
  }

  const numero = (id) => entregas.findIndex((e) => e.id === id) + 1
  const cor = (veiculo) => CORES[((veiculo ?? 1) - 1) % CORES.length]
  const porVeiculo = {}
  for (const e of resultado.entregas) (porVeiculo[e.veiculo ?? 0] ??= []).push(e)
  const pontos = [[loja.lat, loja.lon], ...resultado.entregas.flatMap((e) => e.rota)]
  const totalKm = resultado.entregas.reduce((t, e) => t + (e.distancia_km ?? 0), 0)

  return (
    <>
      <Cabecalho passo="04 / Resultado" titulo="Despacho calculado" texto="Cada veículo com suas entregas, horários e pontos de abastecimento.">
        <button className="btn" onClick={calcular}>
          <RotateCw size={16} /> Recalcular despacho
        </button>
      </Cabecalho>

      <dl className="stats rise">
        <div className="stat">
          <dt>Necessários</dt>
          <dd>{resultado.veiculos_necessarios}</dd>
        </div>
        <div className="stat">
          <dt>Disponíveis</dt>
          <dd>{resultado.veiculos_disponiveis}</dd>
        </div>
        <div className="stat">
          <dt>Entregas</dt>
          <dd>{resultado.entregas.length}</dd>
        </div>
        <div className="stat">
          <dt>Distância (ida)</dt>
          <dd>
            {totalKm.toFixed(1)}
            <small>km</small>
          </dd>
        </div>
      </dl>

      {resultado.faltam_veiculos && (
        <div style={{ marginBottom: 16 }}>
          <Aviso tipo="warn">
            Faltam veículos: são necessários {resultado.veiculos_necessarios}, mas só há {resultado.veiculos_disponiveis} disponíveis.
          </Aviso>
        </div>
      )}

      <div className="split rise">
        <div className="col">
          {Object.entries(porVeiculo).map(([v, lista]) => (
            <section className="panel" key={v}>
              <div className="grupo-head">
                <span className="swatch" style={{ background: Number(v) ? cor(Number(v)) : 'var(--muted)' }} />
                <h3>{Number(v) ? `Veículo ${v}` : 'Sem veículo'}</h3>
                <span className="mono">{lista.length} {lista.length === 1 ? 'entrega' : 'entregas'}</span>
              </div>
              {lista.map((e) => (
                <article className="ent" key={e.id}>
                  <div className="ent-top">
                    <span className="tag" style={{ background: cor(e.veiculo), display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: '50%', color: '#0a100e', fontFamily: 'var(--f-mono)', fontSize: '.7rem', fontWeight: 600 }}>
                      {numero(e.id)}
                    </span>
                    <b>Entrega {numero(e.id)}</b>
                    {!e.sem_rota && (
                      <span className="ent-time">
                        <Clock size={13} aria-hidden /> {e.saida} → {e.volta}
                      </span>
                    )}
                  </div>
                  {e.sem_rota ? (
                    <div className="ent-callout">
                      <Aviso tipo="err">Sem rota: não há caminho de carro da loja até este cliente.</Aviso>
                    </div>
                  ) : (
                    <>
                      <div className="ent-meta">
                        {e.distancia_km.toFixed(2)} km só de ida{e.volta_dia_seguinte ? ' · volta no dia seguinte' : ''}
                      </div>
                      {e.autonomia_insuficiente ? (
                        <Aviso tipo="err">Não é possível completar com essa autonomia.</Aviso>
                      ) : e.paradas.length === 0 ? (
                        <div className="ent-meta">Sem necessidade de abastecer.</div>
                      ) : (
                        <div className="paradas">
                          {e.paradas.map((p, i) => (
                            <div className="parada" key={i}>
                              <Fuel size={14} aria-hidden />
                              <span>Abastecer em {p.nome}</span>
                              <span>km {p.posicao_km.toFixed(1)} · {p.sentido}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </article>
              ))}
            </section>
          ))}
        </div>

        <div className="sticky">
          <Mapa centro={[loja.lat, loja.lon]} zoom={13}>
            <Ajustar pontos={pontos} />
            <Marker position={[loja.lat, loja.lon]} icon={pinColorido(COR_LOJA, 'L')}>
              <Tooltip>{loja.nome}</Tooltip>
            </Marker>
            {resultado.entregas.map((e) => (
              <span key={e.id}>
                {e.rota.length > 0 && <Polyline positions={e.rota} pathOptions={{ color: cor(e.veiculo), weight: 5, opacity: 0.85 }} />}
                {e.rota.length > 0 && (
                  <Marker position={e.rota[e.rota.length - 1]} icon={pinColorido(cor(e.veiculo), numero(e.id))}>
                    <Tooltip>Entrega {numero(e.id)}</Tooltip>
                  </Marker>
                )}
                {e.paradas.map((p, i) => (
                  <Marker key={i} position={[p.lat, p.lon]} icon={pinParada()}>
                    <Tooltip>
                      {p.nome} (entrega {numero(e.id)}, {p.sentido})
                    </Tooltip>
                  </Marker>
                ))}
              </span>
            ))}
          </Mapa>
        </div>
      </div>
    </>
  )
}
