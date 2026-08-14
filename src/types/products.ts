export interface CertProduct {
  uuid: string;
  name: string;
  description?: string | null;
  external: string;
  kind: 'pf' | 'pj';
  active: boolean;
  provider: string;
  policy?: string | null;
  images: unknown[];
  created_at: string;
  updated_at: string;
}

export interface UserProduct {
  uuid: string;
  user_uuid: string;
  product_uuid: string;
  cost: number;
  sale_price: number;
  edit_sale: boolean;
  show: boolean;
  suggested_cost: number;
  suggested_sale_price: number;
  product: CertProduct;
  created_at: string;
  updated_at: string;
}

export interface UserProductsListResponse {
  success: boolean;
  message: string;
  data: UserProduct[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
  };
}
