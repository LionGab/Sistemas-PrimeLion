import React from 'react'
import { Bars3Icon, UserCircleIcon } from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

interface HeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logout realizado com sucesso')
      navigate('/login')
    } catch (error) {
      toast.error('Erro ao fazer logout')
    }
  }

  return (
    <header className="bg-primary-800 shadow-sm border-b border-primary-700">
      <div className="container-mobile container-tablet container-desktop">
        <div className="flex justify-between items-center h-16">
          {/* Left Side - Logo + Menu */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              type="button"
              className="tablet:hidden p-2 rounded-md text-primary-200 hover:text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-white"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-secondary-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🌾</span>
                </div>
              </div>
              <div className="hidden mobile:block">
                <h1 className="text-xl font-bold text-white">
                  Fazenda Brasil
                </h1>
                <p className="text-xs text-primary-200">
                  NFP-e Automação
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - User Menu */}
          <div className="flex items-center">
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="flex items-center space-x-3 p-2 rounded-md text-primary-200 hover:text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-white">
                <UserCircleIcon className="h-6 w-6" />
                <div className="hidden tablet:block text-left">
                  <p className="text-sm font-medium text-white">
                    {user?.nome_completo || 'Usuário'}
                  </p>
                  <p className="text-xs text-primary-200">
                    {user?.cargo || 'Operador'}
                  </p>
                </div>
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white divide-y divide-neutral-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="px-1 py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={`${
                            active ? 'bg-primary-50 text-primary-900' : 'text-neutral-900'
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        >
                          <UserCircleIcon className="mr-2 h-5 w-5" />
                          Meu Perfil
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                  <div className="px-1 py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={`${
                            active ? 'bg-error text-white' : 'text-neutral-900'
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        >
                          Sair
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </header>
  )
}