import { useState } from 'react'
import { Link } from 'react-router-dom'
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

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErro('')
    setMensagem('')
    setLoading(true)

    try {
      const { data } = await api.post('/auth/forgot-password/', { email })
      const retorno = data?.detail || data?.message || 'Se o e-mail existir, enviamos um link.'
      setMensagem(retorno)
    } catch (error) {
      const retorno = error.response?.data?.detail || error.response?.data?.message || 'Se o e-mail existir, enviamos um link.'
      setMensagem(retorno || formatarErroApi(error, 'Se o e-mail existir, enviamos um link.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Calash" subtitle="Recuperar senha" showUserMenu={false}>
      {erro && <div className="login-error">{erro}</div>}
      {mensagem && <div className="login-success">{mensagem}</div>}

      <form onSubmit={handleSubmit} className="login-form">
        <div className="login-field">
          <label className="login-label">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="login-input"
            placeholder="seu@email.com"
            required
          />
        </div>

        <button type="submit" disabled={loading} className="login-submit">
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>

      <div className="login-footer">Sistema integrado com API Django &bull; Calash</div>
      <Link to="/login" className="login-register-link">Voltar para o login</Link>
    </Layout>
  )
}
