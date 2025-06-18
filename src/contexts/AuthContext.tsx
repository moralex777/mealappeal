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
  billing_cycle?: 'free' | 'monthly' | 'yearly' | null
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
  signIn: (email: string, password: string) => Promise<{ data?: any; error: any }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ data?: any; error: any }>
  resetPassword: (email: string) => Promise<{ data?: any; error: any }>
  refreshProfile: () => Promise<void>
  refreshMealCount: () => Promise<void>
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
    if (!profile) {return false}

    const isPremium = profile.subscription_tier === 'premium_monthly' || profile.subscription_tier === 'premium_yearly'

    if (!isPremium) {return false}

    // If no expiration date, assume active
    if (!profile.subscription_expires_at) {return true}

    // Check if subscription hasn't expired
    const expirationDate = new Date(profile.subscription_expires_at)
    return expirationDate > new Date()
  }

  // Helper function to check if subscription is expired
  const isSubscriptionExpired = (): boolean => {
    if (!profile || profile.subscription_tier === 'free') {return false}

    if (!profile.subscription_expires_at) {return false}

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

            try {
              const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle()

              if (error) {
                console.error('❌ Profile query error:', error)
                // If it's a column not found error OR no profile exists, try a more basic query
                if (error.message.includes('billing_cycle') || error.message.includes('subscription_expires_at') || error.message.includes('stripe_subscription_id') || error.message.includes('multiple (or no) rows returned')) {
                  console.log('🔄 Retrying with basic profile query...')
                  const { data: basicData, error: basicError } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, subscription_tier, meal_count, monthly_shares_used, created_at, updated_at, stripe_customer_id')
                    .eq('user_id', session.user.id)
                    .maybeSingle()
                  
                  if (basicError) {
                    console.error('❌ Basic profile query failed:', basicError.message)
                    // If no profile exists, create a default one in memory
                    if (basicError.message.includes('multiple (or no) rows returned')) {
                      console.log('🔧 No profile exists, creating default profile in memory...')
                      const defaultProfile = {
                        id: session.user.id,
                        email: session.user.email || '',
                        full_name: session.user.user_metadata?.full_name || '',
                        avatar_url: session.user.user_metadata?.avatar_url || null,
                        subscription_tier: 'free' as const,
                        subscription_expires_at: null,
                        billing_cycle: 'free' as const,
                        meal_count: 0,
                        monthly_shares_used: 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        stripe_customer_id: null,
                        stripe_subscription_id: null,
                        subscription_status: 'inactive',
                        share_reset_date: new Date().toISOString(),
                      }
                      setProfile(defaultProfile)
                      
                      // Try to create the profile in the database for future use
                      supabase.from('profiles').insert([{
                        user_id: session.user.id,
                        email: session.user.email || '',
                        full_name: session.user.user_metadata?.full_name || '',
                        avatar_url: session.user.user_metadata?.avatar_url,
                        subscription_tier: 'free',
                        meal_count: 0,
                        monthly_shares_used: 0,
                        stripe_customer_id: null,
                      }]).then(({ error: insertError }) => {
                        if (insertError) {
                          console.log('⚠️  Could not create profile in database:', insertError.message)
                        } else {
                          console.log('✅ Profile created in database for future use')
                        }
                      })
                    }
                  } else if (basicData) {
                    const profileData = {
                      ...basicData,
                      email: session.user.email || '',
                      billing_cycle: 'free', // Default for missing column
                      subscription_expires_at: null, // Default for missing column
                      stripe_subscription_id: null, // Default for missing column
                      subscription_status: 'inactive',
                      share_reset_date: new Date().toISOString(),
                    }
                    setProfile(profileData)
                  }
                  isFetchingProfile = false
                  return
                }
              }

              if (data) {
              console.log('✅ Profile set')
              // Calculate subscription status based on the data we're about to set
              const isPremium = data.subscription_tier === 'premium_monthly' || data.subscription_tier === 'premium_yearly'
              const isActive = isPremium && (!data.subscription_expires_at || new Date(data.subscription_expires_at) > new Date())
              
              const profileData = {
                ...data,
                email: session.user.email || '',
                billing_cycle: data.billing_cycle || 'free', // Default for missing column
                subscription_expires_at: data.subscription_expires_at || null, // Default for missing column
                stripe_subscription_id: data.stripe_subscription_id || null, // Default for missing column
                subscription_status: isActive ? 'active' : 'inactive',
                share_reset_date: new Date().toISOString(), // TODO: Implement proper share reset logic
              }
              
              setProfile(profileData)
              }
            } catch (profileError) {
              console.error('❌ Profile fetch error:', profileError)
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
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle()

      if (error) {
        console.error('❌ Refresh query error:', error)
        // If it's a column not found error, try a more basic query
        if (error.message.includes('billing_cycle') || error.message.includes('subscription_expires_at') || error.message.includes('stripe_subscription_id')) {
          console.log('🔄 Retrying refresh with basic profile query...')
          const { data: basicData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, subscription_tier, meal_count, monthly_shares_used, created_at, updated_at, stripe_customer_id')
            .eq('user_id', user.id)
            .maybeSingle()
          
          if (basicData) {
            setProfile({
              ...basicData,
              email: user.email || '',
              billing_cycle: 'free', // Default for missing column
              subscription_expires_at: null, // Default for missing column
              stripe_subscription_id: null, // Default for missing column
              subscription_status: 'inactive',
              share_reset_date: new Date().toISOString(),
            })
          }
          isFetchingProfile = false
          return
        }
      }

      if (data) {
        setProfile({
          ...data,
          email: user.email || '',
          billing_cycle: data.billing_cycle || 'free', // Default for missing column
          subscription_expires_at: data.subscription_expires_at || null, // Default for missing column
          stripe_subscription_id: data.stripe_subscription_id || null, // Default for missing column
          subscription_status: hasActivePremium() ? 'active' : 'inactive',
          share_reset_date: new Date().toISOString(), // TODO: Implement proper share reset logic
        })
      }
    } catch (error) {
      console.error('❌ Refresh error:', error)
    }
    isFetchingProfile = false
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {throw error}
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      if (error) {throw error}
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) {throw error}
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const refreshMealCount = async () => {
    // This is handled automatically by database triggers
    // Just refresh the profile to get updated count
    await refreshProfile()
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
      signIn,
      signUp,
      resetPassword,
      refreshProfile,
      refreshMealCount,
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
