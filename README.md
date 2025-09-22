# Dasharr Application

This is the main Dasharr application source code - a unified media dashboard for monitoring your media server ecosystem.


## Metrics Collection

### Supported Services
The application now collects comprehensive metrics from:

#### Sonarr
- Series statistics (total, monitored, continuing, ended)
- Episode counts (total, downloaded, missing, unaired, today)
- Quality breakdowns (4K, 1080p, 720p, SD)
- Queue information and download rates
- Indexer and download client health
- Storage usage and average file sizes

#### Radarr
- Movie statistics (total, monitored, downloaded, missing)
- Quality breakdowns (4K, 1080p, 720p, SD)
- Queue status and download speeds
- Indexer and download client health
- Storage metrics

#### Prowlarr
- Indexer statistics (total, enabled, failing, disabled)
- Application sync status
- Grab and query statistics with success rates
- Average response times
- Health monitoring

## Configuration

### Environment Variables

#### Core Settings
```bash
# Application
PORT=3000                          # Web interface port
TZ=America/New_York               # Timezone
APP_URL=http://localhost:3000     # Full URL where Dasharr is accessible
TRUST_PROXY=false                 # Set true if behind reverse proxy
DASHARR_SELF_SIGNED=true         # Allow self-signed certificates
LOG_LEVEL=info                    # Options: error, warn, info, debug, trace

# Metrics Push Configuration (Optional)
METRICS_ENDPOINT_URL=https://your-analytics-endpoint.com
DASHBOARD_SECRET=your-secret-token-here
CONTAINER_ID=dasharr-main         # Unique identifier for this instance
METRICS_PUSH_INTERVAL=300000      # Push interval in milliseconds (5 min default)
ENABLE_METRICS_PUSH=false         # Enable/disable metrics push
```

#### Service Configuration
Services can be configured via environment variables or the web UI at `/admin`:

```bash
# Sonarr
SONARR_URL=http://sonarr:8989
SONARR_API_KEY=your-api-key

# Radarr
RADARR_URL=http://radarr:7878
RADARR_API_KEY=your-api-key

# Prowlarr
PROWLARR_URL=http://prowlarr:9696
PROWLARR_API_KEY=your-api-key

# ... other services
```

### Admin Dashboard Settings

Access `/admin` to configure:
- **Authentication**: Enable/disable admin panel protection with custom credentials
- **Service Connections**: Add/edit service URLs and API keys
- **Global Polling**: How often to collect metrics from services (15s - 1hr)
- **Global Push**: How often to push metrics to Cloudflare (1min - 1hr)
- **Proxy Settings**: Auto-detect and configure reverse proxy settings
- **Logging**: Adjust log levels and timezone

## Docker Deployment

### Quick Start
```bash
docker compose up -d
```

### Development Build
```bash
docker build --platform linux/amd64 -t dasharr:dev .
```

### Production Deployment (Dockge)
```yaml
services:
  dasharr:
    image: dasharr:latest
    container_name: dasharr
    ports:
      - 3000:3000
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/New_York
      - CLOUDFLARE_WORKER_URL=https://your-worker.workers.dev
      - DASHBOARD_SECRET=your-secret-here
      # Optional: Force authentication (overrides UI settings)
      # - DASHARR_ADMIN_USERNAME=admin
      # - DASHARR_ADMIN_PASSWORD=secure-password
    volumes:
      - ./config:/app/config
      - ./data:/data  # SQLite database storage
    restart: unless-stopped
```

## Metrics Push Architecture

### How It Works
1. **Collection**: Services are polled based on the Global Polling interval
2. **Storage**: Metrics are temporarily stored in memory
3. **Transformation**: Data is formatted for the Cloudflare Worker API
4. **Transmission**: HTTP POST to `{WORKER_URL}/api/v1/metrics`
5. **Retry Logic**: Automatic retry on failure with exponential backoff

### API Request Format
**Headers:**
```
Content-Type: application/json
x-client-secret: your-32-character-secret
```

**Body:**
```json
{
  "container_id": "dasharr-main-sonarr",
  "service_type": "sonarr",
  "metrics": {
    "series_total": 150,
    "series_monitored": 140,
    "episodes_total": 3500,
    "episodes_downloaded": 3200,
    "episodes_missing": 300,
    "queue_count": 5,
    "health_issues": 0
  }
}
```

## Analytics & Dashboards

### Comprehensive Metrics Coverage
With **50+ metrics** collected across all services, Dasharr provides enterprise-level monitoring data:

#### **Sonarr (19 metrics)**
- **Series**: total, monitored, unmonitored, continuing, ended
- **Episodes**: total, downloaded, missing, unaired, today, 4K, 1080p, 720p, SD  
- **Storage**: total_size_bytes, average_episode_size_bytes
- **Queue**: count, size_bytes, download_rate_bytes_per_sec
- **System**: indexers (total/enabled/failing), download_clients (total/active), health_issues, api_response_time_ms

#### **Radarr (18 metrics)**
- **Movies**: total, monitored, unmonitored, downloaded, missing, 4K, 1080p, 720p, SD
- **Storage**: total_size_bytes, average_movie_size_bytes  
- **Queue**: count, size_bytes, download_rate_bytes_per_sec
- **System**: indexers (total/enabled/failing), download_clients (total/active), health_issues, api_response_time_ms

#### **Prowlarr (13 metrics)**
- **Indexers**: total, enabled, disabled, failing, temporary_disabled
- **Apps**: total, synced
- **Activity**: grabs (total/successful/failed), queries (total/successful/failed)
- **Performance**: avg_response_time_ms, health_issues, api_response_time_ms

