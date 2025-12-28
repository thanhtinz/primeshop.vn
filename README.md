<div align="center">

# 🚀 Prime Shop

### Professional E-commerce Platform for Digital Services

*Full-stack marketplace for game accounts, top-up services, design services, and digital products*

---

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.2-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[Features](#-key-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Screenshots](#-screenshots)

</div>

---

## � Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Admin Panel](#-admin-panel)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**Prime Shop** is a comprehensive, production-ready e-commerce platform built with modern technologies, specifically designed for digital services marketplace. It provides a complete solution for:

- 🎮 **Game Accounts Trading** - Buy/sell accounts with secure login info or codestring delivery
- 💎 **Automated Top-up Services** - Integrated with game recharge APIs (Naperis, etc.)
- 🎨 **Design Marketplace** - Connect freelance designers with clients
- 📱 **SMM Panel** - Social media marketing services integration
- 🏪 **Multi-vendor Marketplace** - Allow users to create and manage their own shops

### Why Prime Shop?

✅ **Production-Ready** - Battle-tested codebase with 240k+ lines  
✅ **Feature-Rich** - 100+ custom React hooks, comprehensive admin panel  
✅ **Scalable Architecture** - Clean separation of concerns, RESTful APIs  
✅ **Modern Stack** - React 18, TypeScript, Prisma ORM, MySQL  
✅ **Secure** - JWT authentication, OAuth integration, encrypted payments  
✅ **Extensible** - Modular design, easy to customize and extend

---

## ✨ Key Features

<details open>
<summary><b>🛒 E-commerce Core</b></summary>

- **Multi-product Types** - Codestring, Login Info, Topup, Design Services, Digital Products
- **Dynamic Custom Fields** - Flexible product information (text, number, selection, URL, images)
- **Flash Sales** - Countdown timers, limited quantities, wishlist notifications
- **Auction System** - Bidding for premium accounts
- **Product Bundles** - Combo deals with discounts
- **Auto Delivery** - Automatic account delivery after purchase
- **Inventory Management** - Stock tracking, restock alerts
- **Advanced Search** - Filters, sorting, price ranges
- **Product Comparison** - Side-by-side comparison tool
- **Reviews & Ratings** - Customer feedback system with images

</details>

<details open>
<summary><b>👥 User Management</b></summary>

- **Multi-Auth System** - Email/Password, Google OAuth, Discord OAuth
- **VIP Tiers** - 7 levels (Bronze → Silver → Gold → Platinum → Diamond → Emerald → Legend)
- **Achievement System** - Unlock badges and rewards
- **Referral Program** - Multi-tier commission structure
- **Daily Check-in** - Reward points for daily visits
- **Social Features** - Follow users, create posts, stories, groups
- **Privacy Controls** - Granular privacy settings
- **User Analytics** - Personal statistics dashboard

</details>

<details open>
<summary><b>💰 Payments & Finance</b></summary>

- **Digital Wallet** - Deposit, withdraw, transaction history
- **Multi-Gateway** - PayOS (VND), PayPal (USD), Bank Transfer
- **Seller Wallet** - Separate balance for marketplace vendors with fund holds
- **Design Wallet** - Dedicated wallet for designers
- **Points System** - Earn and redeem reward points
- **Voucher System** - Percentage/fixed discounts, minimum order, usage limits
- **Commission Tracking** - Automated referral payouts
- **Transaction Logs** - Detailed financial records

</details>

<details open>
<summary><b>🏪 Marketplace Features</b></summary>

- **Seller Dashboard** - Comprehensive shop management
- **Product Management** - Create, edit, bulk import products
- **Order Processing** - Status tracking, auto-delivery setup
- **Shop Branding** - Custom themes, banners, policies
- **Analytics & Insights** - Sales reports, revenue charts
- **Inventory Control** - Stock management, variants
- **Promotions** - Create flash sales, combos, vouchers
- **Customer Management** - Blacklist, buyer analytics
- **Webhook Integration** - Notify external systems
- **AI Assistant** - Smart product descriptions, pricing suggestions

</details>

<details>
<summary><b>📱 Communication</b></summary>

- **SMTP Email** - Transactional emails with templates
- **Bulk Email** - Newsletter campaigns
- **Push Notifications** - Real-time web notifications
- **Live Chat** - Customer support widget
- **Discord Webhook** - Order notifications to Discord
- **Ticket System** - Support ticket management
- **Chat System** - Group chats, direct messages, typing indicators
- **Sticker Store** - Custom sticker packs for chat

</details>

<details>
<summary><b>🎨 Design Services</b></summary>

- **Service Listings** - Portfolio showcase for designers
- **Order Management** - Milestone tracking, revision limits
- **File Delivery** - Secure file upload/download
- **NDA Support** - Non-disclosure agreements
- **Team Collaboration** - Multi-designer projects
- **License Types** - Personal, commercial licensing
- **Review System** - Multi-criteria ratings
- **Activity Logs** - Complete order timeline

</details>

<details>
<summary><b>🌐 Additional Modules</b></summary>

- **SMM Panel** - Social media marketing services
- **News System** - Blog/news articles with categories
- **Group System** - Community groups with wallet, tasks, deals
- **Event System** - Time-limited promotional events
- **Utilities** - QR generator, domain checker, video downloader, etc.
- **API Access** - Public API for integrations
- **Admin Panel** - Complete backend management

</details>

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI library with hooks |
| **TypeScript** | 5.6 | Type safety and better DX |
| **Vite** | 6.0 | Fast build tool & HMR |
| **TailwindCSS** | 3.4 | Utility-first CSS framework |
| **Shadcn/UI** | Latest | Accessible component library |
| **TanStack Query** | 5.x | Server state management |
| **React Router** | 6.x | Client-side routing |
| **React Hook Form** | 7.x | Performant form handling |
| **Zod** | 3.x | Schema validation |
| **Framer Motion** | 11.x | Animation library |
| **Recharts** | 2.x | Chart visualization |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express.js** | 4.21 | Web framework |
| **Prisma** | 6.2 | Next-gen ORM |
| **MySQL** | 8.0 | Relational database |
| **JWT** | 9.x | Authentication tokens |
| **Nodemailer** | 6.x | SMTP email service |
| **Bcrypt** | 5.x | Password hashing |

### Third-party Integrations

| Service | Purpose |
|---------|---------|
| **PayOS** | Vietnam payment gateway (VND) |
| **PayPal** | International payments (USD) |
| **Google OAuth** | Social login |
| **Discord OAuth** | Social login & webhooks |
| **Naperis API** | Game top-up provider |
| **Cloudinary / R2** | Media storage (configurable) |

### DevOps & Tools

- **Git** - Version control
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Prisma Studio** - Database GUI
- **VS Code** - Recommended IDE

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MySQL** 8.0+ ([Download](https://dev.mysql.com/downloads/))
- **Git** ([Download](https://git-scm.com/))
- **npm** or **yarn** (comes with Node.js)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/prime-shop.git
cd prime-shop
```

#### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

#### 3. Configure Environment Variables

Create `.env` in the root directory:

```env
VITE_API_URL=http://localhost:3001/api
```

Create `server/.env`:

```env
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL="mysql://root:password@localhost:3306/prime_shop"

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# OAuth (Optional - get from respective platforms)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Payment Gateways (Optional)
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=

PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MODE=sandbox

# Game Topup API (Optional)
NAPERIS_API_KEY=
NAPERIS_API_SECRET=
```

#### 4. Setup Database

```bash
cd server

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed sample data
npx prisma db seed

cd ..
```

#### 5. Start Development Servers

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

#### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Admin Panel**: http://localhost:5173/admin

### Default Credentials (after seeding)

- **Admin**: admin@example.com / admin123
- **User**: user@example.com / user123

---

## ⚙️ Configuration

### Environment Variables Reference

<details>
<summary><b>Frontend Variables</b></summary>

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3001/api` |

</details>

<details>
<summary><b>Backend Variables</b></summary>

#### Server Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3001` | Yes |
| `NODE_ENV` | Environment mode | `development` | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` | Yes |

#### Database
| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MySQL connection string | Yes |

#### Authentication
| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `JWT_EXPIRES_IN` | Token expiration time | No (default: 7d) |

#### OAuth Providers
| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | No |
| `DISCORD_CLIENT_ID` | Discord OAuth client ID | No |
| `DISCORD_CLIENT_SECRET` | Discord OAuth secret | No |

#### Email (SMTP)
| Variable | Description | Required |
|----------|-------------|----------|
| `SMTP_HOST` | SMTP server host | No |
| `SMTP_PORT` | SMTP server port | No |
| `SMTP_USER` | SMTP username | No |
| `SMTP_PASS` | SMTP password | No |
| `SMTP_FROM_NAME` | Sender name | No |
| `SMTP_FROM_EMAIL` | Sender email | No |

#### Payment Gateways
| Variable | Description | Required |
|----------|-------------|----------|
| `PAYOS_CLIENT_ID` | PayOS client ID (VND) | No |
| `PAYOS_API_KEY` | PayOS API key | No |
| `PAYOS_CHECKSUM_KEY` | PayOS checksum key | No |
| `PAYPAL_CLIENT_ID` | PayPal client ID (USD) | No |
| `PAYPAL_CLIENT_SECRET` | PayPal secret | No |
| `PAYPAL_MODE` | `sandbox` or `live` | No |

#### External APIs
| Variable | Description | Required |
|----------|-------------|----------|
| `NAPERIS_API_KEY` | Naperis API key (topup) | No |
| `NAPERIS_API_SECRET` | Naperis API secret | No |
| `OPENAI_API_KEY` | OpenAI API key (AI features) | No |
| `ANTHROPIC_API_KEY` | Anthropic API key | No |

</details>

### Admin Panel Configuration

Many configurations can be managed directly through the admin panel:

- **API Keys** - `/admin/settings/secrets`
- **Site Settings** - `/admin/settings`
- **Email Templates** - `/admin/email`
- **Translations** - `/admin/translations`
- **Payment Gateways** - Configure in settings

---

## 📁 Project Structure

```
prime-shop/
│
├── 📂 src/                          # Frontend source code
│   ├── 📂 components/               # React components
│   │   ├── admin/                  # Admin panel components
│   │   ├── cart/                   # Shopping cart
│   │   ├── checkout/               # Checkout process
│   │   ├── home/                   # Homepage sections
│   │   ├── layout/                 # Layout components
│   │   ├── marketplace/            # Marketplace features
│   │   ├── product/                # Product displays
│   │   ├── social/                 # Social features
│   │   ├── ui/                     # Reusable UI components (Shadcn)
│   │   └── ...                     # Other feature components
│   │
│   ├── 📂 contexts/                 # React Context providers
│   │   ├── AuthContext.tsx         # Authentication state
│   │   ├── CartContext.tsx         # Shopping cart state
│   │   ├── CurrencyContext.tsx     # Currency management
│   │   └── LanguageContext.tsx     # i18n translations
│   │
│   ├── 📂 hooks/                    # Custom React hooks (100+)
│   │   ├── useProducts.mysql.ts    # Product operations
│   │   ├── useOrders.mysql.ts      # Order management
│   │   ├── useWallet.mysql.ts      # Wallet operations
│   │   ├── useAuth.mysql.ts        # Authentication
│   │   └── ...                     # Feature-specific hooks
│   │
│   ├── 📂 pages/                    # Page components (routes)
│   │   ├── Index.tsx               # Homepage
│   │   ├── ProductsPage.tsx        # Product listing
│   │   ├── ProductPage.tsx         # Product detail
│   │   ├── CheckoutPage.tsx        # Checkout flow
│   │   ├── 📂 admin/               # Admin pages
│   │   │   ├── AdminDashboard.tsx  # Admin dashboard
│   │   │   ├── AdminProducts.tsx   # Product management
│   │   │   ├── AdminOrders.tsx     # Order management
│   │   │   └── ...                 # Other admin pages
│   │   ├── 📂 marketplace/         # Marketplace pages
│   │   └── ...                     # Other pages
│   │
│   ├── 📂 lib/                      # Utility functions
│   │   ├── utils.ts                # Helper functions
│   │   ├── api-client.ts           # API client setup
│   │   └── ...
│   │
│   ├── 📂 types/                    # TypeScript type definitions
│   ├── App.tsx                      # Root component
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Global styles
│
├── 📂 server/                       # Backend source code
│   ├── 📂 src/
│   │   ├── 📂 routes/              # Express route handlers
│   │   │   ├── auth.ts             # Authentication routes
│   │   │   ├── products.ts         # Product CRUD
│   │   │   ├── orders.ts           # Order management
│   │   │   ├── wallet.ts           # Wallet operations
│   │   │   ├── email.ts            # Email service
│   │   │   ├── oauth.ts            # OAuth handlers
│   │   │   ├── payments.ts         # Payment processing
│   │   │   └── ...                 # Other routes
│   │   │
│   │   ├── 📂 services/            # Business logic
│   │   │   ├── emailService.ts     # Email operations
│   │   │   └── oauthService.ts     # OAuth logic
│   │   │
│   │   ├── 📂 middleware/          # Express middleware
│   │   │   ├── auth.ts             # JWT verification
│   │   │   └── errorHandler.ts     # Error handling
│   │   │
│   │   └── index.ts                # Server entry point
│   │
│   └── 📂 prisma/
│       ├── schema.prisma           # Database schema
│       ├── migrations/             # Database migrations
│       └── seed.ts                 # Seed data script
│
├── 📂 public/                       # Static assets
│   ├── manifest.json               # PWA manifest
│   └── robots.txt
│
├── 📄 package.json                  # Frontend dependencies
├── 📄 vite.config.ts               # Vite configuration
├── 📄 tailwind.config.ts           # Tailwind CSS config
├── 📄 tsconfig.json                # TypeScript config
└── 📄 README.md                     # This file
```

### Key Directories

- **`src/components/`** - Reusable UI components organized by feature
- **`src/hooks/`** - Custom React hooks for data fetching and state management
- **`src/pages/`** - Top-level page components mapped to routes
- **`server/src/routes/`** - RESTful API endpoints
- **`server/prisma/`** - Database schema and migrations

---

## 📖 API Documentation

### Base URL

```
http://localhost:3001/api
```

### Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Core Endpoints

<details>
<summary><b>🔐 Authentication & Users</b></summary>

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass123",
  "fullName": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### OAuth
```http
GET /api/oauth/google              # Get Google OAuth URL
GET /api/oauth/discord             # Get Discord OAuth URL
GET /api/oauth/google/callback     # Google callback handler
GET /api/oauth/discord/callback    # Discord callback handler
POST /api/oauth/link/google        # Link Google account
POST /api/oauth/link/discord       # Link Discord account
DELETE /api/oauth/unlink/:provider # Unlink OAuth account
```

</details>

<details>
<summary><b>📦 Products</b></summary>

#### List Products
```http
GET /api/products?category=<id>&sort=newest&limit=20&page=1
```

Query Parameters:
- `category` - Filter by category ID
- `sort` - Sort by: `newest`, `oldest`, `price_asc`, `price_desc`
- `limit` - Items per page
- `page` - Page number
- `search` - Search term

#### Get Product
```http
GET /api/products/:id
```

#### Create Product (Admin/Seller)
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "categoryId": 1,
  "type": "codestring",
  "stock": 100
}
```

#### Update Product
```http
PUT /api/products/:id
Authorization: Bearer <token>
```

#### Delete Product
```http
DELETE /api/products/:id
Authorization: Bearer <token>
```

</details>

<details>
<summary><b>🛍️ Orders</b></summary>

#### Create Order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    { "productId": 1, "quantity": 2 }
  ],
  "voucherCode": "SAVE10"
}
```

#### Get User Orders
```http
GET /api/orders
Authorization: Bearer <token>
```

#### Get Order Details
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

#### Update Order Status (Admin/Seller)
```http
PUT /api/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed"
}
```

</details>

<details>
<summary><b>💰 Wallet & Payments</b></summary>

#### Get Wallet Balance
```http
GET /api/wallet
Authorization: Bearer <token>
```

#### Get Transactions
```http
GET /api/wallet/transactions?page=1&limit=20
Authorization: Bearer <token>
```

#### Create Deposit Request
```http
POST /api/wallet/deposit
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 100000,
  "gateway": "payos"
}
```

#### Create Withdrawal Request
```http
POST /api/wallet/withdraw
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 50000,
  "bankAccount": "123456789",
  "bankName": "Vietcombank"
}
```

</details>

<details>
<summary><b>📧 Email & Notifications</b></summary>

#### Send Email
```http
POST /api/email/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": "recipient@example.com",
  "template": "order_confirmation",
  "data": {
    "orderNumber": "ORD-001",
    "total": 99.99
  }
}
```

#### Test SMTP Connection
```http
POST /api/email/test
Authorization: Bearer <token>
```

#### Get Notifications
```http
GET /api/notifications
Authorization: Bearer <token>
```

</details>

### Response Format

#### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 🎛️ Admin Panel

The admin panel provides comprehensive management capabilities for the entire platform.

### Access

- **URL**: `/admin`
- **Login**: Requires admin role
- **Features**: Modern UI with search, dark mode, responsive sidebar

### Dashboard Sections

<details open>
<summary><b>📦 Products Management</b></summary>

- **Categories** - Create/edit product categories with icons
- **Products** - Full CRUD operations, bulk import, custom fields
- **Bundles** - Create product combo deals
- **Flash Sales** - Manage limited-time offers with countdown

</details>

<details>
<summary><b>🛍️ Orders & Revenue</b></summary>

- **Revenue Dashboard** - Sales analytics, charts, revenue reports
- **Orders** - View, filter, update order status
- **Payments** - Transaction history, payment gateway logs

</details>

<details>
<summary><b>👥 User Management</b></summary>

- **Users** - User accounts, roles, VIP status
- **Vouchers** - Create discount codes with conditions
- **Prime Boost** - Manage VIP tier benefits

</details>

<details>
<summary><b>🎁 Referral System</b></summary>

- **Registrations** - View referral signups
- **Referral Codes** - Manage referral links
- **Events** - Create promotional events
- **Rewards** - Configure achievement rewards, check-in bonuses

</details>

<details>
<summary><b>📰 Content Management</b></summary>

- **Hero Banners** - Manage homepage carousel
- **News** - Blog/news articles with rich editor
- **Reviews** - Moderate product reviews
- **Posts** - Social posts moderation
- **Stories** - User stories management

</details>

<details>
<summary><b>💬 Support</b></summary>

- **Live Chat** - Customer support conversations
- **Tickets** - Support ticket system
- **Stickers** - Manage chat sticker packs

</details>

<details>
<summary><b>📢 Communications</b></summary>

- **Email Templates** - SMTP configuration, template editor
- **Bulk Email** - Send newsletters/campaigns
- **Notifications** - Push notification manager

</details>

<details>
<summary><b>🌐 SMM Panel</b></summary>

- **Configuration** - SMM settings
- **Platforms** - Social media platforms
- **Services** - SMM service packages
- **Orders** - SMM order processing

</details>

<details>
<summary><b>🏪 Marketplace</b></summary>

- **Shops** - Approve/manage seller shops
- **Boost Pricing** - Product promotion pricing
- **Reports** - Shop performance reports

</details>

<details>
<summary><b>🎨 Design Services</b></summary>

- **Categories** - Design service categories
- **Services** - Manage design listings
- **Orders** - Design order processing
- **Managers** - Designer management

</details>

<details>
<summary><b>⚙️ Settings</b></summary>

- **General** - Site name, logo, timezone, currency
- **API Keys** - Manage secrets (PayOS, PayPal, OAuth, etc.)
- **Translations** - i18n key management
- **Static Pages** - Terms, Privacy Policy, About pages
- **Theme** - Customize colors and branding

</details>

### Admin Features

- ✅ **Advanced Search** - Quick navigation menu search
- ✅ **Dark Mode** - Toggle light/dark theme
- ✅ **Responsive** - Mobile-friendly admin interface
- ✅ **Real-time Stats** - Live dashboard metrics
- ✅ **Bulk Operations** - Import/export, bulk actions
- ✅ **Audit Logs** - Track admin actions
- ✅ **Role-based Access** - Granular permissions

---

## � Deployment

### Production Build

#### Build Frontend
```bash
npm run build
# Output: dist/
```

#### Build Backend
```bash
cd server
npm run build
# Output: server/dist/
```

### Environment Setup (Production)

Update your environment variables for production:

```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
DATABASE_URL=mysql://user:pass@host:3306/prime_shop

