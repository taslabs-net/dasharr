/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRefreshInterval } from '@/hooks/use-refresh-interval';

interface CurrentStream {
  session_id: string;
  user: string;
  user_thumb?: string;
  full_title: string;
  title: string;
  media_type: string;
  state: string;
  progress_percent: number;
  transcode_decision: string;
  bandwidth: number;
  stream_bitrate: number;
  platform: string;
  player: string;
  thumb?: string;
  grandparent_thumb?: string;
  art?: string;
}

interface LibraryInfo {
  section_id: string;
  section_name: string;
  section_type: string;
  count: number;
  thumb?: string;
  art?: string;
}

interface HistoryItem {
  id: number;
  date: number;
  started: number;
  stopped: number;
  duration: number;
  user: string;
  full_title: string;
  media_type: string;
  thumb?: string;
  grandparent_thumb?: string;
  watched_status: number;
}

interface TautulliData {
  system: {
    serverInfo: any;
    serverIdentity: any;
    tautulliInfo: any;
  };
  stats: {
    activeStreams: number;
    totalBandwidth: number;
    libraryCount: number;
    userCount: number;
    totalPlays: number;
    transcodeStreams: number;
    directPlayStreams: number;
    directStreams: number;
  };
  activity: {
    current: CurrentStream[];
    recentHistory: HistoryItem[];
    recentlyAdded: any[];
  };
  libraries: LibraryInfo[];
  users: any[];
  homeStats: any;
}

interface TautulliOverviewProps {
  instanceId: string;
  instanceName: string;
}

export default function TautulliOverview({ instanceId, instanceName }: TautulliOverviewProps) {
  const [data, setData] = useState<TautulliData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceUrl, setServiceUrl] = useState<string | null>(null);
  const refreshInterval = useRefreshInterval();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch overview data
        const res = await fetch(`/api/services/tautulli/overview?instance=${instanceId}`);
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
          <h2 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">Error Loading Tautulli Data</h2>
          <p className="text-fd-muted-foreground">{error || 'Unknown error occurred'}</p>
        </div>
      </div>
    );
  }

  const formatBitrate = (bitrate: number) => {
    if (!bitrate) return '0 Mbps';
    return `${(bitrate / 1000).toFixed(1)} Mbps`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getStreamDecisionColor = (decision: string) => {
    switch (decision.toLowerCase()) {
      case 'direct play': return 'text-green-500';
      case 'direct stream': return 'text-blue-500';
      case 'transcode': return 'text-yellow-500';
      default: return 'text-fd-muted-foreground';
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
          src="/icons/tautulli.svg"
          alt="Tautulli"
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
            {data.system.tautulliInfo?.tautulli_version ? `Version: ${data.system.tautulliInfo.tautulli_version}` : ''} • 
            Plex: {data.system.serverIdentity?.machine_identifier ? '✅ Connected' : '❌ Disconnected'} • 
            Libraries: {data.stats.libraryCount}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Active Streams</div>
          <div className="text-2xl font-bold text-green-500">{data.stats.activeStreams}</div>
          <div className="text-xs text-fd-muted-foreground mt-1">
            Total bandwidth: {formatBitrate(data.stats.totalBandwidth)}
          </div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Stream Types</div>
          <div className="text-2xl font-bold">{data.stats.directPlayStreams}</div>
          <div className="text-xs text-fd-muted-foreground mt-1">
            Direct: {data.stats.directPlayStreams + data.stats.directStreams}, Transcode: {data.stats.transcodeStreams}
          </div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Total Users</div>
          <div className="text-2xl font-bold">{data.stats.userCount}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Total Plays</div>
          <div className="text-2xl font-bold">{data.stats.totalPlays.toLocaleString()}</div>
        </div>
      </div>

      {/* Active Streams */}
      {data.activity.current.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Currently Playing</h2>
          <div className="space-y-4">
            {data.activity.current.map((stream) => (
              <div key={stream.session_id} className="bg-fd-card border border-fd-border rounded-lg p-4">
                <div className="flex items-start gap-4">
                  {stream.thumb && (
                    <img
                      src={stream.thumb}
                      alt={stream.title}
                      className="w-20 h-30 object-cover rounded"
                    />
                  )}
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {getStateIcon(stream.state)} {stream.full_title}
                        </h3>
                        <p className="text-sm text-fd-muted-foreground">
                          {stream.user} • {stream.platform} ({stream.player})
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${getStreamDecisionColor(stream.transcode_decision)}`}>
                          {stream.transcode_decision}
                        </p>
                        <p className="text-sm text-fd-muted-foreground">
                          {formatBitrate(stream.stream_bitrate)}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-fd-muted rounded-full h-2">
                      <div
                        className="bg-dasharr-purple h-2 rounded-full"
                        style={{ width: `${stream.progress_percent}%` }}
                      />
                    </div>
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
            <div key={library.section_id} className="bg-fd-card border border-fd-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                {library.thumb && (
                  <img
                    src={library.thumb}
                    alt={library.section_name}
                    className="w-12 h-12 rounded"
                  />
                )}
                <div>
                  <h3 className="font-semibold">{library.section_name}</h3>
                  <p className="text-sm text-fd-muted-foreground">
                    {library.count.toLocaleString()} items
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent History */}
      {data.activity.recentHistory.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="bg-fd-card border border-fd-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-fd-muted/50">
                <tr>
                  <th className="text-left p-4">Media</th>
                  <th className="text-left p-4">User</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Duration</th>
                  <th className="text-left p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.activity.recentHistory.slice(0, 10).map((item) => (
                  <tr key={item.id} className="border-t border-fd-border">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {(item.thumb || item.grandparent_thumb) && (
                          <img
                            src={item.thumb || item.grandparent_thumb}
                            alt={item.full_title}
                            className="w-10 h-15 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium truncate max-w-xs">{item.full_title}</div>
                          <div className="text-xs text-fd-muted-foreground">{item.media_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{item.user}</td>
                    <td className="p-4 text-sm">{formatDate(item.date)}</td>
                    <td className="p-4 text-sm">{formatDuration(item.duration)}</td>
                    <td className="p-4">
                      <span className={`text-sm ${item.watched_status === 1 ? 'text-green-500' : 'text-yellow-500'}`}>
                        {item.watched_status === 1 ? '✓ Watched' : '◐ Partial'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Stats */}
      {data.homeStats && Object.keys(data.homeStats).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {data.homeStats.top_movies && data.homeStats.top_movies.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Top Movies</h3>
              <div className="bg-fd-card border border-fd-border rounded-lg divide-y divide-fd-border">
                {data.homeStats.top_movies.slice(0, 5).map((movie: any, idx: number) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <span className="truncate">{movie.title}</span>
                    <span className="text-sm text-fd-muted-foreground">{movie.total_plays} plays</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.homeStats.top_tv && data.homeStats.top_tv.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Top TV Shows</h3>
              <div className="bg-fd-card border border-fd-border rounded-lg divide-y divide-fd-border">
                {data.homeStats.top_tv.slice(0, 5).map((show: any, idx: number) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <span className="truncate">{show.title}</span>
                    <span className="text-sm text-fd-muted-foreground">{show.total_plays} plays</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}