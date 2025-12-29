# 📚 Hướng Dẫn Cài Đặt & Triển Khai PrimeShop

Hướng dẫn đầy đủ từ A-Z để cài đặt và triển khai hệ thống PrimeShop lên VPS.

## 📋 Mục Lục

1. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
2. [Cài Đặt Môi Trường Local](#cài-đặt-môi-trường-local)
3. [Cấu Hình MySQL Database](#cấu-hình-mysql-database)
4. [Cấu Hình Backend Server](#cấu-hình-backend-server)
5. [Triển Khai Lên VPS](#triển-khai-lên-vps)
6. [Cấu Hình Nginx](#cấu-hình-nginx)
7. [SSL Certificate](#ssl-certificate)
8. [Cấu Hình Domain](#cấu-hình-domain)
9. [Troubleshooting](#troubleshooting)

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
- **MySQL**: 8.0+
- **Nginx**: v1.18+
- **Git**: v2.x
- **PM2**: Process Manager (cho production)

### Tài Khoản Cần Có
- [PayOS](https://payos.vn) - Thanh toán VND
- [PayPal Developer](https://developer.paypal.com) - Thanh toán USD
- [FPayment](https://app.fpayment.net) - Thanh toán USDT (tùy chọn)
- Gmail hoặc SMTP Server - Gửi email

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

### 4. Cài Đặt MySQL

#### Windows
1. Tải MySQL Installer từ [MySQL Downloads](https://dev.mysql.com/downloads/installer/)
2. Chạy installer và chọn **MySQL Server**
3. Đặt mật khẩu cho root user

#### Ubuntu/Linux
```bash
sudo apt update
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo mysql_secure_installation
```

#### Docker (Khuyến nghị cho development)
```bash
docker run --name mysql-primeshop \
  -e MYSQL_ROOT_PASSWORD=your_root_password \
  -e MYSQL_DATABASE=prime_db \
  -p 3306:3306 \
  -v mysql_data:/var/lib/mysql \
  -d mysql:8.0
```

### 5. Cài Đặt Dependencies

```bash
# Frontend
npm install

# Backend
cd server
npm install
```

### 6. Tạo File Environment

#### Frontend (.env tại root)
```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
VITE_APP_URL=http://localhost:5173
```

#### Backend (server/.env)
```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/prime_db"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-refresh-token-secret-change-this

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Payments
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

### 7. Setup Database

```bash
cd server

# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed initial data
npx prisma db seed
```

### 8. Chạy Development Server

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
npm run dev
```

Truy cập:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api
- Admin Panel: http://localhost:5173/admin

---

## 🗄️ Cấu Hình MySQL Database

### 1. Tạo Database

```sql
CREATE DATABASE prime_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'prime_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON prime_db.* TO 'prime_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Cấu Hình Connection String

```env
DATABASE_URL="mysql://prime_user:your_secure_password@localhost:3306/prime_db"
```

### 3. Chạy Migrations

```bash
cd server

# Generate Prisma Client
npx prisma generate

# Apply schema
npx prisma db push

# Hoặc tạo migrations
npx prisma migrate dev --name init
```

### 4. Seed Data

```bash
cd server
npx prisma db seed
```

Dữ liệu seed mặc định:
- **Admin**: admin@example.com / admin123
- **User**: user@example.com / user123

### 5. Kiểm Tra Database

```bash
# Mở Prisma Studio
npx prisma studio
```

Truy cập http://localhost:5555 để xem dữ liệu.

---

## ⚙️ Cấu Hình Backend Server

### 1. Cấu Hình Payments

#### PayOS (VND)
```env
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key
```

#### PayPal (USD)
```env
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=sandbox  # hoặc 'live' cho production
```

#### FPayment (USDT)
```env
FPAYMENT_MERCHANT_ID=your_merchant_id
FPAYMENT_API_KEY=your_api_key
```

### 2. Cấu Hình Email (SMTP)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

#### Lấy Gmail App Password:
1. Bật 2FA cho Gmail
2. Vào [App Passwords](https://myaccount.google.com/apppasswords)
3. Tạo App Password cho "Mail"

### 3. Cấu Hình OAuth (Tùy chọn)

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

### 4. Cấu Hình Discord Notifications

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/xxx
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

# Cài đặt MySQL
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo mysql_secure_installation
```

### 2. Clone & Build Project

```bash
# Tạo thư mục web
sudo mkdir -p /var/www/primeshop
sudo chown -R $USER:$USER /var/www/primeshop
cd /var/www/primeshop

# Clone repository
git clone https://github.com/your-username/primeshop.git .

# Cài đặt dependencies
npm install
cd server && npm install && cd ..

# Build frontend
npm run build

# Build backend
cd server && npm run build
```

### 3. Cấu Hình Environment

```bash
# Frontend
nano .env
# Thêm các biến môi trường production

# Backend
nano server/.env
# Thêm các biến môi trường production
```

### 4. Setup Database Production

```bash
cd server
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

### 5. Khởi Động Backend với PM2

```bash
cd /var/www/primeshop/server

# Tạo ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'primeshop-api',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
EOF

# Khởi động
pm2 start ecosystem.config.js --env production

# Lưu PM2 config
pm2 save

# Auto-start khi reboot
pm2 startup
```

---

## 🔧 Cấu Hình Nginx

### 1. Tạo Config File

```bash
sudo nano /etc/nginx/sites-available/primeshop
```

Nội dung:

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/primeshop/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/primeshop /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 SSL Certificate

### 1. Cài Đặt Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Lấy SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 3. Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot tự động thêm cron job để renew
```

---

## 🌐 Cấu Hình Domain

### 1. DNS Records

Thêm các DNS records tại nhà cung cấp domain:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | Your_VPS_IP | 300 |
| A | www | Your_VPS_IP | 300 |
| A | api | Your_VPS_IP | 300 |

### 2. Cập Nhật Environment

```env
# Frontend (.env)
VITE_API_URL=https://yourdomain.com/api
VITE_WS_URL=https://yourdomain.com
VITE_APP_URL=https://yourdomain.com

# Backend (server/.env)
FRONTEND_URL=https://yourdomain.com
```

---

## 🔄 CI/CD với GitHub Actions

Tạo file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/primeshop
            git pull origin main
            npm install
            npm run build
            cd server
            npm install
            npm run build
            npx prisma migrate deploy
            pm2 restart all
```

---

## 🐛 Troubleshooting

### Backend không khởi động

```bash
# Kiểm tra logs
pm2 logs primeshop-api

# Kiểm tra port
netstat -tlnp | grep 3001

# Restart
pm2 restart primeshop-api
```

### Database connection error

```bash
# Test MySQL connection
mysql -u prime_user -p prime_db

# Kiểm tra MySQL service
sudo systemctl status mysql
```

### Nginx 502 Bad Gateway

```bash
# Kiểm tra backend đang chạy
pm2 status

# Kiểm tra nginx logs
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate issues

```bash
# Renew certificate
sudo certbot renew

# Check certificate
sudo certbot certificates
```

### Permission denied

```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/primeshop/dist
sudo chmod -R 755 /var/www/primeshop/dist
```

---

## 📊 Monitoring

### PM2 Monitoring

```bash
# Status
pm2 status

# Logs
pm2 logs

# Metrics
pm2 monit
```

### Nginx Status

```bash
# Test config
sudo nginx -t

# Logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### MySQL Status

```bash
# Status
sudo systemctl status mysql

# Process list
mysql -u root -p -e "SHOW PROCESSLIST;"
```

---

## 🔐 Bảo Mật Production

### 1. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2. Fail2ban

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. MySQL Security

```bash
sudo mysql_secure_installation
```

### 4. Environment Variables

- KHÔNG commit file `.env` lên Git
- Sử dụng secrets management cho CI/CD
- Rotate JWT secrets định kỳ

---

## 📚 Tài Liệu Liên Quan

- [README.md](../README.md) - Tổng quan dự án
- [MYSQL_SETUP.md](MYSQL_SETUP.md) - Hướng dẫn MySQL chi tiết
- [ENV_VARIABLES.md](ENV_VARIABLES.md) - Mô tả biến môi trường
- [DOCKER.md](../DOCKER.md) - Triển khai với Docker
- [QUICK_START.md](../QUICK_START.md) - Hướng dẫn nhanh

---

**Nếu gặp vấn đề, vui lòng tạo Issue trên GitHub repository.**
