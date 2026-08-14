export interface SaleItemPayload {
  uuid: string;
  sale_price?: number;
  voucher?: string;
  coupon?: string;
}

export interface CreateSalePayload {
  client: string;
  user_product: SaleItemPayload[];
}

export interface SaleClient {
  uuid?: string;
  holders_name?: string;
  holders_document?: string;
  email?: string;
}

export interface SaleSeller {
  uuid?: string;
  name?: string;
  last_name?: string;
  email?: string;
}

export interface SaleItem {
  uuid?: string;
  user_product?: string | Record<string, unknown>;
  cost?: number;
  sale_price?: number;
}

export interface Sale {
  uuid: string;
  seller: SaleSeller;
  client: SaleClient;
  items: SaleItem[];
  external_protocol?: string | null;
  confirmed_at?: string | null;
  paid_at?: string | null;
  issued_at?: string | null;
  downloaded_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleResponse {
  success: boolean;
  message: string;
  data: Sale;
}

export interface SaleDetail extends Sale {
  charges: Record<string, unknown>[];
  appointments: Record<string, unknown>[];
  certificate_renewals: Record<string, unknown>[];
  soluti_emit_data: Record<string, unknown>[];
}

export interface SaleDetailResponse {
  success: boolean;
  message: string;
  data: SaleDetail;
}

export interface Charge {
  uuid: string;
  person_uuid: string;
  source_uuid: string;
  source_type: string;
  payment_method_uuid: string;
  payment_installment_rule_uuid: string;
  installments: number;
  amount: number;
  due_date: string | null;
  payment_date: string | null;
  status: string;
  description: string | null;
  request_payload: Record<string, unknown> | null;
  response_payload: Record<string, unknown> | null;
  payment_method: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ChargeResponse {
  success: boolean;
  message: string;
  data: Charge;
}

export interface ConfirmSaleResult {
  sale: Sale;
  charge: Charge;
}

export interface ConfirmSaleResponse {
  success: boolean;
  message: string;
  data: ConfirmSaleResult;
}

export interface TeamPerformance {
  uuid: string;
  name: string;
  certificatesIssued: number;
  isCurrentUser: boolean;
}

export interface MonthlySale {
  month: string;
  date: string;
  sales: number;
}

export interface SalesDashboardData {
  teamPerformance: TeamPerformance[];
  monthlySales: MonthlySale[];
}

export interface SalesDashboardResponse {
  success: boolean;
  message: string;
  data: SalesDashboardData;
}

export interface SalesListResponse {
  success: boolean;
  message: string;
  data: Sale[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
