# Docker Deployment Checklist

This checklist ensures your Sure Docker deployment is properly configured and secure.

## 📋 Pre-Deployment Checklist

### 1. Infrastructure Setup

- [ ] Docker Engine installed (version 20.10+)
- [ ] Docker Compose installed (version 2.0+)
- [ ] Sufficient disk space (minimum 10GB recommended)
- [ ] Sufficient RAM (minimum 2GB recommended)
- [ ] Network connectivity verified
- [ ] Domain name configured (if using custom domain)
- [ ] SSL certificates obtained (if using HTTPS)

### 2. Security Configuration

- [ ] Generated strong SECRET_KEY_BASE (64+ characters)
- [ ] Generated strong POSTGRES_PASSWORD
- [ ] Created `.env` file with secrets
- [ ] Set proper file permissions (`chmod 600 .env`)
- [ ] Reviewed and customized .dockerignore
- [ ] Configured firewall rules
- [ ] Planned backup strategy
- [ ] Set up monitoring and logging

### 3. Environment Variables

**Required:**
- [ ] `SECRET_KEY_BASE` - Rails secret key
- [ ] `POSTGRES_PASSWORD` - Database password
- [ ] `DB_HOST` - Database host (usually "db")
- [ ] `REDIS_URL` - Redis connection string
- [ ] `SELF_HOSTED` - Set to "true"

**Optional but Recommended:**
- [ ] `APP_DOMAIN` - Your domain name
- [ ] `EMAIL_SENDER` - Email from address
- [ ] `SMTP_*` - SMTP configuration for emails
- [ ] `OPENAI_ACCESS_TOKEN` - For AI features
- [ ] `TWELVE_DATA_API_KEY` - For market data

### 4. Docker Configuration

- [ ] Reviewed compose.yml settings
- [ ] Configured resource limits
- [ ] Set up persistent volumes
- [ ] Configured health checks
- [ ] Set restart policies
- [ ] Reviewed network configuration
- [ ] Configured logging drivers

### 5. Database Setup

- [ ] Database credentials configured
- [ ] Backup location configured
- [ ] Backup schedule planned
- [ ] Recovery procedure tested
- [ ] Database connection tested
- [ ] Migration strategy planned

## 🚀 Deployment Steps

### Step 1: Prepare Environment

```bash
# Create deployment directory
mkdir -p ~/sure-app
cd ~/sure-app

# Download compose file
curl -o compose.yml https://raw.githubusercontent.com/we-promise/sure/main/compose.example.yml

# Create .env file
cat > .env << EOF
SECRET_KEY_BASE=$(openssl rand -hex 64)
POSTGRES_PASSWORD=$(openssl rand -base64 32)
POSTGRES_USER=sure_user
POSTGRES_DB=sure_production
SELF_HOSTED=true
RAILS_FORCE_SSL=false
RAILS_ASSUME_SSL=false
EOF

# Protect secrets
chmod 600 .env
```

### Step 2: Pull Images

```bash
# Pull all images
docker compose pull

# Verify images
docker images | grep sure
```

### Step 3: Start Services

```bash
# Start in foreground first (to check logs)
docker compose up

# If everything looks good, Ctrl+C and start detached
docker compose up -d
```

### Step 4: Verify Deployment

```bash
# Check all services are running
docker compose ps

# Check web service logs
docker compose logs web

# Check worker service logs
docker compose logs worker

# Verify database connection
docker compose exec db pg_isready

# Verify Redis connection
docker compose exec redis redis-cli ping
```

### Step 5: Initial Configuration

```bash
# Create first user (visit http://localhost:3000)
# OR use Rails console:
docker compose exec web bin/rails console

# In console:
# User.create!(email: "admin@example.com", password: "SecurePassword123!")
```

### Step 6: Configure Reverse Proxy (Optional)

If using nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 7: Set Up Backups

