import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'
import './AgendaPublica.css'
import UserMenu from '../components/UserMenu'
import AgendaGrid from '../components/AgendaGrid'

export default function AgendaPublica() {
  const { slug } = useParams()
  const [agenda, setAgenda] = useState(null)
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [mensagem, setMensagem] = useState(null)
  const [naoEncontrada, setNaoEncontrada] = useState(false)
  const [estaLogado, setEstaLogado] = useState(Boolean(localStorage.getItem('accessToken')))

  useEffect(() => {
    api.get(`/public/${slug}/`)
      .then(({ data: response }) => setAgenda(response))
      .catch((error) => {
        setNaoEncontrada(error.response?.status === 404)
        setMensagem(error.response?.status === 404
          ? 'Profissional não encontrada.'
          : 'Não foi possível conectar ao servidor.')
      })
  }, [slug])

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setEstaLogado(false)
    navigate('/', { replace: true })
  }

  if (!agenda) return <main className="min-h-screen bg-[#F4FBFC] p-6 text-center">{mensagem || 'Carregando...'}{!naoEncontrada && mensagem && <div className="mt-2 text-xs text-slate-400">Verifique se o backend está ativo em http://127.0.0.1:8000.</div>}</main>

  return (
    <main className="public-agenda">
      <div className="public-agenda-card">
        <header className="public-agenda-header">
          <UserMenu />
          <h1 className="public-agenda-title">{agenda.business_name}</h1>
          <p className="text-sm text-[#4A5C5C] mt-1">Agende seu atendimento</p>
        </header>
        <div className="public-agenda-content space-y-5">
          <label className="public-agenda-date">
            <span>Data do atendimento</span>
            <input
              type="date"
              lang="pt-BR"
              value={data}
              onChange={(event) => setData(event.target.value)}
              required
              aria-label="Selecionar data do atendimento"
            />
          </label>
          <AgendaGrid
            isProfessional={false}
            publicSlug={slug}
            selectedDate={data}
            onDateChange={setData}
            services={agenda.services}
          />
          {mensagem && <p className="text-center text-sm text-slate-500">{mensagem}</p>}
          {estaLogado ? (
            <button type="button" onClick={logout} className="block w-full text-center text-sm text-red-500 hover:underline">Sair</button>
          ) : (
            <Link to="/" state={{ from: `/${slug}` }} className="block text-center text-sm text-[#779FA3] hover:underline">Entrar</Link>
          )}
        </div>
      </div>
    </main>
  )
}