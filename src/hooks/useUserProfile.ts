import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Helper to check if file is GIF
const isGifFile = (file: File): boolean => {
  return file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
};

// Helper to check if user has any active Prime subscription (Basic or Boost)
const hasActivePrime = (profile: any): boolean => {
  return profile?.has_prime_boost && 
         profile?.prime_expires_at && 
         new Date(profile.prime_expires_at) > new Date();
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check GIF restriction for non-Prime users (both Basic and Boost can use GIF)
      if (isGifFile(file) && !hasActivePrime(profile)) {
        throw new Error('Chỉ thành viên Prime mới được sử dụng ảnh GIF');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: `${publicUrl}?t=${Date.now()}` })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Cập nhật avatar thành công');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể cập nhật avatar');
    },
  });
};

export const useUploadBanner = () => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check GIF restriction for non-Prime users (both Basic and Boost can use GIF)
      if (isGifFile(file) && !hasActivePrime(profile)) {
        throw new Error('Chỉ thành viên Prime mới được sử dụng ảnh GIF');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/banner.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('user-banners')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-banners')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ banner_url: `${publicUrl}?t=${Date.now()}` })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Cập nhật banner thành công');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể cập nhật banner');
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: { full_name?: string; phone?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Cập nhật thông tin thành công');
    },
    onError: () => {
      toast.error('Không thể cập nhật thông tin');
    },
  });
};
