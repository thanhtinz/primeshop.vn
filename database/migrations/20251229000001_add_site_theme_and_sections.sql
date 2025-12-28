-- Migration: Add site theme and sections tables
-- Compatible with MySQL

-- ============ SITE THEME ============
CREATE TABLE IF NOT EXISTS `site_themes` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Colors
  `primary_color` VARCHAR(20) NOT NULL DEFAULT '#3B82F6',
  `secondary_color` VARCHAR(20) NOT NULL DEFAULT '#10B981',
  `accent_color` VARCHAR(20) NOT NULL DEFAULT '#8B5CF6',
  `background_color` VARCHAR(20) NOT NULL DEFAULT '#FFFFFF',
  `text_color` VARCHAR(20) NOT NULL DEFAULT '#111827',
  `link_color` VARCHAR(20) NOT NULL DEFAULT '#2563EB',
  `header_bg_color` VARCHAR(20) NOT NULL DEFAULT '#FFFFFF',
  `footer_bg_color` VARCHAR(20) NOT NULL DEFAULT '#1F2937',
  `footer_text_color` VARCHAR(20) NOT NULL DEFAULT '#F9FAFB',
  
  -- Typography
  `font_family` VARCHAR(100) NOT NULL DEFAULT 'Inter',
  `heading_font` VARCHAR(100) NOT NULL DEFAULT 'Inter',
  `font_size` VARCHAR(20) NOT NULL DEFAULT '16px',
  
  -- Layout
  `layout_style` VARCHAR(50) NOT NULL DEFAULT 'default',
  `header_style` VARCHAR(50) NOT NULL DEFAULT 'default',
  `navbar_position` VARCHAR(50) NOT NULL DEFAULT 'top',
  `sidebar_style` VARCHAR(50) NOT NULL DEFAULT 'default',
  `border_radius` VARCHAR(20) NOT NULL DEFAULT '8px',
  
  -- Custom CSS
  `custom_css` TEXT NULL,
  `custom_head_code` TEXT NULL,
  `custom_footer_code` TEXT NULL,
  
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ SITE SECTIONS ============
CREATE TABLE IF NOT EXISTS `site_sections` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `section_key` VARCHAR(100) NOT NULL,
  `section_name` VARCHAR(255) NOT NULL,
  `is_enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `sort_order` INT NOT NULL DEFAULT 0,
  `settings` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `site_sections_section_key_unique` (`section_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default theme
INSERT INTO `site_themes` (`id`, `is_active`) VALUES (UUID(), TRUE);

-- Insert default sections
INSERT INTO `site_sections` (`id`, `section_key`, `section_name`, `is_enabled`, `sort_order`) VALUES
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
