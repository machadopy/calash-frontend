import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../services/api'
import Layout from '../components/Layout'
import './Login.css'

// Caminho relativo: o navegador completa com o domínio atual e o Nginx
// encaminha /admin/ para o Django. Funciona em produção e (com proxy no Vite) em dev.
const ADMIN_URL = '/admin/'

// Destinos que precisam recarregar a página inteira (fora do SPA React).
const ehLinkExterno = (destino) =>
  destino.startsWith('http') || destino.startsWith(ADMIN_URL)

export default function Login() {
  const navigate = useNavigate() // Navegador inicializado aqui
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) return

    api.get('/auth/me/')
      .then(({ data: user }) => {
        const origem = location.state?.from
        const slugDaOrigem = origem?.match(/^\/([^/]+)/)?.[1]
        const destinoProfissional = origem && origem !== '/calash'
          ? origem
          : `/${user.professional_slug}/dashboard`

        const destino = user.is_professional
          ? destinoProfissional
          : user.is_superuser
          ? ADMIN_URL
          : (slugDaOrigem ? `/${slugDaOrigem}` : '/calash')
        if (ehLinkExterno(destino)) {
          window.location.assign(destino)
        } else {
          navigate(destino, { replace: true, state: location.state })
        }
      })
      .catch(() => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      })
  }, [location.state, navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await api.post('/auth/token/', {
        email: email,
        password: password
      })

      const { access, refresh } = response.data
      localStorage.setItem('accessToken', access)
      localStorage.setItem('refreshToken', refresh)
      window.dispatchEvent(new Event('calash:auth-changed'))

      const { data: user } = await api.get('/auth/me/')
      const origem = location.state?.from
      const slugDaOrigem = origem?.match(/^\/([^/]+)/)?.[1]
      const destinoProfissional = origem && origem !== '/calash'
        ? origem
        : `/${user.professional_slug}/dashboard`
      const destino = user.is_professional
        ? destinoProfissional
        : user.is_superuser
        ? ADMIN_URL
        : (slugDaOrigem ? `/${slugDaOrigem}` : '/calash')
      if (ehLinkExterno(destino)) {
        window.location.assign(destino)
      } else {
        navigate(destino, { replace: true, state: location.state })
      }

    } catch (err) {
      console.error(err)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      window.dispatchEvent(new Event('calash:auth-changed'))
      setError("Falha no login. Verifique suas credenciais.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Calash" subtitle="Acesse o painel para gerenciar o sistema" showUserMenu={false}>
      {error && (
        <div className="login-error">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="login-form">
        <div className="login-field">
          <label className="login-label">
            E-mail
          </label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            placeholder="seu@email.com"
            required
          />
        </div>
        
        <div className="login-field">
          <label className="login-label">
            Senha
          </label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            placeholder="••••••••"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="login-submit"
        >
          {loading ? "Autenticando..." : "Entrar"}
        </button>
      </form>

      <div className="login-footer">
        Sistema integrado com API Django &bull; Calash
      </div>
      <Link to="/register" state={location.state} className="login-register-link">
        Criar conta de cliente
      </Link>
    </Layout>
  )
}
