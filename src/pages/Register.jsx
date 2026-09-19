import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api'
import Layout from '../components/Layout'

export default function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const [formulario, setFormulario] = useState({ name: '', email: '', phone: '', password: '' })
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  const handleChange = (event) => {
    setFormulario((atual) => ({ ...atual, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSalvando(true)
    setErro(null)
    try {
      await api.post('auth/register/', formulario)
      navigate('/', { state: { from: location.state?.from || '/calash', registered: true } })
    } catch {
      setErro('Não foi possível criar a conta. Verifique os dados informados.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Layout title="Criar conta" subtitle="Cadastre-se para solicitar seu atendimento" showUserMenu={false}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {['name', 'email', 'phone', 'password'].map((campo) => (
          <div key={campo}>
            <label className="block text-[11px] font-medium text-[#667777] mb-2 uppercase">
              {campo === 'name' ? 'Nome' : campo === 'phone' ? 'Telefone' : campo === 'password' ? 'Senha' : 'E-mail'}
            </label>
            <input 
              type={campo === 'password' ? 'password' : campo === 'email' ? 'email' : 'text'} 
              name={campo} 
              value={formulario[campo]} 
              onChange={handleChange} 
              required={campo !== 'phone'} 
              className="w-full p-3 border border-[#D5EBEB] rounded-xl text-sm outline-none focus:border-[#95C6CC]" 
            />
          </div>
        ))}
        {erro && <p className="text-xs text-red-500 text-center">{erro}</p>}
        <button type="submit" disabled={salvando} className="w-full bg-[#95C6CC] hover:bg-[#779FA3] text-white p-3 rounded-xl text-sm font-semibold disabled:opacity-70">
          {salvando ? 'Criando...' : 'Criar conta'}
        </button>
        <Link to="/" state={location.state} className="block text-center text-sm text-[#779FA3] hover:underline">Já tenho uma conta</Link>
      </form>
    </Layout>
  )
}