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
