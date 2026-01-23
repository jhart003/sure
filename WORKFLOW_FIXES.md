# Docker Workflow Fixes

## Issues Identified

### 1. Dockerfile.test - Deprecated apt-key Command
**Problem**: The Dockerfile.test was using the deprecated `apt-key` command which is no longer available in newer Debian versions (removed in Debian 12/Bookworm).

**Error**:
```
/bin/sh: 1: apt-key: not found
```

**Fix**: Updated to use modern GPG key management:
- Changed from `apt-key add -` to `gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg`
- Updated repository definition to use signed-by syntax: `deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg]`

**Files Modified**:
- `Dockerfile.test` (lines 37-43)

### 2. Dockerfile.test - Multi-Architecture Chrome Installation
**Problem**: Chrome is only available for amd64 architecture, not arm64. The initial fix didn't account for multi-platform builds, causing failures when building for ARM64.

**Error**:
```
E: Unable to correct problems, you have held broken packages.
google-chrome-stable:amd64 Depends libasound2:amd64 but it is not installable
```

**Fix**: Made Chrome installation conditional on amd64 architecture:
```dockerfile
RUN if [ "$(dpkg --print-architecture)" = "amd64" ]; then \
      wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg \
      && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
      && apt-get update -qq \
      && apt-get -y install --no-install-recommends google-chrome-stable \
      && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives; \
    fi
```

**Note**: Initially used cache mounts (`--mount=type=cache`) which caused issues during the merge process. Removed in favor of standard cleanup.

**Files Modified**:
- `Dockerfile.test` (lines 37-43)

### 3. Ruby Linting Failures - Trailing Whitespace
**Problem**: CI lint job was failing due to trailing whitespace in Ruby files, preventing the publish workflow from completing.

**Error**:
```
Layout/TrailingWhitespace: Trailing whitespace detected.
```

**Fix**: Removed trailing whitespace from affected files:

**Files Modified**:
- `app/controllers/budgets_controller.rb` (lines 10, 21)
- `test/models/budget/variance_calculator_test.rb` (lines 74, 77)

## Workflow Configuration Verification

Both Docker workflows (`docker-build-push.yml` and `publish.yml`) were verified to have proper configuration for:

1. **Authentication**: Both use `GITHUB_TOKEN` for GHCR authentication
2. **Permissions**: Both have `packages: write` permission set
3. **Public Access**: Both include steps to make packages publicly accessible
4. **Multi-platform**: Support for AMD64 and ARM64 architectures

### docker-build-push.yml
- Builds all 3 image variants (production, dev, test)
- Includes retry logic for making packages public
- Uses GitHub Actions cache for faster builds

### publish.yml
- More sophisticated multi-platform build workflow
- Distributes builds across multiple runners
- Merges manifests for multi-arch support
- Includes mobile app builds and GitHub releases for version tags

## Expected Outcomes

After these fixes:
1. ✅ CI lint job should pass (no more trailing whitespace)
2. ✅ Docker builds should complete successfully for both amd64 and arm64 (Chrome only installed on amd64)
3. ✅ Images should be pushed to GHCR (ghcr.io/jhart003/sure:*)
4. ✅ Images should be publicly accessible (via automatic visibility update)

**Note**: System tests requiring Chrome will only work on amd64 architecture. The arm64 image can run the application but will skip Chrome-dependent system tests.

## Testing

To verify the fixes work:

1. Push these changes to trigger the workflow
2. Monitor the GitHub Actions runs
3. Check that all jobs complete successfully
4. Verify images are available at:
   - `ghcr.io/jhart003/sure:latest` (production)
   - `ghcr.io/jhart003/sure-dev:latest` (development)
   - `ghcr.io/jhart003/sure-test:latest` (test)
5. Confirm images are publicly accessible without authentication:
   ```bash
   docker pull ghcr.io/jhart003/sure:latest
   ```

## Additional Notes

- The apt-key deprecation is a common issue when upgrading to newer Debian/Ubuntu versions
- Modern Debian/Ubuntu versions require using the signed-by method for third-party repositories
- The trailing whitespace was likely introduced in recent commits and caught by RuboCop
