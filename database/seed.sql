-- =============================================
-- SEED DATA FOR PROJECT - MySQL Compatible
-- Run this after migrations to populate initial data
-- =============================================

-- =============================================
-- 1. VIP LEVELS
-- =============================================
INSERT IGNORE INTO `vip_levels` (`id`, `name`, `min_spending`, `discount_percent`, `sort_order`) VALUES
  (UUID(), 'Member', 0, 0, 1),
  (UUID(), 'Bronze', 500000, 2, 2),
  (UUID(), 'Silver', 2000000, 5, 3),
  (UUID(), 'Gold', 5000000, 8, 4),
  (UUID(), 'Diamond', 10000000, 12, 5);

-- =============================================
-- 2. SITE SETTINGS
-- =============================================
INSERT INTO `site_settings` (`id`, `key`, `value`) VALUES
  (UUID(), 'site_name', '"Prime Shop"'),
  (UUID(), 'site_logo', '""'),
  (UUID(), 'site_favicon', '""'),
  (UUID(), 'tax_rate', '10'),
  (UUID(), 'referral_commission_percent', '5'),
  (UUID(), 'min_reward_request', '100000'),
  (UUID(), 'welcome_voucher_value', '10000'),
  (UUID(), 'company_address', '"123 Đường ABC, Quận 1, TP.HCM"'),
  (UUID(), 'company_phone', '"0123 456 789"'),
  (UUID(), 'support_email', '"support@primeshop.vn"'),
  (UUID(), 'sender_email', '"noreply@primeshop.vn"'),
  (UUID(), 'google_login_enabled', 'false'),
  (UUID(), 'discord_login_enabled', 'false'),
  (UUID(), 'seasonal_effect_enabled', 'false'),
  (UUID(), 'seasonal_effect_type', '"snow"'),
  (UUID(), 'seasonal_effect_count', '50'),
  (UUID(), 'seasonal_effect_speed', '1'),
  (UUID(), 'naperis_api_key', '""'),
  (UUID(), 'naperis_api_url', '"https://api.clone.erisvn.net"'),
  -- Captcha Settings
  (UUID(), 'captcha_enabled', 'false'),
  (UUID(), 'captcha_provider', '"turnstile"'),
  (UUID(), 'captcha_site_key', '""'),
  (UUID(), 'captcha_secret_key', '""'),
  (UUID(), 'captcha_mode', '"always"'),
  -- Security Settings
  (UUID(), 'login_rate_limit_enabled', 'false'),
  (UUID(), 'require_email_verification', 'true'),
  (UUID(), 'session_timeout_minutes', '1440')
ON DUPLICATE KEY UPDATE `key` = `key`;

-- =============================================
-- 3. SAMPLE CATEGORIES (Products)
-- =============================================
INSERT IGNORE INTO `categories` (`id`, `name`, `name_en`, `slug`, `description`, `description_en`, `sort_order`, `is_active`, `style`) VALUES
  (UUID(), 'Tài khoản Premium', 'Premium Accounts', 'tai-khoan-premium', 'Các tài khoản premium chất lượng cao', 'High quality premium accounts', 1, TRUE, 'premium'),
  (UUID(), 'Account Game', 'Game Accounts', 'account-game', 'Tài khoản game các loại', 'Various game accounts', 2, TRUE, 'game_account'),
  (UUID(), 'Nạp Game', 'Game Topup', 'nap-game', 'Dịch vụ nạp game nhanh chóng', 'Fast game topup services', 3, TRUE, 'game_topup');

-- =============================================
-- 3.1. DESIGN SERVICE CATEGORIES
-- =============================================
INSERT IGNORE INTO `categories` (`id`, `name`, `name_en`, `slug`, `description`, `description_en`, `sort_order`, `is_active`, `style`) VALUES
  (UUID(), 'Avatar', 'Avatar', 'design-avatar', 'Thiết kế avatar, ảnh đại diện', 'Avatar design', 1, TRUE, 'design'),
  (UUID(), 'Banner', 'Banner', 'design-banner', 'Thiết kế banner quảng cáo', 'Banner design', 2, TRUE, 'design'),
  (UUID(), 'Thumbnail', 'Thumbnail', 'design-thumbnail', 'Thiết kế thumbnail video', 'Thumbnail design', 3, TRUE, 'design'),
  (UUID(), 'Logo', 'Logo', 'design-logo', 'Thiết kế logo thương hiệu', 'Logo design', 4, TRUE, 'design'),
  (UUID(), 'Ảnh Quảng Cáo', 'Advertising Image', 'design-advertising', 'Thiết kế ảnh quảng cáo', 'Advertising image design', 5, TRUE, 'design'),
  (UUID(), 'Poster', 'Poster', 'design-poster', 'Thiết kế poster sự kiện', 'Event poster design', 6, TRUE, 'design'),
  (UUID(), 'Social Media', 'Social Media', 'design-social', 'Thiết kế ảnh mạng xã hội', 'Social media graphics', 7, TRUE, 'design'),
  (UUID(), 'Thiết kế khác', 'Other Design', 'design-other', 'Các dịch vụ thiết kế khác', 'Other design services', 8, TRUE, 'design');

-- =============================================
-- 4. SITE THEME (Default)
-- =============================================
INSERT IGNORE INTO `site_themes` (`id`, `is_active`, `primary_color`, `secondary_color`, `accent_color`, `background_color`, `text_color`, `font_family`, `heading_font`, `layout_style`, `header_style`, `border_radius`) VALUES
  (UUID(), TRUE, '#3B82F6', '#10B981', '#8B5CF6', '#FFFFFF', '#111827', 'Inter', 'Inter', 'default', 'default', '8px');

-- =============================================
-- 5. SITE SECTIONS (Default)
-- =============================================
INSERT IGNORE INTO `site_sections` (`id`, `section_key`, `section_name`, `is_enabled`, `sort_order`) VALUES
  (UUID(), 'hero_banner', 'Hero Banner', TRUE, 1),
  (UUID(), 'flash_sales', 'Flash Sales', TRUE, 2),
  (UUID(), 'featured_products', 'Sản phẩm nổi bật', TRUE, 3),
  (UUID(), 'categories', 'Danh mục sản phẩm', TRUE, 4),
  (UUID(), 'new_products', 'Sản phẩm mới', TRUE, 5),
  (UUID(), 'best_sellers', 'Bán chạy nhất', TRUE, 6),
  (UUID(), 'testimonials', 'Đánh giá khách hàng', TRUE, 7),
  (UUID(), 'partners', 'Đối tác', TRUE, 8),
  (UUID(), 'news', 'Tin tức', TRUE, 9),
  (UUID(), 'newsletter', 'Đăng ký nhận tin', TRUE, 10),
  (UUID(), 'footer_about', 'Footer - Giới thiệu', TRUE, 11),
  (UUID(), 'footer_links', 'Footer - Liên kết', TRUE, 12),
  (UUID(), 'footer_contact', 'Footer - Liên hệ', TRUE, 13),
  (UUID(), 'footer_social', 'Footer - Mạng xã hội', TRUE, 14);

-- =============================================
-- 6. EMAIL TEMPLATES - COMPLETE SET
-- =============================================

-- Welcome Email
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'welcome',
'Chào mừng bạn đến với {{site_name}}!',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">🎉 Chào mừng bạn!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Cảm ơn bạn đã đăng ký tài khoản tại {{site_name}}.</p>
  <p>Bạn có thể bắt đầu khám phá các sản phẩm tuyệt vời của chúng tôi ngay bây giờ!</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{site_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Khám phá ngay</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "site_name", "site_url"]',
TRUE);

