export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      meals: {
        Row: {
          id: string
          created_at: string
          user_id: string
          image_url: string
          analysis: Json
          focus: string | null
          shared: boolean
          deleted_at: string | null
          title?: string | null
          description?: string | null
          image_path?: string | null
          ai_confidence_score?: number | null
          processing_status?: string | null
          scheduled_deletion_date?: string | null
          is_public?: boolean | null
          basic_nutrition?: Json | null
          premium_nutrition?: Json | null
          health_score?: number | null
          meal_tags?: string[] | null
          name?: string | null
          calories?: number | null
          protein?: number | null
          carbs?: number | null
          fat?: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          image_url: string
          analysis?: Json
          focus?: string | null
          shared?: boolean
          deleted_at?: string | null
          title?: string | null
          description?: string | null
          image_path?: string | null
          ai_confidence_score?: number | null
          processing_status?: string | null
          scheduled_deletion_date?: string | null
          is_public?: boolean | null
          basic_nutrition?: Json | null
          premium_nutrition?: Json | null
          health_score?: number | null
          meal_tags?: string[] | null
          name?: string | null
          calories?: number | null
          protein?: number | null
          carbs?: number | null
          fat?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          image_url?: string
          analysis?: Json
          focus?: string | null
          shared?: boolean
          deleted_at?: string | null
          title?: string | null
          description?: string | null
          image_path?: string | null
          ai_confidence_score?: number | null
          processing_status?: string | null
          scheduled_deletion_date?: string | null
          is_public?: boolean | null
          basic_nutrition?: Json | null
          premium_nutrition?: Json | null
          health_score?: number | null
          meal_tags?: string[] | null
          name?: string | null
          calories?: number | null
          protein?: number | null
          carbs?: number | null
          fat?: number | null
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          avatar_url: string | null
          subscription_tier: 'free' | 'premium_monthly' | 'premium_yearly'
          subscription_expires_at: string | null
          billing_cycle: 'free' | 'monthly' | 'yearly' | null
          meal_count: number
          monthly_shares_used: number
          created_at: string
          updated_at: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'premium_monthly' | 'premium_yearly'
          subscription_expires_at?: string | null
          billing_cycle?: 'free' | 'monthly' | 'yearly' | null
          meal_count?: number
          monthly_shares_used?: number
          created_at?: string
          updated_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'premium_monthly' | 'premium_yearly'
          subscription_expires_at?: string | null
          billing_cycle?: 'free' | 'monthly' | 'yearly' | null
          meal_count?: number
          monthly_shares_used?: number
          created_at?: string
          updated_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
      }
      notification_settings: {
        Row: {
          id: string
          user_id: string
          email_meal_reminders: boolean
          email_weekly_summary: boolean
          email_premium_features: boolean
          push_meal_analysis_complete: boolean
          push_sharing_activity: boolean
          push_achievement_unlocked: boolean
          push_premium_tips: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_meal_reminders?: boolean
          email_weekly_summary?: boolean
          email_premium_features?: boolean
          push_meal_analysis_complete?: boolean
          push_sharing_activity?: boolean
          push_achievement_unlocked?: boolean
          push_premium_tips?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_meal_reminders?: boolean
          email_weekly_summary?: boolean
          email_premium_features?: boolean
          push_meal_analysis_complete?: boolean
          push_sharing_activity?: boolean
          push_achievement_unlocked?: boolean
          push_premium_tips?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_premium: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      get_subscription_tier: {
        Args: {
          user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      subscription_tier: 'free' | 'premium_monthly' | 'premium_yearly'
      billing_cycle: 'free' | 'monthly' | 'yearly'
    }
  }
}
