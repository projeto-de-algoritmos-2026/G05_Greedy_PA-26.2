import { ArrowRight, Check, Circle as Vazio, Pencil, Plus } from 'lucide-react'
import { Aviso, Cabecalho, Spinner } from '../ui'

export default function Dashboard({ estado, irPara, calcular, calculando }) {
  const { loja, veiculos, entregas, mapa } = estado
  const pode = loja && veiculos && entregas.length > 0

  const requisitos = [
    [Boolean(loja), 'Loja posicionada no mapa'],
    [Boolean(veiculos), 'Frota informada'],
    [entregas.length > 0, 'Ao menos uma entrega'],
  ]

  return (
    <>
      <Cabecalho passo="00 / Resumo" titulo="Prepare o despacho do dia" texto="Três etapas, nesta ordem. Quando tudo estiver pronto, calcule quais veículos saem e onde abastecer." />

      <dl className="stats rise">
        <div className="stat">
          <dt>Veículos</dt>
          <dd>{veiculos ? veiculos.quantidade : '—'}</dd>
        </div>
        <div className="stat">
          <dt>Autonomia cheia</dt>
          <dd>
            {veiculos ? veiculos.autonomia_cheio_km : '—'}
            {veiculos && <small>km</small>}
          </dd>
        </div>
        <div className="stat">
          <dt>Autonomia atual</dt>
          <dd>
            {veiculos ? veiculos.autonomia_atual_km : '—'}
            {veiculos && <small>km</small>}
          </dd>
        </div>
        <div className="stat">
          <dt>Entregas</dt>
          <dd>{entregas.length}</dd>
        </div>
      </dl>

      <div className="dash rise">
        <section className="panel" aria-label="Etapas de preparo">
          <div className="panel-title">Preparo</div>

          <div className="passo">
            <span className={`passo-n ${loja ? 'ok' : ''}`}>{loja ? <Check size={18} /> : '01'}</span>
            <div>
              <h2>Loja</h2>
              {loja ? (
                <p>
                  {loja.nome} · <span className="mono">{loja.lat.toFixed(4)}, {loja.lon.toFixed(4)}</span>
                </p>
              ) : (
                <p>Marque no mapa de onde as entregas saem.</p>
              )}
              {loja && mapa.estado === 'carregando' && (
                <p style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                  <Spinner /> Baixando o mapa da região…
                </p>
              )}
              {loja && mapa.estado === 'erro' && (
                <div style={{ marginTop: 8 }}>
                  <Aviso tipo="err">{mapa.mensagem}</Aviso>
                </div>
              )}
            </div>
            <button className="btn" onClick={() => irPara('loja')}>
              {loja ? <Pencil size={15} /> : <Plus size={15} />}
              {loja ? 'Alterar loja' : 'Cadastrar loja'}
            </button>
          </div>

          <div className="passo">
            <span className={`passo-n ${veiculos ? 'ok' : ''}`}>{veiculos ? <Check size={18} /> : '02'}</span>
            <div>
              <h2>Veículos</h2>
              <p>{veiculos ? `${veiculos.quantidade} disponíveis, mesma autonomia para todos.` : loja ? 'Informe quantos veículos há e a autonomia.' : 'Cadastre a loja primeiro.'}</p>
            </div>
            <button className="btn" disabled={!loja} onClick={() => irPara('veiculos')}>
              {veiculos ? <Pencil size={15} /> : <Plus size={15} />}
              {veiculos ? 'Alterar veículos' : 'Cadastrar veículos'}
            </button>
          </div>

          <div className="passo">
            <span className={`passo-n ${entregas.length ? 'ok' : ''}`}>{entregas.length ? <Check size={18} /> : '03'}</span>
            <div>
              <h2>Entregas</h2>
              {entregas.length > 0 ? (
                <div className="chips">
                  {entregas.map((e, i) => (
                    <span className="mini" key={e.id}>
                      {String(i + 1).padStart(2, '0')} · {e.horario_saida}
                    </span>
                  ))}
                </div>
              ) : (
                <p>{loja ? 'Marque os clientes no mapa e defina o horário de saída.' : 'Cadastre a loja primeiro.'}</p>
              )}
            </div>
            <button className="btn" disabled={!loja} onClick={() => irPara('entregas')}>
              <Plus size={15} />
              {entregas.length ? 'Gerenciar entregas' : 'Cadastrar entregas'}
            </button>
          </div>
        </section>

        <section className="panel launch" aria-label="Cálculo">
          <h2>{pode ? 'Tudo pronto para calcular.' : 'Faltam dados para calcular.'}</h2>
          <ul className="checks">
            {requisitos.map(([ok, texto]) => (
              <li key={texto} className={ok ? 'ok' : ''}>
                {ok ? <Check size={16} /> : <Vazio size={16} />}
                {texto}
              </li>
            ))}
          </ul>
          <button className="btn primary block" disabled={!pode || calculando} onClick={calcular}>
            {calculando ? 'Calculando…' : 'Calcular despacho'}
            {!calculando && <ArrowRight size={16} className="go" />}
          </button>
        </section>
      </div>
    </>
  )
}
