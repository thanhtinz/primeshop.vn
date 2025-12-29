-- =============================================
-- Migration: Mail Domains & Permissions System
-- Date: 2025-12-28
-- Description: Support multiple domains, admin management, and role-based permissions
-- =============================================

-- Bảng quản lý tên miền email
CREATE TABLE IF NOT EXISTS `mail_domains` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `domain` VARCHAR(255) NOT NULL UNIQUE,
  `display_name` VARCHAR(255),
  `description` TEXT,
  `is_active` BOOLEAN DEFAULT TRUE,
  `is_default` BOOLEAN DEFAULT FALSE,
  `is_public` BOOLEAN DEFAULT FALSE COMMENT 'Cho phép user tự đăng ký mailbox',
  `max_mailboxes` INT DEFAULT 0 COMMENT '0 = unlimited',
  `max_storage_mb` INT DEFAULT 1024 COMMENT 'Storage limit per mailbox in MB',
  `max_message_size_mb` INT DEFAULT 25 COMMENT 'Max attachment size in MB',
  `allowed_features` JSON COMMENT 'Features enabled for this domain',
  `smtp_settings` JSON COMMENT 'SMTP configuration for external sending',
  `dkim_selector` VARCHAR(100),
  `dkim_private_key` TEXT,
  `spf_record` VARCHAR(500),
  `mx_verified` BOOLEAN DEFAULT FALSE,
  `created_by` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_mail_domains_active` (`is_active`),
  INDEX `idx_mail_domains_public` (`is_public`)
);

-- Bảng quản trị viên domain
CREATE TABLE IF NOT EXISTS `mail_domain_admins` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `domain_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `role` ENUM('owner', 'admin', 'manager') DEFAULT 'admin',
  `permissions` JSON COMMENT 'Specific permissions for this admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_domain_admin` (`domain_id`, `user_id`),
  INDEX `idx_domain_admins_user` (`user_id`),
  FOREIGN KEY (`domain_id`) REFERENCES `mail_domains`(`id`) ON DELETE CASCADE
);

-- Cập nhật bảng mailboxes để thêm domain_id và quota
ALTER TABLE `mailboxes`
ADD COLUMN IF NOT EXISTS `domain_id` VARCHAR(36) AFTER `user_id`,
ADD COLUMN IF NOT EXISTS `local_part` VARCHAR(100) AFTER `domain_id` COMMENT 'Part before @',
ADD COLUMN IF NOT EXISTS `quota_mb` INT DEFAULT 1024 AFTER `auto_reply_message`,
ADD COLUMN IF NOT EXISTS `used_storage_mb` INT DEFAULT 0 AFTER `quota_mb`,
ADD COLUMN IF NOT EXISTS `role` ENUM('user', 'admin', 'super_admin') DEFAULT 'user' AFTER `used_storage_mb`,
ADD COLUMN IF NOT EXISTS `can_send_external` BOOLEAN DEFAULT FALSE AFTER `role`,
ADD COLUMN IF NOT EXISTS `can_receive_external` BOOLEAN DEFAULT FALSE AFTER `can_send_external`,
ADD COLUMN IF NOT EXISTS `forwarding_address` VARCHAR(255) AFTER `can_receive_external`,
ADD COLUMN IF NOT EXISTS `created_by` VARCHAR(36) AFTER `forwarding_address`;

-- Add index for domain
CREATE INDEX IF NOT EXISTS `idx_mailboxes_domain` ON `mailboxes` (`domain_id`);
CREATE INDEX IF NOT EXISTS `idx_mailboxes_local_part` ON `mailboxes` (`local_part`);

-- Bảng alias email (nhiều địa chỉ -> 1 mailbox)
CREATE TABLE IF NOT EXISTS `mail_aliases` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `domain_id` VARCHAR(36) NOT NULL,
  `local_part` VARCHAR(100) NOT NULL,
  `mailbox_id` VARCHAR(36) NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_alias` (`domain_id`, `local_part`),
  INDEX `idx_aliases_mailbox` (`mailbox_id`),
  FOREIGN KEY (`domain_id`) REFERENCES `mail_domains`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`mailbox_id`) REFERENCES `mailboxes`(`id`) ON DELETE CASCADE
);

-- Bảng distribution list (nhóm email)
CREATE TABLE IF NOT EXISTS `mail_distribution_lists` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `domain_id` VARCHAR(36) NOT NULL,
  `local_part` VARCHAR(100) NOT NULL,
  `display_name` VARCHAR(255),
  `description` TEXT,
  `is_active` BOOLEAN DEFAULT TRUE,
  `allow_external_senders` BOOLEAN DEFAULT FALSE,
  `moderated` BOOLEAN DEFAULT FALSE,
  `moderator_mailbox_id` VARCHAR(36),
  `created_by` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_dist_list` (`domain_id`, `local_part`),
  FOREIGN KEY (`domain_id`) REFERENCES `mail_domains`(`id`) ON DELETE CASCADE
);

