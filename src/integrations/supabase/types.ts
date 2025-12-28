export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      account_handovers: {
        Row: {
          account_id: string | null
          account_password: string | null
          additional_info: Json | null
          buyer_confirmed_received: boolean
          buyer_id: string
          checklist_data: Json | null
          created_at: string
          email_account: string | null
          email_password: string | null
          id: string
          is_locked: boolean
          locked_at: string | null
          order_id: string
          received_at: string | null
          recovery_info: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          account_password?: string | null
          additional_info?: Json | null
          buyer_confirmed_received?: boolean
          buyer_id: string
          checklist_data?: Json | null
          created_at?: string
          email_account?: string | null
          email_password?: string | null
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          order_id: string
          received_at?: string | null
          recovery_info?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          account_password?: string | null
          additional_info?: Json | null
          buyer_confirmed_received?: boolean
          buyer_id?: string
          checklist_data?: Json | null
          created_at?: string
          email_account?: string | null
          email_password?: string | null
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          order_id?: string
          received_at?: string | null
          recovery_info?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_handovers_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "seller_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_handovers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_handovers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          badge_color: string | null
          code: string
          created_at: string
          description: string | null
          description_en: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          name_en: string | null
          points_reward: number | null
          requirement_type: string
          requirement_value: number | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          badge_color?: string | null
          code: string
          created_at?: string
          description?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_en?: string | null
          points_reward?: number | null
          requirement_type: string
          requirement_value?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          badge_color?: string | null
          code?: string
          created_at?: string
          description?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          points_reward?: number | null
          requirement_type?: string
          requirement_value?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_super_admin: boolean
          name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_super_admin?: boolean
          name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_super_admin?: boolean
          name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      affiliate_clicks: {
        Row: {
          affiliate_id: string
          clicked_at: string
          id: string
          landing_page: string | null
          referer: string | null
          user_agent: string | null
          visitor_ip: string | null
        }
        Insert: {
          affiliate_id: string
          clicked_at?: string
          id?: string
          landing_page?: string | null
          referer?: string | null
          user_agent?: string | null
          visitor_ip?: string | null
        }
        Update: {
          affiliate_id?: string
          clicked_at?: string
          id?: string
          landing_page?: string | null
          referer?: string | null
          user_agent?: string | null
          visitor_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_conversions: {
        Row: {
          affiliate_id: string
          approved_at: string | null
          commission_amount: number
          commission_rate: number
          created_at: string
          customer_id: string | null
          id: string
          order_amount: number
          order_id: string | null
          paid_at: string | null
          status: string
        }
        Insert: {
          affiliate_id: string
          approved_at?: string | null
          commission_amount: number
          commission_rate: number
          created_at?: string
          customer_id?: string | null
          id?: string
          order_amount: number
          order_id?: string | null
          paid_at?: string | null
          status?: string
        }
        Update: {
          affiliate_id?: string
          approved_at?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          customer_id?: string | null
          id?: string
          order_amount?: number
          order_id?: string | null
          paid_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_conversions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_products: {
        Row: {
          commission_rate: number
          created_at: string
          id: string
          is_active: boolean
          product_id: string
          seller_id: string | null
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          id?: string
          is_active?: boolean
          product_id: string
          seller_id?: string | null
        }
        Update: {
          commission_rate?: number
          created_at?: string
          id?: string
          is_active?: boolean
          product_id?: string
          seller_id?: string | null
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          affiliate_code: string
          commission_rate: number
          created_at: string
          id: string
          paid_earnings: number
          pending_earnings: number
          status: string
          tier: string
          total_clicks: number
          total_conversions: number
          total_earnings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate_code: string
          commission_rate?: number
          created_at?: string
          id?: string
          paid_earnings?: number
          pending_earnings?: number
          status?: string
          tier?: string
          total_clicks?: number
          total_conversions?: number
          total_earnings?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate_code?: string
          commission_rate?: number
          created_at?: string
          id?: string
          paid_earnings?: number
          pending_earnings?: number
          status?: string
          tier?: string
          total_clicks?: number
          total_conversions?: number
          total_earnings?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_content_analysis: {
        Row: {
          analysis_type: string
          analyzed_at: string
          findings: Json | null
          id: string
          product_id: string
          score: number | null
          status: string
        }
        Insert: {
          analysis_type: string
          analyzed_at?: string
          findings?: Json | null
          id?: string
          product_id: string
          score?: number | null
          status: string
        }
        Update: {
          analysis_type?: string
          analyzed_at?: string
          findings?: Json | null
          id?: string
          product_id?: string
          score?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_content_analysis_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "seller_products"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          created_at: string
          escalated_at: string | null
          escalated_to: string | null
          id: string
          is_escalated: boolean
          session_id: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          escalated_at?: string | null
          escalated_to?: string | null
          id?: string
          is_escalated?: boolean
          session_id: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          escalated_at?: string | null
          escalated_to?: string | null
          id?: string
          is_escalated?: boolean
          session_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          helpful_count: number
          id: string
          is_active: boolean
          keywords: string[] | null
          question: string
          updated_at: string
          view_count: number
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          question: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          question?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_price_predictions: {
        Row: {
          confidence: number | null
          created_at: string
          current_price: number | null
          factors: Json | null
          id: string
          predicted_max_price: number | null
          predicted_min_price: number | null
          predicted_optimal_price: number | null
          predicted_sale_probability: number | null
          product_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          current_price?: number | null
          factors?: Json | null
          id?: string
          predicted_max_price?: number | null
          predicted_min_price?: number | null
          predicted_optimal_price?: number | null
          predicted_sale_probability?: number | null
          product_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          current_price?: number | null
          factors?: Json | null
          id?: string
          predicted_max_price?: number | null
          predicted_min_price?: number | null
          predicted_optimal_price?: number | null
          predicted_sale_probability?: number | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_price_predictions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "seller_products"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_product_suggestions: {
        Row: {
          ai_reasoning: string | null
          applied_at: string | null
          confidence: number | null
          created_at: string
          id: string
          is_applied: boolean | null
          original_content: string | null
          product_id: string
          suggested_content: string | null
          suggestion_type: string
        }
        Insert: {
          ai_reasoning?: string | null
          applied_at?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          is_applied?: boolean | null
          original_content?: string | null
          product_id: string
          suggested_content?: string | null
          suggestion_type: string
        }
        Update: {
          ai_reasoning?: string | null
          applied_at?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          is_applied?: boolean | null
          original_content?: string | null
          product_id?: string
          suggested_content?: string | null
          suggestion_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_product_suggestions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "seller_products"
            referencedColumns: ["id"]
          },
        ]
      }
      api_changelog: {
        Row: {
          changes: Json
          created_at: string
          description: string | null
          id: string
          is_breaking: boolean | null
          published_at: string
          title: string
          version: string
        }
        Insert: {
          changes?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_breaking?: boolean | null
          published_at?: string
          title: string
          version: string
        }
        Update: {
          changes?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_breaking?: boolean | null
          published_at?: string
          title?: string
          version?: string
        }
        Relationships: []
      }
      api_usage_logs: {
        Row: {
          api_key_id: string
          created_at: string
          endpoint: string
          id: string
          ip_address: string | null
          method: string
          response_time_ms: number | null
          status_code: number
          user_agent: string | null
        }
        Insert: {
          api_key_id: string
          created_at?: string
          endpoint: string
          id?: string
          ip_address?: string | null
          method: string
          response_time_ms?: number | null
          status_code: number
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string | null
          method?: string
          response_time_ms?: number | null
          status_code?: number
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "user_api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_bids: {
        Row: {
          amount: number
          auction_id: string
          bidder_id: string
          created_at: string
          id: string
          is_auto_bid: boolean | null
          is_sealed: boolean | null
          is_winning: boolean | null
          max_auto_bid: number | null
        }
        Insert: {
          amount: number
          auction_id: string
          bidder_id: string
          created_at?: string
          id?: string
          is_auto_bid?: boolean | null
          is_sealed?: boolean | null
          is_winning?: boolean | null
          max_auto_bid?: number | null
        }
        Update: {
          amount?: number
          auction_id?: string
          bidder_id?: string
          created_at?: string
          id?: string
          is_auto_bid?: boolean | null
          is_sealed?: boolean | null
          is_winning?: boolean | null
          max_auto_bid?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "auction_bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_watchers: {
        Row: {
          auction_id: string
          created_at: string
          id: string
          notify_ending: boolean | null
          notify_outbid: boolean | null
          user_id: string
        }
        Insert: {
          auction_id: string
          created_at?: string
          id?: string
          notify_ending?: boolean | null
          notify_outbid?: boolean | null
          user_id: string
        }
        Update: {
          auction_id?: string
          created_at?: string
          id?: string
          notify_ending?: boolean | null
          notify_outbid?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_watchers_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auctions: {
        Row: {
          auction_type: Database["public"]["Enums"]["auction_type"]
          auto_extend_minutes: number | null
          bid_count: number | null
          buy_now_price: number | null
          created_at: string
          current_price: number
          description: string | null
          dutch_decrement_amount: number | null
          dutch_decrement_interval: number | null
          dutch_end_price: number | null
          dutch_start_price: number | null
          end_time: string
          id: string
          image_url: string | null
          max_bids_per_user: number | null
          min_bid_increment: number | null
          product_id: string
          reserve_price: number | null
          seller_id: string
          start_time: string
          starting_price: number
          status: Database["public"]["Enums"]["auction_status"]
          title: string
          updated_at: string
          view_count: number | null
          winner_id: string | null
          winning_bid_id: string | null
        }
        Insert: {
          auction_type?: Database["public"]["Enums"]["auction_type"]
          auto_extend_minutes?: number | null
          bid_count?: number | null
          buy_now_price?: number | null
          created_at?: string
          current_price?: number
          description?: string | null
          dutch_decrement_amount?: number | null
          dutch_decrement_interval?: number | null
          dutch_end_price?: number | null
          dutch_start_price?: number | null
          end_time: string
          id?: string
          image_url?: string | null
          max_bids_per_user?: number | null
          min_bid_increment?: number | null
          product_id: string
          reserve_price?: number | null
          seller_id: string
          start_time: string
          starting_price?: number
          status?: Database["public"]["Enums"]["auction_status"]
          title: string
          updated_at?: string
          view_count?: number | null
          winner_id?: string | null
          winning_bid_id?: string | null
        }
        Update: {
          auction_type?: Database["public"]["Enums"]["auction_type"]
          auto_extend_minutes?: number | null
          bid_count?: number | null
          buy_now_price?: number | null
          created_at?: string
          current_price?: number
          description?: string | null
          dutch_decrement_amount?: number | null
          dutch_decrement_interval?: number | null
          dutch_end_price?: number | null
          dutch_start_price?: number | null
          end_time?: string
          id?: string
          image_url?: string | null
          max_bids_per_user?: number | null
          min_bid_increment?: number | null
          product_id?: string
          reserve_price?: number | null
          seller_id?: string
          start_time?: string
          starting_price?: number
          status?: Database["public"]["Enums"]["auction_status"]
          title?: string
          updated_at?: string
          view_count?: number | null
          winner_id?: string | null
          winning_bid_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auctions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "seller_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auctions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auctions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      avatar_frames: {
        Row: {
          avatar_border_radius: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string
          is_active: boolean | null
          name: string
          price: number
          prime_price: number | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          avatar_border_radius?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          name: string
          price?: number
          prime_price?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          avatar_border_radius?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          name?: string
          price?: number
          prime_price?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      background_music: {
        Row: {
          artist: string | null
          audio_url: string
          cover_url: string | null
          created_at: string
          duration_seconds: number | null
          embed_url: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          source_id: string | null
          source_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          artist?: string | null
          audio_url: string
          cover_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          embed_url?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          source_id?: string | null
          source_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          artist?: string | null
          audio_url?: string
          cover_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          embed_url?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          source_id?: string | null
          source_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      banned_ips: {
        Row: {
          banned_at: string
          banned_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          ip_address: string
          is_active: boolean
          reason: string | null
        }
        Insert: {
          banned_at?: string
          banned_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address: string
          is_active?: boolean
          reason?: string | null
        }
        Update: {
          banned_at?: string
          banned_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: string
          is_active?: boolean
          reason?: string | null
        }
        Relationships: []
      }
      bio_analytics: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          event_type: string
          id: string
          ip_hash: string | null
          link_id: string | null
          profile_id: string
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          event_type: string
          id?: string
          ip_hash?: string | null
          link_id?: string | null
          profile_id: string
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          event_type?: string
          id?: string
          ip_hash?: string | null
          link_id?: string | null
          profile_id?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bio_analytics_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "bio_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bio_analytics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "bio_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bio_blocks: {
        Row: {
          block_type: string
          content: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          profile_id: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          block_type: string
          content?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          profile_id: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          block_type?: string
          content?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          profile_id?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bio_blocks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "bio_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bio_links: {
        Row: {
          badge: string | null
          click_count: number | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          open_in_new_tab: boolean | null
          profile_id: string
          sort_order: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          url: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          badge?: string | null
          click_count?: number | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          open_in_new_tab?: boolean | null
          profile_id: string
          sort_order?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          url: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          badge?: string | null
          click_count?: number | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          open_in_new_tab?: boolean | null
          profile_id?: string
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          url?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bio_links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "bio_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bio_pro_plans: {
        Row: {
          created_at: string
          days: number
          id: string
          is_active: boolean | null
          name: string
          name_en: string | null
          plan_id: string
          price: number
          savings_percent: number | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          days?: number
          id?: string
          is_active?: boolean | null
          name: string
          name_en?: string | null
          plan_id: string
          price?: number
          savings_percent?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          days?: number
          id?: string
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          plan_id?: string
          price?: number
          savings_percent?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      bio_profiles: {
        Row: {
          avatar_url: string | null
          background_color: string | null
          background_gradient: string | null
          background_image_url: string | null
          background_type: string | null
          bio: string | null
          button_color: string | null
          button_style: string | null
          button_text_color: string | null
          created_at: string | null
          display_name: string | null
          font_family: string | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          password_hash: string | null
          plan: string | null
          plan_expires_at: string | null
          text_color: string | null
          theme_mode: string | null
          total_clicks: number | null
          total_views: number | null
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          background_color?: string | null
          background_gradient?: string | null
          background_image_url?: string | null
          background_type?: string | null
          bio?: string | null
          button_color?: string | null
          button_style?: string | null
          button_text_color?: string | null
          created_at?: string | null
          display_name?: string | null
          font_family?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          password_hash?: string | null
          plan?: string | null
          plan_expires_at?: string | null
          text_color?: string | null
          theme_mode?: string | null
          total_clicks?: number | null
          total_views?: number | null
          updated_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          background_color?: string | null
          background_gradient?: string | null
          background_image_url?: string | null
          background_type?: string | null
          bio?: string | null
          button_color?: string | null
          button_style?: string | null
          button_text_color?: string | null
          created_at?: string | null
          display_name?: string | null
          font_family?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          password_hash?: string | null
          plan?: string | null
          plan_expires_at?: string | null
          text_color?: string | null
          theme_mode?: string | null
          total_clicks?: number | null
          total_views?: number | null
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      bio_qr_codes: {
        Row: {
          background_color: string | null
          created_at: string | null
          dot_color: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          profile_id: string
          qr_type: string | null
          scan_count: number | null
          target_url: string
          updated_at: string | null
        }
        Insert: {
          background_color?: string | null
          created_at?: string | null
          dot_color?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          profile_id: string
          qr_type?: string | null
          scan_count?: number | null
          target_url: string
          updated_at?: string | null
        }
        Update: {
          background_color?: string | null
          created_at?: string | null
          dot_color?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          profile_id?: string
          qr_type?: string | null
          scan_count?: number | null
          target_url?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bio_qr_codes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "bio_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bio_subscriptions: {
        Row: {
          amount: number
          auto_renew: boolean | null
          cancelled_at: string | null
          created_at: string | null
          expires_at: string
          id: string
          plan: string
          profile_id: string | null
          starts_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          auto_renew?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          plan: string
          profile_id?: string | null
          starts_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          auto_renew?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          plan?: string
          profile_id?: string | null
          starts_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bio_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "bio_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bio_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_pro_only: boolean | null
          name: string
          preview_image_url: string | null
          sort_order: number | null
          theme_data: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_pro_only?: boolean | null
          name: string
          preview_image_url?: string | null
          sort_order?: number | null
          theme_data?: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_pro_only?: boolean | null
          name?: string
          preview_image_url?: string | null
          sort_order?: number | null
          theme_data?: Json
        }
        Relationships: []
      }
      boost_pricing: {
        Row: {
          boost_type: string
          created_at: string
          id: string
          is_active: boolean
          price_per_day: number
          updated_at: string
        }
        Insert: {
          boost_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          price_per_day?: number
          updated_at?: string
        }
        Update: {
          boost_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          price_per_day?: number
          updated_at?: string
        }
        Relationships: []
      }
      bulk_import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          errors: Json | null
          failed_rows: number | null
          file_name: string | null
          file_url: string | null
          id: string
          processed_rows: number | null
          seller_id: string
          started_at: string | null
          status: string | null
          success_rows: number | null
          total_rows: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          failed_rows?: number | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          processed_rows?: number | null
          seller_id: string
          started_at?: string | null
          status?: string | null
          success_rows?: number | null
          total_rows?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          failed_rows?: number | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          processed_rows?: number | null
          seller_id?: string
          started_at?: string | null
          status?: string | null
          success_rows?: number | null
          total_rows?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_import_jobs_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_import_jobs_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_risk_scores: {
        Row: {
          account_age_days: number | null
          buyer_id: string
          cancelled_orders: number | null
          completed_orders: number | null
          disputed_orders: number | null
          id: string
          is_email_verified: boolean | null
          is_high_risk: boolean | null
          is_phone_verified: boolean | null
          last_updated: string
          refunded_orders: number | null
          risk_factors: Json | null
          risk_score: number | null
          total_orders: number | null
        }
        Insert: {
          account_age_days?: number | null
          buyer_id: string
          cancelled_orders?: number | null
          completed_orders?: number | null
          disputed_orders?: number | null
          id?: string
          is_email_verified?: boolean | null
          is_high_risk?: boolean | null
          is_phone_verified?: boolean | null
          last_updated?: string
          refunded_orders?: number | null
          risk_factors?: Json | null
          risk_score?: number | null
          total_orders?: number | null
        }
        Update: {
          account_age_days?: number | null
          buyer_id?: string
          cancelled_orders?: number | null
          completed_orders?: number | null
          disputed_orders?: number | null
          id?: string
          is_email_verified?: boolean | null
          is_high_risk?: boolean | null
          is_phone_verified?: boolean | null
          last_updated?: string
          refunded_orders?: number | null
          risk_factors?: Json | null
          risk_score?: number | null
          total_orders?: number | null
        }
        Relationships: []
      }
      call_sessions: {
        Row: {
          call_type: string
          callee_id: string
          caller_id: string
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          recording_url: string | null
          room_id: string
          started_at: string | null
          status: string
        }
        Insert: {
          call_type: string
          callee_id: string
          caller_id: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          recording_url?: string | null
          room_id: string
          started_at?: string | null
          status?: string
        }
        Update: {
          call_type?: string
          callee_id?: string
          caller_id?: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          recording_url?: string | null
          room_id?: string
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          description_en: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          name_en: string | null
          slug: string
          sort_order: number
          style: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          name_en?: string | null
          slug: string
          sort_order?: number
          style?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          name_en?: string | null
          slug?: string
          sort_order?: number
          style?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_member_nicknames: {
        Row: {
          created_at: string
          id: string
          nickname: string
          room_id: string
          setter_user_id: string
          target_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nickname: string
          room_id: string
          setter_user_id: string
          target_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nickname?: string
          room_id?: string
          setter_user_id?: string
          target_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_member_nicknames_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          room_id: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          room_id: string
          sender_id: string
          sender_type?: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          room_id?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_members: {
        Row: {
          id: string
          joined_at: string
          nickname: string | null
          nickname_for_user_id: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          nickname?: string | null
          nickname_for_user_id?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          nickname?: string | null
          nickname_for_user_id?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          admin_id: string | null
          background_theme: string | null
          created_at: string
          group_avatar_url: string | null
          group_name: string | null
          id: string
          is_group: boolean | null
          last_message_at: string | null
          nickname: string | null
          quick_reaction_emoji: string | null
          room_type: string | null
          seller_id: string | null
          status: string
          subject: string | null
          target_user_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          background_theme?: string | null
          created_at?: string
          group_avatar_url?: string | null
          group_name?: string | null
          id?: string
          is_group?: boolean | null
          last_message_at?: string | null
          nickname?: string | null
          quick_reaction_emoji?: string | null
          room_type?: string | null
          seller_id?: string | null
          status?: string
          subject?: string | null
          target_user_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          background_theme?: string | null
          created_at?: string
          group_avatar_url?: string | null
          group_name?: string | null
          id?: string
          is_group?: boolean | null
          last_message_at?: string | null
          nickname?: string | null
          quick_reaction_emoji?: string | null
          room_type?: string | null
          seller_id?: string | null
          status?: string
          subject?: string | null
          target_user_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_milestone_rewards: {
        Row: {
          bonus_points: number | null
          created_at: string
          day_milestone: number
          id: string
          is_active: boolean | null
          reward_description: string | null
          reward_description_en: string | null
          reward_image_url: string | null
          reward_name: string
          reward_name_en: string | null
          reward_type: string
          reward_value: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          bonus_points?: number | null
          created_at?: string
          day_milestone: number
          id?: string
          is_active?: boolean | null
          reward_description?: string | null
          reward_description_en?: string | null
          reward_image_url?: string | null
          reward_name: string
          reward_name_en?: string | null
          reward_type?: string
          reward_value?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          bonus_points?: number | null
          created_at?: string
          day_milestone?: number
          id?: string
          is_active?: boolean | null
          reward_description?: string | null
          reward_description_en?: string | null
          reward_image_url?: string | null
          reward_name?: string
          reward_name_en?: string | null
          reward_type?: string
          reward_value?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      checklist_task_assignees: {
        Row: {
          assigned_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "checklist_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_task_comments: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "checklist_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_tasks: {
        Row: {
          attachments: Json | null
          checklist_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          priority: string
          sort_order: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          checklist_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: string
          sort_order?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          checklist_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: string
          sort_order?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_tasks_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          created_at: string
          description: string | null
          group_id: string | null
          id: string
          is_template: boolean | null
          progress_percent: number | null
          scope: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          group_id?: string | null
          id?: string
          is_template?: boolean | null
          progress_percent?: number | null
          scope?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          group_id?: string | null
          id?: string
          is_template?: boolean | null
          progress_percent?: number | null
          scope?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklists_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_checkin_settings: {
        Row: {
          base_points: number | null
          created_at: string
          id: string
          is_enabled: boolean | null
          max_streak_bonus: number | null
          streak_bonus_multiplier: number | null
          streak_milestones: Json | null
          updated_at: string
        }
        Insert: {
          base_points?: number | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          max_streak_bonus?: number | null
          streak_bonus_multiplier?: number | null
          streak_milestones?: Json | null
          updated_at?: string
        }
        Update: {
          base_points?: number | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          max_streak_bonus?: number | null
          streak_bonus_multiplier?: number | null
          streak_milestones?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          checkin_date: string
          created_at: string
          id: string
          is_milestone_bonus: boolean | null
          milestone_bonus_points: number | null
          points_earned: number
          streak_count: number
          user_id: string
        }
        Insert: {
          checkin_date?: string
          created_at?: string
          id?: string
          is_milestone_bonus?: boolean | null
          milestone_bonus_points?: number | null
          points_earned?: number
          streak_count?: number
          user_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string
          id?: string
          is_milestone_bonus?: boolean | null
          milestone_bonus_points?: number | null
          points_earned?: number
          streak_count?: number
          user_id?: string
        }
        Relationships: []
      }
      deposit_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_data: Json | null
          payment_id: string | null
          payment_provider: string
          payment_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_data?: Json | null
          payment_id?: string | null
          payment_provider?: string
          payment_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_data?: Json | null
          payment_id?: string | null
          payment_provider?: string
          payment_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      design_abuse_reports: {
        Row: {
          abuse_type: string
          admin_notes: string | null
          ai_confidence_score: number | null
          created_at: string | null
          description: string | null
          evidence: Json | null
          id: string
          order_id: string | null
          reported_user_id: string
          reporter_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          ticket_id: string | null
        }
        Insert: {
          abuse_type: string
          admin_notes?: string | null
          ai_confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          evidence?: Json | null
          id?: string
          order_id?: string | null
          reported_user_id: string
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          ticket_id?: string | null
        }
        Update: {
          abuse_type?: string
          admin_notes?: string | null
          ai_confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          evidence?: Json | null
          id?: string
          order_id?: string | null
          reported_user_id?: string
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_abuse_reports_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "design_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_abuse_reports_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "design_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      design_activity_logs: {
        Row: {
          action: string
          action_data: Json | null
          created_at: string
          id: string
          ip_address: string | null
          order_id: string | null
          ticket_id: string | null
          user_id: string
          user_type: string
        }
        Insert: {
          action: string
          action_data?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          order_id?: string | null
          ticket_id?: string | null
          user_id: string
          user_type?: string
        }
        Update: {
          action?: string
          action_data?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          order_id?: string | null
          ticket_id?: string | null
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_activity_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "design_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_activity_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "design_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      design_admin_stats: {
        Row: {
          active_sellers: number | null
          created_at: string | null
          disputes_opened: number | null
          disputes_resolved: number | null
          id: string
          new_buyers: number | null
          new_sellers: number | null
          platform_fees: number | null
          risk_sellers_count: number | null
          stat_date: string
          top_categories: Json | null
          total_orders: number | null
          total_revenue: number | null
        }
        Insert: {
          active_sellers?: number | null
          created_at?: string | null
          disputes_opened?: number | null
          disputes_resolved?: number | null
          id?: string
          new_buyers?: number | null
          new_sellers?: number | null
          platform_fees?: number | null
          risk_sellers_count?: number | null
          stat_date: string
          top_categories?: Json | null
          total_orders?: number | null
          total_revenue?: number | null
        }
        Update: {
          active_sellers?: number | null
          created_at?: string | null
          disputes_opened?: number | null
          disputes_resolved?: number | null
          id?: string
          new_buyers?: number | null
          new_sellers?: number | null
          platform_fees?: number | null
          risk_sellers_count?: number | null
          stat_date?: string
          top_categories?: Json | null
          total_orders?: number | null
          total_revenue?: number | null
        }
        Relationships: []
      }
      design_audit_logs: {
        Row: {
          action: string
          action_category: string | null
          actor_type: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          order_id: string | null
          ticket_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          action_category?: string | null
          actor_type?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          order_id?: string | null
          ticket_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          action_category?: string | null
          actor_type?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          order_id?: string | null
          ticket_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_audit_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "design_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_audit_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "design_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      design_blocked_keywords: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          keyword_pattern: string
          keyword_type: string | null
          replacement_text: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          keyword_pattern: string
          keyword_type?: string | null
          replacement_text?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          keyword_pattern?: string
          keyword_type?: string | null
          replacement_text?: string | null
        }
        Relationships: []
      }
      design_categories: {
        Row: {
          created_at: string
          description: string | null
          description_en: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          name_en: string | null
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          name_en?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      design_email_logs: {
        Row: {
          content: string | null
          delivered_at: string | null
          email_type: string
          id: string
          opened_at: string | null
          order_id: string | null
          recipient_email: string
          recipient_user_id: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template_used: string | null
          ticket_id: string | null
        }
        Insert: {
          content?: string | null
          delivered_at?: string | null
          email_type: string
          id?: string
          opened_at?: string | null
          order_id?: string | null
          recipient_email: string
          recipient_user_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template_used?: string | null
          ticket_id?: string | null
        }
        Update: {
          content?: string | null
          delivered_at?: string | null
          email_type?: string
          id?: string
          opened_at?: string | null
          order_id?: string | null
          recipient_email?: string
          recipient_user_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_used?: string | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_email_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "design_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_email_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "design_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      design_file_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_approved: boolean | null
          is_final: boolean | null
          notes: string | null
          order_id: string
          thumbnail_url: string | null
          ticket_id: string
          uploaded_by: string
          version_number: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_approved?: boolean | null
          is_final?: boolean | null
          notes?: string | null
          order_id: string
          thumbnail_url?: string | null
          ticket_id: string
          uploaded_by: string
          version_number?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_approved?: boolean | null
          is_final?: boolean | null
          notes?: string | null
          order_id?: string
          thumbnail_url?: string | null
          ticket_id?: string
          uploaded_by?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "design_file_versions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "design_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_file_versions_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "design_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      design_internal_messages: {
        Row: {
          attachments: Json | null
          created_at: string | null
          id: string
          message: string
          order_id: string
          sender_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          message: string
          order_id: string
          sender_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          message?: string
          order_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_internal_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "design_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      design_license_types: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          description_en: string | null
          id: string
          includes_commercial_use: boolean | null
          includes_exclusive_rights: boolean | null
          includes_source_files: boolean | null
          is_active: boolean | null
          name: string
          name_en: string | null
          price_multiplier: number | null
          sort_order: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          id?: string
          includes_commercial_use?: boolean | null
          includes_exclusive_rights?: boolean | null
          includes_source_files?: boolean | null
          is_active?: boolean | null
          name: string
          name_en?: string | null
          price_multiplier?: number | null
          sort_order?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          id?: string
          includes_commercial_use?: boolean | null
          includes_exclusive_rights?: boolean | null
          includes_source_files?: boolean | null
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          price_multiplier?: number | null
          sort_order?: number | null
        }
        Relationships: []
      }
      design_managers: {
        Row: {
          added_by: string | null
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean | null
          permissions: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      design_milestones: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          deadline: string | null
          delivered_at: string | null
          description: string | null
          escrow_status: string | null
          id: string
          max_revisions: number | null
          name: string
          name_vi: string
          order_id: string
          percentage: number | null
          revision_count: number | null
          sort_order: number | null
          status: string | null
          ticket_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          deadline?: string | null
          delivered_at?: string | null
          description?: string | null
          escrow_status?: string | null
          id?: string
          max_revisions?: number | null
          name: string
          name_vi: string
          order_id: string
          percentage?: number | null
          revision_count?: number | null
          sort_order?: number | null
          status?: string | null
          ticket_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          deadline?: string | null
          delivered_at?: string | null
          description?: string | null
          escrow_status?: string | null
          id?: string
          max_revisions?: number | null
          name?: string
          name_vi?: string
          order_id?: string
          percentage?: number | null
          revision_count?: number | null
          sort_order?: number | null
          status?: string | null
          ticket_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_milestones_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "design_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_milestones_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "design_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      design_nda_agreements: {
        Row: {
          buyer_id: string
          buyer_signed_at: string | null
          confidentiality_period_days: number | null
          created_at: string | null
          id: string
          nda_fee: number | null
          no_portfolio_use: boolean | null
          order_id: string
          requires_nda: boolean | null
          seller_id: string
          seller_signed_at: string | null
          violated_at: string | null
          violation_penalty: number | null
          violation_reason: string | null
        }
        Insert: {
          buyer_id: string
          buyer_signed_at?: string | null
          confidentiality_period_days?: number | null
          created_at?: string | null
          id?: string
          nda_fee?: number | null
          no_portfolio_use?: boolean | null
          order_id: string
          requires_nda?: boolean | null
          seller_id: string
          seller_signed_at?: string | null
          violated_at?: string | null
          violation_penalty?: number | null
          violation_reason?: string | null
        }
        Update: {
          buyer_id?: string
          buyer_signed_at?: string | null
          confidentiality_period_days?: number | null
          created_at?: string | null
          id?: string
          nda_fee?: number | null
          no_portfolio_use?: boolean | null
          order_id?: string
          requires_nda?: boolean | null
          seller_id?: string
          seller_signed_at?: string | null
          violated_at?: string | null
          violation_penalty?: number | null
          violation_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_nda_agreements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "design_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_nda_agreements_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_nda_agreements_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      design_order_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string
          id: string
          is_primary: boolean | null
          notes: string | null
          order_id: string
          team_member_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          order_id: string
          team_member_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          order_id?: string
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_order_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "design_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_order_assignments_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "design_team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      design_order_milestones: {
        Row: {
          approved_at: string | null
          buyer_feedback: string | null
          created_at: string | null
          deadline: string | null
          description: string | null
          escrow_amount: number | null
          escrow_status: string | null
          id: string
          milestone_type: string
          order_id: string
          seller_notes: string | null
          sort_order: number | null
          status: string | null
          submitted_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          buyer_feedback?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          escrow_amount?: number | null
          escrow_status?: string | null
          id?: string
          milestone_type: string
          order_id: string
          seller_notes?: string | null
          sort_order?: number | null
          status?: string | null
          submitted_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          buyer_feedback?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          escrow_amount?: number | null
          escrow_status?: string | null
          id?: string
          milestone_type?: string
          order_id?: string
          seller_notes?: string | null
          sort_order?: number | null
          status?: string | null
          submitted_at?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_order_milestones_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "design_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      design_orders: {
        Row: {
          accept_deadline: string | null
          amount: number
          auto_matched: boolean | null
          base_revisions: number | null
          buyer_confirm_reminded_at: string | null
          buyer_confirmed: boolean | null
          buyer_id: string
          buyer_no_response_reminded_at: string | null
          completed_at: string | null
          created_at: string
          current_milestone: string | null
          current_milestone_id: string | null
          deadline: string | null
          delivery_notes: string | null
          dispute_reason: string | null
          dispute_resolution: string | null
          dispute_resolved_at: string | null
          disputed_at: string | null
          draft_deadline: string | null
          escrow_release_at: string | null
          escrow_status: string
          extra_revisions_purchased: number | null
          final_deadline: string | null
          final_files: string[] | null
          form_data: Json | null
          id: string
          is_milestone_order: boolean | null
          late_count: number | null
          late_penalty_applied: boolean | null
          license_price_multiplier: number | null
          license_type_id: string | null
          match_score: number | null
          nda_fee: number | null
          no_portfolio_use: boolean | null
          order_number: string
          original_amount: number | null
          platform_fee: number
          platform_fee_rate: number
          reference_files: string[] | null
          requirement_colors: string | null
          requirement_notes: string | null
          requirement_purpose: string | null
          requirement_size: string | null
          requirement_style: string | null
          requirement_text: string | null
          requires_nda: boolean | null
          revision_price: number | null
          revision_used: number | null
          revisions_used: number | null
          seller_amount: number
          seller_confirmed: boolean | null
          seller_deadline_reminded_at: string | null
          seller_id: string
          seller_overdue_reminded_at: string | null
          service_id: string
          status: string
          template_id: string | null
          updated_at: string
          voucher_code: string | null
          voucher_discount: number | null
        }
        Insert: {
          accept_deadline?: string | null
          amount: number
          auto_matched?: boolean | null
          base_revisions?: number | null
          buyer_confirm_reminded_at?: string | null
          buyer_confirmed?: boolean | null
          buyer_id: string
          buyer_no_response_reminded_at?: string | null
          completed_at?: string | null
          created_at?: string
          current_milestone?: string | null
          current_milestone_id?: string | null
          deadline?: string | null
          delivery_notes?: string | null
          dispute_reason?: string | null
          dispute_resolution?: string | null
          dispute_resolved_at?: string | null
          disputed_at?: string | null
          draft_deadline?: string | null
          escrow_release_at?: string | null
          escrow_status?: string
          extra_revisions_purchased?: number | null
          final_deadline?: string | null
          final_files?: string[] | null
          form_data?: Json | null
          id?: string
          is_milestone_order?: boolean | null
          late_count?: number | null
          late_penalty_applied?: boolean | null
          license_price_multiplier?: number | null
          license_type_id?: string | null
          match_score?: number | null
          nda_fee?: number | null
          no_portfolio_use?: boolean | null
          order_number?: string
          original_amount?: number | null
          platform_fee?: number
          platform_fee_rate?: number
          reference_files?: string[] | null
          requirement_colors?: string | null
          requirement_notes?: string | null
          requirement_purpose?: string | null
          requirement_size?: string | null
          requirement_style?: string | null
          requirement_text?: string | null
          requires_nda?: boolean | null
          revision_price?: number | null
          revision_used?: number | null
          revisions_used?: number | null
          seller_amount?: number
          seller_confirmed?: boolean | null
          seller_deadline_reminded_at?: string | null
          seller_id: string
          seller_overdue_reminded_at?: string | null
          service_id: string
          status?: string
          template_id?: string | null
          updated_at?: string
          voucher_code?: string | null
          voucher_discount?: number | null
        }
        Update: {
          accept_deadline?: string | null
          amount?: number
          auto_matched?: boolean | null
          base_revisions?: number | null
          buyer_confirm_reminded_at?: string | null
          buyer_confirmed?: boolean | null
          buyer_id?: string
          buyer_no_response_reminded_at?: string | null
          completed_at?: string | null
          created_at?: string
          current_milestone?: string | null
          current_milestone_id?: string | null
          deadline?: string | null
          delivery_notes?: string | null
          dispute_reason?: string | null
          dispute_resolution?: string | null
          dispute_resolved_at?: string | null
          disputed_at?: string | null
          draft_deadline?: string | null
          escrow_release_at?: string | null
          escrow_status?: string
          extra_revisions_purchased?: number | null
          final_deadline?: string | null
          final_files?: string[] | null
          form_data?: Json | null
          id?: string
          is_milestone_order?: boolean | null
          late_count?: number | null
          late_penalty_applied?: boolean | null
          license_price_multiplier?: number | null
          license_type_id?: string | null
          match_score?: number | null
          nda_fee?: number | null
          no_portfolio_use?: boolean | null
          order_number?: string
          original_amount?: number | null
          platform_fee?: number
          platform_fee_rate?: number
          reference_files?: string[] | null
          requirement_colors?: string | null
          requirement_notes?: string | null
          requirement_purpose?: string | null
          requirement_size?: string | null
          requirement_style?: string | null
          requirement_text?: string | null
          requires_nda?: boolean | null
          revision_price?: number | null
          revision_used?: number | null
          revisions_used?: number | null
          seller_amount?: number
          seller_confirmed?: boolean | null
          seller_deadline_reminded_at?: string | null
          seller_id?: string
          seller_overdue_reminded_at?: string | null
          service_id?: string
          status?: string
          template_id?: string | null
          updated_at?: string
          voucher_code?: string | null
          voucher_discount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "design_orders_license_type_id_fkey"
            columns: ["license_type_id"]
            isOneToOne: false
            referencedRelation: "design_license_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "design_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_orders_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "design_service_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      design_platform_fees: {
        Row: {
          created_at: string | null
          description: string | null
          fee_fixed: number | null
          fee_percent: number | null
          fee_type: string
          id: string
          is_active: boolean | null
          max_fee: number | null
          min_fee: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          fee_fixed?: number | null
          fee_percent?: number | null
          fee_type: string
          id?: string
          is_active?: boolean | null
          max_fee?: number | null
          min_fee?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          fee_fixed?: number | null
          fee_percent?: number | null
          fee_type?: string
          id?: string
          is_active?: boolean | null
          max_fee?: number | null
          min_fee?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      design_quick_actions: {
        Row: {
          action_type: string
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_active: boolean | null
          is_for_buyer: boolean | null
          is_for_seller: boolean | null
          label: string
          label_en: string | null
          message_template: string | null
          sort_order: number | null
        }
        Insert: {
          action_type: string
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_for_buyer?: boolean | null
          is_for_seller?: boolean | null
          label: string
          label_en?: string | null
          message_template?: string | null
          sort_order?: number | null
        }
        Update: {
          action_type?: string
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_for_buyer?: boolean | null
          is_for_seller?: boolean | null
          label?: string
          label_en?: string | null
          message_template?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      design_rate_limits: {
        Row: {
          action_count: number | null
          action_type: string
          created_at: string | null
          id: string
          user_id: string
          window_hours: number | null
          window_start: string | null
        }
        Insert: {
          action_count?: number | null
          action_type: string
          created_at?: string | null
          id?: string
          user_id: string
          window_hours?: number | null
          window_start?: string | null
        }
        Update: {
          action_count?: number | null
          action_type?: string
          created_at?: string | null
          id?: string
          user_id?: string
          window_hours?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      design_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          evidence_urls: string[] | null
          id: string
          order_id: string | null
          reason: string
          reported_user_id: string
          reported_user_type: string
          reporter_id: string
          reporter_type: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          ticket_id: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          order_id?: string | null
          reason: string
          reported_user_id: string
          reported_user_type: string
          reporter_id: string
          reporter_type?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          ticket_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          order_id?: string | null
          reason?: string
          reported_user_id?: string
          reported_user_type?: string
          reporter_id?: string
          reporter_type?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          ticket_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_reports_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "design_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_reports_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "design_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      design_review_criteria: {
        Row: {
          buyer_id: string
          comment: string | null
          communication_rating: number | null
          created_at: string
          deadline_rating: number | null
          id: string
          is_on_time: boolean | null
          order_id: string
          overall_rating: number
          quality_rating: number | null
          seller_id: string
          service_id: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          deadline_rating?: number | null
          id?: string
          is_on_time?: boolean | null
          order_id: string
          overall_rating: number
          quality_rating?: number | null
          seller_id: string
          service_id: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          deadline_rating?: number | null
          id?: string
          is_on_time?: boolean | null
          order_id?: string
          overall_rating?: number
          quality_rating?: number | null
          seller_id?: string
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_review_criteria_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "design_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_review_criteria_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_review_criteria_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_review_criteria_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "design_services"
            referencedColumns: ["id"]
          },
        ]
      }
      design_revision_packages: {
        Row: {
          buyer_id: string | null
          created_at: string | null
          escrow_status: string | null
          id: string
          order_id: string
          price_per_revision: number
          purchased_at: string | null
          quantity: number
          seller_id: string | null
          total_price: number
          used_count: number | null
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string | null
          escrow_status?: string | null
          id?: string
          order_id: string
          price_per_revision: number
          purchased_at?: string | null
          quantity?: number
          seller_id?: string | null
          total_price: number
          used_count?: number | null
        }
        Update: {
          buyer_id?: string | null
          created_at?: string | null
          escrow_status?: string | null
          id?: string
          order_id?: string
          price_per_revision?: number
          purchased_at?: string | null
          quantity?: number
          seller_id?: string | null
          total_price?: number
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "design_revision_packages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "design_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      design_seller_daily_stats: {
        Row: {
          avg_completion_hours: number | null
          created_at: string | null
          id: string
          late_count: number | null
          messages_sent: number | null
          on_time_count: number | null
          orders_cancelled: number | null
          orders_completed: number | null
          orders_disputed: number | null
          orders_received: number | null
          profile_views: number | null
          revenue: number | null
          seller_id: string
          service_views: number | null
          stat_date: string
        }
        Insert: {
          avg_completion_hours?: number | null
          created_at?: string | null
          id?: string
          late_count?: number | null
          messages_sent?: number | null
          on_time_count?: number | null
          orders_cancelled?: number | null
          orders_completed?: number | null
          orders_disputed?: number | null
          orders_received?: number | null
          profile_views?: number | null
          revenue?: number | null
          seller_id: string
          service_views?: number | null
          stat_date: string
        }
        Update: {
          avg_completion_hours?: number | null
          created_at?: string | null
          id?: string
          late_count?: number | null
          messages_sent?: number | null
          on_time_count?: number | null
          orders_cancelled?: number | null
          orders_completed?: number | null
          orders_disputed?: number | null
          orders_received?: number | null
          profile_views?: number | null
          revenue?: number | null
          seller_id?: string
          service_views?: number | null
          stat_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_seller_daily_stats_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_seller_daily_stats_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      design_seller_match_profiles: {
        Row: {
          acceptance_rate: number | null
          avg_completion_days: number | null
          avg_response_time_hours: number | null
          categories: string[] | null
          created_at: string | null
          current_workload: number | null
          id: string
          is_available: boolean | null
          last_order_at: string | null
          max_concurrent_orders: number | null
          on_time_rate: number | null
          priority_score: number | null
          seller_id: string
          specialties: string[] | null
          updated_at: string | null
        }
        Insert: {
          acceptance_rate?: number | null
          avg_completion_days?: number | null
          avg_response_time_hours?: number | null
          categories?: string[] | null
          created_at?: string | null
          current_workload?: number | null
          id?: string
          is_available?: boolean | null
          last_order_at?: string | null
          max_concurrent_orders?: number | null
          on_time_rate?: number | null
          priority_score?: number | null
          seller_id: string
          specialties?: string[] | null
          updated_at?: string | null
        }
        Update: {
          acceptance_rate?: number | null
          avg_completion_days?: number | null
          avg_response_time_hours?: number | null
          categories?: string[] | null
          created_at?: string | null
          current_workload?: number | null
          id?: string
          is_available?: boolean | null
          last_order_at?: string | null
          max_concurrent_orders?: number | null
          on_time_rate?: number | null
          priority_score?: number | null
          seller_id?: string
          specialties?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_seller_match_profiles_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_seller_match_profiles_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      design_seller_nda_settings: {
        Row: {
          confidentiality_period_days: number | null
          created_at: string | null
          custom_terms: string | null
          id: string
          nda_fee: number | null
          no_portfolio_use: boolean | null
          requires_nda: boolean | null
          seller_id: string
          updated_at: string | null
          violation_penalty: number | null
        }
        Insert: {
          confidentiality_period_days?: number | null
          created_at?: string | null
          custom_terms?: string | null
          id?: string
          nda_fee?: number | null
          no_portfolio_use?: boolean | null
          requires_nda?: boolean | null
          seller_id: string
          updated_at?: string | null
          violation_penalty?: number | null
        }
        Update: {
          confidentiality_period_days?: number | null
          created_at?: string | null
          custom_terms?: string | null
          id?: string
          nda_fee?: number | null
          no_portfolio_use?: boolean | null
          requires_nda?: boolean | null
          seller_id?: string
          updated_at?: string | null
          violation_penalty?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "design_seller_nda_settings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_seller_nda_settings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      design_seller_notes: {
        Row: {
          created_at: string
          id: string
          note: string
          seller_id: string
          ticket_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          note: string
          seller_id: string
          ticket_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          seller_id?: string
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_seller_notes_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_seller_notes_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_seller_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "design_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      design_seller_penalties: {
        Row: {
          amount: number | null
          appeal_reason: string | null
          appeal_status: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_appealed: boolean | null
          issued_at: string | null
          order_id: string | null
          penalty_type: string
          resolved_at: string | null
          seller_id: string
          severity: string | null
          trust_score_deduction: number | null
        }
        Insert: {
          amount?: number | null
          appeal_reason?: string | null
          appeal_status?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_appealed?: boolean | null
          issued_at?: string | null
          order_id?: string | null
          penalty_type: string
          resolved_at?: string | null
          seller_id: string
          severity?: string | null
          trust_score_deduction?: number | null
        }
        Update: {
          amount?: number | null
          appeal_reason?: string | null
          appeal_status?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_appealed?: boolean | null
          issued_at?: string | null
          order_id?: string | null
          penalty_type?: string
          resolved_at?: string | null
          seller_id?: string
          severity?: string | null
          trust_score_deduction?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "design_seller_penalties_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "design_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_seller_penalties_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_seller_penalties_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      design_seller_rewards: {
        Row: {
          amount: number | null
          awarded_at: string | null
          claimed_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_claimed: boolean | null
          order_id: string | null
          reward_type: string
          seller_id: string
        }
        Insert: {
          amount?: number | null
          awarded_at?: string | null
          claimed_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_claimed?: boolean | null
          order_id?: string | null
          reward_type: string
          seller_id: string
        }
        Update: {
          amount?: number | null
          awarded_at?: string | null
          claimed_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_claimed?: boolean | null
          order_id?: string | null
          reward_type?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_seller_rewards_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "design_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_seller_rewards_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_seller_rewards_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      design_seller_subscriptions: {
        Row: {
          analytics_enabled: boolean | null
          auto_renew: boolean | null
          created_at: string | null
          expires_at: string | null
          featured_listing_enabled: boolean | null
          fee_discount_percent: number | null
          id: string
          plan_type: string
          price: number | null
          priority_match_enabled: boolean | null
          seller_id: string
          started_at: string | null
          status: string | null
          team_members_limit: number | null
        }
        Insert: {
          analytics_enabled?: boolean | null
          auto_renew?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          featured_listing_enabled?: boolean | null
          fee_discount_percent?: number | null
          id?: string
          plan_type: string
          price?: number | null
          priority_match_enabled?: boolean | null
          seller_id: string
          started_at?: string | null
          status?: string | null
          team_members_limit?: number | null
        }
        Update: {
          analytics_enabled?: boolean | null
          auto_renew?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          featured_listing_enabled?: boolean | null
          fee_discount_percent?: number | null
          id?: string
          plan_type?: string
          price?: number | null
          priority_match_enabled?: boolean | null
          seller_id?: string
          started_at?: string | null
          status?: string | null
          team_members_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "design_seller_subscriptions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_seller_subscriptions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      design_service_license_prices: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean | null
          license_type_id: string
          price: number
          service_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          license_type_id: string
          price?: number
          service_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          license_type_id?: string
          price?: number
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_service_license_prices_license_type_id_fkey"
            columns: ["license_type_id"]
            isOneToOne: false
            referencedRelation: "design_license_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_service_license_prices_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "design_services"
            referencedColumns: ["id"]
          },
        ]
      }
      design_service_reviews: {
        Row: {
          buyer_id: string
          comment: string | null
          created_at: string
          id: string
          on_time: boolean | null
          order_id: string
          rating: number
          seller_id: string
          service_id: string
        }
        Insert: {
          buyer_id: string
          comment?: string | null
          created_at?: string
          id?: string
          on_time?: boolean | null
          order_id: string
          rating: number
          seller_id: string
          service_id: string
        }
        Update: {
          buyer_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          on_time?: boolean | null
          order_id?: string
          rating?: number
          seller_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_service_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "design_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_service_reviews_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_service_reviews_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_service_reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "design_services"
            referencedColumns: ["id"]
          },
        ]
      }
      design_service_templates: {
        Row: {
          created_at: string | null
          description: string | null
          form_fields: Json
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          seller_id: string
          service_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          form_fields?: Json
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          seller_id: string
          service_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          form_fields?: Json
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          seller_id?: string
          service_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_service_templates_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_service_templates_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_service_templates_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "design_services"
            referencedColumns: ["id"]
          },
        ]
      }
      design_services: {
        Row: {
          allowed_file_formats: string[] | null
          average_rating: number | null
          category_id: string
          completed_orders: number | null
          created_at: string
          delivery_days: number
          delivery_formats: string[] | null
          description: string | null
          extra_revision_price: number | null
          id: string
          is_active: boolean | null
          max_file_size_mb: number | null
          milestone_config: Json | null
          min_resolution_height: number | null
          min_resolution_width: number | null
          name: string
          on_time_rate: number | null
          portfolio_images: string[] | null
          price: number
          rating_count: number | null
          revision_count: number
          rush_delivery_fee: number | null
          seller_id: string
          supports_milestone: boolean | null
          total_orders: number | null
          updated_at: string
        }
        Insert: {
          allowed_file_formats?: string[] | null
          average_rating?: number | null
          category_id: string
          completed_orders?: number | null
          created_at?: string
          delivery_days?: number
          delivery_formats?: string[] | null
          description?: string | null
          extra_revision_price?: number | null
          id?: string
          is_active?: boolean | null
          max_file_size_mb?: number | null
          milestone_config?: Json | null
          min_resolution_height?: number | null
          min_resolution_width?: number | null
          name: string
          on_time_rate?: number | null
          portfolio_images?: string[] | null
          price?: number
          rating_count?: number | null
          revision_count?: number
          rush_delivery_fee?: number | null
          seller_id: string
          supports_milestone?: boolean | null
          total_orders?: number | null
          updated_at?: string
        }
        Update: {
          allowed_file_formats?: string[] | null
          average_rating?: number | null
          category_id?: string
          completed_orders?: number | null
          created_at?: string
          delivery_days?: number
          delivery_formats?: string[] | null
          description?: string | null
          extra_revision_price?: number | null
          id?: string
          is_active?: boolean | null
          max_file_size_mb?: number | null
          milestone_config?: Json | null
          min_resolution_height?: number | null
          min_resolution_width?: number | null
          name?: string
          on_time_rate?: number | null
          portfolio_images?: string[] | null
          price?: number
          rating_count?: number | null
          revision_count?: number
          rush_delivery_fee?: number | null
          seller_id?: string
          supports_milestone?: boolean | null
          total_orders?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_services_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_services_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      design_team_members: {
        Row: {
          can_chat_buyers: boolean | null
          can_manage_finances: boolean | null
          can_manage_orders: boolean | null
          can_view_orders: boolean | null
          created_at: string | null
          id: string
          is_active: boolean | null
          member_user_id: string
          role: string
          seller_id: string
          updated_at: string | null
        }
        Insert: {
          can_chat_buyers?: boolean | null
          can_manage_finances?: boolean | null
          can_manage_orders?: boolean | null
          can_view_orders?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          member_user_id: string
          role: string
          seller_id: string
          updated_at?: string | null
        }
        Update: {
          can_chat_buyers?: boolean | null
          can_manage_finances?: boolean | null
          can_manage_orders?: boolean | null
          can_view_orders?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          member_user_id?: string
          role?: string
          seller_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_team_members_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_team_members_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      design_ticket_collaborators: {
        Row: {
          added_at: string | null
          collaborator_id: string
          id: string
          is_active: boolean | null
          order_id: string
          permissions: string[] | null
          removed_at: string | null
          role: string | null
          seller_id: string
          ticket_id: string
        }
        Insert: {
          added_at?: string | null
          collaborator_id: string
          id?: string
          is_active?: boolean | null
          order_id: string
          permissions?: string[] | null
          removed_at?: string | null
          role?: string | null
          seller_id: string
          ticket_id: string
        }
        Update: {
          added_at?: string | null
          collaborator_id?: string
          id?: string
          is_active?: boolean | null
          order_id?: string
          permissions?: string[] | null
          removed_at?: string | null
          role?: string | null
          seller_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_ticket_collaborators_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "design_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_ticket_collaborators_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "design_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      design_ticket_internal_notes: {
        Row: {
          attachments: Json | null
          author_id: string
          content: string
          created_at: string | null
          id: string
          is_task: boolean | null
          mentioned_user_ids: string[] | null
          order_id: string
          task_assignee_id: string | null
          task_deadline: string | null
          task_status: string | null
          ticket_id: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          is_task?: boolean | null
          mentioned_user_ids?: string[] | null
          order_id: string
          task_assignee_id?: string | null
          task_deadline?: string | null
          task_status?: string | null
          ticket_id: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_task?: boolean | null
          mentioned_user_ids?: string[] | null
          order_id?: string
          task_assignee_id?: string | null
          task_deadline?: string | null
          task_status?: string | null
          ticket_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_ticket_internal_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "design_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_ticket_internal_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "design_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      design_ticket_messages: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          is_delivery: boolean | null
          is_revision_request: boolean | null
          message: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_delivery?: boolean | null
          is_revision_request?: boolean | null
          message: string
          sender_id: string
          sender_type?: string
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_delivery?: boolean | null
          is_revision_request?: boolean | null
          message?: string
          sender_id?: string
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "design_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      design_tickets: {
        Row: {
          admin_id: string | null
          admin_involved: boolean | null
          auto_close_at: string | null
          auto_close_warning_sent: boolean | null
          buyer_last_response_at: string | null
          closed_at: string | null
          created_at: string
          id: string
          is_vip: boolean | null
          order_id: string
          priority: number | null
          revision_requested: number | null
          seller_last_response_at: string | null
          status: string
          ticket_number: string
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          admin_involved?: boolean | null
          auto_close_at?: string | null
          auto_close_warning_sent?: boolean | null
          buyer_last_response_at?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          is_vip?: boolean | null
          order_id: string
          priority?: number | null
          revision_requested?: number | null
          seller_last_response_at?: string | null
          status?: string
          ticket_number?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          admin_involved?: boolean | null
          auto_close_at?: string | null
          auto_close_warning_sent?: boolean | null
          buyer_last_response_at?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          is_vip?: boolean | null
          order_id?: string
          priority?: number | null
          revision_requested?: number | null
          seller_last_response_at?: string | null
          status?: string
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "design_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      design_user_risk_scores: {
        Row: {
          abuse_reports_confirmed: number | null
          abuse_reports_received: number | null
          completed_orders: number | null
          created_at: string | null
          disputed_orders: number | null
          flag_reason: string | null
          id: string
          is_flagged: boolean | null
          last_calculated_at: string | null
          late_deliveries: number | null
          refunded_orders: number | null
          risk_score: number | null
          total_orders: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          abuse_reports_confirmed?: number | null
          abuse_reports_received?: number | null
          completed_orders?: number | null
          created_at?: string | null
          disputed_orders?: number | null
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          last_calculated_at?: string | null
          late_deliveries?: number | null
          refunded_orders?: number | null
          risk_score?: number | null
          total_orders?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          abuse_reports_confirmed?: number | null
          abuse_reports_received?: number | null
          completed_orders?: number | null
          created_at?: string | null
          disputed_orders?: number | null
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          last_calculated_at?: string | null
          late_deliveries?: number | null
          refunded_orders?: number | null
          risk_score?: number | null
          total_orders?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      design_webhook_logs: {
        Row: {
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          success: boolean | null
          triggered_at: string | null
          webhook_id: string
        }
        Insert: {
          event_type: string
          id?: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          success?: boolean | null
          triggered_at?: string | null
          webhook_id: string
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          success?: boolean | null
          triggered_at?: string | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "design_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      design_webhooks: {
        Row: {
          created_at: string | null
          events: string[]
          failure_count: number | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          secret_key: string | null
          seller_id: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          events?: string[]
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          secret_key?: string | null
          seller_id: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          events?: string[]
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          secret_key?: string | null
          seller_id?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_webhooks_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_webhooks_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          recipient: string
          status: string
          subject: string
          template_name: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          recipient: string
          status?: string
          subject: string
          template_name?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          recipient?: string
          status?: string
          subject?: string
          template_name?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          body_en: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          subject: string
          subject_en: string | null
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          body: string
          body_en?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          subject: string
          subject_en?: string | null
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          body?: string
          body_en?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          subject?: string
          subject_en?: string | null
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      email_verification_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          verified_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          verified_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      event_point_transactions: {
        Row: {
          created_at: string
          event_id: string
          id: string
          note: string | null
          points: number
          reference_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          note?: string | null
          points: number
          reference_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          note?: string | null
          points?: number
          reference_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_point_transactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_spin_history: {
        Row: {
          claimed: boolean
          claimed_at: string | null
          created_at: string
          custom_fields: Json | null
          event_id: string
          id: string
          order_id: string | null
          points_spent: number
          prize_data: Json | null
          prize_id: string | null
          prize_name: string
          prize_type: string
          user_id: string
        }
        Insert: {
          claimed?: boolean
          claimed_at?: string | null
          created_at?: string
          custom_fields?: Json | null
          event_id: string
          id?: string
          order_id?: string | null
          points_spent: number
          prize_data?: Json | null
          prize_id?: string | null
          prize_name: string
          prize_type: string
          user_id: string
        }
        Update: {
          claimed?: boolean
          claimed_at?: string | null
          created_at?: string
          custom_fields?: Json | null
          event_id?: string
          id?: string
          order_id?: string | null
          points_spent?: number
          prize_data?: Json | null
          prize_id?: string | null
          prize_name?: string
          prize_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_spin_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_spin_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_spin_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_spin_history_prize_id_fkey"
            columns: ["prize_id"]
            isOneToOne: false
            referencedRelation: "event_spin_prizes"
            referencedColumns: ["id"]
          },
        ]
      }
      event_spin_prizes: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          prize_reference_id: string | null
          prize_type: string
          prize_value: number | null
          quantity_remaining: number
          quantity_total: number
          sort_order: number
          updated_at: string
          win_rate: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          prize_reference_id?: string | null
          prize_type?: string
          prize_value?: number | null
          quantity_remaining?: number
          quantity_total?: number
          sort_order?: number
          updated_at?: string
          win_rate?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          prize_reference_id?: string | null
          prize_type?: string
          prize_value?: number | null
          quantity_remaining?: number
          quantity_total?: number
          sort_order?: number
          updated_at?: string
          win_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_spin_prizes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          end_date: string
          event_type: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          points_per_amount: number
          points_type: string
          points_value: number
          spin_cost: number
          start_date: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          end_date: string
          event_type?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          points_per_amount?: number
          points_type?: string
          points_value?: number
          spin_cost?: number
          start_date: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string
          event_type?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          points_per_amount?: number
          points_type?: string
          points_value?: number
          spin_cost?: number
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      flash_sale_items: {
        Row: {
          created_at: string
          discount_percent: number
          flash_sale_id: string
          id: string
          original_price: number
          package_id: string | null
          product_id: string
          quantity_limit: number | null
          quantity_sold: number
          sale_price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_percent?: number
          flash_sale_id: string
          id?: string
          original_price: number
          package_id?: string | null
          product_id: string
          quantity_limit?: number | null
          quantity_sold?: number
          sale_price: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_percent?: number
          flash_sale_id?: string
          id?: string
          original_price?: number
          package_id?: string | null
          product_id?: string
          quantity_limit?: number | null
          quantity_sold?: number
          sale_price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flash_sale_items_flash_sale_id_fkey"
            columns: ["flash_sale_id"]
            isOneToOne: false
            referencedRelation: "flash_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flash_sale_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "product_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flash_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      flash_sales: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      game_account_inventory: {
        Row: {
          account_data: string
          created_at: string
          id: string
          order_id: string | null
          product_id: string
          sold_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          account_data: string
          created_at?: string
          id?: string
          order_id?: string | null
          product_id: string
          sold_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          account_data?: string
          created_at?: string
          id?: string
          order_id?: string | null
          product_id?: string
          sold_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_account_inventory_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_account_inventory_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_account_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_card_promotions: {
        Row: {
          created_at: string | null
          discount_percent: number
          end_date: string
          id: string
          is_active: boolean | null
          max_amount: number | null
          min_amount: number | null
          name: string
          start_date: string
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
        }
        Insert: {
          created_at?: string | null
          discount_percent?: number
          end_date: string
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          name: string
          start_date: string
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Update: {
          created_at?: string | null
          discount_percent?: number
          end_date?: string
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          name?: string
          start_date?: string
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Relationships: []
      }
      gift_card_templates: {
        Row: {
          background_color: string | null
          created_at: string | null
          id: string
          image_url: string
          is_active: boolean | null
          name: string
          name_en: string | null
          sort_order: number | null
          text_color: string | null
          updated_at: string | null
        }
        Insert: {
          background_color?: string | null
          created_at?: string | null
          id: string
          image_url: string
          is_active?: boolean | null
          name: string
          name_en?: string | null
          sort_order?: number | null
          text_color?: string | null
          updated_at?: string | null
        }
        Update: {
          background_color?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          sort_order?: number | null
          text_color?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gift_cards: {
        Row: {
          amount: number
          balance: number
          bulk_group_id: string | null
          code: string
          created_at: string
          discount_percent: number | null
          expires_at: string | null
          id: string
          is_active: boolean
          is_bulk: boolean | null
          is_redeemed: boolean
          message: string | null
          original_amount: number | null
          purchaser_email: string | null
          purchaser_id: string | null
          recipient_email: string | null
          recipient_name: string | null
          redeemed_at: string | null
          redeemed_by: string | null
          scheduled_at: string | null
          share_token: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          balance: number
          bulk_group_id?: string | null
          code: string
          created_at?: string
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_bulk?: boolean | null
          is_redeemed?: boolean
          message?: string | null
          original_amount?: number | null
          purchaser_email?: string | null
          purchaser_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          scheduled_at?: string | null
          share_token?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          balance?: number
          bulk_group_id?: string | null
          code?: string
          created_at?: string
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_bulk?: boolean | null
          is_redeemed?: boolean
          message?: string | null
          original_amount?: number | null
          purchaser_email?: string | null
          purchaser_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          scheduled_at?: string | null
          share_token?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      group_activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          group_id: string
          id: string
          target_id: string | null
          target_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          group_id: string
          id?: string
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          group_id?: string
          id?: string
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_activity_logs_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_auto_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          group_id: string
          id: string
          is_active: boolean | null
          name: string
          rule_type: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string
          group_id: string
          id?: string
          is_active?: boolean | null
          name: string
          rule_type: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          group_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          rule_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_auto_rules_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_badges: {
        Row: {
          auto_criteria_type: string | null
          auto_criteria_value: number | null
          color: string | null
          created_at: string
          criteria: string | null
          description: string | null
          group_id: string
          icon: string | null
          id: string
          is_active: boolean | null
          is_auto: boolean | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          auto_criteria_type?: string | null
          auto_criteria_value?: number | null
          color?: string | null
          created_at?: string
          criteria?: string | null
          description?: string | null
          group_id: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_auto?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          auto_criteria_type?: string | null
          auto_criteria_value?: number | null
          color?: string | null
          created_at?: string
          criteria?: string | null
          description?: string | null
          group_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_auto?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_badges_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_bans: {
        Row: {
          ban_type: string
          banned_by: string
          created_at: string
          expires_at: string | null
          group_id: string
          id: string
          is_active: boolean | null
          reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ban_type?: string
          banned_by: string
          created_at?: string
          expires_at?: string | null
          group_id: string
          id?: string
          is_active?: boolean | null
          reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ban_type?: string
          banned_by?: string
          created_at?: string
          expires_at?: string | null
          group_id?: string
          id?: string
          is_active?: boolean | null
          reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_bans_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_contribution_history: {
        Row: {
          created_at: string
          group_id: string
          id: string
          points_change: number
          reason: string
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          points_change: number
          reason: string
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          points_change?: number
          reason?: string
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_contribution_history_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_custom_roles: {
        Row: {
          color: string | null
          created_at: string
          current_count: number | null
          group_id: string
          icon: string | null
          id: string
          is_active: boolean | null
          max_count: number | null
          name: string
          permissions: Json | null
          price: number | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          current_count?: number | null
          group_id: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_count?: number | null
          name: string
          permissions?: Json | null
          price?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          current_count?: number | null
          group_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_count?: number | null
          name?: string
          permissions?: Json | null
          price?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_custom_roles_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_deal_participants: {
        Row: {
          contribution_amount: number | null
          deal_id: string
          id: string
          joined_at: string
          result: Json | null
          role: string | null
          user_id: string
        }
        Insert: {
          contribution_amount?: number | null
          deal_id: string
          id?: string
          joined_at?: string
          result?: Json | null
          role?: string | null
          user_id: string
        }
        Update: {
          contribution_amount?: number | null
          deal_id?: string
          id?: string
          joined_at?: string
          result?: Json | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_deal_participants_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "group_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      group_deals: {
        Row: {
          conditions: Json | null
          created_at: string
          created_by: string
          description: string | null
          end_time: string | null
          group_id: string
          id: string
          max_participants: number | null
          post_id: string | null
          result: Json | null
          result_notes: string | null
          start_time: string
          status: Database["public"]["Enums"]["group_deal_status"]
          title: string
          total_pool: number | null
          updated_at: string
          winner_reward: number | null
        }
        Insert: {
          conditions?: Json | null
          created_at?: string
          created_by: string
          description?: string | null
          end_time?: string | null
          group_id: string
          id?: string
          max_participants?: number | null
          post_id?: string | null
          result?: Json | null
          result_notes?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["group_deal_status"]
          title: string
          total_pool?: number | null
          updated_at?: string
          winner_reward?: number | null
        }
        Update: {
          conditions?: Json | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string | null
          group_id?: string
          id?: string
          max_participants?: number | null
          post_id?: string | null
          result?: Json | null
          result_notes?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["group_deal_status"]
          title?: string
          total_pool?: number | null
          updated_at?: string
          winner_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "group_deals_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_deals_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      group_invitations: {
        Row: {
          created_at: string
          expires_at: string | null
          group_id: string
          id: string
          invite_code: string | null
          invited_by: string
          invited_user_id: string | null
          max_uses: number | null
          used_count: number | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          group_id: string
          id?: string
          invite_code?: string | null
          invited_by: string
          invited_user_id?: string | null
          max_uses?: number | null
          used_count?: number | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          group_id?: string
          id?: string
          invite_code?: string | null
          invited_by?: string
          invited_user_id?: string | null
          max_uses?: number | null
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "group_invitations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_join_requests: {
        Row: {
          created_at: string
          group_id: string
          id: string
          message: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          message?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          message?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_join_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_last_views: {
        Row: {
          created_at: string
          group_id: string
          id: string
          last_viewed_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          last_viewed_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          last_viewed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_last_views_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_member_badges: {
        Row: {
          assigned_at: string
          assigned_by: string
          badge_id: string
          group_id: string
          id: string
          member_id: string
          note: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          badge_id: string
          group_id: string
          id?: string
          member_id: string
          note?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          badge_id?: string
          group_id?: string
          id?: string
          member_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_member_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "group_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_member_badges_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_member_badges_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
        ]
      }
      group_member_custom_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          custom_role_id: string
          expires_at: string | null
          group_id: string
          id: string
          member_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          custom_role_id: string
          expires_at?: string | null
          group_id: string
          id?: string
          member_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          custom_role_id?: string
          expires_at?: string | null
          group_id?: string
          id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_member_custom_roles_custom_role_id_fkey"
            columns: ["custom_role_id"]
            isOneToOne: false
            referencedRelation: "group_custom_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_member_custom_roles_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_member_custom_roles_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
        ]
      }
      group_member_violations: {
        Row: {
          action_taken: string | null
          created_at: string
          description: string | null
          group_id: string
          id: string
          reported_by: string | null
          user_id: string
          violation_type: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          description?: string | null
          group_id: string
          id?: string
          reported_by?: string | null
          user_id: string
          violation_type: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          description?: string | null
          group_id?: string
          id?: string
          reported_by?: string | null
          user_id?: string
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_member_violations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          contribution_points: number | null
          custom_permissions: Json | null
          group_id: string
          id: string
          is_active: boolean | null
          is_shadow_banned: boolean | null
          joined_at: string
          label: string | null
          muted_until: string | null
          paid_until: string | null
          role: Database["public"]["Enums"]["group_member_role"]
          role_expires_at: string | null
          shadow_banned_at: string | null
          shadow_banned_by: string | null
          updated_at: string
          user_id: string
          warning_count: number | null
        }
        Insert: {
          contribution_points?: number | null
          custom_permissions?: Json | null
          group_id: string
          id?: string
          is_active?: boolean | null
          is_shadow_banned?: boolean | null
          joined_at?: string
          label?: string | null
          muted_until?: string | null
          paid_until?: string | null
          role?: Database["public"]["Enums"]["group_member_role"]
          role_expires_at?: string | null
          shadow_banned_at?: string | null
          shadow_banned_by?: string | null
          updated_at?: string
          user_id: string
          warning_count?: number | null
        }
        Update: {
          contribution_points?: number | null
          custom_permissions?: Json | null
          group_id?: string
          id?: string
          is_active?: boolean | null
          is_shadow_banned?: boolean | null
          joined_at?: string
          label?: string | null
          muted_until?: string | null
          paid_until?: string | null
          role?: Database["public"]["Enums"]["group_member_role"]
          role_expires_at?: string | null
          shadow_banned_at?: string | null
          shadow_banned_by?: string | null
          updated_at?: string
          user_id?: string
          warning_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_anonymous: boolean | null
          like_count: number | null
          media_urls: string[] | null
          parent_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          like_count?: number | null
          media_urls?: string[] | null
          parent_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          like_count?: number | null
          media_urls?: string[] | null
          parent_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "group_post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      group_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts: {
        Row: {
          author_id: string
          comment_count: number | null
          content: string
          created_at: string
          group_id: string
          id: string
          is_anonymous: boolean | null
          is_hidden: boolean | null
          is_locked: boolean | null
          is_pinned: boolean | null
          like_count: number | null
          media_urls: string[] | null
          post_type: Database["public"]["Enums"]["group_post_type"]
          title: string | null
          type_data: Json | null
          updated_at: string
        }
        Insert: {
          author_id: string
          comment_count?: number | null
          content: string
          created_at?: string
          group_id: string
          id?: string
          is_anonymous?: boolean | null
          is_hidden?: boolean | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          like_count?: number | null
          media_urls?: string[] | null
          post_type?: Database["public"]["Enums"]["group_post_type"]
          title?: string | null
          type_data?: Json | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          comment_count?: number | null
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          is_anonymous?: boolean | null
          is_hidden?: boolean | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          like_count?: number | null
          media_urls?: string[] | null
          post_type?: Database["public"]["Enums"]["group_post_type"]
          title?: string | null
          type_data?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_proofs: {
        Row: {
          captured_at: string
          created_at: string
          description: string | null
          group_id: string
          hash: string | null
          id: string
          ip_address: string | null
          media_urls: string[] | null
          reference_id: string | null
          reference_type: string
          submitted_by: string
        }
        Insert: {
          captured_at?: string
          created_at?: string
          description?: string | null
          group_id: string
          hash?: string | null
          id?: string
          ip_address?: string | null
          media_urls?: string[] | null
          reference_id?: string | null
          reference_type: string
          submitted_by: string
        }
        Update: {
          captured_at?: string
          created_at?: string
          description?: string | null
          group_id?: string
          hash?: string | null
          id?: string
          ip_address?: string | null
          media_urls?: string[] | null
          reference_id?: string | null
          reference_type?: string
          submitted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_proofs_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_role_permissions: {
        Row: {
          can_comment: boolean | null
          can_create_deal: boolean | null
          can_create_poll: boolean | null
          can_create_task: boolean | null
          can_invite: boolean | null
          can_manage_members: boolean | null
          can_manage_posts: boolean | null
          can_manage_rules: boolean | null
          can_manage_wallet: boolean | null
          can_post: boolean | null
          can_view_insights: boolean | null
          created_at: string
          group_id: string
          id: string
          role: Database["public"]["Enums"]["group_member_role"]
          updated_at: string
        }
        Insert: {
          can_comment?: boolean | null
          can_create_deal?: boolean | null
          can_create_poll?: boolean | null
          can_create_task?: boolean | null
          can_invite?: boolean | null
          can_manage_members?: boolean | null
          can_manage_posts?: boolean | null
          can_manage_rules?: boolean | null
          can_manage_wallet?: boolean | null
          can_post?: boolean | null
          can_view_insights?: boolean | null
          created_at?: string
          group_id: string
          id?: string
          role: Database["public"]["Enums"]["group_member_role"]
          updated_at?: string
        }
        Update: {
          can_comment?: boolean | null
          can_create_deal?: boolean | null
          can_create_poll?: boolean | null
          can_create_task?: boolean | null
          can_invite?: boolean | null
          can_manage_members?: boolean | null
          can_manage_posts?: boolean | null
          can_manage_rules?: boolean | null
          can_manage_wallet?: boolean | null
          can_post?: boolean | null
          can_view_insights?: boolean | null
          created_at?: string
          group_id?: string
          id?: string
          role?: Database["public"]["Enums"]["group_member_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_role_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_role_purchases: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          custom_role_id: string | null
          expires_at: string | null
          group_id: string
          id: string
          payment_method: string | null
          role_type: string
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          custom_role_id?: string | null
          expires_at?: string | null
          group_id: string
          id?: string
          payment_method?: string | null
          role_type: string
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          custom_role_id?: string | null
          expires_at?: string | null
          group_id?: string
          id?: string
          payment_method?: string | null
          role_type?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_role_purchases_custom_role_id_fkey"
            columns: ["custom_role_id"]
            isOneToOne: false
            referencedRelation: "group_custom_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_role_purchases_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_rule_actions: {
        Row: {
          action_taken: string
          created_at: string
          details: Json | null
          group_id: string
          id: string
          rule_type: string
          target_post_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action_taken: string
          created_at?: string
          details?: Json | null
          group_id: string
          id?: string
          rule_type: string
          target_post_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_taken?: string
          created_at?: string
          details?: Json | null
          group_id?: string
          id?: string
          rule_type?: string
          target_post_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_rule_actions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_seller_products: {
        Row: {
          created_at: string
          description: string | null
          group_id: string
          id: string
          images: string[] | null
          is_active: boolean | null
          name: string
          price: number
          rating: number | null
          review_count: number | null
          seller_id: string
          sold_count: number | null
          updated_at: string
          view_count: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          group_id: string
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          name: string
          price: number
          rating?: number | null
          review_count?: number | null
          seller_id: string
          sold_count?: number | null
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          group_id?: string
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          name?: string
          price?: number
          rating?: number | null
          review_count?: number | null
          seller_id?: string
          sold_count?: number | null
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "group_seller_products_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_seller_reviews: {
        Row: {
          buyer_id: string
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
        }
        Insert: {
          buyer_id: string
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
        }
        Update: {
          buyer_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "group_seller_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "group_seller_products"
            referencedColumns: ["id"]
          },
        ]
      }
      group_tasks: {
        Row: {
          assigned_to: string[] | null
          attachments: Json | null
          completed_at: string | null
          created_at: string
          created_by: string
          deadline: string | null
          description: string | null
          group_id: string
          id: string
          penalty_amount: number | null
          penalty_points: number | null
          post_id: string | null
          priority: number | null
          proof_required: boolean | null
          reward_amount: number | null
          reward_points: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["group_task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string[] | null
          attachments?: Json | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          deadline?: string | null
          description?: string | null
          group_id: string
          id?: string
          penalty_amount?: number | null
          penalty_points?: number | null
          post_id?: string | null
          priority?: number | null
          proof_required?: boolean | null
          reward_amount?: number | null
          reward_points?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["group_task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string[] | null
          attachments?: Json | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string | null
          group_id?: string
          id?: string
          penalty_amount?: number | null
          penalty_points?: number | null
          post_id?: string | null
          priority?: number | null
          proof_required?: boolean | null
          reward_amount?: number | null
          reward_points?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["group_task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_tasks_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_tasks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      group_wallet_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          category: string
          created_at: string
          description: string | null
          group_id: string
          id: string
          reference_id: string | null
          reference_type: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          balance_after?: number | null
          category: string
          created_at?: string
          description?: string | null
          group_id: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number | null
          category?: string
          created_at?: string
          description?: string | null
          group_id?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_wallet_transactions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_wallets: {
        Row: {
          balance: number
          created_at: string
          group_id: string
          id: string
          total_expense: number | null
          total_income: number | null
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          group_id: string
          id?: string
          total_expense?: number | null
          total_income?: number | null
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          group_id?: string
          id?: string
          total_expense?: number | null
          total_income?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_wallets_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: true
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          category: string | null
          chat_room_id: string | null
          cover_url: string | null
          created_at: string
          deal_commission_percent: number | null
          description: string | null
          entry_fee: number | null
          id: string
          join_code: string | null
          join_type: Database["public"]["Enums"]["group_join_type"]
          member_count: number | null
          min_level_to_join: number | null
          min_reputation_to_join: number | null
          monthly_fee: number | null
          name: string
          owner_id: string
          post_count: number | null
          rules: Json | null
          seller_role_price: number | null
          settings: Json | null
          slug: string
          tags: string[] | null
          updated_at: string
          vip_role_price: number | null
          visibility: Database["public"]["Enums"]["group_visibility"]
        }
        Insert: {
          avatar_url?: string | null
          category?: string | null
          chat_room_id?: string | null
          cover_url?: string | null
          created_at?: string
          deal_commission_percent?: number | null
          description?: string | null
          entry_fee?: number | null
          id?: string
          join_code?: string | null
          join_type?: Database["public"]["Enums"]["group_join_type"]
          member_count?: number | null
          min_level_to_join?: number | null
          min_reputation_to_join?: number | null
          monthly_fee?: number | null
          name: string
          owner_id: string
          post_count?: number | null
          rules?: Json | null
          seller_role_price?: number | null
          settings?: Json | null
          slug: string
          tags?: string[] | null
          updated_at?: string
          vip_role_price?: number | null
          visibility?: Database["public"]["Enums"]["group_visibility"]
        }
        Update: {
          avatar_url?: string | null
          category?: string | null
          chat_room_id?: string | null
          cover_url?: string | null
          created_at?: string
          deal_commission_percent?: number | null
          description?: string | null
          entry_fee?: number | null
          id?: string
          join_code?: string | null
          join_type?: Database["public"]["Enums"]["group_join_type"]
          member_count?: number | null
          min_level_to_join?: number | null
          min_reputation_to_join?: number | null
          monthly_fee?: number | null
          name?: string
          owner_id?: string
          post_count?: number | null
          rules?: Json | null
          seller_role_price?: number | null
          settings?: Json | null
          slug?: string
          tags?: string[] | null
          updated_at?: string
          vip_role_price?: number | null
          visibility?: Database["public"]["Enums"]["group_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "groups_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      handover_audit_logs: {
        Row: {
          action: string
          actor_id: string
          actor_type: string
          created_at: string
          handover_id: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
        }
        Insert: {
          action: string
          actor_id: string
          actor_type: string
          created_at?: string
          handover_id: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string
          actor_type?: string
          created_at?: string
          handover_id?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "handover_audit_logs_handover_id_fkey"
            columns: ["handover_id"]
            isOneToOne: false
            referencedRelation: "account_handovers"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_banners: {
        Row: {
          button_link: string | null
          button_text: string | null
          button_text_en: string | null
          created_at: string
          description: string | null
          description_en: string | null
          id: string
          image_url: string
          is_active: boolean | null
          sort_order: number | null
          subtitle: string | null
          subtitle_en: string | null
          title: string | null
          title_en: string | null
          updated_at: string
        }
        Insert: {
          button_link?: string | null
          button_text?: string | null
          button_text_en?: string | null
          created_at?: string
          description?: string | null
          description_en?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          sort_order?: number | null
          subtitle?: string | null
          subtitle_en?: string | null
          title?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          button_link?: string | null
          button_text?: string | null
          button_text_en?: string | null
          created_at?: string
          description?: string | null
          description_en?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          sort_order?: number | null
          subtitle?: string | null
          subtitle_en?: string | null
          title?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      hidden_posts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          post_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          post_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          post_type?: string
          user_id?: string
        }
        Relationships: []
      }
      hidden_users: {
        Row: {
          created_at: string
          hidden_until: string | null
          hidden_user_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hidden_until?: string | null
          hidden_user_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hidden_until?: string | null
          hidden_user_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_read: boolean | null
          is_resolved: boolean | null
          message: string
          product_id: string | null
          seller_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          message: string
          product_id?: string | null
          seller_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          message?: string
          product_id?: string | null
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "seller_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_alerts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_alerts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_groups: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          seller_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          seller_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_groups_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_groups_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      item_shop_purchases: {
        Row: {
          created_at: string
          gift_recipient_id: string | null
          gift_recipient_name: string | null
          id: string
          is_gift: boolean | null
          item_id: string
          item_name: string
          item_type: string
          price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          gift_recipient_id?: string | null
          gift_recipient_name?: string | null
          id?: string
          is_gift?: boolean | null
          item_id: string
          item_name: string
          item_type: string
          price?: number
          user_id: string
        }
        Update: {
          created_at?: string
          gift_recipient_id?: string | null
          gift_recipient_name?: string | null
          id?: string
          is_gift?: boolean | null
          item_id?: string
          item_name?: string
          item_type?: string
          price?: number
          user_id?: string
        }
        Relationships: []
      }
      login_history: {
        Row: {
          browser: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          is_suspicious: boolean | null
          location: string | null
          login_at: string
          os: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          is_suspicious?: boolean | null
          location?: string | null
          login_at?: string
          os?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          is_suspicious?: boolean | null
          location?: string | null
          login_at?: string
          os?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      marketplace_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      marketplace_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      money_split_participants: {
        Row: {
          calculated_amount: number | null
          created_at: string
          fixed_amount: number | null
          id: string
          name: string
          notes: string | null
          percentage: number | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          calculated_amount?: number | null
          created_at?: string
          fixed_amount?: number | null
          id?: string
          name: string
          notes?: string | null
          percentage?: number | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          calculated_amount?: number | null
          created_at?: string
          fixed_amount?: number | null
          id?: string
          name?: string
          notes?: string | null
          percentage?: number | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "money_split_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "money_split_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      money_split_sessions: {
        Row: {
          created_at: string
          currency: string
          id: string
          intermediary_fee_amount: number | null
          intermediary_fee_percent: number | null
          is_locked: boolean | null
          notes: string | null
          platform_fee_amount: number | null
          platform_fee_percent: number | null
          profit_loss: number | null
          share_token: string | null
          split_type: string
          title: string
          total_amount: number
          total_expense: number | null
          total_income: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          intermediary_fee_amount?: number | null
          intermediary_fee_percent?: number | null
          is_locked?: boolean | null
          notes?: string | null
          platform_fee_amount?: number | null
          platform_fee_percent?: number | null
          profit_loss?: number | null
          share_token?: string | null
          split_type?: string
          title?: string
          total_amount: number
          total_expense?: number | null
          total_income?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          intermediary_fee_amount?: number | null
          intermediary_fee_percent?: number | null
          is_locked?: boolean | null
          notes?: string | null
          platform_fee_amount?: number | null
          platform_fee_percent?: number | null
          profit_loss?: number | null
          share_token?: string | null
          split_type?: string
          title?: string
          total_amount?: number
          total_expense?: number | null
          total_income?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      name_colors: {
        Row: {
          color_value: string
          created_at: string
          gradient_value: string | null
          id: string
          is_active: boolean | null
          is_gradient: boolean | null
          name: string
          name_en: string | null
          price: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color_value: string
          created_at?: string
          gradient_value?: string | null
          id?: string
          is_active?: boolean | null
          is_gradient?: boolean | null
          name: string
          name_en?: string | null
          price?: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color_value?: string
          created_at?: string
          gradient_value?: string | null
          id?: string
          is_active?: boolean | null
          is_gradient?: boolean | null
          name?: string
          name_en?: string | null
          price?: number
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          author: string | null
          content: string | null
          content_en: string | null
          created_at: string
          excerpt: string | null
          excerpt_en: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          slug: string
          sort_order: number | null
          title: string
          title_en: string | null
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author?: string | null
          content?: string | null
          content_en?: string | null
          created_at?: string
          excerpt?: string | null
          excerpt_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          slug: string
          sort_order?: number | null
          title: string
          title_en?: string | null
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author?: string | null
          content?: string | null
          content_en?: string | null
          created_at?: string
          excerpt?: string | null
          excerpt_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          slug?: string
          sort_order?: number | null
          title?: string
          title_en?: string | null
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      note_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          note_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          note_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          note_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_reactions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "user_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_status: string
          note: string | null
          old_status: string | null
          order_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status: string
          note?: string | null
          old_status?: string | null
          order_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status?: string
          note?: string | null
          old_status?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string | null
          customer_phone: string | null
          delivery_content: string | null
          discount_amount: number
          id: string
          notes: string | null
          order_number: string
          product_snapshot: Json
          referral_code: string | null
          status: string
          subtotal: number
          total_amount: number
          updated_at: string
          voucher_code: string | null
          voucher_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_content?: string | null
          discount_amount?: number
          id?: string
          notes?: string | null
          order_number: string
          product_snapshot: Json
          referral_code?: string | null
          status?: string
          subtotal: number
          total_amount: number
          updated_at?: string
          voucher_code?: string | null
          voucher_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_content?: string | null
          discount_amount?: number
          id?: string
          notes?: string | null
          order_number?: string
          product_snapshot?: Json
          referral_code?: string | null
          status?: string
          subtotal?: number
          total_amount?: number
          updated_at?: string
          voucher_code?: string | null
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      p2p_transfers: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          id: string
          message: string | null
          recipient_id: string
          sender_id: string
          status: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          id?: string
          message?: string | null
          recipient_id: string
          sender_id: string
          status?: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          message?: string | null
          recipient_id?: string
          sender_id?: string
          status?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link: string | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link?: string | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string
          payment_data: Json | null
          payment_id: string | null
          payment_provider: string
          payment_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          order_id: string
          payment_data?: Json | null
          payment_id?: string | null
          payment_provider?: string
          payment_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string
          payment_data?: Json | null
          payment_id?: string | null
          payment_provider?: string
          payment_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      point_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          source: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          source: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          source?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      points_redemptions: {
        Row: {
          created_at: string
          id: string
          points_spent: number
          reward_id: string
          status: string | null
          user_id: string
          voucher_code: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          points_spent: number
          reward_id: string
          status?: string | null
          user_id: string
          voucher_code?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          points_spent?: number
          reward_id?: string
          status?: string | null
          user_id?: string
          voucher_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "points_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "points_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      points_rewards: {
        Row: {
          created_at: string
          description: string | null
          description_en: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          name_en: string | null
          points_cost: number
          quantity_limit: number | null
          quantity_redeemed: number | null
          reward_type: string
          reward_value: number | null
          sort_order: number | null
          updated_at: string
          voucher_discount_percent: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          name_en?: string | null
          points_cost: number
          quantity_limit?: number | null
          quantity_redeemed?: number | null
          reward_type?: string
          reward_value?: number | null
          sort_order?: number | null
          updated_at?: string
          voucher_discount_percent?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          points_cost?: number
          quantity_limit?: number | null
          quantity_redeemed?: number | null
          reward_type?: string
          reward_value?: number | null
          sort_order?: number | null
          updated_at?: string
          voucher_discount_percent?: number | null
        }
        Relationships: []
      }
      policy_acceptances: {
        Row: {
          accepted_at: string
          buyer_id: string
          id: string
          ip_address: string | null
          order_id: string | null
          policy_id: string
          policy_version_hash: string | null
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string
          buyer_id: string
          id?: string
          ip_address?: string | null
          order_id?: string | null
          policy_id: string
          policy_version_hash?: string | null
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string
          buyer_id?: string
          id?: string
          ip_address?: string | null
          order_id?: string | null
          policy_id?: string
          policy_version_hash?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_acceptances_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "seller_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_acceptances_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "shop_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      popular_searches: {
        Row: {
          id: string
          last_searched_at: string
          query: string
          search_count: number
        }
        Insert: {
          id?: string
          last_searched_at?: string
          query: string
          search_count?: number
        }
        Update: {
          id?: string
          last_searched_at?: string
          query?: string
          search_count?: number
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes_count: number
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "user_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "user_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          post_id: string
          post_type: string
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          post_id: string
          post_type: string
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          post_id?: string
          post_type?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: []
      }
      prime_boost_benefits: {
        Row: {
          benefit_key: string
          benefit_name: string
          benefit_name_en: string | null
          benefit_value: string | null
          created_at: string
          id: string
          is_enabled: boolean | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          benefit_key: string
          benefit_name: string
          benefit_name_en?: string | null
          benefit_value?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          benefit_key?: string
          benefit_name?: string
          benefit_name_en?: string | null
          benefit_value?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      prime_boost_plans: {
        Row: {
          created_at: string
          discount_percent: number | null
          duration_days: number
          id: string
          is_active: boolean | null
          name: string
          name_en: string | null
          plan_type: string
          points_multiplier: number | null
          price: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_percent?: number | null
          duration_days?: number
          id?: string
          is_active?: boolean | null
          name: string
          name_en?: string | null
          plan_type?: string
          points_multiplier?: number | null
          price?: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_percent?: number | null
          duration_days?: number
          id?: string
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          plan_type?: string
          points_multiplier?: number | null
          price?: number
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      prime_boost_subscriptions: {
        Row: {
          amount_paid: number
          created_at: string
          expires_at: string
          id: string
          is_active: boolean | null
          plan_id: string | null
          purchased_at: string
          starts_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean | null
          plan_id?: string | null
          purchased_at?: string
          starts_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean | null
          plan_id?: string | null
          purchased_at?: string
          starts_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prime_boost_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "prime_boost_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      prime_effects: {
        Row: {
          created_at: string
          effect_config: Json | null
          effect_type: string
          id: string
          is_active: boolean | null
          name: string
          name_en: string | null
          price: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          effect_config?: Json | null
          effect_type: string
          id?: string
          is_active?: boolean | null
          name: string
          name_en?: string | null
          price?: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          effect_config?: Json | null
          effect_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          price?: number
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      product_boosts: {
        Row: {
          boost_type: string
          cost_per_day: number
          created_at: string
          end_date: string
          id: string
          product_id: string
          seller_id: string
          start_date: string
          status: string
          total_cost: number
          updated_at: string
        }
        Insert: {
          boost_type: string
          cost_per_day?: number
          created_at?: string
          end_date: string
          id?: string
          product_id: string
          seller_id: string
          start_date?: string
          status?: string
          total_cost?: number
          updated_at?: string
        }
        Update: {
          boost_type?: string
          cost_per_day?: number
          created_at?: string
          end_date?: string
          id?: string
          product_id?: string
          seller_id?: string
          start_date?: string
          status?: string
          total_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_boosts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "seller_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_boosts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_boosts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      product_bundle_items: {
        Row: {
          bundle_id: string
          created_at: string
          id: string
          package_id: string | null
          product_id: string
          quantity: number
          sort_order: number
        }
        Insert: {
          bundle_id: string
          created_at?: string
          id?: string
          package_id?: string | null
          product_id: string
          quantity?: number
          sort_order?: number
        }
        Update: {
          bundle_id?: string
          created_at?: string
          id?: string
          package_id?: string | null
          product_id?: string
          quantity?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "product_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_bundle_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "product_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_bundle_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_bundles: {
        Row: {
          created_at: string
          description: string | null
          description_en: string | null
          discount_amount: number
          discount_percent: number
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          name_en: string | null
          sort_order: number
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_en?: string | null
          discount_amount?: number
          discount_percent?: number
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          name_en?: string | null
          sort_order?: number
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_en?: string | null
          discount_amount?: number
          discount_percent?: number
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          name_en?: string | null
          sort_order?: number
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_clicks: {
        Row: {
          click_type: string
          clicked_at: string
          id: string
          product_id: string
          user_id: string | null
        }
        Insert: {
          click_type: string
          clicked_at?: string
          id?: string
          product_id: string
          user_id?: string | null
        }
        Update: {
          click_type?: string
          clicked_at?: string
          id?: string
          product_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_clicks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "seller_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_custom_fields: {
        Row: {
          created_at: string
          field_name: string
          field_type: string
          id: string
          is_required: boolean
          placeholder: string | null
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          field_name: string
          field_type?: string
          id?: string
          is_required?: boolean
          placeholder?: string | null
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          field_name?: string
          field_type?: string
          id?: string
          is_required?: boolean
          placeholder?: string | null
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_custom_fields_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_primary: boolean
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_inventory_data: {
        Row: {
          cost_price: number | null
          created_at: string
          group_id: string | null
          id: string
          internal_notes: string | null
          is_outdated: boolean | null
          last_price_update: string | null
          outdated_reason: string | null
          product_id: string
          profit: number | null
          source: string | null
          updated_at: string
        }
        Insert: {
          cost_price?: number | null
          created_at?: string
          group_id?: string | null
          id?: string
          internal_notes?: string | null
          is_outdated?: boolean | null
          last_price_update?: string | null
          outdated_reason?: string | null
          product_id: string
          profit?: number | null
          source?: string | null
          updated_at?: string
        }
        Update: {
          cost_price?: number | null
          created_at?: string
          group_id?: string | null
          id?: string
          internal_notes?: string | null
          is_outdated?: boolean | null
          last_price_update?: string | null
          outdated_reason?: string | null
          product_id?: string
          profit?: number | null
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_inventory_data_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "inventory_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_inventory_data_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "seller_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_packages: {
        Row: {
          created_at: string
          description: string | null
          external_product_id: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_in_stock: boolean
          name: string
          original_price: number | null
          price: number
          product_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          external_product_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_in_stock?: boolean
          name: string
          original_price?: number | null
          price: number
          product_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          external_product_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_in_stock?: boolean
          name?: string
          original_price?: number | null
          price?: number
          product_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_packages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_views: {
        Row: {
          device_type: string | null
          duration_seconds: number | null
          id: string
          product_id: string
          session_id: string | null
          source: string | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          product_id: string
          session_id?: string | null
          source?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          product_id?: string
          session_id?: string | null
          source?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_views_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "seller_products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          account_info: Json | null
          category_id: string | null
          created_at: string
          description: string | null
          description_en: string | null
          external_api: string | null
          external_category_id: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          name: string
          name_en: string | null
          price: number | null
          short_description: string | null
          short_description_en: string | null
          slug: string
          sort_order: number
          style: string
          tags: string[] | null
          updated_at: string
          usage_guide: string | null
          usage_guide_en: string | null
          warranty_info: string | null
          warranty_info_en: string | null
        }
        Insert: {
          account_info?: Json | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          description_en?: string | null
          external_api?: string | null
          external_category_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          name: string
          name_en?: string | null
          price?: number | null
          short_description?: string | null
          short_description_en?: string | null
          slug: string
          sort_order?: number
          style?: string
          tags?: string[] | null
          updated_at?: string
          usage_guide?: string | null
          usage_guide_en?: string | null
          warranty_info?: string | null
          warranty_info_en?: string | null
        }
        Update: {
          account_info?: Json | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          description_en?: string | null
          external_api?: string | null
          external_category_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          name?: string
          name_en?: string | null
          price?: number | null
          short_description?: string | null
          short_description_en?: string | null
          slug?: string
          sort_order?: number
          style?: string
          tags?: string[] | null
          updated_at?: string
          usage_guide?: string | null
          usage_guide_en?: string | null
          warranty_info?: string | null
          warranty_info_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_effect_id: string | null
          active_name_color_id: string | null
          avatar_description: string | null
          avatar_expires_at: string | null
          avatar_frame_id: string | null
          avatar_updated_at: string | null
          avatar_url: string | null
          balance: number
          ban_reason: string | null
          banned_at: string | null
          banner_url: string | null
          bio: string | null
          birthday: string | null
          birthday_voucher_sent_year: number | null
          created_at: string
          email: string
          friend_request_followers_only: boolean | null
          full_name: string | null
          has_prime_boost: boolean | null
          id: string
          is_banned: boolean | null
          is_online: boolean | null
          is_verified: boolean | null
          last_login_ip: string | null
          last_seen: string | null
          location: string | null
          login_notification_enabled: boolean | null
          message_friends_only: boolean | null
          nickname: string | null
          phone: string | null
          prime_expires_at: string | null
          prime_plan_type: string | null
          relationship_status: string | null
          school: string | null
          total_spent: number
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          updated_at: string
          user_id: string
          username: string | null
          vip_level_id: string | null
          website: string | null
          workplace: string | null
        }
        Insert: {
          active_effect_id?: string | null
          active_name_color_id?: string | null
          avatar_description?: string | null
          avatar_expires_at?: string | null
          avatar_frame_id?: string | null
          avatar_updated_at?: string | null
          avatar_url?: string | null
          balance?: number
          ban_reason?: string | null
          banned_at?: string | null
          banner_url?: string | null
          bio?: string | null
          birthday?: string | null
          birthday_voucher_sent_year?: number | null
          created_at?: string
          email: string
          friend_request_followers_only?: boolean | null
          full_name?: string | null
          has_prime_boost?: boolean | null
          id?: string
          is_banned?: boolean | null
          is_online?: boolean | null
          is_verified?: boolean | null
          last_login_ip?: string | null
          last_seen?: string | null
          location?: string | null
          login_notification_enabled?: boolean | null
          message_friends_only?: boolean | null
          nickname?: string | null
          phone?: string | null
          prime_expires_at?: string | null
          prime_plan_type?: string | null
          relationship_status?: string | null
          school?: string | null
          total_spent?: number
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          vip_level_id?: string | null
          website?: string | null
          workplace?: string | null
        }
        Update: {
          active_effect_id?: string | null
          active_name_color_id?: string | null
          avatar_description?: string | null
          avatar_expires_at?: string | null
          avatar_frame_id?: string | null
          avatar_updated_at?: string | null
          avatar_url?: string | null
          balance?: number
          ban_reason?: string | null
          banned_at?: string | null
          banner_url?: string | null
          bio?: string | null
          birthday?: string | null
          birthday_voucher_sent_year?: number | null
          created_at?: string
          email?: string
          friend_request_followers_only?: boolean | null
          full_name?: string | null
          has_prime_boost?: boolean | null
          id?: string
          is_banned?: boolean | null
          is_online?: boolean | null
          is_verified?: boolean | null
          last_login_ip?: string | null
          last_seen?: string | null
          location?: string | null
          login_notification_enabled?: boolean | null
          message_friends_only?: boolean | null
          nickname?: string | null
          phone?: string | null
          prime_expires_at?: string | null
          prime_plan_type?: string | null
          relationship_status?: string | null
          school?: string | null
          total_spent?: number
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          vip_level_id?: string | null
          website?: string | null
          workplace?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_effect_id_fkey"
            columns: ["active_effect_id"]
            isOneToOne: false
            referencedRelation: "prime_effects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_active_name_color_id_fkey"
            columns: ["active_name_color_id"]
            isOneToOne: false
            referencedRelation: "name_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_avatar_frame_id_fkey"
            columns: ["avatar_frame_id"]
            isOneToOne: false
            referencedRelation: "avatar_frames"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_vip_level_id_fkey"
            columns: ["vip_level_id"]
            isOneToOne: false
            referencedRelation: "vip_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          available_credits: number
          code: string
          commission_rate: number | null
          created_at: string
          email: string
          id: string
          lifetime_earnings: number | null
          tier: string | null
          total_credits: number
          total_referrals: number
          updated_at: string
        }
        Insert: {
          available_credits?: number
          code: string
          commission_rate?: number | null
          created_at?: string
          email: string
          id?: string
          lifetime_earnings?: number | null
          tier?: string | null
          total_credits?: number
          total_referrals?: number
          updated_at?: string
        }
        Update: {
          available_credits?: number
          code?: string
          commission_rate?: number | null
          created_at?: string
          email?: string
          id?: string
          lifetime_earnings?: number | null
          tier?: string | null
          total_credits?: number
          total_referrals?: number
          updated_at?: string
        }
        Relationships: []
      }
      referral_registrations: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          note: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          note?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          note?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      referral_transactions: {
        Row: {
          created_at: string
          credit_amount: number
          id: string
          order_id: string
          referral_code_id: string
          status: string
        }
        Insert: {
          created_at?: string
          credit_amount: number
          id?: string
          order_id: string
          referral_code_id: string
          status?: string
        }
        Update: {
          created_at?: string
          credit_amount?: number
          id?: string
          order_id?: string
          referral_code_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_transactions_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      review_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          review_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          review_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          review_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "review_images_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_images_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_images_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews_public"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          admin_reply: string | null
          admin_reply_at: string | null
          comment: string | null
          created_at: string
          id: string
          is_approved: boolean
          is_verified_purchase: boolean
          product_id: string
          rating: number
          updated_at: string
          user_email: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          admin_reply?: string | null
          admin_reply_at?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          is_verified_purchase?: boolean
          product_id: string
          rating: number
          updated_at?: string
          user_email: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          admin_reply?: string | null
          admin_reply_at?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          is_verified_purchase?: boolean
          product_id?: string
          rating?: number
          updated_at?: string
          user_email?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          referral_code_id: string
          status: string
          updated_at: string
          voucher_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          referral_code_id: string
          status?: string
          updated_at?: string
          voucher_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          referral_code_id?: string
          status?: string
          updated_at?: string
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reward_requests_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_requests_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          clicked_result_id: string | null
          created_at: string
          filters: Json | null
          id: string
          query: string
          results_count: number | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          clicked_result_id?: string | null
          created_at?: string
          filters?: Json | null
          id?: string
          query: string
          results_count?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_result_id?: string | null
          created_at?: string
          filters?: Json | null
          id?: string
          query?: string
          results_count?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      seller_analytics: {
        Row: {
          avg_view_duration: number | null
          chat_initiations: number | null
          created_at: string
          id: string
          seller_id: string
          stat_date: string
          top_clicked_price_ranges: Json | null
          top_viewed_products: string[] | null
          total_clicks: number | null
          total_views: number | null
          unique_viewers: number | null
          view_to_buy_rate: number | null
          wishlist_adds: number | null
          wishlist_removes: number | null
        }
        Insert: {
          avg_view_duration?: number | null
          chat_initiations?: number | null
          created_at?: string
          id?: string
          seller_id: string
          stat_date?: string
          top_clicked_price_ranges?: Json | null
          top_viewed_products?: string[] | null
          total_clicks?: number | null
          total_views?: number | null
          unique_viewers?: number | null
          view_to_buy_rate?: number | null
          wishlist_adds?: number | null
          wishlist_removes?: number | null
        }
        Update: {
          avg_view_duration?: number | null
          chat_initiations?: number | null
          created_at?: string
          id?: string
          seller_id?: string
          stat_date?: string
          top_clicked_price_ranges?: Json | null
          top_viewed_products?: string[] | null
          total_clicks?: number | null
          total_views?: number | null
          unique_viewers?: number | null
          view_to_buy_rate?: number | null
          wishlist_adds?: number | null
          wishlist_removes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_analytics_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_analytics_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_api_keys: {
        Row: {
          api_key: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          name: string
          permissions: Json | null
          seller_id: string
        }
        Insert: {
          api_key?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name: string
          permissions?: Json | null
          seller_id: string
        }
        Update: {
          api_key?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string
          permissions?: Json | null
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_api_keys_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_api_keys_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_badges: {
        Row: {
          badge_color: string | null
          benefits: Json | null
          code: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          name_en: string | null
          requirements: Json | null
          sort_order: number | null
        }
        Insert: {
          badge_color?: string | null
          benefits?: Json | null
          code: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_en?: string | null
          requirements?: Json | null
          sort_order?: number | null
        }
        Update: {
          badge_color?: string | null
          benefits?: Json | null
          code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_en?: string | null
          requirements?: Json | null
          sort_order?: number | null
        }
        Relationships: []
      }
      seller_buyer_blacklist: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          reason: string | null
          seller_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          reason?: string | null
          seller_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_buyer_blacklist_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_buyer_blacklist_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_combo_items: {
        Row: {
          combo_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          combo_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          combo_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_combo_items_combo_id_fkey"
            columns: ["combo_id"]
            isOneToOne: false
            referencedRelation: "seller_product_combos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_combo_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "seller_products"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_daily_stats: {
        Row: {
          created_at: string
          disputes_count: number
          id: string
          orders_count: number
          products_sold: number
          revenue: number
          seller_id: string
          stat_date: string
          views_count: number
        }
        Insert: {
          created_at?: string
          disputes_count?: number
          id?: string
          orders_count?: number
          products_sold?: number
          revenue?: number
          seller_id: string
          stat_date?: string
          views_count?: number
        }
        Update: {
          created_at?: string
          disputes_count?: number
          id?: string
          orders_count?: number
          products_sold?: number
          revenue?: number
          seller_id?: string
          stat_date?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "seller_daily_stats_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_daily_stats_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_earned_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          seller_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          seller_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_earned_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "seller_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_earned_badges_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_earned_badges_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_flash_sale_items: {
        Row: {
          created_at: string
          discount_percent: number | null
          flash_sale_id: string
          id: string
          product_id: string
          quantity_limit: number | null
          quantity_sold: number
        }
        Insert: {
          created_at?: string
          discount_percent?: number | null
          flash_sale_id: string
          id?: string
          product_id: string
          quantity_limit?: number | null
          quantity_sold?: number
        }
        Update: {
          created_at?: string
          discount_percent?: number | null
          flash_sale_id?: string
          id?: string
          product_id?: string
          quantity_limit?: number | null
          quantity_sold?: number
        }
        Relationships: [
          {
            foreignKeyName: "seller_flash_sale_items_flash_sale_id_fkey"
            columns: ["flash_sale_id"]
            isOneToOne: false
            referencedRelation: "seller_flash_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_flash_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "seller_products"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_flash_sales: {
        Row: {
          created_at: string
          description: string | null
          discount_percent: number
          end_time: string
          id: string
          is_active: boolean
          name: string
          seller_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percent?: number
          end_time: string
          id?: string
          is_active?: boolean
          name: string
          seller_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percent?: number
          end_time?: string
          id?: string
          is_active?: boolean
          name?: string
          seller_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_flash_sales_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_flash_sales_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_levels: {
        Row: {
          benefits: Json | null
          color: string | null
          commission_rate: number
          created_at: string
          icon: string | null
          id: string
          level: number
          min_revenue: number
          min_sales: number
          min_trust_score: number
          name: string
          name_en: string | null
        }
        Insert: {
          benefits?: Json | null
          color?: string | null
          commission_rate?: number
          created_at?: string
          icon?: string | null
          id?: string
          level: number
          min_revenue?: number
          min_sales?: number
          min_trust_score?: number
          name: string
          name_en?: string | null
        }
        Update: {
          benefits?: Json | null
          color?: string | null
          commission_rate?: number
          created_at?: string
          icon?: string | null
          id?: string
          level?: number
          min_revenue?: number
          min_sales?: number
          min_trust_score?: number
          name?: string
          name_en?: string | null
        }
        Relationships: []
      }
      seller_notification_settings: {
        Row: {
          created_at: string
          email_notifications: boolean
          id: string
          notify_chat: boolean
          notify_dispute: boolean
          notify_escrow_release: boolean
          notify_new_order: boolean
          notify_order_received: boolean
          notify_review: boolean
          seller_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          notify_chat?: boolean
          notify_dispute?: boolean
          notify_escrow_release?: boolean
          notify_new_order?: boolean
          notify_order_received?: boolean
          notify_review?: boolean
          seller_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          notify_chat?: boolean
          notify_dispute?: boolean
          notify_escrow_release?: boolean
          notify_new_order?: boolean
          notify_order_received?: boolean
          notify_review?: boolean
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_notification_settings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_notification_settings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_order_disputes: {
        Row: {
          attachments: string[] | null
          created_at: string
          id: string
          message: string
          order_id: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          attachments?: string[] | null
          created_at?: string
          id?: string
          message: string
          order_id: string
          sender_id: string
          sender_type: string
        }
        Update: {
          attachments?: string[] | null
          created_at?: string
          id?: string
          message?: string
          order_id?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_order_disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "seller_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_orders: {
        Row: {
          amount: number
          buyer_email: string
          buyer_id: string
          created_at: string
          delivery_content: string | null
          dispute_opened_at: string | null
          dispute_reason: string | null
          dispute_status: string | null
          escrow_release_at: string | null
          id: string
          notes: string | null
          order_number: string
          platform_fee: number | null
          product_id: string
          released_at: string | null
          seller_amount: number
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          buyer_email: string
          buyer_id: string
          created_at?: string
          delivery_content?: string | null
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          dispute_status?: string | null
          escrow_release_at?: string | null
          id?: string
          notes?: string | null
          order_number: string
          platform_fee?: number | null
          product_id: string
          released_at?: string | null
          seller_amount: number
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          buyer_email?: string
          buyer_id?: string
          created_at?: string
          delivery_content?: string | null
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          dispute_status?: string | null
          escrow_release_at?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          platform_fee?: number | null
          product_id?: string
          released_at?: string | null
          seller_amount?: number
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "seller_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_product_combos: {
        Row: {
          created_at: string
          description: string | null
          discount_percent: number
          id: string
          is_active: boolean
          name: string
          seller_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          name: string
          seller_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          name?: string
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_product_combos_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_product_combos_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_products: {
        Row: {
          account_data: string | null
          account_info: Json | null
          buyer_id: string | null
          category: string
          created_at: string
          description: string | null
          game_type: string | null
          id: string
          images: string[] | null
          is_featured: boolean | null
          order_id: string | null
          original_price: number | null
          price: number
          seller_id: string
          sold_at: string | null
          status: string
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          account_data?: string | null
          account_info?: Json | null
          buyer_id?: string | null
          category: string
          created_at?: string
          description?: string | null
          game_type?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          order_id?: string | null
          original_price?: number | null
          price: number
          seller_id: string
          sold_at?: string | null
          status?: string
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          account_data?: string | null
          account_info?: Json | null
          buyer_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          game_type?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          order_id?: string | null
          original_price?: number | null
          price?: number
          seller_id?: string
          sold_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          images: string[] | null
          product_id: string | null
          rating: number
          reviewer_avatar: string | null
          reviewer_id: string
          reviewer_name: string | null
          seller_id: string
          seller_reply: string | null
          seller_reply_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          product_id?: string | null
          rating: number
          reviewer_avatar?: string | null
          reviewer_id: string
          reviewer_name?: string | null
          seller_id: string
          seller_reply?: string | null
          seller_reply_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          product_id?: string | null
          rating?: number
          reviewer_avatar?: string | null
          reviewer_id?: string
          reviewer_name?: string | null
          seller_id?: string
          seller_reply?: string | null
          seller_reply_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "seller_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_reviews_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_reviews_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_risk_settings: {
        Row: {
          blacklisted_countries: string[] | null
          block_disputed_buyers: boolean | null
          block_new_buyers: boolean | null
          created_at: string
          delay_delivery_for_risky: boolean | null
          delay_minutes: number | null
          id: string
          max_concurrent_orders: number | null
          max_disputes_allowed: number | null
          min_buyer_completed_orders: number | null
          new_buyer_threshold_days: number | null
          require_email_verified: boolean | null
          require_phone_verified: boolean | null
          seller_id: string
          updated_at: string
        }
        Insert: {
          blacklisted_countries?: string[] | null
          block_disputed_buyers?: boolean | null
          block_new_buyers?: boolean | null
          created_at?: string
          delay_delivery_for_risky?: boolean | null
          delay_minutes?: number | null
          id?: string
          max_concurrent_orders?: number | null
          max_disputes_allowed?: number | null
          min_buyer_completed_orders?: number | null
          new_buyer_threshold_days?: number | null
          require_email_verified?: boolean | null
          require_phone_verified?: boolean | null
          seller_id: string
          updated_at?: string
        }
        Update: {
          blacklisted_countries?: string[] | null
          block_disputed_buyers?: boolean | null
          block_new_buyers?: boolean | null
          created_at?: string
          delay_delivery_for_risky?: boolean | null
          delay_minutes?: number | null
          id?: string
          max_concurrent_orders?: number | null
          max_disputes_allowed?: number | null
          min_buyer_completed_orders?: number | null
          new_buyer_threshold_days?: number | null
          require_email_verified?: boolean | null
          require_phone_verified?: boolean | null
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_risk_settings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_risk_settings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_suggestions: {
        Row: {
          applied_at: string | null
          confidence_score: number | null
          created_at: string
          id: string
          is_applied: boolean | null
          original_value: string | null
          product_id: string | null
          reason: string | null
          seller_id: string
          suggested_value: string | null
          suggestion_type: string
        }
        Insert: {
          applied_at?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          is_applied?: boolean | null
          original_value?: string | null
          product_id?: string | null
          reason?: string | null
          seller_id: string
          suggested_value?: string | null
          suggestion_type: string
        }
        Update: {
          applied_at?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          is_applied?: boolean | null
          original_value?: string | null
          product_id?: string | null
          reason?: string | null
          seller_id?: string
          suggested_value?: string | null
          suggestion_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_suggestions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "seller_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_suggestions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_suggestions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_ticket_messages: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          message: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          message: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "seller_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_tickets: {
        Row: {
          admin_joined: boolean | null
          admin_joined_at: string | null
          buyer_id: string | null
          buyer_resolved: boolean | null
          buyer_resolved_at: string | null
          created_at: string
          id: string
          order_id: string | null
          priority: string | null
          seller_id: string
          seller_resolved: boolean | null
          seller_resolved_at: string | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
        }
        Insert: {
          admin_joined?: boolean | null
          admin_joined_at?: string | null
          buyer_id?: string | null
          buyer_resolved?: boolean | null
          buyer_resolved_at?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          priority?: string | null
          seller_id: string
          seller_resolved?: boolean | null
          seller_resolved_at?: string | null
          status?: string
          subject: string
          ticket_number?: string
          updated_at?: string
        }
        Update: {
          admin_joined?: boolean | null
          admin_joined_at?: string | null
          buyer_id?: string | null
          buyer_resolved?: boolean | null
          buyer_resolved_at?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          priority?: string | null
          seller_id?: string
          seller_resolved?: boolean | null
          seller_resolved_at?: string | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "seller_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_tickets_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_tickets_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_vouchers: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          per_user_limit: number | null
          seller_id: string
          type: string
          updated_at: string
          used_count: number | null
          valid_from: string
          valid_to: string
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          per_user_limit?: number | null
          seller_id: string
          type?: string
          updated_at?: string
          used_count?: number | null
          valid_from?: string
          valid_to: string
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          per_user_limit?: number | null
          seller_id?: string
          type?: string
          updated_at?: string
          used_count?: number | null
          valid_from?: string
          valid_to?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "seller_vouchers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_vouchers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          id: string
          note: string | null
          reference_id: string | null
          reference_type: string | null
          seller_id: string
          status: string
          type: string
        }
        Insert: {
          amount: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          id?: string
          note?: string | null
          reference_id?: string | null
          reference_type?: string | null
          seller_id: string
          status?: string
          type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          id?: string
          note?: string | null
          reference_id?: string | null
          reference_type?: string | null
          seller_id?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_wallet_transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_wallet_transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_webhooks: {
        Row: {
          created_at: string
          events: string[]
          failure_count: number | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          secret: string | null
          seller_id: string
          url: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          secret?: string | null
          seller_id: string
          url: string
        }
        Update: {
          created_at?: string
          events?: string[]
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          secret?: string | null
          seller_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_webhooks_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_webhooks_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          admin_notes: string | null
          availability_reason: string | null
          availability_status: string | null
          availability_until: string | null
          balance: number | null
          completed_orders_count: number
          created_at: string
          current_active_orders: number | null
          design_avg_completion_days: number | null
          design_commercial_license_price: number | null
          design_completed_orders: number | null
          design_exclusive_license_price: number | null
          design_extra_revision_price: number | null
          design_is_featured: boolean | null
          design_last_online_at: string | null
          design_on_time_rate: number | null
          design_penalties_count: number | null
          design_rewards_count: number | null
          design_rush_delivery_fee: number | null
          design_total_orders: number | null
          design_total_revenue: number | null
          dispute_count: number
          facebook_url: string | null
          id: string
          is_partner: boolean | null
          is_verified: boolean | null
          locked_balance: number
          max_concurrent_orders: number | null
          pending_balance: number
          phone: string | null
          rating_average: number | null
          rating_count: number | null
          seller_level_id: string | null
          shop_avatar_url: string | null
          shop_banner_url: string | null
          shop_description: string | null
          shop_name: string
          shop_slug: string
          shop_type: string | null
          status: string
          total_revenue: number | null
          total_sales: number | null
          trust_score: number | null
          updated_at: string
          user_id: string
          verification_requested_at: string | null
          verified_at: string | null
          verified_by: string | null
          zalo_url: string | null
        }
        Insert: {
          admin_notes?: string | null
          availability_reason?: string | null
          availability_status?: string | null
          availability_until?: string | null
          balance?: number | null
          completed_orders_count?: number
          created_at?: string
          current_active_orders?: number | null
          design_avg_completion_days?: number | null
          design_commercial_license_price?: number | null
          design_completed_orders?: number | null
          design_exclusive_license_price?: number | null
          design_extra_revision_price?: number | null
          design_is_featured?: boolean | null
          design_last_online_at?: string | null
          design_on_time_rate?: number | null
          design_penalties_count?: number | null
          design_rewards_count?: number | null
          design_rush_delivery_fee?: number | null
          design_total_orders?: number | null
          design_total_revenue?: number | null
          dispute_count?: number
          facebook_url?: string | null
          id?: string
          is_partner?: boolean | null
          is_verified?: boolean | null
          locked_balance?: number
          max_concurrent_orders?: number | null
          pending_balance?: number
          phone?: string | null
          rating_average?: number | null
          rating_count?: number | null
          seller_level_id?: string | null
          shop_avatar_url?: string | null
          shop_banner_url?: string | null
          shop_description?: string | null
          shop_name: string
          shop_slug: string
          shop_type?: string | null
          status?: string
          total_revenue?: number | null
          total_sales?: number | null
          trust_score?: number | null
          updated_at?: string
          user_id: string
          verification_requested_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          zalo_url?: string | null
        }
        Update: {
          admin_notes?: string | null
          availability_reason?: string | null
          availability_status?: string | null
          availability_until?: string | null
          balance?: number | null
          completed_orders_count?: number
          created_at?: string
          current_active_orders?: number | null
          design_avg_completion_days?: number | null
          design_commercial_license_price?: number | null
          design_completed_orders?: number | null
          design_exclusive_license_price?: number | null
          design_extra_revision_price?: number | null
          design_is_featured?: boolean | null
          design_last_online_at?: string | null
          design_on_time_rate?: number | null
          design_penalties_count?: number | null
          design_rewards_count?: number | null
          design_rush_delivery_fee?: number | null
          design_total_orders?: number | null
          design_total_revenue?: number | null
          dispute_count?: number
          facebook_url?: string | null
          id?: string
          is_partner?: boolean | null
          is_verified?: boolean | null
          locked_balance?: number
          max_concurrent_orders?: number | null
          pending_balance?: number
          phone?: string | null
          rating_average?: number | null
          rating_count?: number | null
          seller_level_id?: string | null
          shop_avatar_url?: string | null
          shop_banner_url?: string | null
          shop_description?: string | null
          shop_name?: string
          shop_slug?: string
          shop_type?: string | null
          status?: string
          total_revenue?: number | null
          total_sales?: number | null
          trust_score?: number | null
          updated_at?: string
          user_id?: string
          verification_requested_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          zalo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellers_seller_level_id_fkey"
            columns: ["seller_level_id"]
            isOneToOne: false
            referencedRelation: "seller_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_branding: {
        Row: {
          background_color: string | null
          banner_type: string | null
          banner_url: string | null
          banner_video_url: string | null
          created_at: string
          custom_css: string | null
          font_family: string | null
          id: string
          layout_style: string | null
          primary_color: string | null
          qr_code_url: string | null
          secondary_color: string | null
          seller_id: string
          show_badges: boolean | null
          show_seller_avatar: boolean | null
          show_stats: boolean | null
          subdomain: string | null
          text_color: string | null
          theme_preset: string | null
          updated_at: string
        }
        Insert: {
          background_color?: string | null
          banner_type?: string | null
          banner_url?: string | null
          banner_video_url?: string | null
          created_at?: string
          custom_css?: string | null
          font_family?: string | null
          id?: string
          layout_style?: string | null
          primary_color?: string | null
          qr_code_url?: string | null
          secondary_color?: string | null
          seller_id: string
          show_badges?: boolean | null
          show_seller_avatar?: boolean | null
          show_stats?: boolean | null
          subdomain?: string | null
          text_color?: string | null
          theme_preset?: string | null
          updated_at?: string
        }
        Update: {
          background_color?: string | null
          banner_type?: string | null
          banner_url?: string | null
          banner_video_url?: string | null
          created_at?: string
          custom_css?: string | null
          font_family?: string | null
          id?: string
          layout_style?: string | null
          primary_color?: string | null
          qr_code_url?: string | null
          secondary_color?: string | null
          seller_id?: string
          show_badges?: boolean | null
          show_seller_avatar?: boolean | null
          show_stats?: boolean | null
          subdomain?: string | null
          text_color?: string | null
          theme_preset?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_branding_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_branding_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_policies: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          seller_id: string
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          seller_id: string
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          seller_id?: string
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_policies_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_policies_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      smm_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      smm_config: {
        Row: {
          api_domain: string
          api_key: string
          balance: number | null
          created_at: string
          currency: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          updated_at: string
        }
        Insert: {
          api_domain: string
          api_key: string
          balance?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          updated_at?: string
        }
        Update: {
          api_domain?: string
          api_key?: string
          balance?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      smm_orders: {
        Row: {
          charge: number
          completed_at: string | null
          created_at: string
          external_order_id: number | null
          id: string
          link: string
          notes: string | null
          order_number: string
          quantity: number
          refill_id: number | null
          refill_status: string | null
          refund_amount: number | null
          refund_at: string | null
          refund_reason: string | null
          remains: number | null
          service_id: string | null
          start_count: number | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          charge: number
          completed_at?: string | null
          created_at?: string
          external_order_id?: number | null
          id?: string
          link: string
          notes?: string | null
          order_number?: string
          quantity: number
          refill_id?: number | null
          refill_status?: string | null
          refund_amount?: number | null
          refund_at?: string | null
          refund_reason?: string | null
          remains?: number | null
          service_id?: string | null
          start_count?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          charge?: number
          completed_at?: string | null
          created_at?: string
          external_order_id?: number | null
          id?: string
          link?: string
          notes?: string | null
          order_number?: string
          quantity?: number
          refill_id?: number | null
          refill_status?: string | null
          refund_amount?: number | null
          refund_at?: string | null
          refund_reason?: string | null
          remains?: number | null
          service_id?: string | null
          start_count?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "smm_orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "smm_services"
            referencedColumns: ["id"]
          },
        ]
      }
      smm_platforms: {
        Row: {
          created_at: string
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      smm_service_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          platform_id: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          platform_id: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          platform_id?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smm_service_types_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "smm_platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      smm_services: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          external_service_id: number
          has_refill: boolean | null
          id: string
          is_active: boolean | null
          markup_bronze: number | null
          markup_diamond: number | null
          markup_gold: number | null
          markup_member: number | null
          markup_percent: number | null
          markup_silver: number | null
          max_quantity: number
          min_quantity: number
          name: string
          processing_time: string | null
          rate: number
          refill_policy: string | null
          service_type_id: string | null
          sort_order: number | null
          type: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          external_service_id: number
          has_refill?: boolean | null
          id?: string
          is_active?: boolean | null
          markup_bronze?: number | null
          markup_diamond?: number | null
          markup_gold?: number | null
          markup_member?: number | null
          markup_percent?: number | null
          markup_silver?: number | null
          max_quantity: number
          min_quantity: number
          name: string
          processing_time?: string | null
          rate: number
          refill_policy?: string | null
          service_type_id?: string | null
          sort_order?: number | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          external_service_id?: number
          has_refill?: boolean | null
          id?: string
          is_active?: boolean | null
          markup_bronze?: number | null
          markup_diamond?: number | null
          markup_gold?: number | null
          markup_member?: number | null
          markup_percent?: number | null
          markup_silver?: number | null
          max_quantity?: number
          min_quantity?: number
          name?: string
          processing_time?: string | null
          rate?: number
          refill_policy?: string | null
          service_type_id?: string | null
          sort_order?: number | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smm_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "smm_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smm_services_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "smm_service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      sticker_packs: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      stickers: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean | null
          name: string
          pack_id: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean | null
          name: string
          pack_id: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean | null
          name?: string
          pack_id?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stickers_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "sticker_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          notified: boolean
          notified_at: string | null
          package_id: string | null
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notified?: boolean
          notified_at?: string | null
          package_id?: string | null
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notified?: boolean
          notified_at?: string | null
          package_id?: string | null
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_waitlist_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "product_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_waitlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      story_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_reactions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "user_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "user_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          id: string
          priority: string
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          message: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          message: string
          sender_id: string
          sender_type?: string
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          created_at: string
          id: string
          source_lang: string
          source_text: string
          target_lang: string
          translated_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          source_lang?: string
          source_text: string
          target_lang: string
          translated_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          source_lang?: string
          source_text?: string
          target_lang?: string
          translated_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          is_displayed: boolean | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          is_displayed?: boolean | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          is_displayed?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_api_keys: {
        Row: {
          admin_notes: string | null
          api_key: string
          api_type: string
          approved_at: string | null
          approved_by: string | null
          callback_url: string | null
          created_at: string
          id: string
          ip_whitelist: string | null
          is_active: boolean | null
          last_used_at: string | null
          method: string
          name: string
          rate_limit_per_day: number | null
          rate_limit_per_minute: number | null
          request_count: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          api_key: string
          api_type?: string
          approved_at?: string | null
          approved_by?: string | null
          callback_url?: string | null
          created_at?: string
          id?: string
          ip_whitelist?: string | null
          is_active?: boolean | null
          last_used_at?: string | null
          method?: string
          name: string
          rate_limit_per_day?: number | null
          rate_limit_per_minute?: number | null
          request_count?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          api_key?: string
          api_type?: string
          approved_at?: string | null
          approved_by?: string | null
          callback_url?: string | null
          created_at?: string
          id?: string
          ip_whitelist?: string | null
          is_active?: boolean | null
          last_used_at?: string | null
          method?: string
          name?: string
          rate_limit_per_day?: number | null
          rate_limit_per_minute?: number | null
          request_count?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_avatar_frames: {
        Row: {
          frame_id: string
          id: string
          purchased_at: string
          user_id: string
        }
        Insert: {
          frame_id: string
          id?: string
          purchased_at?: string
          user_id: string
        }
        Update: {
          frame_id?: string
          id?: string
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_avatar_frames_frame_id_fkey"
            columns: ["frame_id"]
            isOneToOne: false
            referencedRelation: "avatar_frames"
            referencedColumns: ["id"]
          },
        ]
      }
      user_event_points: {
        Row: {
          created_at: string
          current_balance: number
          event_id: string
          id: string
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_balance?: number
          event_id: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_balance?: number
          event_id?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_event_points_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_group_orders: {
        Row: {
          created_at: string
          group_id: string
          id: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_group_orders_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_milestone_claims: {
        Row: {
          claimed_at: string
          id: string
          milestone_reward_id: string
          reward_data: Json | null
          user_id: string
        }
        Insert: {
          claimed_at?: string
          id?: string
          milestone_reward_id: string
          reward_data?: Json | null
          user_id: string
        }
        Update: {
          claimed_at?: string
          id?: string
          milestone_reward_id?: string
          reward_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_milestone_claims_milestone_reward_id_fkey"
            columns: ["milestone_reward_id"]
            isOneToOne: false
            referencedRelation: "checkin_milestone_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_name_colors: {
        Row: {
          color_id: string
          id: string
          is_active: boolean | null
          purchased_at: string
          user_id: string
        }
        Insert: {
          color_id: string
          id?: string
          is_active?: boolean | null
          purchased_at?: string
          user_id: string
        }
        Update: {
          color_id?: string
          id?: string
          is_active?: boolean | null
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_name_colors_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "name_colors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notes: {
        Row: {
          background_style: string | null
          content: string
          created_at: string
          expires_at: string | null
          id: string
          is_pinned: boolean | null
          music_name: string | null
          music_url: string | null
          updated_at: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          background_style?: string | null
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          music_name?: string | null
          music_url?: string | null
          updated_at?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          background_style?: string | null
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          music_name?: string | null
          music_url?: string | null
          updated_at?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      user_points: {
        Row: {
          created_at: string
          id: string
          lifetime_earned: number | null
          lifetime_spent: number | null
          total_points: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lifetime_earned?: number | null
          lifetime_spent?: number | null
          total_points?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lifetime_earned?: number | null
          lifetime_spent?: number | null
          total_points?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_posts: {
        Row: {
          background_color: string | null
          comments_count: number
          content: string | null
          created_at: string
          id: string
          images: string[] | null
          is_pinned: boolean
          likes_count: number
          pinned_at: string | null
          seller_id: string | null
          shares_count: number
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          background_color?: string | null
          comments_count?: number
          content?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          is_pinned?: boolean
          likes_count?: number
          pinned_at?: string | null
          seller_id?: string | null
          shares_count?: number
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          background_color?: string | null
          comments_count?: number
          content?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          is_pinned?: boolean
          likes_count?: number
          pinned_at?: string | null
          seller_id?: string | null
          shares_count?: number
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_posts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_posts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_prime_effects: {
        Row: {
          effect_id: string
          id: string
          is_active: boolean | null
          purchased_at: string
          user_id: string
        }
        Insert: {
          effect_id: string
          id?: string
          is_active?: boolean | null
          purchased_at?: string
          user_id: string
        }
        Update: {
          effect_id?: string
          id?: string
          is_active?: boolean | null
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_prime_effects_effect_id_fkey"
            columns: ["effect_id"]
            isOneToOne: false
            referencedRelation: "prime_effects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stories: {
        Row: {
          background_color: string | null
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          media_type: string
          media_url: string
          text_content: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          background_color?: string | null
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url: string
          text_content?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          background_color?: string | null
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
          text_content?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      user_vouchers: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_used: boolean | null
          used_at: string | null
          user_id: string
          voucher_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          used_at?: string | null
          user_id: string
          voucher_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          used_at?: string | null
          user_id?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_vouchers_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_levels: {
        Row: {
          created_at: string
          discount_percent: number
          id: string
          min_spending: number
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_percent?: number
          id?: string
          min_spending?: number
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_percent?: number
          id?: string
          min_spending?: number
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      voucher_user_usage: {
        Row: {
          created_at: string
          id: string
          seller_voucher_id: string | null
          updated_at: string
          usage_count: number
          user_id: string
          voucher_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          seller_voucher_id?: string | null
          updated_at?: string
          usage_count?: number
          user_id: string
          voucher_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          seller_voucher_id?: string | null
          updated_at?: string
          usage_count?: number
          user_id?: string
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voucher_user_usage_seller_voucher_id_fkey"
            columns: ["seller_voucher_id"]
            isOneToOne: false
            referencedRelation: "seller_vouchers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_user_usage_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_discount: number | null
          min_order_value: number | null
          per_user_limit: number | null
          updated_at: string
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order_value?: number | null
          per_user_limit?: number | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order_value?: number | null
          per_user_limit?: number | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          id: string
          note: string | null
          recipient_id: string | null
          reference_id: string | null
          reference_type: string | null
          sender_id: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          id?: string
          note?: string | null
          recipient_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          sender_id?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          id?: string
          note?: string | null
          recipient_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          sender_id?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          delivered_at: string
          event_type: string
          id: string
          is_success: boolean | null
          payload: Json
          response_body: string | null
          response_status: number | null
          webhook_id: string
        }
        Insert: {
          delivered_at?: string
          event_type: string
          id?: string
          is_success?: boolean | null
          payload: Json
          response_body?: string | null
          response_status?: number | null
          webhook_id: string
        }
        Update: {
          delivered_at?: string
          event_type?: string
          id?: string
          is_success?: boolean | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "seller_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          notify_on_sale: boolean
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notify_on_sale?: boolean
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notify_on_sale?: boolean
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          actual_amount: number | null
          admin_notes: string | null
          amount: number
          bank_account: string
          bank_holder: string
          bank_name: string
          created_at: string
          fast_fee: number | null
          id: string
          processed_at: string | null
          processed_by: string | null
          seller_id: string
          status: string
          withdrawal_type: string | null
        }
        Insert: {
          actual_amount?: number | null
          admin_notes?: string | null
          amount: number
          bank_account: string
          bank_holder: string
          bank_name: string
          created_at?: string
          fast_fee?: number | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          seller_id: string
          status?: string
          withdrawal_type?: string | null
        }
        Update: {
          actual_amount?: number | null
          admin_notes?: string | null
          amount?: number
          bank_account?: string
          bank_holder?: string
          bank_name?: string
          created_at?: string
          fast_fee?: number | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          seller_id?: string
          status?: string
          withdrawal_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_requests_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      orders_leaderboard: {
        Row: {
          created_at: string | null
          id: string | null
          masked_email: string | null
          masked_name: string | null
          status: string | null
          total_amount: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          masked_email?: never
          masked_name?: never
          status?: string | null
          total_amount?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          masked_email?: never
          masked_name?: never
          status?: string | null
          total_amount?: number | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          active_effect_id: string | null
          active_name_color_id: string | null
          avatar_frame_id: string | null
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          full_name: string | null
          has_prime_boost: boolean | null
          is_online: boolean | null
          is_verified: boolean | null
          last_seen: string | null
          prime_expires_at: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          active_effect_id?: string | null
          active_name_color_id?: string | null
          avatar_frame_id?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          full_name?: string | null
          has_prime_boost?: boolean | null
          is_online?: boolean | null
          is_verified?: boolean | null
          last_seen?: string | null
          prime_expires_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          active_effect_id?: string | null
          active_name_color_id?: string | null
          avatar_frame_id?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          full_name?: string | null
          has_prime_boost?: boolean | null
          is_online?: boolean | null
          is_verified?: boolean | null
          last_seen?: string | null
          prime_expires_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_effect_id_fkey"
            columns: ["active_effect_id"]
            isOneToOne: false
            referencedRelation: "prime_effects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_active_name_color_id_fkey"
            columns: ["active_name_color_id"]
            isOneToOne: false
            referencedRelation: "name_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_avatar_frame_id_fkey"
            columns: ["avatar_frame_id"]
            isOneToOne: false
            referencedRelation: "avatar_frames"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews_masked: {
        Row: {
          admin_reply: string | null
          admin_reply_at: string | null
          comment: string | null
          created_at: string | null
          id: string | null
          is_approved: boolean | null
          is_verified_purchase: boolean | null
          product_id: string | null
          rating: number | null
          updated_at: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          admin_reply?: string | null
          admin_reply_at?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string | null
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          product_id?: string | null
          rating?: number | null
          updated_at?: string | null
          user_email?: never
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          admin_reply?: string | null
          admin_reply_at?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string | null
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          product_id?: string | null
          rating?: number | null
          updated_at?: string | null
          user_email?: never
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews_public: {
        Row: {
          admin_reply: string | null
          admin_reply_at: string | null
          comment: string | null
          created_at: string | null
          id: string | null
          is_approved: boolean | null
          is_verified_purchase: boolean | null
          product_id: string | null
          rating: number | null
          updated_at: string | null
          user_email_masked: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          admin_reply?: string | null
          admin_reply_at?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string | null
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          product_id?: string | null
          rating?: number | null
          updated_at?: string | null
          user_email_masked?: never
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          admin_reply?: string | null
          admin_reply_at?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string | null
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          product_id?: string | null
          rating?: number | null
          updated_at?: string | null
          user_email_masked?: never
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers_public: {
        Row: {
          created_at: string | null
          id: string | null
          is_verified: boolean | null
          rating_average: number | null
          rating_count: number | null
          shop_avatar_url: string | null
          shop_banner_url: string | null
          shop_description: string | null
          shop_name: string | null
          shop_slug: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_verified?: boolean | null
          rating_average?: number | null
          rating_count?: number | null
          shop_avatar_url?: string | null
          shop_banner_url?: string | null
          shop_description?: string | null
          shop_name?: string | null
          shop_slug?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_verified?: boolean | null
          rating_average?: number | null
          rating_count?: number | null
          shop_avatar_url?: string | null
          shop_banner_url?: string | null
          shop_description?: string | null
          shop_name?: string | null
          shop_slug?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      site_settings_public: {
        Row: {
          id: string | null
          key: string | null
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          id?: string | null
          key?: string | null
          updated_at?: string | null
          value?: never
        }
        Update: {
          id?: string | null
          key?: string | null
          updated_at?: string | null
          value?: never
        }
        Relationships: []
      }
      smm_orders_leaderboard: {
        Row: {
          created_at: string | null
          id: string | null
          masked_email: string | null
          status: string | null
          total_amount: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_adjust_user_balance: {
        Args: {
          p_adjustment: number
          p_admin_user_id: string
          p_reason?: string
          p_target_profile_id: string
        }
        Returns: Json
      }
      auction_buy_now: {
        Args: { p_auction_id: string; p_price: number }
        Returns: Json
      }
      auto_hide_sold_accounts: { Args: never; Returns: undefined }
      auto_release_design_escrow: { Args: never; Returns: undefined }
      auto_release_seller_order_escrow: { Args: never; Returns: undefined }
      calculate_seller_trust_score: {
        Args: { seller_uuid: string }
        Returns: number
      }
      calculate_smm_avg_time: {
        Args: { p_service_id: string }
        Returns: string
      }
      can_manage_group: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      cancel_design_order: {
        Args: { p_order_id: string; p_reason?: string }
        Returns: Json
      }
      check_design_order_deadlines: { Args: never; Returns: undefined }
      check_seller_badges: { Args: { p_seller_id: string }; Returns: undefined }
      claim_random_account: {
        Args: { p_order_id: string; p_product_id: string }
        Returns: {
          account_data: string
          account_id: string
        }[]
      }
      complete_deposit_transaction: {
        Args: { p_deposit_id: string; p_transaction_data?: Json }
        Returns: Json
      }
      confirm_design_order_completion: {
        Args: { p_confirm_type: string; p_order_id: string }
        Returns: Json
      }
      create_design_order_with_escrow: {
        Args: {
          p_amount: number
          p_license_type_id?: string
          p_original_amount?: number
          p_platform_fee: number
          p_platform_fee_rate: number
          p_reference_files?: string[]
          p_requirement_colors?: string
          p_requirement_notes?: string
          p_requirement_purpose?: string
          p_requirement_size?: string
          p_requirement_style?: string
          p_requirement_text?: string
          p_seller_amount: number
          p_seller_id: string
          p_service_id: string
          p_voucher_code?: string
          p_voucher_discount?: number
        }
        Returns: Json
      }
      create_design_ticket_on_order: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      create_notification: {
        Args: {
          p_link?: string
          p_message: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      create_p2p_transfer: {
        Args: {
          p_amount: number
          p_message?: string
          p_recipient_identifier: string
          p_sender_id: string
        }
        Returns: Json
      }
      create_product_boost: {
        Args: { p_boost_type: string; p_days: number; p_product_id: string }
        Returns: {
          boost_id: string
          message: string
          success: boolean
        }[]
      }
      create_seller_fast_withdrawal: {
        Args: {
          p_amount: number
          p_bank_account: string
          p_bank_holder: string
          p_bank_name: string
          p_seller_id: string
        }
        Returns: Json
      }
      create_seller_normal_withdrawal: {
        Args: {
          p_amount: number
          p_bank_account: string
          p_bank_holder: string
          p_bank_name: string
          p_seller_id: string
        }
        Returns: Json
      }
      create_seller_order_with_escrow: {
        Args: {
          p_amount: number
          p_discount_amount?: number
          p_platform_fee_percent?: number
          p_product_id: string
          p_seller_id: string
          p_voucher_code?: string
        }
        Returns: Json
      }
      create_seller_withdrawal: {
        Args: {
          p_account_holder?: string
          p_account_number?: string
          p_amount: number
          p_bank_name?: string
          p_seller_id: string
          p_type?: string
        }
        Returns: Json
      }
      create_smm_order_atomic: {
        Args: {
          p_amount_vnd: number
          p_charge_usd: number
          p_external_order_id: string
          p_link: string
          p_note?: string
          p_quantity: number
          p_service_id: string
          p_user_id: string
        }
        Returns: Json
      }
      create_smm_order_with_balance: {
        Args: {
          p_charge: number
          p_external_order_id: string
          p_link: string
          p_order_number: string
          p_quantity: number
          p_service_id: string
          p_user_id: string
        }
        Returns: Json
      }
      do_update_design_service_stats: {
        Args: { p_service_id: string }
        Returns: undefined
      }
      finalize_auction: {
        Args: { p_auction_id: string }
        Returns: {
          message: string
          success: boolean
          winner_id: string
          winning_amount: number
        }[]
      }
      generate_affiliate_code: { Args: never; Returns: string }
      generate_api_key: { Args: never; Returns: string }
      generate_gift_card_code: { Args: never; Returns: string }
      generate_gift_card_share_token: { Args: never; Returns: string }
      generate_order_number: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      generate_seller_order_number: { Args: never; Returns: string }
      generate_smm_order_number: { Args: never; Returns: string }
      generate_ticket_number: { Args: never; Returns: string }
      generate_username_from_email: {
        Args: { p_email: string }
        Returns: string
      }
      get_group_role: {
        Args: { _group_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["group_member_role"]
      }
      get_user_role: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_voucher_usage: {
        Args: { voucher_id: string }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_chat_room_member: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      is_chat_room_owner: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      is_design_manager: { Args: { _user_id: string }; Returns: boolean }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      log_group_activity: {
        Args: {
          p_action: string
          p_details?: Json
          p_group_id: string
          p_target_id?: string
          p_target_type?: string
        }
        Returns: string
      }
      log_handover_action: {
        Args: {
          p_action: string
          p_handover_id: string
          p_new_data?: Json
          p_old_data?: Json
        }
        Returns: string
      }
      pay_with_balance: {
        Args: {
          p_amount: number
          p_note?: string
          p_reference_id?: string
          p_reference_type: string
          p_user_id: string
        }
        Returns: Json
      }
      perform_daily_checkin: { Args: { p_user_id: string }; Returns: Json }
      place_auction_bid: {
        Args: {
          p_amount: number
          p_auction_id: string
          p_max_auto_bid?: number
        }
        Returns: {
          bid_id: string
          message: string
          new_price: number
          success: boolean
        }[]
      }
      process_p2p_transfer: {
        Args: { p_transfer_id: string }
        Returns: boolean
      }
      process_seller_withdrawal: {
        Args: {
          p_admin_id: string
          p_admin_notes?: string
          p_status: string
          p_withdrawal_id: string
        }
        Returns: Json
      }
      purchase_design_revision_package: {
        Args: {
          p_order_id: string
          p_price_per_revision: number
          p_quantity: number
        }
        Returns: Json
      }
      purchase_prime_boost: {
        Args: { p_amount_paid: number; p_plan_id: string; p_user_id: string }
        Returns: Json
      }
      purchase_shop_item: {
        Args: {
          p_item_id: string
          p_item_name: string
          p_item_type: string
          p_price: number
          p_recipient_user_id?: string
          p_user_id: string
        }
        Returns: Json
      }
      record_affiliate_conversion: {
        Args: {
          p_affiliate_code: string
          p_customer_id: string
          p_order_amount: number
          p_order_id: string
        }
        Returns: string
      }
      record_seller_daily_stat: {
        Args: {
          p_disputes?: number
          p_orders?: number
          p_products_sold?: number
          p_revenue?: number
          p_seller_id: string
          p_views?: number
        }
        Returns: undefined
      }
      redeem_points_reward: {
        Args: { p_reward_id: string; p_user_id: string }
        Returns: Json
      }
      refund_balance_payment: {
        Args: { p_payment_id: string; p_reason?: string }
        Returns: Json
      }
      refund_design_order_to_buyer: {
        Args: { p_admin_notes?: string; p_order_id: string; p_reason?: string }
        Returns: Json
      }
      refund_seller_order_to_buyer: {
        Args: { p_order_id: string; p_reason?: string }
        Returns: Json
      }
      refund_smm_order: {
        Args: {
          p_order_id: string
          p_reason?: string
          p_refund_amount_vnd: number
          p_user_id: string
        }
        Returns: Json
      }
      release_design_escrow: { Args: never; Returns: undefined }
      release_design_escrow_to_seller: {
        Args: { p_order_id: string }
        Returns: Json
      }
      release_seller_order_escrow: {
        Args: { p_order_id: string }
        Returns: Json
      }
      resolve_design_dispute: {
        Args: {
          p_action: string
          p_order_id: string
          p_resolution_notes?: string
        }
        Returns: Json
      }
      resolve_seller_order_dispute: {
        Args: {
          p_action: string
          p_order_id: string
          p_resolution_notes?: string
        }
        Returns: Json
      }
      spin_event_wheel: {
        Args: { p_event_id: string }
        Returns: {
          message: string
          prize_data: Json
          prize_name: string
          prize_type: string
          spin_id: string
          success: boolean
        }[]
      }
      spin_wheel_with_balance_prize: {
        Args: {
          p_event_id: string
          p_points_spent: number
          p_prize_id: string
          p_prize_name: string
          p_prize_type: string
          p_prize_value: number
          p_user_id: string
        }
        Returns: Json
      }
      track_affiliate_click: {
        Args: {
          p_affiliate_code: string
          p_landing_page: string
          p_user_agent: string
          p_visitor_ip: string
        }
        Returns: string
      }
      transfer_group_ownership: {
        Args: { p_group_id: string; p_new_owner_id: string }
        Returns: boolean
      }
      transfer_seller_to_web_balance: {
        Args: { p_amount: number; p_seller_id: string }
        Returns: Json
      }
      update_seller_level: { Args: { p_seller_id: string }; Returns: undefined }
      update_user_vip_level: { Args: { _user_id: string }; Returns: undefined }
      withdraw_seller_to_user_balance: {
        Args: { p_amount: number; p_seller_id: string }
        Returns: Json
      }
    }
    Enums: {
      auction_status: "draft" | "active" | "ended" | "cancelled" | "sold"
      auction_type: "time_based" | "buy_now" | "dutch" | "sealed"
      group_deal_status:
        | "open"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "disputed"
      group_join_type: "open" | "link" | "code" | "approval" | "conditional"
      group_member_role: "owner" | "manager" | "seller" | "member" | "viewer"
      group_post_type:
        | "announcement"
        | "discussion"
        | "deal"
        | "task"
        | "profit_share"
        | "report"
      group_task_status: "pending" | "doing" | "done" | "cancelled"
      group_visibility: "public" | "private" | "hidden"
      report_reason:
        | "spam"
        | "harassment"
        | "hate_speech"
        | "violence"
        | "nudity"
        | "false_info"
        | "scam"
        | "other"
      report_status: "pending" | "reviewed" | "resolved" | "dismissed"
      user_role: "user" | "admin" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      auction_status: ["draft", "active", "ended", "cancelled", "sold"],
      auction_type: ["time_based", "buy_now", "dutch", "sealed"],
      group_deal_status: [
        "open",
        "in_progress",
        "completed",
        "cancelled",
        "disputed",
      ],
      group_join_type: ["open", "link", "code", "approval", "conditional"],
      group_member_role: ["owner", "manager", "seller", "member", "viewer"],
      group_post_type: [
        "announcement",
        "discussion",
        "deal",
        "task",
        "profit_share",
        "report",
      ],
      group_task_status: ["pending", "doing", "done", "cancelled"],
      group_visibility: ["public", "private", "hidden"],
      report_reason: [
        "spam",
        "harassment",
        "hate_speech",
        "violence",
        "nudity",
        "false_info",
        "scam",
        "other",
      ],
      report_status: ["pending", "reviewed", "resolved", "dismissed"],
      user_role: ["user", "admin", "staff"],
    },
  },
} as const
