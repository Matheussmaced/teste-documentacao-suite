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
