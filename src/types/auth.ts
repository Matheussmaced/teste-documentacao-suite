export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginApiKey {
  api_key: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}

export interface User {
  uuid: string;
  name: string;
  last_name: string;
  email: string;
  is_adm: boolean;
  group: {
    uuid: string;
    name: string;
    level: number;
  };
}

export interface UserMeResponse {
  success: boolean;
  message: string;
  data: User;
}
