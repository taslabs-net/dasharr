/* eslint-disable @typescript-eslint/no-explicit-any */
// SABnzbd Comprehensive Metrics Collector
// Collects detailed statistics and metrics from SABnzbd API

import { SABnzbdAPI } from '../api/sabnzbd';
import { logger } from '../logger';

export interface SABnzbdMetrics {
  // System Information
  system: {
    version: string;
    uptime: string;
    pid: number;
    platform: {
      nt: boolean;
      darwin: boolean;
    };
    status: any;
    config: any;
    serverStats: any;
  };

  // Core Statistics
  stats: {
    queueSize: number;
    queueSizeBytes: number;
    queueSizeLeft: number;
    queueSizeLeftBytes: number;
    currentSpeed: number;
    currentSpeedKBps: number;
    activeJobs: number;
    pausedJobs: number;
    historyTotal: number;
    completedToday: number;
    completedWeek: number;
    completedMonth: number;
    totalBytesDownloaded: number;
    averageSpeed: number;
    isPaused: boolean;
    speedLimit: number;
    speedLimitAbs: number;
  };

  // Queue Analytics
  queue: {
    total: number;
    active: number;
    paused: number;
    jobs: any[];
    totalSize: number;
    totalSizeLeft: number;
    eta: string;
    downloadRate: number;
    categories: Record<string, number>;
    priorities: Record<string, number>;
    statusBreakdown: Record<string, number>;
  };

  // History Analytics
  history: {
    total: number;
    completed: number;
    failed: number;
    jobs: any[];
    totalSize: number;
    completionRate: number;
    averageDownloadTime: number;
    categories: Record<string, number>;
    statusBreakdown: Record<string, number>;
    dailyStats: {
      today: number;
      week: number;
      month: number;
    };
  };

  // Performance Analytics
  performance: {
    currentSpeed: number;
    averageSpeed: number;
    peakSpeed: number;
    speedHistory: any[];
    downloadEfficiency: number;
    activeConnections: number;
    serverLoad: number;
    cacheStats: {
      artCache: number;
      cacheSize: number;
    };
  };

  // Storage Analytics
  storage: {
    diskSpace: {
      download: number;
      complete: number;
      downloadTotal: number;
      completeTotal: number;
      downloadFree: number;
      completeFree: number;
    };
    quota: {
      enabled: boolean;
      total: number;
      used: number;
      remaining: number;
      percentage: number;
    };
  };

  // Categories & Configuration
  categories: {
    available: string[];
    usage: Record<string, number>;
    defaultCategory: string;
  };

  // Activity Status
  activity: {
    downloading: boolean;
    postProcessing: boolean;
    repairing: boolean;
    unpacking: boolean;
    checking: boolean;
    idleTime: number;
    activeProcesses: string[];
  };

  // Health & Monitoring
  health: {
    online: boolean;
    warnings: any[];
    errors: string[];
    lastCheck: Date;
    version: string;
    updateAvailable: boolean;
    configValid: boolean;
    diskSpaceOk: boolean;
    quotaOk: boolean;
  };
}

export class SABnzbdCollector {
  private client: SABnzbdAPI;

  constructor(config: { url: string; apiKey: string }) {
    this.client = new SABnzbdAPI(config);
  }

  async collect(): Promise<SABnzbdMetrics> {
    try {
      logger.info('Starting comprehensive SABnzbd metrics collection...');

      // Collect data from multiple endpoints in parallel for efficiency
      const [
        status,
        queue,
        fullQueue,
        history,
        fullHistory,
        version,
        serverStats,
        categories,
        config,
        warnings
      ] = await Promise.allSettled([
        this.getStatus(),
        this.getQueue(),
        this.getFullQueue(),
        this.getHistory(),
        this.getFullHistory(),
        this.getVersion(),
        this.getServerStats(),
        this.getCategories(),
        this.getConfig(),
        this.getWarnings()
      ]);

      // Process and aggregate the data
      const metrics = this.processMetrics({
        status,
        queue,
        fullQueue,
        history,
        fullHistory,
        version,
        serverStats,
        categories,
        config,
        warnings
      });

      logger.info('SABnzbd metrics collection completed successfully');
      return metrics;
    } catch (error) {
      logger.error('Failed to collect SABnzbd metrics:', error);
      throw error;
    }
  }

  private async getStatus() {
    return this.client.getStatus();
  }

  private async getQueue() {
    return this.client.getQueue(0, 50); // Get first 50 items
  }

