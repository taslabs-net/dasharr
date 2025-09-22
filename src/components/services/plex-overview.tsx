/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRefreshInterval } from '@/hooks/use-refresh-interval';

interface Library {
  id: string;
  title: string;
  type: string;
  count: number;
}

interface User {
  id: string;
  title: string;
  username: string;
  email?: string;
  thumb?: string;
  isAdmin: boolean;
}

interface ActiveSession {
  sessionKey: string;
  title: string;
  type: string;
  user: {
    id: string;
    title: string;
    thumb?: string;
  };
  player: {
    title: string;
    device?: string;
    platform?: string;
    product?: string;
    state: string;
  };
  progress: number;
  transcoding: boolean;
  bandwidth: number;
}

interface MediaItem {
  title: string;
  type: string;
  thumb?: string;
  art?: string;
  addedAt: number;
  year?: number;
  parentTitle?: string;
  grandparentTitle?: string;
  ratingKey: string;
  viewOffset?: number;
  duration?: number;
  progress?: number;
}

interface PlexData {
  server: {
    name: string;
    version: string;
    platform: string;
    platformVersion: string;
    updatedAt: number;
    myPlexUsername?: string;
  };
  stats: {
    totalItems: number;
    movieCount: number;
    showCount: number;
    episodeCount: number;
    artistCount?: number;
    albumCount?: number;
    photoCount?: number;
    libraryCount: number;
    userCount: number;
    activeStreams: number;
    totalBandwidth: number;
    transcodeSessions: number;
    directPlaySessions: number;
  };
  libraries: Library[];
  users: User[];
  activeSessions: ActiveSession[];
  recentlyAdded: MediaItem[];
  onDeck: MediaItem[];
}

interface PlexOverviewProps {
  instanceId: string;
  instanceName: string;
}

