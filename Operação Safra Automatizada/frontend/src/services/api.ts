import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'

// Base API Configuration
const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request Interceptor - Add Auth Token
    this.client.interceptors.request.use(
      (config) => {
        const token = Cookies.get('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response Interceptor - Handle Errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      async (error) => {
        const originalRequest = error.config

        // Token Expired - Try Refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = Cookies.get('refresh_token')
            if (refreshToken) {
              const response = await this.post('/auth/refresh', {
                refresh_token: refreshToken,
              })

              const { access_token } = response.data
              Cookies.set('auth_token', access_token, { expires: 1 })

              // Retry original request
              originalRequest.headers.Authorization = `Bearer ${access_token}`
              return this.client(originalRequest)
            }
          } catch (refreshError) {
            // Refresh failed - logout user
            this.handleLogout()
            return Promise.reject(refreshError)
          }
        }

        // Handle specific error codes
        if (error.response?.status === 403) {
          toast.error('Acesso negado. Você não tem permissão para esta ação.')
        } else if (error.response?.status >= 500) {
          toast.error('Erro interno do servidor. Tente novamente mais tarde.')
        } else if (error.code === 'ECONNABORTED') {
          toast.error('Tempo de resposta esgotado. Verifique sua conexão.')
        }

        return Promise.reject(error)
      }
    )
  }

  private handleLogout() {
    Cookies.remove('auth_token')
    Cookies.remove('refresh_token')
    window.location.href = '/login'
  }

  // HTTP Methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config)
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config)
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config)
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config)
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config)
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export default apiClient