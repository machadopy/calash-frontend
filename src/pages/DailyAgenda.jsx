import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import AgendaGrid from '../components/AgendaGrid'
import './DailyAgenda.css'

const dataAtual = () => new Date().toISOString().split('T')[0]

export default function DailyAgenda() {
  const { slug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const data = new URLSearchParams(location.search).get('date') || dataAtual()

  const alterarData = (novaData) => {
    navigate(`/${slug}/dashboard/dia?date=${novaData}`, { replace: true })
  }

  return (
    <Layout title="Agenda diária" subtitle="Visualize e gerencie seus horários">
      <div className="daily-agenda-content">
        <Link to={`/${slug}/dashboard`} className="daily-agenda-back">Voltar para o calendário</Link>
        <AgendaGrid
          isProfessional
          selectedDate={data}
          onDateChange={alterarData}
        />
      </div>
    </Layout>
  )
}