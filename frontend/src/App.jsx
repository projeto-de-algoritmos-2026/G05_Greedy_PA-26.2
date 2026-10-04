import { useCallback, useEffect, useState } from 'react'
import { Check, FlaskConical, LayoutDashboard, Package, Route, Store, Truck } from 'lucide-react'
import { api } from './api'
import { Aviso } from './ui'
import Dashboard from './telas/Dashboard'
import Loja from './telas/Loja'
import Veiculos from './telas/Veiculos'
import Entregas from './telas/Entregas'
import Resultado from './telas/Resultado'

const ABAS = [
  ['dashboard', 'Resumo', LayoutDashboard],
  ['loja', 'Loja', Store],
  ['veiculos', 'Veículos', Truck],
  ['entregas', 'Entregas', Package],
  ['resultado', 'Resultado', Route],
]

const MAPA_ROTULO = { pronto: 'mapa pronto', carregando: 'baixando mapa', erro: 'mapa com erro' }

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
  const pode = Boolean(estado?.loja && estado?.veiculos && estado?.entregas.length > 0)
  const feito = {
    loja: Boolean(estado?.loja),
    veiculos: Boolean(estado?.veiculos),
    entregas: estado?.entregas.length > 0,
    resultado: Boolean(resultado),
  }
  const estadoMapa = estado?.loja ? estado.mapa.estado : null

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <span className="brand-mark">
            <Route size={20} strokeWidth={2.6} aria-hidden />
          </span>
          <div>
            <div className="brand-name">Despacho</div>
            <div className="brand-sub">entregas · rotas</div>
          </div>
        </div>
        <div>
          <div className="nav-label">Fluxo</div>
          <nav className="nav" aria-label="Etapas">
            {ABAS.map(([id, nome, Icone]) => (
              <button key={id} aria-current={aba === id ? 'page' : undefined} onClick={() => setAba(id)}>
                <Icone size={18} aria-hidden />
                <span className="n-name">{nome}</span>
                {feito[id] && (
                  <span className="n-state ok" title="Etapa concluída">
                    <Check size={12} strokeWidth={3} aria-label="concluída" />
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="side-foot">
          {estadoMapa && (
            <span className={`chip ${estadoMapa}`}>
              <i />
              {MAPA_ROTULO[estadoMapa]}
            </span>
          )}
          <button className="btn primary block" disabled={!pode || calculando} onClick={calcular}>
            {calculando ? 'Calculando…' : 'Calcular despacho'}
          </button>
        </div>
      </aside>

      <div className="topbar">
        <div className="brand">
          <span className="brand-mark" style={{ width: 30, height: 30 }}>
            <Route size={16} strokeWidth={2.6} aria-hidden />
          </span>
          <div className="brand-name">Despacho</div>
        </div>
        {estadoMapa && (
          <span className={`chip ${estadoMapa}`}>
            <i />
            {MAPA_ROTULO[estadoMapa]}
          </span>
        )}
      </div>

      <main className="main">
        <div className="main-in">
          {estado?.modo_mock && (
            <div className="callout demo">
              <FlaskConical size={14} aria-hidden />
              <div>MODO DEMONSTRAÇÃO · resultado simulado, nenhum mapa é baixado</div>
            </div>
          )}
          {erroServidor && <Aviso tipo="err">{erroServidor}</Aviso>}
          {estado && aba === 'dashboard' && <Dashboard {...props} calcular={calcular} calculando={calculando} />}
          {estado && aba === 'loja' && <Loja {...props} />}
          {estado && aba === 'veiculos' && <Veiculos {...props} />}
          {estado && aba === 'entregas' && <Entregas {...props} />}
          {estado && aba === 'resultado' && (
            <Resultado estado={estado} resultado={resultado} calculando={calculando} erro={erroCalculo} calcular={calcular} />
          )}
        </div>
      </main>

      <nav className="tabbar" aria-label="Etapas">
        {ABAS.map(([id, nome, Icone]) => (
          <button key={id} aria-current={aba === id ? 'page' : undefined} onClick={() => setAba(id)}>
            <Icone size={20} aria-hidden />
            {nome}
          </button>
        ))}
      </nav>
    </div>
  )
}
