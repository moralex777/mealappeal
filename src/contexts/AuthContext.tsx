'use client'

import type { User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'

import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  subscription_tier: 'free' | 'premium_monthly' | 'premium_yearly'
  subscription_expires_at: string | null
  billing_cycle: 'free' | 'monthly' | 'yearly' | null
  subscription_status: string
  meal_count: number
  monthly_shares_used: number
  share_reset_date: string
  created_at: string
  updated_at: string
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  hasActivePremium: () => boolean
  isSubscriptionExpired: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Global flags to prevent multiple calls
let isInitialized = false
let isFetchingProfile = false

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Helper function to check if user has active premium
  const hasActivePremium = (): boolean => {
    if (!profile) return false

    const isPremium = profile.subscription_tier === 'premium_monthly' || profile.subscription_tier === 'premium_yearly'

    if (!isPremium) return false

    // If no expiration date, assume active
    if (!profile.subscription_expires_at) return true

    // Check if subscription hasn't expired
    const expirationDate = new Date(profile.subscription_expires_at)
    return expirationDate > new Date()
  }

  // Helper function to check if subscription is expired
  const isSubscriptionExpired = (): boolean => {
    if (!profile || profile.subscription_tier === 'free') return false

    if (!profile.subscription_expires_at) return false

    const expirationDate = new Date(profile.subscription_expires_at)
    return expirationDate <= new Date()
  }

  useEffect(() => {
    if (isInitialized) {
      return
    }
    isInitialized = true

    console.log('🔑 Auth initializing (ONCE)')

    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          console.log('✅ User found:', session.user.email)
          setUser(session.user)

          // Fetch profile ONCE
          if (!isFetchingProfile) {
            isFetchingProfile = true
            console.log('🔄 Getting profile...')

            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (data) {
              console.log('✅ Profile set')
              // Calculate subscription status based on the data we're about to set
              const isPremium = data.subscription_tier === 'premium_monthly' || data.subscription_tier === 'premium_yearly'
              const isActive = isPremium && (!data.subscription_expires_at || new Date(data.subscription_expires_at) > new Date())
              
              const profileData = {
                ...data,
                email: session.user.email || '',
                subscription_status: isActive ? 'active' : 'inactive',
                share_reset_date: new Date().toISOString(), // TODO: Implement proper share reset logic
              }
              
              setProfile(profileData)
            }
            isFetchingProfile = false
          }
        }

        setLoading(false)
      } catch (error) {
        console.error('❌ Auth error:', error)
        setLoading(false)
      }
    }

    // Auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Auth event:', event)

      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
        setProfile(null)
      } else if (session?.user && event !== 'INITIAL_SESSION') {
        setUser(session.user)
        // Don't fetch profile on every event to prevent loops
      }
      setLoading(false)
    })

    initAuth()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const refreshProfile = async () => {
    if (!user || isFetchingProfile) {
      return
    }

    isFetchingProfile = true
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()

      if (data) {
        setProfile({
          ...data,
          email: user.email || '',
          subscription_status: hasActivePremium() ? 'active' : 'inactive',
          share_reset_date: new Date().toISOString(), // TODO: Implement proper share reset logic
        })
      }
    } catch (error) {
      console.error('❌ Refresh error:', error)
    }
    isFetchingProfile = false
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      isInitialized = false // Reset for next login
      isFetchingProfile = false
    } catch (error) {
      console.error('❌ Sign out error:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signOut,
      refreshProfile,
      hasActivePremium,
      isSubscriptionExpired
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
