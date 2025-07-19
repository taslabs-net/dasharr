# Changelog

## [0.8.9] - 2025-07-19

### Fixed
- **Critical JSON Configuration Migration Bug** - Resolved service configuration loss during upgrades
  - Fixed migration logic that was silently failing to import services from `service-config.json` to SQLite database
  - Enhanced error handling and logging with step-by-step migration progress indicators
  - Added proper verification that migrated services are successfully saved to database
  - Improved control flow to prevent silent failures that caused reconfiguration prompts
  - Migration now renames old JSON config to `.migrated` suffix after successful import
  - Users upgrading from older versions will now retain their service configurations

### Technical
- Enhanced migration logging with detailed success/failure indicators
- Improved database verification after migration completion
- Better error reporting for migration failures
- Strengthened migration control flow to ensure data persistence

## [0.8.8] - 2025-07-18

### Added
- **Bearer Token Authentication for Metrics Push** - Upgraded external metrics push authentication
  - Replaced custom `x-client-secret` header with RFC 6750 compliant `Authorization: Bearer` format
  - Better compatibility with API gateways, Postman, curl, and other standard tools
  - Maintains backward compatibility with existing configuration (no user changes needed)
  - Updated both main metrics pusher and test endpoint functionality
  - **Note:** This is for external metrics endpoints only - dashboard remains publicly accessible

### Enhanced
- **Multi-Instance Support Robustness** - Comprehensive improvements across all services
  - **Explicit Instance Configuration** - Removed all legacy fallback logic, enforcing explicit instance parameters
  - **Instance-Aware Navigation** - All widget links now use proper instance-aware routes
  - **Environment + UI Flexibility** - Users can mix environment variables and UI configuration seamlessly
  - **Auto-Discovery** - Environment instances automatically discovered and saved to database
  - **Incremental Numbering** - UI-added instances auto-increment from existing environment instances

### Fixed
- **Overseerr Integration** - Complete initialization and API handling overhaul
  - Fixed "not initialized" status detection to match actual Overseerr API response structure
  - Corrected API client `getSettings()` method (removed non-existent `main` wrapper)
  - Fixed API key authentication by removing quotes from environment variables
  - Proper error handling for 403 Forbidden and other API errors
- **Plex App Page** - Resolved TypeError crashes
  - Added comprehensive null checks for undefined data arrays
  - Prevents crashes when accessing `recentlyAdded`, `continueWatching`, or other collections
  - Improved error handling for missing or malformed API responses
- **Tautulli Image Proxy** - Fixed multi-instance image URL generation
  - All proxied image URLs now include proper instance parameters
  - Consistent image loading across all Tautulli instances
  - Fixed broken poster and thumbnail displays

### Removed
- **Legacy Service Routes** - Cleaned up deprecated navigation paths
  - Deleted all service-specific routes: `/plex`, `/sonarr`, `/radarr`, `/overseerr`, etc.
  - Only instance-aware routes remain: `/[instanceId]` for all service navigation
  - Prevents confusion and ensures consistent multi-instance behavior
- **Container Management Scripts** - Removed unnecessary infrastructure scripts
  - Deleted `monitor.sh`, `health-check.sh`, `backup.sh`, `logger.sh`
  - Removed related API endpoints and Docker container references
  - Focused dashboard on core media server monitoring purpose
- **System Metrics UI** - Removed admin metrics page exposure
  - Deleted `/admin/metrics` page and navigation links
  - Background metrics collection and push functionality preserved
  - Cleaner admin interface focused on service configuration

### Technical
- **Multi-Instance Wrapper** - Enhanced API routing with strict validation
  - Enforces explicit instance parameters in all API calls
  - Improved error messages for missing or invalid instance configurations
  - Better service type extraction and configuration handling
- **Database Integration** - Improved SQLite configuration management
  - Environment variables automatically migrated to database on startup
  - Persistent storage for both environment and UI-configured instances
  - Enhanced instance discovery and validation logic
- **Error Handling** - Comprehensive improvements across all services
  - Better null checking and data validation
  - Improved API response structure handling
  - More descriptive error messages for debugging

### Breaking Changes
- **Metrics Push Authentication** - External metrics push now uses `Authorization: Bearer <token>` instead of `x-client-secret`
- **Service Navigation** - All service routes now require explicit instance parameters
- **Legacy Route Removal** - Direct service routes (e.g., `/plex`) no longer available

**Major Release:** Complete multi-instance foundation with comprehensive bug fixes across all integrated services.

## [0.8.7] - 2025-07-17

### Changed
- **Complete Authentication Removal** - All authentication has been removed from Dasharr
  - Removed all auth-related API routes (`/api/admin/auth`, `/api/admin/login`, `/api/admin/logout`)
  - Removed authentication middleware and session management
  - Removed login page and authentication UI components
  - Removed authentication settings from admin panel
  - All pages and API endpoints are now publicly accessible
  - Removed `bcryptjs` and `jose` dependencies

### Refactored
- **Major File Organization** - Complete restructuring for better maintainability
  - API Routes reorganized:
    - Service endpoints moved to `/api/services/{service}/*`
    - System endpoints moved to `/api/system/*` (metrics, search, debug, startup)
    - Renamed `/api/app/*` to `/api/public/*` for clarity
  - Components reorganized:
    - Created `/components/common/` for shared UI components
    - Created `/components/config/` for configuration components
    - Moved UniFi modals to `/components/services/unifi/`
  - Documentation structure improved:
    - Platform-specific READMEs moved to `/docs/deployment/`
    - Updated all documentation to reflect new structure

