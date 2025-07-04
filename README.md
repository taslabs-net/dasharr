# Dasharr

A unified media dashboard that consolidates your Plex, Radarr, Sonarr, and other media services into one beautiful interface.

![Dasharr Screenshot](https://dasharr.io/screenshot1.png)

## Features

- 📊 **Real-time Statistics** - Monitor active streams, downloads, and system health
- 🎨 **Beautiful Interface** - Modern, responsive design with multiple themes
- 🔧 **Easy Configuration** - Web-based setup with no config files needed
- 🐳 **Docker Ready** - Simple deployment with Docker Compose
- 🎯 **Service Integration** - Supports Plex, Tautulli, Overseerr, Radarr, Sonarr, SABnzbd, qBittorrent, and Prowlarr

## Quick Start

### Using Docker Run

```bash
docker run -d \
  --name dasharr \
  -p 3000:3000 \
  -v ./config:/app/config \
  schenanigans/dasharr:latest
```

### Using Docker Compose (Recommended)

1. Copy `.env.example` to `.env` and configure your services
2. Run with Docker Compose:

```bash
docker compose up -d
```

Then open http://localhost:3000 in your browser.

## Configuration

Dasharr supports two configuration methods:

### Web-Based Configuration (Recommended)
1. Navigate to http://localhost:3000
2. Click "Configuration" in the navigation
3. Enter your service URLs and API keys
4. Click "Test Connection" and "Save"

### Environment Variables
Configure services in your `.env` file. See `.env.example` for all available options.

## Services Supported

- **Plex** - Media server monitoring
- **Tautulli** - Plex statistics and monitoring
- **Overseerr** - Request management
- **Radarr** - Movie management
- **Sonarr** - TV show management
- **Prowlarr** - Indexer management
- **SABnzbd** - Usenet downloader
- **qBittorrent** - BitTorrent client

## Documentation

Full documentation is available at [https://dasharr.io](https://dasharr.io)

## Support

- Documentation: https://dasharr.io
- Docker Hub: https://hub.docker.com/r/schenanigans/dasharr
- Buy Me a Coffee: https://coff.ee/taslabs

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Created by Tim Schneider