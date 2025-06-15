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
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <div
        className="mx-4 mb-4 rounded-2xl border border-white/30 bg-white/90 shadow-2xl backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
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