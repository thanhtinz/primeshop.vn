# 🎮 Prime Shop

<div align="center">

![Prime Shop](https://img.shields.io/badge/Prime-Shop-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTYgMkwzIDZWMjBhMiAyIDAgMDAyIDJoMTRhMiAyIDAgMDAyLTJWNmwtMy00eiIvPjxsaW5lIHgxPSIzIiB5MT0iNiIgeDI9IjIxIiB5Mj0iNiIvPjxwYXRoIGQ9Ik0xNiAxMGE0IDQgMCAwMS04IDAiLz48L3N2Zz4=)

**Nền tảng thương mại điện tử chuyên nghiệp cho tài khoản game, nạp game, và dịch vụ số**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)

[Demo](#demo) • [Tính năng](#-tính-năng) • [Cài đặt](#-cài-đặt) • [Cấu trúc](#-cấu-trúc-dự-án) • [API](#-api-reference)

</div>

---

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng](#-tính-năng)
- [Tech Stack](#-tech-stack)
- [Cài đặt](#-cài-đặt)
- [Cấu hình](#-cấu-hình)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [API Reference](#-api-reference)
- [Admin Panel](#-admin-panel)
- [Deployment](#-deployment)

---

## 🎯 Giới thiệu

Prime Shop là nền tảng e-commerce toàn diện được thiết kế đặc biệt cho:

- 🎮 **Tài khoản Game** - Bán tài khoản với thông tin đăng nhập hoặc codestring
- 💎 **Nạp Game** - Tích hợp API nạp game tự động (Naperis, etc.)
- 🎨 **Dịch vụ Design** - Marketplace cho designer freelance
- 📱 **SMM Panel** - Dịch vụ Social Media Marketing tích hợp
- 🏪 **Marketplace** - Cho phép người dùng mở shop bán hàng

---

## ✨ Tính năng

### 🛒 Thương mại điện tử

| Tính năng | Mô tả |
|-----------|-------|
| **Đa loại sản phẩm** | Codestring, Login Info, Topup, Design, Digital |
| **Custom Fields** | Tùy chỉnh trường thông tin linh hoạt (text, number, selection, URL, images) |
| **Flash Sale** | Đồng hồ đếm ngược, giới hạn số lượng |
| **Auctions** | Đấu giá tài khoản premium |
| **Bundles** | Combo sản phẩm với giá ưu đãi |
| **Auto Delivery** | Giao hàng tự động cho tài khoản |

### 👤 Hệ thống người dùng

| Tính năng | Mô tả |
|-----------|-------|
| **Multi Auth** | Email/Password, Google OAuth, Discord OAuth |
| **VIP System** | 7 cấp độ (Bronze → Silver → Gold → Platinum → Diamond → Emerald → Legend) |
| **Achievements** | Hệ thống thành tích và huy hiệu |
| **Referral** | Chương trình giới thiệu với hoa hồng |
| **Daily Check-in** | Điểm danh nhận thưởng hàng ngày |
| **Social Features** | Follow, Posts, Stories, Groups |

### 💰 Tài chính & Thanh toán

| Tính năng | Mô tả |
|-----------|-------|
| **Ví điện tử** | Nạp/rút, lịch sử giao dịch |
| **Multi Gateway** | PayOS (VND), PayPal (USD), Bank Transfer |
| **Seller Wallet** | Ví riêng cho người bán với hold tiền |
| **Design Wallet** | Ví cho designer |
| **Points System** | Điểm thưởng quy đổi |
| **Vouchers** | Mã giảm giá đa dạng |

### 📱 Communication

| Tính năng | Mô tả |
|-----------|-------|
| **SMTP Email** | Email templates, bulk email |
| **Push Notifications** | Thông báo realtime |
| **Live Chat** | Chat hỗ trợ trực tiếp |
| **Discord Webhook** | Thông báo đơn hàng tự động |
| **Ticket System** | Hệ thống ticket hỗ trợ |

### 🎨 Giao diện

| Tính năng | Mô tả |
|-----------|-------|
| **Responsive** | Mobile-first design |
| **Dark/Light Theme** | Chuyển đổi theme mượt mà |
| **Seasonal Effects** | Tuyết, hoa anh đào, confetti |
| **Animations** | Framer Motion, smooth transitions |
| **Multi-language** | Tiếng Việt & English |

---

## 🛠 Tech Stack

### Frontend

```
React 18.3      │  UI Library với Hooks
TypeScript 5.6  │  Type Safety
Vite 6.0        │  Build Tool & HMR
TailwindCSS 3.4 │  Utility-first CSS
Shadcn/UI       │  Radix-based Components
TanStack Query  │  Server State Management
React Router    │  Client Routing
React Hook Form │  Form Management
Zod             │  Schema Validation
Framer Motion   │  Animations
```

### Backend

```
Express.js 4.x  │  API Server
Prisma ORM      │  Database Toolkit
MySQL 8.0       │  Primary Database
JWT             │  Authentication
Nodemailer      │  SMTP Email
Socket.io       │  Realtime (optional)
```

### Integrations

```
PayOS           │  Vietnam Payment Gateway
PayPal          │  International Payments
Google OAuth    │  Social Login
Discord OAuth   │  Social Login & Integration
Naperis API     │  Game Topup Provider
Cloudinary/R2   │  Media Storage
```

---

## 🚀 Cài đặt

### Yêu cầu

- **Node.js** 18+ (khuyến nghị sử dụng [nvm](https://github.com/nvm-sh/nvm))
- **MySQL** 8.0+
- **Git**

### Bước 1: Clone Repository

```bash
git clone <YOUR_REPO_URL>
cd prime-shop
```

### Bước 2: Cài đặt Dependencies

```bash
# Frontend
npm install

# Backend
cd server
npm install
```

### Bước 3: Cấu hình Database

```bash
cd server

# Tạo Prisma Client
npx prisma generate

# Chạy migrations
npx prisma migrate dev

# (Tùy chọn) Seed data mẫu
npx prisma db seed
```

### Bước 4: Khởi chạy

```bash
# Terminal 1 - Backend (port 3001)
cd server
npm run dev

# Terminal 2 - Frontend (port 5173)
npm run dev
```

### Truy cập

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| Admin Panel | http://localhost:5173/admin |

---

## ⚙️ Cấu hình

### Frontend `.env`

```env
VITE_API_URL=http://localhost:3001/api
```

### Backend `server/.env`

```env
# ═══════════════════════════════════════
# SERVER
# ═══════════════════════════════════════
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# ═══════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════
DATABASE_URL="mysql://user:password@localhost:3306/prime_shop"

# ═══════════════════════════════════════
# AUTHENTICATION
# ═══════════════════════════════════════
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Discord OAuth
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=

# ═══════════════════════════════════════
# EMAIL (SMTP)
# ═══════════════════════════════════════
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM_NAME=Prime Shop
SMTP_FROM_EMAIL=noreply@primeshop.com

# ═══════════════════════════════════════
# PAYMENT GATEWAYS
# ═══════════════════════════════════════
# PayOS (Vietnam)
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=

# PayPal
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MODE=sandbox

# ═══════════════════════════════════════
# EXTERNAL APIS
# ═══════════════════════════════════════
# Naperis (Game Topup)
NAPERIS_API_KEY=
NAPERIS_API_SECRET=

# AI Services (Optional)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

> 💡 **Tip**: Có thể cấu hình secrets trực tiếp trong Admin Panel tại `/admin/secrets`

---

## 📁 Cấu trúc dự án

```
prime-shop/
│
├── 📂 src/                           # Frontend Source
│   ├── 📂 components/                # React Components
│   │   ├── admin/                   # Admin panel
│   │   ├── cart/                    # Giỏ hàng
│   │   ├── checkout/                # Thanh toán
│   │   ├── home/                    # Trang chủ
│   │   ├── layout/                  # Layout chung
│   │   ├── marketplace/             # Marketplace
│   │   ├── payment/                 # Payment forms
│   │   ├── product/                 # Sản phẩm
│   │   ├── profile/                 # Profile người dùng
│   │   ├── social/                  # Social features
│   │   ├── ui/                      # UI Components (Shadcn)
│   │   └── ...
│   │
│   ├── 📂 contexts/                  # React Contexts
│   │   ├── AuthContext.tsx          # Authentication
│   │   ├── CartContext.tsx          # Shopping Cart
│   │   ├── CurrencyContext.tsx      # Tiền tệ
│   │   └── LanguageContext.tsx      # Đa ngôn ngữ
│   │
│   ├── 📂 hooks/                     # Custom Hooks (100+)
│   │   ├── useProducts.mysql.ts     # Products CRUD
│   │   ├── useOrders.mysql.ts       # Orders management
│   │   ├── useWallet.mysql.ts       # Wallet operations
│   │   ├── useAuth.mysql.ts         # Authentication
│   │   └── ...
│   │
│   ├── 📂 pages/                     # Page Components
│   │   ├── Index.tsx                # Homepage
│   │   ├── ProductsPage.tsx         # Danh sách SP
│   │   ├── ProductDetail.tsx        # Chi tiết SP
│   │   ├── 📂 admin/                # Admin pages
│   │   │   ├── AdminLayoutNew.tsx   # Admin layout
│   │   │   ├── AdminDashboard.tsx   # Dashboard
│   │   │   ├── AdminProducts.tsx    # QL Sản phẩm
│   │   │   ├── AdminOrders.tsx      # QL Đơn hàng
│   │   │   └── settings/
│   │   │       └── AdminSecrets.tsx # API Keys config
│   │   └── ...
│   │
│   └── 📂 lib/                       # Utilities
│       └── utils.ts
│
├── 📂 server/                        # Backend Source
│   ├── 📂 src/
│   │   ├── 📂 routes/               # API Routes
│   │   │   ├── auth.ts              # /api/auth/*
│   │   │   ├── products.ts          # /api/products/*
│   │   │   ├── orders.ts            # /api/orders/*
│   │   │   ├── wallet.ts            # /api/wallet/*
│   │   │   ├── email.ts             # /api/email/*
│   │   │   ├── oauth.ts             # /api/oauth/*
│   │   │   └── ...
│   │   │
│   │   ├── 📂 services/             # Business Logic
│   │   │   ├── emailService.ts      # SMTP Email
│   │   │   ├── oauthService.ts      # OAuth handlers
│   │   │   └── ...
│   │   │
│   │   ├── 📂 middleware/           # Express Middleware
│   │   │   └── auth.ts              # JWT verification
│   │   │
│   │   └── index.ts                 # Entry point
│   │
│   └── 📂 prisma/
│       ├── schema.prisma            # Database Schema
│       └── migrations/              # DB Migrations
│
├── 📂 public/                        # Static Assets
│
└── 📄 Config Files
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── package.json
```

---

## 📖 API Reference

### 🔐 Authentication

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/auth/register` | Đăng ký tài khoản |
| `POST` | `/api/auth/login` | Đăng nhập |
| `GET` | `/api/auth/me` | Lấy thông tin user |
| `POST` | `/api/auth/refresh` | Refresh token |
| `POST` | `/api/auth/logout` | Đăng xuất |

### 🔗 OAuth

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/oauth/google` | Google OAuth URL |
| `GET` | `/api/oauth/discord` | Discord OAuth URL |
| `GET` | `/api/oauth/google/callback` | Google callback |
| `GET` | `/api/oauth/discord/callback` | Discord callback |
| `POST` | `/api/oauth/link/google` | Link Google account |
| `POST` | `/api/oauth/link/discord` | Link Discord account |
| `DELETE` | `/api/oauth/unlink/:provider` | Unlink account |

### 📦 Products

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/products` | Danh sách (có filter) |
| `GET` | `/api/products/:id` | Chi tiết sản phẩm |
| `POST` | `/api/products` | Tạo mới (admin) |
| `PUT` | `/api/products/:id` | Cập nhật (admin) |
| `DELETE` | `/api/products/:id` | Xóa (admin) |

### 🛍️ Orders

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/orders` | Danh sách đơn hàng |
| `GET` | `/api/orders/:id` | Chi tiết đơn hàng |
| `POST` | `/api/orders` | Tạo đơn hàng |
| `PUT` | `/api/orders/:id/status` | Cập nhật trạng thái |

### 💰 Wallet

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/wallet` | Thông tin ví |
| `GET` | `/api/wallet/transactions` | Lịch sử giao dịch |
| `POST` | `/api/wallet/deposit` | Tạo yêu cầu nạp tiền |
| `POST` | `/api/wallet/withdraw` | Tạo yêu cầu rút tiền |

### 📧 Email

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/email/send` | Gửi email (template) |
| `POST` | `/api/email/send-direct` | Gửi email trực tiếp |
| `POST` | `/api/email/test` | Test kết nối SMTP |
| `GET` | `/api/email/templates` | Danh sách templates |

---

## 🔧 Admin Panel

Admin Panel có giao diện mới với các tính năng:

### Navigation Groups

| Nhóm | Trang |
|------|-------|
| **📦 Sản phẩm** | Danh mục, Sản phẩm, Bundles, Flash Sales |
| **🛍️ Đơn hàng** | Doanh thu, Đơn hàng, Thanh toán |
| **👥 Khách hàng** | Người dùng, Vouchers, Prime Boost |
| **🎁 Giới thiệu** | Đăng ký GT, Mã GT, Sự kiện, Rewards |
| **📰 Nội dung** | Banners, Tin tức, Reviews, Posts, Stories |
| **💬 Hỗ trợ** | Live Chat, Tickets, Stickers |
| **📢 Thông báo** | Email, Bulk Email, Notifications |
| **🌐 SMM** | Config, Platforms, Services, Orders |
| **🏪 Marketplace** | Shops, Boost Pricing, Reports |
| **🎨 Design** | Categories, Services, Orders, Managers |
| **⚙️ Cài đặt** | General, API Keys, Translations, Static Pages |

### Tính năng mới

- ✅ **Search Menu** - Tìm kiếm nhanh trong navigation
- ✅ **Dark/Light Mode** - Toggle theme trực tiếp
- ✅ **Responsive Sidebar** - Mobile-friendly
- ✅ **Secrets Management** - Cấu hình API keys trong admin
- ✅ **i18n Support** - Đa ngôn ngữ

---

## 🚀 Deployment

### Production Build

```bash
# Frontend
npm run build
# Output: dist/

# Backend
cd server
npm run build
# Output: server/dist/
```

### Environment Variables (Production)

```env
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
DATABASE_URL=mysql://user:pass@host:3306/db
```

### Recommended Hosting

| Service | Recommendation |
|---------|---------------|
| Frontend | Vercel, Netlify, Cloudflare Pages |
| Backend | Railway, Render, VPS |
| Database | PlanetScale, AWS RDS, DigitalOcean |
| Media | Cloudinary, Cloudflare R2 |

---

## 📝 License

MIT License - Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

<div align="center">

**Made with ❤️ by Prime Team**

[⬆ Back to Top](#-prime-shop)

</div>
