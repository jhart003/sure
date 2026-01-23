# Docker Deployment Guide

This guide provides comprehensive instructions for deploying and developing Sure using Docker.

## Table of Contents

- [Quick Start](#quick-start)
- [Docker Images](#docker-images)
- [Development Workflow](#development-workflow)
- [Production Deployment](#production-deployment)
- [Testing](#testing)
- [Database Management](#database-management)
- [Environment Variables](#environment-variables)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Production Deployment

See the [Self Hosting Sure with Docker](docker.md) guide for production deployment.

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/we-promise/sure.git
   cd sure
   ```

2. **Start development environment:**
   ```bash
   docker compose -f docker-compose.dev.yml up
   ```

3. **Access the application:**
   - Web interface: http://localhost:3000
   - Mailcatcher: http://localhost:1080

4. **Run commands in the container:**
   ```bash
   # Rails console
   docker compose -f docker-compose.dev.yml exec web bin/rails console
   
   # Run migrations
   docker compose -f docker-compose.dev.yml exec web bin/rails db:migrate
   
   # Run tests
   docker compose -f docker-compose.dev.yml exec web bin/rails test
   ```

## Docker Images

Sure provides three Docker images optimized for different use cases:

### Production Image (`Dockerfile`)

- **Purpose:** Optimized for production deployment
- **Features:**
  - Multi-stage build for minimal size
  - Precompiled assets
  - Security hardening (non-root user)
  - Health checks
- **Build:**
  ```bash
  ./bin/docker-build production
  ```

### Development Image (`Dockerfile.dev`)

- **Purpose:** Local development with hot-reloading
- **Features:**
  - All development tools included
  - Source code mounted as volume
  - Debugging tools (gdb, strace)
  - No precompiled assets
- **Build:**
  ```bash
  ./bin/docker-build development
  ```

### Test Image (`Dockerfile.test`)

- **Purpose:** Running tests in CI/CD
- **Features:**
  - Chrome/Chromedriver for system tests
  - Test dependencies included
  - Optimized for CI environments
- **Build:**
  ```bash
  ./bin/docker-build test
  ```

## Development Workflow

### Starting the Development Environment

```bash
# Start all services
docker compose -f docker-compose.dev.yml up

# Start in detached mode
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f web
```

### Running Commands

```bash
# Rails console
docker compose -f docker-compose.dev.yml exec web bin/rails console

# Run migrations
docker compose -f docker-compose.dev.yml exec web bin/rails db:migrate

# Generate code
docker compose -f docker-compose.dev.yml exec web bin/rails generate model User

# Install gems
docker compose -f docker-compose.dev.yml exec web bundle install

# Install npm packages
docker compose -f docker-compose.dev.yml exec web npm install
```

### Debugging

The development container includes debugging tools:

```bash
# Attach to a running container
docker compose -f docker-compose.dev.yml exec web bash

# Use byebug or debug in your code
# The debugger will work when running with stdin_open and tty enabled
```

### Hot Reloading

The development setup automatically reloads code changes:

- **Ruby code:** Reloaded by Rails
- **JavaScript:** Reloaded by Tailwind CSS watcher
- **Views:** Instantly reflected

### Stopping the Environment

```bash
# Stop all services
docker compose -f docker-compose.dev.yml down

# Stop and remove volumes (⚠️ deletes data)
docker compose -f docker-compose.dev.yml down -v
```

## Production Deployment

### Building for Production

```bash
# Build the production image
./bin/docker-build production

# Or manually
docker build -t sure:latest \
  --build-arg RUBY_VERSION=3.4.7 \
  --build-arg NODE_VERSION=20 \
  -f Dockerfile .
```

### Running in Production

Use the provided `compose.yml` file:

```bash
# Copy the example file
cp compose.example.yml compose.yml

# Edit environment variables
vim .env

# Start the application
docker compose up -d

# View logs
docker compose logs -f web

# Check status
docker compose ps
```

### Updating Production

```bash
# Pull latest images
docker compose pull

# Rebuild if using local Dockerfile
docker compose build

# Restart services with zero downtime
docker compose up -d --no-deps --build web worker
```

## Testing

### Running Tests Locally

Use the test script:

```bash
# Run all tests
./bin/docker-test

# Run unit tests only
./bin/docker-test unit

# Run system tests only
./bin/docker-test system

# Run specific test file
./bin/docker-test test/models/account_test.rb
```

### Running Tests in CI/CD

```bash
# Build test image
docker compose -f docker-compose.test.yml build

# Run tests
docker compose -f docker-compose.test.yml run --rm test

# With coverage
docker compose -f docker-compose.test.yml run --rm \
  -e COVERAGE=true test bin/rails test
```

### Manual Test Commands

```bash
# Run all tests
docker compose -f docker-compose.test.yml run --rm test bin/rails test

# Run specific test
docker compose -f docker-compose.test.yml run --rm test \
  bin/rails test test/models/account_test.rb

# Run system tests with Chrome
docker compose -f docker-compose.test.yml run --rm test \
  bin/rails test:system
```

## Database Management

### Using the Database Script

The `bin/docker-db` script provides common database operations:

```bash
# Create a backup
./bin/docker-db backup

# Restore from backup
./bin/docker-db restore backups/sure_20240101.sql

# Reset database (⚠️ deletes all data)
./bin/docker-db reset

# Open PostgreSQL console
./bin/docker-db console

# Run migrations
./bin/docker-db migrate

# Seed database
./bin/docker-db seed
```

### Manual Database Operations

```bash
# Run migrations
docker compose exec web bin/rails db:migrate

# Rollback migration
docker compose exec web bin/rails db:rollback

# Create database
docker compose exec web bin/rails db:create

# Seed database
docker compose exec web bin/rails db:seed

# Reset database
docker compose exec web bin/rails db:reset
```

### Database Backups

Automated backups are configured in `compose.yml`:

```bash
# Start backup service
docker compose --profile backup up -d

# Backups are stored in /opt/sure-data/backups by default
# Customize the path in compose.yml
```

### Connecting to Database Directly

```bash
# Using psql in container
docker compose exec db psql -U sure_user -d sure_production

# From host machine (if port is exposed)
psql -h localhost -p 5432 -U sure_user -d sure_production
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY_BASE` | Rails secret key | Generated with `openssl rand -hex 64` |
| `POSTGRES_PASSWORD` | Database password | Strong random password |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Application port | 3000 |
| `RAILS_MAX_THREADS` | Puma thread count | 5 |
| `WEB_CONCURRENCY` | Puma worker count | 2 |
| `POSTGRES_USER` | Database username | sure_user |
| `POSTGRES_DB` | Database name | sure_production |
| `REDIS_URL` | Redis connection URL | redis://redis:6379/1 |
| `OPENAI_ACCESS_TOKEN` | OpenAI API key | - |

### Setting Environment Variables

#### Development

Create `.env.local`:

```bash
cp .env.local.example .env.local
vim .env.local
```

#### Production

Create `.env`:

```bash
cp .env.example .env
vim .env
```

Or pass variables in compose.yml:

```yaml
services:
  web:
    environment:
      SECRET_KEY_BASE: ${SECRET_KEY_BASE}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

## Security Best Practices

### 1. Use Strong Secrets

Generate secure random values:

```bash
# Generate SECRET_KEY_BASE
openssl rand -hex 64

# Generate database password
openssl rand -base64 32
```

### 2. Run as Non-Root User

The production Dockerfile already uses a non-root user (UID 1000):

```dockerfile
USER 1000:1000
```

### 3. Keep Images Updated

Regularly update base images:

```bash
# Pull latest images
docker compose pull

# Rebuild with latest base image
docker compose build --no-cache
```

### 4. Use Read-Only Filesystem

Add to compose.yml for extra security:

```yaml
services:
  web:
    read_only: true
    tmpfs:
      - /tmp
      - /rails/tmp
```

### 5. Limit Resources

Prevent resource exhaustion:

```yaml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 6. Use Network Isolation

Keep internal services isolated:

```yaml
services:
  db:
    networks:
      - backend
    # Don't expose ports unless necessary
```

### 7. Scan for Vulnerabilities

Use security scanning tools:

```bash
# Scan with Docker Scout
docker scout cves sure:latest

# Scan with Trivy
trivy image sure:latest

# Scan with Grype
grype sure:latest
```

### 8. Use SSL/TLS

Configure reverse proxy (nginx, Caddy) for HTTPS:

```yaml
environment:
  RAILS_FORCE_SSL: "true"
  RAILS_ASSUME_SSL: "true"
```

### 9. Secure Secrets Management

Use Docker secrets or external secret management:

```yaml
secrets:
  db_password:
    external: true

services:
  web:
    secrets:
      - db_password
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
```

### 10. Regular Security Updates

Keep dependencies updated:

```bash
# Update gems
docker compose exec web bundle update

# Update npm packages
docker compose exec web npm update

# Audit for vulnerabilities
docker compose exec web bundle audit
docker compose exec web npm audit
```

## Troubleshooting

### Application Won't Start

**Symptom:** Container exits immediately

**Solutions:**

1. Check logs:
   ```bash
   docker compose logs web
   ```

2. Verify environment variables:
   ```bash
   docker compose exec web env
   ```

3. Check database connection:
   ```bash
   docker compose exec web bin/rails runner "ActiveRecord::Base.connection"
   ```

### Database Connection Errors

**Symptom:** `ActiveRecord::DatabaseConnectionError`

**Solutions:**

1. Verify database is running:
   ```bash
   docker compose ps db
   ```

2. Check database health:
   ```bash
   docker compose exec db pg_isready -U sure_user
   ```

3. Reset database volumes:
   ```bash
   docker compose down -v
   docker compose up -d
   ```

### Asset Compilation Fails

**Symptom:** Assets not found or compilation errors

**Solutions:**

1. Rebuild image:
   ```bash
   docker compose build --no-cache web
   ```

2. Precompile manually:
   ```bash
   docker compose exec web bin/rails assets:precompile
   ```

### Out of Memory

**Symptom:** Container killed or OOM errors

**Solutions:**

1. Increase memory limit:
   ```yaml
   services:
     web:
       deploy:
         resources:
           limits:
             memory: 4G
   ```

2. Reduce concurrency:
   ```yaml
   environment:
     RAILS_MAX_THREADS: 3
     WEB_CONCURRENCY: 1
   ```

### Port Already in Use

**Symptom:** Cannot start container, port conflict

**Solutions:**

1. Use different port:
   ```yaml
   ports:
     - "3001:3000"
   ```

2. Stop conflicting service:
   ```bash
   lsof -ti:3000 | xargs kill
   ```

### Slow Performance

**Solutions:**

1. Use volumes for better performance:
   ```yaml
   volumes:
     - .:/rails:cached
   ```

2. Increase resources:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '4'
         memory: 4G
   ```

3. Enable BuildKit:
   ```bash
   export DOCKER_BUILDKIT=1
   docker compose build
   ```

### Testing Issues

**Symptom:** Tests fail in Docker but pass locally

**Solutions:**

1. Check test database:
   ```bash
   docker compose -f docker-compose.test.yml exec test bin/rails db:test:prepare
   ```

2. Ensure Chrome is installed (for system tests):
   ```bash
   docker compose -f docker-compose.test.yml run --rm test which google-chrome
   ```

3. Run with verbose output:
   ```bash
   docker compose -f docker-compose.test.yml run --rm test bin/rails test --verbose
   ```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Rails Docker Guide](https://guides.rubyonrails.org/docker.html)
- [Sure GitHub Repository](https://github.com/we-promise/sure)
- [Sure Discussions](https://github.com/we-promise/sure/discussions)
