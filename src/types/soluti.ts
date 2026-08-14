export interface BirdIdSlot {
  slot_alias: string;
  label: string;
}

export interface BirdIdDiscoveryResponse {
  success: boolean;
  message: string;
  data: BirdIdSlot[];
}

export interface NewOrderData {
  protocol: string;
  availableTimes: string;
}

export interface AvailableTimesData {
  availableTimes: unknown;
}

export interface AvailableTimesResponse {
  success: boolean;
  message: string;
  data: AvailableTimesData;
}

export interface NewOrderResponse {
  success: boolean;
  message: string;
  data: NewOrderData;
}

export interface ScheduleStartData {
  produtos: unknown[];
  codigo_aceite: string;
}

export interface ScheduleStartResponse {
  success: boolean;
  message: string;
  data: ScheduleStartData;
}

export interface BirdIdAuthData {
  sessionId: string;
  sessionData: string;
  nome: string;
}

export interface BirdIdLoginData {
  auth: BirdIdAuthData;
  login: Record<string, unknown>;
}

export interface BirdIdLoginResponse {
  success: boolean;
  message: string;
  data: BirdIdLoginData;
}

export interface BirdIdEmitData {
  tipoProduto: string;
  isQsa: boolean;
}

export interface BirdIdEmitResponse {
  success: boolean;
  message: string;
  data: BirdIdEmitData;
}

export interface WebServiceEmissao {
  status: number;
  cn: string | null;
  cpf: string | null;
  cnpj: string | null;
}

export interface ValidateWebServiceResponse {
  success: boolean;
  message: string;
  data: {
    mensagem: {
      emissao: WebServiceEmissao;
    };
  };
}
