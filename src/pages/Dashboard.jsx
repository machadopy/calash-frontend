import Layout from '../components/Layout'
import AgendaGrid from '../components/AgendaGrid' // Faltou essa importação no seu!
import { Link } from 'react-router-dom'
import { useParams } from 'react-router-dom'

export default function Dashboard() {
  const { slug } = useParams()

  return (
    <Layout title="Painel Calash" subtitle="Bem-vindo ao sistema de gestão">
      <div className="space-y-6">
        
        <p className="text-sm text-slate-600 text-center">
          Aqui você poderá ver os agendamentos e gerenciar o estúdio.
        </p>
        
        {/* Aqui estamos "injetando" a tabela na página do jeito certo */}
        <AgendaGrid isProfessional={true} />

        <Link
          to={`/${slug}/servicos`}
          className="block w-full bg-[#779FA3] hover:bg-[#5F898E] text-white text-center p-3 rounded-xl text-sm font-semibold transition-all shadow-md"
        >
          Gerenciar procedimentos
        </Link>

        <Link
          to={`/${slug}/working-hours`}
          className="block w-full border border-[#779FA3] text-[#779FA3] hover:bg-[#F4FBFC] text-center p-3 rounded-xl text-sm font-semibold transition-all"
        >
          Configurar expediente
        </Link>
        
        <button 
          onClick={() => {
            localStorage.clear();
            // Volta para a tela de login ao sair
            window.location.href = '/'; 
          }}
          className="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white p-3 rounded-xl text-sm font-semibold transition-all shadow-md"
        >
          Sair da Conta (Logout)
        </button>

      </div>
    </Layout>
  )
}