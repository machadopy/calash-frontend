import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import Layout from '../components/Layout'
import AnamnesisForm from '../components/AnamnesisForm'
import './Anamneses.css'

const hoje = () => new Date().toISOString().split('T')[0]

const formatarData = (valor) => new Date(`${valor}T00:00:00`).toLocaleDateString('pt-BR')

const obterLista = (data) => Array.isArray(data) ? data : data.results || []

export default function Anamneses() {
  const { slug } = useParams()
  const [dataSelecionada, setDataSelecionada] = useState(hoje)
  const [fichas, setFichas] = useState([])
  const [clientes, setClientes] = useState([])
  const [clienteSelecionada, setClienteSelecionada] = useState('')
  const [clienteManualAtivo, setClienteManualAtivo] = useState(false)
  const [clienteManual, setClienteManual] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const [errosFormulario, setErrosFormulario] = useState(null)

  const carregarFichas = async () => {
    setCarregando(true)
    setErro(null)
    try {
      const { data } = await api.get('/anamneses/', { params: { date: dataSelecionada } })
      setFichas(obterLista(data))
    } catch {
      setErro('Não foi possível carregar as fichas deste dia.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    api.get('/auth/clients/')
      .then(({ data }) => setClientes(obterLista(data)))
      .catch(() => setErro('Não foi possível carregar as clientes.'))
  }, [])

  useEffect(() => {
    carregarFichas()
  }, [dataSelecionada])

  const mudarDia = (quantidade) => {
    const data = new Date(`${dataSelecionada}T00:00:00`)
    data.setDate(data.getDate() + quantidade)
    setDataSelecionada(data.toISOString().split('T')[0])
  }

  const abrirFormulario = () => {
    setErrosFormulario(null)
    setMostrarFormulario(true)
  }

  const fecharFormulario = () => {
    if (salvando) return
    setMostrarFormulario(false)
    setErrosFormulario(null)
    setClienteSelecionada('')
    setClienteManualAtivo(false)
    setClienteManual('')
  }

  const criarFicha = async (anamnesis) => {
    setSalvando(true)
    setErrosFormulario(null)

    try {
      let clientId = clienteSelecionada ? Number(clienteSelecionada) : null
      if (clienteManualAtivo) {
        const { data } = await api.post('/auth/clients/', { name: clienteManual })
        clientId = data.id
      }

      await api.post('/anamneses/', { ...anamnesis, client: clientId, date: dataSelecionada })
      await carregarFichas()
      fecharFormulario()
    } catch (error) {
      setErrosFormulario(error.response?.data || { form: 'Não foi possível salvar a ficha.' })
    } finally {
      setSalvando(false)
    }
  }

  const clienteNome = (ficha) => ficha.full_name || ficha.client_name || ficha.client?.name || 'Cliente sem nome'

  const baixarFicha = async (ficha) => {
    if (!ficha.id) return
    try {
      const response = await api.get(`/anamneses/${ficha.id}/pdf/`, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `anamnese-${ficha.id}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      const responseData = error.response?.data
      let message = 'Não foi possível baixar a ficha de anamnese.'
      if (responseData instanceof Blob) {
        try {
          const text = await responseData.text()
          const details = JSON.parse(text)
          message = details.detail || message
        } catch {
          // Mantém a mensagem padrão quando a resposta não é JSON.
        }
      } else if (responseData?.detail) {
        message = responseData.detail
      }
      console.error('Falha ao baixar anamnese:', message)
      setErro(message)
    }
  }

  const baixarPdf = baixarFicha

  return (
    <Layout title="Fichas de anamnese" subtitle="Organize as fichas por dia" wide>
      <div className="anamneses-page">
        <div className="anamneses-toolbar">
          <button type="button" onClick={() => mudarDia(-1)} aria-label="Dia anterior">&larr;</button>
          <label>Dia selecionado<input type="date" value={dataSelecionada} onChange={(event) => setDataSelecionada(event.target.value)} /></label>
          <button type="button" onClick={() => mudarDia(1)} aria-label="Próximo dia">&rarr;</button>
        </div>

        <div className="anamneses-heading-row">
          <div>
            <p className="anamneses-kicker">Fichas do dia</p>
            <h2>{formatarData(dataSelecionada)}</h2>
          </div>
          <button type="button" className="anamneses-new" onClick={abrirFormulario}>Nova ficha</button>
        </div>

        {mostrarFormulario && (
          <section className="anamneses-editor">
            <div className="anamneses-editor-heading">
              <h3>Nova ficha de anamnese</h3>
              <button type="button" onClick={fecharFormulario} disabled={salvando}>Fechar</button>
            </div>
            <div className="anamneses-client-picker">
              <label className="anamneses-client-check"><input type="checkbox" checked={clienteManualAtivo} onChange={(event) => { setClienteManualAtivo(event.target.checked); setClienteSelecionada('') }} /> Cliente manual</label>
              {clienteManualAtivo ? (
                <input value={clienteManual} onChange={(event) => setClienteManual(event.target.value)} placeholder="Nome da cliente" />
              ) : (
                <select value={clienteSelecionada} onChange={(event) => setClienteSelecionada(event.target.value)}>
                  <option value="">Selecione uma cliente</option>
                  {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.name}</option>)}
                </select>
              )}
            </div>
            {errosFormulario?.form && <p className="anamneses-error">{errosFormulario.form}</p>}
            <AnamnesisForm
              clientId={clienteManualAtivo ? null : Number(clienteSelecionada) || null}
              onSubmit={criarFicha}
              onCancel={fecharFormulario}
              submitting={salvando}
              serverErrors={errosFormulario}
            />
          </section>
        )}

        {erro && <p className="anamneses-error">{erro}</p>}
        {carregando && <p className="anamneses-feedback">Carregando fichas...</p>}
        {!carregando && !erro && fichas.length === 0 && <p className="anamneses-feedback">Nenhuma ficha registrada neste dia.</p>}
        <div className="anamneses-list">
          {fichas.map((ficha) => (
            <article className="anamneses-card" key={ficha.id || `${ficha.full_name}-${ficha.created_at}`} onClick={() => baixarPdf(ficha)} role="button" tabIndex="0" onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') baixarPdf(ficha) }}>
              <div className="anamneses-card-heading">
                <button type="button" className="anamneses-card-download" onClick={() => baixarFicha(ficha)}>{clienteNome(ficha)}</button>
                <span>{ficha.signed_date ? formatarData(ficha.signed_date) : 'Sem data de assinatura'}</span>
              </div>
              <p>WhatsApp: {ficha.whatsapp || 'Não informado'}</p>
              <p>Instagram: {ficha.instagram || 'Não informado'}</p>
              <p>Profissão: {ficha.profession || 'Não informado'}</p>
            </article>
          ))}
        </div>
      </div>
    </Layout>
  )
}