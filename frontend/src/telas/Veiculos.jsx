import { useState } from 'react'
import { ArrowRight, Save } from 'lucide-react'
import { api } from '../api'
import { Aviso, Cabecalho } from '../ui'

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
    <>
      <Cabecalho passo="02 / Veículos" titulo="Qual é a frota disponível?" texto="Os valores valem para todos os veículos. A autonomia atual é o que o tanque aguenta agora." />
      <form className="panel panel-pad form rise" style={{ maxWidth: 560 }} onSubmit={salvar}>
        <div className="field">
          <label htmlFor="qtd">Veículos disponíveis</label>
          <input id="qtd" type="number" min="1" step="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
        </div>
        <div className="row2">
          <div className="field">
            <label htmlFor="cheio">Autonomia, tanque cheio (km)</label>
            <input id="cheio" type="number" min="0.1" step="any" value={cheio} onChange={(e) => setCheio(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="atual">Autonomia atual (km)</label>
            <input id="atual" type="number" min="0.1" step="any" value={atual} onChange={(e) => setAtual(e.target.value)} />
          </div>
        </div>
        {erro && <Aviso tipo="err">{erro}</Aviso>}
        <div className="actions">
          <button className="btn primary">
            <Save size={16} /> Salvar veículos
          </button>
          {salvo && (
            <button type="button" className="btn" onClick={() => irPara('entregas')}>
              Ir para entregas <ArrowRight size={16} className="go" />
            </button>
          )}
        </div>
      </form>
    </>
  )
}
