export interface InstallmentRule {
  uuid: string;
  name: string;
  min_installments: number;
  max_installments: number;
  interest_type: string | null;
  interest_rate: number | null;
  payment_fee_percent: number | null;
  payment_fee_fixed: number | null;
  due_days: number | null;
}

export interface PaymentMethod {
  uuid: string;
  name: string;
  type: string;
  generates_closure: boolean;
  is_global: boolean;
  installment_rules: InstallmentRule[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodsListResponse {
  success: boolean;
  message: string;
  data: PaymentMethod[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
