import axios from 'axios';
import { api } from './api';
import type { PaymentMethod, PaymentMethodsListResponse } from '@/types/payments';

export interface PaymentMethodsResult {
  data: PaymentMethod[];
  pagination: PaymentMethodsListResponse['pagination'];
}

export async function getPaymentMethods(params?: { page?: number }): Promise<PaymentMethodsResult> {
  try {
    const { data } = await api.get<PaymentMethodsListResponse>('/payments/methods', { params });
    return { data: data.data, pagination: data.pagination };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 401) throw new Error('Token ausente, inválido ou expirado.');
      if (status === 500) throw new Error('Erro interno do servidor.');
    }
    throw new Error('Erro ao listar métodos de pagamento.');
  }
}
