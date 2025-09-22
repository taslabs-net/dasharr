import { logger } from '../logger';
import { metricsCollector } from './collector';
import axios from 'axios';

// Define metric types based on what the collectors return
interface SonarrMetrics {
  seriesTotal?: number;
  seriesMonitored?: number;
  seriesUnmonitored?: number;
  seriesContinuing?: number;
  seriesEnded?: number;
  episodesTotal?: number;
  episodesDownloaded?: number;
  episodesMissing?: number;
  episodesUnaired?: number;
  episodesToday?: number;
  episodes4K?: number;
  episodes1080p?: number;
  episodes720p?: number;
  episodesSD?: number;
  totalSizeBytes?: number;
  averageEpisodeSizeBytes?: number;
  queueCount?: number;
  queueSizeBytes?: number;
  downloadRateBytesPerSec?: number;
  indexersTotal?: number;
  indexersEnabled?: number;
  indexersFailing?: number;
  downloadClientsTotal?: number;
  downloadClientsActive?: number;
  healthIssues?: number;
  apiResponseTimeMs?: number;
}

interface RadarrMetrics {
  moviesTotal?: number;
  moviesMonitored?: number;
  moviesUnmonitored?: number;
  moviesDownloaded?: number;
  moviesMissing?: number;
  movies4K?: number;
  movies1080p?: number;
  movies720p?: number;
  moviesSD?: number;
  totalSizeBytes?: number;
  averageMovieSizeBytes?: number;
  queueCount?: number;
  queueSizeBytes?: number;
  downloadRateBytesPerSec?: number;
  indexersTotal?: number;
  indexersEnabled?: number;
  indexersFailing?: number;
  downloadClientsTotal?: number;
  downloadClientsActive?: number;
  healthIssues?: number;
  apiResponseTimeMs?: number;
}

interface ProwlarrMetrics {
  indexersTotal?: number;
  indexersEnabled?: number;
  indexersDisabled?: number;
  indexersFailing?: number;
  indexersTemporaryDisabled?: number;
  appsTotal?: number;
  appsSynced?: number;
  grabsTotal?: number;
  grabsSuccessful?: number;
  grabsFailed?: number;
  queriesTotal?: number;
  queriesSuccessful?: number;
  queriesFailed?: number;
  avgResponseTimeMs?: number;
  healthIssues?: number;
  apiResponseTimeMs?: number;
}

export interface MetricsPushConfig {
  workerUrl: string;
  dashboardSecret: string;
  containerId: string;
  pushInterval: number; // milliseconds
  useQueue?: boolean;
}

export class MetricsPusher {
  private config: MetricsPushConfig;
  private pushInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(config: MetricsPushConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.info('Metrics pusher already running');
      return;
    }

    logger.info(`Starting metrics pusher to ${this.config.workerUrl}`);
    this.isRunning = true;

    // Send initial metrics
    await this.pushMetrics();

    // Start periodic pushing
    this.pushInterval = setInterval(async () => {
      await this.pushMetrics();
    }, this.config.pushInterval);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping metrics pusher');
    this.isRunning = false;

