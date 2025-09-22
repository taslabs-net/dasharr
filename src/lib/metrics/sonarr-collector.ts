/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { logger } from '../logger';

export interface SonarrMetrics {
  // Basic series metrics
  series: {
    total: number;
    downloaded: number;
    monitored: number;
    unmonitored: number;
    fileSize: number;
  };
  
  // Enhanced episode metrics
  episodes: {
    total: number;
    downloaded: number;
    missing: number;
    monitored: number;
    unmonitored: number;
    upcoming_7days: number;
    recent_7days: number;
    cutoff_unmet: number;
  };
  
  // Queue metrics
  queue: {
    total: number;
    downloading: number;
    paused: number;
    completed: number;
    failed: number;
    size_mb: number;
  };
  
  // System metrics
  system: {
    health_issues: number;
    disk_free_gb: number;
    disk_total_gb: number;
    version: string;
    uptime_hours: number;
  };
  
  // Activity metrics
  history: {
    downloads_24h: number;
    downloads_7d: number;
    success_rate_24h: number;
    failed_24h: number;
  };
  
  // Quality distribution
  qualities: {
    [qualityName: string]: {
      count: number;
      size_mb: number;
    };
  };
  
  // Tag usage
  tags: {
    [tagName: string]: number;
  };
}

export class SonarrCollector {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number = 30000;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  static async fromConfig(): Promise<SonarrCollector | null> {
    try {
      const { getServiceInstancesByType } = await import('@/lib/config-db');
      const sonarrInstances = getServiceInstancesByType('sonarr');
      const firstSonarr = Object.values(sonarrInstances)[0];
      
      if (!firstSonarr?.url || !firstSonarr?.apiKey) {
        throw new Error('Sonarr configuration not found or incomplete');
      }

      return new SonarrCollector(firstSonarr.url, firstSonarr.apiKey);
    } catch (error) {
      logger.error('Failed to create SonarrCollector from config:', error);
      return null;
    }
  }

  async collect(): Promise<SonarrMetrics> {
    try {
      logger.info('Starting comprehensive Sonarr metrics collection...');
      
      // Collect data from multiple endpoints in parallel for efficiency
      const [
        series,
        queue,
        queueStatus,
        systemStatus,
        health,
        diskSpace,
        history,
        calendar,
        missing,
        cutoff,
        tags,
        qualityProfiles
      ] = await Promise.all([
        this.getSeries(),
        this.getQueue(),
        this.getQueueStatus(),
        this.getSystemStatus(),
        this.getHealth(),
        this.getDiskSpace(),
        this.getHistory(),
        this.getCalendar(),
        this.getMissing(),
        this.getCutoff(),
        this.getTags(),
        this.getQualityProfiles()
      ]);

      // Process and aggregate the data
      const metrics = this.processMetrics({
        series,
        queue,
        queueStatus,
        systemStatus,
        health,
        diskSpace,
        history,
        calendar,
        missing,
        cutoff,
        tags,
        qualityProfiles
      });

      logger.info('Sonarr metrics collection completed successfully');
      return metrics;
    } catch (error) {
      logger.error('Failed to collect Sonarr metrics:', error);
      throw error;
    }
  }

