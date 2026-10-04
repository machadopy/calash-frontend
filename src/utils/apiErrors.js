// Converte erros da API em mensagens úteis para a cliente, sem expor
// detalhes internos. Só campos conhecidos (lista branca) são exibidos;
// erros de servidor viram uma mensagem genérica.

const FIELD_LABELS = {
  name: 'Nome',
  email: 'E-mail',
  phone: 'Telefone',
  password: 'Senha',
  token: 'Link',
  uid: 'Link',
  non_field_errors: '',
  detail: '',
}

const DEFAULT_MESSAGE = 'Não foi possível concluir a ação. Tente novamente.'

export function getApiError(err, fallback = DEFAULT_MESSAGE) {
  const res = err?.response

  // Sem resposta: rede caiu, servidor fora do ar ou requisição bloqueada.
  if (!res) {
    return 'Sem conexão com o servidor. Verifique sua internet e tente novamente.'
  }

  const { status, data } = res

  if (status === 429) {
    const segundos = Number(res.headers?.['retry-after'])
    if (segundos > 0) {
      const minutos = Math.ceil(segundos / 60)
      return minutos <= 1
        ? 'Muitas tentativas. Tente novamente em instantes.'
        : `Muitas tentativas. Tente novamente em ${minutos} minutos.`
    }
    return 'Muitas tentativas. Aguarde um pouco e tente novamente.'
  }

  if (status >= 500) {
    return 'Ocorreu um erro no servidor. Tente novamente em instantes.'
  }

  if (status === 403 && data?.code === 'email_not_verified') {
    return 'Confirme seu e-mail para continuar.'
  }

  if (status === 400 && data && typeof data === 'object') {
    const partes = []
    for (const [campo, msgs] of Object.entries(data)) {
      if (!(campo in FIELD_LABELS)) continue
      const texto = (Array.isArray(msgs) ? msgs : [msgs])
        .filter((m) => typeof m === 'string')
        .join(' ')
      if (!texto) continue
      const rotulo = FIELD_LABELS[campo]
      partes.push(rotulo ? `${rotulo}: ${texto}` : texto)
    }
    if (partes.length) return partes.join(' ')
  }

  return fallback
}
