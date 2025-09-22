interface PlexConfig {
  url: string;
  token: string;
}

interface PlexLibrary {
  key: string;
  type: string;
  title: string;
  agent: string;
  scanner: string;
  language: string;
  uuid: string;
  updatedAt: number;
  createdAt: number;
  content: string;
  directory: string;
  contentChangedAt: number;
  hidden: number;
  Location: Array<{
    id: number;
    path: string;
  }>;
  count?: string;
  childCount?: string;
  parentCount?: string;
}

interface PlexDevice {
  name: string;
  product: string;
  productVersion: string;
  platform: string;
  platformVersion: string;
  device: string;
  clientIdentifier: string;
  createdAt: string;
  lastSeenAt: string;
  provides: string;
  owned: number;
  accessToken?: string;
  publicAddress: string;
  httpsRequired: number;
  synced: number;
  relay: number;
  dnsRebindingProtection: number;
  natLoopbackSupported: number;
  publicAddressMatches: number;
  presence: number;
}

// PlexUser interface is used by getUsers() method return type
interface PlexUser {
  id: number;
  title: string;
  username: string;
  email: string;
  thumb: string;
  hasPassword: boolean;
  restricted: boolean;
  home: boolean;
  allowSync: boolean;
  protected: boolean;
}

interface PlexSession {
  addedAt: number;
  art: string;
  duration: number;
  grandparentArt: string;
  grandparentGuid: string;
  grandparentKey: string;
  grandparentRatingKey: string;
  grandparentThumb: string;
  grandparentTitle: string;
  guid: string;
  index: number;
  key: string;
  lastViewedAt: number;
  librarySectionID: string;
  librarySectionKey: string;
  librarySectionTitle: string;
  originallyAvailableAt: string;
  parentGuid: string;
  parentIndex: number;
  parentKey: string;
  parentRatingKey: string;
  parentTitle: string;
  parentYear: number;
  ratingKey: string;
  sessionKey: string;
  summary: string;
  thumb: string;
  title: string;
  type: string;
  updatedAt: number;
  viewOffset: number;
  year: number;
  Media: Array<{
    audioChannels: number;
    audioCodec: string;
    audioProfile: string;
    bitrate: number;
    container: string;
    duration: number;
    height: number;
    id: string;
    videoCodec: string;
    videoFrameRate: string;
    videoProfile: string;
    videoResolution: string;
    width: number;
    selected: boolean;
    Part: Array<{
      container: string;
      duration: number;
      file: string;
      id: string;
      key: string;
      size: number;
      videoProfile: string;
      Stream: Array<{
        bitrate?: number;
        codec: string;
        default?: boolean;
        displayTitle: string;
        extendedDisplayTitle: string;
        frameRate?: number;
        height?: number;
        id: string;
        index: number;
        language?: string;
        languageCode?: string;
        selected?: boolean;
        streamType: number;
        width?: number;
      }>;
    }>;
  }>;
  User: {
    id: string;
    thumb: string;
    title: string;
  };
  Player: {
    address: string;
    device: string;
    machineIdentifier: string;
    model: string;
    platform: string;
    platformVersion: string;
    product: string;
    profile: string;
    remotePublicAddress: string;
    state: string;
    title: string;
    vendor: string;
    version: string;
    local: boolean;
    relayed: boolean;
    secure: boolean;
    userID: number;
  };
  TranscodeSession?: {
    key: string;
    throttled: boolean;
    complete: boolean;
    progress: number;
    speed: number;
    duration: number;
    remaining: number;
    context: string;
    sourceVideoCodec: string;
    sourceAudioCodec: string;
    videoDecision: string;
    audioDecision: string;
    protocol: string;
    container: string;
    videoCodec: string;
    audioCodec: string;
    audioChannels: number;
    transcodeHwRequested: boolean;
    transcodeHwFullPipeline: boolean;
  };
}

export class PlexAPI {
  private baseUrl: string;
  private token: string;

