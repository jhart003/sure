# Docker Security Best Practices for Sure

This document outlines security best practices for deploying Sure in Docker containers.

## Table of Contents

1. [Image Security](#image-security)
2. [Runtime Security](#runtime-security)
3. [Network Security](#network-security)
4. [Secrets Management](#secrets-management)
5. [Monitoring and Logging](#monitoring-and-logging)
6. [Compliance and Auditing](#compliance-and-auditing)

## Image Security

### Use Official Base Images

✅ **Good:**
```dockerfile
FROM registry.docker.com/library/ruby:3.4.7-slim
```

❌ **Avoid:**
```dockerfile
FROM random-user/ruby:latest
```

### Keep Base Images Updated

```bash
# Regularly rebuild with latest base image
docker build --pull --no-cache -t sure:latest .

# Check for updates
docker pull ruby:3.4.7-slim
```

### Run as Non-Root User

The production Dockerfile already implements this:

```dockerfile
# Create non-root user
RUN groupadd --system --gid 1000 rails && \
    useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash

# Switch to non-root user
USER 1000:1000
```

### Scan Images for Vulnerabilities

Use multiple scanning tools for comprehensive coverage:

```bash
# Trivy
trivy image sure:latest

# Docker Scout
docker scout cves sure:latest

# Grype
grype sure:latest

# Snyk
snyk container test sure:latest
```

### Minimize Image Layers

Use multi-stage builds to reduce final image size:

```dockerfile
# Build stage - includes all build tools
FROM base AS build
RUN apt-get install build-essential ...

# Final stage - only runtime dependencies
FROM base
COPY --from=build /rails /rails
```

### Remove Unnecessary Packages

```dockerfile
# Clean up after package installation
RUN apt-get update && apt-get install -y package \
    && rm -rf /var/lib/apt/lists /var/cache/apt/archives
```

## Runtime Security

### Use Read-Only Root Filesystem

Add to your docker-compose.yml:

```yaml
services:
  web:
    read_only: true
    tmpfs:
      - /tmp
      - /rails/tmp
      - /rails/log
```

### Limit Resources

Prevent resource exhaustion attacks:

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
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
```

### Drop Unnecessary Capabilities

```yaml
services:
  web:
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE  # Only if binding to ports < 1024
```

### Use Security Options

```yaml
services:
  web:
    security_opt:
      - no-new-privileges:true
      - seccomp:unconfined  # Only if needed for debugging
```

### Enable Health Checks

Monitor container health:

```yaml
services:
  web:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/up"]
      interval: 30s
      timeout: 3s
      start_period: 60s
      retries: 3
```

## Network Security

### Use Internal Networks

Isolate services that don't need external access:

```yaml
networks:
  backend:
    internal: true
  frontend:

services:
  db:
    networks:
      - backend
  
  web:
    networks:
      - frontend
      - backend
```

### Don't Expose Unnecessary Ports

Only expose ports that need external access:

```yaml
services:
  db:
    # DON'T expose database port unless necessary
    # ports:
    #   - "5432:5432"
    networks:
      - backend
```

### Use a Reverse Proxy

Use nginx or Caddy as a reverse proxy:

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
```

Example nginx.conf:

```nginx
server {
    listen 443 ssl http2;
    server_name sure.example.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000" always;
    
    location / {
        proxy_pass http://web:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Enable HTTPS

```yaml
environment:
  RAILS_FORCE_SSL: "true"
  RAILS_ASSUME_SSL: "true"
```

## Secrets Management

### Never Hardcode Secrets

❌ **Bad:**
```yaml
environment:
  SECRET_KEY_BASE: "hardcoded-secret-key"
  POSTGRES_PASSWORD: "password123"
```

✅ **Good:**
```yaml
environment:
  SECRET_KEY_BASE: ${SECRET_KEY_BASE}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

### Use Docker Secrets

For production deployments:

```yaml
secrets:
  db_password:
    external: true
  secret_key_base:
    external: true

services:
  web:
    secrets:
      - db_password
      - secret_key_base
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
      SECRET_KEY_BASE_FILE: /run/secrets/secret_key_base
```

Create secrets:

```bash
echo "strong_password" | docker secret create db_password -
echo "$(openssl rand -hex 64)" | docker secret create secret_key_base -
```

### Use Environment Variable Files

Create a `.env` file:

```bash
# Generate strong secrets
SECRET_KEY_BASE=$(openssl rand -hex 64)
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Save to .env
cat > .env << EOF
SECRET_KEY_BASE=$SECRET_KEY_BASE
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
EOF

# Protect the file
chmod 600 .env
```

### Rotate Secrets Regularly

```bash
# Generate new secret
NEW_SECRET=$(openssl rand -hex 64)

# Update environment
# Update .env file or Docker secrets

# Restart services
docker compose up -d --force-recreate
```

## Monitoring and Logging

### Centralized Logging

Use a logging driver:

```yaml
services:
  web:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

Or use a log aggregation service:

```yaml
services:
  web:
    logging:
      driver: "syslog"
      options:
        syslog-address: "tcp://logs.example.com:514"
        tag: "sure-web"
```

### Monitor Container Activity

Use security monitoring tools:

```bash
# Falco - Runtime security
docker run -d --name falco \
  --privileged \
  -v /var/run/docker.sock:/host/var/run/docker.sock \
  -v /dev:/host/dev \
  -v /proc:/host/proc:ro \
  falcosecurity/falco

# Sysdig - Container monitoring
docker run -d --name sysdig-agent \
  --privileged \
  --net host \
  -e ACCESS_KEY=your-access-key \
  -v /var/run/docker.sock:/host/var/run/docker.sock \
  sysdig/agent
```

### Enable Audit Logging

Configure Docker daemon to log events:

```json
{
  "log-level": "info",
  "log-driver": "json-file",
  "audit-log-enabled": true,
  "audit-log-path": "/var/log/docker-audit.log"
}
```

## Compliance and Auditing

### Regular Security Audits

Schedule regular security checks:

```bash
#!/bin/bash
# security-audit.sh

echo "Running security audit..."

# Check for vulnerable packages
docker compose exec web bundle audit

# Check npm packages
docker compose exec web npm audit

# Scan Docker images
trivy image sure:latest

# Check for secrets in code
docker run --rm -v "$PWD:/path" trufflesecurity/trufflehog filesystem /path

echo "Audit complete"
```

### Compliance Scanning

Use Docker Bench Security:

```bash
docker run --rm --net host --pid host --userns host --cap-add audit_control \
  -e DOCKER_CONTENT_TRUST=$DOCKER_CONTENT_TRUST \
  -v /var/lib:/var/lib \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /usr/lib/systemd:/usr/lib/systemd \
  -v /etc:/etc --label docker_bench_security \
  docker/docker-bench-security
```

### Document Security Configurations

Maintain a security checklist:

- [ ] All secrets are stored securely
- [ ] Images are scanned for vulnerabilities
- [ ] Containers run as non-root users
- [ ] Network is properly segmented
- [ ] Logs are collected and monitored
- [ ] HTTPS is enforced
- [ ] Security headers are set
- [ ] Resource limits are configured
- [ ] Backup and recovery tested
- [ ] Incident response plan documented

## Security Checklist

Use this checklist before deploying:

### Pre-Deployment

- [ ] Generate strong, unique secrets
- [ ] Configure environment variables properly
- [ ] Review and update .dockerignore
- [ ] Scan images for vulnerabilities
- [ ] Test with read-only filesystem
- [ ] Configure resource limits
- [ ] Set up HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Enable logging and monitoring
- [ ] Document security configurations

### Post-Deployment

- [ ] Verify containers are running as non-root
- [ ] Check that unnecessary ports are not exposed
- [ ] Confirm HTTPS is working
- [ ] Test health checks
- [ ] Verify backup strategy
- [ ] Set up alerting
- [ ] Review logs for anomalies
- [ ] Test disaster recovery
- [ ] Schedule regular security updates
- [ ] Plan for secret rotation

## Additional Resources

- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)
- [OWASP Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)
- [Rails Security Guide](https://guides.rubyonrails.org/security.html)
- [NIST Container Security Guide](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-190.pdf)
