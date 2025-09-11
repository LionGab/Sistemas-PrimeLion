import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { StatusFooter } from './StatusFooter'
import { useAuthStore } from '@/stores/authStore'

export const AppShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { checkAuth, isLoading } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="loading-spinner w-8 h-8"></div>
          <p className="text-neutral-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <Header 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar 
          open={sidebarOpen}
          setOpen={setSidebarOpen}
        />

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Content Container */}
          <div className="container-mobile container-tablet container-desktop py-6">
            <Outlet />
          </div>
          
          {/* Status Footer */}
          <StatusFooter />
        </main>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 tablet:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}