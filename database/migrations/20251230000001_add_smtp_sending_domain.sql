-- =============================================
-- Migration: Add SMTP Sending Domain Flag
-- Date: 2025-12-30
-- Description: Allow mail domains to be used for SMTP sending
-- =============================================

-- Thêm cột use_for_sending vào mail_domains
ALTER TABLE `mail_domains`
ADD COLUMN IF NOT EXISTS `use_for_sending` BOOLEAN DEFAULT FALSE COMMENT 'Use this domain for automated email sending (OTP, orders, etc.)' AFTER `is_public`;

-- Tạo index
CREATE INDEX IF NOT EXISTS `idx_mail_domains_sending` ON `mail_domains` (`use_for_sending`);

-- Comment: Chỉ nên có 1 domain được đánh dấu use_for_sending = true tại một thời điểm
-- Admin có thể toggle trong Mail Server UI
