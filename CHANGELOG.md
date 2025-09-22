# Changelog

## [Unreleased]

### Added
- **CLAUDE.md** - Comprehensive guidance file for Claude Code instances
  - Essential commands and development workflows
  - Architecture documentation and key file locations
  - Service integration patterns and debugging tips
  - Configuration management and authentication details

## [0.8.18] - 2025-08-28

### Added
- **Authentication System** - Complete admin authentication with session management
  - Admin user creation and management
  - Login page with session-based authentication
  - Logout functionality with session cleanup
  - Protected admin routes with auth middleware
  - Frontend AuthGuard component for protected pages
  - Support for proxy/reverse proxy setups via `DASHARR_TRUSTED_ORIGINS`
  
### Changed
- **Login Page UI** - Updated branding and visuals
  - Replaced lock icon with Dasharr logo (PNG icon)
  - Logo links back to home page
  - Improved visual consistency with brand

### Updated
- **Dependencies** - Updated all packages to latest versions
  - Next.js: 15.4.1 → 15.5.2
  - React/React-DOM: 19.1.0 → 19.1.1
  - TypeScript: 5.8.3 → 5.9.2
  - Better Auth: 1.3.4 → 1.3.7
  - Lucide Icons: 0.525.0 → 0.542.0
  - ESLint: 9.31.0 → 9.34.0
  - TailwindCSS: 4.1.11 → 4.1.12
  - And all other dependencies to their latest versions

### Security
- Admin panel now requires authentication
- All admin API routes protected with auth middleware
- Sessions properly managed and secured
- Support for custom trusted origins in proxy environments

## [0.8.17] - 2025-08-28

### Fixed
- **Critical API Route Async/Await Issues** - Fixed multiple endpoints returning empty promises instead of data
  - Fixed `/api/public/instances` route not awaiting `getServiceInstances()` 
  - Fixed `/api/admin/instances/[serviceType]` route not awaiting `getServiceInstancesByType()`
  - Fixed `/api/admin/instances/[serviceType]/[instanceId]` route not awaiting database operations
  - Services now properly appear on dashboard after configuration
  - Admin panel now correctly shows configured services

### Changed
- **Encryption Key Management** - Improved security by using environment variables
  - Encryption key now provided via `DASHARR_ENCRYPTION_KEY` environment variable
  - Removed file-based encryption key storage (`.encryption.key`)
  - Supports fallback to `DASHARR_SECRET` for key derivation
  - Better aligns with Docker secret management best practices

### Security
- Encryption keys are no longer stored on disk
- All sensitive data remains encrypted using AES-256
- Environment-based key management for improved security

## [0.8.16] - 2025-08-02

### Added
- **Encryption for Sensitive Data** - API keys and passwords are now encrypted in the database
  - Automatic encryption of API keys and passwords using better-auth's symmetric encryption
  - Secure key generation and storage in `/app/config/.encryption.key`
  - Automatic migration to encrypt existing plaintext data
  - Transparent encryption/decryption - no changes needed to existing workflows
  - Legacy plaintext data handled gracefully during transition
  - Backup/restore operations maintain data encryption

### Security
- All sensitive credentials (API keys, passwords) are now encrypted at rest
- Encryption key is stored with restricted file permissions
- Automatic migration encrypts existing plaintext credentials
- No plaintext credentials are logged or exposed

### Technical
- Implemented symmetric encryption using better-auth's crypto module
- Database migration system updated to version 2 for encryption
- All database operations converted to async to support encryption
- Added initialization system to ensure database is ready before use

## [0.8.15] - 2025-07-31

### Added
- **Optional Admin Authentication** - Secure admin panel access with single-user authentication
  - Authentication is disabled by default
  - Single admin account system (no multi-user support by design)
  - Session-based authentication using better-auth library with SQLite backend
  - Password change functionality for logged-in administrators
  - Automatic security lockout prevention - auth disables if no admin exists
  - Easy setup with default secret in .env.example
  - Integrated authentication toggle in admin settings page
  - Admin account creation workflow built into settings interface
  - Middleware-based route protection for /admin paths (except /admin/login)
  - HTTP-only session cookies for enhanced security
- **Built-in Health Check** - Container health monitoring without external scripts
  - Added `/api/health` endpoint for Docker health checks
  - Dockerfile includes HEALTHCHECK instruction using Alpine's wget
  - No external scripts required - health check is built into the image
  - Compatible with docker-compose health check overrides

### Technical
- Implemented better-auth library for authentication management
- SQLite database for authentication data persistence
- Environment variable configuration with DASHARR_SECRET
- Automatic database schema initialization on first use
- Security measures to prevent lockout scenarios
- Clean separation of auth state from service configuration

### Security
- Authentication is opt-in only - no default credentials
- Secure session management with httpOnly cookies
- Automatic auth disable if no admin account exists
- Clear warnings about replacing default secret

