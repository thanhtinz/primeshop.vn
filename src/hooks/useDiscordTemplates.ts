import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useToast } from './use-toast';

export interface DiscordTemplate {
  id: number;
  name: string;
  title: string;
  title_en?: string | null;
  message: string;
  message_en?: string | null;
  description?: string | null;
  description_en?: string | null;
  category?: string | null;
  color: number;
  is_active: boolean;
  variables?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

// Get all Discord templates
export const useDiscordTemplates = () => {
  return useQuery({
    queryKey: ['discord-templates'],
    queryFn: async (): Promise<DiscordTemplate[]> => {
      const response = await fetch(`${apiClient}/admin/discord-templates`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch Discord templates');
      return response.json();
    },
  });
};

// Create Discord template
export const useCreateDiscordTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (template: Omit<DiscordTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await fetch(`${apiClient}/admin/discord-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create template');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discord-templates'] });
      toast({
        title: 'Success',
        description: 'Discord template created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Update Discord template
export const useUpdateDiscordTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...template }: Partial<DiscordTemplate> & { id: number }) => {
      const response = await fetch(`${apiClient}/admin/discord-templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update template');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discord-templates'] });
      toast({
        title: 'Success',
        description: 'Discord template updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Delete Discord template
export const useDeleteDiscordTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${apiClient}/admin/discord-templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discord-templates'] });
      toast({
        title: 'Success',
        description: 'Discord template deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Test send Discord notification
export const useTestDiscordTemplate = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ templateId, testData }: { templateId: number; testData: Record<string, any> }) => {
      const response = await fetch(`${apiClient}/admin/discord-templates/${templateId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ testData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send test notification');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Test Sent!',
        description: 'Check your Discord DMs for the test notification',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
