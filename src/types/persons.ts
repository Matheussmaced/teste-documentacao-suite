export interface Person {
  uuid: string;
  fathers_uuid: string;
  holders_document: string;
  has_birdid: boolean;
  can_video_conference_in: string;
  holders_name: string;
  email: string;
  birth_date: string;
  phone: string;
  cellphone: string;
  document: string;
  name: string;
  fantasy_name: string;
  address_zipcode: string;
  address_city: string;
  address_uf: string;
  address_ibge: string;
  address_neighb: string;
  address: string;
  address_number: string;
  address_compl: string;
  created_at: string;
  updated_at: string;
}

export interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export interface PersonsListResponse {
  success: boolean;
  message: string;
  data: Person[];
  pagination: Pagination;
}
