/* eslint-disable @typescript-eslint/no-explicit-any */
// Tautulli Comprehensive Metrics Collector
// Collects detailed statistics and metrics from Tautulli API

import { createTautulliClient, TautulliAPI } from '../api/tautulli';
import { logger } from '../logger';

export interface TautulliMetrics {
  // System Information
  system: {
    serverInfo: any;
    serverIdentity: any;
    tautulliInfo: any;
    serverStatus: any;
  };

  // Core Statistics
  stats: {
    activeStreams: number;
    totalBandwidth: number;
    libraryCount: number;
    userCount: number;
    deviceCount: number;
    totalPlays: number;
    transcodeStreams: number;
    directPlayStreams: number;
    directStreams: number;
    recentlyAddedCount: number;
  };

  // Current Activity
  activity: {
    sessions: any[];
    streamCount: number;
    totalBandwidth: number;
    transcodeCount: number;
    directPlayCount: number;
    directStreamCount: number;
    lanBandwidth: number;
    wanBandwidth: number;
  };

  // User Analytics
  users: {
    total: number;
    active: number;
    list: any[];
    topUsers: any[];
    playerStats: any[];
    watchTimeStats: any[];
  };

  // Library Analytics
  libraries: {
    total: number;
    list: any[];
    mediaInfo: any[];
    watchTimeStats: any[];
    userStats: any[];
  };

  // Content Analytics
  content: {
    recentlyAdded: any[];
    recentHistory: any[];
    topContent: any[];
    watchStats: any[];
  };

  // Streaming Analytics
  streaming: {
    playsByDate: any;
    playsByDayOfWeek: any;
    playsByHourOfDay: any;
    playsByStreamType: any;
    playsBySourceResolution: any;
    playsByStreamResolution: any;
    playsByTop10Platforms: any;
    playsByTop10Users: any;
    playsPerMonth: any;
    streamTypeByTop10Platforms: any;
    streamTypeByTop10Users: any;
  };

  // Home Dashboard Statistics
  homeStats: {
    topMovies: any[];
    topTvShows: any[];
    topMusic: any[];
    topUsers: any[];
    topPlatforms: any[];
    mostConcurrentStreams: any[];
    topSourceResolution: any[];
    topStreamResolution: any[];
    topStreamContainers: any[];
    topMediaTypes: any[];
  };

  // Device & Platform Analytics
  devices: {
    total: number;
    list: any[];
    platformStats: any[];
  };

  // Health & Monitoring
  health: {
    serverOnline: boolean;
    tautulliVersion: string;
    plexVersion: string;
    lastUpdated: Date;
    updateAvailable: boolean;
    errors: string[];
  };
}

export class TautulliCollector {
  private client: TautulliAPI;

  constructor(config: { url: string; apiKey: string }) {
    this.client = createTautulliClient(config);
  }

  async collect(): Promise<TautulliMetrics> {
    try {
      logger.info('Starting comprehensive Tautulli metrics collection...');

      // Collect data from multiple endpoints in parallel for efficiency
      const [
        activity,
        homeStats,
        libraries,
        history,
        recentlyAdded,
        serverInfo,
        serverIdentity,
        serverStatus,
        users,
        devices,
        tautulliInfo,
        tautulliVersion,
        tautulliUpdate,
        // Analytics data
        playsByDate,
        playsByDayOfWeek,
        playsByHourOfDay,
        playsByStreamType,
        playsBySourceResolution,
        playsByStreamResolution,
        playsByTop10Platforms,
        playsByTop10Users,
        playsPerMonth,
        streamTypeByTop10Platforms,
        streamTypeByTop10Users
      ] = await Promise.allSettled([
        this.getActivity(),
        this.getHomeStats(),
        this.getLibraries(),
        this.getHistory(),
        this.getRecentlyAdded(),
        this.getServerInfo(),
        this.getServerIdentity(),
        this.getServerStatus(),
        this.getUsers(),
        this.getDevices(),
        this.getTautulliInfo(),
        this.getTautulliVersion(),
        this.getTautulliUpdateCheck(),
        // Analytics
        this.getPlaysByDate(),
        this.getPlaysByDayOfWeek(),
        this.getPlaysByHourOfDay(),
        this.getPlaysByStreamType(),
        this.getPlaysBySourceResolution(),
        this.getPlaysByStreamResolution(),
        this.getPlaysByTop10Platforms(),
        this.getPlaysByTop10Users(),
        this.getPlaysPerMonth(),
        this.getStreamTypeByTop10Platforms(),
        this.getStreamTypeByTop10Users()
      ]);

      // Process and aggregate the data
      const metrics = this.processMetrics({
        activity,
        homeStats,
        libraries,
        history,
        recentlyAdded,
        serverInfo,
        serverIdentity,
        serverStatus,
        users,
        devices,
        tautulliInfo,
        tautulliVersion,
        tautulliUpdate,
        playsByDate,
        playsByDayOfWeek,
        playsByHourOfDay,
        playsByStreamType,
        playsBySourceResolution,
        playsByStreamResolution,
        playsByTop10Platforms,
        playsByTop10Users,
        playsPerMonth,
        streamTypeByTop10Platforms,
        streamTypeByTop10Users
      });

      logger.info('Tautulli metrics collection completed successfully');
      return metrics;
    } catch (error) {
      logger.error('Failed to collect Tautulli metrics:', error);
      throw error;
    }
  }

