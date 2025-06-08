'use client'

import { Camera, Home, LogOut, MenuIcon, User, Users, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/contexts/AuthContext'

export function Navigation() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('👋 Signed out successfully!', {
        description: 'Come back soon for more food discoveries! 🍽️',
      })
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Sign out failed', {
        description: 'Please try again.',
      })
    }
  }

  const isActivePage = (path: string) => pathname === path

  const NavLink = ({
    href,
    children,
    icon: Icon,
    isActive = false,
    onClick,
  }: {
    href?: string
    children: React.ReactNode
    icon: React.ComponentType<{ className?: string }>
    isActive?: boolean
    onClick?: () => void
  }) => {
    const baseClasses =
      'flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 hover:scale-105'
    const activeClasses =
      'bg-gradient-to-r from-green-500/20 to-orange-500/20 text-green-700 border border-green-200/50 backdrop-blur-sm'
    const inactiveClasses = 'text-gray-700 hover:bg-white/50 hover:text-gray-900 backdrop-blur-sm'

    const content = (
      <>
        <Icon className="h-4 w-4" />
        <span className="hidden sm:inline">{children}</span>
      </>
    )

    if (onClick) {
      return (
        <button
          onClick={onClick}
          className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
          {content}
        </button>
      )
    }

    if (href) {
      return (
        <Link
          href={href}
          className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
          {content}
        </Link>
      )
    }

    return null
  }

  const MobileNavLink = ({
    href,
    children,
    icon: Icon,
    isActive = false,
    onClick,
  }: {
    href?: string
    children: React.ReactNode
    icon: React.ComponentType<{ className?: string }>
    isActive?: boolean
    onClick?: () => void
  }) => {
    const baseClasses =
      'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200'
    const activeClasses =
      'bg-gradient-to-r from-green-500/20 to-orange-500/20 text-green-700 border border-green-200/50'
    const inactiveClasses = 'text-gray-700 hover:bg-white/50'

    const content = (
      <>
        <Icon className="h-5 w-5" />
        <span>{children}</span>
      </>
    )

    const handleClick = () => {
      setIsMobileMenuOpen(false)
      onClick?.()
    }

    if (onClick) {
      return (
        <button
          onClick={handleClick}
          className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} w-full text-left`}
        >
          {content}
        </button>
      )
    }

    if (href) {
      return (
        <Link
          href={href}
          onClick={() => setIsMobileMenuOpen(false)}
          className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
          {content}
        </Link>
      )
    }

    return null
  }

  return (
    <>
      {/* Main Navigation */}
      <nav
        className="fixed top-0 right-0 left-0 z-50 border-b border-white/20 bg-white/10 backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 transition-transform duration-200 hover:scale-105"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-orange-500 shadow-lg transition-transform duration-300 hover:scale-110">
                <Camera className="h-5 w-5 text-white" />
              </div>
              <h1 className="bg-gradient-to-r from-green-600 to-orange-600 bg-clip-text text-xl font-bold text-transparent">
                MealAppeal
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-6 md:flex">
              {user ? (
                // Authenticated Navigation
                <>
                  <NavLink href="/" icon={Home} isActive={isActivePage('/')}>
                    Home
                  </NavLink>
                  <NavLink href="/camera" icon={Camera} isActive={isActivePage('/camera')}>
                    Camera
                  </NavLink>
                  <NavLink href="/meals" icon={Users} isActive={isActivePage('/meals')}>
                    Meals
                  </NavLink>
                  <NavLink icon={LogOut} onClick={handleSignOut}>
                    Sign Out
                  </NavLink>
                </>
              ) : (
                // Non-authenticated Navigation
                <>
                  <NavLink href="/" icon={Home} isActive={isActivePage('/')}>
                    Home
                  </NavLink>
                  <NavLink href="/signup" icon={User} isActive={isActivePage('/signup')}>
                    Sign Up
                  </NavLink>
                  <NavLink href="/login" icon={User} isActive={isActivePage('/login')}>
                    Login
                  </NavLink>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-xl p-2 text-gray-700 transition-colors duration-200 hover:bg-white/50 md:hidden"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="absolute top-16 right-0 left-0 mx-4 mt-2 rounded-2xl border border-white/30 bg-white/90 p-4 shadow-2xl backdrop-blur-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-2">
              {user ? (
                // Authenticated Mobile Navigation
                <>
                  <MobileNavLink href="/" icon={Home} isActive={isActivePage('/')}>
                    Home
                  </MobileNavLink>
                  <MobileNavLink href="/camera" icon={Camera} isActive={isActivePage('/camera')}>
                    Camera
                  </MobileNavLink>
                  <MobileNavLink href="/meals" icon={Users} isActive={isActivePage('/meals')}>
                    My Meals
                  </MobileNavLink>
                  <div className="mt-2 border-t border-gray-200 pt-2">
                    <MobileNavLink icon={LogOut} onClick={handleSignOut}>
                      Sign Out
                    </MobileNavLink>
                  </div>
                </>
              ) : (
                // Non-authenticated Mobile Navigation
                <>
                  <MobileNavLink href="/" icon={Home} isActive={isActivePage('/')}>
                    Home
                  </MobileNavLink>
                  <MobileNavLink href="/signup" icon={User} isActive={isActivePage('/signup')}>
                    Sign Up
                  </MobileNavLink>
                  <MobileNavLink href="/login" icon={User} isActive={isActivePage('/login')}>
                    Login
                  </MobileNavLink>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Spacer to prevent content from hiding behind fixed nav */}
      <div className="h-16" />
    </>
  )
}
