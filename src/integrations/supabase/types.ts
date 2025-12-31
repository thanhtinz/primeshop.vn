/**
 * Supabase Types Compatibility
 * 
 * This file provides type compatibility for existing code that imports types from
 * '@/integrations/supabase/types'. Since we're using MySQL now, these types are 
 * placeholders for backward compatibility.
 */

// Generic database types for compatibility
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: Record<string, any>;
    Views: Record<string, any>;
    Functions: Record<string, any>;
    Enums: Record<string, any>;
    CompositeTypes: Record<string, any>;
  };
}

// Common table types - these should match your Prisma schema
export interface Tables {
  users: {
    Row: {
      id: string;
      email: string;
      display_name: string | null;
      avatar_url: string | null;
      phone: string | null;
      bio: string | null;
      balance: number;
      points: number;
      level: number;
      is_prime: boolean;
      is_verified: boolean;
      is_banned: boolean;
      created_at: string;
      updated_at: string;
    };
    Insert: Partial<Tables['users']['Row']>;
    Update: Partial<Tables['users']['Row']>;
  };
  products: {
    Row: {
      id: string;
      category_id: string | null;
      name: string;
      slug: string;
      description: string | null;
      image_url: string | null;
      price: number;
      original_price: number | null;
      stock: number;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    };
    Insert: Partial<Tables['products']['Row']>;
    Update: Partial<Tables['products']['Row']>;
  };
  orders: {
    Row: {
      id: string;
      user_id: string | null;
      order_number: string;
      status: string;
      total_amount: number;
      created_at: string;
      updated_at: string;
    };
    Insert: Partial<Tables['orders']['Row']>;
    Update: Partial<Tables['orders']['Row']>;
  };
  categories: {
    Row: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      image_url: string | null;
      is_active: boolean;
      sort_order: number;
      created_at: string;
      updated_at: string;
    };
    Insert: Partial<Tables['categories']['Row']>;
    Update: Partial<Tables['categories']['Row']>;
  };
}

// Export commonly used types
export type User = Tables['users']['Row'];
export type Product = Tables['products']['Row'];
export type Order = Tables['orders']['Row'];
export type Category = Tables['categories']['Row'];
