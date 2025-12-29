# 🔧 Environment Variables - Hướng Dẫn Cấu Hình

File này mô tả tất cả các biến môi trường cần thiết cho project.

## 📋 File .env Mẫu

Tạo file `.env` tại root của project với nội dung sau:

```env
# ===========================================
# SUPABASE CONFIGURATION
# ===========================================
# Lấy từ Supabase Dashboard > Settings > API
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

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

## 🔐 Biến Môi Trường Cho Edge Functions

Các biến này được cấu hình trong Supabase Dashboard hoặc qua CLI:

### PayOS (Thanh toán VND)
```bash
supabase secrets set PAYOS_CLIENT_ID=your_client_id
supabase secrets set PAYOS_API_KEY=your_api_key
supabase secrets set PAYOS_CHECKSUM_KEY=your_checksum_key
```

### PayPal (Thanh toán USD)
```bash
supabase secrets set PAYPAL_CLIENT_ID=your_client_id
supabase secrets set PAYPAL_CLIENT_SECRET=your_client_secret
supabase secrets set PAYPAL_MODE=sandbox  # hoặc 'live' cho production
```

### FPayment (Thanh toán USDT)
```bash
supabase secrets set FPAYMENT_API_KEY=your_api_key
supabase secrets set FPAYMENT_MERCHANT_ID=your_merchant_id
```

### Email - SMTP
```bash
supabase secrets set SMTP_HOST=smtp.gmail.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=your@email.com
supabase secrets set SMTP_PASS=your_app_password
supabase secrets set SMTP_FROM=noreply@yourdomain.com
```

### Email - Resend (Thay thế SMTP)
```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
```

### Discord Notifications
```bash
supabase secrets set DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/xxx
```

### Naperis API (Nạp game tự động)
```bash
supabase secrets set NAPERIS_API_KEY=your_api_key
supabase secrets set NAPERIS_PARTNER_ID=your_partner_id
```

## 📝 Mô Tả Chi Tiết

### Frontend Variables (VITE_*)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | URL của Supabase project |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Public anon key của Supabase |
| `VITE_APP_URL` | ✅ | URL của website |
| `VITE_GA_TRACKING_ID` | ❌ | Google Analytics tracking ID |
| `VITE_FB_PIXEL_ID` | ❌ | Facebook Pixel ID |

### Backend/Edge Function Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PAYOS_CLIENT_ID` | ✅* | PayOS client ID |
| `PAYOS_API_KEY` | ✅* | PayOS API key |
| `PAYOS_CHECKSUM_KEY` | ✅* | PayOS checksum key |
| `PAYPAL_CLIENT_ID` | ❌ | PayPal client ID |
| `PAYPAL_CLIENT_SECRET` | ❌ | PayPal client secret |
| `PAYPAL_MODE` | ❌ | 'sandbox' hoặc 'live' |
| `FPAYMENT_API_KEY` | ❌ | FPayment API key |
| `FPAYMENT_MERCHANT_ID` | ❌ | FPayment merchant ID |
| `SMTP_HOST` | ❌ | SMTP server hostname |
| `SMTP_PORT` | ❌ | SMTP server port |
| `SMTP_USER` | ❌ | SMTP username |
| `SMTP_PASS` | ❌ | SMTP password |
| `RESEND_API_KEY` | ❌ | Resend API key |
| `DISCORD_WEBHOOK_URL` | ❌ | Discord webhook URL |

*Bắt buộc nếu muốn thanh toán qua PayOS

## 🔒 Bảo Mật

⚠️ **QUAN TRỌNG:**

1. **KHÔNG BAO GIỜ** commit file `.env` lên Git
2. Thêm `.env` vào `.gitignore`
3. Sử dụng `.env.example` để lưu template
4. Mỗi môi trường (dev/staging/prod) nên có file .env riêng
5. Đặt secrets qua Supabase CLI hoặc Dashboard, không hardcode

## 📦 Cách Lấy API Keys

### Supabase
1. Truy cập [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project → Settings → API
3. Copy **Project URL** và **anon public** key

### PayOS
1. Đăng ký tại [PayOS](https://payos.vn)
2. Tạo merchant account
3. Vào Dashboard → Settings → API Keys

### PayPal
1. Đăng ký [PayPal Developer](https://developer.paypal.com)
2. Create App → Get Credentials
3. Copy Client ID và Secret

### FPayment
1. Đăng ký tại [FPayment](https://app.fpayment.net)
2. Vào Settings → API
3. Tạo API Key

### Gmail SMTP
1. Bật 2FA cho Gmail
2. Vào [App Passwords](https://myaccount.google.com/apppasswords)
3. Tạo App Password cho "Mail"
4. Sử dụng password này thay vì password Gmail thật

### Resend
1. Đăng ký tại [Resend](https://resend.com)
2. Vào API Keys → Create API Key
3. Verify domain (tùy chọn)

### Discord Webhook
1. Mở Discord Server → Settings
2. Integrations → Webhooks → New Webhook
3. Copy Webhook URL
