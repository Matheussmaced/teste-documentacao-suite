import axios from 'axios';
import { api } from './api';
import type { CreateSalePayload, Sale, SaleDetail, SaleResponse, SaleDetailResponse, SalesListResponse, SalesDashboardData, SalesDashboardResponse, ConfirmSaleResult, ConfirmSaleResponse } from '@/types/sales';

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

export async function getSalesDashboard(params?: {
  start_date?: string;
  end_date?: string;
  user_uuid?: string;
}): Promise<SalesDashboardData> {
  try {
    const { data } = await api.get<SalesDashboardResponse>('/certificate/sales/dashboard', { params });
    return data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 401) throw new Error('Token ausente, inválido ou expirado.');
      if (status === 422) throw new Error('Parâmetros de data inválidos.');
      if (status === 500) throw new Error('Erro interno do servidor.');
    }
    throw new Error('Erro ao carregar dashboard de vendas.');
  }
}

export async function getSale(uuid: string): Promise<SaleDetail> {
  try {
    const { data } = await api.get<SaleDetailResponse>(`/certificate/sales/${uuid}`);
    return data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 401) throw new Error('Token ausente, inválido ou expirado.');
      if (status === 403) throw new Error('Acesso negado — venda pertence a outro vendedor.');
      if (status === 404) throw new Error('Venda não encontrada.');
      if (status === 500) throw new Error('Erro interno do servidor.');
    }
    throw new Error('Erro ao buscar venda.');
  }
}

export async function updateSaleClient(uuid: string, clientUuid: string): Promise<Sale> {
  try {
    const { data } = await api.patch<SaleResponse>(`/certificate/sales/${uuid}`, { client: clientUuid });
    return data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const body = err.response?.data;
      if (status === 401) throw new Error('Token ausente, inválido ou expirado.');
      if (status === 404) throw new Error('Venda não encontrada.');
      if (status === 422) throw new Error(body?.message ?? 'Erro de validação dos campos enviados.');
      if (status === 500) throw new Error(body?.message ?? 'Erro interno do servidor.');
    }
    throw new Error('Erro ao atualizar cliente da venda.');
  }
}

export async function confirmSale(
  uuid: string,
  paymentMethodInstallment: string,
  installments = 1,
): Promise<ConfirmSaleResult> {
  try {
    const { data } = await api.post<ConfirmSaleResponse>(`/certificate/sales/${uuid}/confirm`, {
      payment_method_installment: paymentMethodInstallment,
      installments,
    });
    return data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const body = err.response?.data;
      if (status === 400) throw new Error(body?.message ?? 'Venda já confirmada ou método de pagamento inválido.');
      if (status === 401) throw new Error('Token ausente, inválido ou expirado.');
      if (status === 404) throw new Error('Venda não encontrada.');
      if (status === 422) throw new Error(body?.message ?? 'Erro de validação dos campos enviados.');
      if (status === 500) throw new Error(body?.message ?? 'Erro interno do servidor.');
    }
    throw new Error('Erro ao confirmar venda.');
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
