import { logger } from '../logger';
import { getJellyfinOverview, JellyfinOverview, JellyfinSystemInfo, JellyfinItemCounts } from '../api/jellyfin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JellyfinRawData = Record<string, any>;

export interface JellyfinMetrics {
  // System Information (15 metrics)
  system: {
    localAddress: string;
    serverName: string;
    version: string;
    productName: string;
    operatingSystem: string;
    id: string;
    startupWizardCompleted: boolean;
    isConnected: boolean;
    error?: string;
    uptime: number;
    serverType: 'jellyfin';
    installationId: string;
    architecture: string;
    webClientVersion: string;
    collectionTimestamp: number;
  };

  // Library Analytics (25 metrics)
  library: {
    totalItems: number;
    movieCount: number;
    seriesCount: number;
    episodeCount: number;
    artistCount: number;
    programCount: number;
    trailerCount: number;
    songCount: number;
    albumCount: number;
    musicVideoCount: number;
    boxSetCount: number;
    bookCount: number;
    itemCount: number;
    // Advanced library metrics
    libraryCount: number;
    libraryTypes: string[];
    libraryByType: Record<string, number>;
    contentByRating: Record<string, number>;
    contentByYear: Record<string, number>;
    contentByGenre: Record<string, number>;
    contentByStudio: Record<string, number>;
    libraryGrowthRate: Record<string, number>;
    storageUsageByLibrary: Record<string, number>;
    duplicateContent: number;
    corruptedItems: number;
  };

  // User & Session Analytics (20 metrics)
  users: {
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    guestUsers: number;
    disabledUsers: number;
    lockedUsers: number;
    // Advanced user metrics
    usersByLastActivity: Record<string, number>;
    usersByAccessLevel: Record<string, number>;
    userRegistrationTrend: Record<string, number>;
    averageSessionsPerUser: number;
    mostActiveUsers: JellyfinRawData[];
    userEngagementScore: number;
    userRetentionRate: number;
    newUsersLast30d: number;
    userStorageQuota: Record<string, number>;
    userBandwidthUsage: Record<string, number>;
    userPlaybackPreferences: Record<string, JellyfinRawData>;
    userDeviceTypes: Record<string, number>;
    concurrentUserLimit: number;
    peakConcurrentUsers: number;
  };

  // Playback & Streaming Analytics (30 metrics)
  playback: {
    activeSessions: number;
    totalSessions: number;
    playingSessions: number;
    pausedSessions: number;
    buffering: number;
    remoteConnections: number;
    localConnections: number;
    // Advanced playback metrics
    sessionsByDevice: Record<string, number>;
    sessionsByClient: Record<string, number>;
    sessionsByUser: Record<string, number>;
    sessionsByContent: Record<string, number>;
    averageSessionDuration: number;
    totalPlayTime: number;
    bandwidthUsage: number;
    transcodingSessions: number;
    directPlaySessions: number;
    directStreamSessions: number;
    streamingBitrates: Record<string, number>;
    popularContent: JellyfinRawData[];
    playbackErrors: number;
    bufferingEvents: number;
    streamQuality: Record<string, number>;
    audioFormats: Record<string, number>;
    videoFormats: Record<string, number>;
    subtitleUsage: Record<string, number>;
    playbackMethods: Record<string, number>;
    networkEfficiency: number;
    transcodingLoad: number;
    playbackLatency: number;
  };

  // Media Analytics (25 metrics)
  media: {
    recentlyAddedCount: number;
    recentlyWatchedCount: number;
    favoriteItemsCount: number;
    watchedItemsCount: number;
    unwatchedItemsCount: number;
    inProgressItemsCount: number;
    // Advanced media metrics
    mediaByFormat: Record<string, number>;
    mediaByResolution: Record<string, number>;
    mediaByCodec: Record<string, number>;
    mediaByContainer: Record<string, number>;
    mediaByAudioChannels: Record<string, number>;
    mediaDuration: Record<string, number>;
    mediaFileSize: Record<string, number>;
    mediaQualityDistribution: Record<string, number>;
    hdContentPercentage: number;
    fourKContentPercentage: number;
    mediaWithSubtitles: number;
    mediaWithMultipleAudio: number;
    mediaWithChapters: number;
    mediaIndexingStatus: Record<string, number>;
    mediaMetadataCompleteness: number;
    mediaArtworkCoverage: number;
    corruptedMediaFiles: number;
    missingMediaFiles: number;
    orphanedMediaFiles: number;
  };

