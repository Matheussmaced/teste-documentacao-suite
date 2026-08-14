import axios from 'axios';
import { api } from './api';
import type { CreateSalePayload, Sale, SaleResponse, SalesListResponse } from '@/types/sales';

export interface SalesListResult {
  data: Sale[];
  pagination: SalesListResponse['pagination'];
}

export async function getSales(params?: { page?: number }): Promise<SalesListResult> {
  try {
    const { data } = await api.get<SalesListResponse>('/certificate/sales', { params });
    return { data: data.data, pagination: data.pagination };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 401) throw new Error('Token ausente, inválido ou expirado.');
      if (status === 500) throw new Error('Erro interno do servidor.');
    }
    throw new Error('Erro ao listar vendas.');
  }
}

export async function createSale(payload: CreateSalePayload): Promise<Sale> {
  try {
    const { data } = await api.post<SaleResponse>('/certificate/sales', payload);
    return data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const body = err.response?.data;
      if (status === 400) throw new Error(body?.message ?? 'Erro de negócio ao criar a venda.');
      if (status === 401) throw new Error('Token ausente, inválido ou expirado.');
      if (status === 422) {
        if (body?.errors) {
          const firstField = Object.keys(body.errors)[0];
          const firstMessage = body.errors[firstField]?.[0];
          throw new Error(firstMessage ?? body?.message ?? 'Erro de validação dos campos enviados.');
        }
        throw new Error(body?.message ?? 'Erro de validação dos campos enviados.');
      }
    }
    throw new Error('Erro ao criar venda.');
  }
}
