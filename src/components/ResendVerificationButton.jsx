import { useEffect, useState } from 'react'
import api from '../services/api'

export default function ResendVerificationButton({
  className = 'login-submit',
  buttonText = 'Reenviar e-mail de confirmação',
  onDone,
  onError,
}) {
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return undefined

    const timer = window.setTimeout(() => {
      setCooldown((atual) => Math.max(0, atual - 1))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [cooldown])

  const enviar = async () => {
    if (!localStorage.getItem('accessToken')) {
      onError?.('Faça login para reenviar o e-mail de confirmação.')
      return
    }

    setLoading(true)

    try {
      await api.post('/auth/resend-verification/')
      setCooldown(60)
      onDone?.('E-mail de confirmação enviado com sucesso.')
    } catch (error) {
      const mensagem = error.response?.data?.detail || error.response?.data?.message || 'Não foi possível reenviar o e-mail de confirmação.'
      onError?.(mensagem)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      className={className}
      onClick={enviar}
      disabled={loading || cooldown > 0}
    >
      {loading ? 'Enviando...' : cooldown > 0 ? `Reenviar em ${cooldown}s` : buttonText}
    </button>
  )
}
