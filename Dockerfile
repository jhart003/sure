# syntax = docker/dockerfile:1

# =============================================================================
# Build arguments - can be overridden at build time
# =============================================================================
ARG RUBY_VERSION=3.4.7
ARG NODE_VERSION=20
ARG BUILD_COMMIT_SHA

# =============================================================================
# Base stage - shared dependencies for all stages
# =============================================================================
FROM registry.docker.com/library/ruby:$RUBY_VERSION-slim AS base

# Rails app lives here
WORKDIR /rails

# Install base runtime packages
# libvips: Image processing
# postgresql-client: Database client
# libyaml-0-2: YAML parsing
# procps: Process utilities
# curl: HTTP client (needed for health checks)
RUN apt-get update -qq \
    && apt-get install --no-install-recommends -y \
        curl \
        libvips \
        postgresql-client \
        libyaml-0-2 \
        procps \
    && rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Set production environment
ENV RAILS_ENV="production" \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/usr/local/bundle" \
    BUNDLE_WITHOUT="development" \
    BUILD_COMMIT_SHA=${BUILD_COMMIT_SHA} \
    LANG=C.UTF-8
    
# =============================================================================
# Build stage - compile assets and install dependencies
# =============================================================================
FROM base AS build

# Install Node.js for asset compilation
ARG NODE_VERSION
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Install packages needed to build gems and compile assets
# build-essential: C/C++ compilers and tools
# libpq-dev: PostgreSQL development headers
# git: Version control (needed by some gems)
# pkg-config: Package configuration tool
# libyaml-dev: YAML development headers
RUN apt-get update -qq \
    && apt-get install --no-install-recommends -y \
        build-essential \
        libpq-dev \
        git \
        pkg-config \
        libyaml-dev \
    && rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Install application gems
COPY .ruby-version Gemfile Gemfile.lock ./
RUN bundle install \
    && rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git \
    && bundle exec bootsnap precompile --gemfile -j 0

# Install JavaScript dependencies (if package.json exists)
COPY package.json package-lock.json* ./
RUN if [ -f "package-lock.json" ]; then npm ci --production=false; \
    elif [ -f "package.json" ]; then npm install; \
    fi

# Copy application code
COPY . .

# Precompile bootsnap code for faster boot times
RUN bundle exec bootsnap precompile -j 0 app/ lib/

# Precompiling assets for production without requiring secret RAILS_MASTER_KEY
RUN SECRET_KEY_BASE_DUMMY=1 ./bin/rails assets:precompile

# Clean up build artifacts
RUN rm -rf node_modules tmp/cache

# =============================================================================
# Final stage - minimal production image
# =============================================================================
FROM base

# Security: Run and own only the runtime files as a non-root user
RUN groupadd --system --gid 1000 rails && \
    useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash && \
    mkdir -p /rails/tmp /rails/log /rails/storage && \
    chown -R rails:rails /rails/tmp /rails/log /rails/storage

# Copy built artifacts: gems, application
COPY --chown=rails:rails --from=build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --chown=rails:rails --from=build /rails /rails

# Switch to non-root user
USER 1000:1000

# Health check - verify app can respond to requests
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/up || exit 1

# Entrypoint prepares the database
ENTRYPOINT ["/rails/bin/docker-entrypoint"]

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD ["./bin/rails", "server"]
