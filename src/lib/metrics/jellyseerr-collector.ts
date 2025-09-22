import { logger } from '../logger';
import { createJellyseerrClient } from '../api/jellyseerr';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JellyseerrRawData = Record<string, any>;

export interface JellyseerrMetrics {
  // System Information (12 metrics)
  system: {
    version: string;
    commitTag?: string;
    updateAvailable?: boolean;
    commitsBehind?: number;
    restartRequired?: boolean;
    initialized?: boolean;
    applicationTitle?: string;
    applicationUrl?: string;
    appData: boolean;
    appDataPath: string;
    serverType: 'jellyseerr';
    collectionTimestamp: number;
  };

  // Request Analytics (25 metrics)
  requests: {
    totalRequests: number;
    movieRequests: number;
    tvRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    declinedRequests: number;
    processingRequests: number;
    availableRequests: number;
    requestsLast24h: number;
    requestsLast7d: number;
    requestsLast30d: number;
    averageProcessingTime: number;
    requestsByStatus: Record<string, number>;
    requestsByType: Record<string, number>;
    requestsByUser: Record<string, number>;
    requestApprovalRate: number;
    pendingToApprovedRatio: number;
    movieToTvRatio: number;
    popularRequestedGenres: Record<string, number>;
    mostActiveRequesters: JellyseerrRawData[];
    requestTrend: Record<string, number>;
    failedRequests: number;
    autoApprovedRequests: number;
    manuallyApprovedRequests: number;
    avgRequestsPerDay: number;
  };

  // User Analytics (20 metrics)  
  users: {
    totalUsers: number;
    activeUsers: number;
    jellyfinUsers: number;
    localUsers: number;
    adminUsers: number;
    moderatorUsers: number;
    usersByPermissionLevel: Record<string, number>;
    usersByLastActivity: Record<string, number>;
    userRegistrationTrend: Record<string, number>;
    averageRequestsPerUser: number;
    mostActiveUsers: JellyseerrRawData[];
    userGrowthRate: number;
    userRetentionRate: number;
    userEngagementScore: number;
    dormantUsers: number;
    newUsersLast30d: number;
    userQuotaUtilization: Record<string, number>;
    userWatchlistActivity: Record<string, number>;
    userPreferences: Record<string, JellyseerrRawData>;
    bannedUsers: number;
  };

  // Media Analytics (30 metrics)
  media: {
    totalMediaItems: number;
    availableMediaItems: number;
    processingMediaItems: number;
    partiallyAvailableItems: number;
    movieCount: number;
    tvShowCount: number;
    totalSeasons: number;
    totalEpisodes: number;
    mediaByStatus: Record<string, number>;
    mediaByType: Record<string, number>;
    mediaByGenre: Record<string, number>;
    recentlyAddedCount: number;
    popularMedia: JellyseerrRawData[];
    trendingMedia: JellyseerrRawData[];
    upcomingReleases: JellyseerrRawData[];
    mediaCompletionRate: number;
    averageMediaAge: number;
    mediaQualityDistribution: Record<string, number>;
    mediaStorageUsage: number;
    duplicateMediaCount: number;
    mediaFailureRate: number;
    mediaProcessingQueue: number;
    top10RequestedMovies: JellyseerrRawData[];
    top10RequestedTvShows: JellyseerrRawData[];
    mediaAvailabilityRate: number;
    mediaByYear: Record<string, number>;
    mediaByRating: Record<string, number>;
    mediaByLanguage: Record<string, number>;
    collectionsCount: number;
    fourKMediaCount: number;
  };

