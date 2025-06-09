// MealAppeal Database Types
// Extracted from Supabase schema

import type { User } from '@supabase/supabase-js'

import type { Database } from './database.types'

export type IProfile = Database['public']['Tables']['profiles']['Row']

/**
 * MealAppeal User Profile Interface
 * Core user data structure for freemium business model implementation
 */
export interface IMealAppealUserProfile {
  /**
   * Unique user identifier (UUID)
   * Used for data relationships and user session management
   */
  id: string

  /**
   * User's email address
   * Primary identifier for authentication and subscription management
   * Used for billing communications and account recovery
   */
  email: string

  /**
   * Account creation timestamp
   * Tracks user lifecycle for retention analysis and onboarding flows
   * Essential for measuring user journey from signup to premium conversion
   */
  created_at: string

  /**
   * Current subscription tier ('free' | 'premium')
   * Core freemium gating mechanism that determines:
   * - Free: 14-day storage, 3 monthly shares, basic nutrition analysis
   * - Premium: unlimited storage/shares, advanced nutrition, 6 analysis modes
   * Used throughout app to control feature access and upgrade prompts
   */
  subscription_tier: 'free' | 'premium'

  /**
   * Total number of meals analyzed by user
   * Key engagement metric for:
   * - Habit formation tracking and achievement systems
   * - Conversion optimization (users with 10+ meals convert 3x better)
   * - Usage analytics for product improvements
   * - Triggering strategic upgrade prompts at high-engagement moments
   */
  meal_count: number
}

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
