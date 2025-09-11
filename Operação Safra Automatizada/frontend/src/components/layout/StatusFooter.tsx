import React from 'react'
import { useQuery } from 'react-query'
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'
import { apiClient } from '@/services/api'
import { TOTVSStatus } from '@/types/api'
import clsx from 'clsx'

export const StatusFooter: React.FC = () => {
  // TOTVS Status
  const { data: totvsSstatus, isLoading: totvLoading } = useQuery(
    'totvs-status',
    async () => {
      const response = await apiClient.get<TOTVSStatus>('/totvs/status')
      return response.data
    },
    {
      refetchInterval: 30000, // 30 segundos
      retry: 1,
    }
  )

  // SEFAZ Status - Placeholder (NULL - API não confirmada)
  const sefazStatus = null // NULL - sem evidência de endpoint específico

  const renderStatusIndicator = (
    label: string,
    status: 'online' | 'offline' | 'loading' | null,
    lastUpdate?: string
  ) => {
    let icon, colorClasses, statusText

    switch (status) {
      case 'online':
        icon = <CheckCircleIcon className="h-4 w-4" />
        colorClasses = 'text-success'
        statusText = 'Online'
        break
      case 'offline':
        icon = <XCircleIcon className="h-4 w-4" />
        colorClasses = 'text-error'
        statusText = 'Offline'
        break
      case 'loading':
        icon = <ClockIcon className="h-4 w-4 animate-spin" />
        colorClasses = 'text-warning'
        statusText = 'Verificando...'
        break
      default:
        icon = <ClockIcon className="h-4 w-4" />
        colorClasses = 'text-neutral-400'
        statusText = 'N/A'
    }

    return (
      <div className="flex items-center space-x-2">
        <div className={clsx('flex items-center', colorClasses)}>
          {icon}
        </div>
        <div className="text-xs">
          <span className="font-medium text-neutral-600">{label}:</span>
          <span className={clsx('ml-1', colorClasses)}>{statusText}</span>
          {lastUpdate && (
            <span className="text-neutral-400 ml-1">
              ({new Date(lastUpdate).toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })})
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <footer className="bg-white border-t border-neutral-200 mt-auto">
      <div className="container-mobile container-tablet container-desktop py-3">
        <div className="flex flex-col mobile:flex-row mobile:items-center mobile:justify-between space-y-2 mobile:space-y-0">
          {/* System Status */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* TOTVS Status */}
            {renderStatusIndicator(
              'TOTVS',
              totvLoading ? 'loading' : totvsSstatus?.status || 'offline',
              totvsSstatus?.timestamp
            )}

            {/* SEFAZ Status - NULL */}
            {renderStatusIndicator('SEFAZ-MT', sefazStatus)}

            {/* System Info */}
            <div className="text-neutral-400 hidden tablet:block">
              Sistema NFP-e v1.0.0
            </div>
          </div>

          {/* Copyright */}
          <div className="text-xs text-neutral-400">
            © 2025 Fazenda Brasil - Campo Verde/MT
          </div>
        </div>
      </div>
    </footer>
  )
}