```bash
# Enable backup service
docker compose --profile backup up -d

# Test manual backup
./bin/docker-db backup

# Verify backup file
ls -lh backups/
```

## ✅ Post-Deployment Verification

### Application Health

- [ ] Web interface accessible
- [ ] Can create account
- [ ] Can log in
- [ ] Can create transactions
- [ ] Background jobs processing (check Sidekiq)
- [ ] Email sending works (if configured)
- [ ] AI features work (if configured)

### Technical Health

- [ ] All containers running (`docker compose ps`)
- [ ] No error logs (`docker compose logs`)
- [ ] Health checks passing
- [ ] Database accessible
- [ ] Redis accessible
- [ ] Proper file permissions
- [ ] SSL/HTTPS working (if configured)

### Security Verification

- [ ] Containers running as non-root
- [ ] Unnecessary ports not exposed
- [ ] Strong passwords used
- [ ] .env file protected (600 permissions)
- [ ] Firewall configured
- [ ] Regular updates scheduled
- [ ] Monitoring configured
- [ ] Backup strategy working

### Performance Check

- [ ] Page load times acceptable
- [ ] Memory usage within limits
- [ ] CPU usage normal
- [ ] Disk space sufficient
- [ ] Network latency acceptable

## 🔄 Maintenance Checklist

### Daily

- [ ] Check application logs for errors
- [ ] Verify all services running
- [ ] Monitor resource usage

### Weekly

- [ ] Review backup logs
- [ ] Check disk space
- [ ] Review security logs
- [ ] Update application (if new version available)

### Monthly

- [ ] Test backup restoration
- [ ] Review and rotate logs
- [ ] Update base Docker images
- [ ] Security scan images
- [ ] Review resource usage patterns
- [ ] Update documentation

### Quarterly

- [ ] Review and update secrets
- [ ] Security audit
- [ ] Disaster recovery drill
- [ ] Performance optimization review
- [ ] Update dependencies

## 🆘 Rollback Procedure

If something goes wrong during deployment:

```bash
# 1. Stop new version
docker compose down

# 2. Restore database from backup
./bin/docker-db restore backups/latest-backup.sql

# 3. Start previous version
docker compose -f compose.yml.backup up -d

# 4. Verify rollback successful
docker compose ps
docker compose logs -f web
```

## 📊 Monitoring Setup

### Basic Monitoring

```bash
# Check resource usage
docker stats

# Monitor logs
docker compose logs -f

# Check container health
docker compose ps
```

### Advanced Monitoring (Optional)

Consider integrating:
- Prometheus + Grafana for metrics
- ELK Stack for log aggregation
- Sentry for error tracking
- UptimeRobot for uptime monitoring

## 🔐 Security Hardening Checklist

- [ ] SELinux/AppArmor enabled
- [ ] Docker daemon secured
- [ ] Images scanned for vulnerabilities
- [ ] Network segmentation implemented
- [ ] Read-only filesystem (where possible)
- [ ] Resource limits set
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Fail2ban configured (optional)
- [ ] Intrusion detection setup (optional)

## 📝 Documentation

Keep these documents updated:

- [ ] Deployment notes
- [ ] Configuration changes
- [ ] Incident reports
- [ ] Backup/restore procedures
- [ ] Runbook for common issues
- [ ] Contact information
- [ ] Change log

## 🎯 Success Criteria

Your deployment is successful when:

✅ All services running without errors
✅ Application accessible and functional
✅ Backups running automatically
✅ Monitoring in place
✅ Security measures implemented
✅ Documentation complete
✅ Team trained on procedures

## 📚 Additional Resources

- [Docker Deployment Guide](DOCKER_DEPLOYMENT.md)
- [Quick Start Guide](DOCKER_QUICKSTART.md)
- [Security Best Practices](DOCKER_SECURITY.md)
- [Sure Documentation](https://github.com/we-promise/sure)
- [Docker Documentation](https://docs.docker.com/)

---

**Last Updated:** $(date)
**Version:** 1.0
