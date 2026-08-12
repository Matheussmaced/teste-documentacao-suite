import axios from 'axios';
import { api } from './api';
import type { LoginCredentials, LoginApiKey, AuthResponse, ApiErrorResponse } from '@/types/auth';

function handleAuthError(err: unknown): never {
  if (axios.isAxiosError<ApiErrorResponse>(err)) {
    const status = err.response?.status;
    const message = err.response?.data?.message;

    if (status === 401) throw new Error(message ?? 'Credenciais inválidas.');
    if (status === 422) throw new Error(message ?? 'Erro de validação dos campos enviados.');
  }
  throw new Error('Erro inesperado. Tente novamente.');
}

export async function loginWithCredentials(
  credentials: LoginCredentials,
  tenant: string
): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials, {
      headers: { 'X-Tenant': tenant },
    });
    return data;
  } catch (err) {
    handleAuthError(err);
  }
}

export async function loginWithApiKey(
  payload: LoginApiKey,
  tenant: string
): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>('/auth/login', payload, {
      headers: { 'X-Tenant': tenant },
    });
    return data;
  } catch (err) {
    handleAuthError(err);
  }
}