### Dashboard Possibilities with Cloudflare Analytics Engine

#### **Media Library Growth**
- Series/Movies added over time
- Quality distribution trends (4K adoption, HD vs SD)
- Storage usage growth and projections
- Episode/Movie availability ratios

#### **Download Performance**
- Queue depth over time
- Download speeds and completion rates
- Failed vs successful downloads
- Peak usage hours and patterns

#### **System Health Monitoring**
- Indexer reliability scores and uptime
- API response times across services
- Health issue frequency and resolution
- Download client performance comparisons

#### **Quality Insights**
- 4K vs HD vs SD breakdown over time
- Average file sizes by quality
- Storage efficiency metrics
- Quality upgrade patterns

#### **Operational Analytics**
- Service availability and uptime
- Error rates and failure patterns
- Performance bottlenecks identification
- Capacity planning metrics

### Advanced Visualizations

#### **Real-time Dashboards**
- Live queue status across all services
- Current download rates and ETA
- Health status indicators
- Storage utilization gauges

#### **Historical Trends**
- Monthly/yearly library growth
- Download success rates over time
- Quality migration patterns
- Performance degradation alerts

#### **Comparative Analysis**
- Service efficiency comparisons
- Indexer performance rankings
- Peak vs off-peak usage patterns
- Cost-per-GB analysis

#### **Alerting & Notifications**
- Health issue alerts
- Storage capacity warnings
- Performance degradation notifications
- Unusual activity detection

### Enterprise-Level Capabilities
With comprehensive metrics + Cloudflare Analytics Engine:
- **Predict storage needs** based on growth patterns
- **Identify optimal download times** based on performance data
- **Track content consumption patterns**
- **Monitor service efficiency** and optimize configurations
- **Create SLA dashboards** for your media infrastructure

## Testing

### Test Metrics Push
Use the test endpoint to verify connectivity:
```bash
curl -X POST http://localhost:3000/api/admin/metrics-push/test \
  -H "Content-Type: application/json" \
  -d '{
    "workerUrl": "https://test.dasharr.io",
    "dashboardSecret": "test-secret",
    "containerId": "test-container",
    "useQueue": false
  }'
```

### Manual Metrics Push
```bash
curl -X POST https://your-worker.workers.dev/api/v1/metrics \
  -H "Content-Type: application/json" \
  -H "x-client-secret: your-secret" \
  -d '{
    "container_id": "manual-test",
    "service_type": "sonarr",
    "metrics": { ... }
  }'
```

## Project Structure

```
dasharr/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   │   ├── admin/         # Admin endpoints
│   │   │   └── metrics/       # Metrics endpoints
│   │   └── admin/             # Admin UI pages
│   ├── components/            # React components
│   └── lib/
│       ├── api/               # Service API clients
│       ├── config/            # Configuration management
│       └── metrics/           # Metrics collection & push
│           ├── collector.ts   # Main metrics collector
│           ├── pusher.ts      # HTTP POST pusher
│           └── *-collector.ts # Service-specific collectors
├── config/                    # Runtime configuration storage
├── public/                    # Static assets
├── server.js                  # Custom Next.js server
└── Dockerfile                # Container definition
```

## Monitoring & Debugging

### Check Container Logs
```bash
docker logs dasharr --tail 50 -f
```

### Debug Environment
```bash
LOG_LEVEL=debug docker compose up
```

### Common Issues

1. **"Failed to store metrics" with D1 errors from Worker**
   - The Cloudflare Worker is receiving data but has database schema issues
   - This is a Worker-side issue that needs to be fixed in the D1 database schema
   - Previous "Database not available" errors have been resolved

2. **Metrics not pushing**
   - Verify `DASHBOARD_SECRET` is set
   - Check `CLOUDFLARE_WORKER_URL` is correct
   - Ensure at least one service is configured

3. **Connection refused to services**
   - Use container names, not localhost (e.g., `http://sonarr:8989`)
   - Verify services are on the same Docker network
   - Check API keys are correct

## Development

### Local Development
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Environment Files
- `.env.example` - Template with all available options
- `.env` - Your local configuration (git ignored)
- `config/` - Runtime configuration storage

## Recent Changes Log

### January 2025
- **Authentication Fix**: Moved secret from request body to `x-client-secret` header for Cloudflare compatibility
- **Queue Support**: Added Queue checkbox for Cloudflare Queues (/api/v1/metrics/queue) vs direct processing
- **UI Improvements**: Hidden push configuration fields until Enable Push is checked
- **Purple Branding**: Fixed toggle switches to use consistent dasharr-purple color scheme
- **Comprehensive Metrics**: Added enhanced metrics collection for Sonarr, Radarr, and Prowlarr (50+ metrics)
- **HTTP POST Architecture**: Replaced WebSocket with HTTP POST metrics push for better reliability
- **Admin Dashboard**: Added Enable Push, Push Target, Secret, Queue, and Push Frequency controls
- **Test Integration**: Added Test Push button with real-time feedback
- **Environment Variables**: Updated for clarity and added Queue support
- **Error Handling**: Enhanced retry logic and proper authentication
- **Container Deployment**: Successfully deployed with :dev tag on dockge server (10.11.11.2)

## Related Documentation

- Main project docs: `/project-support-docs/`
- Deployment scripts: `/project-support-docs/scripts/`
- API documentation: `/Users/tim/Coding/apidocs/`

## License

Private project - not for public distribution