-- Thành viên distribution list
CREATE TABLE IF NOT EXISTS `mail_distribution_list_members` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `list_id` VARCHAR(36) NOT NULL,
  `mailbox_id` VARCHAR(36),
  `external_email` VARCHAR(255),
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_dist_members_list` (`list_id`),
  INDEX `idx_dist_members_mailbox` (`mailbox_id`),
  FOREIGN KEY (`list_id`) REFERENCES `mail_distribution_lists`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`mailbox_id`) REFERENCES `mailboxes`(`id`) ON DELETE SET NULL
);

-- Bảng log hoạt động mail
CREATE TABLE IF NOT EXISTS `mail_activity_logs` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `domain_id` VARCHAR(36),
  `mailbox_id` VARCHAR(36),
  `message_id` VARCHAR(36),
  `action` ENUM('send', 'receive', 'read', 'delete', 'move', 'forward', 'reply', 'login', 'settings_change', 'quota_exceeded') NOT NULL,
  `details` JSON,
  `ip_address` VARCHAR(45),
  `user_agent` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_activity_domain` (`domain_id`),
  INDEX `idx_activity_mailbox` (`mailbox_id`),
  INDEX `idx_activity_action` (`action`),
  INDEX `idx_activity_created` (`created_at`),
  FOREIGN KEY (`domain_id`) REFERENCES `mail_domains`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`mailbox_id`) REFERENCES `mailboxes`(`id`) ON DELETE SET NULL
);

-- Bảng cấu hình spam/security
CREATE TABLE IF NOT EXISTS `mail_security_settings` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `domain_id` VARCHAR(36) NOT NULL UNIQUE,
  `spam_filter_enabled` BOOLEAN DEFAULT TRUE,
  `spam_threshold` DECIMAL(3,2) DEFAULT 5.0,
  `virus_scan_enabled` BOOLEAN DEFAULT TRUE,
  `dkim_enabled` BOOLEAN DEFAULT FALSE,
  `spf_enabled` BOOLEAN DEFAULT FALSE,
  `dmarc_enabled` BOOLEAN DEFAULT FALSE,
  `greylist_enabled` BOOLEAN DEFAULT FALSE,
  `rate_limit_per_hour` INT DEFAULT 100,
  `blocked_senders` JSON,
  `blocked_domains` JSON,
  `allowed_senders` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`domain_id`) REFERENCES `mail_domains`(`id`) ON DELETE CASCADE
);

-- Bảng whitelist/blacklist global
CREATE TABLE IF NOT EXISTS `mail_sender_rules` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `domain_id` VARCHAR(36),
  `mailbox_id` VARCHAR(36),
  `rule_type` ENUM('whitelist', 'blacklist') NOT NULL,
  `sender_email` VARCHAR(255),
  `sender_domain` VARCHAR(255),
  `reason` TEXT,
  `created_by` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sender_rules_domain` (`domain_id`),
  INDEX `idx_sender_rules_mailbox` (`mailbox_id`),
  INDEX `idx_sender_rules_type` (`rule_type`),
  FOREIGN KEY (`domain_id`) REFERENCES `mail_domains`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`mailbox_id`) REFERENCES `mailboxes`(`id`) ON DELETE CASCADE
);

-- Insert default domain
INSERT INTO `mail_domains` (`id`, `domain`, `display_name`, `description`, `is_active`, `is_default`, `is_public`, `max_mailboxes`, `allowed_features`)
VALUES (
  UUID(),
  'primemail.vn',
  'PrimeMail',
  'Hệ thống email mặc định',
  TRUE,
  TRUE,
  TRUE,
  0,
  '["compose", "folders", "labels", "filters", "auto_reply", "signature", "contacts"]'
) ON DUPLICATE KEY UPDATE `display_name` = VALUES(`display_name`);
