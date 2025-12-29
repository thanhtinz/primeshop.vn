-- =============================================
-- Migration: Mailbox System
-- Date: 2025-12-28
-- Description: Complete mail system with inbox, outbox, drafts, folders
-- =============================================

-- Bảng hộp thư email (địa chỉ email ảo cho mỗi user)
CREATE TABLE IF NOT EXISTS `mailboxes` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `email_address` VARCHAR(255) NOT NULL UNIQUE,
  `display_name` VARCHAR(255),
  `signature` TEXT,
  `is_active` BOOLEAN DEFAULT TRUE,
  `auto_reply_enabled` BOOLEAN DEFAULT FALSE,
  `auto_reply_message` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_mailboxes_user_id` (`user_id`),
  INDEX `idx_mailboxes_email` (`email_address`)
);

-- Bảng thư mục email (Inbox, Sent, Drafts, Trash, Spam, Custom folders)
CREATE TABLE IF NOT EXISTS `mail_folders` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `mailbox_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `icon` VARCHAR(50),
  `color` VARCHAR(20),
  `is_system` BOOLEAN DEFAULT FALSE,
  `sort_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_mail_folders_mailbox` (`mailbox_id`),
  UNIQUE KEY `unique_folder_slug` (`mailbox_id`, `slug`),
  FOREIGN KEY (`mailbox_id`) REFERENCES `mailboxes`(`id`) ON DELETE CASCADE
);

-- Bảng email messages
CREATE TABLE IF NOT EXISTS `mail_messages` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `mailbox_id` VARCHAR(36) NOT NULL,
  `folder_id` VARCHAR(36) NOT NULL,
  `thread_id` VARCHAR(36),
  `message_id` VARCHAR(255),
  `in_reply_to` VARCHAR(255),
  `references` TEXT,
  `from_address` VARCHAR(255) NOT NULL,
  `from_name` VARCHAR(255),
  `to_addresses` JSON NOT NULL,
  `cc_addresses` JSON,
  `bcc_addresses` JSON,
  `reply_to` VARCHAR(255),
  `subject` VARCHAR(500),
  `body_text` TEXT,
  `body_html` LONGTEXT,
  `preview` VARCHAR(255),
  `priority` ENUM('low', 'normal', 'high') DEFAULT 'normal',
  `is_read` BOOLEAN DEFAULT FALSE,
  `is_starred` BOOLEAN DEFAULT FALSE,
  `is_important` BOOLEAN DEFAULT FALSE,
  `is_draft` BOOLEAN DEFAULT FALSE,
  `is_sent` BOOLEAN DEFAULT FALSE,
  `has_attachments` BOOLEAN DEFAULT FALSE,
  `labels` JSON,
  `scheduled_at` TIMESTAMP NULL,
  `sent_at` TIMESTAMP NULL,
  `received_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  INDEX `idx_mail_messages_mailbox` (`mailbox_id`),
  INDEX `idx_mail_messages_folder` (`folder_id`),
  INDEX `idx_mail_messages_thread` (`thread_id`),
  INDEX `idx_mail_messages_from` (`from_address`),
  INDEX `idx_mail_messages_read` (`is_read`),
  INDEX `idx_mail_messages_starred` (`is_starred`),
  INDEX `idx_mail_messages_received` (`received_at`),
  FULLTEXT INDEX `idx_mail_messages_search` (`subject`, `body_text`),
  FOREIGN KEY (`mailbox_id`) REFERENCES `mailboxes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`folder_id`) REFERENCES `mail_folders`(`id`) ON DELETE CASCADE
);

-- Bảng đính kèm email
CREATE TABLE IF NOT EXISTS `mail_attachments` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `message_id` VARCHAR(36) NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `original_filename` VARCHAR(255) NOT NULL,
  `mime_type` VARCHAR(100),
  `size` BIGINT DEFAULT 0,
  `storage_path` VARCHAR(500),
  `content_id` VARCHAR(255),
  `is_inline` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_mail_attachments_message` (`message_id`),
  FOREIGN KEY (`message_id`) REFERENCES `mail_messages`(`id`) ON DELETE CASCADE
);

-- Bảng nhãn email
CREATE TABLE IF NOT EXISTS `mail_labels` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `mailbox_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `color` VARCHAR(20) DEFAULT '#6b7280',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_mail_labels_mailbox` (`mailbox_id`),
  UNIQUE KEY `unique_label_name` (`mailbox_id`, `name`),
  FOREIGN KEY (`mailbox_id`) REFERENCES `mailboxes`(`id`) ON DELETE CASCADE
);

-- Bảng danh bạ email
CREATE TABLE IF NOT EXISTS `mail_contacts` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `mailbox_id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255),
  `avatar_url` VARCHAR(500),
  `is_favorite` BOOLEAN DEFAULT FALSE,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_mail_contacts_mailbox` (`mailbox_id`),
  INDEX `idx_mail_contacts_email` (`email`),
  UNIQUE KEY `unique_contact_email` (`mailbox_id`, `email`),
  FOREIGN KEY (`mailbox_id`) REFERENCES `mailboxes`(`id`) ON DELETE CASCADE
);

-- Bảng cài đặt email
CREATE TABLE IF NOT EXISTS `mail_settings` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `mailbox_id` VARCHAR(36) NOT NULL UNIQUE,
  `notifications_enabled` BOOLEAN DEFAULT TRUE,
  `desktop_notifications` BOOLEAN DEFAULT TRUE,
  `email_notifications` BOOLEAN DEFAULT TRUE,
  `conversation_view` BOOLEAN DEFAULT TRUE,
  `preview_pane` ENUM('right', 'bottom', 'none') DEFAULT 'right',
  `messages_per_page` INT DEFAULT 25,
  `default_signature` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`mailbox_id`) REFERENCES `mailboxes`(`id`) ON DELETE CASCADE
);

-- Bảng filter rules
CREATE TABLE IF NOT EXISTS `mail_filters` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `mailbox_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `conditions` JSON NOT NULL,
  `actions` JSON NOT NULL,
  `stop_processing` BOOLEAN DEFAULT FALSE,
  `sort_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_mail_filters_mailbox` (`mailbox_id`),
  FOREIGN KEY (`mailbox_id`) REFERENCES `mailboxes`(`id`) ON DELETE CASCADE
);

-- Trigger để tự động tạo folders mặc định khi tạo mailbox
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `create_default_folders` 
AFTER INSERT ON `mailboxes`
FOR EACH ROW
BEGIN
  INSERT INTO `mail_folders` (`id`, `mailbox_id`, `name`, `slug`, `icon`, `is_system`, `sort_order`) VALUES
    (UUID(), NEW.id, 'Hộp thư đến', 'inbox', 'inbox', TRUE, 1),
    (UUID(), NEW.id, 'Đã gửi', 'sent', 'send', TRUE, 2),
    (UUID(), NEW.id, 'Nháp', 'drafts', 'file-text', TRUE, 3),
    (UUID(), NEW.id, 'Quan trọng', 'important', 'star', TRUE, 4),
    (UUID(), NEW.id, 'Spam', 'spam', 'alert-triangle', TRUE, 5),
    (UUID(), NEW.id, 'Thùng rác', 'trash', 'trash-2', TRUE, 6);
END//
DELIMITER ;

-- Trigger để tạo settings mặc định
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `create_default_mail_settings`
AFTER INSERT ON `mailboxes`
FOR EACH ROW
BEGIN
  INSERT INTO `mail_settings` (`id`, `mailbox_id`) VALUES (UUID(), NEW.id);
END//
DELIMITER ;
