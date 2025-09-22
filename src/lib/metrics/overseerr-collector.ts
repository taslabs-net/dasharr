import { logger } from '../logger';
import { OverseerrAPI } from '../api/overseerr';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OverseerrRawData = Record<string, any>;

export interface OverseerrMetrics {
  // System Information (10 metrics)
  system: {
    version: string;
    commitTag: string;
    updateAvailable: boolean;
    commitsBehind: number;
    restartRequired: boolean;
    initialized: boolean;
    applicationTitle: string;
    applicationUrl?: string;
    appData: boolean;
    appDataPath: string;
    collectionTimestamp: number;
  };

  // Request Analytics (20 metrics)
  requests: {
    totalRequests: number;
    movieRequests: number;
    tvRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    declinedRequests: number;
    processingRequests: number;
    availableRequests: number;
    // Advanced request metrics
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
    mostActiveRequesters: OverseerrRawData[];
  };

  // User Analytics (15 metrics)
  users: {
    totalUsers: number;
    activeUsers: number;
    plexUsers: number;
    localUsers: number;
    adminUsers: number;
    moderatorUsers: number;
    // Advanced user metrics
    usersByPermissionLevel: Record<string, number>;
    usersByLastActivity: Record<string, number>;
    userRegistrationTrend: Record<string, number>;
    averageRequestsPerUser: number;
    mostActiveUsers: OverseerrRawData[];
    userGrowthRate: number;
    userRetentionRate: number;
    userEngagementScore: number;
    dormantUsers: number;
  };

  // Media Analytics (25 metrics)
  media: {
    totalMediaItems: number;
    availableMediaItems: number;
    processingMediaItems: number;
    partiallyAvailableItems: number;
    movieCount: number;
    tvShowCount: number;
    totalSeasons: number;
    totalEpisodes: number;
    // Advanced media metrics
    mediaByStatus: Record<string, number>;
    mediaByType: Record<string, number>;
    mediaByGenre: Record<string, number>;
    recentlyAddedCount: number;
    popularMedia: OverseerrRawData[];
    trendingMedia: OverseerrRawData[];
    upcomingReleases: OverseerrRawData[];
    mediaCompletionRate: number;
    averageMediaAge: number;
    mediaQualityDistribution: Record<string, number>;
    mediaStorageUsage: number;
    duplicateMediaCount: number;
    mediaFailureRate: number;
    mediaProcessingQueue: number;
    top10RequestedMovies: OverseerrRawData[];
    top10RequestedTvShows: OverseerrRawData[];
    mediaAvailabilityRate: number;
  };

  // Service Integration Analytics (20 metrics)
  services: {
    plexServerCount: number;
    radarrInstanceCount: number;
    sonarrInstanceCount: number;
    tautulliConnected: boolean;
    // Service health and performance
    serviceHealthStatus: Record<string, string>;
    serviceResponseTimes: Record<string, number>;
    serviceLastSync: Record<string, string>;
    serviceErrorCounts: Record<string, number>;
    plexLibraryCount: number;
    plexServerVersions: Record<string, string>;
    radarrProfiles: OverseerrRawData[];
    sonarrProfiles: OverseerrRawData[];
    serviceConfigurationHealth: Record<string, boolean>;
    serviceQueueSizes: Record<string, number>;
    serviceSuccessRates: Record<string, number>;
    integrationErrors: OverseerrRawData[];
    serviceUptime: Record<string, number>;
    serviceCapacityUtilization: Record<string, number>;
    serviceVersionMismatch: Record<string, boolean>;
    serviceSyncDuration: Record<string, number>;
  };

  // Issue & Support Analytics (15 metrics)
  issues: {
    totalIssues: number;
    openIssues: number;
    closedIssues: number;
    videoIssues: number;
    audioIssues: number;
    subtitleIssues: number;
    otherIssues: number;
    // Advanced issue analytics
    issuesByType: Record<string, number>;
    issuesByStatus: Record<string, number>;
    issuesByUser: Record<string, number>;
    averageResolutionTime: number;
    issueCreationTrend: Record<string, number>;
    mostReportedIssues: OverseerrRawData[];
    issueEscalationRate: number;
    supportTicketBacklog: number;
  };

