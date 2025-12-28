import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface ApiChangelog {
  id: string;
  version: string;
  releaseDate: string;
  changes: string[];
  breakingChanges?: string[];
  createdAt: string;
  
  // Legacy snake_case fields
  release_date: string;
  breaking_changes?: string[];
  created_at: string;
}

const mapChangelog = (data: any): ApiChangelog => ({
  id: data.id,
  version: data.version,
  releaseDate: data.releaseDate || data.release_date,
  changes: data.changes || [],
  breakingChanges: data.breakingChanges || data.breaking_changes,
  createdAt: data.createdAt || data.created_at,
  
  // Legacy fields
  release_date: data.releaseDate || data.release_date,
  breaking_changes: data.breakingChanges || data.breaking_changes,
  created_at: data.createdAt || data.created_at,
});

export const useApiChangelog = () => {
  return useQuery({
    queryKey: ['api-changelog'],
    queryFn: async () => {
      const response = await apiClient.get('/api-changelog');
      return (response.data || []).map(mapChangelog);
    },
  });
};

export const useCreateChangelog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (changelog: {
      version: string;
      releaseDate: string;
      changes: string[];
      breakingChanges?: string[];
    }) => {
      const response = await apiClient.post('/api-changelog', {
        version: changelog.version,
        releaseDate: changelog.releaseDate,
        changes: changelog.changes,
        breakingChanges: changelog.breakingChanges,
      });
      return mapChangelog(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-changelog'] });
    },
  });
};

export const useUpdateChangelog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: { 
      id: string; 
      version?: string;
      releaseDate?: string;
      changes?: string[];
      breakingChanges?: string[];
    }) => {
      const response = await apiClient.put(`/api-changelog/${id}`, updates);
      return mapChangelog(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-changelog'] });
    },
  });
};

export const useDeleteChangelog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api-changelog/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-changelog'] });
    },
  });
};
