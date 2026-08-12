import axios from 'axios';
import { api } from './api';
import type { Person, Pagination, PersonsListResponse } from '@/types/persons';

interface GetPersonsParams {
  search?: string;
  page?: number;
}

interface GetPersonsResult {
  data: Person[];
  pagination: Pagination;
}

export async function getPersons(params?: GetPersonsParams): Promise<GetPersonsResult> {
  try {
    const { data } = await api.get<PersonsListResponse>('/persons', { params });
    return { data: data.data, pagination: data.pagination };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 401) throw new Error('Token ausente, inválido ou expirado.');
      if (status === 500) throw new Error('Erro interno do servidor.');
    }
    throw new Error('Erro ao listar pessoas.');
  }
}