export default function PlexOverview({ instanceId, instanceName }: PlexOverviewProps) {
  const [data, setData] = useState<PlexData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceUrl, setServiceUrl] = useState<string | null>(null);
  const refreshInterval = useRefreshInterval();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch overview data
        const res = await fetch(`/api/services/plex/overview?instance=${instanceId}`);
        if (!res.ok) throw new Error('Failed to fetch data');
        const data = await res.json();
        setData(data);

        // Fetch instance config to get URL
        const serviceType = instanceId.replace(/\d+$/, '');
        const configRes = await fetch(`/api/public/instances/${serviceType}/${instanceId}`);
        if (configRes.ok) {
          const configData = await configRes.json();
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

  if (error || !data) {
    return (
      <div className="min-h-screen p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">Error Loading Plex Data</h2>
          <p className="text-fd-muted-foreground">{error || 'Unknown error occurred'}</p>
        </div>
      </div>
    );
  }

  const formatBitrate = (kbps: number) => {
    if (kbps > 1000) {
      return `${(kbps / 1000).toFixed(1)} Mbps`;
    }
    return `${kbps} kbps`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getLibraryIcon = (type: string) => {
    switch (type) {
      case 'movie': return '🎬';
      case 'show': return '📺';
      case 'artist': return '🎵';
      case 'photo': return '📷';
      default: return '📁';
    }
  };

  const getStateIcon = (state: string) => {
    switch (state.toLowerCase()) {
      case 'playing': return '▶️';
      case 'paused': return '⏸️';
      case 'buffering': return '⏳';
      default: return '⏹️';
    }
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Image
          src="/icons/plex.svg"
          alt="Plex"
          width={48}
          height={48}
          className="rounded dark:hidden"
        />
        <Image
          src="/icons/plex-light.svg"
          alt="Plex"
          width={48}
          height={48}
          className="rounded hidden dark:block"
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
            {data.server.name} • Version: {data.server.version} • 
            Platform: {data.server.platform} {data.server.platformVersion}
            {data.server.myPlexUsername && ` • Plex Account: ${data.server.myPlexUsername}`}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Total Media</div>
          <div className="text-2xl font-bold">{data.stats.totalItems.toLocaleString()}</div>
          <div className="text-xs text-fd-muted-foreground mt-1">
            Across {data.stats.libraryCount} libraries
          </div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Active Streams</div>
          <div className="text-2xl font-bold text-green-500">{data.stats.activeStreams}</div>
          <div className="text-xs text-fd-muted-foreground mt-1">
            {data.stats.transcodeSessions} transcoding, {data.stats.directPlaySessions} direct
          </div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Total Bandwidth</div>
          <div className="text-2xl font-bold text-blue-500">{formatBitrate(data.stats.totalBandwidth)}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Users</div>
          <div className="text-2xl font-bold">{data.stats.userCount}</div>
        </div>
      </div>

      {/* Active Sessions */}
      {data.activeSessions && data.activeSessions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Currently Playing</h2>
          <div className="space-y-4">
            {data.activeSessions.map((session) => (
              <div key={session.sessionKey} className="bg-fd-card border border-fd-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{getStateIcon(session.player.state)}</span>
                        <h3 className="font-semibold text-lg">{session.title}</h3>
                      </div>
                      <p className="text-sm text-fd-muted-foreground">
                        {session.user.title} • {session.player.title} ({session.player.platform})
                        {session.transcoding && ' • 🔄 Transcoding'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatBitrate(session.bandwidth)}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-fd-muted rounded-full h-2">
                    <div
                      className="bg-dasharr-purple h-2 rounded-full"
                      style={{ width: `${session.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Libraries */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Libraries</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.libraries.map((library) => (
            <div key={library.id} className="bg-fd-card border border-fd-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getLibraryIcon(library.type)}</span>
                <div>
                  <h3 className="font-semibold">{library.title}</h3>
                  <p className="text-sm text-fd-muted-foreground">
                    {library.count.toLocaleString()} items
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* On Deck */}
      {data.onDeck && data.onDeck.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Continue Watching</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {data.onDeck.map((item) => (
              <div key={item.ratingKey} className="bg-fd-card border border-fd-border rounded-lg overflow-hidden">
                <div className="aspect-[16/9] relative">
                  {item.thumb ? (
                    <img
                      src={item.thumb}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-fd-muted flex items-center justify-center">
                      <span className="text-fd-muted-foreground">No Image</span>
                    </div>
                  )}
                  {item.progress !== undefined && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                      <div
                        className="h-1 bg-dasharr-purple"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate" title={item.title}>
                    {item.title}
                  </h3>
                  {(item.parentTitle || item.grandparentTitle) && (
                    <p className="text-xs text-fd-muted-foreground truncate">
                      {item.grandparentTitle || item.parentTitle}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Added */}
      {data.recentlyAdded && data.recentlyAdded.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Recently Added</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {data.recentlyAdded.map((item) => (
              <div key={item.ratingKey} className="bg-fd-card border border-fd-border rounded-lg overflow-hidden">
                <div className="aspect-[2/3] relative">
                  {item.thumb ? (
                    <img
                      src={item.thumb}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-fd-muted flex items-center justify-center">
                      <span className="text-fd-muted-foreground">No Image</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/70 rounded px-2 py-1 text-xs">
                    {item.type === 'movie' ? '🎬' : item.type === 'episode' ? '📺' : '🎵'}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate" title={item.title}>
                    {item.title}
                  </h3>
                  <p className="text-xs text-fd-muted-foreground">
                    {item.year && `${item.year} • `}
                    {formatDate(item.addedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users */}
      <div>
        <h2 className="text-xl font-bold mb-4">Users</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.users.map((user) => (
            <div key={user.id} className="bg-fd-card border border-fd-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                {user.thumb ? (
                  <img
                    src={user.thumb}
                    alt={user.title}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-fd-muted flex items-center justify-center">
                    <span className="text-lg">👤</span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{user.title}</h3>
                  <p className="text-sm text-fd-muted-foreground">
                    {user.isAdmin ? '👑 Admin' : 'User'}
                    {user.email && ` • ${user.email}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}