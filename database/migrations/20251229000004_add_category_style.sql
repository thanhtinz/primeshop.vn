-- Add style column to categories table for design services
ALTER TABLE `categories` ADD COLUMN IF NOT EXISTS `style` VARCHAR(50) DEFAULT 'premium';

-- Update existing categories with appropriate styles if not set
UPDATE `categories` SET `style` = 'premium' WHERE `style` IS NULL OR `style` = '';
