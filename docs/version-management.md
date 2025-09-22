# Version Management

## Overview

Dasharr uses automated version consistency checking to ensure all version references stay synchronized across the codebase.

## Version Locations

### Primary Source
- `package.json` - The single source of truth for version numbers

### Auto-Synchronized Files
- `package-lock.json` - Automatically fixed if mismatched

### Reference Files (Manual Update Recommended)
- `PROJECT_ANALYSIS.md` - Project documentation
- `README.md` - Main documentation
- `CHANGELOG.md` - Version history

## Version Check Script

The `scripts/check-version.js` script runs automatically on every commit via Husky pre-commit hook.

### Features
- Validates version consistency across critical files
- Auto-fixes `package-lock.json` if needed
- Warns about outdated documentation references
- Prevents commits if versions don't match

### Manual Run
```bash
node scripts/check-version.js
```

## Updating Version

To update the version across the project:

1. Update version in `package.json`:
```bash
npm version patch  # for bug fixes (0.8.18 -> 0.8.19)
npm version minor  # for new features (0.8.18 -> 0.9.0)
npm version major  # for breaking changes (0.8.18 -> 1.0.0)
```

2. The pre-commit hook will ensure consistency
3. Update documentation files as needed
4. Create a git tag for the release

## Docker Hub Tagging

The GitHub Actions workflow automatically creates Docker tags based on versions:
- `latest` - Always points to the latest main branch build
- `v0.8.18` - Specific version tags (created from git tags)
- `main-abc123` - Commit-specific tags

## Release Process

1. Update version: `npm version patch/minor/major`
2. Run tests and checks
3. Commit changes (version check runs automatically)
4. Push to GitHub
5. Create GitHub release with changelog
6. Docker Hub automatically builds and tags the new version
