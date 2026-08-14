import axios from 'axios';
import { api } from './api';
import type { BirdIdSlot, BirdIdDiscoveryResponse, BirdIdLoginData, BirdIdLoginResponse, BirdIdEmitData, BirdIdEmitResponse, NewOrderData, NewOrderResponse, ScheduleStartData, ScheduleStartResponse, AvailableTimesData, AvailableTimesResponse, WebServiceEmissao, ValidateWebServiceResponse } from '@/types/soluti';

export async function scheduleNewOrder(
  order: string,
  password: string,
  products: unknown[],
  acceptCode: string,
): Promise<NewOrderData> {
  try {
    const { data } = await api.post<NewOrderResponse>('/soluti/schedule/new-order', {
      order,
      password,
      products,
      acceptCode,
    });
    return data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const body = err.response?.data;
      if (status === 401) throw new Error('Token ausente, inválido ou expirado.');
      if (status === 403) {
        const firstError = body?.errors
          ? Object.values(body.errors as Record<string, string[]>)[0]?.[0]
          : null;
        throw new Error(firstError ?? body?.error ?? body?.message ?? 'Erro de validação dos campos enviados.');
      }
      if (status === 422) throw new Error(body?.error ?? body?.message ?? 'Erro de validação dos campos enviados.');
      if (status === 500) throw new Error(body?.error ?? body?.message ?? 'Erro interno do servidor.');
    }
    throw new Error('Erro ao criar ordem de agendamento.');
  }
}

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

export async function scheduleAppointment(
  scheduled_datetime: string,
  protocol: string,
  password: string,
): Promise<void> {
  try {
    await api.post('/soluti/schedule/schedule', { scheduled_datetime, protocol, password });
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const body = err.response?.data;
      if (status === 401) throw new Error('Token ausente, inválido ou expirado.');
      if (status === 422) throw new Error(body?.error ?? body?.message ?? 'Erro de validação dos campos enviados.');
      if (status === 500) throw new Error(body?.error ?? body?.message ?? 'Erro interno do servidor.');
    }
    throw new Error('Erro ao confirmar agendamento.');
  }
}

export async function getAvailableTimes(protocol: string, scheduleDate: string): Promise<AvailableTimesData> {
  try {
    const { data } = await api.post<AvailableTimesResponse>('/soluti/schedule/available-times', {
      protocol,
      scheduleDate,
    });
    return data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const body = err.response?.data;
      if (status === 401) throw new Error('Token ausente, inválido ou expirado.');
      if (status === 500) throw new Error(body?.error ?? body?.message ?? 'Erro interno do servidor.');
    }
    throw new Error('Erro ao listar horários disponíveis.');
  }
}

export async function birdIdLogin(document: string, otp: string, voucher: string): Promise<BirdIdLoginData> {
  try {
    const { data } = await api.post<BirdIdLoginResponse>('/soluti/birdid/login', { document, otp, voucher });
    return data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const body = err.response?.data;
      if (status === 401) throw new Error('Token ausente, inválido ou expirado.');
      if (status === 404) throw new Error('Não foi possível autenticar com os dados informados. Verifique o OTP e o documento.');
      if (status === 422) throw new Error(body?.error ?? body?.message ?? 'Erro de validação dos campos enviados.');
      if (status === 500) throw new Error(body?.error ?? body?.message ?? 'Erro interno do servidor.');
    }
    throw new Error('Erro ao realizar login Bird ID.');
  }
}

export async function birdIdEmit(
  voucher: string,
  document: string,
  password: string,
  password_confirmation: string,
  cei?: string,
): Promise<BirdIdEmitData> {
  try {
    const { data } = await api.post<BirdIdEmitResponse>('/soluti/birdid/emit', {
      voucher,
      document,
      password,
      password_confirmation,
      ...(cei ? { cei } : {}),
    });
    return data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const body = err.response?.data;
      if (status === 401) throw new Error('Token ausente, inválido ou expirado.');
      if (status === 404) throw new Error('Não foi possível emitir o certificado com os dados informados.');
      if (status === 422) throw new Error(body?.error ?? body?.message ?? 'Erro de validação dos campos enviados.');
      if (status === 500) throw new Error(body?.error ?? body?.message ?? 'Erro interno do servidor.');
    }
    throw new Error('Erro ao emitir certificado Bird ID.');
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
