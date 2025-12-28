-- Insert default email templates
INSERT INTO public.email_templates (name, subject, body, variables, is_active) VALUES
('order_confirmation', 'Xác nhận đơn hàng #{{order_number}}', 'Xin chào {{customer_name}},

Cảm ơn bạn đã đặt hàng tại {{site_name}}!

Mã đơn hàng: {{order_number}}
Email: {{customer_email}}
Tổng tiền: {{total_amount}}

Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất.

Trân trọng,
{{site_name}}', ARRAY['order_number', 'customer_name', 'customer_email', 'total_amount', 'site_name'], true),

('payment_success', 'Thanh toán thành công - Đơn hàng #{{order_number}}', 'Xin chào {{customer_name}},

Chúng tôi đã nhận được thanh toán cho đơn hàng #{{order_number}}.

Số tiền: {{total_amount}}
Phương thức: {{payment_method}}

Đơn hàng của bạn đang được xử lý.

Trân trọng,
{{site_name}}', ARRAY['order_number', 'customer_name', 'total_amount', 'payment_method', 'site_name'], true),

('payment_failed', 'Thanh toán thất bại - Đơn hàng #{{order_number}}', 'Xin chào {{customer_name}},

Rất tiếc, thanh toán cho đơn hàng #{{order_number}} không thành công.

Vui lòng thử lại hoặc liên hệ hỗ trợ nếu cần giúp đỡ.

Trân trọng,
{{site_name}}', ARRAY['order_number', 'customer_name', 'site_name'], true),

('order_processing', 'Đơn hàng #{{order_number}} đang được xử lý', 'Xin chào {{customer_name}},

Đơn hàng #{{order_number}} của bạn đang được xử lý.

Chúng tôi sẽ thông báo khi đơn hàng sẵn sàng giao.

Trân trọng,
{{site_name}}', ARRAY['order_number', 'customer_name', 'site_name'], true),

('order_delivered', 'Đơn hàng #{{order_number}} đã được giao', 'Xin chào {{customer_name}},

Đơn hàng #{{order_number}} đã được giao thành công!

Nội dung giao hàng:
{{delivery_content}}

Cảm ơn bạn đã mua hàng tại {{site_name}}!

Trân trọng,
{{site_name}}', ARRAY['order_number', 'customer_name', 'delivery_content', 'site_name'], true),

('order_completed', 'Đơn hàng #{{order_number}} hoàn tất', 'Xin chào {{customer_name}},

Đơn hàng #{{order_number}} đã hoàn tất.

Cảm ơn bạn đã tin tưởng {{site_name}}. Hy vọng được phục vụ bạn lần sau!

Trân trọng,
{{site_name}}', ARRAY['order_number', 'customer_name', 'site_name'], true),

('order_cancelled', 'Đơn hàng #{{order_number}} đã bị hủy', 'Xin chào {{customer_name}},

Đơn hàng #{{order_number}} đã bị hủy.

Nếu bạn có thắc mắc, vui lòng liên hệ hỗ trợ.

Trân trọng,
{{site_name}}', ARRAY['order_number', 'customer_name', 'site_name'], true),

('order_refunded', 'Hoàn tiền đơn hàng #{{order_number}}', 'Xin chào {{customer_name}},

Đơn hàng #{{order_number}} đã được hoàn tiền.

Số tiền hoàn: {{refund_amount}}

Tiền sẽ được hoàn về tài khoản của bạn trong 3-5 ngày làm việc.

Trân trọng,
{{site_name}}', ARRAY['order_number', 'customer_name', 'refund_amount', 'site_name'], true),

('referral_registration_received', 'Đăng ký CTV đã được tiếp nhận', 'Xin chào {{full_name}},

Chúng tôi đã nhận được đăng ký tham gia chương trình Cộng tác viên của bạn.

Đơn đăng ký của bạn đang được xét duyệt. Chúng tôi sẽ thông báo kết quả sớm nhất.

Trân trọng,
{{site_name}}', ARRAY['full_name', 'site_name'], true),

('referral_approved', 'Chúc mừng! Đăng ký CTV được duyệt', 'Xin chào {{full_name}},

Chúc mừng! Đơn đăng ký Cộng tác viên của bạn đã được duyệt.

Mã giới thiệu của bạn: {{referral_code}}

Hãy chia sẻ mã này để nhận hoa hồng từ mỗi đơn hàng!

Trân trọng,
{{site_name}}', ARRAY['full_name', 'referral_code', 'site_name'], true),

('referral_rejected', 'Đăng ký CTV không được duyệt', 'Xin chào {{full_name}},

Rất tiếc, đơn đăng ký Cộng tác viên của bạn chưa được duyệt lần này.

Lý do: {{reject_reason}}

Bạn có thể đăng ký lại sau khi đáp ứng các yêu cầu.

Trân trọng,
{{site_name}}', ARRAY['full_name', 'reject_reason', 'site_name'], true),

('referral_reward', 'Bạn nhận được hoa hồng mới!', 'Xin chào {{full_name}},

Bạn vừa nhận được hoa hồng từ đơn hàng giới thiệu!

Mã đơn hàng: {{order_number}}
Hoa hồng: {{commission_amount}}

Tổng hoa hồng khả dụng: {{available_credits}}

Trân trọng,
{{site_name}}', ARRAY['full_name', 'order_number', 'commission_amount', 'available_credits', 'site_name'], true),

('reward_request_received', 'Yêu cầu rút thưởng đã được tiếp nhận', 'Xin chào {{full_name}},

Chúng tôi đã nhận được yêu cầu rút thưởng của bạn.

Số tiền yêu cầu: {{amount}}

Yêu cầu sẽ được xử lý trong 1-3 ngày làm việc.

Trân trọng,
{{site_name}}', ARRAY['full_name', 'amount', 'site_name'], true),

('leaderboard_reward', 'Chúc mừng! Bạn đạt top BXH', 'Xin chào {{full_name}},

Chúc mừng! Bạn đã đạt hạng {{rank}} trên Bảng xếp hạng!

Phần thưởng: {{reward_amount}}

Cảm ơn bạn đã ủng hộ {{site_name}}!

Trân trọng,
{{site_name}}', ARRAY['full_name', 'rank', 'reward_amount', 'site_name'], true),

('deposit_success', 'Nạp tiền thành công', 'Xin chào {{full_name}},

Bạn đã nạp tiền thành công vào tài khoản!

Số tiền nạp: {{amount}}
Số dư hiện tại: {{new_balance}}

Trân trọng,
{{site_name}}', ARRAY['full_name', 'amount', 'new_balance', 'site_name'], true),

('login_notification', 'Đăng nhập mới vào tài khoản', 'Xin chào {{full_name}},

Tài khoản của bạn vừa được đăng nhập từ:

Thiết bị: {{device}}
IP: {{ip_address}}
Thời gian: {{login_time}}

Nếu không phải bạn, vui lòng đổi mật khẩu ngay!

Trân trọng,
{{site_name}}', ARRAY['full_name', 'device', 'ip_address', 'login_time', 'site_name'], true),

('otp_verification', 'Mã xác thực OTP', 'Xin chào,

Mã xác thực OTP của bạn là: {{otp_code}}

Mã có hiệu lực trong 5 phút. Không chia sẻ mã này với bất kỳ ai.

Trân trọng,
{{site_name}}', ARRAY['otp_code', 'site_name'], true),

('ticket_created', 'Ticket hỗ trợ #{{ticket_number}} đã được tạo', 'Xin chào {{customer_name}},

Ticket hỗ trợ của bạn đã được tạo.

Mã ticket: #{{ticket_number}}
Tiêu đề: {{subject}}

Chúng tôi sẽ phản hồi sớm nhất có thể.

Trân trọng,
{{site_name}}', ARRAY['ticket_number', 'customer_name', 'subject', 'site_name'], true),

('ticket_reply', 'Phản hồi ticket #{{ticket_number}}', 'Xin chào {{customer_name}},

Ticket #{{ticket_number}} của bạn có phản hồi mới:

{{reply_content}}

Truy cập website để xem chi tiết và trả lời.

Trân trọng,
{{site_name}}', ARRAY['ticket_number', 'customer_name', 'reply_content', 'site_name'], true),

('invoice_sent', 'Hóa đơn đơn hàng #{{order_number}}', 'Xin chào {{customer_name}},

Đính kèm là hóa đơn cho đơn hàng #{{order_number}}.

Tổng tiền: {{total_amount}}
Ngày: {{invoice_date}}

Cảm ơn bạn đã mua hàng tại {{site_name}}!

Trân trọng,
{{site_name}}', ARRAY['order_number', 'customer_name', 'total_amount', 'invoice_date', 'site_name'], true)

ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Add unique constraint on name if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_templates_name_key'
  ) THEN
    ALTER TABLE public.email_templates ADD CONSTRAINT email_templates_name_key UNIQUE (name);
  END IF;
END $$;