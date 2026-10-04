import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api'
import Layout from '../components/Layout'
import { getApiError } from '../utils/apiErrors'

const EMAIL_DUPLICADO = /already|exists|existe|cadastrado|registrado/i

const ROTULOS = {
  name: 'Nome',
  email: 'E-mail',
  phone: 'Telefone',
  password: 'Senha',
}

const AUTOCOMPLETE = {
  name: 'name',
  email: 'email',
  phone: 'tel',
  password: 'new-password',
}

export default function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const [formulario, setFormulario] = useState({ name: '', email: '', phone: '', password: '' })
  const [erro, setErro] = useState(null)
  const [emailJaCadastrado, setEmailJaCadastrado] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const handleChange = (event) => {
    setFormulario((atual) => ({ ...atual, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSalvando(true)
    setErro(null)
    setEmailJaCadastrado(false)
    try {
      await api.post('auth/register/', {
        ...formulario,
        name: formulario.name.trim(),
        email: formulario.email.trim(),
      })
      navigate('/login', { state: { ...location.state, from: location.state?.from || '/calash', registered: true } })
    } catch (err) {
      const emailErrors = err.response?.data?.email
      const duplicado = Array.isArray(emailErrors)
        ? emailErrors.some((mensagem) => EMAIL_DUPLICADO.test(mensagem))
        : EMAIL_DUPLICADO.test(emailErrors || '')

      if (err.response?.status === 400 && duplicado) {
        setEmailJaCadastrado(true)
        setErro('Este e-mail já está cadastrado. Use outro e-mail ou faça login.')
      } else {
        setErro(getApiError(err, 'Não foi possível criar a conta. Tente novamente.'))
      }
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
              {ROTULOS[campo]}
            </label>
            <input
              type={campo === 'password' ? 'password' : campo === 'email' ? 'email' : campo === 'phone' ? 'tel' : 'text'}
              name={campo}
              value={formulario[campo]}
              onChange={handleChange}
              required={campo !== 'phone'}
              autoComplete={AUTOCOMPLETE[campo]}
              className="w-full p-3 border border-[#D5EBEB] rounded-xl text-sm outline-none focus:border-[#95C6CC]"
            />
          </div>
        ))}
        {erro && <p className="text-xs text-red-500 text-center">{erro}</p>}
        {emailJaCadastrado && (
          <Link to="/esqueci-senha" state={location.state} className="block text-center text-xs text-[#779FA3] hover:underline">
            Esqueci minha senha
          </Link>
        )}
        <button type="submit" disabled={salvando} className="w-full bg-[#95C6CC] hover:bg-[#779FA3] text-white p-3 rounded-xl text-sm font-semibold disabled:opacity-70">
          {salvando ? 'Criando...' : 'Criar conta'}
        </button>
        <Link to="/login" state={location.state} className="block text-center text-sm text-[#779FA3] hover:underline">Já tenho uma conta</Link>
      </form>
    </Layout>
  )
}
