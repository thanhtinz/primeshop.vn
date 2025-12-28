# Hướng Dẫn Migration từ Supabase sang MySQL

## 📋 Tổng Quan

Project đã được chuyển từ Supabase (PostgreSQL) sang MySQL với Express.js backend mới.

## 🗂️ Cấu Trúc Thư Mục Mới

```
/server                     # Backend Express.js mới
├── prisma/
│   ├── schema.prisma       # MySQL Schema
│   └── seed.ts             # Dữ liệu mẫu
├── src/
│   ├── index.ts            # Entry point
│   ├── lib/
│   │   ├── prisma.ts       # Prisma client
│   │   └── auth.ts         # JWT utilities
│   ├── middleware/
│   │   ├── auth.ts         # Auth middleware
│   │   └── errorHandler.ts # Error handling
│   └── routes/
│       ├── auth.ts         # Authentication
│       ├── users.ts        # User profile
│       ├── products.ts     # Products
│       ├── categories.ts   # Categories
│       ├── orders.ts       # Orders
│       ├── payments.ts     # Payments (PayOS)
│       ├── webhooks.ts     # Webhooks
│       ├── upload.ts       # File upload
│       ├── admin.ts        # Admin APIs
│       ├── db.ts           # Generic DB queries
│       └── rpc.ts          # RPC functions
└── uploads/                # Uploaded files
```

## 🚀 Hướng Dẫn Setup

### 1. Cài đặt MySQL

```bash
# Windows: Download MySQL từ https://dev.mysql.com/downloads/installer/
# Hoặc dùng Docker:
docker run --name mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=prime_db -p 3306:3306 -d mysql:8
```

### 2. Cấu hình Backend

```bash
cd server

# Copy file môi trường
cp .env.example .env

# Chỉnh sửa .env với thông tin MySQL của bạn:
# DATABASE_URL="mysql://root:password@localhost:3306/prime_db"
# JWT_SECRET="your-super-secret-key"
# PAYOS_CLIENT_ID="your-payos-client-id"
# PAYOS_API_KEY="your-payos-api-key"
# PAYOS_CHECKSUM_KEY="your-payos-checksum-key"
```

### 3. Cài đặt Dependencies

```bash
cd server
npm install

# Generate Prisma client
npx prisma generate

# Tạo database tables
npx prisma db push

# Chạy seed data
npm run db:seed
```

### 4. Chạy Backend

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

### 5. Cấu hình Frontend

Thêm vào file `.env` của frontend:

```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
```

## 🔄 Migration Frontend Code

### Thay đổi Import

```typescript
// CŨ (Supabase)
import { supabase } from '@/integrations/supabase/client';

// MỚI (MySQL API)
import apiClient, { auth, db, storage } from '@/lib/api-client';
```

### API Calls

```typescript
// CŨ: Supabase query
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true)
  .order('created_at', { ascending: false });

// MỚI: Vẫn giữ nguyên cú pháp!
const { data, error } = await db
  .from('products')
  .select('*')
  .eq('is_active', true)
  .order('created_at', { ascending: false });
```

### Authentication

```typescript
// CŨ
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// MỚI
const data = await auth.signIn(email, password);
```

### File Upload

```typescript
// CŨ
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file);

// MỚI: Vẫn giữ nguyên!
const { data, error } = await storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file);
```

## 📝 Danh Sách File Cần Update

### Ưu tiên cao (Core functionality):
- [x] `src/contexts/AuthContext.tsx`
- [ ] `src/contexts/CartContext.tsx`
- [ ] `src/hooks/useDeposit.ts`
- [ ] `src/hooks/useOrders.ts`
- [ ] `src/hooks/useProducts.ts`

### Ưu tiên trung bình (Features):
- [ ] `src/hooks/useCategories.ts`
- [ ] `src/hooks/useVouchers.ts`
- [ ] `src/hooks/useNotifications.ts`
- [ ] `src/hooks/useWishlist.ts`

### Ưu tiên thấp (Admin/Settings):
- [ ] Admin pages
- [ ] Settings pages
- [ ] Profile pages

## 🔧 Các Thay Đổi Cần Lưu Ý

### 1. Database Column Names

Prisma sử dụng camelCase thay vì snake_case:

| Supabase (snake_case) | MySQL/Prisma (camelCase) |
|----------------------|--------------------------|
| is_active            | isActive                 |
| created_at           | createdAt                |
| user_id              | userId                   |
| total_amount         | totalAmount              |

### 2. Real-time Subscriptions

```typescript
// CŨ: Supabase real-time
supabase
  .channel('notifications')
  .on('postgres_changes', { event: 'INSERT' }, (payload) => {
    console.log('New notification:', payload);
  })
  .subscribe();

// MỚI: Socket.IO
import { realtime } from '@/lib/api-client';

realtime
  .channel('notifications')
  .on('INSERT', { table: 'notifications' }, (payload) => {
    console.log('New notification:', payload);
  })
  .subscribe();
```

### 3. Edge Functions → API Routes

| Supabase Edge Function | Express Route |
|----------------------|---------------|
| /functions/v1/create-payos-payment | POST /api/payments/create |
| /functions/v1/handle-payos-webhook | POST /api/webhooks/payos |
| /functions/v1/send-email | POST /api/functions/send-email |

## ⚠️ Lưu Ý Quan Trọng

1. **Backup dữ liệu cũ** trước khi migration
2. **Test kỹ** trên môi trường staging trước
3. **Cập nhật SSL** cho production
4. **Cấu hình CORS** đúng với domain frontend
5. **Monitor logs** sau khi deploy

## 🐛 Troubleshooting

### Lỗi kết nối MySQL
```bash
# Kiểm tra MySQL đang chạy
mysql -u root -p -e "SELECT 1"

# Kiểm tra DATABASE_URL trong .env
```

### Lỗi Prisma
```bash
# Reset và regenerate
npx prisma generate
npx prisma db push --force-reset
```

### Lỗi CORS
Kiểm tra `FRONTEND_URL` trong `.env` backend match với URL frontend.

## 📞 Hỗ Trợ

Nếu gặp vấn đề, vui lòng tạo issue với:
1. Mô tả lỗi
2. Error message
3. Steps to reproduce
