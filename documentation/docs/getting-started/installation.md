# Installation Guide

This guide will help you install and configure the Student Accommodation Management System.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Docker** (optional, for containerized deployment)
- **Git**

## Installation Methods

### Method 1: Local Development Setup

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd native-accomidation
```

#### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

#### 3. Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ENCRYPTION_KEY=your-32-character-encryption-key!!

# Database
DB_PATH=./database/accommodation.db

# Logging
LOG_LEVEL=info

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

**IMPORTANT**: Change `JWT_SECRET` and `ENCRYPTION_KEY` in production!

#### 4. Start the Application

Development mode (both servers):

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend
cd client && npm start
```

Or use concurrently:

```bash
npm run dev:full
```

#### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

### Method 2: Docker Deployment

#### Development with Docker

```bash
# Start development environment
docker-compose --profile dev up -d

# View logs
docker-compose logs -f app-dev
```

#### Production with Docker

```bash
# Build and start production containers
docker-compose up -d

# View logs
docker-compose logs -f app

# Scale services (if needed)
docker-compose up -d --scale app=3
```

#### Docker Commands

```bash
# Stop containers
docker-compose down

# Rebuild containers
docker-compose build --no-cache

# View container status
docker-compose ps

# Execute commands in container
docker-compose exec app sh
```

### Method 3: Production Deployment

#### Build for Production

```bash
# Build frontend
cd client && npm run build && cd ..

# Install production dependencies only
npm ci --only=production

# Start production server
NODE_ENV=production npm start
```

#### Using PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server/index.js --name accommodation-manager

# Monitor
pm2 monit

# Auto-restart on boot
pm2 startup
pm2 save
```

## Initial Configuration

### 1. Create Admin User

After starting the application, create an admin user:

```bash
curl -X POST http://localhost:5000/api/auth/setup-admin
```

Default credentials:
- **Username**: admin
- **Password**: admin123

**IMPORTANT**: Change the admin password immediately after first login!

### 2. Configure Security

Update your `.env` file with strong secrets:

```env
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
```

### 3. Set Up HTTPS (Production)

For production, always use HTTPS:

#### Using Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Verification

### Health Check

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Student Accommodation Management System API",
  "timestamp": "2025-11-13T10:00:00.000Z",
  "environment": "development"
}
```

### Run Tests

```bash
# Backend tests
npm test

# Frontend tests
cd client && npm test

# Security tests
npm run test:security
```

### Check Logs

```bash
# View application logs
tail -f logs/application-*.log

# View error logs
tail -f logs/error-*.log

# View audit logs
tail -f logs/audit-*.log
```

## Troubleshooting

### Port Already in Use

```bash
# Find process on port 5000
lsof -ti:5000

# Kill process
kill -9 <PID>
```

### Database Issues

```bash
# Reset database (WARNING: deletes all data)
rm database/accommodation.db
npm start
```

### Frontend Not Connecting

Ensure proxy is set in `client/package.json`:

```json
{
  "proxy": "http://localhost:5000"
}
```

### Permission Errors

```bash
# Fix file permissions
chmod -R 755 .
chown -R $USER:$USER .
```

## Next Steps

- [Configuration Guide](./configuration.md)
- [User Guide](../user-guide/overview.md)
- [API Documentation](../developer-guide/api-reference.md)
- [Security Best Practices](../security/best-practices.md)

## Updating

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install
cd client && npm install && cd ..

# Run database migrations (if any)
npm run migrate

# Restart application
pm2 restart accommodation-manager
```

## Support

If you encounter issues during installation:

1. Check the [FAQ](../support/faq.md)
2. Review [Troubleshooting Guide](../support/troubleshooting.md)
3. Contact support