  // Notification Analytics (20 metrics)
  notifications: {
    totalNotificationChannels: number;
    enabledNotifications: Record<string, boolean>;
    notificationTypes: string[];
    // Notification performance
    notificationsSentLast24h: number;
    notificationsSentLast7d: number;
    notificationDeliveryRate: Record<string, number>;
    notificationFailureRate: Record<string, number>;
    notificationResponseTimes: Record<string, number>;
    webhookEndpoints: number;
    emailNotificationCount: number;
    discordNotificationCount: number;
    slackNotificationCount: number;
    telegramNotificationCount: number;
    pushNotificationCount: number;
    notificationQueueSize: number;
    notificationTemplates: string[];
    notificationPreferences: Record<string, OverseerrRawData>;
    notificationHealth: Record<string, boolean>;
    notificationRetryCount: Record<string, number>;
    notificationLatency: Record<string, number>;
  };

  // System Performance Analytics (15 metrics)
  performance: {
    cacheHitRate: number;
    cacheSize: number;
    cacheTypes: string[];
    jobQueueSize: number;
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    // Advanced performance metrics
    jobsByType: Record<string, number>;
    jobsByStatus: Record<string, number>;
    averageJobDuration: Record<string, number>;
    systemResourceUsage: OverseerrRawData;
    databasePerformance: OverseerrRawData;
    apiResponseTimes: Record<string, number>;
    logFileSize: number;
    errorRate: number;
  };

  // Discovery & Search Analytics (10 metrics)
  discovery: {
    trendingMovies: OverseerrRawData[];
    trendingTvShows: OverseerrRawData[];
    popularMovies: OverseerrRawData[];
    popularTvShows: OverseerrRawData[];
    upcomingMovies: OverseerrRawData[];
    discoverSliders: OverseerrRawData[];
    searchQueriesLast24h: number;
    topSearchQueries: Record<string, number>;
    searchSuccessRate: number;
    discoverConfigurationHealth: boolean;
  };

  // Health & Monitoring (10 metrics)
  health: {
    overallHealth: 'healthy' | 'warning' | 'error';
    healthChecks: Record<string, boolean>;
    systemUptime: number;
    lastRestartTime: string;
    errorCount: number;
    warningCount: number;
    criticalAlerts: OverseerrRawData[];
    systemAlerts: OverseerrRawData[];
    maintenanceMode: boolean;
    backupStatus: OverseerrRawData;
  };
}

export class OverseerrCollector {
  private client: OverseerrAPI;

  constructor(client: OverseerrAPI) {
    this.client = client;
  }

  async collect(): Promise<OverseerrMetrics> {
    try {
      logger.info('Starting comprehensive Overseerr metrics collection...');

      // Collect data from multiple endpoints in parallel for efficiency
      const [
        status,
        appData,
        settings,
        requestCount,
        requests,
        users,
        currentUser,
        recentlyAdded,
        issueCount
      ] = await Promise.all([
        this.getStatus(),
        this.getAppData(),
        this.getSettings(),
        this.getRequestCount(),
        this.getRequests(),
        this.getUsers(),
        this.getCurrentUser(),
        this.getRecentlyAdded(),
        this.getIssueCount()
      ]);

      // Process and aggregate the collected data
      const metrics = this.processMetrics({
        status,
        appData,
        settings,
        requestCount,
        requests,
        users,
        currentUser,
        recentlyAdded,
        issueCount
      });

      logger.info('Overseerr metrics collection completed successfully');
      return metrics;
    } catch (error) {
      logger.error('Failed to collect Overseerr metrics:', error);
      throw error;
    }
  }

  private async getStatus(): Promise<OverseerrRawData> {
    try {
      return await this.client.getStatus();
    } catch (error) {
      logger.warn('Failed to get Overseerr status:', error);
      return {};
    }
  }

