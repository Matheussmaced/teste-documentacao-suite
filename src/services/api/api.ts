import axios from 'axios';
import { getToken } from '@/lib/token';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = token;

  console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
    headers: config.headers,
    body: config.data
      ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data)
      : undefined,
  });

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (err) => {
    if (axios.isAxiosError(err)) {
      console.error(`[API] Erro ${err.response?.status ?? 'sem status'} em ${err.config?.url}`, {
        status: err.response?.status,
        body: err.response?.data,
        sent: err.config?.data
          ? (typeof err.config.data === 'string' ? JSON.parse(err.config.data) : err.config.data)
          : undefined,
      });
    } else {
      console.error('[API] Erro inesperado:', err);
    }
    return Promise.reject(err);
  }
);
