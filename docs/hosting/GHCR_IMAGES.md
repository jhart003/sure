# Using Pre-built Docker Images from GitHub Container Registry (GHCR)

Sure provides officially built Docker images on GitHub Container Registry (GHCR) that are automatically built and published from the main repository. These images are publicly accessible and ready to use.

## Available Images

Three image variants are available:

### 1. Production Image (Recommended for Deployment)
```bash
ghcr.io/jhart003/sure:latest
```

This is the main production image built from the root `Dockerfile`. It includes:
- Multi-stage optimized build
- Security-hardened (runs as non-root user)
- Pre-compiled assets
- Health checks configured
- Supports both AMD64 and ARM64 architectures

**Tags available:**
- `latest` - Latest build from the main branch
- `stable` - Latest stable release (from version tags)
- `main` - Latest from main branch
- `develop` - Latest from develop branch
- `v*` - Specific version tags (e.g., `v0.7.0`)
- `<branch>-<sha>` - Specific commit builds

### 2. Development Image
```bash
ghcr.io/jhart003/sure-dev:latest
```

Built from `Dockerfile.dev` for development purposes.

### 3. Test Image
```bash
ghcr.io/jhart003/sure-test:latest
```

Built from `Dockerfile.test` for running tests.

## Using the Pre-built Images

### Quick Start with Docker Compose

A complete example compose file is available at `compose.example.ghcr.yml`. To use it:

```bash
# 1. Download the example compose file
curl -o docker-compose.yml https://raw.githubusercontent.com/jhart003/sure/main/compose.example.ghcr.yml

# 2. Create environment file
curl -o .env https://raw.githubusercontent.com/jhart003/sure/main/.env.example

# 3. Edit .env and set required values (especially SECRET_KEY_BASE)
# Generate a secret: openssl rand -hex 64
nano .env

# 4. Start the application
docker compose up -d

# 5. Access Sure at http://localhost:3000
```

Or use the pre-built image in your existing `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/jhart003/sure:latest
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/sure_production
      REDIS_URL: redis://redis:6379/0
      RAILS_ENV: production
      SECRET_KEY_BASE: ${SECRET_KEY_BASE}
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: sure_production
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/var/lib/redis/data

volumes:
  postgres_data:
  redis_data:
```

See `compose.example.ghcr.yml` for a production-ready example with health checks and best practices.

### Pulling the Latest Image

```bash
# Pull the latest production image
docker pull ghcr.io/jhart003/sure:latest

# Pull a specific version
docker pull ghcr.io/jhart003/sure:v0.7.0

# Pull the development image
docker pull ghcr.io/jhart003/sure-dev:latest
```

### Running the Image Directly

```bash
# Basic run (not recommended for production)
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/dbname \
  -e REDIS_URL=redis://redis:6379/0 \
  -e RAILS_ENV=production \
  -e SECRET_KEY_BASE=your_secret_key \
  ghcr.io/jhart003/sure:latest
```

## Image Build Information

### Automated Builds

Images are automatically built and published when:
- Code is pushed to the `main` branch
- Code is pushed to the `develop` branch
- A new version tag is created (e.g., `v0.7.0`)
- Manually triggered via GitHub Actions

### Build Process

The images are built using GitHub Actions with:
- Multi-platform support (AMD64 and ARM64)
- Layer caching for faster builds
- Security scanning with Trivy
- Signed with build provenance attestation
- Automatically set to public visibility

### Security

All images are:
- Scanned for vulnerabilities using Trivy
- Built from official Ruby base images
- Run as non-root user (UID 1000)
- Include only production dependencies
- Have minimal attack surface

## Advantages of Using Pre-built Images

✅ **Faster deployment** - No need to build locally  
✅ **Consistency** - Same image across all environments  
✅ **Tested** - Images are built and tested in CI/CD  
✅ **Multi-architecture** - Works on AMD64 and ARM64  
✅ **Secure** - Automatically scanned for vulnerabilities  
✅ **Up-to-date** - Always get the latest fixes and features

## Image Verification

You can verify the image signature and provenance:

```bash
# Inspect the image
docker image inspect ghcr.io/jhart003/sure:latest

# View image layers
docker history ghcr.io/jhart003/sure:latest
```

## Troubleshooting

### Image Pull Errors

If you get authentication errors:
```bash
# GHCR packages are public, so no authentication should be needed
# But if you encounter issues, ensure you're using the latest Docker version
docker --version
```

### Image Size

The production image is optimized for size:
- Multi-stage build removes build dependencies
- Only includes runtime dependencies
- Cleaned temporary files and caches

```bash
# Check image size
docker images ghcr.io/jhart003/sure
```

### Getting Image Updates

```bash
# Pull the latest version
docker pull ghcr.io/jhart003/sure:latest

# Remove old images
docker image prune
```

## Building Your Own Image

If you need to customize the image, you can build it yourself:

```bash
# Clone the repository
git clone https://github.com/jhart003/sure.git
cd sure

# Build using the provided script
./bin/docker-build production

# Or build directly with Docker
docker build -t my-sure:latest .
```

## Support

For issues related to:
- **Image availability**: Check [GitHub Container Registry](https://github.com/jhart003/sure/pkgs/container/sure)
- **Build failures**: Check [GitHub Actions](https://github.com/jhart003/sure/actions)
- **Application issues**: See [main documentation](../README.md) or open an issue

## Related Documentation

- [Docker Deployment Guide](DOCKER_DEPLOYMENT.md)
- [Quick Start Guide](DOCKER_QUICKSTART.md)
- [Security Best Practices](DOCKER_SECURITY.md)
- [Self-Hosting Guide](docker.md)