  private async getAppData(): Promise<OverseerrRawData> {
    // This would require extending the API client to include the /status/appdata endpoint
    // For now, return default values
    return { appData: true, appDataPath: '/app/config' };
  }

  private async getSettings(): Promise<OverseerrRawData> {
    try {
      return await this.client.getSettings();
    } catch (error) {
      logger.warn('Failed to get Overseerr settings:', error);
      return {};
    }
  }

  private async getRequestCount(): Promise<OverseerrRawData> {
    try {
      return await this.client.getRequestCount();
    } catch (error) {
      logger.warn('Failed to get Overseerr request count:', error);
      return {};
    }
  }

  private async getRequests(): Promise<OverseerrRawData> {
    try {
      return await this.client.getRequests(100); // Get more requests for better analytics
    } catch (error) {
      logger.warn('Failed to get Overseerr requests:', error);
      return { results: [] };
    }
  }

  private async getUsers(): Promise<OverseerrRawData> {
    try {
      return await this.client.getUsers(100); // Get more users for better analytics
    } catch (error) {
      logger.warn('Failed to get Overseerr users:', error);
      return { results: [] };
    }
  }

  private async getCurrentUser(): Promise<OverseerrRawData> {
    try {
      return await this.client.getCurrentUser();
    } catch (error) {
      logger.warn('Failed to get current Overseerr user:', error);
      return {};
    }
  }

  private async getRecentlyAdded(): Promise<OverseerrRawData> {
    try {
      return await this.client.getRecentlyAdded(50); // Get more recent items
    } catch (error) {
      logger.warn('Failed to get recently added from Overseerr:', error);
      return { results: [] };
    }
  }

  private async getIssueCount(): Promise<OverseerrRawData> {
    try {
      return await this.client.getIssueCount();
    } catch (error) {
      logger.warn('Failed to get Overseerr issue count:', error);
      return {};
    }
  }

  private processMetrics(rawData: Record<string, OverseerrRawData>): OverseerrMetrics {
    const timestamp = Date.now();
    
    return {
      system: this.processSystemMetrics(rawData, timestamp),
      requests: this.processRequestMetrics(rawData),
      users: this.processUserMetrics(rawData),
      media: this.processMediaMetrics(rawData),
      services: this.processServiceMetrics(rawData),
      issues: this.processIssueMetrics(rawData),
      notifications: this.processNotificationMetrics(rawData),
      performance: this.processPerformanceMetrics(rawData),
      discovery: this.processDiscoveryMetrics(rawData),
      health: this.processHealthMetrics(rawData)
    };
  }

  private processSystemMetrics(rawData: Record<string, OverseerrRawData>, timestamp: number) {
    const status = rawData.status || {};
    const appData = rawData.appData || {};
    const settings = rawData.settings || {};

    return {
      version: status.version || 'unknown',
      commitTag: status.commitTag || 'unknown',
      updateAvailable: status.updateAvailable || false,
      commitsBehind: status.commitsBehind || 0,
      restartRequired: status.restartRequired || false,
      initialized: settings.initialized || false,
      applicationTitle: settings.applicationTitle || 'Overseerr',
      applicationUrl: settings.applicationUrl,
      appData: appData.appData || false,
      appDataPath: appData.appDataPath || '/app/config',
      collectionTimestamp: timestamp
    };
  }

