-- Add Discord integration fields to users table
ALTER TABLE `users` 
ADD COLUMN `discordId` VARCHAR(255) NULL,
ADD COLUMN `discordLinkedAt` DATETIME NULL,
ADD COLUMN `discordNotificationPreferences` JSON NULL,
ADD INDEX `idx_discordId` (`discordId`);

-- Add Discord bot configuration to site_settings
INSERT INTO `site_settings` (`key`, `value`, `description`, `createdAt`, `updatedAt`)
VALUES (
  'discord_bot_config',
  '{"token":"","clientId":"","notificationChannelId":"","announcementChannelId":""}',
  'Discord bot configuration for user notifications',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  `updatedAt` = NOW();
