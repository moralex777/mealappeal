'use client'

import { Camera, Crown, Home, LogOut, MenuIcon, User, Users, X } from 'lucide-react'
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
    const baseStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 16px',
      borderRadius: '12px',
      fontWeight: '500',
      fontSize: '14px',
      transition: 'all 0.2s ease',
      textDecoration: 'none',
      cursor: 'pointer',
      border: '1px solid transparent',
    }

    const activeStyle: React.CSSProperties = {
      ...baseStyle,
      background: 'linear-gradient(to right, rgba(34, 197, 94, 0.15), rgba(234, 88, 12, 0.15))',
      color: '#1f2937',
      fontWeight: '600',
      borderColor: 'rgba(255, 255, 255, 0.4)',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    }

    const inactiveStyle: React.CSSProperties = {
      ...baseStyle,
      color: '#6b7280',
      background: 'transparent',
    }

    const content = (
      <>
        <Icon className="h-4 w-4" style={{ width: '16px', height: '16px' }} />
        <span className="hidden sm:inline">{children}</span>
      </>
    )

    if (onClick) {
      return (
        <button
          onClick={onClick}
          style={isActive ? activeStyle : inactiveStyle}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
              e.currentTarget.style.color = '#1f2937'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#6b7280'
              e.currentTarget.style.borderColor = 'transparent'
            }
          }}
        >
          {content}
        </button>
      )
    }

    if (href) {
      return (
        <Link
          href={href}
          style={isActive ? activeStyle : inactiveStyle}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
              e.currentTarget.style.color = '#1f2937'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#6b7280'
              e.currentTarget.style.borderColor = 'transparent'
            }
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
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          // Ensure navigation is visible
          display: 'block',
          position: 'fixed',
          width: '100%',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textDecoration: 'none',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(to bottom right, #22c55e, #ea580c)',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <Camera style={{ width: '20px', height: '20px', color: 'white' }} />
              </div>
              <h1
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(to right, #16a34a, #ea580c)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  margin: 0,
                }}
              >
                MealAppeal
              </h1>
            </Link>

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
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40,
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            display: 'block',
          }}
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            style={{
              position: 'absolute',
              top: '72px',
              right: '16px',
              left: '16px',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
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