  private processRequestMetrics(rawData: Record<string, OverseerrRawData>) {
    const requestCount = rawData.requestCount || {};
    const requests = rawData.requests?.results || [];

    // Calculate advanced metrics from request data
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const last7d = now - (7 * 24 * 60 * 60 * 1000);
    const last30d = now - (30 * 24 * 60 * 60 * 1000);

    const recentRequests = requests.filter((req: OverseerrRawData) => {
      const createdAt = new Date(req.createdAt).getTime();
      return createdAt > last24h;
    });

    const requestsByStatus = requests.reduce((acc: Record<string, number>, req: OverseerrRawData) => {
      const status = req.status?.toString() || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const requestsByType = requests.reduce((acc: Record<string, number>, req: OverseerrRawData) => {
      const type = req.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
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
      requestsLast24h: recentRequests.length,
      requestsLast7d: requests.filter((req: OverseerrRawData) => new Date(req.createdAt).getTime() > last7d).length,
      requestsLast30d: requests.filter((req: OverseerrRawData) => new Date(req.createdAt).getTime() > last30d).length,
      averageProcessingTime: 0, // Would need more detailed timing data
      requestsByStatus,
      requestsByType,
      requestsByUser: {},
      requestApprovalRate: requestCount.total > 0 ? (requestCount.approved / requestCount.total) * 100 : 0,
      pendingToApprovedRatio: requestCount.approved > 0 ? requestCount.pending / requestCount.approved : 0,
      movieToTvRatio: requestCount.tv > 0 ? requestCount.movie / requestCount.tv : 0,
      popularRequestedGenres: {},
      mostActiveRequesters: []
    };
  }

  private processUserMetrics(rawData: Record<string, OverseerrRawData>) {
    const users = rawData.users?.results || [];
    
    const usersByPermissionLevel = users.reduce((acc: Record<string, number>, user: OverseerrRawData) => {
      const permissions = user.permissions?.toString() || 'unknown';
      acc[permissions] = (acc[permissions] || 0) + 1;
      return acc;
    }, {});

    return {
      totalUsers: users.length,
      activeUsers: users.filter((user: OverseerrRawData) => user.requestCount > 0).length,
      plexUsers: users.filter((user: OverseerrRawData) => user.plexToken).length,
      localUsers: users.filter((user: OverseerrRawData) => !user.plexToken).length,
      adminUsers: users.filter((user: OverseerrRawData) => user.permissions & 1).length, // Admin permission bit
      moderatorUsers: users.filter((user: OverseerrRawData) => user.permissions & 2).length, // Moderator permission bit
      usersByPermissionLevel,
      usersByLastActivity: {},
      userRegistrationTrend: {},
      averageRequestsPerUser: users.length > 0 ? users.reduce((sum: number, user: OverseerrRawData) => sum + (user.requestCount || 0), 0) / users.length : 0,
      mostActiveUsers: users.sort((a: OverseerrRawData, b: OverseerrRawData) => (b.requestCount || 0) - (a.requestCount || 0)).slice(0, 10),
      userGrowthRate: 0,
      userRetentionRate: 0,
      userEngagementScore: 0,
      dormantUsers: users.filter((user: OverseerrRawData) => (user.requestCount || 0) === 0).length
    };
  }

  private processMediaMetrics(rawData: Record<string, OverseerrRawData>) {
    const recentlyAdded = rawData.recentlyAdded?.results || [];
    
    const mediaByType = recentlyAdded.reduce((acc: Record<string, number>, item: OverseerrRawData) => {
      const type = item.mediaType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalMediaItems: recentlyAdded.length,
      availableMediaItems: recentlyAdded.filter((item: OverseerrRawData) => item.status === 5).length, // Available status
      processingMediaItems: recentlyAdded.filter((item: OverseerrRawData) => item.status === 3).length, // Processing status
      partiallyAvailableItems: recentlyAdded.filter((item: OverseerrRawData) => item.status === 4).length, // Partially available status
      movieCount: mediaByType.movie || 0,
      tvShowCount: mediaByType.tv || 0,
      totalSeasons: 0, // Would need more detailed TV data
      totalEpisodes: 0, // Would need more detailed TV data
      mediaByStatus: {},
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
      mediaAvailabilityRate: 0
    };
  }

  private processServiceMetrics(rawData: Record<string, OverseerrRawData>) {
    return {
      plexServerCount: 0, // Would need to extend API client for /settings/plex endpoints
      radarrInstanceCount: 0, // Would need to extend API client for /settings/radarr endpoints
      sonarrInstanceCount: 0, // Would need to extend API client for /settings/sonarr endpoints
      tautulliConnected: false, // Would need to extend API client for /settings/tautulli endpoint
      serviceHealthStatus: {},
      serviceResponseTimes: {},
      serviceLastSync: {},
      serviceErrorCounts: {},
      plexLibraryCount: 0,
      plexServerVersions: {},
      radarrProfiles: [],
      sonarrProfiles: [],
      serviceConfigurationHealth: {},
      serviceQueueSizes: {},
      serviceSuccessRates: {},
      integrationErrors: [],
      serviceUptime: {},
      serviceCapacityUtilization: {},
      serviceVersionMismatch: {},
      serviceSyncDuration: {}
    };
  }

  private processIssueMetrics(rawData: Record<string, OverseerrRawData>) {
    const issueCount = rawData.issueCount || {};

    return {
      totalIssues: issueCount.total || 0,
      openIssues: issueCount.open || 0,
      closedIssues: issueCount.closed || 0,
      videoIssues: issueCount.video || 0,
      audioIssues: issueCount.audio || 0,
      subtitleIssues: issueCount.subtitles || 0,
      otherIssues: issueCount.others || 0,
      issuesByType: {
        video: issueCount.video || 0,
        audio: issueCount.audio || 0,
        subtitles: issueCount.subtitles || 0,
        other: issueCount.others || 0
      },
      issuesByStatus: {
        open: issueCount.open || 0,
        closed: issueCount.closed || 0
      },
      issuesByUser: {},
      averageResolutionTime: 0,
      issueCreationTrend: {},
      mostReportedIssues: [],
      issueEscalationRate: 0,
      supportTicketBacklog: issueCount.open || 0
    };
  }

  private processNotificationMetrics(rawData: Record<string, OverseerrRawData>) {
    return {
      totalNotificationChannels: 0, // Would need to extend API client for notification endpoints
      enabledNotifications: {},
      notificationTypes: [],
      notificationsSentLast24h: 0,
      notificationsSentLast7d: 0,
      notificationDeliveryRate: {},
      notificationFailureRate: {},
      notificationResponseTimes: {},
      webhookEndpoints: 0,
      emailNotificationCount: 0,
      discordNotificationCount: 0,
      slackNotificationCount: 0,
      telegramNotificationCount: 0,
      pushNotificationCount: 0,
      notificationQueueSize: 0,
      notificationTemplates: [],
      notificationPreferences: {},
      notificationHealth: {},
      notificationRetryCount: {},
      notificationLatency: {}
    };
  }

  private processPerformanceMetrics(rawData: Record<string, OverseerrRawData>) {
    return {
      cacheHitRate: 0, // Would need to extend API client for /settings/cache endpoints
      cacheSize: 0,
      cacheTypes: [],
      jobQueueSize: 0, // Would need to extend API client for /settings/jobs endpoints
      activeJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      jobsByType: {},
      jobsByStatus: {},
      averageJobDuration: {},
      systemResourceUsage: {},
      databasePerformance: {},
      apiResponseTimes: {},
      logFileSize: 0,
      errorRate: 0
    };
  }

  private processDiscoveryMetrics(rawData: Record<string, OverseerrRawData>) {
    return {
      trendingMovies: [], // Would need to extend API client for discovery endpoints
      trendingTvShows: [],
      popularMovies: [],
      popularTvShows: [],
      upcomingMovies: [],
      discoverSliders: [],
      searchQueriesLast24h: 0,
      topSearchQueries: {},
      searchSuccessRate: 0,
      discoverConfigurationHealth: false
    };
  }

  private processHealthMetrics(rawData: Record<string, OverseerrRawData>) {
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
      overallHealth,
      healthChecks: {
        'system-status': !!status.version,
        'no-critical-issues': !hasIssues,
        'no-restart-required': !needsRestart,
        'up-to-date': !needsUpdate
      },
      systemUptime: 0, // Would need additional system metrics
      lastRestartTime: '', // Would need additional system metrics
      errorCount: issueCount.total || 0,
      warningCount: needsUpdate ? 1 : 0,
      criticalAlerts: [],
      systemAlerts: [],
      maintenanceMode: false,
      backupStatus: {}
    };
  }
}
