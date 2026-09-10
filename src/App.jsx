import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard' // (Se ainda não criou o Dashboard, pode ignorar essa linha por enquanto ou criar um arquivo vazio para ele)
import Servicos from './pages/Servicos'
import AgendaPublica from './pages/AgendaPublica'
import ProfessionalRoute from './components/ProfessionalRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota raiz (Tela de Login) */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rota do Painel */}
        <Route path="/:slug" element={<AgendaPublica />} />
        <Route path="/:slug/dashboard" element={<ProfessionalRoute><Dashboard /></ProfessionalRoute>} />
        <Route path="/:slug/servicos" element={<ProfessionalRoute><Servicos /></ProfessionalRoute>} />
        <Route path="/:slug/services" element={<ProfessionalRoute><Servicos /></ProfessionalRoute>} />
      </Routes>
    </BrowserRouter>
  )
}