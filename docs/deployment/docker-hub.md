# Dasharr

Version 0.8.18

Unified dashboard for media server infrastructure. Consolidates Plex, Jellyfin, Radarr, Sonarr, Bazarr, Tautulli, Overseerr, SABnzbd, qBittorrent, Prowlarr, and UniFi services.

Documentation: https://dasharr.io

## Quick Start

```bash
docker run -d \
  --name dasharr \
  -p 3000:3000 \
  -v dasharr_config:/app/config \
  schenanigans/dasharr:latest
```

Then open http://localhost:3000 and configure your services via the web interface.

## Docker Compose

```yaml
services:
  dasharr:
    image: schenanigans/dasharr:latest
    container_name: dasharr
    ports:
      - "3000:3000"
    volumes:
      - dasharr_config:/app/config  # or use bind mount: ./config:/app/config
    environment:
      # Optional: Set user/group IDs
      - PUID=1000
      - PGID=1000
      # Optional: Use environment variables instead of web config
      - PLEX_URL=http://your-plex:32400
      - PLEX_TOKEN=your-plex-token
      - RADARR_URL=http://your-radarr:7878
      - RADARR_API_KEY=your-radarr-api-key
      # Add other services as needed
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## Environment Variables

### Multi-Instance Support

Dasharr supports multiple instances of each service using numbered suffixes:

```bash
# Single instance
SONARR_URL=http://sonarr:8989
SONARR_API_KEY=your-api-key

# Multiple instances
SONARR_URL_1=http://sonarr-tv:8989
SONARR_API_KEY_1=your-tv-api-key
SONARR_URL_2=http://sonarr-anime:8989
SONARR_API_KEY_2=your-anime-api-key
```

### Service Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `PLEX_URL[_N]` | Plex server URL | No |
| `PLEX_TOKEN[_N]` | Plex access token | No |
| `RADARR_URL[_N]` | Radarr base URL | No |
| `RADARR_API_KEY[_N]` | Radarr API key | No |
| `SONARR_URL[_N]` | Sonarr base URL | No |
| `SONARR_API_KEY[_N]` | Sonarr API key | No |
| `TAUTULLI_URL[_N]` | Tautulli base URL | No |
| `TAUTULLI_API_KEY[_N]` | Tautulli API key | No |
| `SABNZBD_URL[_N]` | SABnzbd base URL | No |
| `SABNZBD_API_KEY[_N]` | SABnzbd API key | No |
| `PROWLARR_URL[_N]` | Prowlarr base URL | No |
| `PROWLARR_API_KEY[_N]` | Prowlarr API key | No |
| `JELLYFIN_URL[_N]` | Jellyfin base URL | No |
| `JELLYFIN_API_KEY[_N]` | Jellyfin API key | No |
| `OVERSEERR_URL[_N]` | Overseerr base URL | No |
| `OVERSEERR_API_KEY[_N]` | Overseerr API key (**no quotes**) | No |
| `QBITTORRENT_URL[_N]` | qBittorrent base URL | No |
| `QBITTORRENT_USERNAME[_N]` | qBittorrent username | No |
| `QBITTORRENT_PASSWORD[_N]` | qBittorrent password | No |
| `JELLYSEERR_URL[_N]` | Jellyseerr base URL | No |
| `JELLYSEERR_API_KEY[_N]` | Jellyseerr API key | No |

### UniFi Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `UNIFI_SITES` | Number of UniFi sites (1-5) | No |
| `UNIFI_URL_SITE_N` | UniFi controller URL for site N | No |
| `UNIFI_API_KEY_N` | UniFi API key for site N | No |
| `UNIFI_SITE_NAME_N` | Display name for UniFi site N | No |
| `UNIFI_SITE_MANAGER` | Enable UniFi Site Manager (true/false) | No |
| `UNIFI_SITE_MANAGER_API_KEY` | UniFi Site Manager API key | No |

### System Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `APP_URL` | External URL for Dasharr (required for reverse proxy) | No |
| `TRUST_PROXY` | Enable when using reverse proxy (true/false) | No |
| `ALLOW_SELF_SIGNED_CERTS` | Allow self-signed certificates (true/false, default: true) | No |
| `PUID` | User ID for file permissions | No |
| `PGID` | Group ID for file permissions | No |

### Security Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `DASHARR_ENCRYPTION_KEY` | Encryption key for sensitive data (auto-generated if not set) | No |
| `DASHARR_SECRET` | Alternative: derive encryption from this secret | No |
| `DASHARR_TRUSTED_ORIGINS` | Comma-separated list of trusted origins for proxy setups | No |

### Metrics Push (Optional)

| Variable | Description | Required |
|----------|-------------|----------|
| `ENABLE_METRICS_PUSH` | Enable metrics push (true/false, default: false) | No |
| `CLOUDFLARE_WORKER_URL` | Metrics endpoint URL | No |
| `DASHBOARD_SECRET` | Bearer token for metrics authentication | No |
| `USE_CLOUDFLARE_QUEUE` | Use Cloudflare Queues (true/false) | No |

Note: `[_N]` indicates support for multiple instances using numbered suffixes (e.g., `_1`, `_2`, `_3`)

## Volumes

- `/app/config` - Configuration storage (required for web-based config)
- `/app/data` - Persistent data storage (optional)

## Ports

- `3000` - Web interface

## Reverse Proxy Configuration

When using Dasharr behind a reverse proxy (nginx, Traefik, etc.), you must set:

```yaml
environment:
  - APP_URL=https://dasharr.yourdomain.com
  - TRUST_PROXY=true
```

This ensures proper handling of forwarded headers and prevents JSON parsing errors when connecting to services.

## Health Check

Built-in health check available at `/api/health`

## Multi-Architecture Support

Supports both `linux/amd64` and `linux/arm64` architectures.

## Links

- Documentation: https://dasharr.io
- Docker Hub: https://hub.docker.com/r/schenanigans/dasharr
- Issues: https://github.com/schenanigans/dasharr/issues