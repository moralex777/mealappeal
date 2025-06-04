'use client'

import type { User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'

import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  subscription_tier: 'free' | 'premium'
  subscription_status: string
  meal_count: number
  monthly_shares_used: number
  share_reset_date: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Global flags to prevent multiple calls
let isInitialized = false
let isFetchingProfile = false

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

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
              setProfile(data)
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
        setProfile(data)
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
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
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
