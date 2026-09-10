import { useEffect, useState } from 'react'
import api from '../services/api'

export default function AgendaGrid({ isProfessional }) {
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0])
  const [agendamentos, setAgendamentos] = useState({})
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)

  const horarios = ['10:00', '13:30', '17:00', '20:30']

  useEffect(() => {
    let ativo = true

    const carregarAgendamentos = async () => {
      setCarregando(true)
      setErro(null)

      try {
        const response = await api.get('/appointments/', {
          params: { date: dataSelecionada }
        })
        const agendamentosPorHorario = response.data.reduce((agenda, agendamento) => {
          const horario = new Date(agendamento.start_datetime).toTimeString().slice(0, 5)
          agenda[horario] = {
            id: agendamento.id,
            status: agendamento.status,
            cliente: agendamento.client_name,
            procedimento: agendamento.service_name
          }
          return agenda
        }, {})

        if (ativo) setAgendamentos(agendamentosPorHorario)
      } catch {
        if (ativo) {
          setAgendamentos({})
          setErro('Não foi possível carregar os agendamentos.')
        }
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregarAgendamentos()
    return () => { ativo = false }
  }, [dataSelecionada])

  const handleCliqueHorario = (horario) => {
    const conflito = agendamentos[horario]
    if (!isProfessional && conflito && conflito.status === 'aguardando') {
      const confirma = window.confirm("⚠️ Este horário já possui um pedido em análise. Seu agendamento pode ser recusado ou remanejado. Deseja continuar?")
      if (!confirma) return
    }
    // Aqui abriria o Modal de Formulário
  }

  const aprovarAgendamento = async (id) => {
    try {
      await api.patch(`/appointments/${id}/approve/`)
      setAgendamentos((atuais) => Object.fromEntries(
        Object.entries(atuais).map(([horario, agendamento]) => [
          horario,
          agendamento.id === id ? { ...agendamento, status: 'scheduled' } : agendamento
        ])
      ))
    } catch {
      setErro('Não foi possível aprovar o agendamento.')
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#D5EBEB]">
      {/* Seletor de Datas */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-['Playfair_Display'] font-semibold">Agenda Diária</h2>
        <input 
          type="date" 
          value={dataSelecionada}
          onChange={(e) => setDataSelecionada(e.target.value)}
          // Lógica restritiva aplicada aqui baseada no perfil
          className="border border-[#D5EBEB] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#95C6CC]"
        />
      </div>

      {/* Tabela Inspirada na Imagem */}
      <div className="flex flex-col border border-[#D5EBEB] rounded-lg overflow-hidden">
        <div className="grid grid-cols-4 bg-[#F4FBFC] font-semibold text-[#779FA3] text-xs p-3 uppercase">
          <div>Horário</div>
          <div className="col-span-2">Cliente / Procedimento</div>
          <div className="text-center">Status</div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {horarios.map((horario) => {
            const ocupado = agendamentos[horario]
            
            return (
              <div 
                key={horario}
                onClick={() => handleCliqueHorario(horario)}
                className="grid grid-cols-4 border-t border-[#D5EBEB] p-3 text-sm hover:bg-slate-50 cursor-pointer transition-colors items-center"
              >
                <div className="font-medium text-slate-500">{horario}</div>
                <div className="col-span-2 text-slate-700">
                  {ocupado ? (
                    <>
                      <div>{ocupado.cliente}</div>
                      <div className="text-xs text-slate-400">{ocupado.procedimento}</div>
                    </>
                  ) : <span className="text-slate-300 italic">Disponível</span>}
                </div>
                <div className="text-center">
                  {ocupado?.status === 'aguardando_aprovacao' && (
                    <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs font-semibold">
                      Em Análise
                    </span>
                  )}
                  {ocupado?.status === 'pending' && isProfessional && (
                    <button type="button" onClick={(event) => { event.stopPropagation(); aprovarAgendamento(ocupado.id) }} className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs font-semibold">
                      Aprovar
                    </button>
                  )}
                  {ocupado?.status === 'scheduled' && (
                    <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-semibold">
                      Agendado
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {carregando && <p className="mt-3 text-xs text-slate-400">Carregando agendamentos...</p>}
      {erro && <p className="mt-3 text-xs text-red-500">{erro}</p>}
    </div>
  )
}