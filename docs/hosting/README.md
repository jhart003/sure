# Sure Docker Deployment Documentation

Complete documentation for deploying Sure with Docker.

## 📖 Documentation Index

### Getting Started

1. **[Quick Start Guide](DOCKER_QUICKSTART.md)** ⚡
   - Get up and running in 5 minutes
   - Common commands and examples
   - Quick troubleshooting tips
   - **Best for:** First-time users who want to try Sure quickly

2. **[Self-Hosting Guide](docker.md)** 📘
   - Standard deployment process
   - Step-by-step setup instructions
   - Configuration and updates
   - **Best for:** Production self-hosting

### Advanced Guides

3. **[Comprehensive Deployment Guide](DOCKER_DEPLOYMENT.md)** 🚀
   - Complete Docker deployment documentation
   - Development, testing, and production workflows
   - Database management
   - Environment variables
   - **Best for:** Understanding all deployment options

4. **[Security Best Practices](DOCKER_SECURITY.md)** 🔐
   - Image security
   - Runtime security
   - Network security
   - Secrets management
   - Compliance and auditing
   - **Best for:** Security-conscious deployments

5. **[Deployment Checklist](DOCKER_CHECKLIST.md)** ✅
   - Pre-deployment checklist
   - Step-by-step deployment
   - Post-deployment verification
   - Maintenance schedule
   - **Best for:** Enterprise deployments

## 🎯 Quick Decision Guide

**I want to...**

- **Try Sure locally** → [Quick Start Guide](DOCKER_QUICKSTART.md)
- **Deploy to production** → [Self-Hosting Guide](docker.md) + [Deployment Checklist](DOCKER_CHECKLIST.md)
- **Develop Sure** → [Comprehensive Guide - Development Section](DOCKER_DEPLOYMENT.md#development-workflow)
- **Secure my deployment** → [Security Best Practices](DOCKER_SECURITY.md)
- **Run tests** → [Comprehensive Guide - Testing Section](DOCKER_DEPLOYMENT.md#testing)

## 🛠️ Available Tools

Sure includes several utility scripts to make Docker operations easier:

### Build and Deploy

```bash
# Build production image
./bin/docker-build production

# Push to GitHub Container Registry
./bin/docker-push production --tag=v1.0.0
```

### Database Management

```bash
# Create backup
./bin/docker-db backup

# Restore from backup
./bin/docker-db restore backups/backup.sql

# Run migrations
./bin/docker-db migrate

# Open PostgreSQL console
./bin/docker-db console
```

### Testing

```bash
# Run all tests
./bin/docker-test

# Run specific test file
./bin/docker-test test/models/account_test.rb

# Run system tests
./bin/docker-test system
```

## 🐳 Docker Images

Sure provides multiple Docker images optimized for different use cases:

| Image | Purpose | Dockerfile | Size |
|-------|---------|------------|------|
| Production | Optimized for production | `Dockerfile` | ~350MB |
| Development | Hot-reload, debugging tools | `Dockerfile.dev` | ~600MB |
| Test | CI/CD with Chrome | `Dockerfile.test` | ~700MB |
| Simple | Constrained environments | `Dockerfile.simple` | ~350MB |

## 📦 Docker Compose Files

| File | Purpose | Use Case |
|------|---------|----------|
| `compose.example.yml` | Production deployment | Self-hosting |
| `compose.example.ai.yml` | Production + Ollama | AI features with local LLM |
| `docker-compose.dev.yml` | Development | Local development |
| `docker-compose.test.yml` | Testing | Running tests |

## 🔄 Common Workflows

### Development Workflow

```bash
# 1. Start development environment
docker compose -f docker-compose.dev.yml up

# 2. Make code changes (automatically reload)

# 3. Run tests
docker compose -f docker-compose.dev.yml exec web bin/rails test

# 4. Access Rails console
docker compose -f docker-compose.dev.yml exec web bin/rails console
```

### Production Deployment

```bash
# 1. Download compose file
curl -o compose.yml https://raw.githubusercontent.com/we-promise/sure/main/compose.example.yml

# 2. Configure environment
cp .env.example .env
vim .env  # Add your secrets

# 3. Start services
docker compose up -d

# 4. Verify deployment
docker compose ps
docker compose logs -f web
```

### Update Workflow

```bash
# 1. Backup database
./bin/docker-db backup

# 2. Pull latest images
docker compose pull

# 3. Restart with new version
docker compose up -d

# 4. Run migrations
docker compose exec web bin/rails db:migrate
```

## 🆘 Troubleshooting

Common issues and solutions:

### Container won't start
```bash
# Check logs
docker compose logs web

# Rebuild image
docker compose build --no-cache web
```

### Database connection errors
```bash
# Check database status
docker compose ps db

# Reset database (⚠️ deletes data)
docker compose down -v
docker compose up -d
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

See the [Comprehensive Guide](DOCKER_DEPLOYMENT.md#troubleshooting) for more troubleshooting tips.

## 🔐 Security Considerations

**Essential security steps:**

1. Generate strong secrets
   ```bash
   openssl rand -hex 64  # For SECRET_KEY_BASE
   ```

2. Protect your .env file
   ```bash
   chmod 600 .env
   ```

3. Use HTTPS in production
   ```yaml
   environment:
     RAILS_FORCE_SSL: "true"
   ```

4. Scan for vulnerabilities
   ```bash
   trivy image sure:latest
   ```

See the [Security Guide](DOCKER_SECURITY.md) for comprehensive security practices.

## 📊 Architecture

```
┌─────────────────────────────────────────────┐
│              Load Balancer/Proxy            │
│              (nginx/Caddy)                  │
└─────────────────┬───────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
    ┌────▼────┐      ┌────▼────┐
    │   Web   │      │ Worker  │
    │ (Rails) │      │(Sidekiq)│
    └────┬────┘      └────┬────┘
         │                │
         └────────┬───────┘
                  │
         ┌────────┴────────┐
         │                 │
    ┌────▼────┐      ┌────▼────┐
    │   DB    │      │  Redis  │
    │(Postgres)│     │         │
    └─────────┘      └─────────┘
```

## 📈 Performance Tips

- Use volumes for better I/O performance
- Enable BuildKit for faster builds
- Configure appropriate resource limits
- Use multi-stage builds to reduce image size
- Enable health checks for automatic recovery

## 🤝 Contributing

Found an issue or have a suggestion? 

- [Open an issue](https://github.com/we-promise/sure/issues)
- [Join Discord](https://discord.gg/36ZGBsxYEK)
- [Start a discussion](https://github.com/we-promise/sure/discussions)

## 📜 License

Sure is distributed under the [AGPLv3 license](../../LICENSE).

---

**Need help?** Check out:
- [GitHub Discussions](https://github.com/we-promise/sure/discussions)
- [Discord Community](https://discord.gg/36ZGBsxYEK)
- [Issue Tracker](https://github.com/we-promise/sure/issues)
