import { supabase } from './supabase'

export interface AuthError {
  message: string
  status?: number
}

export interface AuthResponse {
  success: boolean
  error?: AuthError
  data?: any
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          status: 400,
        },
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    return {
      success: false,
      error: {
        message: 'Failed to initiate Google sign-in',
        status: 500,
      },
    }
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          status: 400,
        },
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    return {
      success: false,
      error: {
        message: 'Failed to sign in',
        status: 500,
      },
    }
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string, fullName?: string): Promise<AuthResponse> {
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

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          status: 400,
        },
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    return {
      success: false,
      error: {
        message: 'Failed to create account',
        status: 500,
      },
    }
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          status: 400,
        },
      }
    }

    return {
      success: true,
    }
  } catch (error: any) {
    return {
      success: false,
      error: {
        message: 'Failed to send reset email',
        status: 500,
      },
    }
  }
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          status: 400,
        },
      }
    }

    return {
      success: true,
    }
  } catch (error: any) {
    return {
      success: false,
      error: {
        message: 'Failed to update password',
        status: 500,
      },
    }
  }
}

/**
 * Create or update user profile after authentication
 */
export async function createOrUpdateProfile(userId: string, data: {
  email: string
  full_name?: string
  avatar_url?: string
}): Promise<AuthResponse> {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,  // Only use user_id, not id
        email: data.email,
        full_name: data.full_name,
        avatar_url: data.avatar_url,
        subscription_tier: 'free',
        meal_count: 0,
        monthly_shares_used: 0,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'  // Conflict on user_id instead of id
      })

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          status: 400,
        },
      }
    }

    return {
      success: true,
    }
  } catch (error: any) {
    return {
      success: false,
      error: {
        message: 'Failed to create profile',
        status: 500,
      },
    }
  }
}
