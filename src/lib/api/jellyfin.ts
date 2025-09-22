import https from 'https';
import http from 'http';

export interface JellyfinSystemInfo {
  LocalAddress: string;
  ServerName: string;
  Version: string;
  ProductName: string;
  OperatingSystem: string;
  Id: string;
  StartupWizardCompleted: boolean;
}

export interface JellyfinItemCounts {
  MovieCount: number;
  SeriesCount: number;
  EpisodeCount: number;
  ArtistCount: number;
  ProgramCount: number;
  TrailerCount: number;
  SongCount: number;
  AlbumCount: number;
  MusicVideoCount: number;
  BoxSetCount: number;
  BookCount: number;
  ItemCount: number;
}

interface JellyfinSession {
  Id: string;
  UserId?: string;
  UserName?: string;
  Client?: string;
  LastActivityDate?: string;
  DeviceName?: string;
  NowPlayingItem?: {
    Name: string;
    Type: string;
    RunTimeTicks?: number;
    ProductionYear?: number;
  };
  PlayState?: {
    IsPaused: boolean;
    PositionTicks?: number;
  };
}

interface JellyfinLibrary {
  Name: string;
  ItemId: string;
  CollectionType: string;
  Locations: string[];
}

export interface JellyfinRecentItem {
  Id: string;
  Name: string;
  Type: string;
  DateCreated: string;
  PremiereDate?: string;
  SeriesName?: string;
  Overview?: string;
  ImageTags?: {
    Primary?: string;
  };
  PrimaryImageItemId?: string;
  PrimaryImageTag?: string;
}

export interface JellyfinOverview {
  serverInfo: JellyfinSystemInfo;
  itemCounts: JellyfinItemCounts;
  activeSessions: JellyfinSession[];
  libraries: JellyfinLibrary[];
  recentlyAdded: JellyfinRecentItem[];
  isConnected: boolean;
  error?: string;
}

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function fetchJellyfin<T>(url: string, apiKey: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const options = {
      headers: {
        'X-Emby-Token': apiKey,
        'X-Emby-Authorization': `Emby Token="${apiKey}"`
      },
      ...(isHttps && { agent: httpsAgent })
    };
    
    client.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Failed to parse Jellyfin response'));
        }
      });
    }).on('error', reject);
  });
}

export async function getJellyfinOverview(jellyfinUrl: string, apiKey: string): Promise<JellyfinOverview> {
  const overview: JellyfinOverview = {
    serverInfo: {} as JellyfinSystemInfo,
    itemCounts: {} as JellyfinItemCounts,
    activeSessions: [],
    libraries: [],
    recentlyAdded: [],
    isConnected: false
  };

  try {
    // Get system info
    overview.serverInfo = await fetchJellyfin<JellyfinSystemInfo>(
      `${jellyfinUrl}/System/Info/Public`,
      apiKey
    );
    
    // Get item counts
    overview.itemCounts = await fetchJellyfin<JellyfinItemCounts>(
      `${jellyfinUrl}/Items/Counts`,
      apiKey
    );
    
    // Get active sessions
    try {
      overview.activeSessions = await fetchJellyfin<JellyfinSession[]>(
        `${jellyfinUrl}/Sessions`,
        apiKey
      );
    } catch {
      // Sessions might require more permissions
      overview.activeSessions = [];
    }
    
    // Get libraries
    try {
      overview.libraries = await fetchJellyfin<JellyfinLibrary[]>(
        `${jellyfinUrl}/Library/VirtualFolders`,
        apiKey
      );
    } catch {
      // Libraries might require more permissions
      overview.libraries = [];
    }
    
    // Get recently added items
    try {
      // First get the user ID
      const users = await fetchJellyfin<Array<{ Id: string }>>(
        `${jellyfinUrl}/Users`,
        apiKey
      );
      
      if (users.length > 0) {
        const userId = users[0].Id;
        overview.recentlyAdded = await fetchJellyfin<JellyfinRecentItem[]>(
          `${jellyfinUrl}/Users/${userId}/Items/Latest?Limit=10&Fields=DateCreated,PremiereDate,Overview,PrimaryImageAspectRatio&EnableImageTypes=Primary`,
          apiKey
        );
      }
    } catch {
      // Recently added might require more permissions
      overview.recentlyAdded = [];
    }
    
    overview.isConnected = true;
  } catch (error) {
    overview.error = error instanceof Error ? error.message : 'Unknown error';
    overview.isConnected = false;
  }

  return overview;
}

export function getJellyfinImageUrl(jellyfinUrl: string, itemId: string, imageTag?: string): string {
  if (!imageTag) return '';
  return `${jellyfinUrl}/Items/${itemId}/Images/Primary?tag=${imageTag}`;
}

export async function testJellyfinConnection(jellyfinUrl: string, apiKey: string): Promise<boolean> {
  try {
    await fetchJellyfin<JellyfinSystemInfo>(`${jellyfinUrl}/System/Info/Public`, apiKey);
    return true;
  } catch {
    return false;
  }
}