/* eslint-disable @typescript-eslint/no-explicit-any */
import { PlexAPI } from '../api/plex';
import { logger } from '../logger';

export interface PlexMetrics {
  // Server information
  server: {
    name: string;
    version: string;
    platform: string;
    uptime_hours: number;
    machine_identifier: string;
    claimed: boolean;
    multiuser: boolean;
    certificate: boolean;
    sync_enabled: boolean;
    transcoder_active: boolean;
  };
  
  // Library metrics
  libraries: {
    total_libraries: number;
    movie_libraries: number;
    tv_libraries: number;
    music_libraries: number;
    photo_libraries: number;
    total_items: number;
    movies: number;
    shows: number;
    episodes: number;
    artists: number;
    albums: number;
    tracks: number;
    photos: number;
    library_sizes_gb: { [libraryName: string]: number };
    library_counts: { [libraryName: string]: number };
  };
  
  // User and access metrics
  users: {
    total_users: number;
    admin_users: number;
    home_users: number;
    restricted_users: number;
    managed_users: number;
    recent_users_7d: number;
  };
  
  // Streaming and activity metrics
  activity: {
    active_sessions: number;
    direct_play_sessions: number;
    direct_stream_sessions: number;
    transcode_sessions: number;
    total_bandwidth_mbps: number;
    unique_users_streaming: number;
    sessions_by_quality: { [quality: string]: number };
    sessions_by_client: { [client: string]: number };
  };
  
  // Transcoding performance
  transcoding: {
    total_transcode_sessions: number;
    video_transcodes: number;
    audio_transcodes: number;
    hw_transcodes: number;
    sw_transcodes: number;
    avg_transcode_speed: number;
    avg_progress_percent: number;
    throttled_sessions: number;
    completed_sessions: number;
  };
  
  // Device and client metrics  
  devices: {
    total_devices: number;
    online_devices: number;
    device_types: { [deviceType: string]: number };
    platforms: { [platform: string]: number };
    products: { [product: string]: number };
    recently_used_devices_7d: number;
  };
  
  // Content and engagement metrics
  content: {
    recently_added_24h: number;
    recently_added_7d: number;
    recently_added_30d: number;
    on_deck_items: number;
    total_playlists: number;
    smart_playlists: number;
    user_playlists: number;
    avg_playlist_size: number;
    content_by_year: { [year: string]: number };
    content_by_rating: { [rating: string]: number };
  };
  
  // System activities and tasks
  system: {
    active_activities: number;
    background_tasks: number;
    maintenance_tasks: number;
    scan_activities: number;
    optimization_activities: number;
    activities_by_type: { [activityType: string]: number };
  };
  
  // Usage statistics
  statistics: {
    total_plays: number;
    total_duration_hours: number;
    plays_by_user: { [userName: string]: number };
    duration_by_user: { [userName: string]: number };
    plays_by_device: { [deviceName: string]: number };
    popular_content: Array<{ title: string; plays: number; type: string }>;
  };
}

export class PlexCollector {
  private api: PlexAPI;
  private timeout: number = 30000;

  constructor(api: PlexAPI) {
    this.api = api;
  }

  static async fromConfig(): Promise<PlexCollector | null> {
    try {
      const { getServiceInstancesByType } = await import('@/lib/config-db');
      const plexInstances = getServiceInstancesByType('plex');
      const firstPlex = Object.values(plexInstances)[0];
      
      if (!firstPlex?.url || !firstPlex?.api_key) {
        throw new Error('Plex configuration not found or incomplete');
      }

      const api = new PlexAPI({
        url: firstPlex.url,
        token: String(firstPlex.api_key)
      });

      return new PlexCollector(api);
    } catch (error) {
      logger.error('Failed to create PlexCollector from config:', error);
      return null;
    }
  }