  private async getFullQueue() {
    return this.client.getFullQueue();
  }

  private async getHistory() {
    return this.client.getHistory(0, 100); // Get first 100 items
  }

  private async getFullHistory() {
    return this.client.getFullHistory();
  }

  private async getVersion() {
    return this.client.getVersion();
  }

  private async getServerStats() {
    try {
      return await this.client.getServerStats();
    } catch {
      return {};
    }
  }

  private async getCategories() {
    return this.client.getCategories();
  }

  private async getConfig() {
    try {
      return await this.client.getConfig();
    } catch {
      return {};
    }
  }

  private async getWarnings() {
    try {
      return await this.client.getWarnings();
    } catch {
      return { warnings: [] };
    }
  }

  private processMetrics(data: Record<string, PromiseSettledResult<any>>): SABnzbdMetrics {
    // Helper function to safely extract data from promise results
    const getResult = (result: PromiseSettledResult<any>) => 
      result.status === 'fulfilled' ? result.value : null;

    // Extract all the data
    const statusData = getResult(data.status) || { status: {} };
    const queueData = getResult(data.queue) || { queue: { slots: [] } };
    const fullQueueData = getResult(data.fullQueue) || { queue: { slots: [] } };
    const historyData = getResult(data.history) || { history: { slots: [] } };
    const fullHistoryData = getResult(data.fullHistory) || { history: { slots: [] } };
    const versionData = getResult(data.version) || { version: 'unknown' };
    const serverStatsData = getResult(data.serverStats) || {};
    const categoriesData = getResult(data.categories) || { categories: [] };
    const configData = getResult(data.config) || {};
    const warningsData = getResult(data.warnings) || { warnings: [] };

    // Extract status information
    const status = statusData.status || {};
    const queue = fullQueueData.queue || queueData.queue || { slots: [] };
    const history = fullHistoryData.history || historyData.history || { slots: [] };

    // Process queue analytics
    const queueJobs = queue.slots || [];
    const queueCategories = this.analyzeCategories(queueJobs);
    const queuePriorities = this.analyzePriorities(queueJobs);
    const queueStatus = this.analyzeStatus(queueJobs);

    // Process history analytics
    const historyJobs = history.slots || [];
    const historyCategories = this.analyzeCategories(historyJobs);
    const historyStatus = this.analyzeStatus(historyJobs);
    const completedJobs = historyJobs.filter((job: any) => job.status === 'Completed');
    const failedJobs = historyJobs.filter((job: any) => job.status === 'Failed');

    // Calculate performance metrics
    const currentSpeed = parseFloat(status.kbpersec || '0');
    const averageSpeed = this.calculateAverageSpeed(historyJobs);
    const downloadEfficiency = this.calculateDownloadEfficiency(historyJobs);

    // Calculate storage metrics
    const diskSpace = this.processDiskSpace(status);
    const quota = this.processQuota(status);

    return {
      // System Information
      system: {
        version: versionData.version || status.version || 'unknown',
        uptime: status.uptime || '0',
        pid: status.pid || 0,
        platform: {
          nt: status.nt || false,
          darwin: status.darwin || false,
        },
        status: statusData,
        config: configData,
        serverStats: serverStatsData,
      },

      // Core Statistics
      stats: {
        queueSize: parseInt(queue.noofslots || '0'),
        queueSizeBytes: this.parseSize(queue.mb || '0'),
        queueSizeLeft: parseInt(queue.noofslots || '0'),
        queueSizeLeftBytes: this.parseSize(queue.mbleft || '0'),
        currentSpeed: currentSpeed,
        currentSpeedKBps: currentSpeed,
        activeJobs: queueJobs.filter((job: any) => job.status === 'Downloading').length,
        pausedJobs: queueJobs.filter((job: any) => job.status === 'Paused').length,
        historyTotal: parseInt(history.noofslots || '0'),
        completedToday: this.countCompletedToday(historyJobs),
        completedWeek: this.countCompletedWeek(historyJobs),
        completedMonth: this.countCompletedMonth(historyJobs),
        totalBytesDownloaded: this.parseSize(history.total_size || '0'),
        averageSpeed: averageSpeed,
        isPaused: status.paused || false,
        speedLimit: parseFloat(status.speedlimit || '0'),
        speedLimitAbs: parseFloat(status.speedlimit_abs || '0'),
      },

      // Queue Analytics
      queue: {
        total: queueJobs.length,
        active: queueJobs.filter((job: any) => job.status === 'Downloading').length,
        paused: queueJobs.filter((job: any) => job.status === 'Paused').length,
        jobs: queueJobs,
        totalSize: this.parseSize(queue.mb || '0'),
        totalSizeLeft: this.parseSize(queue.mbleft || '0'),
        eta: queue.eta || '0:00:00',
        downloadRate: currentSpeed,
        categories: queueCategories,
        priorities: queuePriorities,
        statusBreakdown: queueStatus,
      },

      // History Analytics
      history: {
        total: historyJobs.length,
        completed: completedJobs.length,
        failed: failedJobs.length,
        jobs: historyJobs,
        totalSize: this.parseSize(history.total_size || '0'),
        completionRate: historyJobs.length > 0 ? (completedJobs.length / historyJobs.length) * 100 : 0,
        averageDownloadTime: this.calculateAverageDownloadTime(completedJobs),
        categories: historyCategories,
        statusBreakdown: historyStatus,
        dailyStats: {
          today: this.countCompletedToday(historyJobs),
          week: this.countCompletedWeek(historyJobs),
          month: this.countCompletedMonth(historyJobs),
        },
      },

      // Performance Analytics
      performance: {
        currentSpeed: currentSpeed,
        averageSpeed: averageSpeed,
        peakSpeed: this.calculatePeakSpeed(historyJobs),
        speedHistory: [], // Could be enhanced with historical data
        downloadEfficiency: downloadEfficiency,
        activeConnections: this.parseFloat(status.active_connections || '0'),
        serverLoad: this.parseFloat(status.loadavg || '0'),
        cacheStats: {
          artCache: this.parseSize(status.cache_art || '0'),
          cacheSize: this.parseSize(status.cache_size || '0'),
        },
      },

      // Storage Analytics
      storage: {
        diskSpace,
        quota,
      },

      // Categories & Configuration
      categories: {
        available: categoriesData.categories || [],
        usage: { ...queueCategories, ...historyCategories },
        defaultCategory: 'default', // Could be extracted from config
      },

      // Activity Status
      activity: {
        downloading: status.download_active || false,
        postProcessing: status.pp_active || false,
        repairing: status.repair_active || false,
        unpacking: status.unpack_active || false,
        checking: status.check_active || false,
        idleTime: this.calculateIdleTime(status),
        activeProcesses: this.getActiveProcesses(status),
      },

      // Health & Monitoring
      health: {
        online: true, // If we got data, it's online
        warnings: warningsData.warnings || [],
        errors: this.extractErrors(warningsData.warnings || []),
        lastCheck: new Date(),
        version: versionData.version || 'unknown',
        updateAvailable: status.new_rel_url ? true : false,
        configValid: Object.keys(configData).length > 0,
        diskSpaceOk: this.isDiskSpaceOk(diskSpace),
        quotaOk: quota.enabled ? quota.percentage < 90 : true,
      },
    };
  }

