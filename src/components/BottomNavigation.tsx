'use client'

import { Camera, Home, User, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useAuth } from '@/contexts/AuthContext'

export function BottomNavigation() {
  const { user } = useAuth()
  const pathname = usePathname()

  // Don't show bottom nav for non-authenticated users or on auth pages
  if (!user || pathname === '/login' || pathname === '/signup') {
    return null
  }

  const isActivePage = (path: string) => pathname === path

  const NavItem = ({
    href,
    icon: Icon,
    label,
    isActive = false,
  }: {
    href: string
    icon: React.ComponentType<{ className?: string }>
    label: string
    isActive?: boolean
  }) => {
    return (
      <Link
        href={href}
        className={`flex flex-col items-center justify-center py-2 px-1 transition-all duration-200 ${
          isActive
            ? 'text-green-600'
            : 'text-gray-600 hover:text-green-500'
        }`}
      >
        <div
          className={`p-2 rounded-xl transition-all duration-200 ${
            isActive
              ? 'bg-gradient-to-r from-green-500/20 to-orange-500/20 scale-110'
              : 'hover:bg-white/30'
          }`}
        >
          <Icon className={`h-6 w-6 ${isActive ? 'text-green-600' : ''}`} />
        </div>
        <span
          className={`text-xs font-medium mt-1 ${
            isActive ? 'text-green-600' : 'text-gray-600'
          }`}
        >
          {label}
        </span>
      </Link>
    )
  }

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        padding: '0 16px 16px 16px',
      }}
      className="md:hidden"
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          padding: '4px',
        }}
      >
        <div className="grid grid-cols-4 px-2 py-1">
          <NavItem
            href="/"
            icon={Home}
            label="Home"
            isActive={isActivePage('/')}
          />
          <NavItem
            href="/camera"
            icon={Camera}
            label="Camera"
            isActive={isActivePage('/camera')}
          />
          <NavItem
            href="/meals"
            icon={Users}
            label="Meals"
            isActive={isActivePage('/meals')}
          />
          <NavItem
            href="/account"
            icon={User}
            label="Account"
            isActive={isActivePage('/account') || pathname.startsWith('/account/')}
          />
        </div>
      </div>
      {/* Bottom safe area spacer */}
      <div className="h-8 bg-transparent" />
    </div>
  )
}