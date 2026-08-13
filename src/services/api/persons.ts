import axios from 'axios';
import { api } from './api';
import type { Person, Pagination, PersonsListResponse, CreatePersonPayload, PersonResponse } from '@/types/persons';

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

export async function getPerson(uuid: string): Promise<Person> {
  try {
    const { data } = await api.get<PersonResponse>(`/persons/${uuid}`);
    return data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 401) throw new Error('Token ausente, inválido ou expirado.');
      if (status === 404) throw new Error('Cliente não encontrado.');
      if (status === 500) throw new Error('Erro interno do servidor.');
    }
    throw new Error('Erro ao buscar pessoa.');
  }
}

export async function deletePerson(uuid: string): Promise<void> {
  try {
    await api.delete(`/persons/${uuid}`);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const body = err.response?.data;
      if (status === 400) throw new Error(body?.message ?? 'Falha ao deletar o cliente.');
      if (status === 401) throw new Error('Token ausente, inválido ou expirado.');
      if (status === 404) throw new Error('Cliente não encontrado.');
      if (status === 500) throw new Error(body?.error ?? body?.message ?? 'Erro interno do servidor.');
    }
    throw new Error('Erro ao remover pessoa.');
  }
}

export async function createPerson(payload: CreatePersonPayload): Promise<Person> {
  try {
    const { data } = await api.post<PersonResponse>('/persons', payload);
    return data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const body = err.response?.data;
      const message = body?.message;

      if (status === 401) throw new Error(message ?? 'Token ausente, inválido ou expirado.');
      if (status === 403 || status === 422) {
        if (body?.errors) {
          const firstField = Object.keys(body.errors)[0];
          const firstMessage = body.errors[firstField]?.[0];
          throw new Error(firstMessage ?? message ?? 'Erro de validação dos campos enviados.');
        }
        throw new Error(message ?? 'Erro de validação dos campos enviados.');
      }
      if (status === 500) throw new Error(body?.error ?? body?.message ?? 'Erro interno do servidor.');
    }
    throw new Error('Erro ao cadastrar pessoa.');
  }
}
