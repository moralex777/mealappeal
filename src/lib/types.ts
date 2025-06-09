// MealAppeal Database Types
// Extracted from Supabase schema

import type { User } from '@supabase/supabase-js'

import type { Database } from './database.types'

export type IProfile = Database['public']['Tables']['profiles']['Row']

// Auth Types
export interface IAuthContextType {
  user: User | null
  profile: IProfile | null
  signOut: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ data?: any; error: any }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ data?: any; error: any }>
  resetPassword: (email: string) => Promise<{ data?: any; error: any }>
  refreshMealCount: () => Promise<void>
  isLoading: boolean
  error: Error | null
}

export interface IStorageStats {
  size: number
  count: number
}

// Component Props
export interface IAuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export interface IMealCardProps {
  meal: {
    id: string
    created_at: string
    image_url: string
    scheduled_deletion_date: string | null
    analysis: {
      name: string
      calories: number
      protein: number
      carbs: number
      fat: number
    } | null
  }
  profile: {
    subscription_tier: string
  } | null
  formatDate: (date: string) => string
  getDaysLeft: (date: string | null) => number | string
}

export interface IResponsiveImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
  quality?: number
  onLoad?: () => void
  onError?: () => void
}

export interface IFocusSelectionProps {
  selectedFocus: string
  onFocusChange: (focus: string) => void
}

export interface IAnalysisFocus {
  id: string
  name: string
  description: string
  icon: React.ComponentType<any>
  color: string
}

// Error Boundary Types
export interface IErrorBoundaryProps {
  children: React.ReactNode
}

export interface IErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

// API Response Types
export interface IAnalysisResponse {
  success: boolean
  error?: string
  data?: {
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    ingredients: string[]
    allergens: string[]
    healthTags: string[]
  }
}

/**
 * MealAppeal User Profile Interface
 * Core user data for freemium business model operations
 */
export interface IMealAppealUserProfile {
  /**
   * Unique user identifier
   * Used for data relationships and user tracking across the platform
   */
  id: string

  /**
   * User's email address
   * Primary identifier for authentication and subscription management
   */
  email: string

  /**
   * Account creation timestamp
   * Used for calculating free tier 14-day storage limits and user lifecycle tracking
   */
  created_at: string

  /**
   * Current subscription tier
   * Determines feature access: 'free' (basic nutrition, 3 monthly shares) or 'premium' (unlimited storage/shares, 6 analysis modes)
   * Critical for freemium conversion funnel and upgrade prompts
   */
  subscription_tier: 'free' | 'premium'

  /**
   * Total number of meals analyzed by the user
   * Used for engagement metrics, habit formation tracking, and triggering upgrade prompts at key usage milestones
   * Helps identify high-value users for premium conversion campaigns
   */
  meal_count: number
}
