# Prime Shop - Hướng Dẫn Cài Đặt Chi Tiết

## 📋 Giới Thiệu

Dự án e-commerce bán tài khoản game, nạp game và các dịch vụ premium. Xây dựng trên:
- **Frontend**: React + Vite + TypeScript + TailwindCSS + Shadcn/UI
- **Backend**: Lovable Cloud (Supabase) - Database, Auth, Edge Functions, Storage

---

## 🚀 Hướng Dẫn Cài Đặt Từng Bước

### Bước 1: Clone Repository

```bash
# Clone repo từ GitHub
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Di chuyển vào thư mục dự án
cd YOUR_REPO

# Cài đặt dependencies
npm install
```

### Bước 2: Cấu Hình Environment

Tạo file `.env` ở thư mục gốc với nội dung:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
VITE_SUPABASE_PROJECT_ID=your_project_id
```

**Lưu ý**: Thay thế các giá trị bằng thông tin từ Supabase dashboard của bạn.

### Bước 3: Chạy Development Server

```bash
# Chạy server phát triển
npm run dev
```

Mở trình duyệt và truy cập: **http://localhost:5173**

---

## 🗄️ Cài Đặt Database

### Bước 1: Chạy Migrations

Migrations nằm trong thư mục `supabase/migrations/`. Bạn cần chạy theo thứ tự timestamp.

**Cách 1: Dùng Supabase CLI**
```bash
# Cài đặt Supabase CLI (nếu chưa có)
npm install -g supabase

# Đăng nhập Supabase
supabase login

# Liên kết project
supabase link --project-ref your_project_id

# Chạy migrations
supabase db push
```

**Cách 2: Chạy thủ công trong SQL Editor**
1. Mở Supabase Dashboard → SQL Editor
2. Copy nội dung từng file trong `supabase/migrations/` (theo thứ tự timestamp)
3. Chạy từng file một

### Bước 2: Chạy Seed Data

File `supabase/seed.sql` chứa dữ liệu khởi tạo cần thiết.

**Cách chạy:**
1. Mở Supabase Dashboard → SQL Editor
2. Tạo New Query
3. Copy toàn bộ nội dung file `supabase/seed.sql`
4. Nhấn **Run** để thực thi

**Seed data sẽ tạo:**
- ✅ 5 VIP Levels (Member → Diamond)
- ✅ 16 Site Settings (tax, referral, company info...)
- ✅ 3 Sample Categories
- ✅ 20 Email Templates

---

## 🔐 Cấu Hình Secrets

Vào Supabase Dashboard → Settings → Edge Functions → Secrets

| Tên Secret | Mô Tả | Bắt Buộc |
|------------|-------|----------|
| `RESEND_API_KEY` | API key từ [Resend.com](https://resend.com) để gửi email | ✅ Bắt buộc |
| `DISCORD_WEBHOOK_URL` | Webhook URL để gửi thông báo Discord | ❌ Tùy chọn |
| `NAPERIS_API_KEY` | API key Naperis cho nạp game tự động | ❌ Tùy chọn |
| `PAYOS_CLIENT_ID` | PayOS Client ID | ✅ Nếu dùng PayOS |
| `PAYOS_API_KEY` | PayOS API Key | ✅ Nếu dùng PayOS |
| `PAYOS_CHECKSUM_KEY` | PayOS Checksum Key | ✅ Nếu dùng PayOS |
| `PAYPAL_CLIENT_ID` | PayPal Client ID | ✅ Nếu dùng PayPal |
| `PAYPAL_CLIENT_SECRET` | PayPal Secret | ✅ Nếu dùng PayPal |

### Cách lấy Resend API Key:
1. Đăng ký tài khoản tại https://resend.com
2. Vào Dashboard → API Keys → Create API Key
3. Copy key và thêm vào Secrets

---

## 👤 Tạo Tài Khoản Admin

### Bước 1: Đăng ký tài khoản user
Truy cập website và đăng ký tài khoản bình thường với email của bạn.

### Bước 2: Lấy User ID
Vào Supabase Dashboard → Authentication → Users → Copy User ID của tài khoản vừa tạo.

### Bước 3: Thêm quyền Admin
Mở SQL Editor và chạy:

```sql
-- Thay YOUR_USER_ID bằng User ID thực (dạng UUID)
-- Thay admin@example.com bằng email thực của bạn

INSERT INTO public.admin_users (user_id, email, name, is_super_admin)
VALUES ('YOUR_USER_ID', 'admin@example.com', 'Admin', true);

INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'admin');
```

### Bước 4: Đăng nhập Admin Panel
Truy cập `/admin` và đăng nhập với tài khoản đã cấp quyền.

---

## 📧 Email Templates

20 templates email đã được tạo sẵn trong seed data:

| Template | Mục Đích |
|----------|----------|
| `order_confirmation` | Email xác nhận đơn hàng mới |
| `payment_success` | Thông báo thanh toán thành công |
| `payment_failed` | Thông báo thanh toán thất bại |
| `order_processing` | Đơn hàng đang được xử lý |
| `order_delivered` | Đơn hàng đã giao (kèm nội dung giao hàng) |
| `order_completed` | Đơn hàng hoàn tất |
| `order_cancelled` | Đơn hàng bị hủy |
| `order_refunded` | Thông báo hoàn tiền |
| `referral_registration_received` | Xác nhận đăng ký CTV |
| `referral_approved` | Thông báo duyệt CTV |
| `referral_rejected` | Thông báo từ chối CTV |
| `reward_request_received` | Xác nhận yêu cầu đổi thưởng |
| `referral_reward` | Gửi voucher thưởng cho CTV |
| `leaderboard_reward` | Thưởng bảng xếp hạng |
| `deposit_success` | Nạp tiền thành công |
| `login_notification` | Thông báo đăng nhập mới |
| `otp_verification` | Gửi mã OTP xác thực |
| `ticket_created` | Xác nhận ticket hỗ trợ |
| `ticket_reply` | Phản hồi ticket |
| `invoice_sent` | Gửi hóa đơn |

---

## 🔧 Edge Functions

| Function | Mục Đích |
|----------|----------|
| `send-email` | Gửi email qua template |
| `send-otp` | Gửi mã OTP xác thực |
| `send-invoice` | Gửi hóa đơn qua email |
| `create-deposit-payment` | Tạo giao dịch nạp tiền |
| `deposit-webhook` | Xử lý callback nạp tiền |
| `paypal-webhook` | Xử lý callback PayPal |
| `discord-notify` | Gửi thông báo Discord |
| `naperis-topup` | Nạp game qua API Naperis |
| `process-refund` | Xử lý hoàn tiền |
| `public-api` | API công khai cho developers |
| `api-webhook` | Webhook cho API |
| `translate` | Dịch thuật AI |
| `distribute-leaderboard-rewards` | Phát thưởng bảng xếp hạng |
| `notify-wishlist-flash-sale` | Thông báo flash sale |

---

## 📁 Cấu Trúc Thư Mục

```
├── src/
│   ├── components/       # React components
│   │   ├── ui/          # Shadcn UI components
│   │   ├── home/        # Components trang chủ
│   │   ├── product/     # Components sản phẩm
│   │   ├── cart/        # Components giỏ hàng
│   │   ├── checkout/    # Components thanh toán
│   │   ├── layout/      # Header, Footer, Layout
│   │   └── admin/       # Components admin
│   ├── contexts/        # React contexts (Auth, Cart, Currency...)
│   ├── hooks/           # Custom hooks
│   ├── pages/           # Page components
│   │   └── admin/       # Admin pages
│   ├── integrations/    # Supabase client & types
│   └── lib/             # Utilities
├── supabase/
│   ├── functions/       # Edge functions
│   ├── migrations/      # Database migrations
│   └── seed.sql         # Seed data
├── data/
│   └── README.md        # File này
└── public/              # Static assets
```

---

## 🌐 Deploy (Triển Khai)

### Deploy trên Lovable (Khuyến nghị)

1. Nhấn nút **"Publish"** ở góc phải trên cùng
2. Frontend: Nhấn **"Update"** để deploy
3. Backend (Edge Functions): Deploy tự động

### Self-host trên VPS

```bash
# Build production
npm run build

# Thư mục dist/ chứa static files
# Dùng Nginx, Apache hoặc Node.js serve để host

# Ví dụ với serve
npm install -g serve
serve -s dist -l 3000
```

**Lưu ý**: Khi self-host, backend vẫn chạy trên Lovable Cloud.

---

## 📊 Backup Dữ Liệu

### Export qua Supabase Dashboard
1. Vào Table Editor
2. Chọn table cần export
3. Nhấn Export → CSV

### Export qua SQL
```sql
-- Export categories
COPY (SELECT * FROM categories) TO '/tmp/categories.csv' CSV HEADER;

-- Export products  
COPY (SELECT * FROM products) TO '/tmp/products.csv' CSV HEADER;

-- Export email templates
COPY (SELECT * FROM email_templates) TO '/tmp/email_templates.csv' CSV HEADER;
```

---

## ⚠️ Lưu Ý Bảo Mật

### ❌ KHÔNG commit lên Git:
- Dữ liệu users thật
- Orders và payments
- API keys và secrets
- File `.env`

### ✅ CÓ THỂ commit:
- Schema/migrations
- Seed data mẫu
- Email templates
- Site settings mặc định

---

## 🆘 Xử Lý Lỗi Thường Gặp

### Lỗi: "Cannot connect to database"
- Kiểm tra `VITE_SUPABASE_URL` và `VITE_SUPABASE_PUBLISHABLE_KEY` trong `.env`
- Đảm bảo project Supabase đang active

### Lỗi: "Email không gửi được"
- Kiểm tra `RESEND_API_KEY` đã được cấu hình trong Secrets
- Verify domain email trong Resend dashboard

### Lỗi: "Admin không đăng nhập được"
- Kiểm tra đã chạy SQL thêm quyền admin
- Đảm bảo email khớp với tài khoản đã đăng ký

### Lỗi: "Migrations failed"
- Chạy migrations theo đúng thứ tự timestamp
- Kiểm tra không có migration nào bị thiếu

---

## 🔗 Tài Liệu Tham Khảo

- [Lovable Docs](https://docs.lovable.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [Resend Docs](https://resend.com/docs)
- [PayOS Docs](https://payos.vn/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Shadcn UI Docs](https://ui.shadcn.com/)

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề trong quá trình cài đặt, vui lòng:
1. Kiểm tra lại các bước theo hướng dẫn
2. Xem phần "Xử Lý Lỗi Thường Gặp" ở trên
3. Liên hệ support qua email hoặc tạo issue trên GitHub
