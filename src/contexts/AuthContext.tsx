'use client'

// MealAppeal Authentication Context Provider
// Action 027: Global user authentication state management

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, DatabaseHelpers } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

// Profile type from database
type Profile = Database['public']['Tables']['profiles']['Row']

// Authentication context interface
interface AuthContextType {
  // User state
  user: User | null
  profile: Profile | null
  session: Session | null
  
  // Loading states
  loading: boolean
  profileLoading: boolean
  
  // Authentication methods
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  
  // Profile methods
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
  
  // Subscription helpers
  isPremium: boolean
  canSharePublicly: boolean
  storageStats: {
    totalMeals: number
    expiringMeals: number
    daysUntilNextExpiry: number
    monthlySharesUsed: number
  } | null
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Authentication Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // State management
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [storageStats, setStorageStats] = useState<AuthContextType['storageStats']>(null)

  // Computed values
  const isPremium = profile?.subscription_tier === 'premium'
  const canSharePublicly = isPremium || (profile?.monthly_shares_used || 0) < 3

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await loadUserProfile(session.user.id)
      } else {
        setProfile(null)
        setStorageStats(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load user profile from database
  const loadUserProfile = async (userId: string) => {
    setProfileLoading(true)
    try {
      let { data: profileData, error: profileError } = await DatabaseHelpers.getUserProfile(userId)
      
      // If profile doesn't exist, create it automatically
      if (profileError || !profileData) {
        console.log('Profile not found, creating for user:', userId)
        
        // Get user data from current session
        const currentUser = user || session?.user
        
        const { data: newProfile, error: createError } = await DatabaseHelpers.upsertProfile({
          id: userId,
          email: currentUser?.email || 'alex@propertytalents.com',
          full_name: currentUser?.user_metadata?.full_name || null,
          subscription_tier: 'free',
          subscription_status: 'active',
        })
        
        if (!createError && newProfile) {
          setProfile(newProfile)
          console.log('Profile created successfully:', newProfile)
        } else {
          console.error('Error creating profile:', createError)
          return
        }
      } else {
        setProfile(profileData)
        console.log('Profile loaded successfully:', profileData)
      }
      
      // Load storage stats regardless
      await loadStorageStats(userId)
    } catch (error) {
      console.error('Error in loadUserProfile:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  // Load user storage statistics
  const loadStorageStats = async (userId: string) => {
    try {
      const { data: stats, error } = await DatabaseHelpers.getUserStorageStats(userId)
      if (!error && stats) {
        setStorageStats(stats)
      }
    } catch (error) {
      console.error('Error loading storage stats:', error)
    }
  }

  // Authentication methods
  const signUp = async (email: string, password: string, fullName?: string) => {
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

      if (!error && data.user) {
        // Create profile in database
        await DatabaseHelpers.upsertProfile({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName || null,
          subscription_tier: 'free',
          subscription_status: 'active',
        })
      }

      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (!error) {
        setProfile(null)
        setStorageStats(null)
      }
      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  // Profile management
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') }

    try {
      const { data, error } = await DatabaseHelpers.upsertProfile({
        id: user.id,
        ...updates,
      } as Database['public']['Tables']['profiles']['Insert'])

      if (!error && data) {
        setProfile(data)
        // Refresh storage stats if subscription changed
        if (updates.subscription_tier) {
          await loadStorageStats(user.id)
        }
      }

      return { error }
    } catch (error) {
      return { error }
    }
  }

  const refreshProfile = async () => {
    if (!user) return
    await loadUserProfile(user.id)
  }

  // Context value
  const value: AuthContextType = {
    // User state
    user,
    profile,
    session,
    
    // Loading states
    loading,
    profileLoading,
    
    // Authentication methods
    signUp,
    signIn,
    signOut,
    resetPassword,
    
    // Profile methods
    updateProfile,
    refreshProfile,
    
    // Subscription helpers
    isPremium,
    canSharePublicly,
    storageStats,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Export types for use in other components
export type { Profile, AuthContextType }