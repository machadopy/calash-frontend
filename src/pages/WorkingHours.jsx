import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'
import Layout from '../components/Layout'
import './WorkingHours.css'

const dias = [
  { weekday: 0, label: 'Segunda-feira' },
  { weekday: 1, label: 'Terça-feira' },
  { weekday: 2, label: 'Quarta-feira' },
  { weekday: 3, label: 'Quinta-feira' },
  { weekday: 4, label: 'Sexta-feira' },
  { weekday: 5, label: 'Sábado' },
  { weekday: 6, label: 'Domingo' },
]

const expedienteInicial = dias.map((dia) => ({
  ...dia,
  enabled: false,
  start_time: '10:00',
  end_time: '20:00',
  slot_interval_minutes: 60,
}))

export default function WorkingHours() {
  const { slug } = useParams()
  const [expediente, setExpediente] = useState(expedienteInicial)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    api.get('/services/working-hours/')
      .then(({ data }) => {
        setExpediente(expedienteInicial.map((dia) => {
          const configuracao = data.find((item) => item.weekday === dia.weekday)
          return configuracao ? { ...dia, enabled: true, ...configuracao } : dia
        }))
      })
      .catch(() => setErro('Não foi possível carregar o expediente.'))
      .finally(() => setCarregando(false))
  }, [])

  const alterarDia = (weekday, campo, valor) => {
    setExpediente((atual) => atual.map((dia) => (
      dia.weekday === weekday ? { ...dia, [campo]: valor } : dia
    )))
  }

  const salvar = async (event) => {
    event.preventDefault()
    setSalvando(true)
    setMensagem(null)
    setErro(null)

    try {
      await api.put('/services/working-hours/', expediente
        .filter((dia) => dia.enabled)
        .map(({ weekday, start_time, end_time, slot_interval_minutes }) => ({
          weekday,
          start_time,
          end_time,
          slot_interval_minutes: Number(slot_interval_minutes),
        })))
      setMensagem('Expediente salvo com sucesso.')
    } catch {
      setErro('Não foi possível salvar o expediente. Confira os horários.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Layout title="Expediente" subtitle="Defina quando sua agenda fica disponível">
      {carregando ? (
        <p className="text-center text-sm text-slate-400">Carregando expediente...</p>
      ) : (
        <form onSubmit={salvar} className="working-hours-form">
          <p className="working-hours-intro">
            O intervalo mínimo define de quanto em quanto tempo um novo horário será oferecido.
            A duração do atendimento fica definida em cada procedimento.
          </p>

          {expediente.map((dia) => (
            <div key={dia.weekday} className="working-hours-day">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={dia.enabled}
                  onChange={(event) => alterarDia(dia.weekday, 'enabled', event.target.checked)}
                />
                {dia.label}
              </label>

              {dia.enabled && (
                <div className="working-hours-day-fields">
                  <label className="text-[10px] text-slate-500 uppercase">
                    Início
                    <input type="time" value={dia.start_time.slice(0, 5)} onChange={(event) => alterarDia(dia.weekday, 'start_time', event.target.value)} required className="mt-1 w-full p-2 border border-[#D5EBEB] rounded-lg text-sm" />
                  </label>
                  <label className="text-[10px] text-slate-500 uppercase">
                    Fim
                    <input type="time" value={dia.end_time.slice(0, 5)} onChange={(event) => alterarDia(dia.weekday, 'end_time', event.target.value)} required className="mt-1 w-full p-2 border border-[#D5EBEB] rounded-lg text-sm" />
                  </label>
                  <label className="text-[10px] text-slate-500 uppercase">
                    Intervalo
                    <select value={dia.slot_interval_minutes} onChange={(event) => alterarDia(dia.weekday, 'slot_interval_minutes', event.target.value)} className="mt-1 w-full p-2 border border-[#D5EBEB] rounded-lg text-sm">
                      <option value="30">30 min</option>
                      <option value="60">1 hora</option>
                      <option value="90">1h30</option>
                      <option value="120">2 horas</option>
                    </select>
                  </label>
                </div>
              )}
            </div>
          ))}

          {mensagem && <p className="working-hours-feedback success">{mensagem}</p>}
          {erro && <p className="working-hours-feedback error">{erro}</p>}
          <button type="submit" disabled={salvando} className="working-hours-save">
            {salvando ? 'Salvando...' : 'Salvar expediente'}
          </button>
          <Link to={`/${slug}/dashboard`} className="working-hours-back">Voltar para a agenda</Link>
        </form>
      )}
    </Layout>
  )
}
