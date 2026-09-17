import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'
import Layout from '../components/Layout'

export default function Perfil() {
  const { slug } = useParams()
  const [formulario, setFormulario] = useState({ name: '', phone: '', email: '' })
  const [mensagem, setMensagem] = useState(null)
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    api.get('/auth/me/')
      .then(({ data }) => setFormulario({ name: data.name || '', phone: data.phone || '', email: data.email || '' }))
      .catch(() => setErro('Não foi possível carregar o perfil.'))
  }, [])

  const alterar = (event) => {
    setFormulario((atual) => ({ ...atual, [event.target.name]: event.target.value }))
  }

  const salvar = async (event) => {
    event.preventDefault()
    setSalvando(true)
    setMensagem(null)
    setErro(null)
    try {
      const { data } = await api.patch('/auth/me/', { name: formulario.name, phone: formulario.phone })
      setFormulario((atual) => ({ ...atual, name: data.name, phone: data.phone || '' }))
      setMensagem('Perfil atualizado.')
    } catch {
      setErro('Não foi possível atualizar o perfil.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Layout title="Meu perfil" subtitle="Atualize seus dados">
      <form onSubmit={salvar} className="space-y-4">
        <label className="block text-[11px] font-medium text-[#667777] uppercase">Nome
          <input name="name" value={formulario.name} onChange={alterar} required className="mt-2 w-full p-3 border border-[#D5EBEB] rounded-xl text-sm" />
        </label>
        <label className="block text-[11px] font-medium text-[#667777] uppercase">E-mail
          <input value={formulario.email} disabled className="mt-2 w-full p-3 border border-[#D5EBEB] rounded-xl text-sm bg-slate-50" />
        </label>
        <label className="block text-[11px] font-medium text-[#667777] uppercase">Telefone
          <input name="phone" value={formulario.phone} onChange={alterar} className="mt-2 w-full p-3 border border-[#D5EBEB] rounded-xl text-sm" />
        </label>
        {mensagem && <p className="text-xs text-green-600 text-center">{mensagem}</p>}
        {erro && <p className="text-xs text-red-500 text-center">{erro}</p>}
        <button type="submit" disabled={salvando} className="w-full bg-[#95C6CC] hover:bg-[#779FA3] text-white p-3 rounded-xl text-sm font-semibold disabled:opacity-70">{salvando ? 'Salvando...' : 'Salvar alterações'}</button>
        <Link to={`/${slug}/dashboard`} className="block text-center text-sm text-[#779FA3] hover:underline">Voltar</Link>
      </form>
    </Layout>
  )
}
