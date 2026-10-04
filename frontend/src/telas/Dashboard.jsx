export default function Dashboard({ estado, irPara, calcular, calculando }) {
  const { loja, veiculos, entregas, mapa } = estado
  const pode = loja && veiculos && entregas.length > 0

  return (
    <>
      <div className="grade">
        <div className="cartao">
          <h2>1. Loja</h2>
          {loja ? (
            <p>
              <b>{loja.nome}</b>
              <br />
              <span className="suave">
                {loja.lat.toFixed(4)}, {loja.lon.toFixed(4)}
              </span>
            </p>
          ) : (
            <p className="suave">Comece cadastrando a loja.</p>
          )}
          {loja && mapa.estado === 'carregando' && (
            <p className="suave">
              <span className="spinner" />
              Baixando o mapa da região...
            </p>
          )}
          {loja && mapa.estado === 'erro' && <div className="erro">{mapa.mensagem}</div>}
          <button className="primario" onClick={() => irPara('loja')}>
            {loja ? 'Alterar loja' : 'Cadastrar loja'}
          </button>
        </div>

        <div className="cartao">
          <h2>2. Veículos</h2>
          {veiculos ? (
            <p>
              <b>{veiculos.quantidade}</b> disponíveis
              <br />
              <span className="suave">
                Autonomia: {veiculos.autonomia_cheio_km} km (cheio), {veiculos.autonomia_atual_km} km (agora)
              </span>
            </p>
          ) : (
            <p className="suave">{loja ? 'Informe quantos veículos estão disponíveis.' : 'Cadastre a loja primeiro.'}</p>
          )}
          <button className="primario" disabled={!loja} onClick={() => irPara('veiculos')}>
            {veiculos ? 'Alterar veículos' : 'Cadastrar veículos'}
          </button>
        </div>

        <div className="cartao">
          <h2>3. Entregas</h2>
          {entregas.length > 0 ? (
            <ul className="lista">
              {entregas.map((e, i) => (
                <li key={e.id}>
                  Entrega {i + 1}
                  <span className="suave">saída {e.horario_saida}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="suave">{loja ? 'Nenhuma entrega adicionada ainda.' : 'Cadastre a loja primeiro.'}</p>
          )}
          <button className="primario" disabled={!loja} onClick={() => irPara('entregas')}>
            Cadastrar entregas
          </button>
        </div>
      </div>

      <div className="cartao">
        <button className="primario" disabled={!pode || calculando} onClick={calcular}>
          Calcular despacho
        </button>
        {!pode && <p className="suave">É preciso ter loja, pelo menos 1 veículo e pelo menos 1 entrega.</p>}
      </div>
    </>
  )
}