-- Order Confirmation
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'order_confirmation', 
'Xác nhận đơn hàng #{{order_number}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Xác nhận đơn hàng</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Cảm ơn bạn đã đặt hàng tại {{site_name}}. Đơn hàng của bạn đã được tạo thành công.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Mã đơn hàng:</strong> {{order_number}}</p>
    <p><strong>Sản phẩm:</strong> {{product_name}}</p>
    <p><strong>Tổng tiền:</strong> {{total_amount}}</p>
  </div>
  <p>Vui lòng hoàn tất thanh toán để đơn hàng được xử lý.</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["order_number", "customer_name", "product_name", "total_amount", "site_name"]',
TRUE);

-- Payment Success
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'payment_success',
'Thanh toán thành công - Đơn hàng #{{order_number}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Thanh toán thành công!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Chúng tôi đã nhận được thanh toán cho đơn hàng của bạn.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Mã đơn hàng:</strong> {{order_number}}</p>
    <p><strong>Sản phẩm:</strong> {{product_name}}</p>
    <p><strong>Số tiền:</strong> {{amount}}</p>
    <p><strong>Phương thức:</strong> {{payment_method}}</p>
  </div>
  <p>Đơn hàng của bạn đang được xử lý. Chúng tôi sẽ thông báo khi có cập nhật.</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["order_number", "customer_name", "product_name", "amount", "payment_method", "site_name"]',
TRUE);

-- Payment Failed
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'payment_failed',
'Thanh toán thất bại - Đơn hàng #{{order_number}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #dc2626;">Thanh toán thất bại</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Rất tiếc, thanh toán cho đơn hàng của bạn không thành công.</p>
  <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Mã đơn hàng:</strong> {{order_number}}</p>
    <p><strong>Lý do:</strong> {{reason}}</p>
  </div>
  <p>Vui lòng thử lại hoặc liên hệ hỗ trợ nếu cần giúp đỡ.</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["order_number", "customer_name", "reason", "site_name"]',
TRUE);

-- Order Processing
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'order_processing',
'Đơn hàng #{{order_number}} đang được xử lý',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Đơn hàng đang được xử lý</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Đơn hàng của bạn đang được xử lý. Chúng tôi sẽ thông báo ngay khi sẵn sàng giao hàng.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Mã đơn hàng:</strong> {{order_number}}</p>
    <p><strong>Sản phẩm:</strong> {{product_name}}</p>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["order_number", "customer_name", "product_name", "site_name"]',
TRUE);

-- Order Delivered
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'order_delivered',
'Đơn hàng #{{order_number}} đã được giao',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Đơn hàng đã được giao!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Đơn hàng của bạn đã được giao thành công.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Mã đơn hàng:</strong> {{order_number}}</p>
    <p><strong>Sản phẩm:</strong> {{product_name}}</p>
    <p><strong>Nội dung giao hàng:</strong></p>
    <div style="background: #fff; padding: 12px; border: 1px solid #e5e7eb; border-radius: 4px;">
      {{delivery_content}}
    </div>
  </div>
  <p>Cảm ơn bạn đã mua hàng tại {{site_name}}!</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["order_number", "customer_name", "product_name", "delivery_content", "site_name"]',
TRUE);

-- Order Completed
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'order_completed',
'Đơn hàng #{{order_number}} đã hoàn tất',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Đơn hàng hoàn tất!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Đơn hàng của bạn đã được hoàn tất. Cảm ơn bạn đã tin tưởng {{site_name}}!</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Mã đơn hàng:</strong> {{order_number}}</p>
    <p><strong>Sản phẩm:</strong> {{product_name}}</p>
  </div>
  <p>Nếu bạn hài lòng, đừng quên để lại đánh giá cho sản phẩm nhé!</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["order_number", "customer_name", "product_name", "site_name"]',
TRUE);

-- Order Cancelled
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'order_cancelled',
'Đơn hàng #{{order_number}} đã bị hủy',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #dc2626;">Đơn hàng đã bị hủy</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Đơn hàng của bạn đã bị hủy.</p>
  <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Mã đơn hàng:</strong> {{order_number}}</p>
    <p><strong>Lý do:</strong> {{reason}}</p>
  </div>
  <p>Nếu có thắc mắc, vui lòng liên hệ hỗ trợ.</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["order_number", "customer_name", "reason", "site_name"]',
TRUE);

-- Order Refunded
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'order_refunded',
'Hoàn tiền đơn hàng #{{order_number}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Đơn hàng đã được hoàn tiền</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Đơn hàng của bạn đã được hoàn tiền thành công.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Mã đơn hàng:</strong> {{order_number}}</p>
    <p><strong>Số tiền hoàn:</strong> {{refund_amount}}</p>
    <p><strong>Lý do:</strong> {{refund_reason}}</p>
    <p><strong>Phương thức:</strong> {{payment_provider}}</p>
    <p><strong>Ngày hoàn:</strong> {{date}}</p>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["order_number", "customer_name", "refund_amount", "refund_reason", "payment_provider", "date", "site_name"]',
TRUE);

-- Password Reset
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'password_reset',
'Đặt lại mật khẩu - {{site_name}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Đặt lại mật khẩu</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{reset_link}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Đặt lại mật khẩu</a>
  </div>
  <p>Hoặc sao chép đường link sau:</p>
  <p style="word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 4px;">{{reset_link}}</p>
  <p>Link này sẽ hết hạn sau 1 giờ.</p>
  <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "reset_link", "site_name"]',
TRUE);

-- Email Verification
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'email_verification',
'Xác thực email - {{site_name}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Xác thực email</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Vui lòng xác thực địa chỉ email của bạn bằng cách nhấn vào nút bên dưới:</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{verify_link}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Xác thực email</a>
  </div>
  <p>Hoặc sao chép đường link sau:</p>
  <p style="word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 4px;">{{verify_link}}</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "verify_link", "site_name"]',
TRUE);

-- Referral Registration Received
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'referral_registration_received',
'Đăng ký CTV đã được tiếp nhận',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Đăng ký CTV thành công!</h2>
  <p>Xin chào <strong>{{full_name}}</strong>,</p>
  <p>Chúng tôi đã nhận được đăng ký tham gia chương trình Cộng tác viên của bạn.</p>
  <p>Đơn đăng ký của bạn đang được xem xét. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["full_name", "site_name"]',
TRUE);

-- Referral Approved
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'referral_approved',
'Đăng ký CTV đã được phê duyệt',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Chúc mừng! Bạn đã trở thành CTV</h2>
  <p>Xin chào <strong>{{full_name}}</strong>,</p>
  <p>Đăng ký CTV của bạn đã được phê duyệt!</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Mã giới thiệu của bạn:</strong> <span style="font-size: 18px; font-weight: bold; color: #2563eb;">{{referral_code}}</span></p>
  </div>
  <p>Hãy chia sẻ mã này với bạn bè để nhận hoa hồng từ mỗi đơn hàng!</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["full_name", "referral_code", "site_name"]',
TRUE);

-- Referral Rejected
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'referral_rejected',
'Đăng ký CTV không được phê duyệt',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #dc2626;">Đăng ký CTV không được phê duyệt</h2>
  <p>Xin chào <strong>{{full_name}}</strong>,</p>
  <p>Rất tiếc, đăng ký CTV của bạn không được phê duyệt.</p>
  <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Lý do:</strong> {{reason}}</p>
  </div>
  <p>Bạn có thể đăng ký lại sau hoặc liên hệ hỗ trợ để biết thêm chi tiết.</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["full_name", "reason", "site_name"]',
TRUE);

-- Referral Commission
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'referral_commission',
'Bạn vừa nhận được hoa hồng CTV!',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">💰 Hoa hồng CTV mới!</h2>
  <p>Xin chào <strong>{{full_name}}</strong>,</p>
  <p>Bạn vừa nhận được hoa hồng từ chương trình Cộng tác viên.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Số tiền hoa hồng:</strong> {{commission_amount}}</p>
    <p><strong>Đơn hàng liên quan:</strong> #{{order_number}}</p>
    <p><strong>Số dư hiện tại:</strong> {{current_balance}}</p>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["full_name", "commission_amount", "order_number", "current_balance", "site_name"]',
