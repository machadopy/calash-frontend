import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/',
  timeout: 10000,
})

const isPublicAuthRequest = (url = '') => /^\/auth\/(forgot-password|reset-password|verify-email)\//.test(url)

api.interceptors.request.use((config) => {
  if (isPublicAuthRequest(config.url || '')) {
    delete config.headers.Authorization
    return config
  }

  const accessToken = localStorage.getItem('accessToken')

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''

    if (isPublicAuthRequest(url)) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      window.dispatchEvent(new Event('calash:auth-changed'))
    }

    return Promise.reject(error)
  },
)

export default api
