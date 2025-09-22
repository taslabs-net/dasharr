/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { logger } from '../logger';

export interface RadarrMetrics {
  // Basic movie metrics
  movies: {
    total: number;
    downloaded: number;
    monitored: number;
    unmonitored: number;
    fileSize: number;
    collections: number;
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
  
  // Wanted movies
  wanted: {
    missing: number;
    cutoff_unmet: number;
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

export class RadarrCollector {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number = 30000;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  static async fromConfig(): Promise<RadarrCollector | null> {
    try {
      const { getServiceInstancesByType } = await import('@/lib/config-db');
      const radarrInstances = getServiceInstancesByType('radarr');
      const firstRadarr = Object.values(radarrInstances)[0];
      
      if (!firstRadarr?.url || !firstRadarr?.apiKey) {
        throw new Error('Radarr configuration not found or incomplete');
      }

      return new RadarrCollector(firstRadarr.url, firstRadarr.apiKey);
    } catch (error) {
      logger.error('Failed to create RadarrCollector from config:', error);
      return null;
    }
  }

  async collect(): Promise<RadarrMetrics> {
    try {
      logger.info('Starting comprehensive Radarr metrics collection...');
      
      // Collect data from multiple endpoints in parallel for efficiency
      const [
        movies,
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
        qualityProfiles,
        collections
      ] = await Promise.all([
        this.getMovies(),
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
        this.getQualityProfiles(),
        this.getCollections()
      ]);

      // Process and aggregate the data
      const metrics = this.processMetrics({
        movies,
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
        qualityProfiles,
        collections
      });

      logger.info('Radarr metrics collection completed successfully');
      return metrics;
    } catch (error) {
      logger.error('Failed to collect Radarr metrics:', error);
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

  private async getMovies(): Promise<any[]> {
    return await this.apiRequest('movie');
  }

  private async getQueue(): Promise<any> {
    return await this.apiRequest('queue', { 
      pageSize: 1000,
      includeUnknownMovieItems: true,
      includeMovie: true 
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
      unmonitored: false
    });
  }

  private async getMissing(): Promise<any> {
    return await this.apiRequest('wanted/missing', {
      pageSize: 1000,
      sortKey: 'sortTitle',
      sortDirection: 'ascending'
    });
  }

  private async getCutoff(): Promise<any> {
    return await this.apiRequest('wanted/cutoff', {
      pageSize: 1000,
      sortKey: 'sortTitle',
      sortDirection: 'ascending'
    });
  }

  private async getTags(): Promise<any[]> {
    return await this.apiRequest('tag/detail');
  }

  private async getQualityProfiles(): Promise<any[]> {
    return await this.apiRequest('qualityprofile');
  }

  private async getCollections(): Promise<any[]> {
    return await this.apiRequest('collection');
  }

  private processMetrics(data: any): RadarrMetrics {
    // Process movie data
    const movies = data.movies || [];
    const movieMetrics = {
      total: movies.length,
      downloaded: movies.filter((m: any) => m.hasFile).length,
      monitored: movies.filter((m: any) => m.monitored).length,
      unmonitored: movies.filter((m: any) => !m.monitored).length,
      fileSize: movies.reduce((sum: number, m: any) => sum + (m.sizeOnDisk || 0), 0),
      collections: data.collections?.length || 0
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

    // Process wanted data
    const wantedMetrics = {
      missing: data.missing?.totalRecords || 0,
      cutoff_unmet: data.cutoff?.totalRecords || 0
    };

    // Process quality data
    const qualities: { [key: string]: { count: number; size_mb: number } } = {};
    movies.forEach((m: any) => {
      if (m.qualityProfileId && data.qualityProfiles) {
        const profile = data.qualityProfiles.find((qp: any) => qp.id === m.qualityProfileId);
        if (profile) {
          if (!qualities[profile.name]) {
            qualities[profile.name] = { count: 0, size_mb: 0 };
          }
          qualities[profile.name].count++;
          qualities[profile.name].size_mb += (m.sizeOnDisk || 0) / (1024 * 1024);
        }
      }
    });

    // Process tag data
    const tags: { [key: string]: number } = {};
    const tagDetails = data.tags || [];
    tagDetails.forEach((tag: any) => {
      tags[tag.label] = tag.movieIds?.length || 0;
    });

    return {
      movies: movieMetrics,
      queue: queueMetrics,
      system: systemMetrics,
      history: historyMetrics,
      wanted: wantedMetrics,
      qualities,
      tags
    };
  }
}