/**
 * Supabase Compatibility Layer
 * 
 * This file provides backward compatibility for existing code that imports from 
 * '@/integrations/supabase/client'. All actual functionality is now handled by 
 * the MySQL backend through the api-client.
 * 
 * The supabase object exported here mimics the Supabase client interface but 
 * routes all operations to the Express/MySQL backend API.
 */

import { apiClient, auth, storage, rpc, functions } from '@/lib/api-client';

// Re-export the API client as "supabase" for backward compatibility
export const supabase = {
  ...apiClient,
  auth: {
    ...auth,
    // Additional Supabase auth compatibility methods
    getSession: async () => {
      try {
        const user = await auth.getUser();
        return { data: { session: user ? { user } : null }, error: null };
      } catch (error) {
        return { data: { session: null }, error };
      }
    },
    getUser: async () => {
      try {
        const user = await auth.getUser();
        return { data: { user }, error: null };
      } catch (error) {
        return { data: { user: null }, error };
      }
    },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      try {
        const result = await auth.signIn(email, password);
        return { data: { user: result.user, session: { user: result.user } }, error: null };
      } catch (error) {
        return { data: { user: null, session: null }, error };
      }
    },
    signUp: async ({ email, password, options }: { email: string; password: string; options?: { data?: any } }) => {
      try {
        const result = await auth.signUp(email, password, options?.data?.display_name);
        return { data: { user: result.user, session: { user: result.user } }, error: null };
      } catch (error) {
        return { data: { user: null, session: null }, error };
      }
    },
    signOut: async () => {
      try {
        await auth.signOut();
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
    resetPasswordForEmail: async (email: string) => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to send reset email');
        return { data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    updateUser: async (attributes: { password?: string; email?: string; data?: any }) => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_BASE_URL}/auth/update-user`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(attributes),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update user');
        return { data: { user: data.user }, error: null };
      } catch (error) {
        return { data: { user: null }, error };
      }
    },
    onAuthStateChange: auth.onAuthStateChange.bind(auth),
  },
  storage,
  functions,
  rpc: async (functionName: string, params?: any) => {
    return rpc(functionName, params);
  },
  // Channel/realtime mock for compatibility
  channel: (name: string) => ({
    on: (_event: string, _filter: any, _callback: any) => ({
      subscribe: (callback?: (status: string) => void) => {
        callback?.('SUBSCRIBED');
        return { unsubscribe: () => {} };
      },
    }),
    subscribe: (callback?: (status: string) => void) => {
      callback?.('SUBSCRIBED');
      return { unsubscribe: () => {} };
    },
  }),
  removeChannel: (_channel: any) => {},
};

// Re-export auth for direct imports
export { auth };

// QueryBuilder type for compatibility
export interface QueryBuilder<T> {
  select(columns?: string): QueryBuilder<T>;
  insert(data: Partial<T> | Partial<T>[]): QueryBuilder<T>;
  update(data: Partial<T>): QueryBuilder<T>;
  delete(): QueryBuilder<T>;
  eq(column: string, value: any): QueryBuilder<T>;
  neq(column: string, value: any): QueryBuilder<T>;
  single(): QueryBuilder<T>;
  then<TResult>(onfulfilled?: (value: { data: T | T[] | null; error: any }) => TResult): Promise<TResult>;
}
