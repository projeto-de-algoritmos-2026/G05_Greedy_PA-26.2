import { AlertTriangle, Info, OctagonAlert } from 'lucide-react'

export function Cabecalho({ passo, titulo, texto, children }) {
  return (
    <header className="head">
      <div>
        <div className="eyebrow">{passo}</div>
        <h1>{titulo}</h1>
        {texto && <p>{texto}</p>}
      </div>
      {children}
    </header>
  )
}

const ICONES = { err: OctagonAlert, warn: AlertTriangle, info: Info }

export function Aviso({ tipo = 'info', children }) {
  const Icone = ICONES[tipo]
  return (
    <div className={`callout ${tipo}`} role={tipo === 'err' ? 'alert' : 'status'}>
      <Icone size={16} aria-hidden />
      <div>{children}</div>
    </div>
  )
}

export const Spinner = () => <span className="spinner" aria-hidden />
