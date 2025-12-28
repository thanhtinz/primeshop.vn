-- Migration: Add missing tables for RPC functions
-- Date: 2024-01-XX

-- ============ WALLET & TRANSACTIONS ============

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  type VARCHAR(50) NOT NULL,
  reference_type VARCHAR(50),
  reference_id VARCHAR(36),
  note TEXT,
  status VARCHAR(50) DEFAULT 'completed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_wallet_user (user_id)
);

-- ============ SMM ORDERS ============

CREATE TABLE IF NOT EXISTS smm_orders (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  service_id VARCHAR(36) NOT NULL,
  link TEXT NOT NULL,
  quantity INT NOT NULL,
  charge DECIMAL(12, 2) NOT NULL,
  external_order_id VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  start_count INT,
  remains INT,
  admin_note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_smm_user (user_id)
);

-- ============ SELLER ORDERS & ESCROW ============

CREATE TABLE IF NOT EXISTS seller_orders (
  id VARCHAR(36) PRIMARY KEY,
  buyer_id VARCHAR(36) NOT NULL,
  seller_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36),
  amount DECIMAL(12, 2) NOT NULL,
  platform_fee DECIMAL(12, 2) DEFAULT 0,
  net_amount DECIMAL(12, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  delivery_content TEXT,
  auto_confirm_at DATETIME,
  delivered_at DATETIME,
  completed_at DATETIME,
  cancelled_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_seller_order_buyer (buyer_id),
  INDEX idx_seller_order_seller (seller_id)
);

CREATE TABLE IF NOT EXISTS escrow_transactions (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL UNIQUE,
  buyer_id VARCHAR(36) NOT NULL,
  seller_id VARCHAR(36) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'held',
  released_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES seller_orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS handover_logs (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  performed_by VARCHAR(50) NOT NULL,
  details JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES seller_orders(id) ON DELETE CASCADE
);

-- ============ AUCTIONS ============

CREATE TABLE IF NOT EXISTS auctions (
  id VARCHAR(36) PRIMARY KEY,
  seller_id VARCHAR(36),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  starting_bid DECIMAL(12, 2) NOT NULL,
  current_bid DECIMAL(12, 2) DEFAULT 0,
  current_bidder_id VARCHAR(36),
  buy_now_price DECIMAL(12, 2),
  bid_count INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  winner_id VARCHAR(36),
  final_price DECIMAL(12, 2),
  start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_time DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auction_bids (
  id VARCHAR(36) PRIMARY KEY,
  auction_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auction_bids_auction (auction_id),
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE
);

-- ============ DAILY CHECKIN & POINTS ============

CREATE TABLE IF NOT EXISTS daily_checkins (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  checkin_date DATETIME NOT NULL,
  streak_count INT DEFAULT 1,
  points_earned INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_checkin_user_date (user_id, checkin_date)
);

CREATE TABLE IF NOT EXISTS points_rewards (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  points_cost INT NOT NULL,
  reward_type VARCHAR(50) NOT NULL,
  reward_value DECIMAL(12, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS points_redemptions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  reward_id VARCHAR(36) NOT NULL,
  points_spent INT NOT NULL,
  status VARCHAR(50) DEFAULT 'completed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reward_id) REFERENCES points_rewards(id)
);

-- ============ AFFILIATE ============

CREATE TABLE IF NOT EXISTS affiliate_codes (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  total_clicks INT DEFAULT 0,
  total_conversions INT DEFAULT 0,
  total_commission DECIMAL(12, 2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id VARCHAR(36) PRIMARY KEY,
  affiliate_code_id VARCHAR(36) NOT NULL,
  referrer_url TEXT,
  ip_address VARCHAR(45),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (affiliate_code_id) REFERENCES affiliate_codes(id) ON DELETE CASCADE
);

-- ============ DESIGN ORDERS ============

CREATE TABLE IF NOT EXISTS design_orders (
  id VARCHAR(36) PRIMARY KEY,
  buyer_id VARCHAR(36),
  seller_id VARCHAR(36),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  requirements JSON,
  price DECIMAL(12, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  delivery_files JSON,
  admin_note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_design_buyer (buyer_id),
  INDEX idx_design_seller (seller_id)
);

-- ============ ADD POINTS COLUMN TO USERS IF NOT EXISTS ============

-- Check and add points column to users table
SET @dbname = DATABASE();
SET @tablename = 'users';
SET @columnname = 'points';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT DEFAULT 0')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============ SEED DEFAULT POINTS REWARDS ============

INSERT INTO points_rewards (id, name, description, points_cost, reward_type, reward_value, is_active)
VALUES 
  (UUID(), '10,000đ vào số dư', 'Đổi điểm lấy 10,000đ', 100, 'balance', 10000, TRUE),
  (UUID(), '50,000đ vào số dư', 'Đổi điểm lấy 50,000đ', 450, 'balance', 50000, TRUE),
  (UUID(), '100,000đ vào số dư', 'Đổi điểm lấy 100,000đ', 800, 'balance', 100000, TRUE)
ON DUPLICATE KEY UPDATE name = name;
