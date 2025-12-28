import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Helper to create notification (inline to avoid circular dependency)
const createSecurityNotification = async (
  userId: string,
  title: string,
  message: string,
  link?: string
) => {
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'security',
      title,
      message,
      link,
    });
};

interface LoginHistory {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  location: string | null;
  login_at: string;
  is_suspicious: boolean;
}

export const useLoginHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['loginHistory', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('login_history')
        .select('*')
        .eq('user_id', user.id)
        .order('login_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as LoginHistory[];
    },
    enabled: !!user?.id,
  });
};

export const useToggleLoginNotification = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ login_notification_enabled: enabled })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Đã cập nhật cài đặt thông báo');
    },
    onError: () => {
      toast.error('Không thể cập nhật cài đặt');
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Email đặt lại mật khẩu đã được gửi');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể gửi email đặt lại mật khẩu');
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      // First verify current password by re-authenticating
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('User not found');

      // Try to sign in with current password to verify
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Mật khẩu hiện tại không đúng');
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Mật khẩu đã được thay đổi thành công');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể thay đổi mật khẩu');
    },
  });
};

export const useRecordLogin = () => {
  return useMutation({
    mutationFn: async (userId: string) => {
      // Get basic browser info
      const userAgent = navigator.userAgent;
      const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
      const deviceType = isMobile ? 'Mobile' : 'Desktop';
      
      // Simple browser detection
      let browser = 'Unknown';
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';

      // Simple OS detection
      let os = 'Unknown';
      if (userAgent.includes('Windows')) os = 'Windows';
      else if (userAgent.includes('Mac')) os = 'macOS';
      else if (userAgent.includes('Linux')) os = 'Linux';
      else if (userAgent.includes('Android')) os = 'Android';
      else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

      // Record login
      const { error } = await supabase
        .from('login_history')
        .insert({
          user_id: userId,
          user_agent: userAgent,
          device_type: deviceType,
          browser,
          os,
        });

      if (error) throw error;

      // Check if login notification is enabled and create notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('login_notification_enabled')
        .eq('user_id', userId)
        .single();

      if (profile?.login_notification_enabled) {
        try {
          await createSecurityNotification(
            userId,
            'Đăng nhập mới',
            `Tài khoản của bạn vừa được đăng nhập từ ${browser} trên ${os} (${deviceType})`,
            '/profile'
          );
        } catch (e) {
          console.log('Failed to create login notification:', e);
        }
      }
    },
  });
};