  private async getActivity() {
    return this.client.getActivity();
  }

  private async getHomeStats() {
    return this.client.getHomeStats(30, 'plays', 10);
  }

  private async getLibraries() {
    return this.client.getLibraries();
  }

  private async getHistory() {
    return this.client.getHistory(100);
  }

  private async getRecentlyAdded() {
    return this.client.getRecentlyAdded(50);
  }

  private async getServerInfo() {
    return this.client.getServerInfo();
  }

  private async getServerIdentity() {
    return this.client.getServerIdentity();
  }

  private async getServerStatus() {
    return this.client.getServerStatus();
  }

  private async getUsers() {
    return this.client.getUsers();
  }

  private async getDevices() {
    try {
      return await this.client.getDevices();
    } catch {
      return [];
    }
  }

  private async getTautulliInfo() {
    return this.client.getTautulliInfo();
  }

  private async getTautulliVersion() {
    return this.client.getTautulliVersion();
  }

  private async getTautulliUpdateCheck() {
    try {
      return await this.client.getTautulliUpdateCheck();
    } catch {
      return null;
    }
  }

  private async getPlaysByDate() {
    return this.client.getPlaysByDate(30, 'plays');
  }

  private async getPlaysByDayOfWeek() {
    return this.client.getPlaysByDayOfWeek(30, 'plays');
  }

  private async getPlaysByHourOfDay() {
    return this.client.getPlaysByHourOfDay(30, 'plays');
  }

  private async getPlaysByStreamType() {
    return this.client.getPlaysByStreamType(30, 'plays');
  }

  private async getPlaysBySourceResolution() {
    return this.client.getPlaysBySourceResolution(30, 'plays');
  }

  private async getPlaysByStreamResolution() {
    return this.client.getPlaysByStreamResolution(30, 'plays');
  }

  private async getPlaysByTop10Platforms() {
    return this.client.getPlaysByTop10Platforms(30, 'plays');
  }

  private async getPlaysByTop10Users() {
    return this.client.getPlaysByTop10Users(30, 'plays');
  }

  private async getPlaysPerMonth() {
    return this.client.getPlaysPerMonth(12, 'plays');
  }

  private async getStreamTypeByTop10Platforms() {
    return this.client.getStreamTypeByTop10Platforms(30);
  }

  private async getStreamTypeByTop10Users() {
    return this.client.getStreamTypeByTop10Users(30);
  }

