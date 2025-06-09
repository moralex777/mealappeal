'use client'

import { Camera, Crown } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/contexts/AuthContext'

export function Navigation(): JSX.Element | null {
  const { user, profile, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async (): Promise<void> => {
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

  // Don't render navigation on homepage - it has its own perfect implementation
  if (pathname === '/') {
    return null
  }

  return (
    <>
      {/* Main Navigation - Matches Homepage Layout */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '1rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '2rem',
          }}
        >
          {/* Logo - Exactly like homepage */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div
              style={{
                height: '2.5rem',
                width: '2.5rem',
                background: 'linear-gradient(135deg, #22c55e 0%, #f97316 100%)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'scale(1)',
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <Camera style={{ height: '1.5rem', width: '1.5rem', color: 'white' }} />
            </div>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                background: 'linear-gradient(to right, #16a34a, #ea580c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
              }}
            >
              MealAppeal
            </h1>
          </Link>

          {/* Navigation Links - Beautiful spacing like homepage */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {user ? (
              <>
                {/* Main Navigation Links */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <Link
                    href="/camera"
                    style={{
                      fontWeight: '500',
                      color: pathname === '/camera' ? '#16a34a' : 'rgba(55, 65, 81, 0.8)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                      borderBottom: pathname === '/camera' ? '2px solid #16a34a' : 'none',
                      paddingBottom: '0.25rem',
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      if (pathname !== '/camera') {
                        e.currentTarget.style.color = '#16a34a'
                      }
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      if (pathname !== '/camera') {
                        e.currentTarget.style.color = 'rgba(55, 65, 81, 0.8)'
                      }
                    }}
                  >
                    Camera
                  </Link>
                  <Link
                    href="/meals"
                    style={{
                      fontWeight: '500',
                      color: pathname === '/meals' ? '#16a34a' : 'rgba(55, 65, 81, 0.8)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                      borderBottom: pathname === '/meals' ? '2px solid #16a34a' : 'none',
                      paddingBottom: '0.25rem',
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      if (pathname !== '/meals') {
                        e.currentTarget.style.color = '#16a34a'
                      }
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      if (pathname !== '/meals') {
                        e.currentTarget.style.color = 'rgba(55, 65, 81, 0.8)'
                      }
                    }}
                  >
                    My Meals
                  </Link>
                  <Link
                    href="/"
                    style={{
                      fontWeight: '500',
                      color: 'rgba(55, 65, 81, 0.8)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.currentTarget.style.color = '#16a34a'
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.currentTarget.style.color = 'rgba(55, 65, 81, 0.8)'
                    }}
                  >
                    Home
                  </Link>
                </div>

                {/* Right Side Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {/* Upgrade Button for Free Users */}
                  {profile?.subscription_tier !== 'premium' && (
                    <Link
                      href="/upgrade"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'linear-gradient(135deg, #22c55e 0%, #f97316 100%)',
                        padding: '0.5rem 1rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: 'white',
                        textDecoration: 'none',
                        transform: 'scale(1)',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                        e.currentTarget.style.transform = 'scale(1.05)'
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <Crown style={{ height: '1rem', width: '1rem' }} />
                      <span>Upgrade</span>
                    </Link>
                  )}

                  {/* Sign Out Button */}
                  <button
                    onClick={handleSignOut}
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: 'rgba(55, 65, 81, 0.8)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                      padding: '0.5rem',
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.color = '#dc2626'
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.color = 'rgba(55, 65, 81, 0.8)'
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              // Non-authenticated Navigation (like homepage)
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link
                  href="/login"
                  style={{
                    padding: '0.5rem 1rem',
                    fontWeight: '500',
                    color: 'rgba(55, 65, 81, 0.8)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.color = '#16a34a'
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.color = 'rgba(55, 65, 81, 0.8)'
                  }}
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  style={{
                    background: 'linear-gradient(135deg, #22c55e 0%, #f97316 100%)',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '0.75rem',
                    fontWeight: '500',
                    color: 'white',
                    textDecoration: 'none',
                    transform: 'scale(1)',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.transform = 'scale(1.05)'
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}
