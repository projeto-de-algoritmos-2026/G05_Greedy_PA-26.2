// Cliente da API. Distâncias em km só para exibição; o backend trabalha em metros.

async function pedir(metodo, caminho, corpo) {
  let resposta
  try {
    resposta = await fetch(`/api${caminho}`, {
      method: metodo,
      headers: corpo ? { 'Content-Type': 'application/json' } : undefined,
      body: corpo ? JSON.stringify(corpo) : undefined,
    })
  } catch {
    throw new Error('Não foi possível falar com o servidor. Ele está rodando?')
  }
  let dados = null
  try {
    dados = await resposta.json()
  } catch {
    /* resposta sem corpo */
  }
  if (!resposta.ok) {
    const detalhe = dados?.detail
    throw new Error(typeof detalhe === 'string' ? detalhe : 'Dados inválidos. Confira os campos.')
  }
  return { status: resposta.status, dados }
}

export const api = {
  estado: () => pedir('GET', '/estado').then((r) => r.dados),
  salvarLoja: (loja) => pedir('POST', '/loja', loja).then((r) => r.dados),
  salvarVeiculos: (v) => pedir('POST', '/veiculos', v).then((r) => r.dados),
  adicionarEntrega: (e) => pedir('POST', '/entregas', e).then((r) => r.dados),
  removerEntrega: (id) => pedir('DELETE', `/entregas/${id}`),
  calcular: () => pedir('POST', '/calcular'), // 202 = mapa ainda baixando
}