    if (this.pushInterval) {
      clearInterval(this.pushInterval);
      this.pushInterval = null;
    }
  }

  private async pushMetrics(): Promise<void> {
    try {
      const services = await metricsCollector.getConfiguredServices();
      
      for (const service of services) {
        await this.pushServiceMetrics(service);
      }
    } catch (error) {
      logger.error('Failed to push metrics:', error);
    }
  }

  private async pushServiceMetrics(serviceType: string): Promise<void> {
    try {
      // Collect all metrics from all instances
      const allMetrics = await metricsCollector.collectAll();
      
      if (!allMetrics || Object.keys(allMetrics).filter(k => k !== 'timestamp' && k !== 'collection_duration_ms').length === 0) {
        logger.warn('No metrics collected from any instances');
        return;
      }

      // Transform metrics to the format expected by the API
      const payload = {
        container_id: `${this.config.containerId}-multi-instance`,
        service_type: 'multi-instance',
        metrics: allMetrics
      };

      const endpoint = this.config.useQueue ? '/api/v1/metrics/queue' : '/api/v1/metrics';
      const url = `${this.config.workerUrl}${endpoint}`;
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.dashboardSecret}`
        },
        timeout: 10000 // 10 second timeout
      });

      if (response.status === 200) {
        const queueMessage = this.config.useQueue ? ' to queue' : '';
        logger.info(`Successfully pushed ${serviceType} metrics${queueMessage}`);
      } else {
        logger.warn(`Unexpected response pushing ${serviceType} metrics: ${response.status}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Failed to push ${serviceType} metrics: ${error.message}`);
        if (error.response) {
          logger.error(`Response: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        }
      } else {
        logger.error(`Failed to push ${serviceType} metrics:`, error);
      }
    }
  }

  private transformMetrics(serviceType: string, metrics: unknown): unknown {
    switch (serviceType) {
      case 'sonarr':
        return this.transformSonarrMetrics(metrics as SonarrMetrics);
      case 'radarr':
        return this.transformRadarrMetrics(metrics as RadarrMetrics);
      case 'prowlarr':
        return this.transformProwlarrMetrics(metrics as ProwlarrMetrics);
      default:
        return metrics;
    }
  }

  private transformSonarrMetrics(metrics: SonarrMetrics): Record<string, number> {
    return {
      series_total: metrics.seriesTotal || 0,
      series_monitored: metrics.seriesMonitored || 0,
      series_unmonitored: metrics.seriesUnmonitored || 0,
      series_continuing: metrics.seriesContinuing || 0,
      series_ended: metrics.seriesEnded || 0,
      episodes_total: metrics.episodesTotal || 0,
      episodes_downloaded: metrics.episodesDownloaded || 0,
      episodes_missing: metrics.episodesMissing || 0,
      episodes_unaired: metrics.episodesUnaired || 0,
      episodes_today: metrics.episodesToday || 0,
      episodes_4k: metrics.episodes4K || 0,
      episodes_1080p: metrics.episodes1080p || 0,
      episodes_720p: metrics.episodes720p || 0,
      episodes_sd: metrics.episodesSD || 0,
      total_size_bytes: metrics.totalSizeBytes || 0,
      average_episode_size_bytes: metrics.averageEpisodeSizeBytes || 0,
      queue_count: metrics.queueCount || 0,
      queue_size_bytes: metrics.queueSizeBytes || 0,
      download_rate_bytes_per_sec: metrics.downloadRateBytesPerSec || 0,
      indexers_total: metrics.indexersTotal || 0,
      indexers_enabled: metrics.indexersEnabled || 0,
      indexers_failing: metrics.indexersFailing || 0,
      download_clients_total: metrics.downloadClientsTotal || 0,
      download_clients_active: metrics.downloadClientsActive || 0,
      health_issues: metrics.healthIssues || 0,
      api_response_time_ms: metrics.apiResponseTimeMs || 0
    };
  }

  private transformRadarrMetrics(metrics: RadarrMetrics): Record<string, number> {
    return {
      movies_total: metrics.moviesTotal || 0,
      movies_monitored: metrics.moviesMonitored || 0,
      movies_unmonitored: metrics.moviesUnmonitored || 0,
      movies_downloaded: metrics.moviesDownloaded || 0,
      movies_missing: metrics.moviesMissing || 0,
      movies_4k: metrics.movies4K || 0,
      movies_1080p: metrics.movies1080p || 0,
      movies_720p: metrics.movies720p || 0,
      movies_sd: metrics.moviesSD || 0,
      total_size_bytes: metrics.totalSizeBytes || 0,
      average_movie_size_bytes: metrics.averageMovieSizeBytes || 0,
      queue_count: metrics.queueCount || 0,
      queue_size_bytes: metrics.queueSizeBytes || 0,
      download_rate_bytes_per_sec: metrics.downloadRateBytesPerSec || 0,
      indexers_total: metrics.indexersTotal || 0,
      indexers_enabled: metrics.indexersEnabled || 0,
      indexers_failing: metrics.indexersFailing || 0,
      download_clients_total: metrics.downloadClientsTotal || 0,
      download_clients_active: metrics.downloadClientsActive || 0,
      health_issues: metrics.healthIssues || 0,
      api_response_time_ms: metrics.apiResponseTimeMs || 0
    };
  }

  private transformProwlarrMetrics(metrics: ProwlarrMetrics): Record<string, number> {
    return {
      indexers_total: metrics.indexersTotal || 0,
      indexers_enabled: metrics.indexersEnabled || 0,
      indexers_disabled: metrics.indexersDisabled || 0,
      indexers_failing: metrics.indexersFailing || 0,
      indexers_temporary_disabled: metrics.indexersTemporaryDisabled || 0,
      apps_total: metrics.appsTotal || 0,
      apps_synced: metrics.appsSynced || 0,
      grabs_total: metrics.grabsTotal || 0,
      grabs_successful: metrics.grabsSuccessful || 0,
      grabs_failed: metrics.grabsFailed || 0,
      queries_total: metrics.queriesTotal || 0,
      queries_successful: metrics.queriesSuccessful || 0,
      queries_failed: metrics.queriesFailed || 0,
      avg_response_time_ms: metrics.avgResponseTimeMs || 0,
      health_issues: metrics.healthIssues || 0,
      api_response_time_ms: metrics.apiResponseTimeMs || 0
    };
  }

  getStatus(): {
    running: boolean;
    workerUrl: string;
    pushInterval: number;
  } {
    return {
      running: this.isRunning,
      workerUrl: this.config.workerUrl,
      pushInterval: this.config.pushInterval
    };
  }
}

// Export singleton instance
export const metricsPusher = new MetricsPusher({
  workerUrl: process.env.CLOUDFLARE_WORKER_URL || 'http://localhost:8787',
  dashboardSecret: process.env.DASHBOARD_SECRET || '',
  containerId: process.env.CONTAINER_ID || 'dasharr-default',
  pushInterval: parseInt(process.env.METRICS_PUSH_INTERVAL || '300000') // 5 minutes default
});