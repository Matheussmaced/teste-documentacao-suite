import axios from 'axios';
import { api } from './api';
import type { UserProduct, UserProductsListResponse } from '@/types/products';

interface GetUserProductsParams {
  page?: number;
}

export interface UserProductsResult {
  data: UserProduct[];
  pagination: UserProductsListResponse['pagination'];
}

export async function getUserProducts(params?: GetUserProductsParams): Promise<UserProductsResult> {
  try {
    const { data } = await api.get<UserProductsListResponse>('/certificate/user-products', { params });
    return { data: data.data, pagination: data.pagination };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 401) throw new Error('Token ausente, inválido ou expirado.');
    }
    throw new Error('Erro ao listar produtos.');
  }
}

export async function getUserProduct(uuid: string): Promise<UserProduct> {
  try {
    const { data } = await api.get<{ success: boolean; message: string; data: UserProduct }>(`/certificate/user-products/${uuid}`);
    return data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 401) throw new Error('Token ausente, inválido ou expirado.');
      if (status === 404) throw new Error('Produto não encontrado.');
    }
    throw new Error('Erro ao buscar produto.');
  }
}
