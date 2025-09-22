/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRefreshInterval } from '@/hooks/use-refresh-interval';

interface JellyfinSystemInfo {
  LocalAddress: string;
  ServerName: string;
  Version: string;
  ProductName: string;
  OperatingSystem: string;
  Id: string;
  StartupWizardCompleted: boolean;
}

interface JellyfinItemCounts {
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

interface JellyfinRecentItem {
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

interface JellyfinOverview {
  serverInfo: JellyfinSystemInfo;
  itemCounts: JellyfinItemCounts;
  activeSessions: JellyfinSession[];
  libraries: JellyfinLibrary[];
  recentlyAdded: JellyfinRecentItem[];
  isConnected: boolean;
  error?: string;
}

interface JellyfinOverviewProps {
  instanceId: string;
  instanceName: string;
}

const JellyfinOverviewComponent = ({ instanceId, instanceName }: JellyfinOverviewProps) => {
  const [data, setData] = useState<JellyfinOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<{ url?: string; apiKey?: string } | null>(null);
  const [serviceUrl, setServiceUrl] = useState<string | null>(null);
  const refreshInterval = useRefreshInterval();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch overview data
        const res = await fetch(`/api/services/jellyfin/overview?instance=${instanceId}`);
        if (!res.ok) throw new Error('Failed to fetch data');
        const data = await res.json();
        setData(data);
        
        // Get config for image URLs and service URL
        const serviceType = instanceId.replace(/\d+$/, '');
        const configRes = await fetch(`/api/public/instances/${serviceType}/${instanceId}`);
        if (configRes.ok) {
          const configData = await configRes.json();
          setConfig({ url: configData.instance.url, apiKey: configData.instance.apiKey });
          setServiceUrl(configData.instance.url);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, instanceId]);

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-fd-muted rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-fd-card rounded-lg p-4 h-24 border border-fd-border"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data || !data.isConnected) {
    return (
      <div className="min-h-screen p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">Error Loading Jellyfin Data</h2>
          <p className="text-fd-muted-foreground">{error || data?.error || 'Unknown error occurred'}</p>
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRuntime = (ticks?: number) => {
    if (!ticks) return '';
    const minutes = Math.round(ticks / 600000000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getJellyfinImageUrl = (itemId: string, imageTag?: string): string => {
    if (!imageTag || !config?.url) return '';
    return `${config.url}/Items/${itemId}/Images/Primary?tag=${imageTag}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'movie': return '🎬';
      case 'series': return '📺';
      case 'episode': return '📺';
      case 'audio': return '🎵';
      case 'musicalbum': return '💿';
      case 'book': return '📚';
      default: return '📁';
    }
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Image
          src="/icons/jellyfin.svg"
          alt="Jellyfin"
          width={48}
          height={48}
          className="rounded"
        />
        <div>
          {serviceUrl ? (
            <a 
              href={serviceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <h1 className="text-3xl font-bold flex items-center gap-2">
                {instanceName}
                <span className="text-lg text-fd-muted-foreground">↗</span>
              </h1>
            </a>
          ) : (
            <h1 className="text-3xl font-bold">{instanceName}</h1>
          )}
          <p className="text-fd-muted-foreground">
            {data.serverInfo.ProductName} {data.serverInfo.Version} • 
            Server: {data.serverInfo.ServerName} • 
            OS: {data.serverInfo.OperatingSystem}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Movies</div>
          <div className="text-2xl font-bold">{data.itemCounts.MovieCount}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">TV Shows</div>
          <div className="text-2xl font-bold">{data.itemCounts.SeriesCount}</div>
          <div className="text-xs text-fd-muted-foreground mt-1">
            {data.itemCounts.EpisodeCount} episodes
          </div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Music</div>
          <div className="text-2xl font-bold">{data.itemCounts.AlbumCount}</div>
          <div className="text-xs text-fd-muted-foreground mt-1">
            {data.itemCounts.SongCount} songs
          </div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Total Items</div>
          <div className="text-2xl font-bold">{data.itemCounts.ItemCount}</div>
        </div>
      </div>

      {/* Active Sessions */}
      {data.activeSessions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Active Sessions</h2>
          <div className="space-y-2">
            {data.activeSessions.filter(session => session.UserName).map((session) => (
              <div key={session.Id} className="bg-fd-card border border-fd-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{session.UserName}</div>
                    <div className="text-sm text-fd-muted-foreground">
                      {session.Client} on {session.DeviceName}
                    </div>
                    {session.NowPlayingItem && (
                      <div className="mt-2">
                        <div className="text-sm">
                          {session.PlayState?.IsPaused ? '⏸️' : '▶️'} {session.NowPlayingItem.Name}
                        </div>
                        {session.NowPlayingItem.ProductionYear && (
                          <div className="text-xs text-fd-muted-foreground">
                            {session.NowPlayingItem.Type} • {session.NowPlayingItem.ProductionYear}
                            {session.NowPlayingItem.RunTimeTicks && ` • ${formatRuntime(session.NowPlayingItem.RunTimeTicks)}`}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {session.LastActivityDate && (
                    <div className="text-sm text-fd-muted-foreground">
                      Last active: {formatDate(session.LastActivityDate)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Libraries */}
      {data.libraries.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Libraries</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.libraries.map((library) => (
              <div key={library.ItemId} className="bg-fd-card border border-fd-border rounded-lg p-4">
                <div className="font-semibold">{library.Name}</div>
                <div className="text-sm text-fd-muted-foreground">{library.CollectionType}</div>
                {library.Locations.length > 0 && (
                  <div className="text-xs text-fd-muted-foreground mt-1">
                    {library.Locations[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Added */}
      {data.recentlyAdded.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Recently Added</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.recentlyAdded.map((item) => {
              const imageUrl = getJellyfinImageUrl(
                item.PrimaryImageItemId || item.Id,
                item.PrimaryImageTag || item.ImageTags?.Primary
              );
              
              return (
                <div key={item.Id} className="bg-fd-card border border-fd-border rounded-lg overflow-hidden hover:bg-fd-accent transition-colors">
                  <div className="aspect-[2/3] relative">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.Name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-fd-muted flex items-center justify-center">
                        <span className="text-fd-muted-foreground text-4xl">{getTypeIcon(item.Type)}</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-black/50 text-white">
                        {getTypeIcon(item.Type)} {item.Type}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold truncate">{item.Name}</h3>
                    {item.SeriesName && (
                      <p className="text-sm text-fd-muted-foreground truncate">{item.SeriesName}</p>
                    )}
                    <p className="text-xs text-fd-muted-foreground mt-1">
                      Added {formatDate(item.DateCreated)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Box Sets</div>
          <div className="text-xl font-bold">{data.itemCounts.BoxSetCount}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Music Videos</div>
          <div className="text-xl font-bold">{data.itemCounts.MusicVideoCount}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Books</div>
          <div className="text-xl font-bold">{data.itemCounts.BookCount}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Trailers</div>
          <div className="text-xl font-bold">{data.itemCounts.TrailerCount}</div>
        </div>
      </div>
    </div>
  );
};

export default JellyfinOverviewComponent;