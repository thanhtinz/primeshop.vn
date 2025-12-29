# 🔧 Environment Variables - Hướng Dẫn Cấu Hình

File này mô tả tất cả các biến môi trường cần thiết cho project.

---

## 📋 File .env Mẫu cho Frontend

Tạo file `.env` tại root của project:

```env
# ===========================================
# API CONFIGURATION (MySQL Backend)
# ===========================================
# URL của backend API server
VITE_API_URL=http://localhost:3001/api

# WebSocket URL cho realtime features
VITE_WS_URL=http://localhost:3001

# ===========================================
# APPLICATION
# ===========================================
# URL của website (không có dấu / ở cuối)
VITE_APP_URL=http://localhost:5173

# ===========================================
# OPTIONAL: Analytics & Tracking
# ===========================================
# Google Analytics
# VITE_GA_TRACKING_ID=G-XXXXXXXXXX

# Facebook Pixel
# VITE_FB_PIXEL_ID=XXXXXXXXXXXXXXX
```

---

## 📋 File .env cho Backend Server

Tạo file `.env` tại thư mục `/server`:

```env
# ===========================================
# DATABASE (MySQL)
# ===========================================
DATABASE_URL="mysql://user:password@localhost:3306/prime_db"

# ===========================================
# JWT SECRET
# ===========================================
JWT_SECRET=your-super-secret-jwt-key-change-this-min-32-characters
JWT_REFRESH_SECRET=your-refresh-token-secret-change-this-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ===========================================
# SERVER
# ===========================================
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# ===========================================
# PAYMENTS - PayOS (VND)
# ===========================================
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key

# ===========================================
# PAYMENTS - PayPal (USD)
# ===========================================
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=sandbox

# ===========================================
# PAYMENTS - FPayment (USDT)
# ===========================================
FPAYMENT_MERCHANT_ID=your_merchant_id
FPAYMENT_API_KEY=your_api_key

# ===========================================
# SMTP (Email)
# ===========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# ===========================================
# OAUTH (Optional)
# ===========================================
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_CALLBACK_URL=http://localhost:3001/api/auth/discord/callback

# ===========================================
# DISCORD NOTIFICATIONS (Optional)
# ===========================================
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/xxx
DISCORD_BOT_TOKEN=

# ===========================================
# FILE UPLOADS
# ===========================================
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# ===========================================
# NAPERIS API (Game Topup - Optional)
# ===========================================
NAPERIS_API_KEY=your_api_key
NAPERIS_PARTNER_ID=your_partner_id

# ===========================================
# RATE LIMITING
# ===========================================
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 📝 Mô Tả Chi Tiết

### Frontend Variables (VITE_*)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | ✅ | - | URL của backend API server |
| `VITE_WS_URL` | ✅ | - | URL WebSocket cho realtime |
| `VITE_APP_URL` | ✅ | - | URL của frontend website |
| `VITE_GA_TRACKING_ID` | ❌ | - | Google Analytics tracking ID |
| `VITE_FB_PIXEL_ID` | ❌ | - | Facebook Pixel ID |

### Backend - Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | - | MySQL connection string |

### Backend - JWT Authentication

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | ✅ | - | Secret key để sign access tokens |
| `JWT_REFRESH_SECRET` | ✅ | - | Secret key để sign refresh tokens |
| `JWT_EXPIRES_IN` | ❌ | 15m | Thời gian hết hạn access token |
| `JWT_REFRESH_EXPIRES_IN` | ❌ | 7d | Thời gian hết hạn refresh token |

### Backend - Server Config

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | ❌ | 3001 | Port của backend server |
| `NODE_ENV` | ❌ | development | Environment mode |
| `FRONTEND_URL` | ✅ | - | URL frontend (cho CORS) |

### Backend - Payments

| Variable | Required | Description |
|----------|----------|-------------|
| `PAYOS_CLIENT_ID` | ✅* | PayOS client ID |
| `PAYOS_API_KEY` | ✅* | PayOS API key |
| `PAYOS_CHECKSUM_KEY` | ✅* | PayOS checksum key |
| `PAYPAL_CLIENT_ID` | ❌ | PayPal client ID |
| `PAYPAL_CLIENT_SECRET` | ❌ | PayPal client secret |
| `PAYPAL_MODE` | ❌ | 'sandbox' hoặc 'live' |
| `FPAYMENT_MERCHANT_ID` | ❌ | FPayment merchant ID |
| `FPAYMENT_API_KEY` | ❌ | FPayment API key |

*Bắt buộc nếu muốn thanh toán qua PayOS

### Backend - Email (SMTP)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | ✅ | - | SMTP server hostname |
| `SMTP_PORT` | ✅ | - | SMTP server port |
| `SMTP_SECURE` | ❌ | false | Sử dụng SSL/TLS |
| `SMTP_USER` | ✅ | - | SMTP username/email |
| `SMTP_PASS` | ✅ | - | SMTP password/app password |
| `SMTP_FROM` | ✅ | - | Email gửi đi (noreply@...) |

### Backend - OAuth

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | ❌ | Google OAuth callback URL |
| `DISCORD_CLIENT_ID` | ❌ | Discord OAuth client ID |
| `DISCORD_CLIENT_SECRET` | ❌ | Discord OAuth client secret |
| `DISCORD_CALLBACK_URL` | ❌ | Discord OAuth callback URL |

---

## 🔒 Bảo Mật

⚠️ **QUAN TRỌNG:**

1. **KHÔNG BAO GIỜ** commit file `.env` lên Git
2. Thêm `.env` vào `.gitignore`
3. Sử dụng `.env.example` để lưu template (không có giá trị thật)
4. Mỗi môi trường (dev/staging/prod) nên có file `.env` riêng
5. Sử dụng mật khẩu mạnh cho JWT_SECRET (tối thiểu 32 ký tự)
6. Rotate secrets định kỳ trong production

---

## 📦 Cách Lấy API Keys

### PayOS
1. Đăng ký tại [PayOS](https://payos.vn)
2. Tạo merchant account
3. Vào Dashboard → Settings → API Keys
4. Copy Client ID, API Key, Checksum Key

### PayPal
1. Đăng ký [PayPal Developer](https://developer.paypal.com)
2. Create App → Get Credentials
3. Copy Client ID và Secret
4. Chọn Sandbox/Live mode

### FPayment
1. Đăng ký tại [FPayment](https://app.fpayment.net)
2. Vào Settings → API
3. Tạo API Key và lấy Merchant ID

### Gmail SMTP
1. Bật 2FA cho Gmail
2. Vào [App Passwords](https://myaccount.google.com/apppasswords)
3. Tạo App Password cho "Mail"
4. Sử dụng password này thay vì password Gmail thật

### Google OAuth
1. Truy cập [Google Cloud Console](https://console.cloud.google.com)
2. Tạo project mới
3. APIs & Services → Credentials → Create OAuth Client ID
4. Thêm Authorized redirect URIs:
   ```
   http://localhost:3001/api/auth/google/callback
   https://yourdomain.com/api/auth/google/callback
   ```

### Discord OAuth
1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications)
2. Create Application
3. OAuth2 → Add Redirect:
   ```
   http://localhost:3001/api/auth/discord/callback
   https://yourdomain.com/api/auth/discord/callback
   ```

### Discord Webhook
1. Mở Discord Server → Settings
2. Integrations → Webhooks → New Webhook
3. Copy Webhook URL

---

## 🌐 Environment-Specific Configuration

### Development
```env
NODE_ENV=development
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
VITE_APP_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
PAYPAL_MODE=sandbox
```

### Production
```env
NODE_ENV=production
VITE_API_URL=https://api.yourdomain.com/api
VITE_WS_URL=https://api.yourdomain.com
VITE_APP_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
PAYPAL_MODE=live
```

---

## 🔄 Database URL Formats

### MySQL
```env
DATABASE_URL="mysql://username:password@host:port/database"
```

### MySQL với SSL (Production)
```env
DATABASE_URL="mysql://username:password@host:port/database?sslmode=require"
```

### Docker MySQL
```env
DATABASE_URL="mysql://root:password@host.docker.internal:3306/prime_db"
```

---

## 📚 Tài Liệu Liên Quan

- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Hướng dẫn triển khai
- [MYSQL_SETUP.md](MYSQL_SETUP.md) - Hướng dẫn MySQL chi tiết
- [DOCKER.md](../DOCKER.md) - Triển khai với Docker
