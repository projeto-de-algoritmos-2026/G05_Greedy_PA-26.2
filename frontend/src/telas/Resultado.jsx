import { Marker, Polyline, Tooltip } from 'react-leaflet'
import { Ajustar, CORES, Mapa, pinColorido } from '../mapa'

export default function Resultado({ estado, resultado, calculando, erro, calcular }) {
  const { loja, veiculos, entregas } = estado
  const pode = loja && veiculos && entregas.length > 0

  if (calculando) {
    return (
      <div className="cartao">
        <span className="spinner" />
        Calculando o despacho... Se o mapa ainda estiver baixando, isso pode levar um pouco mais.
      </div>
    )
  }
  if (erro) {
    return (
      <div className="cartao">
        <div className="erro">{erro}</div>
        <button className="primario" onClick={calcular}>
          Tentar de novo
        </button>
      </div>
    )
  }
  if (!resultado) {
    return (
      <div className="cartao">
        <h2>Resultado</h2>
        <p className="suave">Ainda não há resultado. {pode ? 'Clique para calcular.' : 'Cadastre loja, veículos e entregas.'}</p>
        <button className="primario" disabled={!pode} onClick={calcular}>
          Calcular despacho
        </button>
      </div>
    )
  }

  const numero = (id) => entregas.findIndex((e) => e.id === id) + 1
  const cor = (veiculo) => CORES[((veiculo ?? 1) - 1) % CORES.length]
  const porVeiculo = {}
  for (const e of resultado.entregas) {
    if (e.veiculo) (porVeiculo[e.veiculo] ??= []).push(e)
  }
  const pontos = [[loja.lat, loja.lon], ...resultado.entregas.flatMap((e) => e.rota)]

  return (
    <>
      <div className="cartao">
        <h2>Resultado do despacho</h2>
        <p>
          Veículos necessários: <b>{resultado.veiculos_necessarios}</b> · disponíveis: <b>{resultado.veiculos_disponiveis}</b>
        </p>
        {resultado.faltam_veiculos && (
          <div className="aviso">
            Faltam veículos: são necessários {resultado.veiculos_necessarios}, mas só há {resultado.veiculos_disponiveis} disponíveis.
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th>Veículo</th>
              <th>Entregas (saída → volta)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(porVeiculo).map(([v, lista]) => (
              <tr key={v}>
                <td style={{ color: cor(Number(v)), fontWeight: 700 }}>Veículo {v}</td>
                <td>
                  {lista.map((e) => (
                    <div key={e.id}>
                      Entrega {numero(e.id)}: {e.saida} → {e.volta}
                      {e.volta_dia_seguinte ? ' (dia seguinte)' : ''}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cartao">
        <Mapa centro={[loja.lat, loja.lon]} zoom={13} altura={480}>
          <Ajustar pontos={pontos} />
          <Marker position={[loja.lat, loja.lon]} icon={pinColorido('#111827', 'L')}>
            <Tooltip>{loja.nome}</Tooltip>
          </Marker>
          {resultado.entregas.map((e) => (
            <span key={e.id}>
              {e.rota.length > 0 && <Polyline positions={e.rota} pathOptions={{ color: cor(e.veiculo), weight: 5, opacity: 0.8 }} />}
              {e.rota.length > 0 && (
                <Marker position={e.rota[e.rota.length - 1]} icon={pinColorido(cor(e.veiculo), numero(e.id))}>
                  <Tooltip>Entrega {numero(e.id)}</Tooltip>
                </Marker>
              )}
              {e.paradas.map((p, i) => (
                <Marker key={i} position={[p.lat, p.lon]} icon={pinColorido('#f59e0b', '⛽')}>
                  <Tooltip>
                    {p.nome} (entrega {numero(e.id)}, {p.sentido})
                  </Tooltip>
                </Marker>
              ))}
            </span>
          ))}
        </Mapa>
      </div>

      <div className="grade">
        {resultado.entregas.map((e) => (
          <div className="cartao" key={e.id}>
            <h2 style={{ color: cor(e.veiculo) }}>Entrega {numero(e.id)}</h2>
            {e.sem_rota ? (
              <div className="erro">Sem rota: não há caminho de carro da loja até este cliente.</div>
            ) : (
              <>
                <p>
                  Veículo {e.veiculo} · {e.saida} → {e.volta}
                  <br />
                  Distância (só ida): <b>{e.distancia_km.toFixed(2)} km</b>
                </p>
                {e.autonomia_insuficiente ? (
                  <div className="erro">Não é possível completar com essa autonomia.</div>
                ) : e.paradas.length === 0 ? (
                  <p className="suave">Não é preciso abastecer.</p>
                ) : (
                  <>
                    <b>Abastecer em:</b>
                    <ul className="lista">
                      {e.paradas.map((p, i) => (
                        <li key={i}>
                          <span>{p.nome}</span>
                          <span className="suave">
                            km {p.posicao_km.toFixed(1)} da rota ({p.sentido})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
