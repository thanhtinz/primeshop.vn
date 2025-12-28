-- =============================================
-- Migration: Update Email Tables
-- Date: 2025-12-29
-- Description: Add language support and update email_templates, email_logs tables
-- =============================================

-- Update email_templates table to add language support
ALTER TABLE `email_templates` 
ADD COLUMN IF NOT EXISTS `language` VARCHAR(5) DEFAULT 'vi' AFTER `name`;

-- Add unique constraint on name + language
ALTER TABLE `email_templates`
DROP INDEX IF EXISTS `email_templates_name_key`;

-- Create unique index on name + language combination
CREATE UNIQUE INDEX `email_templates_name_language_key` 
ON `email_templates` (`name`, `language`);

-- Add text_content column if not exists
ALTER TABLE `email_templates`
ADD COLUMN IF NOT EXISTS `text_content` TEXT AFTER `body`;

-- Update email_logs table
ALTER TABLE `email_logs`
ADD COLUMN IF NOT EXISTS `message_id` VARCHAR(255) AFTER `status`;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS `idx_email_logs_recipient` ON `email_logs` (`recipient`);
CREATE INDEX IF NOT EXISTS `idx_email_logs_template` ON `email_logs` (`template_name`);
CREATE INDEX IF NOT EXISTS `idx_email_logs_status` ON `email_logs` (`status`);
CREATE INDEX IF NOT EXISTS `idx_email_templates_active` ON `email_templates` (`is_active`);
