# 🚀 Prime Shop - Quick Start Guide

Hướng dẫn nhanh để bắt đầu với PrimeShop.

---

## 📋 Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MySQL** 8.0+ ([Download](https://dev.mysql.com/downloads/))
- **Git** ([Download](https://git-scm.com/))

---

## 🎯 Quick Start Options

### Option 1: Docker (Khuyến nghị - Nhanh nhất)

```bash
# 1. Clone repository
git clone https://github.com/yourusername/prime-shop.git
cd prime-shop

# 2. Copy environment file
cp .env.docker .env
# Chỉnh sửa .env với cấu hình của bạn

# 3. Khởi động với Docker
docker-compose up -d

# 4. Truy cập
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001/api
# Admin:    http://localhost:3000/admin
```

📖 Xem chi tiết: [DOCKER.md](DOCKER.md)

---

### Option 2: Local Development

#### Bước 1: Cài đặt Dependencies

```bash
# Clone repo
git clone https://github.com/yourusername/prime-shop.git
cd prime-shop

# Frontend dependencies
npm install

# Backend dependencies
cd server && npm install && cd ..
```

#### Bước 2: Cấu hình Database

```bash
# Tạo database MySQL
mysql -u root -p -e "CREATE DATABASE prime_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

#### Bước 3: Cấu hình Environment

**Frontend** (`.env` tại root):
```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
VITE_APP_URL=http://localhost:5173
```

**Backend** (`server/.env`):
```env
DATABASE_URL="mysql://root:password@localhost:3306/prime_db"
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

#### Bước 4: Setup Database

```bash
cd server

# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed initial data
npx prisma db seed

cd ..
```

#### Bước 5: Khởi động

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
npm run dev
```

#### Bước 6: Truy cập

- 🌐 **Frontend**: http://localhost:5173
- 🔌 **Backend API**: http://localhost:3001/api
- 👑 **Admin Panel**: http://localhost:5173/admin

---

## 🔑 Default Credentials

Sau khi seed database:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| User | user@example.com | user123 |

---

## 🧪 Running Tests

```bash
cd server

# Run all tests
npm test

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

---

## 🔧 Common Commands

### Database

```bash
cd server

# Mở Prisma Studio (GUI quản lý database)
npx prisma studio

# Tạo migration mới
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (⚠️ XÓA HẾT DATA)
npx prisma migrate reset

# Seed lại data
npx prisma db seed
```

### Development

```bash
# Build frontend for production
npm run build

# Build backend
cd server && npm run build

# Run production build
cd server && npm start

# Lint code
npm run lint

# Type check
npm run type-check
```

### Docker

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose build --no-cache

# Remove all data (volumes)
docker-compose down -v
```

---

## 📁 Project Structure

```
prime-shop/
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks (MySQL versions)
│   ├── lib/                # Utilities & API client
│   ├── pages/              # Page components
│   └── types/              # TypeScript types
│
├── server/                 # Backend source
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   └── prisma/
│       ├── schema.prisma   # Database schema
│       └── seed.ts         # Seed data
│
├── docs/                   # Documentation
├── public/                 # Static assets
└── docker-compose.yml      # Docker config
```

---

## 🐛 Troubleshooting

### Port đã được sử dụng

```bash
# Windows - Tìm process đang dùng port
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill process
taskkill /PID <process_id> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### Database connection issues

```bash
# Kiểm tra MySQL đang chạy
# Windows
net start mysql

# Linux
sudo systemctl status mysql

# Verify connection string trong server/.env
# DATABASE_URL="mysql://user:password@localhost:3306/prime_db"
```

### Prisma issues

```bash
cd server

# Regenerate client
npx prisma generate

# Reset và migrate lại
npx prisma migrate reset

# Kiểm tra schema
npx prisma validate
```

### CORS errors

Đảm bảo `FRONTEND_URL` trong `server/.env` đúng:
```env
FRONTEND_URL=http://localhost:5173
```

### JWT errors

Đảm bảo `JWT_SECRET` và `JWT_REFRESH_SECRET` đủ dài (tối thiểu 32 ký tự):
```env
JWT_SECRET=your-super-secret-key-at-least-32-characters-long
JWT_REFRESH_SECRET=another-secret-key-at-least-32-characters-long
```

---

## 📚 Documentation

| File | Description |
|------|-------------|
| [README.md](README.md) | Tổng quan dự án |
| [DOCKER.md](DOCKER.md) | Hướng dẫn Docker |
| [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) | Hướng dẫn triển khai VPS |
| [docs/MYSQL_SETUP.md](docs/MYSQL_SETUP.md) | Hướng dẫn MySQL chi tiết |
| [docs/ENV_VARIABLES.md](docs/ENV_VARIABLES.md) | Mô tả biến môi trường |

---

## 🆘 Need Help?

- 📖 Đọc documentation trong folder `docs/`
- 🐛 Tạo Issue trên GitHub
- 💬 Join Discord community

---

**Happy coding! 🎉**
