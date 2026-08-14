import axios from 'axios';
import { api } from './api';
import type { BirdIdSlot, BirdIdDiscoveryResponse } from '@/types/soluti';

export async function discoverBirdId(document: string): Promise<BirdIdSlot[] | null> {
  try {
    const { data } = await api.get<BirdIdDiscoveryResponse>(`/soluti/birdid/discovery/${document}`);
    return data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 404) return null;
      if (status === 401) throw new Error('Token ausente, inválido ou expirado.');
      if (status === 500) throw new Error('Erro interno do servidor.');
    }
    throw new Error('Erro ao verificar Bird ID.');
  }
}
