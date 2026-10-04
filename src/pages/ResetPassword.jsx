import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import Layout from '../components/Layout'
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

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const uid = useMemo(() => searchParams.get('uid') || '', [searchParams])
  const token = useMemo(() => searchParams.get('token') || '', [searchParams])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErro('')

    if (!uid || !token) {
      setErro('Link de redefinição inválido ou expirado.')
      return
    }

    if (password !== confirmPassword) {
      setErro('As senhas não conferem.')
      return
    }

    setLoading(true)

    try {
      await api.post('/auth/reset-password/', {
        uid,
        token,
        password,
      })

      navigate('/login', {
        replace: true,
        state: { notice: 'Senha alterada, entre com a nova senha' },
      })
    } catch (error) {
      const mensagem = error.response?.data?.detail || error.response?.data?.message || formatarErroApi(error, 'Não foi possível redefinir a senha.')
      setErro(mensagem)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Calash" subtitle="Redefinir senha" showUserMenu={false}>
      {erro && <div className="login-error">{erro}</div>}

      <form onSubmit={handleSubmit} className="login-form">
        <div className="login-field">
          <label className="login-label">Nova senha</label>
          <div className="login-password-wrapper">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="login-input"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              className="login-password-toggle"
              onClick={() => setMostrarSenha((atual) => !atual)}
            >
              {mostrarSenha ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>

        <div className="login-field">
          <label className="login-label">Confirmar senha</label>
          <div className="login-password-wrapper">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="login-input"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="login-submit">
          {loading ? 'Salvando...' : 'Salvar nova senha'}
        </button>
      </form>

      <div className="login-footer">Sistema integrado com API Django &bull; Calash</div>
      <Link to="/login" className="login-register-link">Voltar para o login</Link>
    </Layout>
  )
}