### Fixed
- Container health check no longer requires external script file
- Health monitoring works out-of-the-box with Docker and docker-compose

## [0.8.14] - 2025-07-25

### Fixed
- **Critical JSON Configuration Migration Bugs** - Resolved multiple critical issues in JSON to database migration
  - **Instance ID Generation Bug**: Fixed malformed URLs like `/jellyseerr11` instead of `/jellyseerr1`
    - Proper regex parsing for service keys that already contain numbers
    - Prevents double-digit instance IDs when migrating existing configurations
  - **Database Persistence Failure**: Fixed services appearing "Configured" but not actually saved to database
    - Added immediate verification after each database save operation
    - Ensures migrated services are visible in admin panel after migration
    - Prevents false positive migration success messages
  - **Unsafe Config File Handling**: Changed from deletion to safe backup during migration
    - JSON config files now renamed to `.safe-to-delete.json` instead of being deleted
    - User-friendly messaging about file safety and recovery options
    - Allows users to recover configurations if migration verification fails
  - **Enhanced Error Detection**: Comprehensive logging and explicit failure detection
    - Better migration debugging with detailed progress indicators
    - Improved error reporting for troubleshooting migration issues
    - Step-by-step verification logging throughout migration process

### Technical
- Enhanced migration logic with proper service type extraction
- Improved database transaction handling with rollback support
- Better error handling and recovery mechanisms for affected users
- Comprehensive verification system to ensure migration success

### Breaking Changes
- None - All changes are backward compatible and improve existing functionality

## [0.8.13] - 2025-07-23

### Fixed
- **Critical Database Bug** - Fixed production database initialization failure that caused services to disappear after migration
  - Removed flawed build-time detection logic that caused in-memory database fallback in production environments
  - Added comprehensive database file validation and error handling
  - Implemented recovery mechanism for users affected by the migration bug
  - Enhanced logging and directory writability checks

### Added
- **Environment Variable Sync** - Automatic synchronization of .env configuration to database on startup
  - Services configured in .env files are now automatically imported and updated in the database
  - Support for configuration via .env file, UI, or mix of both approaches
  - Real-time sync ensures .env changes are reflected immediately
- **Bazarr Admin Integration** - Complete admin UI integration for Bazarr service configuration
  - Added Bazarr admin configuration page with setup instructions
  - Integrated Bazarr into admin navigation and service discovery
  - Fixed missing admin UI components that prevented Bazarr from appearing in left navigation

### Improved
- **Configuration System** - Enhanced multi-source configuration management
  - Unified database-only storage with .env and UI input sources
  - Simplified configuration flow without complex migration logic
  - Better error handling and validation for service configurations
- **Development Experience** - Fixed local development CONFIG_DIR path resolution
  - Added CONFIG_DIR environment variable support for development
  - Improved error messages and debugging information

### Technical
- Enhanced syncEnvToDatabase function with comprehensive service support
- Added proper TypeScript error handling and type safety improvements
- Fixed admin UI content management system integration for all services
- Streamlined database initialization with better error recovery

## [0.8.12] - 2025-07-23

### Added
- **Bazarr Integration** - Complete integration of Bazarr subtitle management service
  - Comprehensive Bazarr API client with 30+ endpoints (system, health, statistics, providers, episodes, movies, tasks, webhooks)
  - Bazarr overview API endpoint aggregating data from 13 different Bazarr API endpoints
  - Dashboard widget displaying subtitle completion rates, active providers, and health status
  - Full admin interface integration with multi-instance support
  - Real-time monitoring of subtitle operations and provider status

### Improved
- **Architecture Cleanup** - Removed unnecessary legacy configuration system complexity
  - Eliminated redundant single-instance config format and migration logic
  - Simplified migration to only handle JSON-to-SQLite storage backend changes
  - Cleaner codebase with single multi-instance configuration approach
  - Reduced code complexity and improved maintainability

### Technical
- Added Bazarr to service type definitions and admin interface
- Implemented comprehensive error handling and logging for Bazarr operations
- Enhanced service discovery and configuration validation
- Streamlined configuration management with unified multi-instance approach

## [0.8.11] - 2025-07-23

### Fixed
- **Critical Migration Startup Error** - Resolved "Migration failed: No services migrated" error preventing application startup
  - Enhanced migration logic in `loadSavedConfig` function with detailed validation and error reporting
  - Added comprehensive logging to identify why services were being skipped during JSON to database migration
  - Improved error handling with structured logging and clear success/failure indicators (✅/❌)
  - Fixed database save operation error capture and reporting
  - Migration now provides detailed feedback on service structure, validation results, and processing status

### Technical
- Enhanced migration debugging capabilities for better issue diagnosis
- Improved validation feedback for service configurations
- Added structured JSON logging for complex migration objects
- Better exception handling and error message clarity
- More robust migration logic to handle edge cases and validation failures

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