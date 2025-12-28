-- =============================================
-- Migration: Add User Email Preferences
-- Date: 2025-12-29
-- Description: Allow users to toggle email notifications by category
-- =============================================

CREATE TABLE IF NOT EXISTS `user_email_preferences` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  
  -- Master toggle
  `email_enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Authentication & Security
  `auth_emails` BOOLEAN NOT NULL DEFAULT TRUE,
  `security_alerts` BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Orders & Transactions
  `order_emails` BOOLEAN NOT NULL DEFAULT TRUE,
  `payment_emails` BOOLEAN NOT NULL DEFAULT TRUE,
  `invoice_emails` BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Promotions & Marketing
  `promotion_emails` BOOLEAN NOT NULL DEFAULT TRUE,
  `voucher_emails` BOOLEAN NOT NULL DEFAULT TRUE,
  `newsletter_emails` BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Social & Community
  `social_emails` BOOLEAN NOT NULL DEFAULT TRUE,
  `message_emails` BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Gamification
  `reward_emails` BOOLEAN NOT NULL DEFAULT TRUE,
  `checkin_emails` BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Auctions & Groups
  `auction_emails` BOOLEAN NOT NULL DEFAULT TRUE,
  `group_order_emails` BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Wishlist & Cart
  `wishlist_emails` BOOLEAN NOT NULL DEFAULT TRUE,
  `cart_reminder_emails` BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Prime & VIP
  `prime_emails` BOOLEAN NOT NULL DEFAULT TRUE,
  `vip_emails` BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Seller
  `seller_emails` BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Affiliate
  `affiliate_emails` BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Events
  `event_emails` BOOLEAN NOT NULL DEFAULT TRUE,
  
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_email_preferences_user_id_key` (`user_id`),
  CONSTRAINT `user_email_preferences_user_id_fkey` 
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create default preferences for existing users
INSERT IGNORE INTO `user_email_preferences` (`id`, `user_id`)
SELECT UUID(), `id` FROM `users` WHERE `id` NOT IN (SELECT `user_id` FROM `user_email_preferences`);
