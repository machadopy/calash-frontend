import axios from 'axios';

const api = axios.create({
  baseURL: '/api/', // Caminho relativo: o Nginx da front-end redireciona para a VPS de back-end
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken');

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

export default api;