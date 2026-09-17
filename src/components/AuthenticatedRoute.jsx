import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import api from '../services/api'

export default function AuthenticatedRoute({ children }) {
  const location = useLocation()
  const [state, setState] = useState({
    loading: Boolean(localStorage.getItem('accessToken')),
    user: null,
  })

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) return

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

  return children
}
