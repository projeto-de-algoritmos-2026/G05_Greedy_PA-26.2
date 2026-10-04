import { useCallback, useEffect, useState } from 'react'
import { api } from './api'
import Dashboard from './telas/Dashboard'
import Loja from './telas/Loja'
import Veiculos from './telas/Veiculos'
import Entregas from './telas/Entregas'
import Resultado from './telas/Resultado'

const ABAS = [
  ['dashboard', 'Resumo'],
  ['loja', 'Loja'],
  ['veiculos', 'Veículos'],
  ['entregas', 'Entregas'],
  ['resultado', 'Resultado'],
]

const espera = (ms) => new Promise((r) => setTimeout(r, ms))

export default function App() {
  const [aba, setAba] = useState('dashboard')
  const [estado, setEstado] = useState(null)
  const [erroServidor, setErroServidor] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [calculando, setCalculando] = useState(false)
  const [erroCalculo, setErroCalculo] = useState(null)

  const recarregar = useCallback(async () => {
    try {
      setEstado(await api.estado())
      setErroServidor(null)
    } catch (e) {
      setErroServidor(e.message)
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  // enquanto o mapa baixa, consulta o estado de tempos em tempos
  const baixando = estado?.mapa?.estado === 'carregando'
  useEffect(() => {
    if (!baixando) return
    const id = setInterval(recarregar, 2000)
    return () => clearInterval(id)
  }, [baixando, recarregar])

  async function calcular() {
    setCalculando(true)
    setErroCalculo(null)
    setAba('resultado')
    try {
      for (;;) {
        const { status, dados } = await api.calcular()
        if (status !== 202) {
          setResultado(dados)
          break
        }
        await espera(2000) // mapa ainda baixando: tenta de novo
      }
    } catch (e) {
      setErroCalculo(e.message)
    } finally {
      setCalculando(false)
      recarregar()
    }
  }

  // qualquer mudança nos dados deixa o resultado antigo desatualizado
  async function aoMudar() {
    setResultado(null)
    await recarregar()
  }

  const props = { estado, aoMudar, irPara: setAba }

  return (
    <div className="app">
      <header>
        <h1>Sistema de Entregas</h1>
      </header>
      {estado?.modo_mock && <div className="demo">Modo de demonstração: o resultado é falso, nenhum mapa é baixado.</div>}
      {erroServidor && <div className="erro">{erroServidor}</div>}
      <nav>
        {ABAS.map(([id, nome]) => (
          <button key={id} className={aba === id ? 'ativa' : ''} onClick={() => setAba(id)}>
            {nome}
          </button>
        ))}
      </nav>
      {estado && aba === 'dashboard' && <Dashboard {...props} calcular={calcular} calculando={calculando} />}
      {estado && aba === 'loja' && <Loja {...props} />}
      {estado && aba === 'veiculos' && <Veiculos {...props} />}
      {estado && aba === 'entregas' && <Entregas {...props} />}
      {estado && aba === 'resultado' && (
        <Resultado
          estado={estado}
          resultado={resultado}
          calculando={calculando}
          erro={erroCalculo}
          calcular={calcular}
        />
      )}
    </div>
  )
}
