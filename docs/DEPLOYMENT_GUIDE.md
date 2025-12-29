# 📚 Hướng Dẫn Cài Đặt & Triển Khai PrimeShop

Hướng dẫn đầy đủ từ A-Z để cài đặt và triển khai hệ thống PrimeShop lên VPS.

## 📋 Mục Lục

1. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
2. [Cài Đặt Môi Trường Local](#cài-đặt-môi-trường-local)
3. [Cấu Hình Supabase](#cấu-hình-supabase)
4. [Cài Đặt Database](#cài-đặt-database)
5. [Cấu Hình Edge Functions](#cấu-hình-edge-functions)
6. [Triển Khai Lên VPS](#triển-khai-lên-vps)
7. [Cấu Hình Nginx](#cấu-hình-nginx)
8. [SSL Certificate](#ssl-certificate)
9. [Cấu Hình Domain](#cấu-hình-domain)
10. [Troubleshooting](#troubleshooting)

---

## 🖥️ Yêu Cầu Hệ Thống

### Phần Cứng VPS Tối Thiểu
- **CPU**: 2 vCPU
- **RAM**: 4GB (khuyến nghị 8GB)
- **Storage**: 40GB SSD
- **Bandwidth**: 1TB/tháng

### Phần Mềm
- **OS**: Ubuntu 22.04 LTS (khuyến nghị)
- **Node.js**: v18.x hoặc v20.x
- **Bun**: v1.0+ (tùy chọn, nhanh hơn npm)
- **Nginx**: v1.18+
- **Git**: v2.x

### Tài Khoản Cần Có
- [Supabase](https://supabase.com) - Database & Auth
- [PayOS](https://payos.vn) - Thanh toán VND
- [PayPal Developer](https://developer.paypal.com) - Thanh toán USD
- [FPayment](https://app.fpayment.net) - Thanh toán USDT (tùy chọn)
- [Resend](https://resend.com) hoặc SMTP Server - Gửi email

---

## 💻 Cài Đặt Môi Trường Local

### 1. Clone Repository

```bash
git clone https://github.com/your-username/primeshop.git
cd primeshop
```

### 2. Cài Đặt Node.js (Windows)

```powershell
# Sử dụng winget
winget install OpenJS.NodeJS.LTS

# Hoặc tải từ https://nodejs.org/
```

### 3. Cài Đặt Node.js (Ubuntu/Linux)

```bash
# Sử dụng nvm (khuyến nghị)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Hoặc sử dụng apt
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 4. Cài Đặt Bun (Tùy Chọn - Nhanh Hơn npm)

```bash
# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# Linux/macOS
curl -fsSL https://bun.sh/install | bash
```

### 5. Cài Đặt Dependencies

```bash
# Sử dụng npm
npm install

# Hoặc sử dụng bun (nhanh hơn)
bun install
```

### 6. Tạo File Environment

```bash
# Copy file mẫu
cp .env.example .env
```

Chỉnh sửa file `.env`:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# App
VITE_APP_URL=http://localhost:5173
```

### 7. Chạy Development Server

```bash
# npm
npm run dev

# hoặc bun
bun dev
```

Truy cập http://localhost:5173

---

## 🗄️ Cấu Hình Supabase

### 1. Tạo Project Supabase

1. Truy cập [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Điền thông tin:
   - **Name**: primeshop
   - **Database Password**: (lưu lại mật khẩu này)
   - **Region**: Southeast Asia (Singapore)
4. Click **Create new project**
5. Đợi 2-3 phút để project được tạo

### 2. Lấy API Keys

1. Vào **Settings** > **API**
2. Copy các giá trị:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`
   - **service_role** → Dùng cho Edge Functions

### 3. Cấu Hình Authentication

1. Vào **Authentication** > **Providers**
2. Bật các provider cần thiết:
   - **Email** (mặc định đã bật)
   - **Google** (tùy chọn)
   - **Discord** (tùy chọn)

#### Cấu Hình Google OAuth:

1. Truy cập [Google Cloud Console](https://console.cloud.google.com)
2. Tạo project mới hoặc chọn project có sẵn
3. Vào **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Chọn **Web application**
6. Thêm **Authorized redirect URIs**:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
7. Copy **Client ID** và **Client Secret** vào Supabase

---

## 🗃️ Cài Đặt Database

### 1. Chạy Migrations

Có 2 cách để chạy migrations:

#### Cách 1: Qua Supabase Dashboard

1. Vào **SQL Editor** trong Supabase Dashboard
2. Mở từng file trong thư mục `database/migrations/`
3. Copy nội dung và chạy theo thứ tự tên file

#### Cách 2: Sử Dụng Supabase CLI

```bash
# Cài đặt Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 2. Chạy Seed Data (Tùy Chọn)

```bash
# Trong SQL Editor, chạy file seed.sql
# database/seed.sql
```

### 3. Kiểm Tra Tables

Sau khi chạy migrations, kiểm tra các tables đã được tạo:

- `profiles` - Thông tin user
- `products` - Sản phẩm
- `orders` - Đơn hàng
- `payments` - Thanh toán
- `vouchers` - Mã giảm giá
- `site_settings` - Cài đặt hệ thống
- `mailboxes` - Hộp thư
- `mail_messages` - Tin nhắn email
- `crypto_payments` - Thanh toán crypto
- ... và nhiều tables khác

---

## ⚡ Cấu Hình Edge Functions

### 1. Cài Đặt Deno (Cho Development)

```bash
# Windows
irm https://deno.land/install.ps1 | iex

# Linux/macOS
curl -fsSL https://deno.land/install.sh | sh
```

### 2. Deploy Edge Functions

```bash
# Deploy tất cả functions
supabase functions deploy

# Hoặc deploy từng function
supabase functions deploy send-email
supabase functions deploy create-deposit-payment
supabase functions deploy paypal-webhook
supabase functions deploy fpayment-usdt
# ... các functions khác
```

### 3. Cấu Hình Secrets

```bash
# PayOS
supabase secrets set PAYOS_CLIENT_ID=your_client_id
supabase secrets set PAYOS_API_KEY=your_api_key
supabase secrets set PAYOS_CHECKSUM_KEY=your_checksum_key

# PayPal
supabase secrets set PAYPAL_CLIENT_ID=your_client_id
supabase secrets set PAYPAL_CLIENT_SECRET=your_client_secret

# Email (SMTP)
supabase secrets set SMTP_HOST=smtp.gmail.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=your@email.com
supabase secrets set SMTP_PASS=your_app_password

# Hoặc Resend
supabase secrets set RESEND_API_KEY=your_resend_key
```

---

## 🚀 Triển Khai Lên VPS

### 1. Chuẩn Bị VPS

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt các công cụ cần thiết
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx

# Cài đặt Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cài đặt PM2 (Process Manager)
sudo npm install -g pm2

# Cài đặt Bun (tùy chọn)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### 2. Clone & Build Project

```bash
# Tạo thư mục web
sudo mkdir -p /var/www/primeshop
sudo chown -R $USER:$USER /var/www/primeshop

# Clone repository
cd /var/www/primeshop
git clone https://github.com/your-username/primeshop.git .

# Cài đặt dependencies
npm install
# hoặc: bun install

# Tạo file .env
nano .env
```

Nội dung file `.env` cho production:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=https://your-domain.com
```

### 3. Build Production

```bash
# Build
npm run build
# hoặc: bun run build

# Kiểm tra thư mục dist đã được tạo
ls -la dist/
```

### 4. Cấu Hình PM2 (Cho SSR/Backend)

Nếu có backend server:

```bash
# Tạo ecosystem file
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'primeshop-server',
    script: 'server/dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

```bash
# Khởi động với PM2
pm2 start ecosystem.config.js

# Lưu cấu hình để tự động khởi động khi reboot
pm2 save
pm2 startup
```

---

## 🌐 Cấu Hình Nginx

### 1. Tạo Nginx Config

```bash
sudo nano /etc/nginx/sites-available/primeshop
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates (sẽ được certbot tự động thêm)
    # ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Document root
    root /var/www/primeshop/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing - tất cả routes đều trỏ về index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (nếu có backend server)
    # location /api/ {
    #     proxy_pass http://localhost:3000;
    #     proxy_http_version 1.1;
    #     proxy_set_header Upgrade $http_upgrade;
    #     proxy_set_header Connection 'upgrade';
    #     proxy_set_header Host $host;
    #     proxy_cache_bypass $http_upgrade;
    # }

    # Logging
    access_log /var/log/nginx/primeshop.access.log;
    error_log /var/log/nginx/primeshop.error.log;
}
```

### 2. Enable Site

```bash
# Tạo symlink
sudo ln -s /etc/nginx/sites-available/primeshop /etc/nginx/sites-enabled/

# Xóa default site (tùy chọn)
sudo rm /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## 🔒 SSL Certificate

### 1. Cài Đặt Let's Encrypt SSL

```bash
# Cài đặt certbot
sudo apt install certbot python3-certbot-nginx -y

# Lấy certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Nhập email và đồng ý terms
# Chọn redirect HTTP to HTTPS
```

### 2. Tự Động Renew

```bash
# Test dry run
sudo certbot renew --dry-run

# Certbot tự động thêm cron job để renew
# Kiểm tra:
sudo systemctl status certbot.timer
```

---

## 🌍 Cấu Hình Domain

### 1. DNS Records

Thêm các DNS records tại nhà cung cấp domain:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | VPS_IP_ADDRESS | 3600 |
| A | www | VPS_IP_ADDRESS | 3600 |
| CNAME | * | your-domain.com | 3600 |

### 2. Webhook URLs

Cập nhật webhook URLs trong các cổng thanh toán:

#### PayOS:
```
https://your-project.supabase.co/functions/v1/create-deposit-payment
```

#### PayPal:
```
https://your-project.supabase.co/functions/v1/paypal-webhook
```

#### FPayment:
```
https://your-project.supabase.co/functions/v1/fpayment-usdt?action=webhook
```

---

## 🐳 Triển Khai Với Docker (Tùy Chọn)

### 1. Build Docker Image

```bash
# Build image
docker build -t primeshop .

# Hoặc sử dụng docker-compose
docker-compose up -d
```

### 2. Docker Compose

File `docker-compose.yml` đã có sẵn trong project:

```bash
# Khởi động tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng services
docker-compose down
```

---

## 🔧 Cấu Hình Hệ Thống Sau Khi Deploy

### 1. Truy Cập Setup Wizard

Sau khi deploy, truy cập:
```
https://your-domain.com/setup
```

### 2. Cấu Hình Trong Setup Wizard

1. **Thông tin công ty** - Logo, tên, địa chỉ
2. **Cổng thanh toán** - PayOS, PayPal keys
3. **Email** - SMTP settings
4. **Quản trị viên** - Tạo tài khoản admin đầu tiên

### 3. Đăng Nhập Admin

```
https://your-domain.com/admin
```

---

## 🛠️ Troubleshooting

### Lỗi Thường Gặp

#### 1. "Cannot connect to Supabase"
```bash
# Kiểm tra VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY
# Đảm bảo không có dấu / ở cuối URL
```

#### 2. "CORS Error"
```bash
# Vào Supabase Dashboard > Settings > API
# Thêm domain vào Additional Redirect URLs
```

#### 3. "Edge Function Error"
```bash
# Kiểm tra logs
supabase functions logs function-name

# Kiểm tra secrets đã được set
supabase secrets list
```

#### 4. "502 Bad Gateway"
```bash
# Kiểm tra nginx config
sudo nginx -t

# Kiểm tra nginx logs
sudo tail -f /var/log/nginx/error.log

# Kiểm tra PM2 status
pm2 status
pm2 logs
```

#### 5. "SSL Certificate Error"
```bash
# Renew certificate
sudo certbot renew

# Kiểm tra certificate
sudo certbot certificates
```

### Commands Hữu Ích

```bash
# Restart nginx
sudo systemctl restart nginx

# Restart PM2
pm2 restart all

# Xem disk usage
df -h

# Xem memory
free -m

# Xem processes
htop

# Xem logs nginx
sudo tail -100f /var/log/nginx/error.log

# Kiểm tra ports đang mở
sudo netstat -tlnp
```

---

## 📱 Cấu Hình Mobile & PWA

### 1. Update manifest.json

Chỉnh sửa `public/manifest.json`:

```json
{
  "name": "PrimeShop",
  "short_name": "PrimeShop",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#6366f1",
  "background_color": "#0f0f23"
}
```

### 2. Icons

Thay thế các icons trong `public/`:
- `favicon.ico`
- `icon-192.png`
- `icon-512.png`

---

## 🔄 Cập Nhật & Bảo Trì

### 1. Cập Nhật Code

```bash
cd /var/www/primeshop

# Pull code mới
git pull origin main

# Cài đặt dependencies mới (nếu có)
npm install

# Build lại
npm run build

# Restart services (nếu có backend)
pm2 restart all
```

### 2. Backup Database

```bash
# Sử dụng Supabase Dashboard > Database > Backups
# Hoặc sử dụng pg_dump nếu self-hosted
```

### 3. Monitoring

Khuyến nghị sử dụng:
- **Uptime Robot** - Monitor website uptime
- **Sentry** - Error tracking
- **Google Analytics** - Traffic analysis

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra [Issues](https://github.com/your-username/primeshop/issues)
2. Tạo issue mới với đầy đủ thông tin
3. Tham gia Discord/Telegram community

---

**Happy Deploying! 🚀**
