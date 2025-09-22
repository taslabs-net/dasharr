/* eslint-disable @typescript-eslint/no-explicit-any */
// qBittorrent Comprehensive Metrics Collector
// Collects detailed statistics and metrics from qBittorrent API

import { createQBittorrentClient, QBittorrentAPI } from '../api/qbittorrent';
import { logger } from '../logger';

export interface QBittorrentMetrics {
  // System Information
  system: {
    version: string;
    buildInfo: any;
    preferences: any;
    serverState: any;
  };

  // Core Statistics
  stats: {
    totalTorrents: number;
    activeTorrents: number;
    downloadingTorrents: number;
    seedingTorrents: number;
    pausedTorrents: number;
    completedTorrents: number;
    stalledTorrents: number;
    errorTorrents: number;
    globalDownloadSpeed: number;
    globalUploadSpeed: number;
    totalDownloaded: number;
    totalUploaded: number;
    sessionDownloaded: number;
    sessionUploaded: number;
    globalRatio: number;
    averageETA: number;
    freeSpaceOnDisk: number;
    dhtnodes: number;
    peerConnections: number;
    queuedIOJobs: number;
  };

  // Torrent Analytics
  torrents: {
    total: number;
    active: number;
    downloading: number;
    seeding: number;
    paused: number;
    completed: number;
    stalled: number;
    error: number;
    list: any[];
    categories: Record<string, number>;
    tags: Record<string, number>;
    states: Record<string, number>;
    trackers: Record<string, number>;
    sizes: {
      totalSize: number;
      totalDownloaded: number;
      totalUploaded: number;
      averageSize: number;
      largestTorrent: number;
      smallestTorrent: number;
    };
    ratios: {
      averageRatio: number;
      highestRatio: number;
      lowestRatio: number;
      ratioDistribution: Record<string, number>;
    };
    speeds: {
      totalDownloadSpeed: number;
      totalUploadSpeed: number;
      averageDownloadSpeed: number;
      averageUploadSpeed: number;
      fastestDownload: number;
      fastestUpload: number;
    };
  };

  // Transfer Analytics
  transfer: {
    downloadSpeed: number;
    uploadSpeed: number;
    downloadLimit: number;
    uploadLimit: number;
    downloadData: number;
    uploadData: number;
    connectionStatus: string;
    alternativeSpeedLimits: boolean;
    queueingEnabled: boolean;
    maxActiveDownloads: number;
    maxActiveTorrents: number;
    maxActiveUploads: number;
  };

  // Performance Analytics
  performance: {
    averageQueueTime: number;
    readCacheHits: string;
    readCacheOverload: string;
    writeCacheOverload: string;
    totalBuffersSize: number;
    totalQueuedSize: number;
    totalWastedSession: number;
    refreshInterval: number;
    ioEfficiency: number;
    networkEfficiency: number;
  };

  // Storage Analytics
  storage: {
    freeSpace: number;
    totalUsed: number;
    diskUsageByCategory: Record<string, number>;
    savePaths: Record<string, number>;
    averageTorrentSize: number;
    storageEfficiency: number;
  };

  // Categories & Organization
  categories: {
    available: any[];
    usage: Record<string, number>;
    totalCategories: number;
  };

  // Tags & Organization
  tags: {
    available: string[];
    usage: Record<string, number>;
    totalTags: number;
  };

  // Network Analytics
  network: {
    connectionStatus: string;
    dhtNodes: number;
    totalPeerConnections: number;
    incomingConnections: number;
    outgoingConnections: number;
    bannedIPs: number;
    portStatus: string;
    upnpEnabled: boolean;
    encryptionMode: string;
  };

  // Health & Monitoring
  health: {
    online: boolean;
    loginRequired: boolean;
    apiVersion: string;
    lastCheck: Date;
    diskSpaceOk: boolean;
    networkOk: boolean;
    errors: string[];
    warnings: string[];
    performanceIssues: string[];
  };
}

export class QBittorrentCollector {
  private client: QBittorrentAPI;

  constructor(config: { url: string; username: string; password: string }) {
    this.client = createQBittorrentClient(config);
  }

