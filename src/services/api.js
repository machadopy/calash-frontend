import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/', // O endereço base que vimos no seu Django
});

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken')

  const isPublicRequest = config.url?.startsWith('/public/')

  if (accessToken && !isPublicRequest) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

export default api;