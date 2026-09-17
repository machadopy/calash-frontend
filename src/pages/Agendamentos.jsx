import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'
import Layout from '../components/Layout'

export default function Agendamentos() {
	const { slug } = useParams()
	const [agendamentos, setAgendamentos] = useState([])
	const [erro, setErro] = useState(null)

	useEffect(() => {
		api.get('/appointments/')
			.then(({ data }) => setAgendamentos(
				data.filter(({ status }) => ['pending', 'scheduled'].includes(status))
			))
			.catch(() => setErro('Não foi possível carregar os agendamentos.'))
	}, [])

	return (
		<Layout title="Agendamentos" subtitle="Acompanhe seus horários">
			<div className="space-y-3">
				{erro && <p className="text-xs text-red-500 text-center">{erro}</p>}
				{!erro && agendamentos.length === 0 && <p className="text-sm text-slate-400 text-center">Você não possui agendamentos.</p>}
				{agendamentos.map((agendamento) => (
					<article key={agendamento.id} className="border border-[#D5EBEB] rounded-xl p-3 text-sm">
						<p className="font-medium text-slate-700">{agendamento.service_name || 'Atendimento'}</p>
						<p className="text-xs text-slate-500">{new Date(agendamento.start_datetime).toLocaleString('pt-BR')}</p>
						<p className="text-xs text-[#779FA3] mt-1">{agendamento.status}</p>
					</article>
				))}
				<Link to={`/${slug}/dashboard`} className="block text-center text-sm text-[#779FA3] hover:underline pt-3">Voltar</Link>
			</div>
		</Layout>
	)
}

