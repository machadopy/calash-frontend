import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import './Layout.css'

export default function UserMenu() {
  const { slug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [temAgendamentosAbertos, setTemAgendamentosAbertos] = useState(false)
  const [aberto, setAberto] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const carregarUsuario = () => {
      if (!localStorage.getItem('accessToken')) {
        setUser(null)
        return
      }

      api.get('/auth/me/')
        .then(({ data }) => setUser(data))
        .catch(() => setUser(null))

      api.get('/appointments/')
        .then(({ data }) => setTemAgendamentosAbertos(
          data.some(({ status }) => ['pending', 'scheduled'].includes(status))
        ))
        .catch(() => setTemAgendamentosAbertos(false))
    }

    carregarUsuario()
    window.addEventListener('calash:auth-changed', carregarUsuario)
    return () => window.removeEventListener('calash:auth-changed', carregarUsuario)
  }, [location.pathname])

  useEffect(() => {
    if (!aberto) return undefined

    const fecharAoClicarFora = (event) => {
      if (!menuRef.current?.contains(event.target)) setAberto(false)
    }
    const fecharComEscape = (event) => {
      if (event.key === 'Escape') setAberto(false)
    }

    document.addEventListener('mousedown', fecharAoClicarFora)
    document.addEventListener('keydown', fecharComEscape)
    return () => {
      document.removeEventListener('mousedown', fecharAoClicarFora)
      document.removeEventListener('keydown', fecharComEscape)
    }
  }, [aberto])

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    window.dispatchEvent(new Event('calash:auth-changed'))
    setAberto(false)
    navigate('/', { replace: true })
  }

  if (!user) return null

  const destino = slug || user.professional_slug || 'calash'

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setAberto((atual) => !atual)}
        aria-label="Abrir menu do usuário"
        aria-expanded={aberto}
      >
        <svg className="user-menu-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5.5 20c.7-3.7 3-5.5 6.5-5.5s5.8 1.8 6.5 5.5" />
        </svg>
      </button>

      {aberto && (
        <div className="user-menu-dropdown">
          <div className="user-menu-name">{user.name || user.email}</div>
          <Link to={user.is_professional ? `/${destino}/dashboard` : `/${destino}`} onClick={() => setAberto(false)}>Home</Link>
          <Link to={`/${destino}/perfil`} onClick={() => setAberto(false)}>Perfil</Link>
          {user.is_professional && (
            <>
              <Link to={`/${destino}/procedimentos`} onClick={() => setAberto(false)}>Procedimentos</Link>
              <Link to={`/${destino}/working-hours`} onClick={() => setAberto(false)}>Horários de atendimento</Link>
              <Link to={`/${destino}/anamneses`} onClick={() => setAberto(false)}>Fichas de anamnese</Link>
            </>
          )}
          {temAgendamentosAbertos && (
            <Link to={`/${destino}/agendamentos`} onClick={() => setAberto(false)}>Agendamentos</Link>
          )}
          <button type="button" onClick={logout}>Sair</button>
        </div>
      )}
    </div>
  )
}
