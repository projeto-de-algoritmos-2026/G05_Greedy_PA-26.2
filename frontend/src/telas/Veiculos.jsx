import { useState } from 'react'
import { api } from '../api'

export default function Veiculos({ estado, aoMudar, irPara }) {
  const v = estado.veiculos
  const [quantidade, setQuantidade] = useState(v?.quantidade ?? 1)
  const [cheio, setCheio] = useState(v?.autonomia_cheio_km ?? 12)
  const [atual, setAtual] = useState(v?.autonomia_atual_km ?? 12)
  const [erro, setErro] = useState(null)
  const [salvo, setSalvo] = useState(false)

  async function salvar(e) {
    e.preventDefault()
    setErro(null)
    setSalvo(false)
    try {
      await api.salvarVeiculos({
        quantidade: Number(quantidade),
        autonomia_cheio_km: Number(cheio),
        autonomia_atual_km: Number(atual),
      })
      await aoMudar()
      setSalvo(true)
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <div className="cartao">
      <h2>Cadastrar veículos</h2>
      <p className="suave">Os valores valem para todos os veículos.</p>
      <form onSubmit={salvar}>
        <label htmlFor="qtd">Quantidade de veículos disponíveis</label>
        <input id="qtd" type="number" min="1" step="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
        <label htmlFor="cheio">Autonomia com tanque cheio (km)</label>
        <input id="cheio" type="number" min="0.1" step="any" value={cheio} onChange={(e) => setCheio(e.target.value)} />
        <label htmlFor="atual">Autonomia atual, com o combustível de agora (km)</label>
        <input id="atual" type="number" min="0.1" step="any" value={atual} onChange={(e) => setAtual(e.target.value)} />
        {erro && <div className="erro">{erro}</div>}
        <button className="primario">Salvar veículos</button>{' '}
        {salvo && (
          <button type="button" className="primario" onClick={() => irPara('entregas')}>
            Próximo: entregas
          </button>
        )}
      </form>
    </div>
  )
}
