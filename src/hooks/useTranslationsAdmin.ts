import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Translation {
  id: string;
  source_text: string;
  source_lang: string;
  target_lang: string;
  translated_text: string;
  created_at: string;
  updated_at: string;
}

export const useTranslationsAdmin = (targetLang: string = 'en') => {
  return useQuery({
    queryKey: ['translations-admin', targetLang],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('translations')
        .select('*')
        .eq('target_lang', targetLang)
        .order('source_text', { ascending: true });
      if (error) throw error;
      return data as Translation[];
    },
  });
};

export const useUpdateTranslation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, translated_text }: { id: string; translated_text: string }) => {
      const { data, error } = await supabase
        .from('translations')
        .update({ translated_text, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
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
      const { error } = await supabase
        .from('translations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations-admin'] });
    },
  });
};

export const useCreateTranslation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (translation: Omit<Translation, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('translations')
        .insert([translation])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations-admin'] });
    },
  });
};
