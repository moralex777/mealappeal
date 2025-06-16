'use client'

import { Camera, Crown, Sparkles, TrendingUp, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useAuth } from '@/contexts/AuthContext'
import { useStreak } from '@/contexts/StreakContext'

export function BottomNavigation() {
  const { user, profile } = useAuth()
  const { streak, mealsToday } = useStreak()
  const pathname = usePathname()

  // Don't show bottom nav for non-authenticated users or on auth pages
  if (!user || pathname === '/login' || pathname === '/signup') {
    return null
  }

  const isActivePage = (path: string) => pathname === path
  const isPremium = profile?.subscription_tier === 'premium_monthly' || profile?.subscription_tier === 'premium_yearly'
  const analysesLeft = isPremium ? null : Math.max(0, 3 - mealsToday)

  const NavItem = ({
    href,
    icon: Icon,
    label,
    isActive = false,
    badge,
    isPrimary = false,
    showCrown = false,
  }: {
    href: string
    icon: React.ComponentType<{ className?: string }>
    label: string
    isActive?: boolean
    badge?: number | string
    isPrimary?: boolean
    showCrown?: boolean
  }) => {
    return (
      <Link
        href={href}
        className={`flex flex-col items-center justify-center py-2 px-1 transition-all duration-300 nav-transition ${
          isActive
            ? 'text-green-600 scale-105'
            : 'text-gray-600 hover:text-green-500 hover:scale-105'
        }`}
        onClick={(e) => {
          // Add haptic feedback on mobile
          if ('vibrate' in navigator && window.matchMedia('(hover: none)').matches) {
            navigator.vibrate(10)
          }
        }}
      >
        <div className="relative">
          <div
            className={`p-2 rounded-xl transition-all duration-300 ${
              isActive
                ? 'bg-gradient-to-r from-green-500/20 to-orange-500/20 scale-110 shadow-lg'
                : isPrimary
                ? 'bg-gradient-to-r from-green-500/10 to-orange-500/10 hover:from-green-500/20 hover:to-orange-500/20'
                : 'hover:bg-white/30'
            } ${
              isPrimary && !isActive ? 'animate-pulse-subtle' : ''
            } ${
              isActive ? 'animate-nav-glow' : ''
            }`}
            style={{
              boxShadow: isActive ? '0 0 20px rgba(16, 185, 129, 0.3)' : 'none',
            }}
          >
            <Icon className={`h-6 w-6 ${isActive ? 'text-green-600' : isPrimary ? 'text-green-600' : ''}`} />
            {showCrown && (
              <Crown className="absolute -top-1 -right-1 h-3 w-3 text-purple-600" />
            )}
          </div>
          {badge !== undefined && (
            <div 
              className={`absolute -top-1 -right-1 text-white text-xs rounded-full flex items-center justify-center font-bold ${
                typeof badge === 'string' && badge.includes('/') 
                  ? 'bg-orange-500 px-2 h-5 min-w-[28px]' 
                  : badge === 'NEW' 
                  ? 'bg-green-500 px-2 h-5 animate-pulse'
                  : 'bg-red-500 h-5 w-5 animate-badge-pulse'
              }`}
            >
              {typeof badge === 'number' && badge > 9 ? '9+' : badge}
            </div>
          )}
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
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.1), 0 20px 25px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div className="grid grid-cols-4 px-2 py-1">
          <NavItem
            href="/camera"
            icon={Camera}
            label="Snap"
            isActive={isActivePage('/camera') || pathname === '/'}
            isPrimary={true}
            badge={analysesLeft !== null && analysesLeft < 3 ? `${analysesLeft}/3` : undefined}
          />
          <NavItem
            href="/meals"
            icon={TrendingUp}
            label="Feed"
            isActive={isActivePage('/meals')}
            badge={profile?.meal_count && profile.meal_count > 0 ? undefined : 'NEW'}
          />
          <NavItem
            href="/achievements"
            icon={Sparkles}
            label="Streaks"
            isActive={isActivePage('/achievements')}
            badge={streak > 0 ? streak : undefined}
          />
          <NavItem
            href="/account"
            icon={User}
            label="Profile"
            isActive={isActivePage('/account') || pathname.startsWith('/account/')}
            showCrown={isPremium}
          />
        </div>
      </div>
      {/* Free tier limit indicator */}
      {!isPremium && analysesLeft !== null && analysesLeft === 0 && (
        <div 
          className="absolute top-0 left-0 right-0 -translate-y-full px-4 pb-2"
        >
          <Link href="/upgrade">
            <div 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center py-2 px-4 rounded-full text-sm font-medium shadow-lg"
              style={{
                animation: 'pulse 2s ease-in-out infinite',
              }}
            >
              Daily limit reached 👑 Upgrade for unlimited analyses
            </div>
          </Link>
        </div>
      )}
      
      {/* Bottom safe area spacer */}
      <div className="h-8 bg-transparent" />
    </div>
  )
}