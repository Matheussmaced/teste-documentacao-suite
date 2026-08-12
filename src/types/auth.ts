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
