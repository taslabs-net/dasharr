# Docker Hub Automated Build Setup

## Prerequisites

1. Docker Hub account
2. GitHub repository admin access
3. Docker Hub access token

## Step 1: Generate Docker Hub Access Token

1. Log in to [Docker Hub](https://hub.docker.com)
2. Go to Account Settings → Security
3. Click "New Access Token"
4. Give it a descriptive name (e.g., "GitHub Actions - Dasharr")
5. Copy the generated token (you won't see it again!)

## Step 2: Add GitHub Secrets

Go to your GitHub repository settings:
1. Navigate to Settings → Secrets and variables → Actions
2. Add the following repository secrets:

### Required Secrets

| Secret Name | Description | Example |
|------------|-------------|---------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username | `yourusername` |
| `DOCKERHUB_TOKEN` | The access token from Step 1 | `dckr_pat_xxxxx...` |

## Step 3: Workflow Configuration

The workflow is already configured in `.github/workflows/docker-image.yml` with:

- **Automatic builds** on push to main branch
- **Multi-platform support** (linux/amd64, linux/arm64)
- **Smart tagging**:
  - `latest` tag for main branch
  - Branch name tags for feature branches
  - SHA-based tags for specific commits
- **Build caching** for faster subsequent builds
- **PR testing** (builds but doesn't push on pull requests)

## Step 4: Testing the Workflow

1. Create a pull request with your changes
2. Check the Actions tab to see the build running
3. Merge to main to trigger the push to Docker Hub
4. Verify the image on Docker Hub: `docker.io/yourusername/dasharr`

## Docker Image Tags

After successful builds, your images will be available as:

```bash
# Latest version (from main branch)
docker pull yourusername/dasharr:latest

# Specific branch
docker pull yourusername/dasharr:main
docker pull yourusername/dasharr:feature-branch-name

# Specific commit
docker pull yourusername/dasharr:main-a1b2c3d
```

## Troubleshooting

### Build fails with authentication error
- Verify your Docker Hub token is still valid
- Check that secrets are named exactly as specified
- Ensure the token has push permissions

### Multi-platform build fails
- This requires Docker Buildx which is set up in the workflow
- Ensure your Dockerfile supports multi-arch builds

### Build succeeds but no push
- Pull requests only build, they don't push
- Only merges to main branch trigger the push to Docker Hub

## Security Notes

- Never commit secrets to your repository
- Use GitHub Secrets for all sensitive information
- Rotate Docker Hub access tokens periodically
- Consider using GitHub Environments for additional protection
