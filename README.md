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

[Features](#-key-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Docker](#-deployment) • [API Docs](#-api-documentation)

</div>

---

## 📋 Table of Contents

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
✅ **Scalable Architecture** - Express + MySQL + Prisma ORM  
✅ **Modern Stack** - React 18, TypeScript, Vite, TailwindCSS  
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
- **Discord Bot** - DM notifications with granular user preferences
- **Bulk Email** - Newsletter campaigns
- **Push Notifications** - Real-time web notifications
- **Live Chat** - Customer support widget
- **Discord Webhook** - Order notifications to Discord channels
- **Ticket System** - Support ticket management
- **Chat System** - Group chats, direct messages, typing indicators
- **Sticker Store** - Custom sticker packs for chat

</details>

<details>
<summary><b>🎨 Design Services</b></summary>

- **Service Listings** - Portfolio showcase for designers
- **Order Management** - Milestone tracking, revision limits
- **File Delivery** - Secure file upload/download
- **NDA Support** - Non-disclosure agreements for sensitive projects
- **Team Collaboration** - Multi-designer projects
- **License Types** - Personal, commercial licensing options

</details>

<details>
<summary><b>📊 Admin Panel</b></summary>

- **Dashboard** - Real-time statistics, revenue charts
- **User Management** - CRUD operations, role assignment, ban/unban
- **Product Management** - Approve/reject listings, bulk operations
- **Order Management** - Status updates, refund processing
- **Financial Reports** - Revenue, commissions, payouts
- **Content Management** - Pages, banners, announcements
- **Settings** - Site configuration, payment gateways, email templates
- **Logs & Audit** - Activity tracking, security logs

</details>

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI Framework |
| TypeScript | 5.6 | Type Safety |
| Vite | 6.0 | Build Tool |
| TailwindCSS | 3.4 | Styling |
| Shadcn/UI | Latest | UI Components |
| TanStack Query | 5.x | Data Fetching |
| React Router | 6.x | Routing |
| Zustand | 4.x | State Management |
| Socket.IO Client | 4.x | Realtime |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Express.js | 4.21 | Web Framework |
| TypeScript | 5.x | Type Safety |
| Prisma | 6.2 | ORM |
| MySQL | 8.0 | Database |
| Socket.IO | 4.x | WebSocket |
| JWT | - | Authentication |
| Nodemailer | 6.x | Email (SMTP) |
| Multer | 1.x | File Upload |

### DevOps
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Nginx | Reverse Proxy |
| PM2 | Process Manager |
| GitHub Actions | CI/CD |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- Git

### Installation

```bash
# 1. Clone repository
git clone https://github.com/yourusername/prime-shop.git
cd prime-shop

# 2. Install dependencies
npm install
cd server && npm install && cd ..

# 3. Setup environment
cp .env.example .env
cp server/.env.example server/.env
# Edit both .env files with your configuration

# 4. Setup database
cd server
npx prisma generate
npx prisma db push
npx prisma db seed
cd ..

# 5. Start development servers
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
npm run dev
```

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001/api |
| Admin Panel | http://localhost:5173/admin |
| Prisma Studio | http://localhost:5555 |

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| User | user@example.com | user123 |

---

## ⚙️ Configuration

### Frontend Environment (.env)

```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
VITE_APP_URL=http://localhost:5173
```

### Backend Environment (server/.env)

```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/prime_db"

# JWT
JWT_SECRET=your-secret-key-min-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-min-32-characters

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Payments
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

📖 See [docs/ENV_VARIABLES.md](docs/ENV_VARIABLES.md) for complete documentation.

---

## 📁 Project Structure

```
prime-shop/
├── src/                          # Frontend
│   ├── components/               # React components
│   │   ├── ui/                   # Shadcn UI components
│   │   ├── admin/                # Admin panel components
│   │   └── ...
│   ├── contexts/                 # React contexts
│   │   ├── AuthContext.tsx       # Authentication (MySQL)
│   │   └── ...
│   ├── hooks/                    # Custom React hooks
│   │   ├── useProducts.ts        # → useProducts.mysql.ts
│   │   ├── useOrders.ts          # → useOrders.mysql.ts
│   │   └── ...                   # All hooks use MySQL backend
│   ├── lib/                      # Utilities
│   │   ├── api-client.ts         # API client (replaces Supabase)
│   │   └── utils.ts
│   ├── pages/                    # Page components
│   └── types/                    # TypeScript types
│
├── server/                       # Backend
│   ├── src/
│   │   ├── index.ts              # Entry point
│   │   ├── routes/               # API routes
│   │   │   ├── auth.ts           # Authentication
│   │   │   ├── products.ts       # Products CRUD
│   │   │   ├── orders.ts         # Orders management
│   │   │   └── ...
│   │   ├── middleware/           # Express middleware
│   │   │   ├── auth.ts           # JWT verification
│   │   │   └── rateLimiter.ts
│   │   ├── services/             # Business logic
│   │   └── utils/                # Utilities
│   └── prisma/
│       ├── schema.prisma         # Database schema
│       └── seed.ts               # Seed data
│
├── docs/                         # Documentation
│   ├── DEPLOYMENT_GUIDE.md
│   ├── ENV_VARIABLES.md
│   └── MYSQL_SETUP.md
│
├── public/                       # Static assets
├── docker-compose.yml
└── package.json
```

---

## 📡 API Documentation

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/me
```

### Products

```http
GET    /api/products              # List products
GET    /api/products/:id          # Get product
POST   /api/products              # Create product (auth)
PATCH  /api/products/:id          # Update product (auth)
DELETE /api/products/:id          # Delete product (auth)
```

### Orders

```http
GET    /api/orders                # List user orders (auth)
GET    /api/orders/:id            # Get order details (auth)
POST   /api/orders                # Create order (auth)
PATCH  /api/orders/:id/status     # Update status (admin)
```

### Users

```http
GET    /api/users/profile         # Get profile (auth)
PATCH  /api/users/profile         # Update profile (auth)
GET    /api/users/:id             # Get public profile
```

### Payments

```http
POST   /api/deposits              # Create deposit
POST   /api/payments/payos/webhook
POST   /api/payments/paypal/webhook
```

📖 Full API documentation available at `/api/docs` when running the server.

---

## 👑 Admin Panel

Access admin panel at `/admin` with admin credentials.

### Features

- 📊 **Dashboard** - Overview statistics, charts
- 👥 **Users** - Manage users, roles, permissions
- 📦 **Products** - Approve/reject, bulk operations
- 🛒 **Orders** - Process orders, refunds
- 💰 **Finance** - Revenue reports, payouts
- ⚙️ **Settings** - Site configuration
- 📝 **Content** - Pages, banners, announcements
- 📋 **Logs** - Activity & security logs

---

## 🐳 Deployment

### Docker (Recommended)

```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

```bash
# Build frontend
npm run build

# Build backend
cd server && npm run build

# Start with PM2
pm2 start ecosystem.config.js
```

📖 See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 🧪 Testing

```bash
cd server

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📚 Documentation Links

| Document | Description |
|----------|-------------|
| [QUICK_START.md](QUICK_START.md) | Quick start guide |
| [DOCKER.md](DOCKER.md) | Docker deployment |
| [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) | Full deployment guide |
| [docs/MYSQL_SETUP.md](docs/MYSQL_SETUP.md) | MySQL setup |
| [docs/ENV_VARIABLES.md](docs/ENV_VARIABLES.md) | Environment variables |

---

<div align="center">

**Built with ❤️ by [Your Name]**

⭐ Star this repo if you find it useful!

</div>
