import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  DocumentTextIcon,
  CubeIcon,
  UsersIcon,
  ChartBarIcon,
  HomeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: HomeIcon,
  },
  {
    name: 'NFP-e',
    href: '/nfpe',
    icon: DocumentTextIcon,
    children: [
      { name: 'Dashboard', href: '/nfpe' },
      { name: 'Nova NFP-e', href: '/nfpe/nova' },
      { name: 'Lista', href: '/nfpe/lista' },
    ]
  },
  {
    name: 'Produtos',
    href: '/produtos',
    icon: CubeIcon,
    children: [
      { name: 'Catálogo', href: '/produtos' },
      { name: 'Novo Produto', href: '/produtos/novo' },
      { name: 'Estoque', href: '/produtos/estoque' },
    ]
  },
  {
    name: 'Clientes',
    href: '/clientes',
    icon: UsersIcon,
    children: [
      { name: 'Lista', href: '/clientes' },
      { name: 'Novo Cliente', href: '/clientes/novo' },
    ]
  },
  {
    name: 'Relatórios',
    href: '/relatorios',
    icon: ChartBarIcon,
    children: [
      { name: 'Fiscais', href: '/relatorios/fiscais' },
      { name: 'Produção', href: '/relatorios/producao' },
      { name: 'Financeiro', href: '/relatorios/financeiro' },
    ]
  },
]

export const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const location = useLocation()

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={clsx(
        'hidden tablet:flex tablet:flex-shrink-0 transition-all duration-300',
        open ? 'tablet:w-64' : 'tablet:w-16'
      )}>
        <div className="flex flex-col w-full">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-neutral-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = isActiveRoute(item.href)
                  
                  return (
                    <div key={item.name}>
                      <Link
                        to={item.href}
                        className={clsx(
                          'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                          isActive
                            ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-500'
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                        )}
                        title={!open ? item.name : ''}
                      >
                        <item.icon
                          className={clsx(
                            'flex-shrink-0 h-6 w-6',
                            isActive ? 'text-primary-500' : 'text-neutral-400 group-hover:text-neutral-500'
                          )}
                        />
                        {open && (
                          <span className="ml-3">{item.name}</span>
                        )}
                      </Link>

                      {/* Submenu */}
                      {open && item.children && isActive && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              to={child.href}
                              className={clsx(
                                'group flex items-center px-2 py-1 text-sm rounded-md transition-colors',
                                location.pathname === child.href
                                  ? 'text-primary-700 font-medium'
                                  : 'text-neutral-500 hover:text-neutral-700'
                              )}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </nav>
            </div>

            {/* Sidebar Toggle */}
            <div className="flex-shrink-0 flex border-t border-neutral-200 p-4">
              <button
                onClick={() => setOpen(!open)}
                className="flex-shrink-0 w-full group block"
                title={open ? 'Recolher menu' : 'Expandir menu'}
              >
                <div className="flex items-center justify-center">
                  <div className={clsx(
                    'w-8 h-8 bg-neutral-100 rounded-md flex items-center justify-center group-hover:bg-neutral-200 transition-colors',
                    !open && 'rotate-180'
                  )}>
                    <span className="text-neutral-600 text-sm">{'<'}</span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={clsx(
        'tablet:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-secondary-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-lg">🌾</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Menu</h2>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-md text-neutral-400 hover:text-neutral-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = isActiveRoute(item.href)
              
              return (
                <div key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className={clsx(
                      'group flex items-center px-2 py-3 text-base font-medium rounded-md',
                      isActive
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    )}
                  >
                    <item.icon
                      className={clsx(
                        'mr-3 flex-shrink-0 h-6 w-6',
                        isActive ? 'text-primary-500' : 'text-neutral-400'
                      )}
                    />
                    {item.name}
                  </Link>

                  {/* Mobile Submenu */}
                  {item.children && isActive && (
                    <div className="ml-9 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          to={child.href}
                          onClick={() => setOpen(false)}
                          className={clsx(
                            'block px-2 py-2 text-sm rounded-md',
                            location.pathname === child.href
                              ? 'text-primary-700 font-medium bg-primary-50'
                              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                          )}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
}