# Use strong JWT secret
JWT_SECRET=<generate_strong_random_string>

# Configure real payment credentials
PAYOS_CLIENT_ID=<production_id>
PAYOS_API_KEY=<production_key>
PAYOS_CHECKSUM_KEY=<production_checksum>

PAYPAL_MODE=live
PAYPAL_CLIENT_ID=<production_id>
PAYPAL_CLIENT_SECRET=<production_secret>
```

### Recommended Hosting Options

#### Frontend (Static Sites)
- **Vercel** ⭐ - Zero-config deployment, great DX
- **Netlify** - Simple deployment, CDN included
- **Cloudflare Pages** - Fast, free tier available

#### Backend (Node.js)
- **Railway** ⭐ - Easy deployment, built-in MySQL
- **Render** - Free tier available, auto-deploy from Git
- **DigitalOcean App Platform** - Managed platform
- **AWS Elastic Beanstalk** - Enterprise-grade
- **VPS** (DigitalOcean, Linode, Vultr) - Full control

#### Database
- **PlanetScale** ⭐ - Serverless MySQL, free tier
- **AWS RDS** - Managed MySQL, scalable
- **DigitalOcean Managed Database** - Simple setup
- **Railway** - Built-in database with app

#### Media Storage
- **Cloudinary** - Image CDN, transformations
- **Cloudflare R2** - S3-compatible, zero egress fees
- **AWS S3** - Industry standard

### Deployment Steps

#### Deploy to Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Deploy to Railway (Full Stack)

1. Create Railway account
2. New Project → Deploy from GitHub
3. Add MySQL database
4. Configure environment variables
5. Deploy backend and frontend separately

#### Deploy to VPS (Manual)

```bash
# SSH to your server
ssh user@your-server-ip

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt install mysql-server

