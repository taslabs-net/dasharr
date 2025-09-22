/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { logger } from '../logger';

export interface ProwlarrMetrics {
  // Basic indexer metrics
  indexers: {
    total: number;
    enabled: number;
    disabled: number;
    failing: number;
    healthy: number;
  };
  
  // Indexer performance stats
  performance: {
    avg_response_time_ms: number;
    avg_grab_response_time_ms: number;
    total_queries: number;
    total_grabs: number;
    total_rss_queries: number;
    queries_per_indexer: { [indexerName: string]: number };
    grabs_per_indexer: { [indexerName: string]: number };
  };
  
  // Activity metrics from history
  activity: {
    searches_24h: number;
    searches_7d: number;
    grabs_24h: number;
    grabs_7d: number;
    success_rate_24h: number;
    rss_queries_24h: number;
  };
  
  // System health metrics
  system: {
    health_issues: number;
    version: string;
    uptime_hours: number;
    platform: string;
    is_debug: boolean;
    connected_apps: number;
    download_clients: number;
  };
  
  // Indexer status and failures
  indexer_status: {
    failed_indexers: number;
    disabled_until_count: number;
    recent_failures: number;
    recovery_pending: number;
  };
  
  // Task execution metrics
  tasks: {
    total_tasks: number;
    overdue_tasks: number;
    last_execution_times: { [taskName: string]: string };
  };
  
  // Command queue metrics
  commands: {
    queue_length: number;
    completed_commands: number;
    failed_commands: number;
  };
  
  // Tag usage
  tags: {
    [tagName: string]: number;
  };
}

export class ProwlarrCollector {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number = 30000;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  static async fromConfig(): Promise<ProwlarrCollector | null> {
    try {
      const { getServiceInstancesByType } = await import('@/lib/config-db');
      const prowlarrInstances = getServiceInstancesByType('prowlarr');
      const firstProwlarr = Object.values(prowlarrInstances)[0];
      
      if (!firstProwlarr?.url || !firstProwlarr?.apiKey) {
        throw new Error('Prowlarr configuration not found or incomplete');
      }

      return new ProwlarrCollector(firstProwlarr.url, firstProwlarr.apiKey);
    } catch (error) {
      logger.error('Failed to create ProwlarrCollector from config:', error);
      return null;
    }
  }

  async collect(): Promise<ProwlarrMetrics> {
    try {
      logger.info('Starting comprehensive Prowlarr metrics collection...');
      
      // Collect data from multiple endpoints in parallel for efficiency
      const [
        indexers,
        indexerStats,
        indexerStatus,
        health,
        systemStatus,
        history,
        applications,
        tasks,
        commands,
        tags,
        downloadClients
      ] = await Promise.all([
        this.getIndexers(),
        this.getIndexerStats(),
        this.getIndexerStatus(),
        this.getHealth(),
        this.getSystemStatus(),
        this.getHistory(),
        this.getApplications(),
        this.getTasks(),
        this.getCommands(),
        this.getTags(),
        this.getDownloadClients()
      ]);

      // Process and aggregate the data
      const metrics = this.processMetrics({
        indexers,
        indexerStats,
        indexerStatus,
        health,
        systemStatus,
        history,
        applications,
        tasks,
        commands,
        tags,
        downloadClients
      });

      logger.info('Prowlarr metrics collection completed successfully');
      return metrics;
    } catch (error) {
      logger.error('Failed to collect Prowlarr metrics:', error);
      throw error;
    }
  }