  constructor(config: PlexConfig) {
    this.baseUrl = config.url.replace(/\/$/, '');
    this.token = config.token;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'X-Plex-Token': this.token,
      'Accept': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Plex API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Server Information
  async getServerIdentity() {
    return this.makeRequest<{
      MediaContainer: {
        size: number;
        claimed: boolean;
        machineIdentifier: string;
        version: string;
        platform: string;
        platformVersion: string;
        updatedAt: number;
      };
    }>('/identity');
  }

  async getServerCapabilities() {
    return this.makeRequest<{
      MediaContainer: {
        size: number;
        allowCameraUpload: boolean;
        allowChannelAccess: boolean;
        allowMediaDeletion: boolean;
        allowSharing: boolean;
        allowSync: boolean;
        allowTuners: boolean;
        backgroundProcessing: boolean;
        certificate: boolean;
        companionProxy: boolean;
        countryCode: string;
        diagnostics: string;
        eventStream: boolean;
        friendlyName: string;
        livetv: number;
        machineIdentifier: string;
        mediaProviders: boolean;
        multiuser: boolean;
        myPlex: boolean;
        myPlexMappingState: string;
        myPlexSigninState: string;
        myPlexSubscription: boolean;
        myPlexUsername: string;
        platform: string;
        platformVersion: string;
        pluginHost: boolean;
        readOnlyLibraries: boolean;
        streamingBrainABRVersion: number;
        streamingBrainVersion: number;
        sync: boolean;
        transcoder: boolean;
        transcoderActiveVideoSessions: number;
        transcoderAudio: boolean;
        transcoderLyrics: boolean;
        transcoderSubtitles: boolean;
        transcoderVideo: boolean;
        transcoderVideoBitrates: string;
        transcoderVideoQualities: string;
        transcoderVideoResolutions: string;
        updatedAt: number;
        updater: boolean;
        version: string;
        voiceSearch: boolean;
      };
    }>('/');
  }

  // Libraries
  async getLibraries() {
    const response = await this.makeRequest<{
      MediaContainer: {
        size: number;
        allowSync: boolean;
        title1: string;
        Directory: PlexLibrary[];
      };
    }>('/library/sections');
    
    return response.MediaContainer.Directory;
  }

  async getLibraryDetails(sectionId: string) {
    return this.makeRequest<{
      MediaContainer: {
        size: number;
        allowSync: boolean;
        art: string;
        content: string;
        identifier: string;
        librarySectionID: number;
        mediaTagPrefix: string;
        mediaTagVersion: number;
        thumb: string;
        title1: string;
        viewGroup: string;
        viewMode: number;
        Directory: Array<{
          key: string;
          title: string;
        }>;
      };
    }>(`/library/sections/${sectionId}`);
  }

  async getLibraryCount(sectionId: string) {
    const response = await this.makeRequest<{
      MediaContainer: {
        size: number;
        totalSize: number;
      };
    }>(`/library/sections/${sectionId}/all?X-Plex-Container-Start=0&X-Plex-Container-Size=0`);
    
    return response.MediaContainer.totalSize || 0;
  }

  async getLibraryItems(sectionId: string, options: { limit?: number; offset?: number } = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.set('X-Plex-Container-Size', options.limit.toString());
    if (options.offset) params.set('X-Plex-Container-Start', options.offset.toString());
    
    return this.makeRequest<{
      MediaContainer: {
        size: number;
        totalSize: number;
        offset: number;
        title: string;
        Metadata: Array<{
          key: string;
          ratingKey?: string;
          title: string;
          type: string;
          thumb?: string;
          art?: string;
          addedAt?: number;
          updatedAt?: number;
          year?: number;
          parentTitle?: string;
          grandparentTitle?: string;
        }>;
      };
    }>(`/library/sections/${sectionId}/all?${params.toString()}`);
  }

  // Users
  async getUsers(): Promise<PlexUser[]> {
    const response = await this.makeRequest<{
      MediaContainer: {
        size: number;
        identifier?: string;
        Account?: Array<{
          id: number;
          key: string;
          name: string;
          defaultAudioLanguage?: string;
          autoSelectAudio?: boolean;
          defaultSubtitleLanguage?: string;
          subtitleMode?: number;
          thumb?: string;
        }>;
      };
    }>('/accounts');
    
    // Map Account array to PlexUser format
    if (response.MediaContainer.Account) {
      return response.MediaContainer.Account.map(account => ({
        id: account.id,
        title: account.name || 'Unknown User',
        username: account.name || '',
        email: '', // Not provided by /accounts endpoint
        thumb: account.thumb || '',
        hasPassword: false,
        restricted: false,
        home: account.id !== 0, // ID 0 is typically the admin
        allowSync: true,
        protected: false,
      }));
    }
    
    return [];
  }

  // Sessions
  async getSessions() {
    const response = await this.makeRequest<{
      MediaContainer: {
        size: number;
        Metadata?: PlexSession[];
      };
    }>('/status/sessions');
    
    return response.MediaContainer.Metadata || [];
  }

  // System
  async getDevices() {
    const response = await this.makeRequest<{
      MediaContainer: {
        size: number;
        Device: PlexDevice[];
      };
    }>('/devices');
    
    return response.MediaContainer.Device;
  }

  async getStatistics() {
    const response = await this.makeRequest<{
      MediaContainer: {
        size: number;
        Device: Array<{
          id: number;
          name: string;
          platform: string;
          clientIdentifier: string;
        }>;
        Account: Array<{
          id: number;
          key: string;
          name: string;
          defaultAudioLanguage: string;
          autoSelectAudio: boolean;
          defaultSubtitleLanguage: string;
          subtitleMode: number;
          thumb: string;
        }>;
        StatisticsMedia?: Array<{
          accountID: number;
          deviceID: number;
          timespan: number;
          at: number;
          metadataType: number;
          count: number;
          duration: number;
        }>;
      };
    }>('/statistics/media');
    
    return response.MediaContainer;
  }

  // Activities
  async getActivities() {
    return this.makeRequest<{
      MediaContainer: {
        size: number;
        Activity?: Array<{
          uuid: string;
          type: string;
          cancellable: boolean;
          userID: number;
          title: string;
          subtitle: string;
          progress: number;
        }>;
      };
    }>('/activities');
  }

  // Transcode Sessions
  async getTranscodeSessions() {
    return this.makeRequest<{
      MediaContainer: {
        size: number;
        TranscodeSession?: Array<{
          key: string;
          throttled: boolean;
          complete: boolean;
          progress: number;
          speed: number;
          duration: number;
          remaining: number;
          context: string;
          sourceVideoCodec: string;
          sourceAudioCodec: string;
          videoDecision: string;
          audioDecision: string;
          protocol: string;
          container: string;
          videoCodec: string;
          audioCodec: string;
          audioChannels: number;
          transcodeHwRequested: boolean;
          transcodeHwFullPipeline: boolean;
        }>;
      };
    }>('/transcode/sessions');
  }

  // Playlists
  async getPlaylists() {
    return this.makeRequest<{
      MediaContainer: {
        size: number;
        Metadata?: Array<{
          ratingKey: string;
          key: string;
          guid: string;
          type: string;
          title: string;
          summary: string;
          smart: boolean;
          playlistType: string;
          composite: string;
          duration: number;
          leafCount: number;
          addedAt: number;
          updatedAt: number;
        }>;
      };
    }>('/playlists');
  }

  // Recently Added
  async getRecentlyAdded(sectionId?: string) {
    const endpoint = sectionId 
      ? `/library/sections/${sectionId}/recentlyAdded`
      : '/library/recentlyAdded';
    
    return this.makeRequest<{
      MediaContainer: {
        size: number;
        Metadata: Array<{
          key: string;
          ratingKey?: string;
          title: string;
          type: string;
          thumb?: string;
          art?: string;
          addedAt?: number;
          updatedAt?: number;
          year?: number;
          parentTitle?: string;
          grandparentTitle?: string;
        }>;
      };
    }>(endpoint);
  }

  // On Deck
  async getOnDeck() {
    return this.makeRequest<{
      MediaContainer: {
        size: number;
        Metadata: Array<{
          key: string;
          ratingKey?: string;
          title: string;
          type: string;
          thumb?: string;
          art?: string;
          addedAt?: number;
          updatedAt?: number;
          year?: number;
          parentTitle?: string;
          grandparentTitle?: string;
          viewOffset?: number;
          duration?: number;
        }>;
      };
    }>('/library/onDeck');
  }
}