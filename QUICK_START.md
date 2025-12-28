# Prime Shop - Quick Start Guide

## 🚀 Quick Start Options

### Option 1: Docker (Recommended for Quick Setup)

**Prerequisites:** Docker & Docker Compose installed

```bash
# 1. Clone repository
git clone https://github.com/yourusername/prime-shop.git
cd prime-shop

# 2. Setup environment
cp .env.docker .env
# Edit .env with your configuration

# 3. Start everything with Docker
docker-compose up -d

# 4. Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:3001/api
# Admin: http://localhost:3000/admin
```

See [DOCKER.md](DOCKER.md) for detailed Docker instructions.

### Option 2: Local Development

**Prerequisites:** Node.js 18+, MySQL 8.0+

```bash
# 1. Install dependencies
npm install
cd server && npm install && cd ..

# 2. Setup environment variables
# Create server/.env (see Configuration section)

# 3. Setup database
cd server
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
cd ..

# 4. Start servers (2 terminals)
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
npm run dev

# 5. Access the application
# Frontend: http://localhost:5173
# Backend: http://localhost:3001/api
```

## 📋 Default Credentials

After seeding database:
- **Admin**: admin@example.com / admin123
- **User**: user@example.com / user123

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

## 🔧 Common Commands

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
```

### Database

```bash
cd server

# Open Prisma Studio
npx prisma studio

# Create migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Development

```bash
# Build for production
npm run build
cd server && npm run build

# Run production build
cd server && npm start
```

## 📚 Documentation

- [README.md](README.md) - Full documentation
- [DOCKER.md](DOCKER.md) - Docker deployment guide
- API Documentation - See README API section

## 🐛 Troubleshooting

### Port already in use
```bash
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill the process
taskkill /PID <process_id> /F
```

### Database connection issues
- Check MySQL is running
- Verify DATABASE_URL in .env
- Ensure database exists

### Rate limiting issues
- Admin users bypass rate limits
- Check rate limiter configuration in server/src/middleware/rateLimiter.ts

## 💡 Tips

1. **Development**: Use `npm run dev` for hot reload
2. **Testing**: Write tests in `server/src/__tests__/`
3. **Rate Limits**: Auth endpoints are strictly limited (5 req/15min)
4. **Docker**: Use docker-compose for easy full-stack development
5. **Logs**: Check `docker-compose logs` for debugging

## 🔗 Quick Links

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api
- Admin Panel: http://localhost:5173/admin
- Health Check: http://localhost:3001/api/health
- Prisma Studio: Run `npx prisma studio` in server/

## 🆘 Need Help?

- [GitHub Issues](https://github.com/yourusername/prime-shop/issues)
- [Discussions](https://github.com/yourusername/prime-shop/discussions)
- Email: support@yourwebsite.com