  private async apiRequest(endpoint: string, params?: any): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/v3/${endpoint}`;
      const response = await axios.get(url, {
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        params,
        timeout: this.timeout
      });
      return response.data;
    } catch (error: any) {
      logger.error(`API request failed for endpoint ${endpoint}:`, error?.response?.data || error?.message);
      throw error;
    }
  }

  private async getSeries(): Promise<any[]> {
    return await this.apiRequest('series');
  }

  private async getQueue(): Promise<any> {
    return await this.apiRequest('queue', { 
      pageSize: 1000,
      includeUnknownSeriesItems: true,
      includeSeries: true 
    });
  }

  private async getQueueStatus(): Promise<any> {
    return await this.apiRequest('queue/status');
  }

  private async getSystemStatus(): Promise<any> {
    return await this.apiRequest('system/status');
  }

  private async getHealth(): Promise<any[]> {
    return await this.apiRequest('health');
  }

  private async getDiskSpace(): Promise<any[]> {
    return await this.apiRequest('diskspace');
  }

  private async getHistory(): Promise<any> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const [history24h, history7d] = await Promise.all([
      this.apiRequest('history', {
        pageSize: 1000,
        sortKey: 'date',
        sortDirection: 'descending',
        since: yesterday.toISOString()
      }),
      this.apiRequest('history', {
        pageSize: 1000,
        sortKey: 'date',
        sortDirection: 'descending',
        since: weekAgo.toISOString()
      })
    ]);

    return { history24h, history7d };
  }

  private async getCalendar(): Promise<any[]> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return await this.apiRequest('calendar', {
      start: weekAgo.toISOString(),
      end: weekAhead.toISOString(),
      unmonitored: false,
      includeSeries: true
    });
  }

  private async getMissing(): Promise<any> {
    return await this.apiRequest('wanted/missing', {
      pageSize: 1000,
      sortKey: 'airDateUtc',
      sortDirection: 'descending'
    });
  }

  private async getCutoff(): Promise<any> {
    return await this.apiRequest('wanted/cutoff', {
      pageSize: 1000,
      sortKey: 'airDateUtc',
      sortDirection: 'descending'
    });
  }

  private async getTags(): Promise<any[]> {
    return await this.apiRequest('tag/detail');
  }

  private async getQualityProfiles(): Promise<any[]> {
    return await this.apiRequest('qualityprofile');
  }

  private processMetrics(data: any): SonarrMetrics {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Process series data
    const series = data.series || [];
    const seriesMetrics = {
      total: series.length,
      downloaded: series.filter((s: any) => s.statistics?.percentOfEpisodes === 100).length,
      monitored: series.filter((s: any) => s.monitored).length,
      unmonitored: series.filter((s: any) => !s.monitored).length,
      fileSize: series.reduce((sum: number, s: any) => sum + (s.statistics?.sizeOnDisk || 0), 0)
    };

    // Process episode data
    const totalEpisodes = series.reduce((sum: number, s: any) => sum + (s.statistics?.totalEpisodeCount || 0), 0);
    const downloadedEpisodes = series.reduce((sum: number, s: any) => sum + (s.statistics?.episodeFileCount || 0), 0);
    const monitoredEpisodes = series.reduce((sum: number, s: any) => sum + (s.statistics?.episodeCount || 0), 0);

    // Process calendar data
    const calendar = data.calendar || [];
    const upcoming7Days = calendar.filter((e: any) => {
      const airDate = new Date(e.airDateUtc);
      return airDate > now && airDate <= weekAhead;
    }).length;
    
    const recent7Days = calendar.filter((e: any) => {
      const airDate = new Date(e.airDateUtc);
      return airDate >= weekAgo && airDate <= now;
    }).length;

    const episodeMetrics = {
      total: totalEpisodes,
      downloaded: downloadedEpisodes,
      missing: data.missing?.totalRecords || 0,
      monitored: monitoredEpisodes,
      unmonitored: totalEpisodes - monitoredEpisodes,
      upcoming_7days: upcoming7Days,
      recent_7days: recent7Days,
      cutoff_unmet: data.cutoff?.totalRecords || 0
    };

    // Process queue data
    const queue = data.queue?.records || [];
    const queueMetrics = {
      total: queue.length,
      downloading: queue.filter((q: any) => q.status === 'downloading').length,
      paused: queue.filter((q: any) => q.status === 'paused').length,
      completed: queue.filter((q: any) => q.status === 'completed').length,
      failed: queue.filter((q: any) => q.status === 'failed').length,
      size_mb: queue.reduce((sum: number, q: any) => sum + (q.size || 0), 0) / (1024 * 1024)
    };

    // Process system data
    const systemStatus = data.systemStatus || {};
    const health = data.health || [];
    const diskSpace = data.diskSpace || [];
    
    const totalDiskSpace = diskSpace.reduce((sum: number, d: any) => sum + (d.totalSpace || 0), 0);
    const freeDiskSpace = diskSpace.reduce((sum: number, d: any) => sum + (d.freeSpace || 0), 0);
    
    const systemMetrics = {
      health_issues: health.length,
      disk_free_gb: freeDiskSpace / (1024 * 1024 * 1024),
      disk_total_gb: totalDiskSpace / (1024 * 1024 * 1024),
      version: systemStatus.version || 'unknown',
      uptime_hours: systemStatus.startTime ? 
        Math.floor((Date.now() - new Date(systemStatus.startTime).getTime()) / 3600000) : 0
    };

    // Process history data
    const history24h = data.history?.history24h?.records || [];
    const history7d = data.history?.history7d?.records || [];
    
    const successful24h = history24h.filter((h: any) => h.eventType === 'downloadFolderImported').length;
    const failed24h = history24h.filter((h: any) => h.eventType === 'downloadFailed').length;
    
    const historyMetrics = {
      downloads_24h: history24h.length,
      downloads_7d: history7d.length,
      success_rate_24h: history24h.length > 0 ? (successful24h / history24h.length) * 100 : 0,
      failed_24h: failed24h
    };

    // Process quality data
    const qualities: { [key: string]: { count: number; size_mb: number } } = {};
    series.forEach((s: any) => {
      if (s.qualityProfileId && data.qualityProfiles) {
        const profile = data.qualityProfiles.find((qp: any) => qp.id === s.qualityProfileId);
        if (profile) {
          if (!qualities[profile.name]) {
            qualities[profile.name] = { count: 0, size_mb: 0 };
          }
          qualities[profile.name].count++;
          qualities[profile.name].size_mb += (s.statistics?.sizeOnDisk || 0) / (1024 * 1024);
        }
      }
    });

    // Process tag data
    const tags: { [key: string]: number } = {};
    const tagDetails = data.tags || [];
    tagDetails.forEach((tag: any) => {
      tags[tag.label] = tag.seriesIds?.length || 0;
    });

    return {
      series: seriesMetrics,
      episodes: episodeMetrics,
      queue: queueMetrics,
      system: systemMetrics,
      history: historyMetrics,
      qualities,
      tags
    };
  }
}