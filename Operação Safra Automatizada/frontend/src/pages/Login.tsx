import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(4, 'Senha deve ter pelo menos 4 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const { login, isAuthenticated, isLoading } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data)
      toast.success('Login realizado com sucesso!')
      navigate('/')
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Erro ao fazer login'
      toast.error(message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary-500 rounded-xl flex items-center justify-center mb-6">
            <span className="text-3xl">🌾</span>
          </div>
          <h2 className="text-3xl font-bold text-neutral-900 mb-2">
            Fazenda Brasil
          </h2>
          <p className="text-neutral-600">
            Sistema NFP-e - Campo Verde/MT
          </p>
        </div>

        {/* Login Form */}
        <div className="mt-8 card">
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="form-input"
                  placeholder="seu@email.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="form-error">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="form-input"
                  placeholder="Digite sua senha"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="form-error">{errors.password.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full btn btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting || isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="loading-spinner w-4 h-4"></div>
                      <span>Entrando...</span>
                    </div>
                  ) : (
                    'Entrar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-500">
            Sistema integrado com TOTVS Protheus Agro
          </p>
          <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-neutral-400">
            <span>SEFAZ-MT Compliance</span>
            <span>•</span>
            <span>NFP-e v4.00</span>
          </div>
        </div>
      </div>
    </div>
  )
}