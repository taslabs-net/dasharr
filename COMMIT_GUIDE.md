# Commit Guidelines for Dasharr

This project uses [Commitizen](https://github.com/commitizen/cz-cli) and [Conventional Commits](https://www.conventionalcommits.org/) to maintain a consistent commit history.

## Making Commits

### Interactive Mode (Recommended)
Use the provided npm script for an interactive commit experience:

```bash
npm run commit
```

This will guide you through creating a properly formatted commit message.

### Manual Git Commits
You can still use regular git commits, but they must follow the conventional format:

```bash
git commit -m "feat: add new service integration"
```

## Commit Message Format

Each commit message consists of a **type**, **scope** (optional), and **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

### Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, missing semicolons, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools
- **ci**: Changes to CI configuration files and scripts
- **build**: Changes that affect the build system or external dependencies
- **revert**: Reverts a previous commit

### Examples

```bash
# Feature
feat: add Bazarr service integration
feat(api): implement webhook endpoint for notifications

# Bug Fix
fix: correct service status detection for Plex
fix(ui): resolve drag-and-drop issue in dashboard

# Documentation
docs: update README with Docker socket configuration
docs(api): add OpenAPI specifications

# Chore
chore: update dependencies to latest versions
chore(docker): optimize Dockerfile layers
```

## Git Hooks

The project includes several Git hooks via Husky:

1. **pre-commit**: Runs ESLint and TypeScript checks
2. **prepare-commit-msg**: Enables interactive Commitizen prompts
3. **commit-msg**: Validates commit messages against conventional format

## Benefits

- **Automatic Changelog Generation**: Can generate CHANGELOG.md from commits
- **Semantic Versioning**: Helps determine version bumps
- **Clear History**: Makes the git history more readable
- **CI/CD Integration**: Enables automated releases based on commit types
