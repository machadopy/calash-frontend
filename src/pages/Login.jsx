import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../services/api'
import Layout from '../components/Layout'

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
          navigate(destino, { replace: true })
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
        navigate(destino, { replace: true })
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
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-xl mb-4 text-center font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="mb-4">
          <label className="block text-[11px] font-medium text-[#667777] mb-2 uppercase tracking-[0.5px]">
            E-mail
          </label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-[12px_16px] border-[1.5px] border-[#D5EBEB] rounded-[12px] text-sm text-[#2C2C2C] bg-white outline-none focus:border-[#95C6CC] focus:ring-4 focus:ring-[#95C6CC]/25 transition-all"
            placeholder="seu@email.com"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-[11px] font-medium text-[#667777] mb-2 uppercase tracking-[0.5px]">
            Senha
          </label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-[12px_16px] border-[1.5px] border-[#D5EBEB] rounded-[12px] text-sm text-[#2C2C2C] bg-white outline-none focus:border-[#95C6CC] focus:ring-4 focus:ring-[#95C6CC]/25 transition-all"
            placeholder="••••••••"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[#95C6CC] hover:bg-[#779FA3] text-white border-none p-[14px] rounded-[12px] text-sm font-semibold cursor-pointer transition-all shadow-[0_4px_15px_rgba(149,198,204,0.3)] uppercase tracking-[0.5px] mt-2 disabled:opacity-70"
        >
          {loading ? "Autenticando..." : "Entrar"}
        </button>
      </form>

      <div className="text-center mt-5 text-[11px] text-[#889999]">
        Sistema integrado com API Django &bull; Calash
      </div>
      <Link to="/register" state={location.state} className="block text-center mt-3 text-sm text-[#779FA3] hover:underline">
        Criar conta de cliente
      </Link>
    </Layout>
  )
}
