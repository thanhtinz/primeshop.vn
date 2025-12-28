import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ApiChangelogEntry {
  id: string;
  version: string;
  title: string;
  description: string | null;
  changes: { type: string; description: string }[];
  is_breaking: boolean;
  published_at: string;
  created_at: string;
}

export const useApiChangelog = () => {
  return useQuery({
    queryKey: ['api-changelog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_changelog')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data as ApiChangelogEntry[];
    },
  });
};

export const useCreateChangelog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Omit<ApiChangelogEntry, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('api_changelog').insert({
        version: entry.version,
        title: entry.title,
        description: entry.description,
        changes: entry.changes,
        is_breaking: entry.is_breaking,
        published_at: entry.published_at,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-changelog'] });
      toast.success('Đã thêm changelog mới');
    },
    onError: (error: Error) => {
      toast.error('Lỗi: ' + error.message);
    },
  });
};

export const useUpdateChangelog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...entry }: Partial<ApiChangelogEntry> & { id: string }) => {
      const { error } = await supabase
        .from('api_changelog')
        .update({
          version: entry.version,
          title: entry.title,
          description: entry.description,
          changes: entry.changes,
          is_breaking: entry.is_breaking,
          published_at: entry.published_at,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-changelog'] });
      toast.success('Đã cập nhật changelog');
    },
    onError: (error: Error) => {
      toast.error('Lỗi: ' + error.message);
    },
  });
};

export const useDeleteChangelog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('api_changelog').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-changelog'] });
      toast.success('Đã xóa changelog');
    },
  });
};
