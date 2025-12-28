// Legacy compatibility layer - now re-exports from api-client
// The Supabase client is no longer used - all operations go through the Express/MySQL backend
// This file exists for backward compatibility with existing imports

import { apiClient, auth } from '@/lib/api-client';

// Re-export the API client as "supabase" for backward compatibility
export const supabase = {
  ...apiClient,
  auth,
  // Add storage mock for compatibility
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => {
        console.warn('Supabase storage is deprecated. Use the file upload API instead.');
        return { data: null, error: new Error('Supabase storage is deprecated') };
      },
      getPublicUrl: (path: string) => {
        return { data: { publicUrl: `/uploads/${path}` } };
      },
      remove: async (paths: string[]) => {
        console.warn('Supabase storage is deprecated. Use the file delete API instead.');
        return { data: null, error: null };
      },
    }),
  },
  // Add functions mock for compatibility
  functions: {
    invoke: async (name: string, options?: { body?: any }) => {
      console.warn(`Supabase function "${name}" is deprecated. Use API endpoints instead.`);
      // Map to API endpoints
      const functionMapping: Record<string, string> = {
        'verify-captcha': '/auth/verify-captcha',
        'send-email': '/email/send',
        'send-invoice': '/email/invoice',
        'create-deposit-payment': '/deposits/create-payment',
        'deposit-webhook': '/webhooks/deposit',
        'paypal-webhook': '/webhooks/paypal',
      };
      
      const endpoint = functionMapping[name];
      if (endpoint) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(options?.body || {}),
          });
          const data = await response.json();
          return { data, error: null };
        } catch (error: any) {
          return { data: null, error };
        }
      }
      return { data: null, error: new Error(`Unknown function: ${name}`) };
    },
  },
  // Channel/realtime mock
  channel: (name: string) => ({
    on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    subscribe: () => ({ unsubscribe: () => {} }),
  }),
  removeChannel: () => {},
};

// Re-export auth for direct imports
export { auth };
