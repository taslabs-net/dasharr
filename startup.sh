#!/bin/sh

# Dasharr Custom Startup Script
# Shows a cool ASCII banner

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")

echo ""
echo "==============================================="
echo "    ██████╗  █████╗ ███████╗██╗  ██╗ █████╗ ██████╗ ██████╗ "
echo "    ██╔══██╗██╔══██╗██╔════╝██║  ██║██╔══██╗██╔══██╗██╔══██╗"
echo "    ██║  ██║███████║███████╗███████║███████║██████╔╝██████╔╝"
echo "    ██║  ██║██╔══██║╚════██║██╔══██║██╔══██║██╔══██╗██╔══██╗"
echo "    ██████╔╝██║  ██║███████║██║  ██║██║  ██║██║  ██║██║  ██║"
echo "    ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝"
echo ""
echo "    Unified Dashboard v${VERSION}"
echo "==============================================="
echo ""

# Show configuration based on log level
if [ "$LOG_LEVEL" = "debug" ] || [ "$LOG_LEVEL" = "info" ]; then
    echo "   Configuration:"
    echo "   • Port: ${PORT:-3000}"
    echo "   • Host: ${HOST:-0.0.0.0}"
    echo "   • Log Level: ${LOG_LEVEL:-info}"
    echo "   • Trust Proxy: ${TRUST_PROXY:-false}"
    echo "   • Node Environment: ${NODE_ENV:-production}"
    echo "   • Refresh Interval: ${REFRESH_INTERVAL:-30} seconds"
    echo "   • WebSocket: ${ENABLE_WEBSOCKET:-enabled}"
    if [ -n "$CLOUDFLARE_WORKER_URL" ]; then
        echo "   • Worker URL: $CLOUDFLARE_WORKER_URL/api/v1/metrics"
    fi
    
    # Count configured services
    SERVICES_COUNT=0
    [ -n "$PLEX_URL" ] && SERVICES_COUNT=$((SERVICES_COUNT + 1))
    [ -n "$RADARR_URL" ] && SERVICES_COUNT=$((SERVICES_COUNT + 1))
    [ -n "$SONARR_URL" ] && SERVICES_COUNT=$((SERVICES_COUNT + 1))
    [ -n "$TAUTULLI_URL" ] && SERVICES_COUNT=$((SERVICES_COUNT + 1))
    [ -n "$SABNZBD_URL" ] && SERVICES_COUNT=$((SERVICES_COUNT + 1))
    [ -n "$PROWLARR_URL" ] && SERVICES_COUNT=$((SERVICES_COUNT + 1))
    [ -n "$QBITTORRENT_URL" ] && SERVICES_COUNT=$((SERVICES_COUNT + 1))
    [ -n "$OVERSEERR_URL" ] && SERVICES_COUNT=$((SERVICES_COUNT + 1))
    [ -n "$JELLYFIN_URL" ] && SERVICES_COUNT=$((SERVICES_COUNT + 1))
    [ -n "$UNIFI_URL_SITE_1" ] && SERVICES_COUNT=$((SERVICES_COUNT + 1))
    
    echo "   • Services Configured: $SERVICES_COUNT"
fi

if [ "$LOG_LEVEL" = "debug" ]; then
    echo ""
    echo "   Debug Mode - Detailed Configuration:"
    [ -n "$PLEX_URL" ] && echo "   • Plex: $PLEX_URL"
    [ -n "$RADARR_URL" ] && echo "   • Radarr: $RADARR_URL"
    [ -n "$SONARR_URL" ] && echo "   • Sonarr: $SONARR_URL"
    [ -n "$TAUTULLI_URL" ] && echo "   • Tautulli: $TAUTULLI_URL"
    [ -n "$SABNZBD_URL" ] && echo "   • SABnzbd: $SABNZBD_URL"
    [ -n "$PROWLARR_URL" ] && echo "   • Prowlarr: $PROWLARR_URL"
    [ -n "$QBITTORRENT_URL" ] && echo "   • qBittorrent: $QBITTORRENT_URL"
    [ -n "$OVERSEERR_URL" ] && echo "   • Overseerr: $OVERSEERR_URL"
    [ -n "$JELLYFIN_URL" ] && echo "   • Jellyfin: $JELLYFIN_URL"
    [ -n "$UNIFI_URL_SITE_1" ] && echo "   • UniFi Site 1: $UNIFI_URL_SITE_1"
    [ -n "$UNIFI_URL_SITE_2" ] && echo "   • UniFi Site 2: $UNIFI_URL_SITE_2"
    [ -n "$UNIFI_SITE_MANAGER" ] && echo "   • UniFi Site Manager: Enabled"
fi

echo ""

# Handle TLS verification setting silently
# DASHARR_SELF_SIGNED defaults to true (allowing self-signed certs)

# Start the Next.js server
# Suppress Next.js banner and Node warnings by filtering output
NODE_NO_WARNINGS=1 node server.js 2>&1 | grep -v "▲ Next.js"