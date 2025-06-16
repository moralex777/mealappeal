'use client'

import { Camera, Crown, Home, LogOut, MenuIcon, User, Users, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/contexts/AuthContext'
import { useStreak } from '@/contexts/StreakContext'

export function Navigation() {
  const { user, profile, signOut } = useAuth()
  const { streak, mealsToday } = useStreak()
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [greeting, setGreeting] = useState({ text: '', emoji: '' })

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) {
      setGreeting({ text: 'Good morning', emoji: '🌅' })
    } else if (hour < 17) {
      setGreeting({ text: 'Good afternoon', emoji: '☀️' })
    } else {
      setGreeting({ text: 'Good evening', emoji: '🌙' })
    }
  }, [])

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
      'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 no-underline'
    const activeClasses =
      'bg-gradient-to-r from-green-500/15 to-orange-500/15 text-gray-800 font-semibold border border-white/40 shadow-sm'
    const inactiveClasses = 'text-gray-600 hover:bg-white/30 hover:text-gray-800 hover:border-white/30 border border-transparent'

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
          style={{
            textDecoration: 'none',
            textUnderlineOffset: '0',
          }}
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
      'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 no-underline'
    const activeClasses =
      'bg-gradient-to-r from-green-500/15 to-orange-500/15 text-gray-800 font-semibold border border-white/40'
    const inactiveClasses = 'text-gray-600 hover:bg-white/30 hover:text-gray-800'

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
          style={{
            textDecoration: 'none',
            textUnderlineOffset: '0',
          }}
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
        className="fixed top-0 right-0 left-0 z-50"
        style={{
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-3 transition-transform duration-200 hover:scale-105"
                style={{ textDecoration: 'none' }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-orange-500 shadow-md transition-transform duration-300 hover:scale-110">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <h1 className="bg-gradient-to-r from-green-600 to-orange-600 bg-clip-text text-xl font-bold text-transparent hidden sm:block">
                  MealAppeal
                </h1>
              </Link>
              
              {/* Dynamic Content for Mobile */}
              {user && (
                <div className="flex items-center gap-3 text-sm text-gray-600 md:hidden">
                  {streak > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-orange-500">🔥</span>
                      <span className="font-semibold">{streak}</span>
                    </div>
                  )}
                  <div className="hidden xs:flex items-center gap-1">
                    <span>{greeting.emoji}</span>
                    <span className="font-medium">{greeting.text}!</span>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-4 lg:flex">
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
                  <NavLink href="/account" icon={User} isActive={isActivePage('/account')}>
                    Account
                  </NavLink>
                  <NavLink href="/upgrade" icon={Crown} isActive={isActivePage('/upgrade')}>
                    Upgrade
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

            {/* Tablet Navigation - Medium screens */}
            <div className="hidden items-center gap-3 md:flex lg:hidden">
              {user ? (
                <>
                  <NavLink href="/" icon={Home} isActive={isActivePage('/')}>
                    <span className="sr-only">Home</span>
                  </NavLink>
                  <NavLink href="/camera" icon={Camera} isActive={isActivePage('/camera')}>
                    <span className="sr-only">Camera</span>
                  </NavLink>
                  <NavLink href="/meals" icon={Users} isActive={isActivePage('/meals')}>
                    <span className="sr-only">Meals</span>
                  </NavLink>
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 hover:scale-105 text-gray-700 hover:bg-white/50 backdrop-blur-sm"
                  >
                    <MenuIcon className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <NavLink href="/" icon={Home} isActive={isActivePage('/')}>
                    <span className="sr-only">Home</span>
                  </NavLink>
                  <NavLink href="/signup" icon={User} isActive={isActivePage('/signup')}>
                    <span className="sr-only">Sign Up</span>
                  </NavLink>
                  <NavLink href="/login" icon={User} isActive={isActivePage('/login')}>
                    <span className="sr-only">Login</span>
                  </NavLink>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-center rounded-xl p-2.5 text-gray-600 transition-all duration-200 hover:bg-white/30 md:hidden border border-white/30 bg-white/20 backdrop-blur-sm"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
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
            className="absolute top-16 right-0 left-0 mx-4 mt-2 rounded-2xl border border-white/30 p-4 shadow-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
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
                  <MobileNavLink href="/account" icon={User} isActive={isActivePage('/account')}>
                    Account
                  </MobileNavLink>
                  <MobileNavLink href="/upgrade" icon={Crown} isActive={isActivePage('/upgrade')}>
                    Upgrade
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