  async collect(): Promise<QBittorrentMetrics> {
    try {
      logger.info('Starting comprehensive qBittorrent metrics collection...');

      // Collect data from multiple endpoints in parallel for efficiency
      const [
        version,
        apiVersion,
        buildInfo,
        preferences,
        mainData,
        torrents,
        categories,
        tags,
        transferInfo,
        downloadLimit,
        uploadLimit,
        speedLimitsMode
      ] = await Promise.allSettled([
        this.getVersion(),
        this.getAPIVersion(),
        this.getBuildInfo(),
        this.getPreferences(),
        this.getMainData(),
        this.getTorrents(),
        this.getCategories(),
        this.getTags(),
        this.getGlobalTransferInfo(),
        this.getGlobalDownloadLimit(),
        this.getGlobalUploadLimit(),
        this.getSpeedLimitsMode()
      ]);

      // Process and aggregate the data
      const metrics = this.processMetrics({
        version,
        apiVersion,
        buildInfo,
        preferences,
        mainData,
        torrents,
        categories,
        tags,
        transferInfo,
        downloadLimit,
        uploadLimit,
        speedLimitsMode
      });

      logger.info('qBittorrent metrics collection completed successfully');
      return metrics;
    } catch (error) {
      logger.error('Failed to collect qBittorrent metrics:', error);
      throw error;
    }
  }

  private async getVersion() {
    return this.client.getVersion();
  }

  private async getAPIVersion() {
    return this.client.getAPIVersion();
  }

  private async getBuildInfo() {
    return this.client.getBuildInfo();
  }

  private async getPreferences() {
    return this.client.getPreferences();
  }

  private async getMainData() {
    return this.client.getMainData();
  }

  private async getTorrents() {
    return this.client.getTorrents();
  }

  private async getCategories() {
    return this.client.getCategories();
  }

  private async getTags() {
    return this.client.getTags();
  }

  private async getGlobalTransferInfo() {
    return this.client.getGlobalTransferInfo();
  }

  private async getGlobalDownloadLimit() {
    return this.client.getGlobalDownloadLimit();
  }

  private async getGlobalUploadLimit() {
    return this.client.getGlobalUploadLimit();
  }

  private async getSpeedLimitsMode() {
    return this.client.getSpeedLimitsMode();
  }