TRUE);

-- Deposit Success
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'deposit_success',
'Nạp tiền thành công - {{amount}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Nạp tiền thành công!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Tài khoản của bạn đã được nạp thành công.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Số tiền nạp:</strong> {{amount}}</p>
    <p><strong>Số dư hiện tại:</strong> {{new_balance}}</p>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "amount", "new_balance", "site_name"]',
TRUE);

-- Login Notification
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'login_notification',
'Thông báo đăng nhập mới',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Thông báo đăng nhập</h2>
  <p>Xin chào,</p>
  <p>Tài khoản của bạn vừa được đăng nhập.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Thời gian:</strong> {{login_time}}</p>
    <p><strong>Địa chỉ IP:</strong> {{ip_address}}</p>
    <p><strong>Thiết bị:</strong> {{device}}</p>
    <p><strong>Trình duyệt:</strong> {{browser}}</p>
  </div>
  <p>Nếu đây không phải bạn, vui lòng đổi mật khẩu ngay!</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["login_time", "ip_address", "device", "browser", "site_name"]',
TRUE);

-- OTP Verification
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'otp_verification',
'Mã xác thực OTP - {{site_name}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Mã xác thực OTP</h2>
  <p>Xin chào,</p>
  <p>Mã OTP của bạn là:</p>
  <div style="background: #f3f4f6; padding: 24px; border-radius: 8px; margin: 16px 0; text-align: center;">
    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">{{otp_code}}</span>
  </div>
  <p>Mã này có hiệu lực trong 5 phút. Không chia sẻ mã này với bất kỳ ai.</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["otp_code", "site_name"]',
TRUE);

-- Ticket Created
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'ticket_created',
'Ticket hỗ trợ #{{ticket_number}} đã được tạo',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Ticket hỗ trợ đã được tạo</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Ticket hỗ trợ của bạn đã được tạo thành công.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Mã ticket:</strong> {{ticket_number}}</p>
    <p><strong>Tiêu đề:</strong> {{subject}}</p>
  </div>
  <p>Chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["ticket_number", "customer_name", "subject", "site_name"]',
TRUE);

-- Ticket Reply
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'ticket_reply',
'Phản hồi ticket #{{ticket_number}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Có phản hồi mới cho ticket của bạn</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Ticket của bạn đã có phản hồi mới từ đội ngũ hỗ trợ.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Mã ticket:</strong> {{ticket_number}}</p>
    <p><strong>Nội dung phản hồi:</strong></p>
    <div style="background: #fff; padding: 12px; border: 1px solid #e5e7eb; border-radius: 4px;">
      {{reply_content}}
    </div>
  </div>
  <p>Đăng nhập để xem và trả lời.</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["ticket_number", "customer_name", "reply_content", "site_name"]',
TRUE);

-- Invoice Sent
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'invoice_sent',
'Hóa đơn đơn hàng #{{order_number}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Hóa đơn đơn hàng</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Đính kèm là hóa đơn cho đơn hàng của bạn.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Mã đơn hàng:</strong> {{order_number}}</p>
    <p><strong>Tổng tiền:</strong> {{total_amount}}</p>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["order_number", "customer_name", "total_amount", "site_name"]',
TRUE);

-- VIP Level Up
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'vip_level_up',
'🎉 Chúc mừng! Bạn đã lên hạng {{new_level}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #f59e0b;">🎉 Lên hạng thành công!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Chúc mừng bạn đã đạt hạng <strong style="color: #f59e0b;">{{new_level}}</strong>!</p>
  <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Hạng mới:</strong> {{new_level}}</p>
    <p><strong>Ưu đãi giảm giá:</strong> {{discount_percent}}%</p>
  </div>
  <p>Cảm ơn bạn đã ủng hộ {{site_name}}!</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "new_level", "discount_percent", "site_name"]',
TRUE);

-- Flash Sale Notification
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'flash_sale_notification',
'⚡ Flash Sale: {{product_name}} giảm {{discount_percent}}%',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #dc2626;">⚡ Flash Sale!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Sản phẩm bạn yêu thích đang giảm giá sốc!</p>
  <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Sản phẩm:</strong> {{product_name}}</p>
    <p><strong>Giảm:</strong> <span style="color: #dc2626; font-weight: bold;">{{discount_percent}}%</span></p>
    <p><strong>Giá sale:</strong> {{sale_price}}</p>
    <p><strong>Kết thúc:</strong> {{end_time}}</p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{product_url}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Mua ngay</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "product_name", "discount_percent", "sale_price", "end_time", "product_url", "site_name"]',
TRUE);

-- Topup Success (Game)
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'topup_success',
'Nạp game thành công - {{game_name}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">🎮 Nạp game thành công!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Giao dịch nạp game của bạn đã hoàn tất.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Game:</strong> {{game_name}}</p>
    <p><strong>Gói nạp:</strong> {{package_name}}</p>
    <p><strong>ID/UID:</strong> {{game_id}}</p>
    <p><strong>Số tiền:</strong> {{amount}}</p>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "game_name", "package_name", "game_id", "amount", "site_name"]',
TRUE);

-- Topup Failed (Game)
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'topup_failed',
'Nạp game thất bại - {{game_name}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #dc2626;">🎮 Nạp game thất bại</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Giao dịch nạp game của bạn không thành công.</p>
  <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Game:</strong> {{game_name}}</p>
    <p><strong>Gói nạp:</strong> {{package_name}}</p>
    <p><strong>Lý do:</strong> {{reason}}</p>
  </div>
  <p>Số tiền sẽ được hoàn vào tài khoản của bạn (nếu đã thanh toán).</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "game_name", "package_name", "reason", "site_name"]',
TRUE);

-- Account Banned
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'account_banned',
'Tài khoản của bạn đã bị khóa',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #dc2626;">Tài khoản bị khóa</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Tài khoản của bạn tại {{site_name}} đã bị khóa.</p>
  <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Lý do:</strong> {{reason}}</p>
    <p><strong>Ngày khóa:</strong> {{ban_date}}</p>
  </div>
  <p>Nếu bạn cho rằng đây là lỗi, vui lòng liên hệ hỗ trợ.</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "reason", "ban_date", "site_name"]',
TRUE);

-- Account Unbanned
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'account_unbanned',
'Tài khoản của bạn đã được mở khóa',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Tài khoản đã được mở khóa</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Tài khoản của bạn tại {{site_name}} đã được mở khóa.</p>
  <p>Bạn có thể đăng nhập và sử dụng dịch vụ bình thường.</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "site_name"]',
TRUE);

-- Review Reminder
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'review_reminder',
'Đánh giá sản phẩm bạn vừa mua',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">⭐ Đánh giá sản phẩm</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Bạn đã mua <strong>{{product_name}}</strong> gần đây. Hãy để lại đánh giá để giúp người khác!</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{review_link}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Đánh giá ngay</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "product_name", "review_link", "site_name"]',
TRUE);

-- Wishlist Price Drop
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'wishlist_price_drop',
'🔔 Sản phẩm yêu thích đã giảm giá!',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Giá đã giảm!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Sản phẩm trong danh sách yêu thích của bạn đã giảm giá!</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Sản phẩm:</strong> {{product_name}}</p>
    <p><strong>Giá cũ:</strong> <s>{{old_price}}</s></p>
    <p><strong>Giá mới:</strong> <span style="color: #16a34a; font-weight: bold;">{{new_price}}</span></p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{product_url}}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Mua ngay</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "product_name", "old_price", "new_price", "product_url", "site_name"]',
TRUE);

-- Wishlist Back In Stock
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'wishlist_back_in_stock',
'🔔 Sản phẩm yêu thích đã có hàng trở lại!',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Có hàng trở lại!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Sản phẩm bạn quan tâm đã có hàng trở lại!</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Sản phẩm:</strong> {{product_name}}</p>
    <p><strong>Giá:</strong> {{price}}</p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{product_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Mua ngay</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "product_name", "price", "product_url", "site_name"]',