  async collect(): Promise<PlexMetrics> {
    try {
      logger.info('Starting comprehensive Plex metrics collection...');
      
      // Collect data from multiple endpoints in parallel for efficiency
      const [
        identity,
        capabilities,
        libraries,
        users,
        sessions,
        devices,
        statistics,
        activities,
        transcodeSessions,
        playlists,
        recentlyAdded,
        onDeck
      ] = await Promise.allSettled([
        this.api.getServerIdentity(),
        this.api.getServerCapabilities(),
        this.api.getLibraries(),
        this.api.getUsers(),
        this.api.getSessions(),
        this.api.getDevices(),
        this.api.getStatistics(),
        this.api.getActivities(),
        this.api.getTranscodeSessions(),
        this.api.getPlaylists(),
        this.api.getRecentlyAdded(),
        this.api.getOnDeck()
      ]);

      // Get detailed library information
      const librariesData = this.getSettledResult(libraries) || [];
      const libraryDetails = await this.getLibraryDetails(librariesData);

      // Process and aggregate the data
      const metrics = await this.processMetrics({
        identity: this.getSettledResult(identity),
        capabilities: this.getSettledResult(capabilities),
        libraries: librariesData,
        libraryDetails,
        users: this.getSettledResult(users) || [],
        sessions: this.getSettledResult(sessions) || [],
        devices: this.getSettledResult(devices) || [],
        statistics: this.getSettledResult(statistics),
        activities: this.getSettledResult(activities),
        transcodeSessions: this.getSettledResult(transcodeSessions),
        playlists: this.getSettledResult(playlists),
        recentlyAdded: this.getSettledResult(recentlyAdded),
        onDeck: this.getSettledResult(onDeck)
      });

      logger.info('Plex metrics collection completed successfully');
      return metrics;
    } catch (error) {
      logger.error('Failed to collect Plex metrics:', error);
      throw error;
    }
  }

  private getSettledResult<T>(result: PromiseSettledResult<T>): T | null {
    return result.status === 'fulfilled' ? result.value : null;
  }

  private async getLibraryDetails(libraries: any[]): Promise<any[]> {
    const details = await Promise.allSettled(
      libraries.map(async (library) => {
        try {
          const [details, count, items] = await Promise.allSettled([
            this.api.getLibraryDetails(library.key),
            this.api.getLibraryCount(library.key),
            this.api.getLibraryItems(library.key, { limit: 100 })
          ]);
          
          return {
            ...library,
            details: this.getSettledResult(details),
            count: this.getSettledResult(count),
            items: this.getSettledResult(items) || []
          };
        } catch (error) {
          logger.debug(`Failed to get details for library ${library.key}:`, error);
          return { ...library, details: null, count: 0, items: [] };
        }
      })
    );

    return details.map(result => this.getSettledResult(result)).filter(Boolean);
  }