  private processMetrics(data: Record<string, PromiseSettledResult<any>>): QBittorrentMetrics {
    // Helper function to safely extract data from promise results
    const getResult = (result: PromiseSettledResult<any>) => 
      result.status === 'fulfilled' ? result.value : null;

    // Extract all the data
    const versionData = getResult(data.version) || 'unknown';
    const apiVersionData = getResult(data.apiVersion) || 'unknown';
    const buildInfoData = getResult(data.buildInfo) || {};
    const preferencesData = getResult(data.preferences) || {};
    const mainDataResult = getResult(data.mainData) || {};
    const torrentsData = getResult(data.torrents) || [];
    const categoriesData = getResult(data.categories) || {};
    const tagsData = getResult(data.tags) || [];
    const transferInfoData = getResult(data.transferInfo) || {};
    const downloadLimitData = getResult(data.downloadLimit) || 0;
    const uploadLimitData = getResult(data.uploadLimit) || 0;
    const speedLimitsModeData = getResult(data.speedLimitsMode) || 0;

    // Extract server state from main data
    const serverState = mainDataResult.server_state || {};
    const torrentsMap = mainDataResult.torrents || {};
    const torrentsList = Object.values(torrentsMap);

    // Process torrent analytics
    const torrentAnalytics = this.processTorrentAnalytics(torrentsList);
    const categoryAnalytics = this.processCategoryAnalytics(torrentsList);
    const tagAnalytics = this.processTagAnalytics(torrentsList);
    const networkAnalytics = this.processNetworkAnalytics(serverState, preferencesData);
    const performanceAnalytics = this.processPerformanceAnalytics(serverState);
    const storageAnalytics = this.processStorageAnalytics(torrentsList, serverState);

    return {
      // System Information
      system: {
        version: versionData,
        buildInfo: buildInfoData,
        preferences: preferencesData,
        serverState: serverState,
      },

      // Core Statistics
      stats: {
        totalTorrents: torrentsList.length,
        activeTorrents: torrentAnalytics.active,
        downloadingTorrents: torrentAnalytics.downloading,
        seedingTorrents: torrentAnalytics.seeding,
        pausedTorrents: torrentAnalytics.paused,
        completedTorrents: torrentAnalytics.completed,
        stalledTorrents: torrentAnalytics.stalled,
        errorTorrents: torrentAnalytics.error,
        globalDownloadSpeed: serverState.dl_info_speed || 0,
        globalUploadSpeed: serverState.up_info_speed || 0,
        totalDownloaded: serverState.alltime_dl || 0,
        totalUploaded: serverState.alltime_ul || 0,
        sessionDownloaded: serverState.dl_info_data || 0,
        sessionUploaded: serverState.up_info_data || 0,
        globalRatio: parseFloat(serverState.global_ratio || '0'),
        averageETA: this.calculateAverageETA(torrentsList),
        freeSpaceOnDisk: serverState.free_space_on_disk || 0,
        dhtnodes: serverState.dht_nodes || 0,
        peerConnections: serverState.total_peer_connections || 0,
        queuedIOJobs: serverState.queued_io_jobs || 0,
      },

      // Torrent Analytics
      torrents: {
        total: torrentsList.length,
        active: torrentAnalytics.active,
        downloading: torrentAnalytics.downloading,
        seeding: torrentAnalytics.seeding,
        paused: torrentAnalytics.paused,
        completed: torrentAnalytics.completed,
        stalled: torrentAnalytics.stalled,
        error: torrentAnalytics.error,
        list: torrentsList,
        categories: categoryAnalytics.usage,
        tags: tagAnalytics.usage,
        states: torrentAnalytics.states,
        trackers: this.analyzeTrackers(torrentsList),
        sizes: {
          totalSize: torrentAnalytics.totalSize,
          totalDownloaded: torrentAnalytics.totalDownloaded,
          totalUploaded: torrentAnalytics.totalUploaded,
          averageSize: torrentAnalytics.averageSize,
          largestTorrent: torrentAnalytics.largestTorrent,
          smallestTorrent: torrentAnalytics.smallestTorrent,
        },
        ratios: {
          averageRatio: torrentAnalytics.averageRatio,
          highestRatio: torrentAnalytics.highestRatio,
          lowestRatio: torrentAnalytics.lowestRatio,
          ratioDistribution: this.analyzeRatioDistribution(torrentsList),
        },
        speeds: {
          totalDownloadSpeed: torrentAnalytics.totalDownloadSpeed,
          totalUploadSpeed: torrentAnalytics.totalUploadSpeed,
          averageDownloadSpeed: torrentAnalytics.averageDownloadSpeed,
          averageUploadSpeed: torrentAnalytics.averageUploadSpeed,
          fastestDownload: torrentAnalytics.fastestDownload,
          fastestUpload: torrentAnalytics.fastestUpload,
        },
      },

      // Transfer Analytics
      transfer: {
        downloadSpeed: transferInfoData.dl_info_speed || serverState.dl_info_speed || 0,
        uploadSpeed: transferInfoData.up_info_speed || serverState.up_info_speed || 0,
        downloadLimit: downloadLimitData,
        uploadLimit: uploadLimitData,
        downloadData: transferInfoData.dl_info_data || serverState.dl_info_data || 0,
        uploadData: transferInfoData.up_info_data || serverState.up_info_data || 0,
        connectionStatus: transferInfoData.connection_status || serverState.connection_status || 'unknown',
        alternativeSpeedLimits: speedLimitsModeData === 1,
        queueingEnabled: serverState.queueing || false,
        maxActiveDownloads: preferencesData.max_active_downloads || 0,
        maxActiveTorrents: preferencesData.max_active_torrents || 0,
        maxActiveUploads: preferencesData.max_active_uploads || 0,
      },

      // Performance Analytics
      performance: {
        averageQueueTime: serverState.average_time_queue || 0,
        readCacheHits: serverState.read_cache_hits || '0%',
        readCacheOverload: serverState.read_cache_overload || '0%',
        writeCacheOverload: serverState.write_cache_overload || '0%',
        totalBuffersSize: serverState.total_buffers_size || 0,
        totalQueuedSize: serverState.total_queued_size || 0,
        totalWastedSession: serverState.total_wasted_session || 0,
        refreshInterval: serverState.refresh_interval || 1500,
        ioEfficiency: performanceAnalytics.ioEfficiency,
        networkEfficiency: performanceAnalytics.networkEfficiency,
      },

      // Storage Analytics
      storage: {
        freeSpace: serverState.free_space_on_disk || 0,
        totalUsed: storageAnalytics.totalUsed,
        diskUsageByCategory: storageAnalytics.byCategory,
        savePaths: storageAnalytics.savePaths,
        averageTorrentSize: storageAnalytics.averageSize,
        storageEfficiency: storageAnalytics.efficiency,
      },

      // Categories & Organization
      categories: {
        available: Object.entries(categoriesData).map(([name, data]: [string, any]) => ({
          name,
          ...data
        })),
        usage: categoryAnalytics.usage,
        totalCategories: Object.keys(categoriesData).length,
      },

      // Tags & Organization
      tags: {
        available: tagsData,
        usage: tagAnalytics.usage,
        totalTags: tagsData.length,
      },

      // Network Analytics
      network: {
        connectionStatus: serverState.connection_status || 'unknown',
        dhtNodes: serverState.dht_nodes || 0,
        totalPeerConnections: serverState.total_peer_connections || 0,
        incomingConnections: networkAnalytics.incoming,
        outgoingConnections: networkAnalytics.outgoing,
        bannedIPs: networkAnalytics.bannedIPs,
        portStatus: networkAnalytics.portStatus,
        upnpEnabled: preferencesData.upnp || false,
        encryptionMode: this.getEncryptionMode(preferencesData.encryption),
      },

      // Health & Monitoring
      health: {
        online: true, // If we got data, it's online
        loginRequired: true, // qBittorrent always requires login
        apiVersion: apiVersionData,
        lastCheck: new Date(),
        diskSpaceOk: (serverState.free_space_on_disk || 0) > 1024 * 1024 * 1024, // 1GB threshold
        networkOk: serverState.connection_status === 'connected',
        errors: this.extractErrors(torrentsList),
        warnings: this.extractWarnings(serverState, preferencesData),
        performanceIssues: this.identifyPerformanceIssues(serverState, performanceAnalytics),
      },
    };
  }