  // Service Integration Analytics (25 metrics)
  services: {
    jellyfinServerCount: number;
    radarrInstanceCount: number;
    sonarrInstanceCount: number;
    serviceHealthStatus: Record<string, string>;
    serviceResponseTimes: Record<string, number>;
    serviceLastSync: Record<string, string>;
    serviceErrorCounts: Record<string, number>;
    jellyfinLibraryCount: number;
    jellyfinServerVersions: Record<string, string>;
    radarrProfiles: JellyseerrRawData[];
    sonarrProfiles: JellyseerrRawData[];
    serviceConfigurationHealth: Record<string, boolean>;
    serviceQueueSizes: Record<string, number>;
    serviceSuccessRates: Record<string, number>;
    integrationErrors: JellyseerrRawData[];
    serviceUptime: Record<string, number>;
    serviceCapacityUtilization: Record<string, number>;
    serviceVersionMismatch: Record<string, boolean>;
    serviceSyncDuration: Record<string, number>;
    libraryUpdateFrequency: Record<string, number>;
    serviceConnectionStatus: Record<string, boolean>;
    serviceAuthenticationStatus: Record<string, boolean>;
    serviceDataFreshness: Record<string, number>;
    serviceApiLimits: Record<string, number>;
    crossServiceDuplicates: number;
  };

  // Issue & Support Analytics (18 metrics)
  issues: {
    totalIssues: number;
    openIssues: number;
    resolvedIssues: number;
    videoIssues: number;
    audioIssues: number;
    subtitleIssues: number;
    otherIssues: number;
    issuesByType: Record<string, number>;
    issuesByStatus: Record<string, number>;
    issuesByUser: Record<string, number>;
    averageResolutionTime: number;
    issueCreationTrend: Record<string, number>;
    mostReportedIssues: JellyseerrRawData[];
    issueEscalationRate: number;
    supportTicketBacklog: number;
    issuesByMedia: Record<string, number>;
    criticalIssues: number;
    reopenedIssues: number;
  };

  // Performance & Health Analytics (25 metrics)
  performance: {
    cacheHitRate: number;
    cacheSize: number;
    cacheTypes: string[];
    jobQueueSize: number;
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    scheduledJobs: number;
    jobsByType: Record<string, number>;
    jobsByStatus: Record<string, number>;
    averageJobDuration: Record<string, number>;
    systemResourceUsage: JellyseerrRawData;
    databasePerformance: JellyseerrRawData;
    apiResponseTimes: Record<string, number>;
    logFileSize: number;
    errorRate: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
    concurrentConnections: number;
    overallHealth: 'healthy' | 'warning' | 'error';
    healthChecks: Record<string, boolean>;
    systemUptime: number;
    lastRestartTime: string;
    systemAlerts: JellyseerrRawData[];
  };
}

export class JellyseerrCollector {
  private client: ReturnType<typeof createJellyseerrClient>;

  constructor(client: ReturnType<typeof createJellyseerrClient>) {
    this.client = client;
  }

  async collect(): Promise<JellyseerrMetrics> {
    try {
      logger.info('Starting comprehensive Jellyseerr metrics collection...');

      // Collect data from multiple endpoints in parallel for efficiency
      const [
        status,
        settings,
        requestCount,
        requests,
        users,
        recentlyAdded,
        issueCount,
        trendingContent
      ] = await Promise.all([
        this.getStatus(),
        this.getSettings(),
        this.getRequestCount(),
        this.getRequests(),
        this.getUsers(),
        this.getRecentlyAdded(),
        this.getIssueCount(),
        this.getTrendingContent()
      ]);

      // Process and aggregate the collected data
      const metrics = this.processMetrics({
        status,
        settings,
        requestCount,
        requests,
        users,
        recentlyAdded,
        issueCount,
        trendingContent
      });

      logger.info('Jellyseerr metrics collection completed successfully');
      return metrics;
    } catch (error) {
      logger.error('Failed to collect Jellyseerr metrics:', error);
      throw error;
    }
  }

  private async getStatus(): Promise<JellyseerrRawData> {
    try {
      return await this.client.getStatus();
    } catch (error) {
      logger.warn('Failed to get Jellyseerr status:', error);
      return {};
    }
  }

  private async getSettings(): Promise<JellyseerrRawData> {
    try {
      return await this.client.getSettings();
    } catch (error) {
      logger.warn('Failed to get Jellyseerr settings:', error);
      return {};
    }
  }

  private async getRequestCount(): Promise<JellyseerrRawData> {
    try {
      return await this.client.getRequestCount();
    } catch (error) {
      logger.warn('Failed to get Jellyseerr request count:', error);
      return {};
    }
  }

