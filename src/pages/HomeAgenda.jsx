import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import api from '../services/api'
import AgendaPublica from './AgendaPublica'
import MonthlyCalendar from '../components/MonthlyCalendar'
import Layout from '../components/Layout'

export default function HomeAgenda() {
  const { slug } = useParams()
  const location = useLocation()
  const [usuario, setUsuario] = useState(undefined)

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      setUsuario(null)
      return
    }

    api.get('/auth/me/')
      .then(({ data }) => setUsuario(data))
      .catch(() => setUsuario(null))
  }, [])

  if (location.search) return <AgendaPublica />
  if (usuario === undefined) return null

  const podeGerenciar = usuario?.is_professional || usuario?.is_superuser

  return (
    <Layout
      title="Calash"
      subtitle={podeGerenciar ? 'Painel de gestão e agendamentos' : 'Agende seu atendimento'}
      wide
    >
      <MonthlyCalendar publicSlug={slug} isProfessional={podeGerenciar} />
    </Layout>
  )
}