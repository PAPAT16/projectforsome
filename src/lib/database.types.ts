export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'customer' | 'food_truck_owner' | 'admin'
          is_blocked: boolean
          user_id_number: number
          created_at: string
          profile_image_url: string | null
          referral_code: string | null
          referred_by: string | null
          header_image_url: string | null
          bio: string | null
          notification_opt_in: boolean
          push_notifications_enabled: boolean
          email_notifications_enabled: boolean
          subscription_tier: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'customer' | 'food_truck_owner' | 'admin'
          is_blocked?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'customer' | 'food_truck_owner' | 'admin'
          is_blocked?: boolean
        }
      }
      food_trucks: {
        Row: {
          id: string
          owner_id: string
          truck_name: string
          description: string | null
          logo_url: string | null
          cuisine_types: string[]
          phone: string | null
          email: string | null
          is_active: boolean
          subscription_tier: 'none' | 'basic' | 'premium' | 'enterprise'
          subscription_status: 'active' | 'inactive' | 'cancelled'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          average_rating: number
          total_reviews: number
          created_at: string
          updated_at: string
          truck_profile_image_url: string | null
          dietary_options: string[] | null
          is_featured: boolean
          featured_until: string | null
          is_verified: boolean
          verification_tier: string | null
          verified_at: string | null
          price_range: string | null
        }
        Insert: {
          id?: string
          owner_id: string
          truck_name: string
          description?: string | null
          logo_url?: string | null
          cuisine_types?: string[]
          phone?: string | null
          email?: string | null
          is_active?: boolean
          subscription_tier?: 'none' | 'basic' | 'premium' | 'enterprise'
          subscription_status?: 'active' | 'inactive' | 'cancelled'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          truck_name?: string
          description?: string | null
          logo_url?: string | null
          cuisine_types?: string[]
          phone?: string | null
          email?: string | null
          is_active?: boolean
          subscription_tier?: 'none' | 'basic' | 'premium' | 'enterprise'
          subscription_status?: 'active' | 'inactive' | 'cancelled'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
      }
      food_truck_locations: {
        Row: {
          id: string
          food_truck_id: string
          latitude: number
          longitude: number
          address: string | null
          zip_code: string | null
          is_current: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          food_truck_id: string
          latitude: number
          longitude: number
          address?: string | null
          zip_code?: string | null
          is_current?: boolean
          updated_at?: string
        }
        Update: {
          latitude?: number
          longitude?: number
          address?: string | null
          zip_code?: string | null
          is_current?: boolean
          updated_at?: string
        }
      }
      food_truck_menu_items: {
        Row: {
          id: string
          food_truck_id: string
          item_name: string
          description: string | null
          price: number | null
          image_url: string | null
          category: string | null
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          food_truck_id: string
          item_name: string
          description?: string | null
          price?: number | null
          image_url?: string | null
          category?: string | null
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          item_name?: string
          description?: string | null
          price?: number | null
          image_url?: string | null
          category?: string | null
          is_available?: boolean
          updated_at?: string
        }
      }
      food_truck_images: {
        Row: {
          id: string
          food_truck_id: string
          image_url: string
          caption: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          food_truck_id: string
          image_url: string
          caption?: string | null
          display_order?: number
          created_at?: string
        }
        Update: {
          image_url?: string
          caption?: string | null
          display_order?: number
        }
      }
      reviews: {
        Row: {
          id: string
          food_truck_id: string
          customer_id: string
          rating: number
          comment: string | null
          owner_response: string | null
          owner_response_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          food_truck_id: string
          customer_id: string
          rating: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          rating?: number
          comment?: string | null
          owner_response?: string | null
          owner_response_at?: string | null
          updated_at?: string
        }
      }
      subscription_features: {
        Row: {
          id: string
          feature_name: string
          feature_key: string
          description: string | null
          required_tier: 'basic' | 'premium' | 'enterprise'
          is_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          feature_name: string
          feature_key: string
          description?: string | null
          required_tier: 'basic' | 'premium' | 'enterprise'
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          feature_name?: string
          description?: string | null
          required_tier?: 'basic' | 'premium' | 'enterprise'
          is_enabled?: boolean
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string | null
          recipient_type: 'all' | 'customers' | 'food_truck_owners' | 'individual'
          subject: string
          message: string
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id?: string | null
          recipient_type?: 'all' | 'customers' | 'food_truck_owners' | 'individual'
          subject: string
          message: string
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          is_read?: boolean
          read_at?: string | null
        }
      }
      affiliates: {
        Row: {
          id: string
          user_id: string
          affiliate_code: string
          status: 'pending' | 'active' | 'suspended'
          commission_rate: number
          total_referrals: number
          total_earnings: number
          pending_earnings: number
          paid_earnings: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          affiliate_code: string
          status?: 'pending' | 'active' | 'suspended'
          commission_rate?: number
          total_referrals?: number
          total_earnings?: number
          pending_earnings?: number
          paid_earnings?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'active' | 'suspended'
          commission_rate?: number
          total_referrals?: number
          total_earnings?: number
          pending_earnings?: number
          paid_earnings?: number
          updated_at?: string
        }
      }
      affiliate_referrals: {
        Row: {
          id: string
          affiliate_id: string
          food_truck_id: string
          status: 'pending' | 'approved' | 'paid' | 'rejected'
          commission_amount: number
          created_at: string
          approved_at: string | null
          paid_at: string | null
        }
        Insert: {
          id?: string
          affiliate_id: string
          food_truck_id: string
          status?: 'pending' | 'approved' | 'paid' | 'rejected'
          commission_amount?: number
          created_at?: string
          approved_at?: string | null
          paid_at?: string | null
        }
        Update: {
          status?: 'pending' | 'approved' | 'paid' | 'rejected'
          commission_amount?: number
          approved_at?: string | null
          paid_at?: string | null
        }
      }
      analytics_events: {
        Row: {
          id: string
          event_type: 'truck_view' | 'profile_view' | 'menu_view' | 'location_check' | 'review_added' | 'page_view' | 'search'
          food_truck_id: string | null
          user_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          event_type: 'truck_view' | 'profile_view' | 'menu_view' | 'location_check' | 'review_added' | 'page_view' | 'search'
          food_truck_id?: string | null
          user_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          event_type?: 'truck_view' | 'profile_view' | 'menu_view' | 'location_check' | 'review_added' | 'page_view' | 'search'
          food_truck_id?: string | null
          user_id?: string | null
          metadata?: Json
        }
      }
    }
  }
}
