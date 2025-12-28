-- Add Discord templates table
CREATE TABLE IF NOT EXISTS `discord_templates` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `title` VARCHAR(500) NOT NULL,
  `title_en` VARCHAR(500),
  `message` TEXT NOT NULL,
  `message_en` TEXT,
  `description` TEXT,
  `description_en` TEXT,
  `category` VARCHAR(50),
  `color` INT DEFAULT 3447003,
  `is_active` BOOLEAN DEFAULT TRUE,
  `variables` JSON COMMENT 'Array of available variables like ["orderNumber", "total"]',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category` (`category`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default Discord templates
INSERT INTO `discord_templates` (`name`, `title`, `title_en`, `message`, `message_en`, `description`, `description_en`, `category`, `color`, `variables`) VALUES
-- Order templates
('ORDER_PLACED', '🛒 Đơn hàng đã đặt', '🛒 Order Placed', 'Đơn hàng **#{orderNumber}** của bạn đã được đặt và đang được xử lý.\n\nChúng tôi sẽ thông báo khi đơn hàng sẵn sàng giao.', 'Your order **#{orderNumber}** has been placed and is being processed.\n\nWe''ll notify you once it''s ready for delivery.', 'Thông báo khi đơn hàng được tạo', 'Notification when order is placed', 'order', 53578, '["orderNumber", "total", "items"]'),
('ORDER_CONFIRMED', '✅ Đơn hàng đã xác nhận', '✅ Order Confirmed', 'Đơn hàng **#{orderNumber}** đã được xác nhận và sẽ sớm được giao.', 'Your order **#{orderNumber}** has been confirmed and will be delivered soon.', 'Thông báo khi đơn hàng được xác nhận', 'Notification when order is confirmed', 'order', 53578, '["orderNumber", "total"]'),
('ORDER_DELIVERED', '🎉 Đơn hàng đã giao!', '🎉 Order Delivered!', 'Tin tốt! Đơn hàng **#{orderNumber}** đã được giao thành công.\n\nCảm ơn bạn đã mua hàng!', 'Great news! Your order **#{orderNumber}** has been successfully delivered.\n\nThank you for shopping with us!', 'Thông báo khi giao hàng thành công', 'Notification when order is delivered', 'order', 53578, '["orderNumber", "total", "items"]'),
('ORDER_CANCELLED', '❌ Đơn hàng đã hủy', '❌ Order Cancelled', 'Đơn hàng **#{orderNumber}** đã bị hủy.', 'Your order **#{orderNumber}** has been cancelled.', 'Thông báo khi đơn hàng bị hủy', 'Notification when order is cancelled', 'order', 15615044, '["orderNumber", "reason"]'),
('ORDER_REFUNDED', '💸 Đơn hàng đã hoàn tiền', '💸 Order Refunded', 'Đơn hàng **#{orderNumber}** đã được hoàn tiền.\n\nSố tiền sẽ được cộng lại vào ví của bạn.', 'Your order **#{orderNumber}** has been refunded.\n\nThe amount will be credited back to your wallet.', 'Thông báo khi hoàn tiền đơn hàng', 'Notification when order is refunded', 'order', 16027915, '["orderNumber", "amount"]'),

-- Payment templates
('PAYMENT_SUCCESS', '💰 Thanh toán thành công', '💰 Payment Successful', 'Thanh toán **{amount}** đã được xử lý thành công!', 'Your payment of **{amount}** has been processed successfully!', 'Thông báo thanh toán thành công', 'Payment success notification', 'payment', 53578, '["amount", "method", "transactionId"]'),
('PAYMENT_FAILED', '❌ Thanh toán thất bại', '❌ Payment Failed', 'Không thể xử lý thanh toán **{amount}**.\n\n**Lý do:** {reason}\n\nVui lòng thử lại hoặc liên hệ hỗ trợ.', 'Your payment of **{amount}** could not be processed.\n\n**Reason:** {reason}\n\nPlease try again or contact support.', 'Thông báo thanh toán thất bại', 'Payment failed notification', 'payment', 15615044, '["amount", "reason"]'),
('DEPOSIT_SUCCESS', '💵 Nạp tiền thành công', '💵 Deposit Successful', '**{amount}** đã được nạp vào ví.\n\nSố dư mới: **{balance}**', '**{amount}** has been added to your wallet.\n\nYour new balance is **{balance}**.', 'Thông báo nạp tiền thành công', 'Deposit success notification', 'payment', 53578, '["amount", "balance"]'),
('WITHDRAWAL_REQUEST', '🏦 Yêu cầu rút tiền', '🏦 Withdrawal Request', 'Yêu cầu rút **{amount}** đã được nhận và đang xử lý.\n\nTiền sẽ được chuyển về tài khoản {bankName} trong 1-3 ngày.', 'Your withdrawal request for **{amount}** has been received and is being processed.\n\nFunds will be transferred to your {bankName} account within 1-3 business days.', 'Thông báo yêu cầu rút tiền', 'Withdrawal request notification', 'payment', 16027915, '["amount", "bankName"]'),
('WITHDRAWAL_COMPLETED', '✅ Rút tiền hoàn tất', '✅ Withdrawal Completed', 'Rút tiền **{amount}** đã hoàn tất!\n\nVui lòng kiểm tra tài khoản {bankName}.', 'Your withdrawal of **{amount}** has been completed!\n\nPlease check your {bankName} account.', 'Thông báo hoàn tất rút tiền', 'Withdrawal completed notification', 'payment', 53578, '["amount", "bankName"]'),

-- Account templates
('WELCOME', '🎉 Chào mừng đến Prime Shop!', '🎉 Welcome to Prime Shop!', 'Xin chào **{username}**!\n\nCảm ơn bạn đã tham gia Prime Shop. Chúng tôi rất vui khi có bạn!\n\nTài khoản Discord đã được liên kết thành công. Bạn sẽ nhận thông báo quan trọng ngay tại đây.', 'Hi **{username}**!\n\nThank you for joining Prime Shop. We''re excited to have you here!\n\nYour Discord account has been successfully linked.', 'Chào mừng người dùng mới', 'Welcome new user', 'account', 3906810, '["username"]'),
('PROFILE_UPDATED', '✏️ Hồ sơ đã cập nhật', '✏️ Profile Updated', 'Hồ sơ của bạn đã được cập nhật thành công.', 'Your profile has been updated successfully.', 'Thông báo cập nhật hồ sơ', 'Profile update notification', 'account', 3906810, '["changes"]'),
('VIP_UPGRADE', '⭐ Nâng cấp VIP!', '⭐ VIP Upgrade!', 'Chúc mừng! Bạn đã được nâng cấp lên **{tier}**!', 'Congratulations! You''ve been upgraded to **{tier}** tier!', 'Thông báo nâng cấp VIP', 'VIP upgrade notification', 'account', 16027915, '["tier", "benefits"]'),
('ACHIEVEMENT_UNLOCKED', '🏆 Mở khóa thành tựu!', '🏆 Achievement Unlocked!', '**{name}**\n\n{description}', '**{name}**\n\n{description}', 'Thông báo mở khóa thành tựu', 'Achievement unlock notification', 'account', 16027915, '["name", "description", "reward"]'),

-- Security templates
('LOGIN_ALERT', '🔐 Phát hiện đăng nhập mới', '🔐 New Login Detected', 'Phát hiện đăng nhập mới vào tài khoản.\n\n**Nếu không phải bạn, vui lòng bảo mật tài khoản ngay.**', 'A new login to your account was detected.\n\n**If this wasn''t you, please secure your account immediately.**', 'Cảnh báo đăng nhập mới', 'New login alert', 'security', 15615044, '["ip", "location", "device", "time"]'),
('PASSWORD_CHANGED', '🔒 Mật khẩu đã thay đổi', '🔒 Password Changed', 'Mật khẩu đã được thay đổi thành công.\n\n**Nếu không phải bạn, liên hệ hỗ trợ ngay.**', 'Your password has been changed successfully.\n\n**If you didn''t make this change, contact support immediately.**', 'Thông báo đổi mật khẩu', 'Password changed notification', 'security', 16027915, '["time", "ip"]'),
('SUSPICIOUS_ACTIVITY', '⚠️ Phát hiện hoạt động bất thường', '⚠️ Suspicious Activity', 'Phát hiện hoạt động bất thường:\n\n**{activity}**\n\nVui lòng xác minh tài khoản và đổi mật khẩu nếu cần.', 'We detected suspicious activity on your account:\n\n**{activity}**\n\nPlease verify your account.', 'Cảnh báo hoạt động đáng ngờ', 'Suspicious activity alert', 'security', 15615044, '["activity", "time"]'),

-- Social templates  
('NEW_FOLLOWER', '👥 Người theo dõi mới', '👥 New Follower', '**{username}** đã theo dõi bạn!', '**{username}** started following you!', 'Thông báo người theo dõi mới', 'New follower notification', 'social', 15580345, '["username", "profileUrl"]'),
('POST_LIKED', '❤️ Ai đó thích bài viết', '❤️ Post Liked', '**{username}** đã thích bài: "{postTitle}"', '**{username}** liked your post: "{postTitle}"', 'Thông báo like bài viết', 'Post liked notification', 'social', 15580345, '["username", "postTitle"]'),
('NEW_COMMENT', '💬 Bình luận mới', '💬 New Comment', '**{username}** đã bình luận: "{postTitle}"', '**{username}** commented on "{postTitle}"', 'Thông báo bình luận mới', 'New comment notification', 'social', 15580345, '["username", "postTitle", "comment"]'),

-- Marketplace templates
('SHOP_APPROVED', '🏪 Shop đã được duyệt!', '🏪 Shop Approved!', 'Chúc mừng! Shop **{shopName}** đã được duyệt và hoạt động!', 'Congratulations! Your shop **{shopName}** has been approved!', 'Thông báo duyệt shop', 'Shop approval notification', 'marketplace', 9109718, '["shopName"]'),
('NEW_SALE', '💰 Bán hàng mới!', '💰 New Sale!', 'Bạn vừa bán được!\n\n**{productName}** được mua bởi **{buyer}**.', 'You made a sale!\n\n**{productName}** was purchased by **{buyer}**.', 'Thông báo bán hàng', 'New sale notification', 'marketplace', 9109718, '["productName", "amount", "buyer"]'),
('LOW_STOCK_ALERT', '📦 Cảnh báo hết hàng', '📦 Low Stock Alert', 'Sản phẩm **{productName}** sắp hết!\n\nChỉ còn **{remaining}** sản phẩm.', 'Your product **{productName}** is running low!\n\nOnly **{remaining}** items remaining.', 'Cảnh báo hàng sắp hết', 'Low stock alert', 'marketplace', 16027915, '["productName", "remaining"]'),

-- System templates
('MAINTENANCE_SCHEDULED', '🔧 Bảo trì hệ thống', '🔧 Maintenance', 'Prime Shop sẽ bảo trì.\n\n**Thời gian:** {startTime}\n**Thời lượng:** {duration}', 'Prime Shop will undergo maintenance.\n\n**Start:** {startTime}\n**Duration:** {duration}', 'Thông báo bảo trì', 'Maintenance notification', 'system', 7040640, '["startTime", "duration"]'),
('NEW_FEATURE', '🎊 Tính năng mới!', '🎊 New Feature!', '**{featureName}**\n\n{description}', '**{featureName}**\n\n{description}', 'Thông báo tính năng mới', 'New feature announcement', 'system', 3906810, '["featureName", "description"]'),
('VOUCHER_AVAILABLE', '🎁 Voucher mới!', '🎁 New Voucher!', 'Sử dụng mã **{code}** để được giảm {discount}!\n\n**Hết hạn:** {expiresAt}', 'Use code **{code}** to get {discount} discount!\n\n**Expires:** {expiresAt}', 'Thông báo voucher mới', 'New voucher notification', 'system', 16027915, '["code", "discount", "expiresAt"]'),
('FLASH_SALE_ALERT', '⚡ Flash Sale!', '⚡ Flash Sale Alert!', '**{productName}** đang flash sale!\n\nGiảm {discount} - kết thúc {endsAt}!', '**{productName}** is on flash sale!\n\nGet {discount} discount - ends {endsAt}!', 'Cảnh báo flash sale', 'Flash sale alert', 'system', 15615044, '["productName", "discount", "endsAt"]');