  // Server Performance Analytics (20 metrics)
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
    serverLoad: number;
    databaseSize: number;
    cacheSize: number;
    tempFileSize: number;
    // Advanced performance metrics
    responseTime: number;
    throughput: number;
    concurrentConnections: number;
    queuedTasks: number;
    backgroundTasks: number;
    scheduledTasks: number;
    failedTasks: number;
    diskIOPS: number;
    networkThroughput: number;
    memoryLeaks: number;
    errorRate: number;
    crashCount: number;
  };

  // Plugin & Configuration Analytics (15 metrics)
  plugins: {
    installedPlugins: number;
    enabledPlugins: number;
    disabledPlugins: number;
    pluginVersions: Record<string, string>;
    pluginErrors: Record<string, number>;
    // Advanced plugin metrics
    pluginByCategory: Record<string, number>;
    pluginUpdateAvailable: Record<string, boolean>;
    pluginConfigurationHealth: Record<string, boolean>;
    customPlugins: number;
    officialPlugins: number;
    communityPlugins: number;
    pluginUsageStats: Record<string, number>;
    pluginResourceUsage: Record<string, number>;
    pluginCompatibility: Record<string, boolean>;
    pluginSecurity: Record<string, string>;
  };

  // Network & Security Analytics (15 metrics)
  network: {
    totalConnections: number;
    secureConnections: number;
    insecureConnections: number;
    failedLoginAttempts: number;
    successfulLogins: number;
    activeTokens: number;
    expiredTokens: number;
    // Advanced network metrics
    connectionsByProtocol: Record<string, number>;
    connectionsByCountry: Record<string, number>;
    suspiciousActivity: number;
    blockedConnections: number;
    rateLimitedRequests: number;
    authenticationMethods: Record<string, number>;
    securityAlerts: JellyfinRawData[];
    networkErrors: Record<string, number>;
  };

  // Health & Monitoring (12 metrics)
  health: {
    overallHealth: 'healthy' | 'warning' | 'error';
    healthChecks: Record<string, boolean>;
    systemUptime: number;
    lastRestartTime: string;
    errorCount: number;
    warningCount: number;
    criticalAlerts: JellyfinRawData[];
    systemAlerts: JellyfinRawData[];
    maintenanceMode: boolean;
    backupStatus: JellyfinRawData;
    configurationErrors: number;
    dependencyHealth: Record<string, boolean>;
  };
}

export class JellyfinCollector {
  private jellyfinUrl: string;
  private apiKey: string;

  constructor(jellyfinUrl: string, apiKey: string) {
    this.jellyfinUrl = jellyfinUrl;
    this.apiKey = apiKey;
  }

  async collect(): Promise<JellyfinMetrics> {
    try {
      logger.info('Starting comprehensive Jellyfin metrics collection...');

      // Collect data from Jellyfin overview endpoint
      const overview = await this.getJellyfinOverview();

      // Process and aggregate the collected data
      const metrics = this.processMetrics(overview);

      logger.info('Jellyfin metrics collection completed successfully');
      return metrics;
    } catch (error) {
      logger.error('Failed to collect Jellyfin metrics:', error);
      throw error;
    }
  }

