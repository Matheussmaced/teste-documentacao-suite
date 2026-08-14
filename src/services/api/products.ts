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
