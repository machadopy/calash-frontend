import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import Layout from '../components/Layout'
import ResendVerificationButton from '../components/ResendVerificationButton'
import './Login.css'

const formatarErroApi = (error, padrao) => {
  const detalhes = error.response?.data
  if (!detalhes || typeof detalhes !== 'object') return padrao

  const mensagens = Object.values(detalhes).flatMap((valor) => {
    if (Array.isArray(valor)) return valor
    return [String(valor)]
  })

  return mensagens.join(' ') || padrao
}

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const executado = useRef(false)
  const [status, setStatus] = useState('validando')
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    if (!token || executado.current) return
    executado.current = true

    const confirmar = async () => {
      try {
        await api.post('/auth/verify-email/', { token })

        if (localStorage.getItem('accessToken')) {
          const { data: user } = await api.get('/auth/me/')
          const destino = user.is_professional
            ? `/${user.professional_slug}/dashboard`
            : `/${user.professional_slug || 'calash'}`
          window.dispatchEvent(new Event('calash:auth-changed'))
          navigate(destino, { replace: true })
          return
        }

        setStatus('sucesso')
        setMensagem('E-mail verificado com sucesso.')
        navigate('/login', {
          replace: true,
          state: { notice: 'E-mail verificado com sucesso.' },
        })
      } catch (error) {
        const mensagemErro = error.response?.data?.detail || error.response?.data?.message || formatarErroApi(error, 'Não foi possível verificar o e-mail.')
        setErro(mensagemErro)
        setStatus('erro')
      }
    }

    confirmar()
  }, [navigate, token])

  return (
    <Layout title="Calash" subtitle="Confirmar e-mail" showUserMenu={false}>
      {status === 'validando' && <div className="login-notice">Validando seu e-mail...</div>}
      {status === 'sucesso' && mensagem && <div className="login-success">{mensagem}</div>}
      {status === 'erro' && (
        <div className="login-error">
          {erro}
          {localStorage.getItem('accessToken') && (
            <div className="login-inline-actions">
              <ResendVerificationButton
                className="login-inline-action"
                buttonText="Reenviar e-mail de confirmação"
                onDone={(texto) => setMensagem(texto)}
                onError={(texto) => setErro(texto)}
              />
            </div>
          )}
        </div>
      )}

      <div className="login-footer">Sistema integrado com API Django &bull; Calash</div>
      <Link to="/login" className="login-register-link">Voltar para o login</Link>
    </Layout>
  )
}