  private processTorrentAnalytics(torrents: any[]) {
    const analytics = {
      active: 0,
      downloading: 0,
      seeding: 0,
      paused: 0,
      completed: 0,
      stalled: 0,
      error: 0,
      states: {} as Record<string, number>,
      totalSize: 0,
      totalDownloaded: 0,
      totalUploaded: 0,
      averageSize: 0,
      largestTorrent: 0,
      smallestTorrent: Number.MAX_SAFE_INTEGER,
      averageRatio: 0,
      highestRatio: 0,
      lowestRatio: Number.MAX_SAFE_INTEGER,
      totalDownloadSpeed: 0,
      totalUploadSpeed: 0,
      averageDownloadSpeed: 0,
      averageUploadSpeed: 0,
      fastestDownload: 0,
      fastestUpload: 0,
    };

    if (torrents.length === 0) {
      analytics.smallestTorrent = 0;
      analytics.lowestRatio = 0;
      return analytics;
    }

    let totalRatio = 0;
    let activeDownloadSpeed = 0;
    let activeUploadSpeed = 0;
    let activeTorrentsCount = 0;

    torrents.forEach((torrent: any) => {
      const state = torrent.state || 'unknown';
      const size = torrent.size || 0;
      const downloaded = torrent.downloaded || 0;
      const uploaded = torrent.uploaded || 0;
      const ratio = torrent.ratio || 0;
      const dlspeed = torrent.dlspeed || 0;
      const upspeed = torrent.upspeed || 0;

      // Count by state
      analytics.states[state] = (analytics.states[state] || 0) + 1;

      // Categorize torrents
      if (state.includes('downloading')) analytics.downloading++;
      if (state.includes('seeding') || state.includes('uploading')) analytics.seeding++;
      if (state.includes('paused')) analytics.paused++;
      if (state.includes('completed')) analytics.completed++;
      if (state.includes('stalled')) analytics.stalled++;
      if (state.includes('error')) analytics.error++;
      if (dlspeed > 0 || upspeed > 0) {
        analytics.active++;
        activeTorrentsCount++;
        activeDownloadSpeed += dlspeed;
        activeUploadSpeed += upspeed;
      }

      // Size analytics
      analytics.totalSize += size;
      analytics.totalDownloaded += downloaded;
      analytics.totalUploaded += uploaded;
      analytics.largestTorrent = Math.max(analytics.largestTorrent, size);
      analytics.smallestTorrent = Math.min(analytics.smallestTorrent, size);

      // Ratio analytics
      totalRatio += ratio;
      analytics.highestRatio = Math.max(analytics.highestRatio, ratio);
      analytics.lowestRatio = Math.min(analytics.lowestRatio, ratio);

      // Speed analytics
      analytics.totalDownloadSpeed += dlspeed;
      analytics.totalUploadSpeed += upspeed;
      analytics.fastestDownload = Math.max(analytics.fastestDownload, dlspeed);
      analytics.fastestUpload = Math.max(analytics.fastestUpload, upspeed);
    });

    analytics.averageSize = analytics.totalSize / torrents.length;
    analytics.averageRatio = totalRatio / torrents.length;
    analytics.averageDownloadSpeed = activeTorrentsCount > 0 ? activeDownloadSpeed / activeTorrentsCount : 0;
    analytics.averageUploadSpeed = activeTorrentsCount > 0 ? activeUploadSpeed / activeTorrentsCount : 0;

    return analytics;
  }

