import Layout from '../components/Layout'
import MonthlyCalendar from '../components/MonthlyCalendar'
import { Link } from 'react-router-dom'
import { useParams } from 'react-router-dom'

export default function Dashboard() {
  const { slug } = useParams()

  return (
    <Layout title="Painel Calash" subtitle="Bem-vindo ao sistema de gestão" wide>
      <div className="dashboard-content">
        <MonthlyCalendar isProfessional />

        <Link
          to={`/${slug}/procedimentos`}
          className="dashboard-action dashboard-action-primary"
        >
          Gerenciar procedimentos
        </Link>

        <Link
          to={`/${slug}/working-hours`}
          className="dashboard-action dashboard-action-secondary"
        >
          Configurar expediente
        </Link>
        
        <button 
          onClick={() => {
            localStorage.clear();
            // Volta para a tela de login ao sair
            window.location.href = '/'; 
          }}
          className="dashboard-action dashboard-action-danger"
        >
          Sair da Conta (Logout)
        </button>

      </div>
    </Layout>
  )
}