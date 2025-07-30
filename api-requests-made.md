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
- `GET /devices` - Connected devices
- `GET /statistics/media` - Media statistics and play counts

**Data Accessed**: Media counts, active streams, user information, server status, device information

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
- `GET /api/v3/queue/details` - Detailed queue information
- `GET /api/v3/queue/status` - Queue status
- `GET /api/v3/wanted/missing` - Missing/wanted movies
- `GET /api/v3/wanted/cutoff` - Movies below quality cutoff
- `GET /api/v3/history` - Download history
- `GET /api/v3/diskspace` - Available disk space
- `GET /api/v3/qualityprofile` - Quality profiles
- `GET /api/v3/rootfolder` - Root folders
- `GET /api/v3/indexer` - Configured indexers
- `GET /api/v3/downloadclient` - Download clients

**Data Accessed**: Movie counts, download status, system health, upcoming releases, quality settings

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
- `GET /api/v3/queue/details` - Detailed queue information
- `GET /api/v3/queue/status` - Queue status
- `GET /api/v3/wanted/missing` - Missing episodes
- `GET /api/v3/wanted/cutoff` - Episodes below quality cutoff
- `GET /api/v3/history` - Download history
- `GET /api/v3/diskspace` - Available disk space
- `GET /api/v3/qualityprofile` - Quality profiles
- `GET /api/v3/rootfolder` - Root folders
- `GET /api/v3/indexer` - Configured indexers
- `GET /api/v3/downloadclient` - Download clients

**Data Accessed**: Series counts, episode counts, download status, upcoming episodes, quality settings

### Bazarr

**Authentication Method**: X-Api-Key header  
**API Version**: v1

**API Endpoints Called**:
- `GET /api/system/status` - Version and system information
- `GET /api/system/health` - System health checks
- `GET /api/series` - List of all TV series
- `GET /api/movies` - List of all movies
- `GET /api/history/series` - Series subtitle history
- `GET /api/history/movies` - Movie subtitle history
- `GET /api/wanted` - Wanted subtitles

**Data Accessed**: Subtitle counts, missing subtitles, download history

### Tautulli

**Authentication Method**: apikey URL parameter  
**API Version**: v2

**API Endpoints Called**:
- `GET /api/v2?cmd=get_activity` - Current streaming activity
- `GET /api/v2?cmd=get_history` - Watch history statistics
- `GET /api/v2?cmd=get_home_stats` - Dashboard statistics
- `GET /api/v2?cmd=get_recently_added` - Recently added to Plex
- `GET /api/v2?cmd=get_server_info` - Plex server information
- `GET /api/v2?cmd=get_library_media_info` - Library statistics
- `GET /api/v2?cmd=get_users` - User information
- `GET /api/v2?cmd=pms_image_proxy` - Proxy for Plex images

**Data Accessed**: Streaming statistics, watch history, server metrics, user activity

### Overseerr

**Authentication Method**: X-Api-Key header  
**API Version**: v1

**API Endpoints Called**:
- `GET /api/v1/status` - Application status
- `GET /api/v1/request` - Media requests list
- `GET /api/v1/request/count` - Request statistics
- `GET /api/v1/media` - Media availability status
- `GET /api/v1/user` - User information
- `GET /api/v1/movies` - Movie data
- `GET /api/v1/tv` - TV show data

**Data Accessed**: Request counts, pending requests, media availability

### Jellyseerr

**Authentication Method**: X-Api-Key header  
**API Version**: v1

**API Endpoints Called**:
- `GET /api/v1/status` - Application status
- `GET /api/v1/request` - Media requests list
- `GET /api/v1/request/count` - Request statistics
- `GET /api/v1/media` - Media availability status
- `GET /api/v1/user` - User information
- `GET /api/v1/search/multi` - Multi-search results
- `GET /api/v1/discover/movies` - Discover movies
- `GET /api/v1/discover/tv` - Discover TV shows
- `GET /api/v1/movies/{id}` - Specific movie details
- `GET /api/v1/tv/{id}` - Specific TV show details

**Data Accessed**: Request counts, pending requests, media availability, search results

### SABnzbd

**Authentication Method**: apikey URL parameter

**API Endpoints Called**:
- `GET /api?mode=queue&output=json` - Current download queue
- `GET /api?mode=history&output=json` - Download history
- `GET /api?mode=status&output=json` - Download speed and status
- `GET /api?mode=server_stats&output=json` - Server statistics
- `GET /api?mode=fullstatus&output=json` - Full status information

**Data Accessed**: Download queue, speeds, history, disk usage

### qBittorrent

**Authentication Method**: Session cookie (username/password login)  
**API Version**: v2

**API Endpoints Called**:
- `POST /api/v2/auth/login` - Initial authentication only
- `GET /api/v2/sync/maindata` - Torrent list and statistics
- `GET /api/v2/torrents/info` - Detailed torrent information
- `GET /api/v2/transfer/info` - Transfer speeds and limits
- `GET /api/v2/app/preferences` - Application preferences
- `GET /api/v2/torrents/categories` - Torrent categories

**Data Accessed**: Active torrents, download/upload speeds, torrent status, categories

### Prowlarr

**Authentication Method**: X-Api-Key header  
**API Version**: v1

**API Endpoints Called**:
- `GET /api/v1/system/status` - System information
- `GET /api/v1/health` - Health status
- `GET /api/v1/indexer` - Configured indexers
- `GET /api/v1/indexerstats` - Indexer statistics

**Data Accessed**: Indexer counts, search statistics, system health

### UniFi Network

**Authentication Method**: API Key via authorization request header
**API Version**: v2

**API Endpoints Called**:
- `GET /proxy/network/v2/api/site/{site}/dashboard` - Site dashboard statistics
- `GET /proxy/network/v2/api/site/{site}/device` - Device information
- `GET /proxy/network/v2/api/site/{site}/client/active` - Active client list
- `GET /proxy/network/v2/api/site/{site}/stat/health` - Network health status
- `GET /v2/api/sites` - List of managed sites (for multi-site)

**Data Accessed**: Connected devices, network statistics, site health, bandwidth usage

## Security Notes

1. **Read-Only Access**: Dasharr only reads data and never modifies your services
2. **Credential Storage**: API keys and credentials are stored in the SQLite database or can be provided via environment variables
3. **Local Network**: Dasharr is designed to run on your local network and communicate with services on the same network
4. **No External Communication**: Dasharr does not send any data to external servers (except optional metrics push if configured)
5. **HTTPS Support**: Dasharr supports self-signed certificates by default (configurable via DASHARR_SELF_SIGNED environment variable)

## Rate Limiting

Dasharr implements reasonable polling intervals to avoid overwhelming your services:
- Real-time data: Updates every 5-10 seconds when dashboard is active
- Statistics: Updates every 30-60 seconds
- Library counts: Updates every 5 minutes
- Cached data: Most data is cached for 5 minutes to reduce API calls

## Privacy

- No telemetry or analytics are collected by default
- Optional metrics push feature can be enabled for external monitoring
- No data leaves your local network unless explicitly configured
- All communication is between Dasharr and your configured services only

## Network Isolation (Recommended)

For enhanced security, run Dasharr and your media services on a dedicated Docker network:
```yaml
networks:
  media_network:
    driver: bridge
    internal: true  # No external internet access
```

This ensures Dasharr can only communicate with explicitly connected services and cannot access the internet.