  private processCategoryAnalytics(torrents: any[]) {
    const usage: Record<string, number> = {};
    
    torrents.forEach((torrent: any) => {
      const category = torrent.category || 'uncategorized';
      usage[category] = (usage[category] || 0) + 1;
    });

    return { usage };
  }

  private processTagAnalytics(torrents: any[]) {
    const usage: Record<string, number> = {};
    
    torrents.forEach((torrent: any) => {
      const tags = torrent.tags ? torrent.tags.split(',').map((tag: string) => tag.trim()) : [];
      tags.forEach((tag: string) => {
        if (tag) usage[tag] = (usage[tag] || 0) + 1;
      });
    });

    return { usage };
  }

  private processNetworkAnalytics(serverState: any, preferences: any) {
    return {
      incoming: Math.floor((serverState.total_peer_connections || 0) * 0.6), // Estimate
      outgoing: Math.floor((serverState.total_peer_connections || 0) * 0.4), // Estimate
      bannedIPs: 0, // Would need separate endpoint to get banned IPs
      portStatus: preferences.random_port ? 'random' : 'fixed',
    };
  }

  private processPerformanceAnalytics(serverState: any) {
    const cacheHits = parseFloat(serverState.read_cache_hits?.replace('%', '') || '0');
    const cacheOverload = parseFloat(serverState.read_cache_overload?.replace('%', '') || '0');
    const writeOverload = parseFloat(serverState.write_cache_overload?.replace('%', '') || '0');

    return {
      ioEfficiency: Math.max(0, 100 - cacheOverload - writeOverload),
      networkEfficiency: Math.min(100, cacheHits),
    };
  }