# Clone and setup
git clone <your-repo>
cd prime-shop
npm install

cd server
npm install
npx prisma migrate deploy
npm run build

# Install PM2 for process management
npm install -g pm2

# Start backend
cd server
pm2 start dist/index.js --name prime-api

# Build and serve frontend with nginx
cd ..
npm run build
sudo apt install nginx
# Configure nginx to serve dist/ folder
```

### Post-Deployment Checklist

- [ ] Update `FRONTEND_URL` and `DATABASE_URL`
- [ ] Change JWT secret to strong random string
- [ ] Configure real payment gateway credentials
- [ ] Set up SSL certificate (Let's Encrypt)
- [ ] Configure SMTP for production emails
- [ ] Test all payment flows
- [ ] Enable error monitoring (Sentry)
- [ ] Set up database backups
- [ ] Configure CDN for media files
- [ ] Test OAuth redirects with production URLs

---

## 📸 Screenshots

> Coming soon - Add screenshots of your deployed application

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use meaningful commit messages
- Write tests for new features
- Update documentation as needed
- Follow the existing code style

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### What this means:
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ⚠️ No warranty provided

---

## 🙏 Acknowledgments

Built with amazing open-source technologies:

- [React](https://reactjs.org/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- [Shadcn/UI](https://ui.shadcn.com/) - Component library
- [Prisma](https://www.prisma.io/) - ORM
- [Express](https://expressjs.com/) - Backend framework

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/prime-shop/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/prime-shop/discussions)
- **Email**: support@yourwebsite.com

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] WebSocket real-time features
- [ ] Advanced analytics dashboard
- [ ] Multi-currency support
- [ ] Subscription system
- [ ] API rate limiting
- [ ] Two-factor authentication
- [ ] Automated testing suite
- [ ] Performance optimizations
- [ ] Docker containerization

---

<div align="center">

**Made with ❤️ by Prime Team**

⭐ Star this repo if you find it useful!

[⬆️ Back to Top](#-prime-shop)

</div>
