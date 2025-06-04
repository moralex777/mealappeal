'use client'

// Enhanced Authentication Hook with Context7-powered Supabase patterns
// Implements latest Next.js 14 and Supabase auth best practices

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { AuthError, Session, User } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'

interface IUserProfile {
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

interface IAuthState {
  user: User | null
  profile: IUserProfile | null
  session: Session | null
  loading: boolean
  error: AuthError | null
}

interface IAuthActions {
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updateProfile: (updates: Partial<IUserProfile>) => Promise<{ error: AuthError | null }>
  refreshSession: () => Promise<void>
  refreshProfile: () => Promise<void>
}

type AuthHookReturn = IAuthState & IAuthActions

export function useEnhancedAuth(): AuthHookReturn {
  const [authState, setAuthState] = useState<IAuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null,
  })

  const supabase = createClientComponentClient()
  const mounted = useRef(true)
  const profileLoading = useRef(false)

  // Utility function to safely update state
  const updateState = useCallback((updates: Partial<IAuthState>) => {
    if (mounted.current) {
      setAuthState(prev => ({ ...prev, ...updates }))
    }
  }, [])

  // Enhanced profile fetching with caching and error handling
  const fetchProfile = useCallback(
    async (userId: string): Promise<IUserProfile | null> => {
      if (profileLoading.current) {
        return null
      }

      try {
        profileLoading.current = true

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) {
          console.error('Profile fetch error:', error)
          updateState({ error: error as unknown as AuthError })
          return null
        }

        return data as IUserProfile
      } catch (err) {
        console.error('Profile fetch exception:', err)
        return null
      } finally {
        profileLoading.current = false
      }
    },
    [supabase, updateState]
  )

  // Initialize authentication state with proper error handling
  const initializeAuth = useCallback(async () => {
    try {
      updateState({ loading: true, error: null })

      // Get current session using the latest Supabase pattern
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error('Session initialization error:', error)
        updateState({ error, loading: false })
        return
      }

      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        updateState({
          user: session.user,
          session,
          profile,
          loading: false,
        })
      } else {
        updateState({
          user: null,
          session: null,
          profile: null,
          loading: false,
        })
      }
    } catch (err) {
      console.error('Auth initialization error:', err)
      updateState({
        error: err as AuthError,
        loading: false,
      })
    }
  }, [supabase, updateState, fetchProfile])

  // Enhanced sign in with better error handling
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        updateState({ loading: true, error: null })

        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        })

        if (error) {
          updateState({ error, loading: false })
          return { error }
        }

        // Profile will be fetched by the auth state change listener
        return { error: null }
      } catch (err) {
        const error = err as AuthError
        updateState({ error, loading: false })
        return { error }
      }
    },
    [supabase, updateState]
  )

  // Enhanced sign up with profile creation
  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      try {
        updateState({ loading: true, error: null })

        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        })

        if (error) {
          updateState({ error, loading: false })
          return { error }
        }

        // Create profile immediately if user is confirmed
        if (data.user && !data.user.email_confirmed_at) {
          // Email confirmation required
          updateState({ loading: false })
        }

        return { error: null }
      } catch (err) {
        const error = err as AuthError
        updateState({ error, loading: false })
        return { error }
      }
    },
    [supabase, updateState]
  )

  // Enhanced sign out with cleanup
  const signOut = useCallback(async () => {
    try {
      updateState({ loading: true, error: null })

      const { error } = await supabase.auth.signOut()

      if (error) {
        updateState({ error, loading: false })
        return { error }
      }

      // Clear state immediately for better UX
      updateState({
        user: null,
        session: null,
        profile: null,
        loading: false,
      })

      return { error: null }
    } catch (err) {
      const error = err as AuthError
      updateState({ error, loading: false })
      return { error }
    }
  }, [supabase, updateState])

  // Password reset with proper redirect handling
  const resetPassword = useCallback(
    async (email: string) => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        })

        return { error }
      } catch (err) {
        return { error: err as AuthError }
      }
    },
    [supabase]
  )

  // Profile update with optimistic updates
  const updateProfile = useCallback(
    async (updates: Partial<IUserProfile>) => {
      if (!authState.user) {
        return { error: new Error('No authenticated user') as AuthError }
      }

      try {
        // Optimistic update
        if (authState.profile) {
          updateState({
            profile: { ...authState.profile, ...updates },
          })
        }

        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', authState.user.id)

        if (error) {
          // Revert optimistic update on error
          if (authState.profile) {
            updateState({ profile: authState.profile })
          }
          return { error: error as unknown as AuthError }
        }

        return { error: null }
      } catch (err) {
        return { error: err as AuthError }
      }
    },
    [supabase, authState.user, authState.profile, updateState]
  )

  // Refresh session manually
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error('Session refresh error:', error)
        return
      }

      if (data.session) {
        updateState({
          session: data.session,
          user: data.session.user,
        })
      }
    } catch (err) {
      console.error('Session refresh exception:', err)
    }
  }, [supabase, updateState])

  // Refresh profile manually
  const refreshProfile = useCallback(async () => {
    if (authState.user) {
      const profile = await fetchProfile(authState.user.id)
      if (profile) {
        updateState({ profile })
      }
    }
  }, [authState.user, fetchProfile, updateState])

  // Initialize auth and set up listeners
  useEffect(() => {
    mounted.current = true

    // Initialize authentication state
    initializeAuth()

    // Set up auth state change listener with enhanced handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) {
        return
      }

      console.log('Auth state change:', event)

      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            const profile = await fetchProfile(session.user.id)
            updateState({
              user: session.user,
              session,
              profile,
              loading: false,
              error: null,
            })
          }
          break

        case 'SIGNED_OUT':
          updateState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            error: null,
          })
          break

        case 'TOKEN_REFRESHED':
          if (session) {
            updateState({
              session,
              user: session.user,
            })
          }
          break

        case 'USER_UPDATED':
          if (session?.user) {
            updateState({
              user: session.user,
              session,
            })
            // Refresh profile as well
            const profile = await fetchProfile(session.user.id)
            if (profile) {
              updateState({ profile })
            }
          }
          break

        default:
          break
      }
    })

    // Cleanup function
    return () => {
      mounted.current = false
      subscription.unsubscribe()
    }
  }, [supabase, initializeAuth, fetchProfile, updateState])

  return {
    // State
    ...authState,

    // Actions
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshSession,
    refreshProfile,
  }
}
