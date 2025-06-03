'use client'

// MealAppeal Authentication Context Provider
// Action 027: Global user authentication state management

import { type Session, type User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'

import { getSupabase } from '@/lib/supabase'
import { type IAuthContextType, type IProfile } from '@/lib/types'

const AuthContext = createContext<IAuthContextType>({
  user: null,
  profile: null,
  signOut: async () => {},
  refreshMealCount: async () => {},
  signIn: async () => ({ data: null, error: null }),
  signUp: async () => ({ data: null, error: null }),
  resetPassword: async () => ({ data: null, error: null }),
  isLoading: true,
  error: null,
})

export const useAuth = (): IAuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface IAuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: IAuthProviderProps): React.ReactNode {
  console.log('%%%%%%% AUTHPROVIDER RELOADED - VERSION X.Y.Z %%%%%%%')

  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<IProfile | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  const loadUserProfile = async (userId: string): Promise<void> => {
    try {
      setError(null)
      const supabase = await getSupabase()
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        throw new Error(`Failed to load user profile: ${profileError.message}`)
      }

      if (!profileData) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: userId,
              email: user?.email,
              subscription_tier: 'free',
              meal_count: 0,
              monthly_shares_used: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single()

        if (createError) {
          throw new Error(`Failed to create user profile: ${createError.message}`)
        }

        setProfile(newProfile)
      } else {
        setProfile(profileData)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user profile'
      setError(new Error(errorMessage))
      console.error('Error loading user profile:', errorMessage)
    }
  }

  const refreshMealCount = async (): Promise<void> => {
    if (!user?.id) {
      return
    }

    try {
      setError(null)
      console.log('🔄 Refreshing meal count for user:', user.id)

      const supabase = await getSupabase()
      // First get the actual meal count from meals table
      const { count: actualCount, error: countError } = await supabase
        .from('meals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (countError) {
        throw new Error(`Failed to get actual meal count: ${countError.message}`)
      }

      if (actualCount === null) {
        throw new Error('Failed to get meal count from database')
      }

      // Then get current profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('meal_count, monthly_shares_used, subscription_tier')
        .eq('id', user.id)
        .single()

      if (profileError) {
        throw new Error(`Failed to refresh meal count: ${profileError.message}`)
      }

      if (!profileData) {
        throw new Error('Profile data not found during refresh')
      }

      // If counts don't match, update the profile
      if (actualCount !== profileData.meal_count) {
        console.log('⚠️ Meal count mismatch detected. Fixing...')
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            meal_count: actualCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        if (updateError) {
          throw new Error(`Failed to update meal count: ${updateError.message}`)
        }
      }

      if (profile) {
        setProfile({
          ...profile,
          meal_count: actualCount,
          monthly_shares_used: profileData.monthly_shares_used,
          subscription_tier: profileData.subscription_tier,
        })
        console.log('✅ Meal count refreshed successfully:', actualCount)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh meal count'
      console.error('❌ Error refreshing meal count:', errorMessage)
      setError(new Error(errorMessage))
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const supabase = await getSupabase()
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
          try {
            if (session) {
              setUser(session.user)
              if (mounted) {
                await loadUserProfile(session.user.id)
              }
            } else {
              setUser(null)
              setProfile(null)
            }
          } catch (err) {
            console.error('Auth state change error:', err)
          } finally {
            if (mounted) {
              setIsLoading(false)
            }
          }
        })

        return () => {
          mounted = false
          subscription.unsubscribe()
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()
  }, [])

  useEffect(() => {
    let mounted = true

    const setupUser = async (): Promise<void> => {
      try {
        setError(null)
        const supabase = await getSupabase()
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          const message =
            typeof userError.message === 'string' ? userError.message.toLowerCase().trim() : ''
          if (message.includes('session missing') || message.includes('no active session')) {
            console.log(
              `[AuthContext] setupUser: supabase.auth.getUser() reported no active session. Message: "${userError.message}". Setting user/profile to null.`
            )
          } else {
            // Log other errors from supabase.auth.getUser() as warnings.
            console.warn(
              `[AuthContext] setupUser: supabase.auth.getUser() returned an error. Message: "${userError.message}". Setting user/profile to null. Error object:`,
              userError
            )
          }
          // For any userError from getUser, set user/profile to null and DO NOT re-throw.
          if (mounted) {
            setUser(null)
            setProfile(null)
          }
        } else if (currentUser && mounted) {
          // No error from getUser, and currentUser exists.
          setUser(currentUser)
          await loadUserProfile(currentUser.id) // This can throw and will be caught by the main catch block.
        } else if (mounted) {
          // No error from getUser, but no currentUser (e.g., new visitor).
          setUser(null)
          setProfile(null)
        }
      } catch (err) {
        const rawErrorMessage =
          err instanceof Error ? err.message : 'An unknown error occurred during user setup'
        let processedErrorMessage =
          typeof rawErrorMessage === 'string' ? rawErrorMessage.trim() : ''
        processedErrorMessage = String(processedErrorMessage)
        const normalizedErrorMessage = processedErrorMessage.toLowerCase()

        const searchString = 'session missing'

        console.log(
          '[AuthContext] CHAR CODE DEBUG: normalizedErrorMessage:',
          JSON.stringify(normalizedErrorMessage)
        )
        console.log(
          '[AuthContext] CHAR CODE DEBUG: normalizedErrorMessage char codes:',
          JSON.stringify(normalizedErrorMessage.split('').map(c => c.charCodeAt(0)))
        )
        console.log('[AuthContext] CHAR CODE DEBUG: searchString:', JSON.stringify(searchString))
        console.log(
          '[AuthContext] CHAR CODE DEBUG: searchString char codes:',
          JSON.stringify(searchString.split('').map(c => c.charCodeAt(0)))
        )

        const conditionIsTrue = normalizedErrorMessage.includes(searchString)
        console.log(
          '[AuthContext] FINAL CHECK (AGAIN): condition (includes searchString):',
          conditionIsTrue
        )

        if (conditionIsTrue) {
          console.log(
            `[AuthContext] setupUser catch: Suppressed session-related error. Original: "${rawErrorMessage}".`
          )
          if (mounted) {
            setUser(null)
            setProfile(null)
            setError(null)
          }
        } else {
          console.error(
            '[AuthContext] setupUser: Error during user setup or profile loading (PROCESSED MSG):',
            processedErrorMessage,
            err
          )
          if (mounted) {
            setError(new Error(processedErrorMessage))
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    setupUser()

    return () => {
      mounted = false
    }
  }, [])

  const signOut = async (): Promise<void> => {
    try {
      console.log('🔐 [AuthContext] Starting sign out process...')
      setError(null)
      const supabase = await getSupabase()

      if (!supabase) {
        throw new Error('Failed to initialize Supabase client')
      }

      // Sign out from Supabase
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        console.error('❌ [AuthContext] Supabase sign out error:', signOutError)
        throw new Error(`Failed to sign out: ${signOutError.message}`)
      }

      console.log('✅ [AuthContext] Supabase sign out successful')

      // Clear local state
      setUser(null)
      setProfile(null)

      // Clear any potential browser storage
      try {
        localStorage.clear()
        sessionStorage.clear()
        console.log('✅ [AuthContext] Browser storage cleared')
      } catch (storageError) {
        console.warn('⚠️ [AuthContext] Could not clear browser storage:', storageError)
      }

      console.log('✅ [AuthContext] Sign out process completed')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out'
      setError(new Error(errorMessage))
      console.error('❌ [AuthContext] Error signing out:', errorMessage, err)
      throw err // Re-throw so the calling component can handle it
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      const supabase = await getSupabase()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in'
      const error = new Error(errorMessage)
      setError(error)
      return { error }
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setError(null)
      const supabase = await getSupabase()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        return { error }
      }

      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up'
      const error = new Error(errorMessage)
      setError(error)
      return { error }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setError(null)
      const supabase = await getSupabase()
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        return { error }
      }

      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password'
      const error = new Error(errorMessage)
      setError(error)
      return { error }
    }
  }

  const value: IAuthContextType = {
    user,
    profile,
    signOut,
    signIn,
    signUp,
    resetPassword,
    refreshMealCount,
    isLoading,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
