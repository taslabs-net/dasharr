# API Requests Made by Dasharr

This document provides complete transparency about all API calls made by Dasharr to external services. For security purposes, this shows exactly what data Dasharr requests from your media services.

## Overview

Dasharr makes **read-only** API calls to gather information for display. It does not modify, delete, or add content to any of your services. All API calls require authentication that you provide.

## API Calls by Service

### Plex Media Server

**Authentication Method**: X-Plex-Token header

**API Endpoints Called**:
- `GET /identity` - Server name and machine identifier
- `GET /` - Server capabilities and version
- `GET /library/sections` - List of all libraries (movies, TV shows, etc.)
- `GET /library/sections/{id}/all?X-Plex-Container-Start=0&X-Plex-Container-Size=0` - Count of items in each library
- `GET /accounts` - List of Plex users
- `GET /status/sessions` - Currently playing media and active users
- `GET /activities` - Server activities (scanning, refreshing metadata)
- `GET /library/recentlyAdded` - Recently added media items
- `GET /library/onDeck` - Continue watching items
- `GET /transcode/sessions` - Active transcoding sessions
- `GET /statistics/media` - Media statistics and play counts

**Data Accessed**: Media counts, active streams, user information, server status

### Jellyfin

**Authentication Method**: X-Emby-Token header

**API Endpoints Called**:
- `GET /System/Info/Public` - Server version and name
- `GET /Items/Counts` - Total counts of movies, series, episodes
- `GET /Sessions` - Active streaming sessions
- `GET /Library/VirtualFolders` - Library names and types
- `GET /Users` - User list and activity
- `GET /Users/{userId}/Items/Latest?Limit=10` - Recently added items

**Data Accessed**: Media counts, active streams, user information, server status

### Radarr

**Authentication Method**: X-Api-Key header  
**API Version**: v3

**API Endpoints Called**:
- `GET /api/v3/system/status` - Version and system information
- `GET /api/v3/health` - System health checks
- `GET /api/v3/movie` - List of all movies in library
- `GET /api/v3/calendar` - Upcoming movie releases
- `GET /api/v3/queue` - Current download queue
- `GET /api/v3/wanted/missing` - Missing/wanted movies
- `GET /api/v3/diskspace` - Available disk space

**Data Accessed**: Movie counts, download status, system health, upcoming releases

### Sonarr

**Authentication Method**: X-Api-Key header  
**API Version**: v3

**API Endpoints Called**:
- `GET /api/v3/system/status` - Version and system information
- `GET /api/v3/health` - System health checks
- `GET /api/v3/series` - List of all TV series
- `GET /api/v3/episode` - Episode information
- `GET /api/v3/calendar` - Upcoming episode releases
- `GET /api/v3/queue` - Current download queue
- `GET /api/v3/wanted/missing` - Missing episodes
- `GET /api/v3/diskspace` - Available disk space

**Data Accessed**: Series counts, episode counts, download status, upcoming episodes

### Tautulli

**Authentication Method**: apikey URL parameter  
**API Version**: v2

**API Endpoints Called**:
- `GET /api/v2?cmd=get_activity` - Current streaming activity
- `GET /api/v2?cmd=get_history` - Watch history statistics
- `GET /api/v2?cmd=get_home_stats` - Dashboard statistics
- `GET /api/v2?cmd=get_recently_added` - Recently added to Plex
- `GET /api/v2?cmd=get_server_info` - Plex server information
- `GET /api/v2?cmd=pms_image_proxy` - Proxy for Plex images

**Data Accessed**: Streaming statistics, watch history, server metrics

### Overseerr

**Authentication Method**: X-Api-Key header  
**API Version**: v1

**API Endpoints Called**:
- `GET /api/v1/status` - Application status
- `GET /api/v1/request` - Media requests list
- `GET /api/v1/request/count` - Request statistics
- `GET /api/v1/media` - Media availability status
- `GET /api/v1/user` - User information

**Data Accessed**: Request counts, pending requests, media availability

### SABnzbd

**Authentication Method**: apikey URL parameter

**API Endpoints Called**:
- `GET /api?mode=queue` - Current download queue
- `GET /api?mode=history` - Download history
- `GET /api?mode=status` - Download speed and status
- `GET /api?mode=server_stats` - Server statistics

**Data Accessed**: Download queue, speeds, history, disk usage

### qBittorrent

**Authentication Method**: Session cookie (username/password login)  
**API Version**: v2

**API Endpoints Called**:
- `POST /api/v2/auth/login` - Initial authentication only
- `GET /api/v2/sync/maindata` - Torrent list and statistics
- `GET /api/v2/torrents/info` - Detailed torrent information
- `GET /api/v2/transfer/info` - Transfer speeds and limits

**Data Accessed**: Active torrents, download/upload speeds, torrent status

### Prowlarr

**Authentication Method**: X-Api-Key header  
**API Version**: v1

**API Endpoints Called**:
- `GET /api/v1/system/status` - System information
- `GET /api/v1/health` - Health status
- `GET /api/v1/indexer` - Configured indexers
- `GET /api/v1/indexerstats` - Indexer statistics

**Data Accessed**: Indexer counts, search statistics, system health

## Security Notes

1. **Read-Only Access**: Dasharr only reads data and never modifies your services
2. **Credential Storage**: API keys are stored encrypted in the config file or can be provided via environment variables
3. **Local Network**: Dasharr is designed to run on your local network and communicate with services on the same network
4. **No External Communication**: Dasharr does not send any data to external servers
5. **Network Isolation** (Recommended): For enhanced security, run Dasharr and your media services on a dedicated Docker network:
   ```yaml
   networks:
     media_network:
       driver: bridge
   ```
   This ensures Dasharr can only communicate with explicitly connected services

## Rate Limiting

Dasharr implements reasonable polling intervals to avoid overwhelming your services:
- Real-time data: Updates every 5-10 seconds when dashboard is active
- Statistics: Updates every 30-60 seconds
- Library counts: Updates every 5 minutes

## Privacy

- No telemetry or analytics are collected
- No data leaves your local network
- No external services are contacted
- All communication is between Dasharr and your configured services only