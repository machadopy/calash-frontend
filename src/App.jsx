import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard' // (Se ainda não criou o Dashboard, pode ignorar essa linha por enquanto ou criar um arquivo vazio para ele)
import Servicos from './pages/Servicos'
import WorkingHours from './pages/WorkingHours'
import Perfil from './pages/Perfil'
import Agendamentos from './pages/Agendamentos'
import AgendaPublica from './pages/AgendaPublica'
import HomeAgenda from './pages/HomeAgenda'
import DailyAgenda from './pages/DailyAgenda'
import Anamneses from './pages/Anamneses'
import ProfessionalRoute from './components/ProfessionalRoute'
import AuthenticatedRoute from './components/AuthenticatedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* A agenda pública é a entrada principal; o login tem rota própria. */}
        <Route path="/" element={<Navigate to="/calash" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rota do Painel */}
        <Route path="/:slug" element={<HomeAgenda />} />
        <Route path="/:slug/dashboard/dia" element={<ProfessionalRoute><DailyAgenda /></ProfessionalRoute>} />
        <Route path="/:slug/dashboard" element={<ProfessionalRoute><Dashboard /></ProfessionalRoute>} />
        <Route path="/:slug/procedimentos" element={<ProfessionalRoute><Servicos /></ProfessionalRoute>} />
        <Route path="/:slug/servicos" element={<ProfessionalRoute><Servicos /></ProfessionalRoute>} />
        <Route path="/:slug/services" element={<ProfessionalRoute><Servicos /></ProfessionalRoute>} />
        <Route path="/:slug/working-hours" element={<ProfessionalRoute><WorkingHours /></ProfessionalRoute>} />
        <Route path="/:slug/anamneses" element={<ProfessionalRoute><Anamneses /></ProfessionalRoute>} />
        <Route path="/:slug/perfil" element={<AuthenticatedRoute><Perfil /></AuthenticatedRoute>} />
        <Route path="/:slug/agendamentos" element={<AuthenticatedRoute><Agendamentos /></AuthenticatedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}