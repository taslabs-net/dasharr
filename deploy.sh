#!/bin/bash

# Unified Dasharr Deployment Script
# Usage: ./deploy.sh [local|dockge|dockerhub] [version]
# Examples:
#   ./deploy.sh local           # Start dev server locally
#   ./deploy.sh dockge v0.5.51  # Deploy specific version to Dockge
#   ./deploy.sh dockerhub patch # Increment patch version and push to Docker Hub
#   ./deploy.sh dockerhub v0.6.0 # Deploy specific version to Docker Hub

set -e

# Docker image name (used by multiple deployment types)
DOCKER_IMAGE="schenanigans/dasharr"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log() {
    echo -e "${BLUE}📋 $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Parse arguments
TARGET=${1:-"local"}
VERSION_ARG=${2:-""}

# Validate target
case $TARGET in
    local|dockge|dockerhub)
        ;;
    *)
        error "Invalid target: $TARGET. Use 'local', 'dockge', or 'dockerhub'"
        ;;
esac

# Version management function
manage_version() {
    local version_input=$1
    local current_version=$(npm pkg get version | tr -d '"')
    
    if [[ -z "$version_input" ]]; then
        if [[ "$TARGET" == "local" ]]; then
            echo "$current_version"
            return
        else
            error "Version is required for $TARGET deployment"
        fi
    fi
    
    # Handle special tags like "dev" or version-dev (e.g., v0.8.17-dev)
    if [[ "$version_input" == "dev" ]]; then
        echo "dev"
        return
    elif [[ "$version_input" =~ ^v?[0-9]+\.[0-9]+\.[0-9]+-dev$ ]]; then
        echo "$version_input"
        return
    fi
    
    # Handle npm version commands (patch, minor, major)
    if [[ "$version_input" =~ ^(patch|minor|major)$ ]]; then
        log "Incrementing $version_input version..." >&2
        npm version $version_input --no-git-tag-version >&2
        local new_version=$(npm pkg get version | tr -d '"')
        echo "v$new_version"
    # Handle specific version (v0.5.51 or 0.5.51)
    elif [[ "$version_input" =~ ^v?[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        local clean_version=${version_input#v}  # Remove 'v' prefix if present
        log "Setting version to $clean_version..." >&2
        npm version $clean_version --no-git-tag-version >&2
        echo "v$clean_version"
    else
        error "Invalid version format: $version_input. Use 'patch', 'minor', 'major', or 'v0.5.51'"
    fi
}

# Local development
deploy_local() {
    log "Starting local development server..."
    success "Dasharr dev server starting on http://localhost:3000"
    npm run dev
}

# Deploy to Dockge
deploy_dockge() {
    local version=$1
    
    # Dockge-specific configuration
    local REMOTE_HOST="dockge"
    local STACK_PATH="/opt/stacks/dasharr"
    local BUILD_PATH="/tmp/dasharr-build"
    
    log "🚀 Deploying Dasharr $version to $REMOTE_HOST..."
    
    # Step 1: Clean up any previous build directory on remote
    log "📦 Preparing build environment..."
    ssh ${REMOTE_HOST} "rm -rf ${BUILD_PATH} && mkdir -p ${BUILD_PATH}"
    
    # Step 2: Copy source code to remote
    log "📤 Copying source code..."
    rsync -av \
      --exclude=node_modules \
      --exclude=.next \
      --exclude=.git \
      --exclude=data \
      --exclude="/config" \
      --exclude="*.tar" \
      . ${REMOTE_HOST}:${BUILD_PATH}/
    
    # Step 3: Build the Docker image on remote
    log "🔨 Building Docker image on ${REMOTE_HOST}..."
    ssh ${REMOTE_HOST} "cd ${BUILD_PATH} && docker build -t ${DOCKER_IMAGE}:${version} ."
    
    # Step 4: Stop the current container
    log "🛑 Stopping current Dasharr container..."
    ssh ${REMOTE_HOST} "cd ${STACK_PATH} && docker compose down || true"
    
    # Step 5: Update the compose file with new version
    log "📝 Updating compose.yaml..."
    ssh ${REMOTE_HOST} "sed -i 's|image: ${DOCKER_IMAGE}:.*|image: ${DOCKER_IMAGE}:${version}|' ${STACK_PATH}/compose.yaml"
    
    # Step 6: Start with new image
    log "🚀 Starting updated Dasharr..."
    ssh ${REMOTE_HOST} "cd ${STACK_PATH} && docker compose up -d"
    
    # Step 7: Clean up build directory
    log "🧹 Cleaning up..."
    ssh ${REMOTE_HOST} "rm -rf ${BUILD_PATH}"
    
    # Step 8: Show status
    success "Deployment complete!"
    log "📊 Container status:"
    ssh ${REMOTE_HOST} "docker ps | grep dasharr"
    
    echo ""
    success "🌐 Dasharr $version is now running on your Dockge server"
    log "📋 Check logs with: ssh ${REMOTE_HOST} 'docker logs dasharr'"
}

# Deploy to Docker Hub with multi-architecture support
deploy_dockerhub() {
    local version=$1
    
    log "🚀 Building and pushing Dasharr $version to Docker Hub..."
    
    # Ensure buildx is set up for multi-architecture builds
    log "🔧 Setting up Docker buildx..."
    docker buildx create --name dasharr-builder --use 2>/dev/null || docker buildx use dasharr-builder
    
    # Build and push multi-architecture image
    log "🔨 Building multi-architecture image..."
    # Check if this is a dev build (either "dev" or version ending with "-dev")
    if [[ "$version" == "dev" ]] || [[ "$version" =~ -dev$ ]]; then
        # For dev builds, only tag as dev (no latest tag)
        docker buildx build \
            --platform linux/amd64,linux/arm64 \
            --tag ${DOCKER_IMAGE}:${version} \
            --push \
            .
        
        success "Development image pushed to Docker Hub!"
        log "📦 Image: ${DOCKER_IMAGE}:${version}"
        log "⚠️  Not tagged as latest (dev build)"
    else
        # For release builds, tag as both version and latest
        docker buildx build \
            --platform linux/amd64,linux/arm64 \
            --tag ${DOCKER_IMAGE}:${version} \
            --tag ${DOCKER_IMAGE}:latest \
            --push \
            .
        
        success "Multi-architecture image pushed to Docker Hub!"
        log "📦 Image: ${DOCKER_IMAGE}:${version}"
        log "🏷️  Also tagged as: ${DOCKER_IMAGE}:latest"
    fi
    
    # Optional: Create git tag (skip for dev builds)
    if [[ "$version" != "dev" ]] && ! [[ "$version" =~ -dev$ ]] && command -v git &> /dev/null && git rev-parse --git-dir > /dev/null 2>&1; then
        log "🏷️  Creating git tag..."
        git add package.json package-lock.json
        git commit -m "Bump version to ${version}" || true
        git tag ${version} || warning "Git tag ${version} already exists"
        
        log "💡 Don't forget to push git changes:"
        echo "   git push origin main"
        echo "   git push origin ${version}"
    fi
}

# Main execution
main() {
    echo "🚀 Dasharr Deployment Script"
    echo "============================="
    
    case $TARGET in
        local)
            deploy_local
            ;;
        dockge)
            VERSION=$(manage_version "$VERSION_ARG")
            deploy_dockge "$VERSION"
            ;;
        dockerhub)
            VERSION=$(manage_version "$VERSION_ARG")
            deploy_dockerhub "$VERSION"
            ;;
    esac
}

# Run main function
main