  private async apiRequest(endpoint: string, params?: any): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/v1/${endpoint}`;
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

  private async getIndexers(): Promise<any[]> {
    return await this.apiRequest('indexer');
  }

  private async getIndexerStats(): Promise<any> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return await this.apiRequest('indexerstats', {
      startDate: weekAgo.toISOString(),
      endDate: now.toISOString()
    });
  }

  private async getIndexerStatus(): Promise<any[]> {
    return await this.apiRequest('indexerstatus');
  }

  private async getHealth(): Promise<any[]> {
    return await this.apiRequest('health');
  }

  private async getSystemStatus(): Promise<any> {
    return await this.apiRequest('system/status');
  }

  private async getHistory(): Promise<any> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const [history24h, history7d] = await Promise.all([
      this.apiRequest('history', {
        pageSize: 1000,
        sortKey: 'date',
        sortDirection: 'descending'
      }),
      this.apiRequest('history', {
        pageSize: 1000,
        sortKey: 'date',
        sortDirection: 'descending'
      })
    ]);

    // Filter client-side for date ranges since API doesn't support date filters
    const history24hFiltered = history24h?.records?.filter((h: any) => 
      new Date(h.date) >= yesterday
    ) || [];
    
    const history7dFiltered = history7d?.records?.filter((h: any) => 
      new Date(h.date) >= weekAgo
    ) || [];

    return { history24h: history24hFiltered, history7d: history7dFiltered };
  }

  private async getApplications(): Promise<any[]> {
    return await this.apiRequest('applications');
  }

  private async getTasks(): Promise<any[]> {
    return await this.apiRequest('system/task');
  }

  private async getCommands(): Promise<any[]> {
    return await this.apiRequest('command');
  }

  private async getTags(): Promise<any[]> {
    return await this.apiRequest('tag');
  }

  private async getDownloadClients(): Promise<any[]> {
    return await this.apiRequest('downloadclient');
  }

  private processMetrics(data: any): ProwlarrMetrics {
    const now = new Date();

    // Process indexer data
    const indexers = data.indexers || [];
    const indexerMetrics = {
      total: indexers.length,
      enabled: indexers.filter((i: any) => i.enable === true).length,
      disabled: indexers.filter((i: any) => i.enable === false).length,
      failing: 0, // Will be calculated from indexer status
      healthy: 0  // Will be calculated from indexer status
    };

    // Process indexer status
    const indexerStatus = data.indexerStatus || [];
    const failedIndexers = indexerStatus.filter((s: any) => s.disabledTill && new Date(s.disabledTill) > now);
    const indexerStatusMetrics = {
      failed_indexers: failedIndexers.length,
      disabled_until_count: indexerStatus.filter((s: any) => s.disabledTill).length,
      recent_failures: indexerStatus.filter((s: any) => s.mostRecentFailure && 
        new Date(s.mostRecentFailure) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
      ).length,
      recovery_pending: indexerStatus.filter((s: any) => s.disabledTill && 
        new Date(s.disabledTill) <= now
      ).length
    };

    // Update indexer health counts
    indexerMetrics.failing = indexerStatusMetrics.failed_indexers;
    indexerMetrics.healthy = indexerMetrics.enabled - indexerMetrics.failing;

    // Process indexer stats
    const indexerStats = data.indexerStats || {};
    const indexerStatsData = indexerStats.indexers || [];
    
    const performanceMetrics = {
      avg_response_time_ms: indexerStatsData.reduce((sum: number, i: any) => 
        sum + (i.averageResponseTime || 0), 0) / Math.max(indexerStatsData.length, 1),
      avg_grab_response_time_ms: indexerStatsData.reduce((sum: number, i: any) => 
        sum + (i.averageGrabResponseTime || 0), 0) / Math.max(indexerStatsData.length, 1),
      total_queries: indexerStatsData.reduce((sum: number, i: any) => sum + (i.numberOfQueries || 0), 0),
      total_grabs: indexerStatsData.reduce((sum: number, i: any) => sum + (i.numberOfGrabs || 0), 0),
      total_rss_queries: indexerStatsData.reduce((sum: number, i: any) => sum + (i.numberOfRssQueries || 0), 0),
      queries_per_indexer: {} as { [key: string]: number },
      grabs_per_indexer: {} as { [key: string]: number }
    };

    // Build per-indexer metrics
    indexerStatsData.forEach((indexer: any) => {
      if (indexer.indexerName) {
        performanceMetrics.queries_per_indexer[indexer.indexerName] = indexer.numberOfQueries || 0;
        performanceMetrics.grabs_per_indexer[indexer.indexerName] = indexer.numberOfGrabs || 0;
      }
    });

    // Process history data
    const history24h = data.history?.history24h || [];
    const history7d = data.history?.history7d || [];
    
    const searches24h = history24h.filter((h: any) => h.eventType === 'indexerQuery').length;
    const searches7d = history7d.filter((h: any) => h.eventType === 'indexerQuery').length;
    const grabs24h = history24h.filter((h: any) => h.eventType === 'releaseGrabbed').length;
    const grabs7d = history7d.filter((h: any) => h.eventType === 'releaseGrabbed').length;
    const rss24h = history24h.filter((h: any) => h.eventType === 'indexerRss').length;
    const successful24h = history24h.filter((h: any) => h.successful === true).length;
    
    const activityMetrics = {
      searches_24h: searches24h,
      searches_7d: searches7d,
      grabs_24h: grabs24h,
      grabs_7d: grabs7d,
      success_rate_24h: history24h.length > 0 ? (successful24h / history24h.length) * 100 : 0,
      rss_queries_24h: rss24h
    };

    // Process system data
    const systemStatus = data.systemStatus || {};
    const health = data.health || [];
    const applications = data.applications || [];
    const downloadClients = data.downloadClients || [];
    
    const systemMetrics = {
      health_issues: health.length,
      version: systemStatus.version || 'unknown',
      uptime_hours: systemStatus.startTime ? 
        Math.floor((Date.now() - new Date(systemStatus.startTime).getTime()) / 3600000) : 0,
      platform: systemStatus.osName || 'unknown',
      is_debug: systemStatus.isDebug === true,
      connected_apps: applications.length,
      download_clients: downloadClients.length
    };

    // Process tasks data
    const tasks = data.tasks || [];
    const taskMetrics = {
      total_tasks: tasks.length,
      overdue_tasks: tasks.filter((t: any) => 
        t.nextExecution && new Date(t.nextExecution) < now
      ).length,
      last_execution_times: {} as { [key: string]: string }
    };

    // Build task execution times
    tasks.forEach((task: any) => {
      if (task.taskName && task.lastExecution) {
        taskMetrics.last_execution_times[task.taskName] = task.lastExecution;
      }
    });

    // Process commands data
    const commands = data.commands || [];
    const commandMetrics = {
      queue_length: commands.filter((c: any) => c.status === 'queued').length,
      completed_commands: commands.filter((c: any) => c.status === 'completed').length,
      failed_commands: commands.filter((c: any) => c.status === 'failed').length
    };

    // Process tag data
    const tags: { [key: string]: number } = {};
    const tagData = data.tags || [];
    tagData.forEach((tag: any) => {
      tags[tag.label] = tag.id || 0;
    });

    return {
      indexers: indexerMetrics,
      performance: performanceMetrics,
      activity: activityMetrics,
      system: systemMetrics,
      indexer_status: indexerStatusMetrics,
      tasks: taskMetrics,
      commands: commandMetrics,
      tags
    };
  }
}