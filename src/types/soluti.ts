export interface BirdIdSlot {
  slot_alias: string;
  label: string;
}

export interface BirdIdDiscoveryResponse {
  success: boolean;
  message: string;
  data: BirdIdSlot[];
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
