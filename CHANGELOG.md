# Changelog

## [0.6.3] - 2025-07-14

### Added
- Hidden kiosk mode for full-screen dashboard displays
  - Activated by double-clicking anywhere on the dashboard background
  - Deactivated by double-clicking again or pressing ESC key
  - Hides all navigation/header elements for clean display walls
  - Subtle visual indicator (small dot) when kiosk mode is active
  - Smart detection to only trigger on background areas, not interactive elements

### Fixed
- Removed "Dasharr" title from dashboard page to eliminate flash when toggling kiosk mode
- Title now only appears in header/navigation, not on the actual dashboard

## [0.6.2] - 2025-07-14

### Added
- Full overview components for all remaining services:
  - **Jellyseerr**: Request statistics, pending/approved/declined requests, recently requested media with TMDB posters
  - **Jellyfin**: Library statistics, active sessions, recently added items with custom image URLs
  - **SABnzbd**: Download queue, bandwidth monitoring, download history, daily/weekly/monthly statistics
  - **Tautulli**: Active streams, stream types (direct/transcode), library statistics, recent activity, top media
  - **Overseerr**: Request management, issues tracking, recently added media, user request tracking
  - **Prowlarr**: Indexer health monitoring, search/grab statistics, torrent vs usenet breakdown, filterable indexer list
  - **Plex**: Active streams with bandwidth, library overview, continue watching, recently added, user management
- "Issues?" link on About page pointing to GitHub issues tracker
- Clickable service titles on all app pages that link directly to the service's web interface (with external link icon)

### Fixed
- Fixed 404 error on Jellyfin pages by correcting API endpoint from `/api/services/jellyfin/instances/` to `/api/admin/instances/`
- Fixed multi-instance service routing - widgets now correctly route to their respective instance pages
- Fixed custom display names not showing on instance pages - now displays user-defined names instead of service type

### Changed
- All services now have full overview dashboards instead of placeholder messages
- Service widgets now properly display API data and route to correct instance pages

## [0.6.1] - 2025-07-14

### Fixed
- Fixed critical bug where all service instances appeared as "Instance Disabled" after upgrading to 0.6.0
- Fixed API response handling in instance pages to properly unwrap instance data

## [0.6.0] - 2025-07-14

### Added
- Multi-instance support for all services (except UniFi which already has multi-site)
- Custom display names for service instances
- Add multiple instances of the same service type with "+" button
- Automatic migration from single-instance to multi-instance configuration
- Instance-aware logging with [service:instance] prefixes throughout all API routes
- Full UI components for Radarr and qBittorrent multi-instance support
- Dynamic routing for instance-specific pages (/[instanceId]/page.tsx)
- About page accessible from admin section with version and GitHub information
- Multi-instance environment variable support in .env.example
- Last Saved timestamps for each service instance configuration

### Changed
- Service cards now display custom instance names
- Admin UI redesigned to support managing multiple instances
- Configuration structure updated to support multiple instances per service type
- Dashboard now shows all configured instances with their custom names
- All API routes updated to use withInstanceSupport wrapper
- Logging system enhanced with instance context for better debugging
- GitHub icon in admin section replaced with "About" link
- Environment variables documentation updated for multi-instance configuration

**Major Release:** Complete multi-instance support with enhanced configuration management and improved user experience.

## [0.5.52] - 2025-07-13

### Fixed
- Fixed loading flash during automatic data refreshes
- Removed loading state from background refresh intervals to improve user experience

## [0.5.51] - 2025-07-13

### Fixed
- Fixed proxy detection when host headers already contain port numbers
- Improved handling of x-forwarded-host headers that include ports

## [0.5.50] - 2025-07-13

### Added
- Masked sensitive fields (API keys and tokens) in service configuration UI

### Changed
- Updated proxy detection to exclude non-standard ports from recommended URL when HTTPS is detected

### Fixed
- Fixed proxy auto-detect incorrectly adding `:3000` to HTTPS domains when behind reverse proxies like Zoraxy
- Fixed environment variable label from "(NODE_TLS_REJECT_UNAUTHORIZED)" to "(DASHARR_SELF_SIGNED)"

## [0.5.48] - 2025-07-13

### Added
- Persistent "Last Saved" timestamps for all service configurations
- "Last Saved" timestamp persists across browser sessions and container restarts

### Changed
- Updated all npm packages to latest versions
- Updated to Node.js 24 and Alpine Linux 3.22
- Updated Next.js to version 15.3.5

### Fixed
- Fixed 500 error on API routes by updating service interfaces
- Fixed config file paths for development vs production
- Fixed Docker container architecture mismatch (ARM64 vs AMD64)

### Removed
- Removed timezone environment variable (TZ) - made it UI-only

## [0.5.45] - 2025-07-09

### Changed
- Updated deployment configuration

## [0.5.44] - 2025-07-09
