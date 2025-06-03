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
          subscription_tier: 'free' | 'premium'
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
          subscription_tier?: 'free' | 'premium'
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
          subscription_tier?: 'free' | 'premium'
          meal_count?: number
          monthly_shares_used?: number
          created_at?: string
          updated_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