TRUE);

-- New Product Notification
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'new_product_notification',
'🆕 Sản phẩm mới: {{product_name}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #8b5cf6;">Sản phẩm mới!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Chúng tôi vừa ra mắt sản phẩm mới!</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Sản phẩm:</strong> {{product_name}}</p>
    <p><strong>Mô tả:</strong> {{description}}</p>
    <p><strong>Giá:</strong> {{price}}</p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{product_url}}" style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Xem ngay</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "product_name", "description", "price", "product_url", "site_name"]',
TRUE);

-- Voucher Gift
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'voucher_gift',
'🎁 Bạn nhận được voucher từ {{site_name}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #f59e0b;">🎁 Voucher tặng bạn!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Chúng tôi tặng bạn một voucher giảm giá!</p>
  <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;">
    <p style="font-size: 24px; font-weight: bold; color: #f59e0b;">{{voucher_code}}</p>
    <p><strong>Giá trị:</strong> {{voucher_value}}</p>
    <p><strong>Hết hạn:</strong> {{expiry_date}}</p>
  </div>
  <p>Nhập mã khi thanh toán để được giảm giá!</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "voucher_code", "voucher_value", "expiry_date", "site_name"]',
TRUE);

-- Voucher Expiring Soon
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'voucher_expiring',
'⏰ Voucher của bạn sắp hết hạn!',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #dc2626;">⏰ Voucher sắp hết hạn!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Voucher của bạn sẽ hết hạn trong {{days_left}} ngày!</p>
  <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;">
    <p style="font-size: 24px; font-weight: bold; color: #dc2626;">{{voucher_code}}</p>
    <p><strong>Giá trị:</strong> {{voucher_value}}</p>
    <p><strong>Hết hạn:</strong> {{expiry_date}}</p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{shop_url}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Sử dụng ngay</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "voucher_code", "voucher_value", "days_left", "expiry_date", "shop_url", "site_name"]',
TRUE);

-- Birthday Greeting
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'birthday_greeting',
'🎂 Chúc mừng sinh nhật {{customer_name}}!',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #ec4899;">🎂 Chúc mừng sinh nhật!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>{{site_name}} chúc bạn sinh nhật vui vẻ và hạnh phúc!</p>
  <p>Đây là món quà nhỏ dành cho bạn:</p>
  <div style="background: #fdf2f8; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;">
    <p style="font-size: 24px; font-weight: bold; color: #ec4899;">{{voucher_code}}</p>
    <p><strong>Giảm:</strong> {{discount_value}}</p>
    <p><strong>Hết hạn:</strong> {{expiry_date}}</p>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "voucher_code", "discount_value", "expiry_date", "site_name"]',
TRUE);

-- Cart Abandoned
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'cart_abandoned',
'🛒 Bạn quên giỏ hàng rồi!',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #f59e0b;">Bạn quên giỏ hàng!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Bạn có {{item_count}} sản phẩm đang chờ trong giỏ hàng!</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    {{cart_items}}
    <p><strong>Tổng:</strong> {{total_amount}}</p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{cart_url}}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Hoàn tất đơn hàng</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "item_count", "cart_items", "total_amount", "cart_url", "site_name"]',
TRUE);

-- Points Earned
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'points_earned',
'🎯 Bạn vừa nhận được {{points}} điểm!',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #8b5cf6;">Nhận điểm thưởng!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Bạn vừa nhận được <strong style="color: #8b5cf6;">{{points}} điểm</strong> từ đơn hàng #{{order_number}}!</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Điểm nhận:</strong> +{{points}}</p>
    <p><strong>Tổng điểm:</strong> {{total_points}}</p>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "points", "order_number", "total_points", "site_name"]',
TRUE);

-- Points Redeemed
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'points_redeemed',
'Đổi điểm thành công',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Đổi điểm thành công!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Bạn đã đổi <strong>{{points_used}} điểm</strong> thành công!</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Điểm sử dụng:</strong> -{{points_used}}</p>
    <p><strong>Giá trị:</strong> {{reward_value}}</p>
    <p><strong>Điểm còn lại:</strong> {{remaining_points}}</p>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "points_used", "reward_value", "remaining_points", "site_name"]',
TRUE);

-- Group Order Invitation
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'group_order_invitation',
'{{inviter_name}} mời bạn tham gia đơn hàng nhóm',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Lời mời tham gia đơn nhóm</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p><strong>{{inviter_name}}</strong> đã mời bạn tham gia đơn hàng nhóm!</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Sản phẩm:</strong> {{product_name}}</p>
    <p><strong>Giá nhóm:</strong> {{group_price}}</p>
    <p><strong>Thành viên:</strong> {{current_members}}/{{required_members}}</p>
    <p><strong>Kết thúc:</strong> {{end_time}}</p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{group_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Tham gia ngay</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "inviter_name", "product_name", "group_price", "current_members", "required_members", "end_time", "group_url", "site_name"]',
TRUE);

-- Group Order Success
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'group_order_success',
'🎉 Đơn hàng nhóm thành công!',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Đơn nhóm thành công!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Đơn hàng nhóm đã đủ số lượng và được xác nhận!</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Sản phẩm:</strong> {{product_name}}</p>
    <p><strong>Giá nhóm:</strong> {{group_price}}</p>
    <p><strong>Tiết kiệm:</strong> {{savings}}</p>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "product_name", "group_price", "savings", "site_name"]',
TRUE);

-- Group Order Failed
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'group_order_failed',
'Đơn hàng nhóm không thành công',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #dc2626;">Đơn nhóm không thành công</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Rất tiếc, đơn hàng nhóm không đủ số lượng thành viên.</p>
  <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Sản phẩm:</strong> {{product_name}}</p>
    <p><strong>Thành viên:</strong> {{current_members}}/{{required_members}}</p>
  </div>
  <p>Số tiền đã thanh toán sẽ được hoàn lại trong 24h.</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "product_name", "current_members", "required_members", "site_name"]',
TRUE);

-- Auction Bid Placed
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'auction_bid_placed',
'Đặt giá thành công - {{product_name}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Đặt giá thành công!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Bạn đã đặt giá thành công cho phiên đấu giá!</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Sản phẩm:</strong> {{product_name}}</p>
    <p><strong>Giá đặt:</strong> {{bid_amount}}</p>
    <p><strong>Kết thúc:</strong> {{end_time}}</p>
  </div>
  <p>Chúng tôi sẽ thông báo nếu có người đặt giá cao hơn.</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "product_name", "bid_amount", "end_time", "site_name"]',
TRUE);

-- Auction Outbid
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'auction_outbid',
'⚠️ Có người đặt giá cao hơn bạn!',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #f59e0b;">Bạn đã bị vượt giá!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Có người đã đặt giá cao hơn bạn trong phiên đấu giá!</p>
  <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Sản phẩm:</strong> {{product_name}}</p>
    <p><strong>Giá của bạn:</strong> {{your_bid}}</p>
    <p><strong>Giá hiện tại:</strong> {{current_bid}}</p>
    <p><strong>Kết thúc:</strong> {{end_time}}</p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{auction_url}}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Đặt giá cao hơn</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "product_name", "your_bid", "current_bid", "end_time", "auction_url", "site_name"]',
TRUE);

-- Auction Won
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'auction_won',
'🎉 Chúc mừng! Bạn đã thắng đấu giá!',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Bạn đã thắng!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Chúc mừng! Bạn đã thắng phiên đấu giá!</p>
  <div style="background: #dcfce7; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Sản phẩm:</strong> {{product_name}}</p>
    <p><strong>Giá thắng:</strong> {{winning_bid}}</p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{payment_url}}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Thanh toán ngay</a>
  </div>
  <p>Vui lòng thanh toán trong 24h để hoàn tất giao dịch.</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "product_name", "winning_bid", "payment_url", "site_name"]',