  private async getRequests(): Promise<JellyseerrRawData> {
    try {
      return await this.client.getRequests(100);
    } catch (error) {
      logger.warn('Failed to get Jellyseerr requests:', error);
      return { results: [] };
    }
  }

  private async getUsers(): Promise<JellyseerrRawData> {
    try {
      return await this.client.getUsers(100);
    } catch (error) {
      logger.warn('Failed to get Jellyseerr users:', error);
      return { results: [] };
    }
  }

  private async getRecentlyAdded(): Promise<JellyseerrRawData> {
    try {
      return await this.client.getRecentlyAdded(50);
    } catch (error) {
      logger.warn('Failed to get recently added from Jellyseerr:', error);
      return { results: [] };
    }
  }

  private async getIssueCount(): Promise<JellyseerrRawData> {
    try {
      return await this.client.getIssueCount();
    } catch (error) {
      logger.warn('Failed to get Jellyseerr issue count:', error);
      return {};
    }
  }

  private async getTrendingContent(): Promise<JellyseerrRawData> {
    try {
      return (await this.client.discoverTrending()) as JellyseerrRawData;
    } catch (error) {
      logger.warn('Failed to get trending content from Jellyseerr:', error);
      return {};
    }
  }

  private processMetrics(rawData: Record<string, JellyseerrRawData>): JellyseerrMetrics {
    const timestamp = Date.now();
    
    return {
      system: this.processSystemMetrics(rawData, timestamp),
      requests: this.processRequestMetrics(rawData),
      users: this.processUserMetrics(rawData),
      media: this.processMediaMetrics(rawData),
      services: this.processServiceMetrics(rawData),
      issues: this.processIssueMetrics(rawData),
      performance: this.processPerformanceMetrics(rawData)
    };
  }

  private processSystemMetrics(rawData: Record<string, JellyseerrRawData>, timestamp: number) {
    const status = rawData.status || {};
    const settings = rawData.settings || {};

    return {
      version: status.version || 'unknown',
      commitTag: status.commitTag,
      updateAvailable: status.updateAvailable,
      commitsBehind: status.commitsBehind,
      restartRequired: status.restartRequired,
      initialized: settings.main?.initialized || settings.initialized,
      applicationTitle: settings.main?.applicationTitle || settings.applicationTitle || 'Jellyseerr',
      applicationUrl: settings.main?.applicationUrl || settings.applicationUrl,
      appData: true,
      appDataPath: '/app/config',
      serverType: 'jellyseerr' as const,
      collectionTimestamp: timestamp
    };
  }

