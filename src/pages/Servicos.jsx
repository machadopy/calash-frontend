import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import Layout from '../components/Layout'

const formularioInicial = {
  name: '',
  description: '',
  duration_minutes: '210',
  price: ''
}

export default function Servicos() {
  const [servicos, setServicos] = useState([])
  const [formulario, setFormulario] = useState(formularioInicial)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  const carregarServicos = async () => {
    try {
      const response = await api.get('/services/')
      setServicos(response.data)
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

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormulario((atual) => ({ ...atual, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSalvando(true)
    setErro(null)

    try {
      const response = await api.post('/services/', {
        ...formulario,
        duration_minutes: Number(formulario.duration_minutes)
      })
      setServicos((atuais) => [...atuais, response.data])
      setFormulario(formularioInicial)
    } catch {
      setErro('Não foi possível salvar o procedimento. Confira os dados.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Layout title="Procedimentos" subtitle="Cadastre os serviços da Calash">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#667777] mb-2 uppercase">Duração (min)</label>
              <input type="number" name="duration_minutes" value={formulario.duration_minutes} onChange={handleChange} min="1" required className="w-full p-3 border border-[#D5EBEB] rounded-xl text-sm outline-none focus:border-[#95C6CC]" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#667777] mb-2 uppercase">Preço (R$)</label>
              <input type="number" name="price" value={formulario.price} onChange={handleChange} min="0" step="0.01" required className="w-full p-3 border border-[#D5EBEB] rounded-xl text-sm outline-none focus:border-[#95C6CC]" placeholder="0,00" />
            </div>
          </div>

          <button type="submit" disabled={salvando} className="w-full bg-[#95C6CC] hover:bg-[#779FA3] text-white p-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-70">
            {salvando ? 'Salvando...' : 'Cadastrar procedimento'}
          </button>
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
                  <p className="text-xs text-slate-400">{servico.duration_minutes} min</p>
                </div>
                <p className="font-medium text-slate-600">R$ {servico.price}</p>
              </div>
            ))
          )}
        </section>

        <Link to="/dashboard" className="block text-center text-sm text-[#779FA3] hover:underline">Voltar para a agenda</Link>
      </div>
    </Layout>
  )
}