TRUE);

-- Auction Lost
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'auction_lost',
'Kết quả đấu giá - {{product_name}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #6b7280;">Kết quả đấu giá</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Rất tiếc, bạn không thắng phiên đấu giá này.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Sản phẩm:</strong> {{product_name}}</p>
    <p><strong>Giá của bạn:</strong> {{your_bid}}</p>
    <p><strong>Giá thắng:</strong> {{winning_bid}}</p>
  </div>
  <p>Hãy tham gia các phiên đấu giá khác!</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "product_name", "your_bid", "winning_bid", "site_name"]',
TRUE);

-- Daily Checkin Reward
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'daily_checkin_reward',
'🎁 Điểm danh ngày {{day}} thành công!',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #8b5cf6;">Điểm danh thành công!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Bạn đã điểm danh ngày thứ <strong>{{day}}</strong> liên tiếp!</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Phần thưởng hôm nay:</strong> {{reward}}</p>
    <p><strong>Chuỗi điểm danh:</strong> {{streak}} ngày</p>
  </div>
  <p>Tiếp tục điểm danh để nhận thưởng lớn hơn!</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "day", "reward", "streak", "site_name"]',
TRUE);

-- Prime Activated
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'prime_activated',
'⭐ Chào mừng thành viên Prime!',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #f59e0b;">Chào mừng Prime!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Chúc mừng bạn đã trở thành thành viên <strong style="color: #f59e0b;">Prime</strong>!</p>
  <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Gói:</strong> {{plan_name}}</p>
    <p><strong>Thời hạn:</strong> {{duration}}</p>
    <p><strong>Hết hạn:</strong> {{expiry_date}}</p>
  </div>
  <h3>Quyền lợi của bạn:</h3>
  <ul>
    <li>Giảm giá độc quyền lên đến 20%</li>
    <li>Miễn phí vận chuyển</li>
    <li>Ưu tiên hỗ trợ 24/7</li>
    <li>Truy cập Flash Sale sớm</li>
  </ul>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "plan_name", "duration", "expiry_date", "site_name"]',
TRUE);

-- Prime Expiring Soon
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'prime_expiring',
'⚠️ Prime của bạn sắp hết hạn',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #f59e0b;">Prime sắp hết hạn!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Gói Prime của bạn sẽ hết hạn vào <strong>{{expiry_date}}</strong>.</p>
  <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Còn lại:</strong> {{days_left}} ngày</p>
  </div>
  <p>Gia hạn ngay để không mất quyền lợi!</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{renew_url}}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Gia hạn Prime</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "expiry_date", "days_left", "renew_url", "site_name"]',
TRUE);

-- Prime Expired
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'prime_expired',
'Prime của bạn đã hết hạn',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #6b7280;">Prime đã hết hạn</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Gói Prime của bạn đã hết hạn vào {{expiry_date}}.</p>
  <p>Bạn đã tiết kiệm được <strong>{{total_savings}}</strong> khi là thành viên Prime!</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{renew_url}}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Đăng ký lại Prime</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "expiry_date", "total_savings", "renew_url", "site_name"]',
TRUE);

-- Achievement Unlocked
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'achievement_unlocked',
'🏆 Mở khóa thành tựu: {{achievement_name}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #8b5cf6;">Thành tựu mới!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Chúc mừng! Bạn đã mở khóa thành tựu mới!</p>
  <div style="background: linear-gradient(135deg, #c4b5fd, #a78bfa); padding: 24px; border-radius: 12px; margin: 16px 0; text-align: center;">
    <div style="font-size: 48px;">{{achievement_icon}}</div>
    <h3 style="color: white; margin: 8px 0;">{{achievement_name}}</h3>
    <p style="color: #f3f4f6;">{{achievement_description}}</p>
  </div>
  <p><strong>Phần thưởng:</strong> {{reward}}</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "achievement_icon", "achievement_name", "achievement_description", "reward", "site_name"]',
TRUE);

-- Level Up
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'level_up',
'🎮 Lên cấp! Bạn đã đạt Level {{new_level}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Chúc mừng lên cấp!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Bạn đã lên <strong>Level {{new_level}}</strong>!</p>
  <div style="background: #dcfce7; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Level mới:</strong> {{new_level}}</p>
    <p><strong>Tổng XP:</strong> {{total_xp}}</p>
  </div>
  <h3>Quyền lợi mới:</h3>
  {{new_benefits}}
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "new_level", "total_xp", "new_benefits", "site_name"]',
TRUE);

-- Withdrawal Request
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'withdrawal_request',
'Yêu cầu rút tiền đang được xử lý',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Yêu cầu rút tiền</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Chúng tôi đã nhận được yêu cầu rút tiền của bạn.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Số tiền:</strong> {{amount}}</p>
    <p><strong>Phương thức:</strong> {{method}}</p>
    <p><strong>Tài khoản:</strong> {{account_info}}</p>
    <p><strong>Mã yêu cầu:</strong> #{{request_id}}</p>
  </div>
  <p>Yêu cầu sẽ được xử lý trong 1-3 ngày làm việc.</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "amount", "method", "account_info", "request_id", "site_name"]',
TRUE);

-- Withdrawal Success
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'withdrawal_success',
'✅ Rút tiền thành công',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Rút tiền thành công!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Yêu cầu rút tiền của bạn đã được xử lý thành công!</p>
  <div style="background: #dcfce7; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Số tiền:</strong> {{amount}}</p>
    <p><strong>Phương thức:</strong> {{method}}</p>
    <p><strong>Mã giao dịch:</strong> {{transaction_id}}</p>
  </div>
  <p>Tiền sẽ về tài khoản trong 1-24h tùy ngân hàng.</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "amount", "method", "transaction_id", "site_name"]',
TRUE);

-- Withdrawal Failed
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'withdrawal_failed',
'❌ Rút tiền không thành công',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #dc2626;">Rút tiền thất bại</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Rất tiếc, yêu cầu rút tiền của bạn không thành công.</p>
  <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Số tiền:</strong> {{amount}}</p>
    <p><strong>Lý do:</strong> {{reason}}</p>
  </div>
  <p>Số tiền đã được hoàn lại vào ví của bạn.</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "amount", "reason", "site_name"]',
TRUE);

-- Security Alert
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'security_alert',
'🔒 Cảnh báo bảo mật tài khoản',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #dc2626;">Cảnh báo bảo mật!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Chúng tôi phát hiện hoạt động bất thường trên tài khoản của bạn.</p>
  <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Hoạt động:</strong> {{activity_type}}</p>
    <p><strong>Thời gian:</strong> {{timestamp}}</p>
    <p><strong>IP:</strong> {{ip_address}}</p>
    <p><strong>Vị trí:</strong> {{location}}</p>
  </div>
  <p>Nếu đây không phải bạn, hãy đổi mật khẩu ngay!</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{security_url}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Bảo mật tài khoản</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "activity_type", "timestamp", "ip_address", "location", "security_url", "site_name"]',
TRUE);

-- Password Changed
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'password_changed',
'🔐 Mật khẩu đã được thay đổi',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Đổi mật khẩu thành công!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Mật khẩu tài khoản của bạn đã được thay đổi thành công.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Thời gian:</strong> {{timestamp}}</p>
    <p><strong>IP:</strong> {{ip_address}}</p>
  </div>
  <p>Nếu bạn không thực hiện thay đổi này, hãy liên hệ ngay!</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "timestamp", "ip_address", "site_name"]',
TRUE);

-- Profile Updated
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'profile_updated',
'Thông tin tài khoản đã được cập nhật',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Cập nhật thông tin</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Thông tin tài khoản của bạn đã được cập nhật.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Thay đổi:</strong></p>
    {{changes}}
    <p><strong>Thời gian:</strong> {{timestamp}}</p>
  </div>
  <p>Nếu bạn không thực hiện thay đổi này, hãy liên hệ ngay!</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "changes", "timestamp", "site_name"]',
