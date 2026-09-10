import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'

export default function AgendaPublica() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [agenda, setAgenda] = useState(null)
  const [servicoId, setServicoId] = useState('')
  const [data, setData] = useState('')
  const [horario, setHorario] = useState('')
  const [slots, setSlots] = useState([])
  const [mensagem, setMensagem] = useState(null)
  const [naoEncontrada, setNaoEncontrada] = useState(false)

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

  useEffect(() => {
    if (!servicoId || !data) return
    api.get(`/public/${slug}/availability/`, { params: { service_id: servicoId, date: data } })
      .then(({ data: response }) => setSlots(response.slots))
      .catch(() => setSlots([]))
  }, [data, servicoId, slug])

  const solicitar = async (event) => {
    event.preventDefault()
    if (!localStorage.getItem('accessToken')) {
      navigate('/', { state: { from: `/${slug}` } })
      return
    }
    try {
      await api.post(`/public/${slug}/appointments/`, {
        service: Number(servicoId),
        start_datetime: `${data}T${horario}:00`,
      })
      setMensagem('Solicitação enviada. Aguarde a aprovação da profissional.')
      setHorario('')
    } catch {
      setMensagem('Não foi possível enviar a solicitação.')
    }
  }

  if (!agenda) return <main className="min-h-screen bg-[#F4FBFC] p-6 text-center">{mensagem || 'Carregando...'}{!naoEncontrada && mensagem && <div className="mt-2 text-xs text-slate-400">Verifique se o backend está ativo em http://127.0.0.1:8000.</div>}</main>

  return (
    <main className="min-h-screen bg-[#F4FBFC] p-5 font-['Poppins'] text-[#2C2C2C]">
      <div className="mx-auto max-w-[480px] bg-white rounded-2xl shadow-sm border border-[#D5EBEB] overflow-hidden">
        <header className="bg-gradient-to-br from-[#AFE9F0] to-[#95C6CC] p-8 text-center">
          <h1 className="font-['Playfair_Display'] text-2xl">{agenda.business_name}</h1>
          <p className="text-sm text-[#4A5C5C] mt-1">Agende seu atendimento</p>
        </header>
        <div className="p-6 space-y-5">
          <div>
            <h2 className="font-semibold mb-3">Procedimentos</h2>
            <div className="space-y-2">
              {agenda.services.map((servico) => (
                <button key={servico.id} type="button" onClick={() => setServicoId(String(servico.id))} className={`w-full text-left p-3 rounded-xl border ${String(servico.id) === servicoId ? 'border-[#779FA3] bg-[#F4FBFC]' : 'border-[#D5EBEB]'}`}>
                  <span className="font-medium">{servico.name}</span>
                  <span className="block text-xs text-slate-400">{servico.duration_minutes} min · R$ {servico.price}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={solicitar} className="space-y-3 border-t border-[#D5EBEB] pt-5">
            <input type="date" value={data} onChange={(event) => setData(event.target.value)} required className="w-full p-3 border border-[#D5EBEB] rounded-xl text-sm" />
            {slots.length > 0 && <select value={horario} onChange={(event) => setHorario(event.target.value)} required className="w-full p-3 border border-[#D5EBEB] rounded-xl text-sm"><option value="">Escolha um horário</option>{slots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}</select>}
            <button type="submit" disabled={!servicoId || !horario} className="w-full bg-[#95C6CC] hover:bg-[#779FA3] disabled:opacity-50 text-white p-3 rounded-xl text-sm font-semibold">Solicitar agendamento</button>
          </form>
          {mensagem && <p className="text-center text-sm text-slate-500">{mensagem}</p>}
          <Link to="/" className="block text-center text-sm text-[#779FA3] hover:underline">Entrar</Link>
        </div>
      </div>
    </main>
  )
}