  private processMetrics(data: Record<string, PromiseSettledResult<any>>): TautulliMetrics {
    // Helper function to safely extract data from promise results
    const getResult = (result: PromiseSettledResult<any>) => 
      result.status === 'fulfilled' ? result.value : null;

    // Extract all the data
    const activityData = getResult(data.activity) || { stream_count: 0, sessions: [] };
    const homeStatsData = getResult(data.homeStats) || [];
    const librariesData = getResult(data.libraries) || [];
    const historyData = getResult(data.history) || { data: [], recordsTotal: 0 };
    const recentlyAddedData = getResult(data.recentlyAdded) || { recently_added: [] };
    const serverInfoData = getResult(data.serverInfo) || {};
    const serverIdentityData = getResult(data.serverIdentity) || {};
    const serverStatusData = getResult(data.serverStatus) || {};
    const usersData = getResult(data.users) || [];
    const devicesData = getResult(data.devices) || [];
    const tautulliInfoData = getResult(data.tautulliInfo) || {};
    const tautulliVersionData = getResult(data.tautulliVersion) || {};
    const tautulliUpdateData = getResult(data.tautulliUpdate) || {};

    // Process home stats by category
    const homeStatsProcessed = homeStatsData.reduce((acc: any, statGroup: any) => {
      if (statGroup && statGroup.stat_id) {
        acc[statGroup.stat_id] = statGroup.rows || [];
      }
      return acc;
    }, {});

    return {
      // System Information
      system: {
        serverInfo: serverInfoData,
        serverIdentity: serverIdentityData,
        tautulliInfo: tautulliInfoData,
        serverStatus: serverStatusData,
      },

      // Core Statistics
      stats: {
        activeStreams: parseInt(activityData.stream_count) || 0,
        totalBandwidth: activityData.total_bandwidth || 0,
        libraryCount: librariesData.length || 0,
        userCount: usersData.length || 0,
        deviceCount: devicesData.length || 0,
        totalPlays: historyData.recordsTotal || 0,
        transcodeStreams: activityData.stream_count_transcode || 0,
        directPlayStreams: activityData.stream_count_direct_play || 0,
        directStreams: activityData.stream_count_direct_stream || 0,
        recentlyAddedCount: (recentlyAddedData.recently_added || recentlyAddedData.data || []).length,
      },

      // Current Activity
      activity: {
        sessions: activityData.sessions || [],
        streamCount: parseInt(activityData.stream_count) || 0,
        totalBandwidth: activityData.total_bandwidth || 0,
        transcodeCount: activityData.stream_count_transcode || 0,
        directPlayCount: activityData.stream_count_direct_play || 0,
        directStreamCount: activityData.stream_count_direct_stream || 0,
        lanBandwidth: activityData.lan_bandwidth || 0,
        wanBandwidth: activityData.wan_bandwidth || 0,
      },

      // User Analytics
      users: {
        total: usersData.length || 0,
        active: usersData.filter((user: any) => user.is_active).length || 0,
        list: usersData,
        topUsers: homeStatsProcessed.top_users || [],
        playerStats: [], // Will be populated with individual user stats if needed
        watchTimeStats: [], // Will be populated with individual user stats if needed
      },

      // Library Analytics
      libraries: {
        total: librariesData.length || 0,
        list: librariesData,
        mediaInfo: [], // Will be populated with individual library stats if needed
        watchTimeStats: [], // Will be populated with individual library stats if needed
        userStats: [], // Will be populated with individual library stats if needed
      },

      // Content Analytics
      content: {
        recentlyAdded: recentlyAddedData.recently_added || recentlyAddedData.data || [],
        recentHistory: historyData.data || [],
        topContent: [
          ...(homeStatsProcessed.top_movies || []),
          ...(homeStatsProcessed.top_tv || []),
          ...(homeStatsProcessed.top_music || [])
        ],
        watchStats: homeStatsProcessed.watch_statistics || [],
      },

      // Streaming Analytics
      streaming: {
        playsByDate: getResult(data.playsByDate),
        playsByDayOfWeek: getResult(data.playsByDayOfWeek),
        playsByHourOfDay: getResult(data.playsByHourOfDay),
        playsByStreamType: getResult(data.playsByStreamType),
        playsBySourceResolution: getResult(data.playsBySourceResolution),
        playsByStreamResolution: getResult(data.playsByStreamResolution),
        playsByTop10Platforms: getResult(data.playsByTop10Platforms),
        playsByTop10Users: getResult(data.playsByTop10Users),
        playsPerMonth: getResult(data.playsPerMonth),
        streamTypeByTop10Platforms: getResult(data.streamTypeByTop10Platforms),
        streamTypeByTop10Users: getResult(data.streamTypeByTop10Users),
      },

      // Home Dashboard Statistics
      homeStats: {
        topMovies: homeStatsProcessed.top_movies || [],
        topTvShows: homeStatsProcessed.top_tv || [],
        topMusic: homeStatsProcessed.top_music || [],
        topUsers: homeStatsProcessed.top_users || [],
        topPlatforms: homeStatsProcessed.top_platforms || [],
        mostConcurrentStreams: homeStatsProcessed.most_concurrent || [],
        topSourceResolution: homeStatsProcessed.top_source_resolution || [],
        topStreamResolution: homeStatsProcessed.top_stream_resolution || [],
        topStreamContainers: homeStatsProcessed.top_stream_container || [],
        topMediaTypes: homeStatsProcessed.top_media_type || [],
      },

      // Device & Platform Analytics
      devices: {
        total: devicesData.length || 0,
        list: devicesData,
        platformStats: homeStatsProcessed.top_platforms || [],
      },

      // Health & Monitoring
      health: {
        serverOnline: serverStatusData?.result === 'success' || false,
        tautulliVersion: tautulliVersionData?.version || 'unknown',
        plexVersion: serverInfoData?.version || 'unknown',
        lastUpdated: new Date(),
        updateAvailable: tautulliUpdateData?.update_available || false,
        errors: [],
      },
    };
  }
}

// Export factory function for creating collector instances
export function createTautulliCollector(config: { url: string; apiKey: string }) {
  return new TautulliCollector(config);
}
