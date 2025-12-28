import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Email preference categories with descriptions
export const EMAIL_CATEGORIES = {
  // Essential (always visible)
  authEmails: {
    label: 'Xác thực & Đăng nhập',
    description: 'Email đăng nhập, mật khẩu, OTP, 2FA',
    icon: '🔐',
    essential: true,
  },
  securityAlerts: {
    label: 'Cảnh báo bảo mật',
    description: 'Hoạt động đáng ngờ, thay đổi mật khẩu',
    icon: '🛡️',
    essential: true,
  },
  
  // Transactions
  orderEmails: {
    label: 'Đơn hàng',
    description: 'Xác nhận đơn, cập nhật trạng thái, giao hàng',
    icon: '📦',
    group: 'transactions',
  },
  paymentEmails: {
    label: 'Thanh toán',
    description: 'Thanh toán thành công/thất bại, nạp tiền, rút tiền',
    icon: '💳',
    group: 'transactions',
  },
  invoiceEmails: {
    label: 'Hóa đơn',
    description: 'Hóa đơn, sao kê tháng',
    icon: '📄',
    group: 'transactions',
  },
  
  // Promotions
  promotionEmails: {
    label: 'Khuyến mãi',
    description: 'Flash sale, sản phẩm mới',
    icon: '🔥',
    group: 'promotions',
  },
  voucherEmails: {
    label: 'Voucher & Quà tặng',
    description: 'Voucher tặng, voucher sắp hết hạn, gift card',
    icon: '🎁',
    group: 'promotions',
  },
  newsletterEmails: {
    label: 'Bản tin',
    description: 'Báo cáo tuần, cập nhật hệ thống',
    icon: '📰',
    group: 'promotions',
  },
  
  // Social
  socialEmails: {
    label: 'Mạng xã hội',
    description: 'Người theo dõi mới, bình luận, đánh giá',
    icon: '👥',
    group: 'social',
  },
  messageEmails: {
    label: 'Tin nhắn & Hỗ trợ',
    description: 'Chat, ticket hỗ trợ, khiếu nại',
    icon: '💬',
    group: 'social',
  },
  
  // Gamification
  rewardEmails: {
    label: 'Phần thưởng',
    description: 'Tích điểm, thành tựu, lên cấp',
    icon: '🏆',
    group: 'gamification',
  },
  checkinEmails: {
    label: 'Điểm danh',
    description: 'Nhắc nhở điểm danh hàng ngày',
    icon: '📅',
    group: 'gamification',
  },
  
  // Features
  auctionEmails: {
    label: 'Đấu giá',
    description: 'Đặt giá, bị vượt giá, thắng/thua',
    icon: '🔨',
    group: 'features',
  },
  groupOrderEmails: {
    label: 'Đơn nhóm',
    description: 'Lời mời tham gia, đủ/thiếu người',
    icon: '👨‍👩‍👧‍👦',
    group: 'features',
  },
  wishlistEmails: {
    label: 'Danh sách yêu thích',
    description: 'Giảm giá, có hàng trở lại',
    icon: '❤️',
    group: 'features',
  },
  cartReminderEmails: {
    label: 'Nhắc giỏ hàng',
    description: 'Giỏ hàng bỏ quên',
    icon: '🛒',
    group: 'features',
  },
  
  // Membership
  primeEmails: {
    label: 'Prime',
    description: 'Kích hoạt, sắp hết hạn, hết hạn',
    icon: '⭐',
    group: 'membership',
  },
  vipEmails: {
    label: 'VIP',
    description: 'Lên hạng VIP, quyền lợi',
    icon: '👑',
    group: 'membership',
  },
  
  // Business
  sellerEmails: {
    label: 'Người bán',
    description: 'Đơn hàng mới, báo cáo, tồn kho',
    icon: '🏪',
    group: 'business',
  },
  affiliateEmails: {
    label: 'Affiliate',
    description: 'Hoa hồng, lên hạng, thanh toán',
    icon: '🤝',
    group: 'business',
  },
  
  // Events
  eventEmails: {
    label: 'Sự kiện',
    description: 'Lời mời, nhắc nhở sự kiện',
    icon: '🎉',
    group: 'events',
  },
} as const;

export const EMAIL_GROUPS = {
  transactions: { label: 'Giao dịch', icon: '💰' },
  promotions: { label: 'Khuyến mãi & Marketing', icon: '📢' },
  social: { label: 'Xã hội & Hỗ trợ', icon: '💬' },
  gamification: { label: 'Trò chơi & Phần thưởng', icon: '🎮' },
  features: { label: 'Tính năng', icon: '⚡' },
  membership: { label: 'Thành viên', icon: '🎖️' },
  business: { label: 'Kinh doanh', icon: '💼' },
  events: { label: 'Sự kiện', icon: '📅' },
};

export type EmailPreferenceKey = keyof typeof EMAIL_CATEGORIES;

export interface EmailPreferences {
  id: string;
  userId: string;
  emailEnabled: boolean;
  authEmails: boolean;
  securityAlerts: boolean;
  orderEmails: boolean;
  paymentEmails: boolean;
  invoiceEmails: boolean;
  promotionEmails: boolean;
  voucherEmails: boolean;
  newsletterEmails: boolean;
  socialEmails: boolean;
  messageEmails: boolean;
  rewardEmails: boolean;
  checkinEmails: boolean;
  auctionEmails: boolean;
  groupOrderEmails: boolean;
  wishlistEmails: boolean;
  cartReminderEmails: boolean;
  primeEmails: boolean;
  vipEmails: boolean;
  sellerEmails: boolean;
  affiliateEmails: boolean;
  eventEmails: boolean;
}

// Get email preferences
export const useEmailPreferences = () => {
  return useQuery({
    queryKey: ['email-preferences'],
    queryFn: async () => {
      const response = await apiClient.get('/users/email-preferences');
      return response as EmailPreferences;
    },
  });
};

// Update email preferences
export const useUpdateEmailPreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<EmailPreferences>) => {
      const response = await apiClient.patch('/users/email-preferences', data);
      return response as EmailPreferences;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['email-preferences'], data);
      toast.success('Đã cập nhật cài đặt email');
    },
    onError: () => {
      toast.error('Không thể cập nhật cài đặt email');
    },
  });
};

// Toggle master switch
export const useToggleAllEmails = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await apiClient.post('/users/email-preferences/toggle-all', { enabled });
      return response as EmailPreferences;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['email-preferences'], data);
      toast.success(data.emailEnabled ? 'Đã bật tất cả email' : 'Đã tắt tất cả email');
    },
    onError: () => {
      toast.error('Không thể cập nhật cài đặt');
    },
  });
};

// Enable all categories
export const useEnableAllCategories = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/users/email-preferences/enable-all-categories');
      return response as EmailPreferences;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['email-preferences'], data);
      toast.success('Đã bật tất cả danh mục');
    },
    onError: () => {
      toast.error('Không thể cập nhật');
    },
  });
};

// Disable all categories (keep essential)
export const useDisableAllCategories = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/users/email-preferences/disable-all-categories');
      return response as EmailPreferences;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['email-preferences'], data);
      toast.success('Đã tắt tất cả (trừ bảo mật)');
    },
    onError: () => {
      toast.error('Không thể cập nhật');
    },
  });
};

// Toggle single preference
export const useToggleEmailPreference = () => {
  const updatePrefs = useUpdateEmailPreferences();
  
  return (key: EmailPreferenceKey, value: boolean) => {
    updatePrefs.mutate({ [key]: value });
  };
};
