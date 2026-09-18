import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import './AgendaGrid.css'

const SERVICOS_VAZIOS = []

const formatarDuracao = (minutos) => {
  if (!minutos) return ''
  const horas = Math.floor(minutos / 60)
  const restantes = minutos % 60
  return restantes ? `${horas}h${String(restantes).padStart(2, '0')}` : `${horas}h`
}

export default function AgendaGrid({ isProfessional, publicSlug = null, selectedDate, onDateChange, services = SERVICOS_VAZIOS }) {
  const [dataInterna, setDataInterna] = useState(new Date().toISOString().split('T')[0])
  const dataSelecionada = selectedDate ?? dataInterna
  const [agendamentos, setAgendamentos] = useState({})
  const [almoco, setAlmoco] = useState(null)
  const [servicos, setServicos] = useState(services)
  const [clientes, setClientes] = useState([])
  const [clienteManualAtivo, setClienteManualAtivo] = useState(false)
  const [clienteSelecionada, setClienteSelecionada] = useState('')
  const [clienteManual, setClienteManual] = useState({ name: '', email: '', phone: '' })
  const [expediente, setExpediente] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)
  const [horarioSelecionado, setHorarioSelecionado] = useState(null)
  const [modoAlmoco, setModoAlmoco] = useState(false)
  const [agendamentoEditando, setAgendamentoEditando] = useState(null)
  const [duracaoAgendamento, setDuracaoAgendamento] = useState('60')
  const [procedimentosAdicionais, setProcedimentosAdicionais] = useState([])
  const [duracaoAlmoco, setDuracaoAlmoco] = useState('60')
  const [servicoId, setServicoId] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [mensagemModal, setMensagemModal] = useState(null)
  const navigate = useNavigate()

  const dataLocal = new Date(`${dataSelecionada}T00:00:00`)
  const weekday = dataLocal.getDay() === 0 ? 6 : dataLocal.getDay() - 1
  const janelaDoDia = expediente.find((item) => item.weekday === weekday)
  const horarios = []

  if (janelaDoDia) {
    const [horaInicio, minutoInicio] = janelaDoDia.start_time.slice(0, 5).split(':').map(Number)
    const [horaFim, minutoFim] = janelaDoDia.end_time.slice(0, 5).split(':').map(Number)
    const inicio = horaInicio * 60 + minutoInicio
    const fim = horaFim * 60 + minutoFim

    for (let minutos = inicio; minutos < fim; minutos += 60) {
      const horario = `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`
      const almocoInicio = janelaDoDia.lunch_start_time?.slice(0, 5)
      const almocoFim = janelaDoDia.lunch_end_time?.slice(0, 5)
      horarios.push(horario)
    }
  }

  useEffect(() => {
    if (publicSlug || services.length > 0) {
      setServicos(services)
      return
    }

    api.get('/services/')
      .then(({ data }) => setServicos(Array.isArray(data) ? data : data.results || []))
      .catch(() => setErro('Não foi possível carregar os procedimentos.'))
  }, [publicSlug, services])

  useEffect(() => {
    if (!isProfessional) return
    api.get('/auth/clients/')
      .then(({ data }) => setClientes(Array.isArray(data) ? data : data.results || []))
      .catch(() => setErro('Não foi possível carregar as clientes.'))
  }, [isProfessional])

  useEffect(() => {
    const endpoint = publicSlug
      ? `/public/${publicSlug}/working-hours/`
      : '/services/working-hours/'

    api.get(endpoint)
      .then(({ data }) => setExpediente(data))
      .catch(() => setErro('Não foi possível carregar o expediente.'))
  }, [publicSlug])

  useEffect(() => {
    if (publicSlug) return
    api.get('/services/lunch-breaks/', { params: { date: dataSelecionada } })
      .then(({ data }) => setAlmoco(data))
      .catch(() => setAlmoco(null))
  }, [dataSelecionada, publicSlug])

  useEffect(() => {
    let ativo = true

    const carregarAgendamentos = async () => {
      setCarregando(true)
      setErro(null)

      try {
        const response = await api.get(publicSlug ? `/public/${publicSlug}/schedule/` : '/appointments/', {
          params: { date: dataSelecionada }
        })
        const listaAgendamentos = Array.isArray(response.data)
          ? response.data
          : response.data.results || []
        const slotsPublicos = response.data.slots || []
        if (publicSlug) setAlmoco(response.data.lunch)
        const agendamentosPorHorario = publicSlug
          ? slotsPublicos.reduce((agenda, slot) => {
            agenda[slot.time] = slot.available
              ? null
              : { status: 'occupied', isLunch: slot.is_lunch }
            return agenda
          }, {})
          : listaAgendamentos.reduce((agenda, agendamento) => {
          const inicio = new Date(agendamento.start_datetime)
          const fim = agendamento.end_datetime ? new Date(agendamento.end_datetime) : null
          const duracao = fim
            ? Math.max(1, Math.round((fim.getTime() - inicio.getTime()) / 60000))
            : agendamento.service_duration_minutes || 60
          const blocos = Math.ceil(duracao / 60)
          for (let bloco = 0; bloco < blocos; bloco += 1) {
            const horario = new Date(inicio.getTime() + bloco * 60 * 60 * 1000)
              .toTimeString().slice(0, 5)
            agenda[horario] = {
              id: agendamento.id || agendamento.appointment_id,
              status: agendamento.status,
              cliente: agendamento.client_name,
              procedimento: agendamento.service_name,
              duracao,
              duracaoFormatada: formatarDuracao(duracao),
              serviceId: agendamento.service,
              additionalServiceIds: agendamento.additional_service_ids || [],
              inicio: bloco === 0,
              fim: bloco === blocos - 1,
              unico: blocos === 1
            }
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
  }, [dataSelecionada, publicSlug])

  const handleCliqueHorario = (horario) => {
    const conflito = agendamentos[horario]
    const ehAlmoco = conflito?.isLunch || (isProfessional && almoco && horario >= almoco.start_time.slice(0, 5) && horario < almoco.end_time.slice(0, 5))
    if (conflito && !ehAlmoco && !isProfessional) return
    if (conflito && !ehAlmoco && isProfessional) {
      setAgendamentoEditando(conflito)
      setServicoId(String(conflito.serviceId))
      setDuracaoAgendamento(String(conflito.duracao || 60))
      setProcedimentosAdicionais(conflito.additionalServiceIds || [])
    } else {
      setAgendamentoEditando(null)
      setDuracaoAgendamento('60')
      setProcedimentosAdicionais([])
    }

    setHorarioSelecionado(horario)
    setModoAlmoco(Boolean(ehAlmoco && isProfessional))
    setDuracaoAlmoco('60')
    if (!conflito || ehAlmoco) setServicoId('')
    setMensagemModal(null)
  }

  const marcarAlmoco = async () => {
    const hora = Number(horarioSelecionado.slice(0, 2))
    const minuto = Number(horarioSelecionado.slice(3, 5))
    const fim = new Date(2000, 0, 1, hora, minuto + Number(duracaoAlmoco))
    const fimFormatado = `${String(fim.getHours()).padStart(2, '0')}:${String(fim.getMinutes()).padStart(2, '0')}`
    setSalvando(true)
    setMensagemModal(null)
    try {
      const { data } = await api.post('/services/lunch-breaks/', {
        date: dataSelecionada,
        start_time: `${horarioSelecionado}:00`,
        end_time: `${fimFormatado}:00`,
      })
      setAlmoco(data)
      setMensagemModal('Almoço definido para este horário.')
    } catch (error) {
      const detalhes = error.response?.data
      const mensagem = detalhes && typeof detalhes === 'object' ? Object.values(detalhes).flat().join(' ') : null
      setMensagemModal(mensagem || 'Não foi possível definir o almoço.')
    } finally {
      setSalvando(false)
    }
  }

  const excluirAlmoco = async () => {
    setSalvando(true)
    setMensagemModal(null)
    try {
      await api.delete('/services/lunch-breaks/', { params: { date: dataSelecionada } })
      setAlmoco(null)
      setMensagemModal('Almoço excluído deste dia.')
    } catch {
      setMensagemModal('Não foi possível excluir o almoço.')
    } finally {
      setSalvando(false)
    }
  }

  const salvarEdicaoAgendamento = async () => {
    const agendamentoId = agendamentoEditando?.id || agendamentoEditando?.appointmentId
    if (!agendamentoId) {
      setMensagemModal('Não foi possível identificar este agendamento. Atualize a agenda e tente novamente.')
      return
    }
    setSalvando(true)
    setMensagemModal(null)
    try {
      await api.patch(`/appointments/${agendamentoId}/`, {
        duration_minutes_override: Number(duracaoAgendamento),
        additional_services: procedimentosAdicionais,
      })
      setMensagemModal('Agendamento atualizado com sucesso.')
      setAgendamentos((atuais) => Object.fromEntries(
        Object.entries(atuais).filter(([, agendamento]) => agendamento.id !== agendamentoEditando.id)
      ))
      setTimeout(() => window.location.reload(), 500)
    } catch (error) {
      const detalhes = error.response?.data
      const mensagem = detalhes && typeof detalhes === 'object' ? Object.values(detalhes).flat().join(' ') : null
      setMensagemModal(mensagem || 'Não foi possível atualizar o agendamento.')
    } finally {
      setSalvando(false)
    }
  }

  const fecharModal = () => {
    if (salvando) return
    setHorarioSelecionado(null)
    setModoAlmoco(false)
    setAgendamentoEditando(null)
    setClienteManualAtivo(false)
    setClienteSelecionada('')
    setClienteManual({ name: '', email: '', phone: '' })
    setMensagemModal(null)
  }

  const confirmarAgendamento = async (event) => {
    event.preventDefault()
    if (!servicoId || !horarioSelecionado) return

    if (!isProfessional && !localStorage.getItem('accessToken')) {
      navigate('/', { state: { from: window.location.pathname } })
      return
    }

    setSalvando(true)
    setMensagemModal(null)

    try {
      let clientId = null
      if (isProfessional) {
        if (clienteManualAtivo) {
          const { data } = await api.post('/auth/clients/', clienteManual)
          clientId = data.id
          setClientes((atuais) => [...atuais, data])
        } else {
          clientId = Number(clienteSelecionada)
        }
        if (!clientId) {
          setMensagemModal('Escolha uma cliente ou ative o modo cliente manual.')
          setSalvando(false)
          return
        }
      }
      await api.post(
        publicSlug ? `/public/${publicSlug}/appointments/` : '/appointments/',
        { service: Number(servicoId), start_datetime: `${dataSelecionada}T${horarioSelecionado}:00`, ...(isProfessional ? { client: clientId } : {}) }
      )

      setAgendamentos((atuais) => ({
        ...atuais,
        [horarioSelecionado]: {
          status: isProfessional ? 'scheduled' : 'pending',
          procedimento: servicos.find((servico) => String(servico.id) === servicoId)?.name
        }
      }))
      setMensagemModal(isProfessional ? 'Agendamento criado com sucesso.' : 'Solicitação enviada. Aguarde a aprovação da profissional.')
    } catch (error) {
      const detalhes = error.response?.data
      const mensagem = detalhes && typeof detalhes === 'object'
        ? Object.values(detalhes).flat().join(' ')
        : null
      setMensagemModal(mensagem || 'Não foi possível salvar o agendamento.')
    } finally {
      setSalvando(false)
    }
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

  const recusarAgendamento = async (id) => {
    if (!window.confirm('Deseja recusar esta solicitação de agendamento?')) return
    try {
      await api.patch(`/appointments/${id}/reject/`)
      setAgendamentos((atuais) => Object.fromEntries(
        Object.entries(atuais).filter(([, agendamento]) => agendamento.id !== id)
      ))
    } catch {
      setErro('Não foi possível recusar o agendamento.')
    }
  }

  return (
    <div className="agenda-grid">
      {/* Seletor de Datas */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-['Playfair_Display'] font-semibold">Agenda Diária</h2>
        {!publicSlug && <input
          type="date" 
          value={dataSelecionada}
          onChange={(e) => (onDateChange ? onDateChange(e.target.value) : setDataInterna(e.target.value))}
          // Lógica restritiva aplicada aqui baseada no perfil
          className="border border-[#D5EBEB] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#95C6CC]"
        />}
      </div>

      {/* Tabela Inspirada na Imagem */}
      <div className="agenda-grid-table">
        <div className="agenda-grid-header">
          <div>Horário</div>
          <div>Cliente / Procedimento</div>
          <div className="text-center">Status</div>
        </div>

        <div className="agenda-grid-scroll">
          {horarios.length === 0 && (
            <p className="border-t border-[#D5EBEB] p-4 text-sm text-slate-400">
              Nenhum horário configurado para este dia.
            </p>
          )}
          {horarios.map((horario) => {
            const ocupado = agendamentos[horario]
            const ehAlmoco = ocupado?.isLunch || (isProfessional && almoco && horario >= almoco.start_time.slice(0, 5) && horario < almoco.end_time.slice(0, 5))
            const item = ehAlmoco && !ocupado ? { isLunch: true, status: 'lunch' } : ocupado
            
            return (
              <div
                key={horario}
                onClick={() => handleCliqueHorario(horario)}
                onKeyDown={(event) => {
                  if ((event.key === 'Enter' || event.key === ' ') && (!item || (item.isLunch && isProfessional))) {
                    event.preventDefault()
                    handleCliqueHorario(horario)
                  }
                }}
                role="button"
                tabIndex={item && (!item.isLunch || !isProfessional) ? -1 : 0}
                className={`agenda-grid-row text-sm ${item?.isLunch ? 'agenda-grid-row-lunch' : item ? (item.unico ? 'agenda-grid-row-single' : item.inicio ? 'agenda-grid-row-start' : item.fim ? 'agenda-grid-row-end' : 'agenda-grid-row-middle') : ''}`}
              >
                <div className="font-medium text-slate-500">{horario}</div>
                <div className="text-slate-700">
                  {item?.isLunch ? <div className="agenda-lunch-label">Almoço</div> : item && !publicSlug ? (
                    <>
                      {item.inicio ? (
                        <>
                          <div>{item.cliente}</div>
                          <div className="text-xs text-slate-400">{item.procedimento} · {item.duracaoFormatada}</div>
                        </>
                      ) : <div className="text-xs text-slate-400">Em atendimento</div>}
                    </>
                  ) : <span className={item ? 'text-red-400' : 'text-slate-300'}>{item ? 'Indisponível' : 'Disponível'}</span>}
                </div>
                <div className="agenda-grid-status">
                  {!publicSlug && item?.status === 'aguardando_aprovacao' && (
                    <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs font-semibold">
                      Em Análise
                    </span>
                  )}
                  {!publicSlug && item?.status === 'pending' && isProfessional && (
                    <div className="flex gap-1">
                      <button type="button" onClick={(event) => { event.stopPropagation(); aprovarAgendamento(item.id) }} className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-semibold">
                        Aprovar
                      </button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); recusarAgendamento(item.id) }} className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-semibold">
                        Recusar
                      </button>
                    </div>
                  )}
                  {!publicSlug && item?.status === 'scheduled' && (
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

      {horarioSelecionado && (
        <div className="agenda-modal-backdrop" role="presentation" onMouseDown={fecharModal}>
          <section className="agenda-modal" role="dialog" aria-modal="true" aria-labelledby="agenda-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="agenda-modal-heading">
              <div>
                <p className="agenda-modal-kicker">{modoAlmoco ? 'Configurar almoço' : agendamentoEditando ? 'Editar agendamento' : 'Novo agendamento'}</p>
                <h3 id="agenda-modal-title">{dataSelecionada.split('-').reverse().join('/')} às {horarioSelecionado}</h3>
              </div>
              <button type="button" className="agenda-modal-close" onClick={fecharModal} aria-label="Fechar">×</button>
            </div>

            {mensagemModal ? (
              <div className="agenda-modal-feedback">
                <p>{mensagemModal}</p>
                <button type="button" onClick={fecharModal}>Voltar para a agenda</button>
              </div>
            ) : (
              <form onSubmit={confirmarAgendamento} className="agenda-modal-form">
                {modoAlmoco ? (
                  <>
                    <p className="agenda-modal-description">Escolha por quanto tempo o almoço ficará bloqueado.</p>
                    <label className="agenda-lunch-duration">Duração do almoço
                      <select value={duracaoAlmoco} onChange={(event) => setDuracaoAlmoco(event.target.value)}>
                        <option value="30">30 minutos</option>
                        <option value="60">1 hora</option>
                        <option value="90">1h30</option>
                        <option value="120">2 horas</option>
                      </select>
                    </label>
                    <button type="button" className="agenda-lunch-action" onClick={marcarAlmoco} disabled={salvando}>
                      {salvando ? 'Salvando...' : 'Configurar este horário'}
                    </button>
                    <button type="button" className="agenda-lunch-delete" onClick={excluirAlmoco} disabled={salvando}>
                      Excluir almoço deste dia
                    </button>
                  </>
                ) : agendamentoEditando ? (
                  <>
                    <p className="agenda-modal-description">Ajuste somente este atendimento. O cadastro original não será alterado.</p>
                    <label className="agenda-lunch-duration">Duração deste agendamento
                      <select value={duracaoAgendamento} onChange={(event) => setDuracaoAgendamento(event.target.value)}>
                        <option value="30">30 minutos</option>
                        <option value="60">1 hora</option>
                        <option value="90">1h30</option>
                        <option value="120">2 horas</option>
                        <option value="180">3 horas</option>
                        <option value="210">3h30</option>
                      </select>
                    </label>
                    <div className="agenda-service-list agenda-additional-services">
                      <p className="agenda-modal-description">Adicionar procedimento ao atendimento</p>
                      {servicos.filter((servico) => String(servico.id) !== String(agendamentoEditando.serviceId)).map((servico) => (
                        <label key={servico.id} className="agenda-service-option">
                          <input
                            type="checkbox"
                            checked={procedimentosAdicionais.includes(servico.id)}
                            onChange={() => setProcedimentosAdicionais((atuais) => atuais.includes(servico.id) ? atuais.filter((id) => id !== servico.id) : [...atuais, servico.id])}
                          />
                          <span><strong>{servico.name}</strong><small>{formatarDuracao(servico.duration_minutes)} · R$ {servico.price}</small></span>
                        </label>
                      ))}
                    </div>
                    <button type="button" className="agenda-modal-submit" onClick={salvarEdicaoAgendamento} disabled={salvando}>
                      {salvando ? 'Salvando...' : 'Salvar alterações deste agendamento'}
                    </button>
                  </>
                ) : <>
                <p className="agenda-modal-description">Escolha o procedimento para reservar este horário.</p>
                {isProfessional && (
                  <div className="agenda-client-picker">
                    <label className="agenda-client-toggle">
                      <input type="checkbox" checked={clienteManualAtivo} onChange={(event) => setClienteManualAtivo(event.target.checked)} />
                      <span>Cliente manual</span>
                    </label>
                    {clienteManualAtivo ? (
                      <div className="agenda-client-fields">
                        <input placeholder="Nome completo" value={clienteManual.name} onChange={(event) => setClienteManual((atual) => ({ ...atual, name: event.target.value }))} required />
                        <input type="email" placeholder="E-mail" value={clienteManual.email} onChange={(event) => setClienteManual((atual) => ({ ...atual, email: event.target.value }))} required />
                        <input placeholder="Telefone" value={clienteManual.phone} onChange={(event) => setClienteManual((atual) => ({ ...atual, phone: event.target.value }))} required />
                      </div>
                    ) : (
                      <select value={clienteSelecionada} onChange={(event) => setClienteSelecionada(event.target.value)} required>
                        <option value="">Selecione uma cliente cadastrada</option>
                        {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.name} · {cliente.phone || cliente.email}</option>)}
                      </select>
                    )}
                  </div>
                )}
                <div className="agenda-service-list">
                  {servicos.length === 0 ? (
                    <p className="agenda-modal-empty">Nenhum procedimento cadastrado.</p>
                  ) : servicos.map((servico) => (
                    <label key={servico.id} className={`agenda-service-option ${String(servico.id) === servicoId ? 'selected' : ''}`}>
                      <input type="radio" name="service" value={servico.id} checked={String(servico.id) === servicoId} onChange={(event) => setServicoId(event.target.value)} />
                      <span>
                        <strong>{servico.name}</strong>
                        <small>{formatarDuracao(servico.duration_minutes)} · R$ {servico.price}</small>
                      </span>
                    </label>
                  ))}
                </div>
                {isProfessional && <button type="button" className="agenda-lunch-action" onClick={marcarAlmoco} disabled={salvando}>Marcar este horário como almoço</button>}
                <button type="submit" className="agenda-modal-submit" disabled={!servicoId || salvando}>
                  {salvando ? 'Salvando...' : isProfessional ? 'Confirmar agendamento' : 'Solicitar horário'}
                </button>
                </>}
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  )
}