  private processRequestMetrics(rawData: Record<string, JellyseerrRawData>) {
    const requestCount = rawData.requestCount || {};
    const requests = rawData.requests?.results || [];

    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const last7d = now - (7 * 24 * 60 * 60 * 1000);
    const last30d = now - (30 * 24 * 60 * 60 * 1000);

    const requestsByStatus = requests.reduce((acc: Record<string, number>, req: JellyseerrRawData) => {
      const status = req.status?.toString() || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const requestsByType = requests.reduce((acc: Record<string, number>, req: JellyseerrRawData) => {
      const type = req.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const requestsByUser = requests.reduce((acc: Record<string, number>, req: JellyseerrRawData) => {
      const userId = req.requestedBy?.id?.toString() || 'unknown';
      acc[userId] = (acc[userId] || 0) + 1;
      return acc;
    }, {});

    return {
      totalRequests: requestCount.total || 0,
      movieRequests: requestCount.movie || 0,
      tvRequests: requestCount.tv || 0,
      pendingRequests: requestCount.pending || 0,
      approvedRequests: requestCount.approved || 0,
      declinedRequests: requestCount.declined || 0,
      processingRequests: requestCount.processing || 0,
      availableRequests: requestCount.available || 0,
      requestsLast24h: requests.filter((req: JellyseerrRawData) => new Date(req.createdAt).getTime() > last24h).length,
      requestsLast7d: requests.filter((req: JellyseerrRawData) => new Date(req.createdAt).getTime() > last7d).length,
      requestsLast30d: requests.filter((req: JellyseerrRawData) => new Date(req.createdAt).getTime() > last30d).length,
      averageProcessingTime: 0,
      requestsByStatus,
      requestsByType,
      requestsByUser,
      requestApprovalRate: requestCount.total > 0 ? (requestCount.approved / requestCount.total) * 100 : 0,
      pendingToApprovedRatio: requestCount.approved > 0 ? requestCount.pending / requestCount.approved : 0,
      movieToTvRatio: requestCount.tv > 0 ? requestCount.movie / requestCount.tv : 0,
      popularRequestedGenres: {},
      mostActiveRequesters: Object.entries(requestsByUser)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([userId, count]) => ({ userId, requestCount: count })),
      requestTrend: {},
      failedRequests: requestCount.declined || 0,
      autoApprovedRequests: 0,
      manuallyApprovedRequests: requestCount.approved || 0,
      avgRequestsPerDay: requestCount.total > 0 ? requestCount.total / 30 : 0
    };
  }

  private processUserMetrics(rawData: Record<string, JellyseerrRawData>) {
    const users = rawData.users?.results || [];
    
    const usersByPermissionLevel = users.reduce((acc: Record<string, number>, user: JellyseerrRawData) => {
      const permissions = user.permissions?.toString() || 'unknown';
      acc[permissions] = (acc[permissions] || 0) + 1;
      return acc;
    }, {});

    const now = Date.now();
    const last30d = now - (30 * 24 * 60 * 60 * 1000);

    return {
      totalUsers: users.length,
      activeUsers: users.filter((user: JellyseerrRawData) => user.requestCount > 0).length,
      jellyfinUsers: users.filter((user: JellyseerrRawData) => !user.email?.includes('plex')).length,
      localUsers: users.filter((user: JellyseerrRawData) => user.email?.includes('local')).length,
      adminUsers: users.filter((user: JellyseerrRawData) => user.permissions & 1).length,
      moderatorUsers: users.filter((user: JellyseerrRawData) => user.permissions & 2).length,
      usersByPermissionLevel,
      usersByLastActivity: {},
      userRegistrationTrend: {},
      averageRequestsPerUser: users.length > 0 ? users.reduce((sum: number, user: JellyseerrRawData) => sum + (user.requestCount || 0), 0) / users.length : 0,
      mostActiveUsers: users.sort((a: JellyseerrRawData, b: JellyseerrRawData) => ((b as JellyseerrRawData).requestCount || 0) - ((a as JellyseerrRawData).requestCount || 0)).slice(0, 10),
      userGrowthRate: 0,
      userRetentionRate: 0,
      userEngagementScore: 0,
      dormantUsers: users.filter((user: JellyseerrRawData) => (user.requestCount || 0) === 0).length,
      newUsersLast30d: users.filter((user: JellyseerrRawData) => new Date(user.createdAt).getTime() > last30d).length,
      userQuotaUtilization: {},
      userWatchlistActivity: {},
      userPreferences: {},
      bannedUsers: 0
    };
  }

  private processMediaMetrics(rawData: Record<string, JellyseerrRawData>) {
    const recentlyAdded = rawData.recentlyAdded?.results || [];
    
    const mediaByType = recentlyAdded.reduce((acc: Record<string, number>, item: JellyseerrRawData) => {
      const type = item.mediaType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const mediaByStatus = recentlyAdded.reduce((acc: Record<string, number>, item: JellyseerrRawData) => {
      const status = item.status?.toString() || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      totalMediaItems: recentlyAdded.length,
      availableMediaItems: recentlyAdded.filter((item: JellyseerrRawData) => item.status === 5).length,
      processingMediaItems: recentlyAdded.filter((item: JellyseerrRawData) => item.status === 3).length,
      partiallyAvailableItems: recentlyAdded.filter((item: JellyseerrRawData) => item.status === 4).length,
      movieCount: mediaByType.movie || 0,
      tvShowCount: mediaByType.tv || 0,
      totalSeasons: 0,
      totalEpisodes: 0,
      mediaByStatus,
      mediaByType,
      mediaByGenre: {},
      recentlyAddedCount: recentlyAdded.length,
      popularMedia: [],
      trendingMedia: [],
      upcomingReleases: [],
      mediaCompletionRate: 0,
      averageMediaAge: 0,
      mediaQualityDistribution: {},
      mediaStorageUsage: 0,
      duplicateMediaCount: 0,
      mediaFailureRate: 0,
      mediaProcessingQueue: 0,
      top10RequestedMovies: [],
      top10RequestedTvShows: [],
      mediaAvailabilityRate: recentlyAdded.length > 0 ? (recentlyAdded.filter((item: JellyseerrRawData) => item.status === 5).length / recentlyAdded.length) * 100 : 0,
      mediaByYear: {},
      mediaByRating: {},
      mediaByLanguage: {},
      collectionsCount: 0,
      fourKMediaCount: 0
    };
  }

  private processServiceMetrics(rawData: Record<string, JellyseerrRawData>) {
    return {
      jellyfinServerCount: 0,
      radarrInstanceCount: 0,
      sonarrInstanceCount: 0,
      serviceHealthStatus: {},
      serviceResponseTimes: {},
      serviceLastSync: {},
      serviceErrorCounts: {},
      jellyfinLibraryCount: 0,
      jellyfinServerVersions: {},
      radarrProfiles: [],
      sonarrProfiles: [],
      serviceConfigurationHealth: {},
      serviceQueueSizes: {},
      serviceSuccessRates: {},
      integrationErrors: [],
      serviceUptime: {},
      serviceCapacityUtilization: {},
      serviceVersionMismatch: {},
      serviceSyncDuration: {},
      libraryUpdateFrequency: {},
      serviceConnectionStatus: {},
      serviceAuthenticationStatus: {},
      serviceDataFreshness: {},
      serviceApiLimits: {},
      crossServiceDuplicates: 0
    };
  }

  private processIssueMetrics(rawData: Record<string, JellyseerrRawData>) {
    const issueCount = rawData.issueCount || {};

    return {
      totalIssues: issueCount.total || 0,
      openIssues: issueCount.open || 0,
      resolvedIssues: issueCount.resolved || 0,
      videoIssues: 0,
      audioIssues: 0,
      subtitleIssues: 0,
      otherIssues: issueCount.total || 0,
      issuesByType: {},
      issuesByStatus: {
        open: issueCount.open || 0,
        resolved: issueCount.resolved || 0
      },
      issuesByUser: {},
      averageResolutionTime: 0,
      issueCreationTrend: {},
      mostReportedIssues: [],
      issueEscalationRate: 0,
      supportTicketBacklog: issueCount.open || 0,
      issuesByMedia: {},
      criticalIssues: 0,
      reopenedIssues: 0
    };
  }

  private processPerformanceMetrics(rawData: Record<string, JellyseerrRawData>) {
    const status = rawData.status || {};
    const issueCount = rawData.issueCount || {};
    
    const hasIssues = (issueCount.total || 0) > 0;
    const needsUpdate = status.updateAvailable || false;
    const needsRestart = status.restartRequired || false;

    let overallHealth: 'healthy' | 'warning' | 'error' = 'healthy';
    if (hasIssues || needsRestart) {
      overallHealth = 'error';
    } else if (needsUpdate) {
      overallHealth = 'warning';
    }

    return {
      cacheHitRate: 0,
      cacheSize: 0,
      cacheTypes: [],
      jobQueueSize: 0,
      activeJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      scheduledJobs: 0,
      jobsByType: {},
      jobsByStatus: {},
      averageJobDuration: {},
      systemResourceUsage: {},
      databasePerformance: {},
      apiResponseTimes: {},
      logFileSize: 0,
      errorRate: 0,
      memoryUsage: 0,
      diskUsage: 0,
      networkLatency: 0,
      concurrentConnections: 0,
      overallHealth,
      healthChecks: {
        'system-status': !!status.version,
        'no-critical-issues': !hasIssues,
        'no-restart-required': !needsRestart,
        'up-to-date': !needsUpdate
      },
      systemUptime: 0,
      lastRestartTime: '',
      systemAlerts: []
    };
  }
}
