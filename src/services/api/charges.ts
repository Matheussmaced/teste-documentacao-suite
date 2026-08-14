import axios from 'axios';
import { api } from './api';
import type { Charge, ChargeResponse } from '@/types/sales';

export async function getCharge(uuid: string): Promise<Charge> {
  try {
    const { data } = await api.get<ChargeResponse>(`/charges/${uuid}`);
    return data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 401) throw new Error('Token ausente, inválido ou expirado.');
      if (status === 404) throw new Error('Cobrança não encontrada.');
      if (status === 500) throw new Error('Erro interno do servidor.');
    }
    throw new Error('Erro ao buscar cobrança.');
  }
}