TRUE);

-- New Follower
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'new_follower',
'👤 {{follower_name}} đã theo dõi bạn',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #8b5cf6;">Người theo dõi mới!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p><strong>{{follower_name}}</strong> đã bắt đầu theo dõi bạn!</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;">
    <img src="{{follower_avatar}}" alt="Avatar" style="width: 64px; height: 64px; border-radius: 50%;">
    <h3>{{follower_name}}</h3>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{profile_url}}" style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Xem hồ sơ</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "follower_name", "follower_avatar", "profile_url", "site_name"]',
TRUE);

-- New Comment
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'new_comment',
'💬 {{commenter_name}} đã bình luận về sản phẩm của bạn',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Bình luận mới!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p><strong>{{commenter_name}}</strong> đã bình luận về sản phẩm của bạn.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Sản phẩm:</strong> {{product_name}}</p>
    <p><strong>Bình luận:</strong></p>
    <p style="font-style: italic;">"{{comment_content}}"</p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{product_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Xem & Trả lời</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "commenter_name", "product_name", "comment_content", "product_url", "site_name"]',
TRUE);

-- New Review
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'new_review',
'⭐ {{reviewer_name}} đã đánh giá sản phẩm của bạn',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #f59e0b;">Đánh giá mới!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p><strong>{{reviewer_name}}</strong> đã đánh giá sản phẩm của bạn.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Sản phẩm:</strong> {{product_name}}</p>
    <p><strong>Đánh giá:</strong> {{rating}}/5 ⭐</p>
    <p><strong>Nhận xét:</strong></p>
    <p style="font-style: italic;">"{{review_content}}"</p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{product_url}}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Xem đánh giá</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "reviewer_name", "product_name", "rating", "review_content", "product_url", "site_name"]',
TRUE);

-- Product Approved
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'product_approved',
'✅ Sản phẩm đã được duyệt',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Sản phẩm được duyệt!</h2>
  <p>Xin chào <strong>{{seller_name}}</strong>,</p>
  <p>Sản phẩm của bạn đã được duyệt và đang hiển thị trên website!</p>
  <div style="background: #dcfce7; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Sản phẩm:</strong> {{product_name}}</p>
    <p><strong>Giá:</strong> {{price}}</p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{product_url}}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Xem sản phẩm</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["seller_name", "product_name", "price", "product_url", "site_name"]',
TRUE);

-- Product Rejected
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'product_rejected',
'❌ Sản phẩm không được duyệt',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #dc2626;">Sản phẩm bị từ chối</h2>
  <p>Xin chào <strong>{{seller_name}}</strong>,</p>
  <p>Rất tiếc, sản phẩm của bạn không được duyệt.</p>
  <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Sản phẩm:</strong> {{product_name}}</p>
    <p><strong>Lý do:</strong> {{rejection_reason}}</p>
  </div>
  <p>Vui lòng chỉnh sửa và gửi lại.</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{edit_url}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Chỉnh sửa sản phẩm</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["seller_name", "product_name", "rejection_reason", "edit_url", "site_name"]',
TRUE);

-- Seller Application Approved
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'seller_approved',
'🎉 Chúc mừng! Bạn đã trở thành người bán',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Chào mừng người bán mới!</h2>
  <p>Xin chào <strong>{{seller_name}}</strong>,</p>
  <p>Chúc mừng! Đơn đăng ký người bán của bạn đã được duyệt!</p>
  <div style="background: #dcfce7; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Shop:</strong> {{shop_name}}</p>
    <p><strong>Phí hoa hồng:</strong> {{commission_rate}}%</p>
  </div>
  <p>Bạn có thể bắt đầu đăng sản phẩm ngay!</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{dashboard_url}}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Vào Seller Dashboard</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["seller_name", "shop_name", "commission_rate", "dashboard_url", "site_name"]',
TRUE);

-- Seller Application Rejected
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'seller_rejected',
'Đơn đăng ký người bán không được duyệt',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #dc2626;">Đơn đăng ký bị từ chối</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Rất tiếc, đơn đăng ký người bán của bạn không được duyệt.</p>
  <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Lý do:</strong> {{rejection_reason}}</p>
  </div>
  <p>Bạn có thể đăng ký lại sau 30 ngày.</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "rejection_reason", "site_name"]',
TRUE);

-- Order Dispute Opened
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'dispute_opened',
'⚠️ Khiếu nại đơn hàng #{{order_number}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #f59e0b;">Khiếu nại mới</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Chúng tôi đã nhận được khiếu nại về đơn hàng của bạn.</p>
  <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Đơn hàng:</strong> #{{order_number}}</p>
    <p><strong>Loại khiếu nại:</strong> {{dispute_type}}</p>
    <p><strong>Mã khiếu nại:</strong> #{{dispute_id}}</p>
  </div>
  <p>Chúng tôi sẽ xem xét trong 3-5 ngày làm việc.</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "order_number", "dispute_type", "dispute_id", "site_name"]',
TRUE);

-- Dispute Resolved
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'dispute_resolved',
'✅ Khiếu nại #{{dispute_id}} đã được giải quyết',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Khiếu nại đã giải quyết</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Khiếu nại của bạn đã được xử lý.</p>
  <div style="background: #dcfce7; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Mã khiếu nại:</strong> #{{dispute_id}}</p>
    <p><strong>Kết quả:</strong> {{resolution}}</p>
    <p><strong>Hoàn tiền:</strong> {{refund_amount}}</p>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "dispute_id", "resolution", "refund_amount", "site_name"]',
TRUE);

-- Subscription Started
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'subscription_started',
'🎉 Đăng ký gói {{plan_name}} thành công',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Đăng ký thành công!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Bạn đã đăng ký gói <strong>{{plan_name}}</strong> thành công!</p>
  <div style="background: #dcfce7; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Gói:</strong> {{plan_name}}</p>
    <p><strong>Giá:</strong> {{price}}/{{billing_cycle}}</p>
    <p><strong>Gia hạn tiếp:</strong> {{next_billing_date}}</p>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "plan_name", "price", "billing_cycle", "next_billing_date", "site_name"]',
TRUE);

-- Subscription Renewal Reminder
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'subscription_renewal_reminder',
'⏰ Gói {{plan_name}} sẽ gia hạn trong {{days_left}} ngày',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #f59e0b;">Nhắc nhở gia hạn</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Gói đăng ký của bạn sẽ tự động gia hạn trong <strong>{{days_left}} ngày</strong>.</p>
  <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Gói:</strong> {{plan_name}}</p>
    <p><strong>Số tiền:</strong> {{price}}</p>
    <p><strong>Ngày gia hạn:</strong> {{renewal_date}}</p>
  </div>
  <p>Đảm bảo số dư ví đủ để gia hạn tự động.</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "plan_name", "price", "days_left", "renewal_date", "site_name"]',
TRUE);

-- Subscription Cancelled
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'subscription_cancelled',
'Hủy đăng ký gói {{plan_name}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #6b7280;">Hủy đăng ký</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Bạn đã hủy đăng ký gói <strong>{{plan_name}}</strong>.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Gói:</strong> {{plan_name}}</p>
    <p><strong>Còn hiệu lực đến:</strong> {{valid_until}}</p>
  </div>
  <p>Bạn vẫn có thể sử dụng quyền lợi đến hết thời hạn.</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "plan_name", "valid_until", "site_name"]',
TRUE);

-- Gift Card Received
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'gift_card_received',
'🎁 Bạn nhận được Gift Card từ {{sender_name}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #ec4899;">Bạn có quà!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p><strong>{{sender_name}}</strong> đã gửi tặng bạn một Gift Card!</p>
  <div style="background: linear-gradient(135deg, #fce7f3, #fbcfe8); padding: 24px; border-radius: 12px; margin: 16px 0; text-align: center;">
    <h3 style="color: #be185d;">Gift Card</h3>
    <p style="font-size: 24px; font-weight: bold; color: #be185d;">{{amount}}</p>
    <p><strong>Mã:</strong> {{gift_code}}</p>
  </div>
  <p><strong>Lời nhắn:</strong> "{{message}}"</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{redeem_url}}" style="background: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Sử dụng ngay</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "sender_name", "amount", "gift_code", "message", "redeem_url", "site_name"]',
