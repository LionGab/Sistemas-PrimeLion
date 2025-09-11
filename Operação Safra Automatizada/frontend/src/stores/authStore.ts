import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Cookies from 'js-cookie'
import { AuthState, User, LoginCredentials } from '@/types/auth'
import { authService } from '@/services/auth'

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true })
        try {
          const response = await authService.login(credentials)
          
          // Store tokens in httpOnly cookies for security
          Cookies.set('auth_token', response.access_token, {
            expires: response.expires_in / (24 * 60 * 60), // Convert seconds to days
            secure: import.meta.env.PROD,
            sameSite: 'lax',
          })

          // Get full user data
          const user = await authService.getCurrentUser()

          set({
            user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await authService.logout()
        } catch (error) {
          console.warn('Logout service failed:', error)
        } finally {
          // Always clear local state and cookies
          Cookies.remove('auth_token')
          Cookies.remove('refresh_token')
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      checkAuth: async () => {
        const token = Cookies.get('auth_token')
        
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null })
          return
        }

        set({ isLoading: true })
        try {
          const user = await authService.getCurrentUser()
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          // Token is invalid - clear everything
          Cookies.remove('auth_token')
          Cookies.remove('refresh_token')
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      setUser: (user: User | null) => {
        set({ user })
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist non-sensitive data
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)