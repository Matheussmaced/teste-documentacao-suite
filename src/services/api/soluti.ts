import axios from 'axios';
import { api } from './api';
import type { BirdIdSlot, BirdIdDiscoveryResponse, ScheduleStartData, ScheduleStartResponse, WebServiceEmissao, ValidateWebServiceResponse } from '@/types/soluti';

export async function scheduleStart(pedido: string, aceite: boolean): Promise<ScheduleStartData> {
  try {
    const { data } = await api.post<ScheduleStartResponse>('/soluti/schedule/start', { pedido, aceite });
    return data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const body = err.response?.data;
      if (status === 401) throw new Error('Token ausente, inválido ou expirado.');
      if (status === 422) throw new Error(body?.error ?? body?.message ?? 'Erro de validação dos campos enviados.');
      if (status === 500) throw new Error(body?.error ?? body?.message ?? 'Erro interno do servidor.');
    }
    throw new Error('Erro ao iniciar agendamento.');
  }
}

export async function validateWebServiceEmit(solicitationCode: string, emitPassword: string): Promise<WebServiceEmissao> {
  try {
    const { data } = await api.post<ValidateWebServiceResponse>('/soluti/webservice/emit/validate', {
      solicitation_code: solicitationCode,
      emit_password: emitPassword,
    });
    return data.data.mensagem.emissao;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const body = err.response?.data;
      if (status === 400) throw new Error(body?.error ?? body?.message ?? 'Erro na validação dos dados.');
      if (status === 401) throw new Error('Token ausente, inválido ou expirado.');
      if (status === 422) throw new Error(body?.error ?? body?.message ?? 'Erro de validação dos campos enviados.');
      if (status === 500) throw new Error(body?.error ?? body?.message ?? 'Erro interno do servidor.');
    }
    throw new Error('Erro ao validar emissão.');
  }
}

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
