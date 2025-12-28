import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Translation {
  id: string;
  sourceText: string;
  sourceLang: string;
  targetLang: string;
  translatedText: string;
  createdAt: string;
  updatedAt: string;
  
  // Legacy snake_case fields
  source_text: string;
  source_lang: string;
  target_lang: string;
  translated_text: string;
  created_at: string;
  updated_at: string;
}

const mapTranslation = (data: any): Translation => ({
  id: data.id,
  sourceText: data.sourceText || data.source_text,
  sourceLang: data.sourceLang || data.source_lang,
  targetLang: data.targetLang || data.target_lang,
  translatedText: data.translatedText || data.translated_text,
  createdAt: data.createdAt || data.created_at,
  updatedAt: data.updatedAt || data.updated_at,
  
  // Legacy fields
  source_text: data.sourceText || data.source_text,
  source_lang: data.sourceLang || data.source_lang,
  target_lang: data.targetLang || data.target_lang,
  translated_text: data.translatedText || data.translated_text,
  created_at: data.createdAt || data.created_at,
  updated_at: data.updatedAt || data.updated_at,
});

export const useTranslationsAdmin = (targetLang: string = 'en') => {
  return useQuery({
    queryKey: ['translations-admin', targetLang],
    queryFn: async () => {
      const response = await apiClient.get(`/translations?targetLang=${targetLang}`);
      return (response.data || []).map(mapTranslation);
    },
  });
};

export const useCreateTranslation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (translation: {
      sourceText: string;
      sourceLang: string;
      targetLang: string;
      translatedText: string;
    }) => {
      const response = await apiClient.post('/translations', translation);
      return mapTranslation(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations-admin'] });
    },
  });
};

export const useUpdateTranslation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      translatedText 
    }: { 
      id: string; 
      translatedText: string;
      // Legacy support
      translated_text?: string;
    }) => {
      const text = translatedText || translatedText;
      const response = await apiClient.put(`/translations/${id}`, {
        translatedText: text,
      });
      return mapTranslation(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations-admin'] });
    },
  });
};

export const useDeleteTranslation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/translations/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations-admin'] });
    },
  });
};

// Bulk import translations
export const useBulkImportTranslations = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (translations: {
      sourceText: string;
      sourceLang: string;
      targetLang: string;
      translatedText: string;
    }[]) => {
      const response = await apiClient.post('/translations/bulk', { translations });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations-admin'] });
    },
  });
};

// Export translations
export const useExportTranslations = () => {
  return useMutation({
    mutationFn: async (targetLang?: string) => {
      const params = targetLang ? `?targetLang=${targetLang}` : '';
      const response = await apiClient.get(`/translations/export${params}`);
      return response.data;
    },
  });
};

// Search translations
export const useSearchTranslations = (
  query: string,
  targetLang?: string
) => {
  return useQuery({
    queryKey: ['translations-search', query, targetLang],
    queryFn: async () => {
      const params = new URLSearchParams({ q: query });
      if (targetLang) params.set('targetLang', targetLang);
      
      const response = await apiClient.get(`/translations/search?${params.toString()}`);
      return (response.data || []).map(mapTranslation);
    },
    enabled: query.length >= 2,
  });
};

// Get translation stats
export const useTranslationStats = () => {
  return useQuery({
    queryKey: ['translation-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/translations/stats');
      return response.data as {
        totalTranslations: number;
        byLanguage: { lang: string; count: number }[];
        recentlyUpdated: number;
        missingTranslations: number;
        
        // Legacy fields
        total_translations: number;
        by_language: { lang: string; count: number }[];
        recently_updated: number;
        missing_translations: number;
      };
    },
  });
};
