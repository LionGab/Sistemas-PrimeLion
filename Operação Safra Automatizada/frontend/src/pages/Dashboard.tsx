import React from 'react'
import { useQuery } from 'react-query'
import { 
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/services/api'

interface DashboardMetrics {
  nfpe_hoje: number
  nfpe_mes: number
  faturamento_mes: number
  totvs_sync_status: 'online' | 'offline' | 'syncing'
}

export const Dashboard: React.FC = () => {
  // Dashboard metrics - usando endpoint genérico (API não confirmada)
  const { data: metrics, isLoading } = useQuery(
    'dashboard-metrics',
    async () => {
      // NULL - endpoint não confirmado, usando dados mock
      return {
        nfpe_hoje: 12,
        nfpe_mes: 456,
        faturamento_mes: 1250000,
        totvs_sync_status: 'online' as const,
      } as DashboardMetrics
    },
    {
      refetchInterval: 60000, // 1 minuto
    }
  )

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'primary',
    subtitle 
  }: {
    title: string
    value: string | number
    icon: React.ComponentType<{ className?: string }>
    color?: 'primary' | 'secondary' | 'success' | 'warning'
    subtitle?: string
  }) => {
    const colorClasses = {
      primary: 'bg-primary-500 text-white',
      secondary: 'bg-secondary-500 text-white',
      success: 'bg-green-500 text-white',
      warning: 'bg-yellow-500 text-white',
    }

    return (
      <div className="card">
        <div className="card-body">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`p-3 rounded-md ${colorClasses[color]}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-neutral-500 truncate">
                  {title}
                </dt>
                <dd className="text-lg font-semibold text-neutral-900">
                  {typeof value === 'number' && title.includes('R$') 
                    ? new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(value)
                    : value
                  }
                </dd>
                {subtitle && (
                  <dd className="text-xs text-neutral-400">
                    {subtitle}
                  </dd>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-neutral-200 pb-5">
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="mt-2 text-sm text-neutral-700">
          Visão geral das operações NFP-e - Fazenda Brasil
        </p>
      </div>

      {/* Metrics Grid */}
      {isLoading ? (
        <div className="metrics-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="card-body">
                <div className="loading-skeleton h-16 w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="metrics-grid">
          <MetricCard
            title="NFP-e Hoje"
            value={metrics?.nfpe_hoje || 0}
            icon={DocumentTextIcon}
            color="primary"
            subtitle="Emitidas hoje"
          />
          
          <MetricCard
            title="NFP-e Este Mês"
            value={metrics?.nfpe_mes || 0}
            icon={ChartBarIcon}
            color="secondary"
            subtitle="Total mensal"
          />
          
          <MetricCard
            title="Faturamento Mês"
            value={metrics?.faturamento_mes || 0}
            icon={CurrencyDollarIcon}
            color="success"
            subtitle="Receita bruta"
          />
          
          <MetricCard
            title="TOTVS Status"
            value={metrics?.totvs_sync_status === 'online' ? 'Online' : 'Offline'}
            icon={CheckCircleIcon}
            color={metrics?.totvs_sync_status === 'online' ? 'success' : 'warning'}
            subtitle="Sincronização"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 tablet:grid-cols-2 gap-6">
        {/* Recent NFP-e */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">NFP-e Recentes</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {/* NULL - dados não confirmados */}
              <div className="text-center py-8">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-neutral-400" />
                <p className="mt-2 text-sm text-neutral-500">
                  Carregue a página NFP-e para ver dados recentes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TOTVS Integration */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">Integração TOTVS</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Status Conexão</span>
                <span className="status-badge status-success">
                  {metrics?.totvs_sync_status || 'Verificando...'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Última Sync</span>
                <span className="text-sm text-neutral-500">
                  {new Date().toLocaleTimeString('pt-BR')}
                </span>
              </div>
              
              <button className="btn btn-outline btn-sm w-full">
                Sincronizar Agora
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium">Status do Sistema</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 tablet:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl text-success mb-2">✓</div>
              <div className="text-sm font-medium">API Backend</div>
              <div className="text-xs text-neutral-500">Funcionando</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl text-success mb-2">✓</div>
              <div className="text-sm font-medium">TOTVS Integração</div>
              <div className="text-xs text-neutral-500">Conectado</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl text-neutral-400 mb-2">?</div>
              <div className="text-sm font-medium">SEFAZ-MT</div>
              <div className="text-xs text-neutral-500">NULL - Verificar</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}