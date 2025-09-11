import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { AppShell } from '@/components/layout/AppShell'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route index element={<Dashboard />} />
        
        {/* NFP-e Module - Placeholders */}
        <Route path="nfpe" element={<ModulePlaceholder title="NFP-e Dashboard" />} />
        <Route path="nfpe/nova" element={<ModulePlaceholder title="Nova NFP-e" />} />
        <Route path="nfpe/lista" element={<ModulePlaceholder title="Lista NFP-e" />} />
        <Route path="nfpe/:id" element={<ModulePlaceholder title="Detalhes NFP-e" />} />
        
        {/* Produtos Module - Placeholders */}
        <Route path="produtos" element={<ModulePlaceholder title="Catálogo Produtos" />} />
        <Route path="produtos/novo" element={<ModulePlaceholder title="Novo Produto" />} />
        <Route path="produtos/estoque" element={<ModulePlaceholder title="Controle Estoque" />} />
        
        {/* Clientes Module - Placeholders */}
        <Route path="clientes" element={<ModulePlaceholder title="Lista Clientes" />} />
        <Route path="clientes/novo" element={<ModulePlaceholder title="Novo Cliente" />} />
        <Route path="clientes/:id/historico" element={<ModulePlaceholder title="Histórico Cliente" />} />
        
        {/* Relatórios Module - Placeholders */}
        <Route path="relatorios/fiscais" element={<ModulePlaceholder title="Relatórios Fiscais" />} />
        <Route path="relatorios/producao" element={<ModulePlaceholder title="Relatórios Produção" />} />
        <Route path="relatorios/financeiro" element={<ModulePlaceholder title="Relatórios Financeiro" />} />
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

// Placeholder Component for MVP modules
const ModulePlaceholder: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-200 pb-5">
        <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
        <p className="mt-2 text-sm text-neutral-700">
          Módulo em desenvolvimento - MVP Frontend
        </p>
      </div>

      <div className="card">
        <div className="card-body text-center py-12">
          <div className="text-6xl mb-4">🚧</div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            Módulo em Desenvolvimento
          </h3>
          <p className="text-neutral-600 max-w-md mx-auto">
            Este módulo será implementado nas próximas iterações do MVP. 
            A estrutura e navegação estão prontas para desenvolvimento.
          </p>
          <div className="mt-6 space-y-2 text-sm text-neutral-500">
            <p><strong>APIs Disponíveis:</strong> Backend FastAPI configurado</p>
            <p><strong>Integração:</strong> TOTVS + SEFAZ-MT implementados</p>
            <p><strong>Autenticação:</strong> JWT funcionando</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// 404 Component
const NotFound: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-body text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            Página não encontrada
          </h3>
          <p className="text-neutral-600">
            A página que você está procurando não existe.
          </p>
        </div>
      </div>
    </div>
  )
}

export default App