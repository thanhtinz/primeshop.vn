// Hook for fetching Naperis categories and products
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface NaperisCategory {
  id: number;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  products?: NaperisProduct[];
}

export interface NaperisProduct {
  id: number;
  name: string;
  price: number;
  description?: string;
  image?: string;
}

export interface NaperisBalance {
  balance: number;
  currency: string;
}

const fetchNaperis = async <T>(endpoint: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}/naperis${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || 'Failed to fetch');
  }
  
  return response.json();
};

// Fetch all categories
export const useNaperisCategories = () => {
  return useQuery<NaperisCategory[]>({
    queryKey: ['naperis-categories'],
    queryFn: async () => {
      const result = await fetchNaperis<{ data: NaperisCategory[] } | NaperisCategory[]>('/categories');
      return Array.isArray(result) ? result : result.data || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });
};

// Fetch category with products
export const useNaperisCategoryProducts = (categoryId: string | number | null) => {
  return useQuery<NaperisCategory>({
    queryKey: ['naperis-category', categoryId],
    queryFn: async () => {
      if (!categoryId) throw new Error('Category ID required');
      const result = await fetchNaperis<{ data: NaperisCategory } | NaperisCategory>(`/categories/${categoryId}`);
      return 'data' in result ? result.data : result;
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

// Fetch balance
export const useNaperisBalance = () => {
  return useQuery<NaperisBalance>({
    queryKey: ['naperis-balance'],
    queryFn: async () => {
      const result = await fetchNaperis<{ data: NaperisBalance } | NaperisBalance>('/balance');
      return 'data' in result ? result.data : result;
    },
    staleTime: 1 * 60 * 1000, // Cache for 1 minute
    retry: 1,
  });
};

// Sync status interface
export interface NaperisSyncStatusItem {
  id: string;
  name: string;
  productName?: string;
  externalProductId: string;
  markupPercent: number;
  sourcePrice: number | null;
  currentPrice: number;
  calculatedPrice: number | null;
  needsUpdate: boolean;
}

export interface NaperisSyncStatus {
  total: number;
  needsUpdate: number;
  packages: NaperisSyncStatusItem[];
}

export interface NaperisSyncResult {
  success: boolean;
  message: string;
  updated: number;
  total: number;
  details: {
    id: string;
    name: string;
    oldPrice: number;
    newPrice: number;
    status: string;
  }[];
}

// Get sync status - shows which packages need price updates
export const useNaperisSyncStatus = () => {
  return useQuery<NaperisSyncStatus>({
    queryKey: ['naperis-sync-status'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/naperis/sync-status`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch sync status');
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });
};

// Sync prices mutation
export const useNaperisSyncPrices = () => {
  const queryClient = useQueryClient();
  
  return useMutation<NaperisSyncResult, Error>({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE_URL}/naperis/sync-prices`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to sync prices');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['naperis-sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