  private processStorageAnalytics(torrents: any[], serverState: any) {
    const byCategory: Record<string, number> = {};
    const savePaths: Record<string, number> = {};
    let totalUsed = 0;

    torrents.forEach((torrent: any) => {
      const category = torrent.category || 'uncategorized';
      const savePath = torrent.save_path || 'unknown';
      const size = torrent.completed || torrent.size || 0;

      byCategory[category] = (byCategory[category] || 0) + size;
      savePaths[savePath] = (savePaths[savePath] || 0) + size;
      totalUsed += size;
    });

    const averageSize = torrents.length > 0 ? totalUsed / torrents.length : 0;
    const freeSpace = serverState.free_space_on_disk || 0;
    const efficiency = freeSpace > 0 ? (totalUsed / (totalUsed + freeSpace)) * 100 : 0;

    return {
      totalUsed,
      byCategory,
      savePaths,
      averageSize,
      efficiency,
    };
  }

  private calculateAverageETA(torrents: any[]): number {
    const activeTorrents = torrents.filter((t: any) => t.eta && t.eta > 0);
    if (activeTorrents.length === 0) return 0;
    
    const totalETA = activeTorrents.reduce((sum: number, t: any) => sum + t.eta, 0);
    return totalETA / activeTorrents.length;
  }

  private analyzeTrackers(torrents: any[]): Record<string, number> {
    const trackers: Record<string, number> = {};
    
    torrents.forEach((torrent: any) => {
      if (torrent.tracker) {
        try {
          const domain = new URL(torrent.tracker).hostname;
          trackers[domain] = (trackers[domain] || 0) + 1;
        } catch {
          trackers['unknown'] = (trackers['unknown'] || 0) + 1;
        }
      }
    });

    return trackers;
  }

  private analyzeRatioDistribution(torrents: any[]): Record<string, number> {
    const distribution: Record<string, number> = {
      '0.0-0.5': 0,
      '0.5-1.0': 0,
      '1.0-2.0': 0,
      '2.0-5.0': 0,
      '5.0+': 0,
    };

    torrents.forEach((torrent: any) => {
      const ratio = torrent.ratio || 0;
      if (ratio < 0.5) distribution['0.0-0.5']++;
      else if (ratio < 1.0) distribution['0.5-1.0']++;
      else if (ratio < 2.0) distribution['1.0-2.0']++;
      else if (ratio < 5.0) distribution['2.0-5.0']++;
      else distribution['5.0+']++;
    });

    return distribution;
  }

  private getEncryptionMode(encryption: number): string {
    switch (encryption) {
      case 0: return 'disabled';
      case 1: return 'enabled';
      case 2: return 'forced';
      default: return 'unknown';
    }
  }

  private extractErrors(torrents: any[]): string[] {
    return torrents
      .filter((torrent: any) => torrent.state && torrent.state.includes('error'))
      .map((torrent: any) => `Error in torrent: ${torrent.name}`)
      .slice(0, 10); // Limit to 10 errors
  }

  private extractWarnings(serverState: any, preferences: any): string[] {
    const warnings: string[] = [];

    if ((serverState.free_space_on_disk || 0) < 1024 * 1024 * 1024) {
      warnings.push('Low disk space (< 1GB)');
    }

    if (serverState.connection_status !== 'connected') {
      warnings.push(`Connection status: ${serverState.connection_status}`);
    }

    if (parseFloat(serverState.read_cache_overload?.replace('%', '') || '0') > 80) {
      warnings.push('High read cache overload');
    }

    if (parseFloat(serverState.write_cache_overload?.replace('%', '') || '0') > 80) {
      warnings.push('High write cache overload');
    }

    return warnings;
  }

  private identifyPerformanceIssues(serverState: any, performanceAnalytics: any): string[] {
    const issues: string[] = [];

    if (performanceAnalytics.ioEfficiency < 70) {
      issues.push('Low I/O efficiency');
    }

    if (performanceAnalytics.networkEfficiency < 50) {
      issues.push('Low network efficiency');
    }

    if ((serverState.queued_io_jobs || 0) > 100) {
      issues.push('High I/O queue backlog');
    }

    if ((serverState.total_wasted_session || 0) > 1024 * 1024 * 100) { // 100MB
      issues.push('High session waste');
    }

    return issues;
  }
}

// Export factory function for creating collector instances
export function createQBittorrentCollector(config: { url: string; username: string; password: string }) {
  return new QBittorrentCollector(config);
}