### Fixed
- Fixed all import paths after file reorganization
- Updated all API calls to use new endpoint structure
- Removed unused configuration files and test directories

### Security Notice
- **Important**: The entire application is now publicly accessible. If you need authentication, consider:
  - Using a reverse proxy with basic authentication
  - Restricting network access via firewall rules
  - Running on a VPN-only network
  - Using Docker network isolation

### Technical
- Removed authentication-related database methods
- Cleaned up all `.DS_Store` files and temporary files
- Removed old database files from `data/` directory
- All build tests pass with the new structure

## [0.8.1] - 2025-07-16

### Added
  - SESSION_SECRET environment variable support (with secure fallback)
- **Collapsible Advanced Settings** - Better UI organization in admin panel
  - Advanced Settings section now collapsible with chevron toggle
  - Metrics push configuration moved under Advanced Settings
  - Cleaner interface for basic vs advanced configuration options

### Changed
- **Authentication State Management** - Improved default behavior
  - "Enable Auth" checkbox now unchecked by default on fresh installs
  - Authentication section moved above metrics push configuration
  - Fixed confusing UX where auth appeared enabled when database credentials existed
- **Startup Logging** - Cleaner console output
  - Removed redundant Node.js startup banner (kept ASCII art banner)
  - "Initializing metrics pusher..." only shows when push metrics are actually enabled
  - More focused startup information without duplicate messages
- **Environment Configuration** - Simplified `.env.example`
  - Removed TZ (timezone) configuration - now UI-only with auto-detection
  - Fixed DASHARR_SELF_SIGNED default documentation (correctly shows `true`)
  - Confirmed all documented environment variables are actively used

### Fixed
  - Proper separation of public vs protected routes
- **Dynamic Version Display** - Version now pulled from package.json
  - About page dynamically shows current version
  - No more manual version updates needed in multiple places

### Technical
- Added `jose` library for JWT token handling

- Better error handling for session validation
- Comprehensive `.dockerignore` updates to prevent stale build artifacts

## [0.8.0] - 2025-07-16

### Added
- **External Links on Service Pages** - Direct links to service applications
  - New `ServicePageHeader` component providing consistent headers across all service pages
  - External link arrow icon next to service titles that navigates to the configured service URL
  - Multi-instance support maintained - each instance links to its specific URL
  - Implemented on all service pages: Radarr, Sonarr, Plex, Tautulli, SABnzbd, qBittorrent, Prowlarr, Jellyfin, Jellyseerr, Overseerr, and UniFi

### Changed
- **UI-Only Configuration** - Simplified configuration approach
  - Metrics push configuration moved entirely to UI (removed from `.env.example`)

### Fixed
- Fixed routing issue where first instances used numbered URLs (e.g., `/plex1` instead of `/plex`)
- Fixed subtitle display showing literal template strings like `{error || 'Unknown error occurred'}`
- Fixed qBittorrent page subtitle to display proper version information

## [0.7.0] - 2025-07-16

### Added
- **SQLite Database Storage** - Complete migration from JSON file storage to SQLite database
  - All configuration and settings now stored in `/app/config/dasharr.db`
  - Historical metrics data storage for displaying trends and charts
  - Automatic migration from `service-config.json` to database (non-breaking change)
  - Database performance optimizations with WAL mode and connection pooling
- **Historical Metrics Visualization** - Individual service pages now display historical data
  - Six metric charts added to Sonarr page (Series, Episodes, Queue, Missing, Monitored, Unmonitored)
  - Reusable `MetricChart` component for easy metrics visualization across all services
  - 24-hour historical view by default with customizable time ranges
- **Admin Panel Authentication** - Basic authentication for admin routes
  - Optional username/password protection for `/admin` and `/api/admin/*` endpoints
  - Environment variable configuration (`DASHARR_ADMIN_USERNAME`, `DASHARR_ADMIN_PASSWORD`)
  - Web UI for managing authentication credentials in admin panel
  - Database storage for credentials with bcrypt password hashing
  - Backward compatible - authentication disabled by default
  - Edge Runtime compatible middleware implementation
  - Clean, focused authentication settings interface without extensive documentation
- **Comprehensive Logging System**
  - Database operation logging for all CRUD operations
  - Metrics collection cycle logging with detailed timing information
  - Service instance loading and migration status logging
  - Improved startup logging showing database status, loaded services, and configuration
- **Metrics Collection Scheduler**
  - Background job running every 60 seconds to collect metrics from all services
  - Automatic metrics storage with configurable retention periods
  - Collection summary logs showing success/failure rates and timing

### Changed
- All configuration now uses SQLite instead of JSON files for improved performance
- Configuration system rewritten to use database-backed storage
- All UniFi API routes updated to use new configuration system
- Service startup now shows detailed information about loaded services and database status

### Fixed
- Fixed TypeScript compilation errors with database query type assertions
- Fixed module resolution issues with client/server component boundaries
- Fixed spread operator errors with database statistics objects
- Fixed type conversion issues in UniFi routes with mixed string/number types


### Technical
- Added `better-sqlite3` dependency for SQLite support
- Added `bcryptjs` dependency for secure password hashing
- Database singleton pattern implementation for connection management
- Automatic schema initialization and migration support
- Write-Ahead Logging (WAL) enabled for better concurrent access

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
