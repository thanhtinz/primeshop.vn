import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Mail, History, Code, RefreshCw, Eye, MoreVertical, Languages, Filter } from 'lucide-react';
import { useDateFormat } from '@/hooks/useDateFormat';
import {
  useEmailTemplates,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
  useEmailLogs,
  EmailTemplate,
} from '@/hooks/useEmailTemplates';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExtendedEmailTemplate extends EmailTemplate {
  subject_en?: string | null;
  body_en?: string | null;
  description?: string | null;
  category?: string | null;
}

// Template categories
const TEMPLATE_CATEGORIES = {
  order: 'Đơn hàng',
  user: 'Người dùng',
  referral: 'Affiliate',
  ticket: 'Hỗ trợ',
  auction: 'Đấu giá',
  product: 'Sản phẩm',
  payment: 'Thanh toán',
  other: 'Khác',
} as const;

const defaultTemplates = [
  // Order templates
  { name: 'order_confirmation', description: 'Xác nhận đơn hàng sau khi tạo', descriptionEn: 'Order confirmation after creation', category: 'order' },
  { name: 'payment_success', description: 'Thanh toán thành công', descriptionEn: 'Payment successful', category: 'order' },
  { name: 'payment_failed', description: 'Thanh toán thất bại', descriptionEn: 'Payment failed', category: 'order' },
  { name: 'order_processing', description: 'Đơn hàng đang xử lý', descriptionEn: 'Order processing', category: 'order' },
  { name: 'order_delivered', description: 'Giao nội dung cho khách', descriptionEn: 'Content delivered', category: 'order' },
  { name: 'order_completed', description: 'Đơn hàng hoàn thành', descriptionEn: 'Order completed', category: 'order' },
  { name: 'order_cancelled', description: 'Đơn hàng đã hủy', descriptionEn: 'Order cancelled', category: 'order' },
  { name: 'order_refunded', description: 'Hoàn tiền đơn hàng', descriptionEn: 'Order refunded', category: 'order' },
  
  // User templates
  { name: 'welcome', description: 'Chào mừng người dùng mới', descriptionEn: 'Welcome new user', category: 'user' },
  { name: 'login_notification', description: 'Thông báo đăng nhập mới', descriptionEn: 'New login notification', category: 'user' },
  { name: 'otp_verification', description: 'Gửi mã OTP xác thực', descriptionEn: 'OTP verification', category: 'user' },
  { name: 'password_reset', description: 'Đặt lại mật khẩu', descriptionEn: 'Password reset', category: 'user' },
  { name: 'password_changed', description: 'Mật khẩu đã thay đổi', descriptionEn: 'Password changed', category: 'user' },
  { name: 'email_verification', description: 'Xác thực email', descriptionEn: 'Email verification', category: 'user' },
  
  // Payment templates
  { name: 'deposit_success', description: 'Nạp tiền thành công', descriptionEn: 'Deposit successful', category: 'payment' },
  { name: 'withdrawal_request', description: 'Yêu cầu rút tiền', descriptionEn: 'Withdrawal request', category: 'payment' },
  { name: 'withdrawal_completed', description: 'Rút tiền hoàn tất', descriptionEn: 'Withdrawal completed', category: 'payment' },
  
  // Referral templates
  { name: 'referral_registration_received', description: 'Nhận đăng ký affiliate', descriptionEn: 'Affiliate registration received', category: 'referral' },
  { name: 'referral_approved', description: 'Duyệt đăng ký affiliate', descriptionEn: 'Affiliate approved', category: 'referral' },
  { name: 'referral_rejected', description: 'Từ chối đăng ký affiliate', descriptionEn: 'Affiliate rejected', category: 'referral' },
  { name: 'referral_reward', description: 'Gửi voucher thưởng', descriptionEn: 'Reward voucher sent', category: 'referral' },
  { name: 'referral_commission', description: 'Thông báo hoa hồng', descriptionEn: 'Commission notification', category: 'referral' },
  { name: 'reward_request_received', description: 'Nhận yêu cầu đổi thưởng', descriptionEn: 'Reward request received', category: 'referral' },
  
  // Ticket templates
  { name: 'ticket_created', description: 'Tạo ticket hỗ trợ', descriptionEn: 'Support ticket created', category: 'ticket' },
  { name: 'ticket_reply', description: 'Phản hồi ticket', descriptionEn: 'Ticket reply', category: 'ticket' },
  { name: 'ticket_closed', description: 'Đóng ticket', descriptionEn: 'Ticket closed', category: 'ticket' },
  
  // Auction templates
  { name: 'auction_outbid', description: 'Bị trả giá cao hơn', descriptionEn: 'Outbid notification', category: 'auction' },
  { name: 'auction_won', description: 'Thắng đấu giá', descriptionEn: 'Auction won', category: 'auction' },
  { name: 'auction_ended', description: 'Đấu giá kết thúc', descriptionEn: 'Auction ended', category: 'auction' },
  { name: 'auction_starting_soon', description: 'Đấu giá sắp bắt đầu', descriptionEn: 'Auction starting soon', category: 'auction' },
  
  // Product templates
  { name: 'wishlist_sale', description: 'Sản phẩm yêu thích giảm giá', descriptionEn: 'Wishlist item on sale', category: 'product' },
  { name: 'stock_back', description: 'Sản phẩm có hàng lại', descriptionEn: 'Product back in stock', category: 'product' },
  { name: 'price_drop', description: 'Giá sản phẩm giảm', descriptionEn: 'Price drop alert', category: 'product' },
  
  // Other templates
  { name: 'gift_card_received', description: 'Nhận gift card', descriptionEn: 'Gift card received', category: 'other' },
  { name: 'invoice_sent', description: 'Gửi hóa đơn', descriptionEn: 'Invoice sent', category: 'other' },
  { name: 'vip_upgrade', description: 'Nâng cấp VIP', descriptionEn: 'VIP upgrade', category: 'other' },
  { name: 'vip_expiring', description: 'VIP sắp hết hạn', descriptionEn: 'VIP expiring soon', category: 'other' },
];

