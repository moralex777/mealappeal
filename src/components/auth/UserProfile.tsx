'use client'

import { Crown, LogOut, Settings, User } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/AuthContext'

export function UserProfile() {
  const { user, profile, signOut, hasActivePremium, isSubscriptionExpired } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      toast.success('👋 Signed out successfully', {
        description: 'See you next time!',
      })
    } catch (error) {
      toast.error('Sign out failed', {
        description: 'Please try again.',
      })
    } finally {
      setIsSigningOut(false)
    }
  }

  if (!user || !profile) {
    return null
  }

  const isPremium = hasActivePremium()
  const isExpired = isSubscriptionExpired()

  const getSubscriptionBadge = () => {
    if (profile.subscription_tier === 'free') {
      return (
        <span style={{
          fontSize: '0.75rem',
          padding: '0.25rem 0.5rem',
          borderRadius: '0.375rem',
          background: 'rgba(107, 114, 128, 0.1)',
          color: '#4b5563',
          border: '1px solid rgba(107, 114, 128, 0.2)',
        }}>
          Free
        </span>
      )
    }

    if (isExpired) {
      return (
        <span style={{
          fontSize: '0.75rem',
          padding: '0.25rem 0.5rem',
          borderRadius: '0.375rem',
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#dc2626',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        }}>
          Expired
        </span>
      )
    }

    return (
      <span style={{
        fontSize: '0.75rem',
        padding: '0.25rem 0.5rem',
        borderRadius: '0.375rem',
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(251, 146, 60, 0.1) 100%)',
        color: '#16a34a',
        border: '1px solid rgba(34, 197, 94, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
      }}>
        <Crown style={{ height: '0.75rem', width: '0.75rem' }} />
        Premium
      </span>
    )
  }

  const getExpirationInfo = () => {
    if (profile.subscription_tier === 'free' || !profile.subscription_expires_at) {
      return null
    }

    const expirationDate = new Date(profile.subscription_expires_at)
    const now = new Date()
    const daysLeft = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysLeft <= 0) {
      return (
        <p style={{
          fontSize: '0.75rem',
          color: '#dc2626',
          margin: '0.25rem 0 0 0',
        }}>
          Subscription expired
        </p>
      )
    }

    if (daysLeft <= 7) {
      return (
        <p style={{
          fontSize: '0.75rem',
          color: '#ea580c',
          margin: '0.25rem 0 0 0',
        }}>
          Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
        </p>
      )
    }

    return (
      <p style={{
        fontSize: '0.75rem',
        color: '#6b7280',
        margin: '0.25rem 0 0 0',
      }}>
        {profile.billing_cycle === 'yearly' ? 'Annual' : 'Monthly'} plan
      </p>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20"
        >
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || 'User avatar'}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <User className="h-5 w-5 text-white/80" />
          )}
          {isPremium && (
            <Crown
              className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 bg-white rounded-full p-0.5"
              style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 border-white/20 bg-white/90 backdrop-blur-md"
        align="end"
        forceMount
      >
        <DropdownMenuLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontWeight: '500', margin: 0 }}>
                  {profile.full_name || 'MealAppeal User'}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  {user.email}
                </p>
              </div>
              {getSubscriptionBadge()}
            </div>
            {getExpirationInfo()}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-white/20" />

        {/* Meal Count & Usage */}
        <div style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.5)', margin: '0.25rem', borderRadius: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Meals Analyzed</span>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#16a34a' }}>
              {profile.meal_count}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Monthly Shares</span>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#16a34a' }}>
              {profile.monthly_shares_used}/3
            </span>
          </div>
        </div>

        <DropdownMenuSeparator className="bg-white/20" />

        <DropdownMenuItem asChild>
          <Link href="/account" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings className="h-4 w-4" />
            Account Settings
          </Link>
        </DropdownMenuItem>

        {!isPremium && (
          <DropdownMenuItem asChild>
            <Link
              href="/upgrade"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #16a34a 0%, #ea580c 100%)',
                color: 'white',
                fontWeight: '500',
                margin: '0.25rem',
                borderRadius: '0.375rem',
              }}
            >
              <Crown className="h-4 w-4" />
              Upgrade to Premium
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="bg-white/20" />

        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isSigningOut}
          style={{
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {isSigningOut ? (
            <>
              <div
                style={{
                  height: '1rem',
                  width: '1rem',
                  borderRadius: '50%',
                  border: '2px solid currentColor',
                  borderTop: '2px solid transparent',
                  animation: 'spin 1s linear infinite',
                }}
              />
              Signing out...
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              Sign out
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
