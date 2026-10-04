import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import './MonthlyCalendar.css'

const DIAS_DA_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']

const formatarChaveData = (data) => {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

const formatarHorario = (valor) => new Date(valor).toLocaleTimeString('pt-BR', {
  hour: '2-digit',
  minute: '2-digit'
})

export default function MonthlyCalendar({ publicSlug = null, isProfessional = false }) {
  const { slug } = useParams()
  const navigate = useNavigate()
  const hoje = new Date()
  const [mesAtual, setMesAtual] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1))
  const [agendamentos, setAgendamentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const celulas = useMemo(() => {
    const primeiroDia = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1)
    const diasNoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate()
    const espacosAnteriores = (primeiroDia.getDay() + 6) % 7
    const totalCelulas = Math.ceil((espacosAnteriores + diasNoMes) / 7) * 7

    return Array.from({ length: totalCelulas }, (_, indice) => {
      const numeroDoDia = indice - espacosAnteriores + 1
      if (numeroDoDia < 1 || numeroDoDia > diasNoMes) return null
      return new Date(mesAtual.getFullYear(), mesAtual.getMonth(), numeroDoDia)
    })
  }, [mesAtual])

  useEffect(() => {
    let ativo = true

    const carregarAgendamentos = async () => {
      setCarregando(true)
      setErro(null)

      try {
        if (isProfessional) {
          const { data } = await api.get('/appointments/')
          const lista = Array.isArray(data) ? data : data.results || []
          if (ativo) setAgendamentos(lista)
          return
        }

        const diasDoMes = celulas.filter(Boolean).map((data) => formatarChaveData(data))
        const respostas = await Promise.all(diasDoMes.map(async (date) => {
          const { data } = await api.get(`/public/${publicSlug}/schedule/`, { params: { date } })
          const slots = data.slots || []
          return slots.filter((slot) => !slot.available).map((slot) => ({
            id: `${date}-${slot.time}`,
            start_datetime: `${date}T${slot.time}:00`,
            client_name: slot.is_lunch ? 'Almoço' : 'Indisponível',
            status: slot.is_lunch ? 'lunch' : 'occupied'
          }))
        }))
        if (ativo) setAgendamentos(respostas.flat())
      } catch {
        if (ativo) setErro('Não foi possível carregar os agendamentos.')
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregarAgendamentos()
    return () => { ativo = false }
  }, [celulas, isProfessional, publicSlug])

  const agendamentosPorDia = useMemo(() => agendamentos.reduce((dias, agendamento) => {
    const data = new Date(agendamento.start_datetime)
    if (Number.isNaN(data.getTime())) return dias

    const chave = formatarChaveData(data)
    dias[chave] = [...(dias[chave] || []), agendamento]
    return dias
  }, {}), [agendamentos])

  const mudarMes = (quantidade) => {
    setMesAtual((atual) => new Date(atual.getFullYear(), atual.getMonth() + quantidade, 1))
  }

  return (
    <section className="monthly-calendar" aria-label="Calendário mensal de agendamentos">
      <div className="monthly-calendar-toolbar">
        <div>
          <p className="monthly-calendar-kicker">Agenda mensal</p>
          <h2>{mesAtual.toLocaleDateString('pt-BR', { month: 'long' })} de {mesAtual.getFullYear()}</h2>
        </div>
        <div className="monthly-calendar-navigation">
          <button type="button" onClick={() => mudarMes(-1)} aria-label="Mês anterior">&larr;</button>
          <button type="button" onClick={() => setMesAtual(new Date(hoje.getFullYear(), hoje.getMonth(), 1))}>Hoje</button>
          <button type="button" onClick={() => mudarMes(1)} aria-label="Próximo mês">&rarr;</button>
        </div>
      </div>

      {erro && <p className="monthly-calendar-feedback error">{erro}</p>}
      {carregando && <p className="monthly-calendar-feedback">Carregando agendamentos...</p>}

      <div className="monthly-calendar-weekdays" aria-hidden="true">
        {DIAS_DA_SEMANA.map((dia) => <span key={dia}>{dia}</span>)}
      </div>

      <div className="monthly-calendar-grid">
        {celulas.map((data, indice) => {
          if (!data) return <div className="monthly-calendar-day empty" key={`vazio-${indice}`} />

          const chave = formatarChaveData(data)
          const eventos = agendamentosPorDia[chave] || []
          const ehHoje = chave === formatarChaveData(hoje)
          const ehPassado = data < new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
          const podeAbrir = isProfessional || !ehPassado

          return (
            <div
              className={`monthly-calendar-day${ehHoje ? ' today' : ''}${ehPassado ? ' past' : ''}`}
              key={chave}
              role="button"
              tabIndex={podeAbrir ? '0' : '-1'}
              onClick={() => {
                if (podeAbrir) navigate(isProfessional ? `/${slug}/dashboard/dia?date=${chave}` : `/${slug}?date=${chave}`)
              }}
              onKeyDown={(event) => {
                if (podeAbrir && (event.key === 'Enter' || event.key === ' ')) navigate(isProfessional ? `/${slug}/dashboard/dia?date=${chave}` : `/${slug}?date=${chave}`)
              }}
              aria-disabled={!podeAbrir}
              aria-label={`Abrir agenda do dia ${data.getDate()}`}
            >
              <div className="monthly-calendar-day-number">{data.getDate()}</div>
              <div className="monthly-calendar-events">
                {eventos.slice(0, 3).map((agendamento) => (
                  <div className={`monthly-calendar-event status-${agendamento.status || 'scheduled'}`} key={agendamento.id || agendamento.appointment_id || agendamento.start_datetime}>
                    <strong>{formatarHorario(agendamento.start_datetime)}</strong>
                    <span>{agendamento.client_name || 'Cliente não identificada'}</span>
                  </div>
                ))}
                {eventos.length > 3 && <span className="monthly-calendar-more">+{eventos.length - 3} agendamentos</span>}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}