  private analyzeCategories(jobs: any[]): Record<string, number> {
    const categories: Record<string, number> = {};
    jobs.forEach((job: any) => {
      const category = job.cat || job.category || 'default';
      categories[category] = (categories[category] || 0) + 1;
    });
    return categories;
  }

  private analyzePriorities(jobs: any[]): Record<string, number> {
    const priorities: Record<string, number> = {};
    jobs.forEach((job: any) => {
      const priority = job.priority || 'Normal';
      priorities[priority] = (priorities[priority] || 0) + 1;
    });
    return priorities;
  }

  private analyzeStatus(jobs: any[]): Record<string, number> {
    const statuses: Record<string, number> = {};
    jobs.forEach((job: any) => {
      const status = job.status || 'Unknown';
      statuses[status] = (statuses[status] || 0) + 1;
    });
    return statuses;
  }

  private parseSize(sizeStr: string): number {
    const size = parseFloat(sizeStr);
    return isNaN(size) ? 0 : size * 1024 * 1024; // Convert MB to bytes
  }

  private parseFloat(str: string): number {
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  private calculateAverageSpeed(historyJobs: any[]): number {
    const completedJobs = historyJobs.filter((job: any) => 
      job.status === 'Completed' && job.download_time && job.bytes
    );
    
    if (completedJobs.length === 0) return 0;
    
    const totalSpeed = completedJobs.reduce((sum: number, job: any) => {
      const downloadTime = parseFloat(job.download_time) || 1;
      const bytes = job.bytes || 0;
      return sum + (bytes / downloadTime / 1024); // KB/s
    }, 0);
    
    return totalSpeed / completedJobs.length;
  }

  private calculateDownloadEfficiency(historyJobs: any[]): number {
    const totalJobs = historyJobs.length;
    if (totalJobs === 0) return 100;
    
    const completedJobs = historyJobs.filter((job: any) => job.status === 'Completed').length;
    return (completedJobs / totalJobs) * 100;
  }

  private calculatePeakSpeed(historyJobs: any[]): number {
    return historyJobs.reduce((peak: number, job: any) => {
      if (job.download_time && job.bytes) {
        const speed = job.bytes / parseFloat(job.download_time) / 1024; // KB/s
        return Math.max(peak, speed);
      }
      return peak;
    }, 0);
  }

  private calculateAverageDownloadTime(completedJobs: any[]): number {
    if (completedJobs.length === 0) return 0;
    
    const totalTime = completedJobs.reduce((sum: number, job: any) => {
      return sum + (parseFloat(job.download_time) || 0);
    }, 0);
    
    return totalTime / completedJobs.length;
  }

  private countCompletedToday(historyJobs: any[]): number {
    const today = new Date().toDateString();
    return historyJobs.filter((job: any) => {
      if (job.completed && job.status === 'Completed') {
        const completedDate = new Date(job.completed * 1000).toDateString();
        return completedDate === today;
      }
      return false;
    }).length;
  }

  private countCompletedWeek(historyJobs: any[]): number {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    return historyJobs.filter((job: any) => {
      if (job.completed && job.status === 'Completed') {
        const completedDate = new Date(job.completed * 1000);
        return completedDate >= weekAgo;
      }
      return false;
    }).length;
  }

  private countCompletedMonth(historyJobs: any[]): number {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    return historyJobs.filter((job: any) => {
      if (job.completed && job.status === 'Completed') {
        const completedDate = new Date(job.completed * 1000);
        return completedDate >= monthAgo;
      }
      return false;
    }).length;
  }

  private processDiskSpace(status: any): any {
    return {
      download: this.parseSize(status.diskspace1 || '0'),
      complete: this.parseSize(status.diskspace2 || '0'),
      downloadTotal: this.parseSize(status.diskspacetotal1 || '0'),
      completeTotal: this.parseSize(status.diskspacetotal2 || '0'),
      downloadFree: this.parseSize(status.diskspacetotal1 || '0') - this.parseSize(status.diskspace1 || '0'),
      completeFree: this.parseSize(status.diskspacetotal2 || '0') - this.parseSize(status.diskspace2 || '0'),
    };
  }

  private processQuota(status: any): any {
    const enabled = status.have_quota || false;
    const total = this.parseSize(status.quota || '0');
    const remaining = this.parseSize(status.left_quota || '0');
    const used = total - remaining;
    
    return {
      enabled,
      total,
      used,
      remaining,
      percentage: total > 0 ? (used / total) * 100 : 0,
    };
  }

  private calculateIdleTime(status: any): number {
    // Calculate idle time based on activity flags
    const isActive = status.download_active || status.pp_active || 
                    status.repair_active || status.unpack_active || status.check_active;
    return isActive ? 0 : parseInt(status.uptime || '0');
  }

  private getActiveProcesses(status: any): string[] {
    const processes: string[] = [];
    if (status.download_active) processes.push('downloading');
    if (status.pp_active) processes.push('post-processing');
    if (status.repair_active) processes.push('repairing');
    if (status.unpack_active) processes.push('unpacking');
    if (status.check_active) processes.push('checking');
    return processes;
  }

  private extractErrors(warnings: any[]): string[] {
    return warnings
      .filter((warning: any) => warning.type === 'ERROR')
      .map((warning: any) => warning.text || 'Unknown error');
  }

  private isDiskSpaceOk(diskSpace: any): boolean {
    const downloadFreePercentage = diskSpace.downloadTotal > 0 ? 
      (diskSpace.downloadFree / diskSpace.downloadTotal) * 100 : 100;
    const completeFreePercentage = diskSpace.completeTotal > 0 ? 
      (diskSpace.completeFree / diskSpace.completeTotal) * 100 : 100;
    
    return downloadFreePercentage > 10 && completeFreePercentage > 10; // 10% threshold
  }
}

// Export factory function for creating collector instances
export function createSABnzbdCollector(config: { url: string; apiKey: string }) {
  return new SABnzbdCollector(config);
}
