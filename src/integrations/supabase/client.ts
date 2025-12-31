/**
 * DEPRECATED: This file is kept for backward compatibility only.
 * All Supabase functionality has been migrated to Express.js + MySQL backend.
 * 
 * Please use the following instead:
 * - For auth: import { auth } from '@/lib/api-client'
 * - For database queries: import { apiClient } from '@/lib/api-client'
 * - For RPC calls: import { rpc } from '@/lib/api-client'
 * - For storage: import { storage } from '@/lib/api-client'
 */

import { auth, storage, rpc } from '@/lib/api-client';

/**
 * @deprecated Use individual imports from '@/lib/api-client' instead
 */
export const supabase = {
  auth,
  storage,
  rpc: (functionName: string, params?: any) => rpc(functionName, params),
  
  // Deprecated methods - these will throw errors
  from: () => {
    throw new Error('supabase.from() is deprecated. Use apiClient from @/lib/api-client instead.');
  },
  
  functions: {
    invoke: () => {
      throw new Error('supabase.functions.invoke() is deprecated. Use rpc() from @/lib/api-client instead.');
    }
  },
  
  channel: () => {
    console.warn('Real-time functionality is not yet implemented in the new backend');
    return {
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
      subscribe: () => ({ unsubscribe: () => {} })
    };
  }
};

// Export warning message
console.warn(
  '%c⚠️ DEPRECATED: @/integrations/supabase/client',
  'color: orange; font-weight: bold; font-size: 14px;',
  '\n\nThis import path is deprecated. Please migrate to:\n' +
  '• auth, storage, rpc from @/lib/api-client\n' +
  '• apiClient for direct API calls\n\n' +
  'See MIGRATION_GUIDE.md for more details.'
);
