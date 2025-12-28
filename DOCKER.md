# Docker Deployment Guide

## Quick Start with Docker

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+

### 1. Setup Environment Variables

Copy the template and fill in your values:
```bash
cp .env.docker .env
# Edit .env with your configuration
```

### 2. Build and Run

Start all services:
```bash
docker-compose up -d
```

This will start:
- **MySQL Database** on port 3306
- **Backend API** on port 3001
- **Frontend** on port 3000

### 3. Initialize Database

The database will automatically run migrations on first start. To seed sample data:
```bash
docker-compose exec backend npx prisma db seed
```

### 4. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### 5. Stop Services

```bash
docker-compose down

# Stop and remove volumes (WARNING: deletes database data)
docker-compose down -v
```

## Development with Docker

### Hot Reload Development

For development with hot reload:
```bash
# Override docker-compose for dev mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Access Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **MySQL**: localhost:3306

### Database Management

Access Prisma Studio inside container:
```bash
docker-compose exec backend npx prisma studio
```

Connect to MySQL directly:
```bash
docker-compose exec db mysql -u primeuser -p prime_shop
```

## Production Deployment

### 1. Build Production Images

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
```

### 2. Configure Production Environment

Update `.env` with production values:
- Use strong passwords
- Set `NODE_ENV=production`
- Configure real payment gateway credentials
- Set up SSL/TLS certificates

### 3. Deploy with Docker Swarm (Optional)

```bash
docker stack deploy -c docker-compose.yml prime-shop
```

### 4. Health Checks

Backend includes health check endpoint:
```bash
curl http://localhost:3001/api/health
```

## Useful Commands

### Rebuild specific service
```bash
docker-compose build backend
docker-compose up -d backend
```

### Execute commands in container
```bash
docker-compose exec backend npm run db:migrate
docker-compose exec backend npm run db:generate
```

### View container stats
```bash
docker stats
```

### Clean up unused images
```bash
docker system prune -a
```

## Troubleshooting

### Database connection issues
```bash
# Check database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### Backend not starting
```bash
# Check backend logs
docker-compose logs backend

# Rebuild backend
docker-compose build --no-cache backend
```

### Permission issues
```bash
# Fix uploads folder permissions
docker-compose exec backend chown -R node:node /app/uploads
```

## Docker Compose Override Files

Create `docker-compose.override.yml` for local customization (not committed to git):
```yaml
version: '3.8'

services:
  backend:
    ports:
      - "3002:3001"  # Use different port
    volumes:
      - ./server/src:/app/src  # Mount source for hot reload
```
