# 🗄️ Hướng Dẫn Cài Đặt MySQL

Hướng dẫn này giúp bạn cài đặt và cấu hình MySQL cho project.

> ✅ **Project này đã được chuyển sang sử dụng MySQL** với Express backend server và Prisma ORM.

---

## 📋 Mục Lục

1. [Cài Đặt MySQL Server](#cài-đặt-mysql-server)
2. [Cấu Hình MySQL](#cấu-hình-mysql)
3. [Tạo Database & User](#tạo-database--user)
4. [Migration Schema](#migration-schema)
5. [Kết Nối Với Prisma](#kết-nối-với-prisma)
6. [Backup & Restore](#backup--restore)

---

## 🚀 Quick Start

```bash
# 1. Cài đặt MySQL (xem hướng dẫn bên dưới)

# 2. Tạo database
mysql -u root -p -e "CREATE DATABASE prime_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. Cấu hình .env trong thư mục /server
DATABASE_URL="mysql://root:password@localhost:3306/prime_db"

# 4. Chạy migration
cd server
npm install
npm run db:generate
npm run db:push
npm run db:seed

# 5. Khởi động server
npm run dev
```

---

## 🐬 Cài Đặt MySQL Server

### Ubuntu/Debian

```bash
# Cập nhật package list
sudo apt update

# Cài đặt MySQL Server
sudo apt install mysql-server -y

# Kiểm tra version
mysql --version

# Kiểm tra service status
sudo systemctl status mysql
```

### CentOS/RHEL

```bash
# Thêm MySQL repository
sudo yum install https://dev.mysql.com/get/mysql80-community-release-el7-3.noarch.rpm

# Cài đặt MySQL
sudo yum install mysql-community-server -y

# Khởi động service
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

### Windows

1. Tải MySQL Installer từ [MySQL Downloads](https://dev.mysql.com/downloads/installer/)
2. Chạy installer và chọn **MySQL Server**
3. Chọn **Developer Default** hoặc **Server only**
4. Làm theo wizard để cài đặt
5. Đặt mật khẩu cho root user

### macOS

```bash
# Sử dụng Homebrew
brew install mysql

# Khởi động service
brew services start mysql

# Secure installation
mysql_secure_installation
```

### Docker

```bash
# Pull image
docker pull mysql:8.0

# Chạy container
docker run --name mysql-primeshop \
  -e MYSQL_ROOT_PASSWORD=your_root_password \
  -e MYSQL_DATABASE=prime_db \
  -e MYSQL_USER=prime_user \
  -e MYSQL_PASSWORD=your_password \
  -p 3306:3306 \
  -v mysql_data:/var/lib/mysql \
  -d mysql:8.0

# Kiểm tra container
docker ps
docker logs mysql-primeshop
```

---

## ⚙️ Cấu Hình MySQL

### 1. Secure Installation

```bash
# Chạy secure installation script
sudo mysql_secure_installation
```

Trả lời các câu hỏi:
- **VALIDATE PASSWORD component**: Y (khuyến nghị)
- **Password strength**: 2 (STRONG)
- **Remove anonymous users**: Y
- **Disallow root login remotely**: Y (cho production)
- **Remove test database**: Y
- **Reload privilege tables**: Y

### 2. Cấu Hình my.cnf

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Thêm/chỉnh sửa các settings:

```ini
[mysqld]
# Basic Settings
user                    = mysql
pid-file                = /var/run/mysqld/mysqld.pid
socket                  = /var/run/mysqld/mysqld.sock
port                    = 3306
basedir                 = /usr
datadir                 = /var/lib/mysql
tmpdir                  = /tmp
lc-messages-dir         = /usr/share/mysql

# Character Set
character-set-server    = utf8mb4
collation-server        = utf8mb4_unicode_ci

# InnoDB Settings
innodb_buffer_pool_size = 1G
innodb_log_file_size    = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method     = O_DIRECT

# Connection Settings
max_connections         = 500
wait_timeout            = 600
interactive_timeout     = 600

# Query Cache (MySQL 5.7 only, removed in 8.0)
# query_cache_type      = 1
# query_cache_size      = 128M

# Logging
log_error               = /var/log/mysql/error.log
slow_query_log          = 1
slow_query_log_file     = /var/log/mysql/slow.log
long_query_time         = 2

# Security
local_infile            = 0
bind-address            = 127.0.0.1  # Chỉ cho phép local connections

# Cho phép remote connections (chỉ khi cần)
# bind-address          = 0.0.0.0
```

Restart MySQL:

```bash
sudo systemctl restart mysql
```

### 3. Cho Phép Remote Connections (Tùy Chọn)

```bash
# Sửa bind-address trong my.cnf
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# Đổi: bind-address = 0.0.0.0

# Restart MySQL
sudo systemctl restart mysql

# Mở firewall port
sudo ufw allow 3306/tcp
```

---

## 👤 Tạo Database & User

### 1. Đăng Nhập MySQL

```bash
# Đăng nhập với root
sudo mysql -u root -p
```

### 2. Tạo Database

```sql
-- Tạo database với UTF8MB4
CREATE DATABASE primeshop 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- Kiểm tra
SHOW DATABASES;
```

### 3. Tạo User

```sql
-- Tạo user cho local connections
CREATE USER 'primeshop_user'@'localhost' 
  IDENTIFIED BY 'YourStrongPassword123!';

-- Tạo user cho remote connections (nếu cần)
CREATE USER 'primeshop_user'@'%' 
  IDENTIFIED BY 'YourStrongPassword123!';

-- Cấp quyền
GRANT ALL PRIVILEGES ON primeshop.* TO 'primeshop_user'@'localhost';
GRANT ALL PRIVILEGES ON primeshop.* TO 'primeshop_user'@'%';

-- Apply changes
FLUSH PRIVILEGES;

-- Kiểm tra
SHOW GRANTS FOR 'primeshop_user'@'localhost';
```

### 4. Test Connection

```bash
# Test local connection
mysql -u primeshop_user -p primeshop

# Test remote connection (từ máy khác)
mysql -h YOUR_SERVER_IP -u primeshop_user -p primeshop
```

---

## 📊 Migration Schema

### 1. Tạo Tables Cơ Bản

```sql
USE primeshop;

-- Users table (thay thế cho Supabase Auth)
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB;

-- Profiles table
CREATE TABLE profiles (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    balance DECIMAL(20, 2) DEFAULT 0,
    role ENUM('user', 'admin', 'seller') DEFAULT 'user',
    vip_level INT DEFAULT 0,
    referral_code VARCHAR(20) UNIQUE,
    referred_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_referral_code (referral_code)
) ENGINE=InnoDB;

-- Categories table
CREATE TABLE categories (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id VARCHAR(36),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_slug (slug)
) ENGINE=InnoDB;

-- Products table
CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    content LONGTEXT,
    image_url TEXT,
    images JSON,
    category_id VARCHAR(36),
    style ENUM('topup', 'game_topup', 'game_account', 'account', 'key', 'subscription', 'other') DEFAULT 'topup',
    packages JSON,
    custom_fields JSON,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    sold_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_category (category_id),
    FULLTEXT INDEX idx_search (name, description)
) ENGINE=InnoDB;

-- Orders table
CREATE TABLE orders (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id VARCHAR(36),
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    product_snapshot JSON NOT NULL,
    subtotal DECIMAL(20, 2) NOT NULL,
    discount_amount DECIMAL(20, 2) DEFAULT 0,
    total_amount DECIMAL(20, 2) NOT NULL,
    voucher_code VARCHAR(50),
    voucher_id VARCHAR(36),
    referral_code VARCHAR(20),
    status ENUM('PENDING_PAYMENT', 'PAID', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED') DEFAULT 'PENDING_PAYMENT',
    delivery_content TEXT,
    delivered_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_order_number (order_number),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Payments table
CREATE TABLE payments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_id VARCHAR(36) NOT NULL,
    amount DECIMAL(20, 2) NOT NULL,
    payment_provider ENUM('payos', 'paypal', 'balance', 'crypto_usdt') DEFAULT 'payos',
    payment_id VARCHAR(255),
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded') DEFAULT 'pending',
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order (order_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Vouchers table
CREATE TABLE vouchers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(20, 2) DEFAULT 0,
    max_discount DECIMAL(20, 2),
    usage_limit INT,
    used_count INT DEFAULT 0,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code)
) ENGINE=InnoDB;

-- Site Settings table
CREATE TABLE site_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    `key` VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    category VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (`key`),
    INDEX idx_category (category)
) ENGINE=InnoDB;

-- Balance History table
CREATE TABLE balance_history (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    amount DECIMAL(20, 2) NOT NULL,
    type ENUM('deposit', 'withdraw', 'payment', 'refund', 'commission', 'adjustment') NOT NULL,
    reference_type VARCHAR(50),
    reference_id VARCHAR(36),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_type (type)
) ENGINE=InnoDB;

-- Crypto Payments table
CREATE TABLE crypto_payments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    amount_original DECIMAL(20, 2) NOT NULL,
    currency_original VARCHAR(10) NOT NULL DEFAULT 'VND',
    amount_usdt DECIMAL(20, 8) NOT NULL,
    payment_type ENUM('deposit', 'order') NOT NULL,
    reference_id VARCHAR(36),
    description TEXT,
    status ENUM('pending', 'completed', 'failed', 'expired') DEFAULT 'pending',
    provider VARCHAR(50) DEFAULT 'fpayment',
    provider_payment_id VARCHAR(255),
    wallet_address VARCHAR(255),
    network VARCHAR(50) DEFAULT 'TRC20',
    qr_code TEXT,
    transaction_hash VARCHAR(255),
    error_message TEXT,
    expires_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;
```

### 2. Insert Default Settings

```sql
INSERT INTO site_settings (`key`, value, category, description) VALUES
('site_name', '"PrimeShop"', 'general', 'Tên website'),
('site_logo', '""', 'general', 'Logo website'),
('tax_rate', '0', 'payment', 'Thuế (%)'),
('usd_exchange_rate', '24500', 'payment', 'Tỷ giá USD'),
('payos_client_id', '""', 'payment', 'PayOS Client ID'),
('payos_api_key', '""', 'payment', 'PayOS API Key'),
('payos_checksum_key', '""', 'payment', 'PayOS Checksum Key'),
('paypal_enabled', 'false', 'payment', 'Bật PayPal'),
('paypal_mode', '"sandbox"', 'payment', 'PayPal Mode'),
('paypal_client_id', '""', 'payment', 'PayPal Client ID'),
('paypal_client_secret', '""', 'payment', 'PayPal Client Secret'),
('fpayment_enabled', 'false', 'payment', 'Bật FPayment USDT'),
('fpayment_api_key', '""', 'payment', 'FPayment API Key'),
('fpayment_merchant_id', '""', 'payment', 'FPayment Merchant ID');
```

---

## 🔗 Kết Nối Với Prisma

### 1. Cài Đặt Prisma

```bash
npm install prisma @prisma/client
npx prisma init
```

### 2. Cấu Hình .env

```env
DATABASE_URL="mysql://primeshop_user:YourPassword@localhost:3306/primeshop"
```

### 3. Cấu Hình schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  emailVerified Boolean   @default(false) @map("email_verified")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  
  profile       Profile?
  orders        Order[]
  balanceHistory BalanceHistory[]
  cryptoPayments CryptoPayment[]

  @@map("users")
}

model Profile {
  id           String   @id
  email        String
  fullName     String?  @map("full_name")
  phone        String?
  avatarUrl    String?  @map("avatar_url")
  balance      Decimal  @default(0)
  role         Role     @default(user)
  vipLevel     Int      @default(0) @map("vip_level")
  referralCode String?  @unique @map("referral_code")
  referredBy   String?  @map("referred_by")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  user         User     @relation(fields: [id], references: [id], onDelete: Cascade)

  @@map("profiles")
}

enum Role {
  user
  admin
  seller
}

// ... thêm các models khác
```

### 4. Generate & Migrate

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Hoặc tạo migration
npx prisma migrate dev --name init
```

---

## 💾 Backup & Restore

### 1. Backup Database

```bash
# Full backup
mysqldump -u primeshop_user -p primeshop > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup với compression
mysqldump -u primeshop_user -p primeshop | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup specific tables
mysqldump -u primeshop_user -p primeshop orders payments > orders_backup.sql
```

### 2. Restore Database

```bash
# Restore từ file .sql
mysql -u primeshop_user -p primeshop < backup.sql

# Restore từ file .gz
gunzip < backup.sql.gz | mysql -u primeshop_user -p primeshop
```

### 3. Automated Backup Script

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/mysql"
DB_NAME="primeshop"
DB_USER="primeshop_user"
DB_PASS="YourPassword"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Delete old backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

```bash
# Make executable
chmod +x backup.sh

# Add to cron (daily at 2am)
crontab -e
# Add line: 0 2 * * * /path/to/backup.sh
```

---

## 🔍 Monitoring & Optimization

### 1. Kiểm Tra Hiệu Suất

```sql
-- Kiểm tra slow queries
SHOW FULL PROCESSLIST;

-- Xem status
SHOW GLOBAL STATUS;

-- Xem variables
SHOW VARIABLES LIKE '%buffer%';
```

### 2. Optimize Tables

```sql
-- Optimize all tables
OPTIMIZE TABLE users, profiles, products, orders, payments;

-- Analyze tables
ANALYZE TABLE users, profiles, products, orders, payments;
```

### 3. MySQL Tuner

```bash
# Cài đặt MySQL Tuner
wget https://raw.githubusercontent.com/major/MySQLTuner-perl/master/mysqltuner.pl
chmod +x mysqltuner.pl

# Chạy
./mysqltuner.pl
```

---

## ⚠️ Lưu Ý Khi Chuyển Từ PostgreSQL

Nếu bạn muốn chuyển từ Supabase (PostgreSQL) sang MySQL:

1. **UUID**: MySQL 8.0 hỗ trợ `UUID()` function
2. **JSON**: MySQL hỗ trợ JSON columns
3. **ENUM**: MySQL có native ENUM type
4. **Array**: MySQL không có native array, dùng JSON thay thế
5. **RLS**: MySQL không có Row Level Security, cần implement ở application level
6. **Auth**: Cần tự implement authentication thay vì dùng Supabase Auth

---

**Chúc bạn thành công! 🎉**
