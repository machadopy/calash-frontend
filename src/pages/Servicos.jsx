import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'
import Layout from '../components/Layout'

const formularioInicial = {
  name: '',
  description: '',
  duration_minutes: '210',
  price: ''
}

const cupomInicial = {
  code: '',
  discount_type: 'percentage',
  discount_value: ''
}

const formatarDuracao = (minutos) => {
  const horas = Math.floor(minutos / 60)
  const restantes = minutos % 60
  return restantes ? `${horas}h${String(restantes).padStart(2, '0')}` : `${horas}h`
}

const mensagemDoErro = (error, padrao) => {
  if (error.response?.status === 404) return 'O backend ainda não possui a rota de cupons (/api/coupons/).'
  const detalhes = error.response?.data
  if (typeof detalhes === 'string' && !detalhes.trim().toLowerCase().startsWith('<!doctype')) return detalhes
  if (detalhes && typeof detalhes === 'object') {
    return Object.entries(detalhes)
      .map(([campo, mensagem]) => `${campo}: ${Array.isArray(mensagem) ? mensagem.join(', ') : mensagem}`)
      .join(' | ')
  }
  return padrao
}

export default function Servicos() {
  const { slug } = useParams()
  const [servicos, setServicos] = useState([])
  const [cupons, setCupons] = useState([])
  const [formulario, setFormulario] = useState(formularioInicial)
  const [formularioCupom, setFormularioCupom] = useState(cupomInicial)
  const [servicoEditandoId, setServicoEditandoId] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [carregandoCupons, setCarregandoCupons] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvandoCupom, setSalvandoCupom] = useState(false)
  const [erro, setErro] = useState(null)
  const [erroCupom, setErroCupom] = useState(null)

  const carregarServicos = async () => {
    try {
      const response = await api.get('/services/')
      setServicos(Array.isArray(response.data) ? response.data : response.data.results || [])
    } catch {
      setErro('Não foi possível carregar os procedimentos.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => carregarServicos(), 0)
    return () => clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    api.get('/coupons/')
      .then(({ data }) => setCupons(Array.isArray(data) ? data : data.results || []))
      .catch((error) => setErroCupom(mensagemDoErro(error, 'Não foi possível carregar os cupons.')))
      .finally(() => setCarregandoCupons(false))
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormulario((atual) => ({ ...atual, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSalvando(true)
    setErro(null)

    try {
      const payload = {
        ...formulario,
        duration_minutes: Number(formulario.duration_minutes),
        price: Number(formulario.price)
      }
      const response = servicoEditandoId
        ? await api.patch(`/services/${servicoEditandoId}/`, payload)
        : await api.post('/services/', payload)
      setServicos((atuais) => servicoEditandoId
        ? atuais.map((servico) => servico.id === servicoEditandoId ? response.data : servico)
        : [...atuais, response.data])
      setFormulario(formularioInicial)
      setServicoEditandoId(null)
    } catch {
      setErro(`Não foi possível ${servicoEditandoId ? 'editar' : 'salvar'} o procedimento. Confira os dados.`)
    } finally {
      setSalvando(false)
    }
  }

  const editarServico = (servico) => {
    setServicoEditandoId(servico.id)
    setFormulario({
      name: servico.name,
      description: servico.description || '',
      duration_minutes: String(servico.duration_minutes),
      price: String(servico.price)
    })
    setErro(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelarEdicao = () => {
    setServicoEditandoId(null)
    setFormulario(formularioInicial)
    setErro(null)
  }

  const excluirServico = async (servico) => {
    if (!window.confirm(`Deseja excluir o procedimento "${servico.name}"? Essa ação não pode ser desfeita.`)) return

    setErro(null)
    try {
      await api.delete(`/services/${servico.id}/`)
      setServicos((atuais) => atuais.filter((item) => item.id !== servico.id))
      if (servicoEditandoId === servico.id) cancelarEdicao()
    } catch {
      setErro('Não foi possível excluir o procedimento.')
    }
  }

  const handleCupomChange = (event) => {
    const { name, value } = event.target
    setFormularioCupom((atual) => ({ ...atual, [name]: value }))
  }

  const handleCupomSubmit = async (event) => {
    event.preventDefault()
    setSalvandoCupom(true)
    setErroCupom(null)

    try {
      const response = await api.post('/coupons/', {
        ...formularioCupom,
        code: formularioCupom.code.trim().toUpperCase(),
        discount_value: Number(formularioCupom.discount_value)
      })
      setCupons((atuais) => [...atuais, response.data])
      setFormularioCupom(cupomInicial)
    } catch (error) {
      setErroCupom(mensagemDoErro(error, 'Não foi possível salvar o cupom. Confira os dados.'))
    } finally {
      setSalvandoCupom(false)
    }
  }

  return (
    <Layout title="Procedimentos" subtitle="Cadastre os procedimentos da sua lash">
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-[#667777] mb-2 uppercase">Nome</label>
            <input name="name" value={formulario.name} onChange={handleChange} required maxLength={120} className="w-full p-3 border border-[#D5EBEB] rounded-xl text-sm outline-none focus:border-[#95C6CC]" placeholder="Ex.: Volume Russo" />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#667777] mb-2 uppercase">Descrição</label>
            <textarea name="description" value={formulario.description} onChange={handleChange} rows="3" className="w-full p-3 border border-[#D5EBEB] rounded-xl text-sm outline-none focus:border-[#95C6CC]" placeholder="Detalhes do procedimento" />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#667777] mb-2 uppercase">Tempo de execução (min)</label>
            <input type="number" name="duration_minutes" value={formulario.duration_minutes} onChange={handleChange} min="1" required className="w-full p-3 border border-[#D5EBEB] rounded-xl text-sm outline-none focus:border-[#95C6CC]" />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#667777] mb-2 uppercase">Preço (R$)</label>
            <input type="number" name="price" value={formulario.price} onChange={handleChange} min="0" step="0.01" required className="w-full p-3 border border-[#D5EBEB] rounded-xl text-sm outline-none focus:border-[#95C6CC]" placeholder="0,00" />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={salvando} className="flex-1 bg-[#95C6CC] hover:bg-[#779FA3] text-white p-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-70">
              {salvando ? 'Salvando...' : servicoEditandoId ? 'Salvar alterações' : 'Cadastrar procedimento'}
            </button>
            {servicoEditandoId && <button type="button" onClick={cancelarEdicao} className="border border-[#779FA3] text-[#779FA3] px-4 rounded-xl text-sm font-semibold">Cancelar</button>}
          </div>
        </form>

        {erro && <p className="text-xs text-red-500 text-center">{erro}</p>}

        <section className="border border-[#D5EBEB] rounded-xl overflow-hidden">
          <div className="bg-[#F4FBFC] p-3 text-xs font-semibold text-[#779FA3] uppercase">Procedimentos cadastrados</div>
          {carregando ? (
            <p className="p-4 text-sm text-slate-400">Carregando...</p>
          ) : servicos.length === 0 ? (
            <p className="p-4 text-sm text-slate-400 italic">Nenhum procedimento cadastrado.</p>
          ) : (
            servicos.map((servico) => (
              <div key={servico.id} className="border-t border-[#D5EBEB] p-3 flex justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium text-slate-700">{servico.name}</p>
                  <p className="text-xs text-slate-400">{formatarDuracao(servico.duration_minutes)} · {servico.description || 'Sem descrição'}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <p className="font-medium text-slate-600">R$ {servico.price}</p>
                  <div className="flex gap-2 text-xs">
                    <button type="button" onClick={() => editarServico(servico)} className="text-[#779FA3] hover:underline">Editar</button>
                    <button type="button" onClick={() => excluirServico(servico)} className="text-red-500 hover:underline">Excluir</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="border border-[#D5EBEB] rounded-xl overflow-hidden">
          <div className="bg-[#F4FBFC] p-3 text-xs font-semibold text-[#779FA3] uppercase">Cupons de desconto</div>
          <form onSubmit={handleCupomSubmit} className="space-y-4 p-4">
            <div>
              <label className="block text-[11px] font-medium text-[#667777] mb-2 uppercase">Código do cupom</label>
              <input name="code" value={formularioCupom.code} onChange={handleCupomChange} required maxLength={30} className="w-full p-3 border border-[#D5EBEB] rounded-xl text-sm uppercase outline-none focus:border-[#95C6CC]" placeholder="Ex.: BEMVINDO10" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#667777] mb-2 uppercase">Tipo</label>
                <select name="discount_type" value={formularioCupom.discount_type} onChange={handleCupomChange} className="w-full p-3 border border-[#D5EBEB] rounded-xl text-sm outline-none focus:border-[#95C6CC]">
                  <option value="percentage">Porcentagem</option>
                  <option value="fixed">Valor fixo</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#667777] mb-2 uppercase">Desconto</label>
                <input type="number" name="discount_value" value={formularioCupom.discount_value} onChange={handleCupomChange} min="0" step="0.01" required className="w-full p-3 border border-[#D5EBEB] rounded-xl text-sm outline-none focus:border-[#95C6CC]" placeholder={formularioCupom.discount_type === 'percentage' ? '10' : '10,00'} />
              </div>
            </div>

            <button type="submit" disabled={salvandoCupom} className="w-full bg-[#95C6CC] hover:bg-[#779FA3] text-white p-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-70">
              {salvandoCupom ? 'Salvando...' : 'Cadastrar cupom'}
            </button>
          </form>

          {erroCupom && <p className="px-4 pb-3 text-xs text-red-500 text-center">{erroCupom}</p>}
          {carregandoCupons ? (
            <p className="border-t border-[#D5EBEB] p-4 text-sm text-slate-400">Carregando...</p>
          ) : erroCupom ? null : cupons.length === 0 ? (
            <p className="border-t border-[#D5EBEB] p-4 text-sm text-slate-400 italic">Nenhum cupom cadastrado.</p>
          ) : (
            cupons.map((cupom) => (
              <div key={cupom.id} className="border-t border-[#D5EBEB] p-3 flex justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium text-slate-700">{cupom.code}</p>
                  <p className="text-xs text-slate-400">{cupom.discount_type === 'percentage' ? `${cupom.discount_value}% de desconto` : `R$ ${cupom.discount_value} de desconto`}</p>
                </div>
              </div>
            ))
          )}
        </section>

        <Link to={`/${slug}/dashboard`} className="block text-center text-sm text-[#779FA3] hover:underline">Voltar para a agenda</Link>
      </div>
    </Layout>
  )
}