  private async processMetrics(data: any): Promise<PlexMetrics> {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    // Process server information
    const identity = data.identity?.MediaContainer;
    const capabilities = data.capabilities?.MediaContainer;
    
    const serverMetrics = {
      name: capabilities?.friendlyName || 'Plex Media Server',
      version: identity?.version || 'unknown',
      platform: identity?.platform || 'unknown',
      uptime_hours: identity?.startTime ? 
        Math.floor((now - new Date(identity.startTime).getTime()) / 3600000) : 0,
      machine_identifier: identity?.machineIdentifier || 'unknown',
      claimed: identity?.claimed === true,
      multiuser: capabilities?.multiuser === '1',
      certificate: capabilities?.certificate === '1',
      sync_enabled: capabilities?.sync === '1',
      transcoder_active: capabilities?.transcoder === '1'
    };

    // Process library metrics
    const libraries = data.libraries || [];
    const libraryDetails = data.libraryDetails || [];
    
    const libraryMetrics = {
      total_libraries: libraries.length,
      movie_libraries: libraries.filter((l: any) => l.type === 'movie').length,
      tv_libraries: libraries.filter((l: any) => l.type === 'show').length,
      music_libraries: libraries.filter((l: any) => l.type === 'artist').length,
      photo_libraries: libraries.filter((l: any) => l.type === 'photo').length,
      total_items: 0,
      movies: 0,
      shows: 0,
      episodes: 0,
      artists: 0,
      albums: 0,
      tracks: 0,
      photos: 0,
      library_sizes_gb: {} as { [key: string]: number },
      library_counts: {} as { [key: string]: number }
    };

    // Calculate library counts and sizes
    libraryDetails.forEach((lib: any) => {
      const count = parseInt(lib.count || '0');
      libraryMetrics.library_counts[lib.title] = count;
      libraryMetrics.total_items += count;
      
      // Estimate size from items (rough approximation)
      const items = lib.items || [];
      const totalSize = items.reduce((sum: number, item: any) => {
        return sum + (item.Media?.[0]?.Part?.[0]?.size || 0);
      }, 0);
      libraryMetrics.library_sizes_gb[lib.title] = totalSize / (1024 * 1024 * 1024);
      
      // Count by type
      switch (lib.type) {
        case 'movie':
          libraryMetrics.movies += count;
          break;
        case 'show':
          libraryMetrics.shows += count;
          // Count episodes from items if available
          libraryMetrics.episodes += items.filter((i: any) => i.type === 'episode').length;
          break;
        case 'artist':
          libraryMetrics.artists += count;
          libraryMetrics.albums += items.filter((i: any) => i.type === 'album').length;
          libraryMetrics.tracks += items.filter((i: any) => i.type === 'track').length;
          break;
        case 'photo':
          libraryMetrics.photos += count;
          break;
      }
    });

    // Process user metrics
    const users = data.users || [];
    const userMetrics = {
      total_users: users.length,
      admin_users: users.filter((u: any) => u.id === 1 || u.admin).length,
      home_users: users.filter((u: any) => u.home).length,
      restricted_users: users.filter((u: any) => u.restricted).length,
      managed_users: users.filter((u: any) => u.managed).length,
      recent_users_7d: users.filter((u: any) => 
        u.lastSeenAt && new Date(u.lastSeenAt).getTime() > sevenDaysAgo
      ).length
    };

    // Process activity metrics
    const sessions = data.sessions || [];
    const uniqueUsers = new Set(sessions.map((s: any) => s.User?.id).filter(Boolean));
    
    const sessionsByQuality: { [key: string]: number } = {};
    const sessionsByClient: { [key: string]: number } = {};
    
    sessions.forEach((session: any) => {
      const quality = session.Media?.[0]?.videoResolution || 'unknown';
      sessionsByQuality[quality] = (sessionsByQuality[quality] || 0) + 1;
      
      const client = session.Player?.product || 'unknown';
      sessionsByClient[client] = (sessionsByClient[client] || 0) + 1;
    });

    const activityMetrics = {
      active_sessions: sessions.length,
      direct_play_sessions: sessions.filter((s: any) => 
        !s.TranscodeSession || s.TranscodeSession.videoDecision === 'directplay'
      ).length,
      direct_stream_sessions: sessions.filter((s: any) => 
        s.TranscodeSession?.videoDecision === 'directstream'
      ).length,
      transcode_sessions: sessions.filter((s: any) => 
        s.TranscodeSession?.videoDecision === 'transcode'
      ).length,
      total_bandwidth_mbps: sessions.reduce((sum: number, s: any) => 
        sum + ((s.Media?.[0]?.bitrate || 0) / 1000), 0
      ),
      unique_users_streaming: uniqueUsers.size,
      sessions_by_quality: sessionsByQuality,
      sessions_by_client: sessionsByClient
    };

    // Process transcoding metrics
    const transcodeSessions = data.transcodeSessions?.MediaContainer?.TranscodeSession || [];
    const transcodingMetrics = {
      total_transcode_sessions: transcodeSessions.length,
      video_transcodes: transcodeSessions.filter((t: any) => t.videoDecision === 'transcode').length,
      audio_transcodes: transcodeSessions.filter((t: any) => t.audioDecision === 'transcode').length,
      hw_transcodes: transcodeSessions.filter((t: any) => t.transcodeHwFullPipeline).length,
      sw_transcodes: transcodeSessions.filter((t: any) => !t.transcodeHwFullPipeline).length,
      avg_transcode_speed: transcodeSessions.length > 0 ? 
        transcodeSessions.reduce((sum: number, t: any) => sum + (t.speed || 0), 0) / transcodeSessions.length : 0,
      avg_progress_percent: transcodeSessions.length > 0 ?
        transcodeSessions.reduce((sum: number, t: any) => sum + (t.progress || 0), 0) / transcodeSessions.length : 0,
      throttled_sessions: transcodeSessions.filter((t: any) => t.throttled).length,
      completed_sessions: transcodeSessions.filter((t: any) => t.complete).length
    };

    // Process device metrics
    const devices = data.devices || [];
    const onlineDevices = devices.filter((d: any) => d.presence);
    const recentDevices = devices.filter((d: any) => 
      d.lastSeenAt && new Date(d.lastSeenAt).getTime() > sevenDaysAgo
    );

    const deviceTypes: { [key: string]: number } = {};
    const platforms: { [key: string]: number } = {};
    const products: { [key: string]: number } = {};

    devices.forEach((device: any) => {
      deviceTypes[device.device] = (deviceTypes[device.device] || 0) + 1;
      platforms[device.platform] = (platforms[device.platform] || 0) + 1;
      products[device.product] = (products[device.product] || 0) + 1;
    });

    const deviceMetrics = {
      total_devices: devices.length,
      online_devices: onlineDevices.length,
      device_types: deviceTypes,
      platforms: platforms,
      products: products,
      recently_used_devices_7d: recentDevices.length
    };

    // Process content metrics
    const recentlyAdded = data.recentlyAdded?.MediaContainer?.Metadata || [];
    const onDeck = data.onDeck?.MediaContainer?.Metadata || [];
    const playlists = data.playlists?.MediaContainer?.Metadata || [];

    const recent24h = recentlyAdded.filter((item: any) => 
      item.addedAt && (item.addedAt * 1000) > oneDayAgo
    ).length;
    const recent7d = recentlyAdded.filter((item: any) => 
      item.addedAt && (item.addedAt * 1000) > sevenDaysAgo
    ).length;
    const recent30d = recentlyAdded.filter((item: any) => 
      item.addedAt && (item.addedAt * 1000) > thirtyDaysAgo
    ).length;

    const contentByYear: { [key: string]: number } = {};
    const contentByRating: { [key: string]: number } = {};

    recentlyAdded.forEach((item: any) => {
      if (item.year) {
        contentByYear[item.year] = (contentByYear[item.year] || 0) + 1;
      }
      if (item.contentRating) {
        contentByRating[item.contentRating] = (contentByRating[item.contentRating] || 0) + 1;
      }
    });

    const contentMetrics = {
      recently_added_24h: recent24h,
      recently_added_7d: recent7d,
      recently_added_30d: recent30d,
      on_deck_items: onDeck.length,
      total_playlists: playlists.length,
      smart_playlists: playlists.filter((p: any) => p.smart).length,
      user_playlists: playlists.filter((p: any) => !p.smart).length,
      avg_playlist_size: playlists.length > 0 ? 
        playlists.reduce((sum: number, p: any) => sum + (p.leafCount || 0), 0) / playlists.length : 0,
      content_by_year: contentByYear,
      content_by_rating: contentByRating
    };

    // Process system activities
    const activities = data.activities?.MediaContainer?.Activity || [];
    const activitiesByType: { [key: string]: number } = {};
    
    activities.forEach((activity: any) => {
      activitiesByType[activity.type] = (activitiesByType[activity.type] || 0) + 1;
    });

    const systemMetrics = {
      active_activities: activities.length,
      background_tasks: activities.filter((a: any) => a.type === 'background').length,
      maintenance_tasks: activities.filter((a: any) => a.type === 'maintenance').length,
      scan_activities: activities.filter((a: any) => a.type === 'scan').length,
      optimization_activities: activities.filter((a: any) => a.type === 'optimization').length,
      activities_by_type: activitiesByType
    };

    // Process usage statistics
    const statistics = data.statistics || {};
    const statisticsMedia = statistics.StatisticsMedia || [];
    
    const playsByUser: { [key: string]: number } = {};
    const durationByUser: { [key: string]: number } = {};
    const playsByDevice: { [key: string]: number } = {};
    
    let totalPlays = 0;
    let totalDuration = 0;
    
    statisticsMedia.forEach((stat: any) => {
      totalPlays += stat.count || 0;
      totalDuration += stat.duration || 0;
      
      // Map device and account IDs to names if available
      const deviceName = statistics.Device?.find((d: any) => d.id === stat.deviceID)?.name || `Device-${stat.deviceID}`;
      const userName = statistics.Account?.find((a: any) => a.id === stat.accountID)?.name || `User-${stat.accountID}`;
      
      playsByUser[userName] = (playsByUser[userName] || 0) + (stat.count || 0);
      durationByUser[userName] = (durationByUser[userName] || 0) + (stat.duration || 0);
      playsByDevice[deviceName] = (playsByDevice[deviceName] || 0) + (stat.count || 0);
    });

    const statisticsMetrics = {
      total_plays: totalPlays,
      total_duration_hours: totalDuration / 3600,
      plays_by_user: playsByUser,
      duration_by_user: Object.entries(durationByUser).reduce((acc, [user, duration]) => {
        acc[user] = duration / 3600; // Convert to hours
        return acc;
      }, {} as { [key: string]: number }),
      plays_by_device: playsByDevice,
      popular_content: [] // Would need additional API calls to get popular content
    };

    return {
      server: serverMetrics,
      libraries: libraryMetrics,
      users: userMetrics,
      activity: activityMetrics,
      transcoding: transcodingMetrics,
      devices: deviceMetrics,
      content: contentMetrics,
      system: systemMetrics,
      statistics: statisticsMetrics
    };
  }
}