TRUE);

-- Gift Card Sent
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'gift_card_sent',
'🎁 Gift Card đã được gửi đến {{recipient_name}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #ec4899;">Gửi quà thành công!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Gift Card của bạn đã được gửi đến <strong>{{recipient_name}}</strong>!</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Người nhận:</strong> {{recipient_name}} ({{recipient_email}})</p>
    <p><strong>Giá trị:</strong> {{amount}}</p>
    <p><strong>Mã:</strong> {{gift_code}}</p>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "recipient_name", "recipient_email", "amount", "gift_code", "site_name"]',
TRUE);

-- Weekly Digest
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'weekly_digest',
'📊 Báo cáo tuần của bạn',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Báo cáo tuần</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Đây là tổng kết hoạt động tuần qua của bạn.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Đơn hàng:</strong> {{orders_count}}</p>
    <p><strong>Tổng chi tiêu:</strong> {{total_spent}}</p>
    <p><strong>Điểm tích lũy:</strong> +{{points_earned}}</p>
    <p><strong>Tiết kiệm được:</strong> {{savings}}</p>
  </div>
  <h3>Sản phẩm hot tuần này:</h3>
  {{hot_products}}
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "orders_count", "total_spent", "points_earned", "savings", "hot_products", "site_name"]',
TRUE);

-- Monthly Statement
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'monthly_statement',
'📋 Sao kê tháng {{month}}/{{year}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Sao kê tháng</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Đây là sao kê hoạt động tháng {{month}}/{{year}} của bạn.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Số dư đầu kỳ:</strong> {{opening_balance}}</p>
    <p><strong>Tổng nạp:</strong> +{{total_deposit}}</p>
    <p><strong>Tổng chi:</strong> -{{total_spent}}</p>
    <p><strong>Số dư cuối kỳ:</strong> {{closing_balance}}</p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{statement_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Xem chi tiết</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "month", "year", "opening_balance", "total_deposit", "total_spent", "closing_balance", "statement_url", "site_name"]',
TRUE);

-- Reward Claim Reminder
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'reward_claim_reminder',
'🎁 Bạn có {{rewards_count}} phần thưởng chưa nhận!',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #8b5cf6;">Đừng quên phần thưởng!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Bạn có <strong>{{rewards_count}} phần thưởng</strong> đang chờ nhận!</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    {{rewards_list}}
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{rewards_url}}" style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Nhận thưởng ngay</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "rewards_count", "rewards_list", "rewards_url", "site_name"]',
TRUE);

-- Event Invitation
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'event_invitation',
'📅 Mời tham gia sự kiện: {{event_name}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Lời mời sự kiện</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Bạn được mời tham gia sự kiện đặc biệt!</p>
  <div style="background: linear-gradient(135deg, #dbeafe, #bfdbfe); padding: 24px; border-radius: 12px; margin: 16px 0;">
    <h3 style="color: #1d4ed8;">{{event_name}}</h3>
    <p><strong>Thời gian:</strong> {{event_date}}</p>
    <p><strong>Địa điểm:</strong> {{event_location}}</p>
    <p>{{event_description}}</p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{register_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Đăng ký tham gia</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "event_name", "event_date", "event_location", "event_description", "register_url", "site_name"]',
TRUE);

-- Event Reminder
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'event_reminder',
'⏰ Sự kiện {{event_name}} sắp diễn ra!',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #f59e0b;">Nhắc nhở sự kiện</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Sự kiện bạn đăng ký sắp diễn ra!</p>
  <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <h3>{{event_name}}</h3>
    <p><strong>Thời gian:</strong> {{event_date}}</p>
    <p><strong>Còn:</strong> {{time_remaining}}</p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{event_url}}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Xem chi tiết</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "event_name", "event_date", "time_remaining", "event_url", "site_name"]',
TRUE);

-- Maintenance Notice
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'maintenance_notice',
'🔧 Thông báo bảo trì hệ thống',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #f59e0b;">Bảo trì hệ thống</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Hệ thống sẽ tạm ngưng để bảo trì.</p>
  <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Bắt đầu:</strong> {{start_time}}</p>
    <p><strong>Kết thúc dự kiến:</strong> {{end_time}}</p>
    <p><strong>Thời gian:</strong> {{duration}}</p>
  </div>
  <p>Xin lỗi vì sự bất tiện này!</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "start_time", "end_time", "duration", "site_name"]',
TRUE);

-- System Update
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'system_update',
'🆕 Cập nhật mới trên {{site_name}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Tính năng mới!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Chúng tôi vừa cập nhật một số tính năng mới!</p>
  <div style="background: #dcfce7; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <h3>Có gì mới?</h3>
    {{update_content}}
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{changelog_url}}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Xem chi tiết</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "update_content", "changelog_url", "site_name"]',
TRUE);

-- Survey Invitation
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'survey_invitation',
'📝 Khảo sát ý kiến - Nhận {{reward}} điểm',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #8b5cf6;">Cho chúng tôi biết ý kiến!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Hãy dành 2 phút để chia sẻ trải nghiệm của bạn.</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Khảo sát:</strong> {{survey_name}}</p>
    <p><strong>Phần thưởng:</strong> {{reward}} điểm</p>
    <p><strong>Thời gian:</strong> ~{{duration}} phút</p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{survey_url}}" style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Làm khảo sát</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "survey_name", "reward", "duration", "survey_url", "site_name"]',
TRUE);

-- Account Reactivation
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'account_reactivation',
'👋 Chúng tôi nhớ bạn!',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Lâu quá không gặp!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Đã {{days_inactive}} ngày kể từ lần đăng nhập cuối của bạn.</p>
  <p>Chúng tôi có nhiều điều mới muốn chia sẻ!</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p>🎁 Ưu đãi đặc biệt: <strong>{{special_offer}}</strong></p>
    <p>📦 Sản phẩm mới: <strong>{{new_products_count}}</strong></p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{site_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Quay lại mua sắm</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "days_inactive", "special_offer", "new_products_count", "site_url", "site_name"]',
TRUE);

-- Affiliate Payout
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'affiliate_payout',
'💰 Hoa hồng affiliate đã được thanh toán',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Thanh toán hoa hồng!</h2>
  <p>Xin chào <strong>{{affiliate_name}}</strong>,</p>
  <p>Hoa hồng affiliate của bạn đã được thanh toán!</p>
  <div style="background: #dcfce7; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Số tiền:</strong> {{amount}}</p>
    <p><strong>Kỳ thanh toán:</strong> {{period}}</p>
    <p><strong>Số đơn:</strong> {{orders_count}}</p>
    <p><strong>Mã giao dịch:</strong> {{transaction_id}}</p>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["affiliate_name", "amount", "period", "orders_count", "transaction_id", "site_name"]',
TRUE);

-- Affiliate Tier Upgrade
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'affiliate_tier_upgrade',
'🚀 Bạn đã lên hạng Affiliate {{new_tier}}!',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #f59e0b;">Chúc mừng lên hạng!</h2>
  <p>Xin chào <strong>{{affiliate_name}}</strong>,</p>
  <p>Bạn đã đạt hạng <strong style="color: #f59e0b;">{{new_tier}}</strong>!</p>
  <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Hạng mới:</strong> {{new_tier}}</p>
    <p><strong>Tỷ lệ hoa hồng:</strong> {{commission_rate}}%</p>
  </div>
  <h3>Quyền lợi mới:</h3>
  {{new_benefits}}
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["affiliate_name", "new_tier", "commission_rate", "new_benefits", "site_name"]',
TRUE);

