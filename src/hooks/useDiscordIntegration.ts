// Custom hook for Discord integration
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useToast } from './use-toast';

interface DiscordPreferences {
  isLinked: boolean;
  discordId: string | null;
  linkedAt: string | null;
  preferences: {
    orderNotifications: boolean;
    paymentNotifications: boolean;
    accountNotifications: boolean;
    systemNotifications: boolean;
    securityNotifications: boolean;
    socialNotifications: boolean;
    marketplaceNotifications: boolean;
  };
}

export const useDiscordPreferences = () => {
  return useQuery({
    queryKey: ['discord-preferences'],
    queryFn: async (): Promise<DiscordPreferences> => {
      const response = await fetch(`${apiClient}/discord/preferences`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch Discord preferences');
      return response.json();
    },
  });
};

export const useLinkDiscord = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (discordId: string) => {
      const response = await fetch(`${apiClient}/discord/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ discordId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to link Discord');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discord-preferences'] });
      toast({
        title: 'Success',
        description: 'Discord account linked successfully! Check your DMs for a welcome message.',
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

export const useUnlinkDiscord = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`${apiClient}/discord/unlink`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to unlink Discord');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discord-preferences'] });
      toast({
        title: 'Success',
        description: 'Discord account unlinked successfully',
      });
    },
  });
};

export const useUpdateDiscordPreferences = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (preferences: DiscordPreferences['preferences']) => {
      const response = await fetch(`${apiClient}/discord/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) throw new Error('Failed to update preferences');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discord-preferences'] });
      toast({
        title: 'Success',
        description: 'Discord notification preferences updated',
      });
    },
  });
};

export const useTestDiscordNotification = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`${apiClient}/discord/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
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

export const useDiscordBotStatus = () => {
  return useQuery({
    queryKey: ['discord-bot-status'],
    queryFn: async () => {
      const response = await fetch(`${apiClient}/discord/status`);
      if (!response.ok) throw new Error('Failed to fetch bot status');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