  private async getJellyfinOverview(): Promise<JellyfinOverview> {
    try {
      return await getJellyfinOverview(this.jellyfinUrl, this.apiKey);
    } catch (error) {
      logger.warn('Failed to get Jellyfin overview:', error);
      return {
        serverInfo: {
          LocalAddress: '',
          ServerName: '',
          Version: '',
          ProductName: '',
          OperatingSystem: '',
          Id: '',
          StartupWizardCompleted: false
        } as JellyfinSystemInfo,
        itemCounts: {
          MovieCount: 0,
          SeriesCount: 0,
          EpisodeCount: 0,
          ArtistCount: 0,
          ProgramCount: 0,
          TrailerCount: 0,
          SongCount: 0,
          AlbumCount: 0,
          MusicVideoCount: 0,
          BoxSetCount: 0,
          BookCount: 0,
          ItemCount: 0
        } as JellyfinItemCounts,
        activeSessions: [],
        libraries: [],
        recentlyAdded: [],
        isConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private processMetrics(overview: JellyfinOverview): JellyfinMetrics {
    const timestamp = Date.now();
    
    return {
      system: this.processSystemMetrics(overview, timestamp),
      library: this.processLibraryMetrics(overview),
      users: this.processUserMetrics(overview),
      playback: this.processPlaybackMetrics(overview),
      media: this.processMediaMetrics(overview),
      performance: this.processPerformanceMetrics(overview),
      plugins: this.processPluginMetrics(overview),
      network: this.processNetworkMetrics(overview),
      health: this.processHealthMetrics(overview)
    };
  }

  private processSystemMetrics(overview: JellyfinOverview, timestamp: number) {
    const serverInfo = overview.serverInfo || {};

    return {
      localAddress: serverInfo.LocalAddress || 'unknown',
      serverName: serverInfo.ServerName || 'Jellyfin',
      version: serverInfo.Version || 'unknown',
      productName: serverInfo.ProductName || 'Jellyfin Server',
      operatingSystem: serverInfo.OperatingSystem || 'unknown',
      id: serverInfo.Id || 'unknown',
      startupWizardCompleted: serverInfo.StartupWizardCompleted || false,
      isConnected: overview.isConnected,
      error: overview.error,
      uptime: 0, // Would need additional system metrics
      serverType: 'jellyfin' as const,
      installationId: serverInfo.Id || 'unknown',
      architecture: 'unknown', // Would need additional system info
      webClientVersion: 'unknown', // Would need additional system info
      collectionTimestamp: timestamp
    };
  }

  private processLibraryMetrics(overview: JellyfinOverview) {
    const itemCounts = overview.itemCounts || {};
    const libraries = overview.libraries || [];

    const libraryByType = libraries.reduce((acc: Record<string, number>, lib: JellyfinRawData) => {
      const type = lib.CollectionType || 'mixed';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalItems: itemCounts.ItemCount || 0,
      movieCount: itemCounts.MovieCount || 0,
      seriesCount: itemCounts.SeriesCount || 0,
      episodeCount: itemCounts.EpisodeCount || 0,
      artistCount: itemCounts.ArtistCount || 0,
      programCount: itemCounts.ProgramCount || 0,
      trailerCount: itemCounts.TrailerCount || 0,
      songCount: itemCounts.SongCount || 0,
      albumCount: itemCounts.AlbumCount || 0,
      musicVideoCount: itemCounts.MusicVideoCount || 0,
      boxSetCount: itemCounts.BoxSetCount || 0,
      bookCount: itemCounts.BookCount || 0,
      itemCount: itemCounts.ItemCount || 0,
      libraryCount: libraries.length,
      libraryTypes: [...new Set(libraries.map((lib: JellyfinRawData) => lib.CollectionType || 'mixed'))],
      libraryByType,
      contentByRating: {}, // Would need additional media analysis
      contentByYear: {}, // Would need additional media analysis
      contentByGenre: {}, // Would need additional media analysis
      contentByStudio: {}, // Would need additional media analysis
      libraryGrowthRate: {}, // Would need historical data
      storageUsageByLibrary: {}, // Would need additional storage metrics
      duplicateContent: 0, // Would need additional analysis
      corruptedItems: 0 // Would need additional health metrics
    };
  }

  private processUserMetrics(overview: JellyfinOverview) {
    const activeSessions = overview.activeSessions || [];
    
    // Extract unique users from active sessions
    const activeUserIds = new Set(activeSessions.map((session: JellyfinRawData) => session.UserId).filter(Boolean));
    
    return {
      totalUsers: 0, // Would need user management API access
      activeUsers: activeUserIds.size,
      adminUsers: 0, // Would need user management API access
      guestUsers: 0, // Would need user management API access
      disabledUsers: 0, // Would need user management API access
      lockedUsers: 0, // Would need user management API access
      usersByLastActivity: {}, // Would need detailed user activity data
      usersByAccessLevel: {}, // Would need user permission data
      userRegistrationTrend: {}, // Would need historical user data
      averageSessionsPerUser: activeUserIds.size > 0 ? activeSessions.length / activeUserIds.size : 0,
      mostActiveUsers: [], // Would need detailed user statistics
      userEngagementScore: 0, // Would need engagement metrics
      userRetentionRate: 0, // Would need historical data
      newUsersLast30d: 0, // Would need user registration data
      userStorageQuota: {}, // Would need quota management data
      userBandwidthUsage: {}, // Would need network statistics
      userPlaybackPreferences: {}, // Would need user preference data
      userDeviceTypes: {}, // Would need device statistics
      concurrentUserLimit: 0, // Would need server configuration
      peakConcurrentUsers: activeSessions.length // Current peak (would need historical data)
    };
  }

  private processPlaybackMetrics(overview: JellyfinOverview) {
    const activeSessions = overview.activeSessions || [];
    
    const playingSessions = activeSessions.filter((session: JellyfinRawData) => 
      session.NowPlayingItem && session.PlayState && !session.PlayState.IsPaused
    );
    
    const pausedSessions = activeSessions.filter((session: JellyfinRawData) => 
      session.NowPlayingItem && session.PlayState && session.PlayState.IsPaused
    );

    const sessionsByDevice = activeSessions.reduce((acc: Record<string, number>, session: JellyfinRawData) => {
      const device = session.DeviceName || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});

    const sessionsByClient = activeSessions.reduce((acc: Record<string, number>, session: JellyfinRawData) => {
      const client = session.Client || 'unknown';
      acc[client] = (acc[client] || 0) + 1;
      return acc;
    }, {});

    const sessionsByUser = activeSessions.reduce((acc: Record<string, number>, session: JellyfinRawData) => {
      const user = session.UserName || 'unknown';
      acc[user] = (acc[user] || 0) + 1;
      return acc;
    }, {});

    return {
      activeSessions: activeSessions.length,
      totalSessions: activeSessions.length, // Current total (would need historical data)
      playingSessions: playingSessions.length,
      pausedSessions: pausedSessions.length,
      buffering: 0, // Would need detailed playback state
      remoteConnections: 0, // Would need network topology analysis
      localConnections: activeSessions.length, // Approximation
      sessionsByDevice,
      sessionsByClient,
      sessionsByUser,
      sessionsByContent: {}, // Would need content analysis
      averageSessionDuration: 0, // Would need session timing data
      totalPlayTime: 0, // Would need accumulated playback statistics
      bandwidthUsage: 0, // Would need network monitoring
      transcodingSessions: 0, // Would need transcoding status
      directPlaySessions: 0, // Would need playback method analysis
      directStreamSessions: 0, // Would need playback method analysis
      streamingBitrates: {}, // Would need quality metrics
      popularContent: [], // Would need content popularity statistics
      playbackErrors: 0, // Would need error tracking
      bufferingEvents: 0, // Would need buffering statistics
      streamQuality: {}, // Would need quality monitoring
      audioFormats: {}, // Would need format analysis
      videoFormats: {}, // Would need format analysis
      subtitleUsage: {}, // Would need subtitle statistics
      playbackMethods: {}, // Would need method analysis
      networkEfficiency: 0, // Would need network performance metrics
      transcodingLoad: 0, // Would need server load metrics
      playbackLatency: 0 // Would need latency monitoring
    };
  }

  private processMediaMetrics(overview: JellyfinOverview) {
    const recentlyAdded = overview.recentlyAdded || [];

    return {
      recentlyAddedCount: recentlyAdded.length,
      recentlyWatchedCount: 0, // Would need watch history
      favoriteItemsCount: 0, // Would need user favorites data
      watchedItemsCount: 0, // Would need completion statistics
      unwatchedItemsCount: 0, // Would need watch status data
      inProgressItemsCount: 0, // Would need progress tracking
      mediaByFormat: {}, // Would need format analysis
      mediaByResolution: {}, // Would need resolution analysis
      mediaByCodec: {}, // Would need codec analysis
      mediaByContainer: {}, // Would need container analysis
      mediaByAudioChannels: {}, // Would need audio analysis
      mediaDuration: {}, // Would need duration statistics
      mediaFileSize: {}, // Would need file size analysis
      mediaQualityDistribution: {}, // Would need quality analysis
      hdContentPercentage: 0, // Would need resolution statistics
      fourKContentPercentage: 0, // Would need 4K analysis
      mediaWithSubtitles: 0, // Would need subtitle analysis
      mediaWithMultipleAudio: 0, // Would need audio track analysis
      mediaWithChapters: 0, // Would need chapter analysis
      mediaIndexingStatus: {}, // Would need indexing statistics
      mediaMetadataCompleteness: 0, // Would need metadata analysis
      mediaArtworkCoverage: 0, // Would need artwork analysis
      corruptedMediaFiles: 0, // Would need file integrity checks
      missingMediaFiles: 0, // Would need file validation
      orphanedMediaFiles: 0 // Would need orphan detection
    };
  }

  private processPerformanceMetrics(overview: JellyfinOverview) {
    return {
      cpuUsage: 0, // Would need system monitoring
      memoryUsage: 0, // Would need system monitoring
      diskUsage: 0, // Would need storage monitoring
      networkLatency: 0, // Would need network monitoring
      serverLoad: 0, // Would need load monitoring
      databaseSize: 0, // Would need database statistics
      cacheSize: 0, // Would need cache monitoring
      tempFileSize: 0, // Would need temporary file tracking
      responseTime: 0, // Would need API response monitoring
      throughput: 0, // Would need throughput monitoring
      concurrentConnections: overview.activeSessions?.length || 0,
      queuedTasks: 0, // Would need task queue monitoring
      backgroundTasks: 0, // Would need task monitoring
      scheduledTasks: 0, // Would need scheduler monitoring
      failedTasks: 0, // Would need error tracking
      diskIOPS: 0, // Would need disk monitoring
      networkThroughput: 0, // Would need network monitoring
      memoryLeaks: 0, // Would need memory profiling
      errorRate: 0, // Would need error tracking
      crashCount: 0 // Would need crash reporting
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private processPluginMetrics(overview: JellyfinOverview) {
    return {
      installedPlugins: 0, // Would need plugin management API
      enabledPlugins: 0, // Would need plugin status API
      disabledPlugins: 0, // Would need plugin status API
      pluginVersions: {}, // Would need plugin version API
      pluginErrors: {}, // Would need plugin error tracking
      pluginByCategory: {}, // Would need plugin categorization
      pluginUpdateAvailable: {}, // Would need update checking
      pluginConfigurationHealth: {}, // Would need configuration validation
      customPlugins: 0, // Would need plugin source analysis
      officialPlugins: 0, // Would need plugin source analysis
      communityPlugins: 0, // Would need plugin source analysis
      pluginUsageStats: {}, // Would need usage tracking
      pluginResourceUsage: {}, // Would need resource monitoring
      pluginCompatibility: {}, // Would need compatibility checking
      pluginSecurity: {} // Would need security analysis
    };
  }

  private processNetworkMetrics(overview: JellyfinOverview) {
    return {
      totalConnections: overview.activeSessions?.length || 0,
      secureConnections: 0, // Would need connection security analysis
      insecureConnections: 0, // Would need connection security analysis
      failedLoginAttempts: 0, // Would need authentication log analysis
      successfulLogins: 0, // Would need authentication log analysis
      activeTokens: 0, // Would need token management API
      expiredTokens: 0, // Would need token management API
      connectionsByProtocol: {}, // Would need protocol analysis
      connectionsByCountry: {}, // Would need geolocation analysis
      suspiciousActivity: 0, // Would need security monitoring
      blockedConnections: 0, // Would need security filtering
      rateLimitedRequests: 0, // Would need rate limiting monitoring
      authenticationMethods: {}, // Would need authentication analysis
      securityAlerts: [], // Would need security event tracking
      networkErrors: {} // Would need network error monitoring
    };
  }

  private processHealthMetrics(overview: JellyfinOverview) {
    const isConnected = overview.isConnected;
    const hasError = !!overview.error;
    
    let overallHealth: 'healthy' | 'warning' | 'error' = 'healthy';
    if (!isConnected || hasError) {
      overallHealth = 'error';
    }

    return {
      overallHealth,
      healthChecks: {
        'server-connected': isConnected,
        'no-connection-errors': !hasError,
        'server-responding': isConnected,
        'libraries-accessible': (overview.libraries?.length || 0) > 0
      },
      systemUptime: 0, // Would need uptime monitoring
      lastRestartTime: '', // Would need restart tracking
      errorCount: hasError ? 1 : 0,
      warningCount: 0, // Would need warning tracking
      criticalAlerts: hasError ? [{ error: overview.error }] : [],
      systemAlerts: [],
      maintenanceMode: false, // Would need maintenance status API
      backupStatus: {}, // Would need backup monitoring
      configurationErrors: 0, // Would need configuration validation
      dependencyHealth: {} // Would need dependency monitoring
    };
  }
}