-- Low Stock Alert (Seller)
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'low_stock_alert',
'⚠️ Cảnh báo: {{products_count}} sản phẩm sắp hết hàng',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #f59e0b;">Cảnh báo tồn kho!</h2>
  <p>Xin chào <strong>{{seller_name}}</strong>,</p>
  <p>Có <strong>{{products_count}} sản phẩm</strong> sắp hết hàng!</p>
  <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0;">
    {{low_stock_products}}
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{inventory_url}}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Quản lý kho</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["seller_name", "products_count", "low_stock_products", "inventory_url", "site_name"]',
TRUE);

-- New Sale (Seller)
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'seller_new_sale',
'🎉 Bạn có đơn hàng mới #{{order_number}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Đơn hàng mới!</h2>
  <p>Xin chào <strong>{{seller_name}}</strong>,</p>
  <p>Bạn vừa nhận được đơn hàng mới!</p>
  <div style="background: #dcfce7; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Mã đơn:</strong> #{{order_number}}</p>
    <p><strong>Sản phẩm:</strong> {{product_name}}</p>
    <p><strong>Số lượng:</strong> {{quantity}}</p>
    <p><strong>Tổng:</strong> {{total_amount}}</p>
    <p><strong>Khách hàng:</strong> {{customer_name}}</p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{order_url}}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Xử lý đơn hàng</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["seller_name", "order_number", "product_name", "quantity", "total_amount", "customer_name", "order_url", "site_name"]',
TRUE);

-- Daily Sales Report (Seller)
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'seller_daily_report',
'📊 Báo cáo bán hàng ngày {{date}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Báo cáo ngày</h2>
  <p>Xin chào <strong>{{seller_name}}</strong>,</p>
  <p>Tổng kết bán hàng ngày {{date}}:</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Tổng đơn:</strong> {{orders_count}}</p>
    <p><strong>Doanh thu:</strong> {{revenue}}</p>
    <p><strong>Lợi nhuận:</strong> {{profit}}</p>
    <p><strong>Sản phẩm bán:</strong> {{products_sold}}</p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{dashboard_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Xem Dashboard</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["seller_name", "date", "orders_count", "revenue", "profit", "products_sold", "dashboard_url", "site_name"]',
TRUE);

-- Two Factor Enabled
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'two_factor_enabled',
'🔐 Xác thực 2 lớp đã được bật',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Bảo mật tăng cường!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Xác thực 2 lớp (2FA) đã được kích hoạt cho tài khoản của bạn.</p>
  <div style="background: #dcfce7; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Phương thức:</strong> {{method}}</p>
    <p><strong>Thời gian:</strong> {{timestamp}}</p>
  </div>
  <p>Tài khoản của bạn giờ đã an toàn hơn!</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "method", "timestamp", "site_name"]',
TRUE);

-- Account Deletion Request
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'account_deletion_request',
'⚠️ Yêu cầu xóa tài khoản',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #dc2626;">Xác nhận xóa tài khoản</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Chúng tôi nhận được yêu cầu xóa tài khoản của bạn.</p>
  <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Thời gian yêu cầu:</strong> {{timestamp}}</p>
    <p><strong>Xóa vĩnh viễn sau:</strong> {{deletion_date}}</p>
  </div>
  <p>Nếu bạn đổi ý, hãy đăng nhập trước ngày trên để hủy yêu cầu.</p>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "timestamp", "deletion_date", "site_name"]',
TRUE);

-- Order Status Update
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'order_status_update',
'🔄 Cập nhật trạng thái đơn hàng #{{order_id}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Cập nhật đơn hàng</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Đơn hàng <strong>#{{order_id}}</strong> của bạn đã được cập nhật:</p>
  <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Trạng thái mới:</strong> {{status}}</p>
    <p><strong>Thời gian:</strong> {{timestamp}}</p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{order_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Xem chi tiết</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "order_id", "status", "timestamp", "order_url", "site_name"]',
TRUE);

-- Order Account Delivered
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'order_account_delivered',
'📬 Tài khoản đã được giao - Đơn hàng #{{order_id}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Tài khoản của bạn đã sẵn sàng!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Đơn hàng <strong>#{{order_id}}</strong> đã được xử lý. Dưới đây là thông tin tài khoản:</p>
  <div style="background: #dcfce7; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #86efac;">
    <p><strong>Sản phẩm:</strong> {{product_name}}</p>
    <pre style="background: #fff; padding: 12px; border-radius: 4px; overflow-x: auto;">{{account_info}}</pre>
  </div>
  <p style="color: #dc2626;"><strong>Lưu ý:</strong> Vui lòng đổi mật khẩu ngay sau khi nhận tài khoản.</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{order_url}}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Xem đơn hàng</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "order_id", "product_name", "account_info", "order_url", "site_name"]',
TRUE);

-- Wishlist Sale
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'wishlist_sale',
'🔥 Sản phẩm yêu thích đang giảm giá!',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #dc2626;">Flash Sale!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Tin vui! Sản phẩm trong danh sách yêu thích của bạn đang có khuyến mãi:</p>
  <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #fecaca;">
    <p><strong>{{product_name}}</strong></p>
    <p style="text-decoration: line-through; color: #6b7280;">{{original_price}}</p>
    <p style="font-size: 24px; color: #dc2626; font-weight: bold;">{{sale_price}}</p>
    <p>Giảm {{discount_percent}}%</p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{product_url}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Mua ngay</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "product_name", "original_price", "sale_price", "discount_percent", "product_url", "site_name"]',
TRUE);

-- Stock Back
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'stock_back',
'📦 Sản phẩm đã có hàng trở lại!',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Đã có hàng!</h2>
  <p>Xin chào <strong>{{customer_name}}</strong>,</p>
  <p>Sản phẩm bạn quan tâm đã có hàng trở lại:</p>
  <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>{{product_name}}</strong></p>
    <p><strong>Giá:</strong> {{price}}</p>
    <p><strong>Số lượng:</strong> {{stock_quantity}} sản phẩm</p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{product_url}}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Xem sản phẩm</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["customer_name", "product_name", "price", "stock_quantity", "product_url", "site_name"]',
TRUE);

-- New Message
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'new_message',
'💬 Bạn có tin nhắn mới từ {{sender_name}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Tin nhắn mới</h2>
  <p>Xin chào <strong>{{recipient_name}}</strong>,</p>
  <p>Bạn vừa nhận được tin nhắn mới:</p>
  <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Từ:</strong> {{sender_name}}</p>
    <p><strong>Nội dung:</strong></p>
    <p style="background: white; padding: 12px; border-radius: 4px;">{{message_preview}}</p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{message_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Xem tin nhắn</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["recipient_name", "sender_name", "message_preview", "message_url", "site_name"]',
TRUE);

-- Chat Message
INSERT IGNORE INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `is_active`) VALUES
(UUID(), 'chat_message',
'💬 Tin nhắn hỗ trợ từ {{sender_name}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #8b5cf6;">Tin nhắn hỗ trợ</h2>
  <p>Xin chào <strong>{{recipient_name}}</strong>,</p>
  <p>Bạn có tin nhắn mới trong cuộc trò chuyện hỗ trợ:</p>
  <div style="background: #f5f3ff; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #8b5cf6;">
    <p><strong>{{sender_name}}</strong> viết:</p>
    <p style="background: white; padding: 12px; border-radius: 4px;">{{message_content}}</p>
    <p style="font-size: 12px; color: #6b7280;">{{timestamp}}</p>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{chat_url}}" style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Trả lời ngay</a>
  </div>
  <p>Trân trọng,<br>{{site_name}}</p>
</div>',
'["recipient_name", "sender_name", "message_content", "timestamp", "chat_url", "site_name"]',
TRUE);

-- =============================================
-- NOTE: Admin user is created by Setup Wizard
-- No default admin user is inserted here for security
-- =============================================

-- =============================================
-- DONE
-- =============================================
