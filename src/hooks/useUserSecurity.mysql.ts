// Hooks for User Security - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, auth } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Helper to create notification
const createSecurityNotification = async (
  userId: string,
  title: string,
  message: string,
  link?: string
) => {
  await db.from('notifications').insert({
    userId,
    type: 'security',
    title,
    message,
    link,
  });
};

interface LoginHistory {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  location: string | null;
  loginAt: string;
  isSuspicious: boolean;
  // Legacy mappings
  user_id?: string;
  ip_address?: string | null;
  user_agent?: string | null;
  device_type?: string | null;
  login_at?: string;
  is_suspicious?: boolean;
}

const mapLoginToLegacy = (l: any): LoginHistory => ({
  ...l,
  user_id: l.userId,
  ip_address: l.ipAddress,
  user_agent: l.userAgent,
  device_type: l.deviceType,
  login_at: l.loginAt,
  is_suspicious: l.isSuspicious,
});

export const useLoginHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['loginHistory', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await db
        .from<any>('login_history')
        .select('*')
        .eq('userId', user.id)
        .order('loginAt', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []).map(mapLoginToLegacy) as LoginHistory[];
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

      const { error } = await db
        .from('profiles')
        .update({ loginNotificationEnabled: enabled })
        .eq('id', user.id);

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
      const { error } = await auth.resetPassword(email);
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
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const { error } = await auth.changePassword(currentPassword, newPassword);
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
      const { error } = await db.from('login_history').insert({
        userId,
        userAgent,
        deviceType,
        browser,
        os,
      });

      if (error) throw error;

      // Check if login notification is enabled and create notification
      const { data: profile } = await db
        .from<any>('profiles')
        .select('loginNotificationEnabled')
        .eq('id', userId)
        .single();

      if (profile?.loginNotificationEnabled) {
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
