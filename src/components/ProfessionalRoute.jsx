import { useEffect, useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import api from '../services/api'

export default function ProfessionalRoute({ children }) {
  const { slug } = useParams()
  const location = useLocation()
  const [state, setState] = useState(() => ({
    loading: Boolean(localStorage.getItem('accessToken')),
    user: null
  }))

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    api.get('/auth/me/')
      .then(({ data }) => setState({ loading: false, user: data }))
      .catch(() => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        setState({ loading: false, user: null })
      })
  }, [])

  if (state.loading) return <div className="min-h-screen bg-[#F4FBFC]" />
  if (!state.user) return <Navigate to="/" state={{ from: location.pathname }} replace />
  if (!state.user.is_professional) return <Navigate to={`/${slug}`} replace />
  if (state.user.professional_slug !== slug) {
    return <Navigate to={`/${state.user.professional_slug}/dashboard`} replace />
  }

  return children
}