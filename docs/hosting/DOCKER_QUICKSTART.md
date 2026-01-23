# Docker Quick Start Guide

Get up and running with Sure using Docker in just a few minutes!

## 🚀 Quick Start Options

### Option 1: Production Deployment (Recommended)

```bash
# 1. Download the Docker Compose file
curl -o compose.yml https://raw.githubusercontent.com/we-promise/sure/main/compose.example.yml

# 2. Create environment file with secrets
cat > .env << 'EOF'
SECRET_KEY_BASE=$(openssl rand -hex 64)
POSTGRES_PASSWORD=$(openssl rand -base64 32)
EOF

# 3. Start the application
docker compose up -d

# 4. Open your browser to http://localhost:3000
```

### Option 2: Local Development

```bash
# 1. Clone the repository
git clone https://github.com/we-promise/sure.git
cd sure

# 2. Start development environment
docker compose -f docker-compose.dev.yml up

# 3. Access the app at http://localhost:3000
# 4. Mailcatcher UI at http://localhost:1080
```

### Option 3: Pull from GitHub Container Registry

```bash
# 1. Create docker-compose.yml
cat > compose.yml << 'EOF'
services:
  web:
    image: ghcr.io/we-promise/sure:stable
    ports:
      - "3000:3000"
    environment:
      SECRET_KEY_BASE: ${SECRET_KEY_BASE}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      DB_HOST: db
      REDIS_URL: redis://redis:6379/1
      SELF_HOSTED: "true"
    depends_on:
      - db
      - redis

  worker:
    image: ghcr.io/we-promise/sure:stable
    command: bundle exec sidekiq
    environment:
      SECRET_KEY_BASE: ${SECRET_KEY_BASE}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      DB_HOST: db
      REDIS_URL: redis://redis:6379/1
      SELF_HOSTED: "true"
    depends_on:
      - db
      - redis

  db:
    image: postgres:16
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: sure_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: sure_production

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

volumes:
  postgres-data:
  redis-data:
EOF

# 2. Create secrets
echo "SECRET_KEY_BASE=$(openssl rand -hex 64)" > .env
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)" >> .env

# 3. Start the app
docker compose up -d
```

## 📋 Common Commands

### Application Management

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f web

# Restart a service
docker compose restart web

# View running containers
docker compose ps

# Update to latest version
docker compose pull
docker compose up -d
```

### Database Operations

```bash
# Run migrations
docker compose exec web bin/rails db:migrate

# Open Rails console
docker compose exec web bin/rails console

# Create database backup
./bin/docker-db backup

# Restore from backup
./bin/docker-db restore backups/sure_20240101.sql

# Open PostgreSQL console
docker compose exec db psql -U sure_user -d sure_production
```

### Development

```bash
# Start development environment
docker compose -f docker-compose.dev.yml up

# Run tests
./bin/docker-test

# Install new gems
docker compose -f docker-compose.dev.yml exec web bundle install

# Install npm packages
docker compose -f docker-compose.dev.yml exec web npm install

# Run database migrations
docker compose -f docker-compose.dev.yml exec web bin/rails db:migrate
```

### Building Images

```bash
# Build production image
./bin/docker-build production

# Build and push to GHCR
./bin/docker-push production

# Build with custom tag
./bin/docker-build production --tag=v1.0.0

# Build for specific platform
./bin/docker-build production --platform=linux/amd64
```

## 🔐 Security Setup

### Generate Strong Secrets

```bash
# SECRET_KEY_BASE (required)
openssl rand -hex 64

# POSTGRES_PASSWORD (required)
openssl rand -base64 32

# Save to .env file
cat > .env << EOF
SECRET_KEY_BASE=$(openssl rand -hex 64)
POSTGRES_PASSWORD=$(openssl rand -base64 32)
EOF

# Protect the file
chmod 600 .env
```

### Enable HTTPS

If using a reverse proxy (recommended):

```yaml
environment:
  RAILS_ASSUME_SSL: "true"
  RAILS_FORCE_SSL: "false"  # Proxy handles SSL
```

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker compose logs web

# Check if ports are available
lsof -i :3000

# Restart all services
docker compose down
docker compose up -d
```

### Database connection errors

```bash
# Check database is running
docker compose ps db

# Reset database (⚠️ deletes all data)
docker compose down -v
docker compose up -d
```

### Permission errors

```bash
# Fix file ownership
docker compose exec web chown -R rails:rails /rails/tmp /rails/log

# Or rebuild without cache
docker compose build --no-cache web
```

### Out of memory

```yaml
# Add to compose.yml
services:
  web:
    deploy:
      resources:
        limits:
          memory: 2G
```

## 📚 Next Steps

- [Complete Docker Deployment Guide](DOCKER_DEPLOYMENT.md)
- [Security Best Practices](DOCKER_SECURITY.md)
- [Self-Hosting Guide](docker.md)
- [Contributing Guide](../../CONTRIBUTING.md)

## 🆘 Getting Help

- [GitHub Discussions](https://github.com/we-promise/sure/discussions)
- [Discord Community](https://discord.gg/36ZGBsxYEK)
- [Issue Tracker](https://github.com/we-promise/sure/issues)

## 📦 Available Images

| Image | Description | Tag |
|-------|-------------|-----|
| Production | Optimized for production | `ghcr.io/we-promise/sure:stable` |
| Latest | Latest main branch build | `ghcr.io/we-promise/sure:latest` |
| Development | Development tools included | `ghcr.io/we-promise/sure:dev` |
| Test | CI/CD testing | `ghcr.io/we-promise/sure:test` |

## ⚡ Performance Tips

```yaml
# Use BuildKit for faster builds
export DOCKER_BUILDKIT=1

# Enable BuildKit cache
docker buildx create --use

# Use volumes for better I/O
volumes:
  - .:/rails:cached  # For development
```

## 🔄 Update Strategy

```bash
# 1. Backup database
./bin/docker-db backup

# 2. Pull latest image
docker compose pull

# 3. Stop current version
docker compose down

# 4. Start new version
docker compose up -d

# 5. Run migrations
docker compose exec web bin/rails db:migrate

# 6. Verify everything works
docker compose ps
docker compose logs -f web
```