const AdminEmail = () => {
  const { language } = useLanguage();
  const { formatDateTime } = useDateFormat();
  const { data: templates, isLoading: templatesLoading, refetch: refetchTemplates } = useEmailTemplates();
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useEmailLogs();
  const createTemplate = useCreateEmailTemplate();
  const updateTemplate = useUpdateEmailTemplate();
  const deleteTemplate = useDeleteEmailTemplate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ExtendedEmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ExtendedEmailTemplate | null>(null);
  const [previewLanguage, setPreviewLanguage] = useState<'vi' | 'en'>('vi');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editLanguage, setEditLanguage] = useState<'vi' | 'en'>('vi');
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    subject_en: '',
    body: '',
    body_en: '',
    variables: '',
    is_active: true,
    category: 'other',
    description: '',
  });

  const openCreateDialog = (templateName?: string) => {
    setEditingTemplate(null);
    const defaultTemplate = defaultTemplates.find(t => t.name === templateName);
    setFormData({
      name: templateName || '',
      subject: '',
      subject_en: '',
      body: getDefaultBody(templateName || '', 'vi'),
      body_en: getDefaultBody(templateName || '', 'en'),
      variables: getDefaultVariables(templateName || ''),
      is_active: true,
      category: defaultTemplate?.category || 'other',
      description: defaultTemplate?.description || '',
    });
    setEditLanguage('vi');
    setDialogOpen(true);
  };

  const openEditDialog = (template: ExtendedEmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      subject_en: template.subject_en || '',
      body: template.body,
      body_en: template.body_en || '',
      variables: template.variables?.join(', ') || '',
      is_active: template.is_active,
      category: template.category || 'other',
      description: template.description || '',
    });
    setEditLanguage('vi');
    setDialogOpen(true);
  };

  const getDefaultBody = (name: string, lang: 'vi' | 'en' = 'vi'): string => {
    const bodiesVi: Record<string, string> = {
      order_confirmation: `Xin chào {{customer_name}},

Cảm ơn bạn đã đặt hàng tại {{site_name}}!

Mã đơn hàng: {{order_number}}
Tổng tiền: {{total_amount}}

Vui lòng hoàn tất thanh toán để chúng tôi xử lý đơn hàng.

Trân trọng,
{{site_name}}`,
      payment_success: `Xin chào {{customer_name}},

Thanh toán cho đơn hàng #{{order_number}} đã thành công!

Số tiền: {{total_amount}}

Chúng tôi sẽ xử lý đơn hàng và thông báo cho bạn sớm nhất.

Trân trọng,
{{site_name}}`,
      payment_failed: `Xin chào {{customer_name}},

Thanh toán cho đơn hàng #{{order_number}} không thành công.

Vui lòng thử lại hoặc liên hệ với chúng tôi để được hỗ trợ.

Trân trọng,
{{site_name}}`,
      order_processing: `Xin chào {{customer_name}},

Đơn hàng #{{order_number}} của bạn đang được xử lý.

Chúng tôi sẽ thông báo ngay khi có nội dung giao hàng.

Trân trọng,
{{site_name}}`,
      order_delivered: `Xin chào {{customer_name}},

Đơn hàng #{{order_number}} của bạn đã được giao!

Nội dung giao hàng:
{{delivery_content}}

Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.

Trân trọng,
{{site_name}}`,
      order_completed: `Xin chào {{customer_name}},

Đơn hàng #{{order_number}} đã hoàn thành!

Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của chúng tôi.

Trân trọng,
{{site_name}}`,
      order_cancelled: `Xin chào {{customer_name}},

Đơn hàng #{{order_number}} đã bị hủy.

Nếu bạn cần hỗ trợ thêm, vui lòng liên hệ với chúng tôi.

Trân trọng,
{{site_name}}`,
      order_refunded: `Xin chào {{customer_name}},

Đơn hàng #{{order_number}} đã được hoàn tiền thành công.

Số tiền hoàn: {{refund_amount}}
Lý do: {{refund_reason}}
Thời gian: {{date}}

Lưu ý: Thời gian tiền về tài khoản phụ thuộc vào ngân hàng (1-7 ngày làm việc).

Trân trọng,
{{site_name}}`,
      welcome: `Xin chào {{full_name}},

Chào mừng bạn đến với {{site_name}}!

Tài khoản của bạn đã được tạo thành công. Bắt đầu khám phá các sản phẩm tuyệt vời ngay bây giờ.

Đăng nhập tại: {{login_url}}

Trân trọng,
{{site_name}}`,
      login_notification: `Xin chào {{full_name}},

Tài khoản của bạn vừa được đăng nhập.

Thời gian: {{login_time}}
Thiết bị: {{device}}
Địa điểm: {{location}}

Nếu không phải bạn, vui lòng đổi mật khẩu ngay.

Trân trọng,
{{site_name}}`,
      otp_verification: `Xin chào {{full_name}},

Mã xác thực OTP của bạn là: {{otp_code}}

Mã này có hiệu lực trong {{expiry_minutes}} phút.

Không chia sẻ mã này với bất kỳ ai.

Trân trọng,
{{site_name}}`,
      password_reset: `Xin chào {{full_name}},

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.

Nhấn vào link sau để đặt lại mật khẩu:
{{reset_url}}

Link này sẽ hết hạn sau 24 giờ.

Nếu bạn không yêu cầu, vui lòng bỏ qua email này.

Trân trọng,
{{site_name}}`,
      deposit_success: `Xin chào {{full_name}},

Nạp tiền thành công!

Số tiền nạp: {{amount}}
Số dư hiện tại: {{balance}}

Cảm ơn bạn đã sử dụng dịch vụ.

Trân trọng,
{{site_name}}`,
      referral_registration_received: `Xin chào {{full_name}},

Cảm ơn bạn đã đăng ký tham gia chương trình Affiliate!

Chúng tôi đã nhận được yêu cầu và đang xem xét. Bạn sẽ nhận được thông báo kết quả sớm.

Trân trọng,
{{site_name}}`,
      referral_approved: `Xin chào {{full_name}},

Chúc mừng! Yêu cầu tham gia chương trình Affiliate của bạn đã được duyệt!

Mã giới thiệu của bạn: {{referral_code}}

Hãy chia sẻ mã này cho bạn bè để nhận hoa hồng.

Trân trọng,
{{site_name}}`,
      referral_rejected: `Xin chào {{full_name}},

Rất tiếc, yêu cầu tham gia chương trình Affiliate của bạn chưa được duyệt.

Lý do: {{reason}}

Bạn có thể đăng ký lại sau.

Trân trọng,
{{site_name}}`,
      ticket_created: `Xin chào {{full_name}},

Ticket hỗ trợ của bạn đã được tạo thành công!

Mã ticket: {{ticket_number}}
Tiêu đề: {{subject}}

Chúng tôi sẽ phản hồi sớm nhất có thể.

Trân trọng,
{{site_name}}`,
      ticket_reply: `Xin chào {{full_name}},

Ticket #{{ticket_number}} của bạn có phản hồi mới!

Tiêu đề: {{subject}}

Vui lòng đăng nhập để xem chi tiết.

Trân trọng,
{{site_name}}`,
      auction_outbid: `Xin chào {{customer_name}},

Bạn đã bị trả giá cao hơn trong phiên đấu giá!

Sản phẩm: {{auction_title}}
Giá của bạn: {{your_bid}}
Giá hiện tại: {{current_price}}

Đặt giá mới tại: {{auction_url}}

Trân trọng,
{{site_name}}`,
      auction_won: `Xin chào {{customer_name}},

Chúc mừng! Bạn đã thắng đấu giá!

Sản phẩm: {{auction_title}}
Giá thắng: {{winning_price}}

Thanh toán ngay tại: {{payment_url}}

Trân trọng,
{{site_name}}`,
      gift_card_received: `Xin chào {{recipient_name}},

Bạn đã nhận được một Gift Card từ {{sender_name}}!

Giá trị: {{amount}}
Mã Gift Card: {{gift_code}}

Lời nhắn: {{message}}

Sử dụng tại: {{redeem_url}}

Trân trọng,
{{site_name}}`,
      invoice_sent: `Xin chào {{customer_name}},

Hóa đơn cho đơn hàng #{{order_number}} đã được gửi.

Tổng tiền: {{total_amount}}
Ngày tạo: {{created_date}}

Xem hóa đơn: {{invoice_link}}

Trân trọng,
{{site_name}}`,
      vip_upgrade: `Xin chào {{full_name}},

Chúc mừng! Bạn đã được nâng cấp lên {{vip_level}}!

Ưu đãi của bạn:
- Giảm giá {{discount_percent}}% cho tất cả đơn hàng
- Hỗ trợ ưu tiên
- Và nhiều đặc quyền khác

Trân trọng,
{{site_name}}`,
    };

    const bodiesEn: Record<string, string> = {
      order_confirmation: `Hello {{customer_name}},

Thank you for ordering at {{site_name}}!

Order number: {{order_number}}
Total: {{total_amount}}

Please complete payment for us to process your order.

Best regards,
{{site_name}}`,
      payment_success: `Hello {{customer_name}},

Payment for order #{{order_number}} was successful!

Amount: {{total_amount}}

We will process your order and notify you soon.

Best regards,
{{site_name}}`,
      payment_failed: `Hello {{customer_name}},

Payment for order #{{order_number}} failed.

Please try again or contact us for support.

Best regards,
{{site_name}}`,
      order_processing: `Hello {{customer_name}},

Your order #{{order_number}} is being processed.

We will notify you once delivery content is ready.

Best regards,
{{site_name}}`,
      order_delivered: `Hello {{customer_name}},

Your order #{{order_number}} has been delivered!

Delivery content:
{{delivery_content}}

If you have any questions, please contact us.

Best regards,
{{site_name}}`,
      order_completed: `Hello {{customer_name}},

Order #{{order_number}} has been completed!

Thank you for using our service.

Best regards,
{{site_name}}`,
      order_cancelled: `Hello {{customer_name}},

Order #{{order_number}} has been cancelled.

If you need further assistance, please contact us.

Best regards,
{{site_name}}`,
      order_refunded: `Hello {{customer_name}},

Order #{{order_number}} has been refunded successfully.

Refund amount: {{refund_amount}}
Reason: {{refund_reason}}
Date: {{date}}

Note: Refund processing time depends on your bank (1-7 business days).

Best regards,
{{site_name}}`,
      welcome: `Hello {{full_name}},

Welcome to {{site_name}}!

Your account has been created successfully. Start exploring our amazing products now.

Login at: {{login_url}}

Best regards,
{{site_name}}`,
      login_notification: `Hello {{full_name}},

Your account was just logged in.

Time: {{login_time}}
Device: {{device}}
Location: {{location}}

If this wasn't you, please change your password immediately.

Best regards,
{{site_name}}`,
      otp_verification: `Hello {{full_name}},

Your OTP verification code is: {{otp_code}}

This code is valid for {{expiry_minutes}} minutes.

Do not share this code with anyone.

Best regards,
{{site_name}}`,
      password_reset: `Hello {{full_name}},

We received a request to reset your password.

Click the link below to reset your password:
{{reset_url}}

This link will expire in 24 hours.

If you didn't request this, please ignore this email.

Best regards,
{{site_name}}`,
      deposit_success: `Hello {{full_name}},

Deposit successful!

Amount deposited: {{amount}}
Current balance: {{balance}}

Thank you for using our service.

Best regards,
{{site_name}}`,
      referral_registration_received: `Hello {{full_name}},

Thank you for applying to our Affiliate program!

We have received your application and are reviewing it. You will receive a notification soon.

Best regards,
{{site_name}}`,
      referral_approved: `Hello {{full_name}},

Congratulations! Your Affiliate application has been approved!

Your referral code: {{referral_code}}

Share this code with friends to earn commission.

Best regards,
{{site_name}}`,
      referral_rejected: `Hello {{full_name}},

Unfortunately, your Affiliate application was not approved.

Reason: {{reason}}

You can apply again later.

Best regards,
{{site_name}}`,
      ticket_created: `Hello {{full_name}},

Your support ticket has been created!

Ticket number: {{ticket_number}}
Subject: {{subject}}

We will respond as soon as possible.

Best regards,
{{site_name}}`,
      ticket_reply: `Hello {{full_name}},

Your ticket #{{ticket_number}} has a new reply!

Subject: {{subject}}

Please login to view details.

Best regards,
{{site_name}}`,
      auction_outbid: `Hello {{customer_name}},

You have been outbid!

Product: {{auction_title}}
Your bid: {{your_bid}}
Current price: {{current_price}}

Place a new bid at: {{auction_url}}

Best regards,
{{site_name}}`,
      auction_won: `Hello {{customer_name}},

Congratulations! You won the auction!

Product: {{auction_title}}
Winning price: {{winning_price}}

Pay now at: {{payment_url}}

Best regards,
{{site_name}}`,
      gift_card_received: `Hello {{recipient_name}},

You received a Gift Card from {{sender_name}}!

Value: {{amount}}
Gift Card code: {{gift_code}}

Message: {{message}}

Use at: {{redeem_url}}

Best regards,
{{site_name}}`,
      invoice_sent: `Hello {{customer_name}},

Invoice for order #{{order_number}} has been sent.

Total: {{total_amount}}
Date: {{created_date}}

View invoice: {{invoice_link}}

Best regards,
{{site_name}}`,
      vip_upgrade: `Hello {{full_name}},

Congratulations! You have been upgraded to {{vip_level}}!

Your benefits:
- {{discount_percent}}% off all orders
- Priority support
- And many more perks

Best regards,
{{site_name}}`,
    };

    return lang === 'en' ? (bodiesEn[name] || '') : (bodiesVi[name] || '');
  };

  const getDefaultVariables = (name: string): string => {
    const vars: Record<string, string> = {
      order_confirmation: 'customer_name, order_number, total_amount, site_name',
      payment_success: 'customer_name, order_number, total_amount, site_name',
      payment_failed: 'customer_name, order_number, site_name',
      order_processing: 'customer_name, order_number, site_name',
      order_delivered: 'customer_name, order_number, delivery_content, site_name',
      order_completed: 'customer_name, order_number, site_name',
      order_cancelled: 'customer_name, order_number, site_name',
      order_refunded: 'customer_name, order_number, refund_amount, refund_reason, date, site_name',
      welcome: 'full_name, login_url, site_name',
      login_notification: 'full_name, login_time, device, location, site_name',
      otp_verification: 'full_name, otp_code, expiry_minutes, site_name',
      password_reset: 'full_name, reset_url, site_name',
      password_changed: 'full_name, site_name',
      email_verification: 'full_name, verify_url, site_name',
      deposit_success: 'full_name, amount, balance, site_name',
      withdrawal_request: 'full_name, amount, site_name',
      withdrawal_completed: 'full_name, amount, site_name',
      referral_registration_received: 'full_name, site_name',
      referral_approved: 'full_name, referral_code, site_name',
      referral_rejected: 'full_name, reason, site_name',
      referral_reward: 'full_name, amount, voucher_code, site_name',
      referral_commission: 'full_name, commission_amount, order_number, site_name',
      reward_request_received: 'full_name, amount, site_name',
      ticket_created: 'full_name, ticket_number, subject, site_name',
      ticket_reply: 'full_name, ticket_number, subject, site_name',
      ticket_closed: 'full_name, ticket_number, subject, site_name',
      auction_outbid: 'customer_name, auction_title, your_bid, current_price, auction_url, site_name',
      auction_won: 'customer_name, auction_title, winning_price, payment_url, site_name',
      auction_ended: 'customer_name, auction_title, final_price, site_name',
      auction_starting_soon: 'customer_name, auction_title, start_time, auction_url, site_name',
      wishlist_sale: 'customer_name, product_name, original_price, sale_price, discount_percent, product_url, site_name',
      stock_back: 'customer_name, product_name, product_url, site_name',
      price_drop: 'customer_name, product_name, old_price, new_price, product_url, site_name',
      gift_card_received: 'recipient_name, sender_name, amount, message, gift_code, redeem_url, site_name',
      gift_card_used: 'full_name, amount, order_number, site_name',
      invoice_sent: 'customer_name, order_number, total_amount, created_date, invoice_link, site_name',
      vip_upgrade: 'full_name, vip_level, discount_percent, site_name',
      vip_expiring: 'full_name, vip_level, expiry_date, site_name',
    };
    return vars[name] || 'site_name';
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.subject || !formData.body) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const data: Record<string, unknown> = {
      name: formData.name,
      subject: formData.subject,
      body: formData.body,
      variables: formData.variables ? formData.variables.split(',').map(v => v.trim()) : null,
      is_active: formData.is_active,
    };

    // Add English versions if provided
    if (formData.subject_en) {
      data.subject_en = formData.subject_en;
    }
    if (formData.body_en) {
      data.body_en = formData.body_en;
    }
    if (formData.category) {
      data.category = formData.category;
    }
    if (formData.description) {
      data.description = formData.description;
    }

    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({ id: editingTemplate.id, ...data } as Parameters<typeof updateTemplate.mutateAsync>[0]);
        toast.success('Đã cập nhật template');
      } else {
        await createTemplate.mutateAsync(data as Parameters<typeof createTemplate.mutateAsync>[0]);
        toast.success('Đã tạo template mới');
      }
      setDialogOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa template này?')) return;
    try {
      await deleteTemplate.mutateAsync(id);
      toast.success('Đã xóa template');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  const openPreview = (template: ExtendedEmailTemplate) => {
    setPreviewTemplate(template);
    setPreviewLanguage('vi');
    setPreviewOpen(true);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'sent') return <Badge className="bg-green-100 text-green-700">Đã gửi</Badge>;
    if (status === 'failed') return <Badge variant="destructive">Thất bại</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      order: 'bg-blue-100 text-blue-700',
      user: 'bg-purple-100 text-purple-700',
      referral: 'bg-green-100 text-green-700',
      ticket: 'bg-orange-100 text-orange-700',
      auction: 'bg-red-100 text-red-700',
      product: 'bg-pink-100 text-pink-700',
      payment: 'bg-emerald-100 text-emerald-700',
      other: 'bg-gray-100 text-gray-700',
    };
    return (
      <Badge className={colors[category] || colors.other}>
        {TEMPLATE_CATEGORIES[category as keyof typeof TEMPLATE_CATEGORIES] || category}
      </Badge>
    );
  };

  const missingTemplates = defaultTemplates.filter(
    dt => !templates?.find(t => t.name === dt.name)
  );

  const filteredTemplates = templates?.filter(t => {
    if (categoryFilter === 'all') return true;
    return (t as ExtendedEmailTemplate).category === categoryFilter;
  });

  const filteredMissingTemplates = missingTemplates.filter(t => {
    if (categoryFilter === 'all') return true;
    return t.category === categoryFilter;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">Quản lý Email</h1>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="templates" className="gap-2 flex-1 sm:flex-none">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
            <span className="sm:hidden">Mail</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2 flex-1 sm:flex-none">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Lịch sử</span>
            <span className="sm:hidden">Logs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lọc theo danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {Object.entries(TEMPLATE_CATEGORIES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Missing Templates Warning */}
          {filteredMissingTemplates.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm sm:text-base text-yellow-800 dark:text-yellow-200">
                  Thiếu email templates ({filteredMissingTemplates.length})
                </CardTitle>
                <CardDescription className="text-yellow-700 dark:text-yellow-300 text-xs sm:text-sm">
                  Nhấn để tạo template với nội dung mẫu:
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {filteredMissingTemplates.slice(0, 10).map(mt => (
                  <Button
                    key={mt.name}
                    variant="outline"
                    size="sm"
                    onClick={() => openCreateDialog(mt.name)}
                    className="text-xs"
                    title={mt.description}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {mt.name}
                  </Button>
                ))}
                {filteredMissingTemplates.length > 10 && (
                  <Badge variant="secondary" className="text-xs">
                    +{filteredMissingTemplates.length - 10} khác
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}

          {/* Templates List */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3">
              <div>
                <CardTitle className="text-base sm:text-lg">Email Templates</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {filteredTemplates?.length || 0} template • Hỗ trợ đa ngôn ngữ (VI/EN)
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchTemplates()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => openCreateDialog()}>
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Tạo mới</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              {templatesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {/* Mobile */}
                  <div className="sm:hidden divide-y">
                    {filteredTemplates?.map((template) => {
                      const ext = template as ExtendedEmailTemplate;
                      return (
                        <div key={template.id} className="flex items-center gap-1.5 px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-mono text-[11px] font-medium truncate">{template.name}</p>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${template.is_active ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                              {ext.body_en && <Languages className="h-3 w-3 text-blue-500" />}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover">
                              <DropdownMenuItem onClick={() => openPreview(ext)}>
                                <Eye className="h-4 w-4 mr-2" /> Xem
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(ext)}>
                                <Edit className="h-4 w-4 mr-2" /> Sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(template.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" /> Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })}
                    {(!filteredTemplates || filteredTemplates.length === 0) && (
                      <div className="py-4 text-center text-muted-foreground text-xs">
                        Chưa có template nào
                      </div>
                    )}
                  </div>
                  {/* Desktop */}
                  <Table className="hidden sm:table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên template</TableHead>
                        <TableHead>Tiêu đề</TableHead>
                        <TableHead>Danh mục</TableHead>
                        <TableHead>Ngôn ngữ</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTemplates?.map((template) => {
                        const ext = template as ExtendedEmailTemplate;
                        return (
                          <TableRow key={template.id}>
                            <TableCell className="font-mono text-sm">{template.name}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{template.subject}</TableCell>
                            <TableCell>
                              {getCategoryBadge(ext.category || 'other')}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Badge variant="outline" className="text-xs">VI</Badge>
                                {ext.body_en && (
                                  <Badge variant="outline" className="text-xs bg-blue-50">EN</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={template.is_active ? 'default' : 'secondary'}>
                                {template.is_active ? 'Hoạt động' : 'Tắt'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openPreview(ext)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(ext)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {(!filteredTemplates || filteredTemplates.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Chưa có template nào
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>

          {/* Variables Guide */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Code className="h-4 w-4" />
                Hướng dẫn sử dụng biến
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs sm:text-sm text-muted-foreground space-y-2">
              <p>Sử dụng cú pháp <code className="bg-muted px-1 py-0.5 rounded">{'{{variable_name}}'}</code> để chèn biến động.</p>
              <div className="mt-3">
                <p className="font-medium text-foreground mb-2">Các biến phổ biến:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {['customer_name', 'full_name', 'order_number', 'total_amount', 'delivery_content', 'site_name', 'referral_code', 'voucher_code', 'date'].map(v => (
                    <code key={v} className="bg-muted px-2 py-1 rounded text-xs">{`{{${v}}}`}</code>
                  ))}
                </div>
              </div>
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="font-medium text-blue-800 dark:text-blue-200 text-sm">💡 Hỗ trợ đa ngôn ngữ</p>
                <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                  Thêm nội dung tiếng Anh (subject_en, body_en) để email tự động gửi theo ngôn ngữ người dùng chọn.
                </p>
              </div>
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="font-medium text-green-800 dark:text-green-200 text-sm">📧 Mail Server Nội bộ</p>
                <p className="text-green-700 dark:text-green-300 text-xs mt-1">
                  Email tự động được gửi qua hệ thống Mail Server nội bộ. Admin có thể xem tất cả email đã gửi tại <a href="/admin/mail-server" className="underline font-medium">Mail Server</a>.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3">
              <div>
                <CardTitle className="text-base sm:text-lg">Lịch sử gửi email</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Email tự động được gửi qua Mail Server nội bộ</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchLogs()} className="w-full sm:w-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Làm mới
              </Button>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              {logsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {/* Mobile */}
                  <div className="sm:hidden space-y-3 p-4">
                    {logs?.map((log) => (
                      <div key={log.id} className="border rounded-lg p-3 space-y-1">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{log.recipient}</p>
                            <p className="text-xs text-muted-foreground truncate">{log.subject}</p>
                          </div>
                          {getStatusBadge(log.status)}
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>{formatDateTime(log.created_at)}</span>
                          {log.template_name && (
                            <Badge variant="outline" className="font-mono text-xs">
                              {log.template_name}
                            </Badge>
                          )}
                        </div>
                        {log.error_message && (
                          <p className="text-xs text-red-500">{log.error_message}</p>
                        )}
                      </div>
                    ))}
                    {(!logs || logs.length === 0) && (
                      <div className="py-8 text-center text-muted-foreground">
                        Chưa có email nào được gửi
                      </div>
                    )}
                  </div>
                  {/* Desktop */}
                  <Table className="hidden sm:table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Thời gian</TableHead>
                        <TableHead>Người nhận</TableHead>
                        <TableHead>Tiêu đề</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs?.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDateTime(log.created_at)}
                          </TableCell>
                          <TableCell className="font-medium">{log.recipient}</TableCell>
                          <TableCell>{log.subject}</TableCell>
                          <TableCell>
                            {log.template_name && (
                              <Badge variant="outline" className="font-mono text-xs">
                                {log.template_name}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(log.status)}
                            {log.error_message && (
                              <p className="text-xs text-red-500 mt-1">{log.error_message}</p>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!logs || logs.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Chưa có email nào được gửi
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Chỉnh sửa template' : 'Tạo template mới'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tên template *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="vd: order_confirmation"
                  disabled={!!editingTemplate}
                />
              </div>
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEMPLATE_CATEGORIES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <Languages className="h-4 w-4" />
              <span className="text-sm font-medium">Ngôn ngữ:</span>
              <Button
                variant={editLanguage === 'vi' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setEditLanguage('vi')}
              >
                Tiếng Việt
              </Button>
              <Button
                variant={editLanguage === 'en' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setEditLanguage('en')}
              >
                English
              </Button>
            </div>

            {editLanguage === 'vi' ? (
              <>
                <div className="space-y-2">
                  <Label>Tiêu đề email (VI) *</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="vd: Xác nhận đơn hàng {{order_number}}"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nội dung email (VI) *</Label>
                  <Textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    rows={12}
                    placeholder="Nội dung email tiếng Việt..."
                    className="font-mono text-sm"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Subject (EN)</Label>
                  <Input
                    value={formData.subject_en}
                    onChange={(e) => setFormData({ ...formData, subject_en: e.target.value })}
                    placeholder="e.g: Order confirmation {{order_number}}"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Body (EN)</Label>
                  <Textarea
                    value={formData.body_en}
                    onChange={(e) => setFormData({ ...formData, body_en: e.target.value })}
                    rows={12}
                    placeholder="Email content in English..."
                    className="font-mono text-sm"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Các biến (phân cách bằng dấu phẩy)</Label>
              <Input
                value={formData.variables}
                onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                placeholder="customer_name, order_number, ..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Kích hoạt template</Label>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createTemplate.isPending || updateTemplate.isPending}
              >
                {editingTemplate ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>Xem trước: {previewTemplate?.name}</span>
            </DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              {/* Language Toggle for Preview */}
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                <Button
                  variant={previewLanguage === 'vi' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewLanguage('vi')}
                >
                  Tiếng Việt
                </Button>
                <Button
                  variant={previewLanguage === 'en' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewLanguage('en')}
                  disabled={!previewTemplate.body_en}
                >
                  English {!previewTemplate.body_en && '(N/A)'}
                </Button>
              </div>

              <div>
                <Label className="text-muted-foreground">Tiêu đề</Label>
                <p className="font-medium">
                  {previewLanguage === 'en' && previewTemplate.subject_en
                    ? previewTemplate.subject_en
                    : previewTemplate.subject}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Nội dung</Label>
                <div className="mt-2 p-4 bg-muted rounded-lg whitespace-pre-wrap font-mono text-sm">
                  {previewLanguage === 'en' && previewTemplate.body_en
                    ? previewTemplate.body_en
                    : previewTemplate.body}
                </div>
              </div>
              {previewTemplate.variables && previewTemplate.variables.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Các biến</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {previewTemplate.variables.map(v => (
                      <Badge key={v} variant="outline">{`{{${v}}}`}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEmail;
