export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
  user_id: number
  user_name: string
  user_email: string
}

export interface User {
  id: number
  email: string
  nome_completo: string
  cpf?: string
  cargo?: string
  departamento?: string
  is_active: boolean
  ultimo_login?: string
  created_at: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}