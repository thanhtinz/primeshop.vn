// Hooks for User Profile - MySQL version
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { storage } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper to check if file is GIF
const isGifFile = (file: File): boolean => {
  return file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
};

// Helper to check if user has any active Prime subscription
const hasActivePrime = (profile: any): boolean => {
  return profile?.hasPrimeBoost && 
         profile?.primeExpiresAt && 
         new Date(profile.primeExpiresAt) > new Date();
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  const { user, profile, refreshProfile } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check GIF restriction for non-Prime users
      if (isGifFile(file) && !hasActivePrime(profile)) {
        throw new Error('Chỉ thành viên Prime mới được sử dụng ảnh GIF');
      }

      // Upload via API
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_URL}/upload/image?folder=avatars/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      
      // Update profile with new avatar URL
      const updateResponse = await fetch(`${API_URL}/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ avatarUrl: data.url }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update profile');
      }

      return data.url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      refreshProfile?.();
      toast.success('Cập nhật avatar thành công');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể cập nhật avatar');
    },
  });
};

export const useUploadBanner = () => {
  const queryClient = useQueryClient();
  const { user, profile, refreshProfile } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check GIF restriction for non-Prime users
      if (isGifFile(file) && !hasActivePrime(profile)) {
        throw new Error('Chỉ thành viên Prime mới được sử dụng ảnh GIF');
      }

      // Upload via API
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_URL}/upload/image?folder=banners/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      
      // Update profile with new banner URL
      const updateResponse = await fetch(`${API_URL}/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ bannerUrl: data.url }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update profile');
      }

      return data.url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      refreshProfile?.();
      toast.success('Cập nhật banner thành công');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể cập nhật banner');
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user, refreshProfile } = useAuth();

  return useMutation({
    mutationFn: async (updates: { 
      fullName?: string; 
      displayName?: string;
      phone?: string;
      bio?: string;
      // Legacy support
      full_name?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          displayName: updates.displayName || updates.fullName || updates.full_name,
          phone: updates.phone,
          bio: updates.bio,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Update failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      refreshProfile?.();
      toast.success('Cập nhật thông tin thành công');
    },
    onError: () => {
      toast.error('Không thể cập nhật thông tin');
    },
  });
};

export const useUpdateUsername = () => {
  const queryClient = useQueryClient();
  const { user, refreshProfile } = useAuth();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Update failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      refreshProfile?.();
      toast.success('Cập nhật username thành công');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể cập nhật username');
    },
  });
};

export const useUpdateNickname = () => {
  const queryClient = useQueryClient();
  const { user, refreshProfile } = useAuth();

  return useMutation({
    mutationFn: async (nickname: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ nickname }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Update failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      refreshProfile?.();
      toast.success('Cập nhật nickname thành công');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể cập nhật nickname');
    },
  });
};
