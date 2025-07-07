# Dasharr - Unified Media Dashboard

Consolidates your Plex, Jellyfin, Radarr, Sonarr, Tautulli, Overseerr, SABnzbd, qBittorrent, and Prowlarr services into one beautiful, customizable dashboard.

📖 **Full Documentation**: https://dasharr.io

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
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## Configuration

Two configuration methods:

1. **Web-based** (Recommended): Navigate to `/config` and enter your service details
2. **Environment variables**: Set in Docker run command or compose file

## Features

- **Real-time statistics** for all your media services
- **Drag & drop** service reordering
- **Multiple themes** - Dark, Emerald, Ocean, Amethyst
- **Service-specific dashboards** with detailed information
- **Auto-hide** unconfigured services

## Supported Services

- **Plex Media Server** - Media streaming
- **Jellyfin** - Open-source media streaming
- **Radarr** - Movie management
- **Sonarr** - TV show management
- **Tautulli** - Plex analytics and monitoring
- **Overseerr** - Media request management
- **SABnzbd** - Usenet downloader
- **qBittorrent** - BitTorrent client
- **Prowlarr** - Indexer management

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PLEX_URL` | Plex server URL | No |
| `PLEX_TOKEN` | Plex access token | No |
| `RADARR_URL` | Radarr base URL | No |
| `RADARR_API_KEY` | Radarr API key | No |
| `SONARR_URL` | Sonarr base URL | No |
| `SONARR_API_KEY` | Sonarr API key | No |
| `TAUTULLI_URL` | Tautulli base URL | No |
| `TAUTULLI_API_KEY` | Tautulli API key | No |
| `SABNZBD_URL` | SABnzbd base URL | No |
| `SABNZBD_API_KEY` | SABnzbd API key | No |
| `PROWLARR_URL` | Prowlarr base URL | No |
| `PROWLARR_API_KEY` | Prowlarr API key | No |
| `JELLYFIN_URL` | Jellyfin base URL | No |
| `JELLYFIN_API_KEY` | Jellyfin API key | No |
| `OVERSEERR_URL` | Overseerr base URL | No |
| `OVERSEERR_API_KEY` | Overseerr API key | No |
| `QBITTORRENT_URL` | qBittorrent base URL | No |
| `QBITTORRENT_USERNAME` | qBittorrent username | No |
| `QBITTORRENT_PASSWORD` | qBittorrent password | No |
| `PUID` | User ID for file permissions | No |
| `PGID` | Group ID for file permissions | No |

## Volumes

- `/app/config` - Configuration storage (required for web-based config)

## Ports

- `3000` - Web interface

## Health Check

Built-in health check available at `/api/health`

## Links

- 📖 **Documentation**: https://dasharr.io