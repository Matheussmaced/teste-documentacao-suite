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

export interface Sale {
  uuid: string;
  seller: Record<string, unknown>;
  client: Record<string, unknown>;
  items: unknown[];
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
