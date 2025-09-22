/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRefreshInterval } from '@/hooks/use-refresh-interval';

interface SystemStatus {
  version: string;
  branch: string;
  urlBase?: string;
  osName?: string;
}

interface Show {
  id: number;
  title: string;
  year: number;
  monitored: boolean;
  sizeOnDisk: number;
  added: string;
  images?: Array<{
    coverType: string;
    url?: string;
    remoteUrl?: string;
  }>;
  statistics?: {
    totalEpisodeCount: number;
    episodeFileCount: number;
    percentOfEpisodes: number;
  };
  network?: string;
  status?: string;
  ratings?: {
    value: number;
  };
}

interface Episode {
  id: number;
  title: string;
  episodeNumber: number;
  seasonNumber: number;
  airDateUtc?: string;
  hasFile: boolean;
  series?: Show;
}

interface QueueItem {
  id: number;
  title: string;
  quality?: {
    quality?: {
      name: string;
    };
  };
  size: number;
  sizeleft: number;
  timeleft?: string;
}

interface HistoryItem {
  id: number;
  date: string;
  sourceTitle: string;
  eventType: string;
  quality?: {
    quality?: {
      name: string;
    };
  };
  series?: {
    id: number;
    title: string;
    images?: Array<{
      coverType: string;
      url?: string;
    }>;
  };
}

interface HealthIssue {
  message: string;
  wikiUrl?: string;
}

interface SonarrData {
  system: {
    status: SystemStatus | null;
    health: HealthIssue[] | null;
    updates: unknown[] | null;
  };
  stats: {
    totalShows: number;
    monitoredShows: number;
    totalEpisodes: number;
    downloadedEpisodes: number;
    missingEpisodes: number;
    queuedItems: number;
    upcomingEpisodes: number;
    totalFileSize: number;
  };
  activity: {
    queue: QueueItem[];
    queueStatus: unknown;
    recentHistory: HistoryItem[];
    calendar: Episode[];
    wantedMissing: unknown[];
    commands: unknown[];
    tasks: unknown[];
  };
  configuration: {
    indexers: unknown[] | null;
    downloadClients: unknown[] | null;
    rootFolders: unknown[] | null;
    qualityProfiles: unknown[] | null;
  };
  maintenance: {
    backups: unknown[] | null;
  };
  series: {
    recent: Show[];
    upcoming: Episode[];
    active: Show[];
  };
}

interface SonarrOverviewProps {
  instanceId: string;
  instanceName: string;
}

export default function SonarrOverview({ instanceId, instanceName }: SonarrOverviewProps) {
  const [data, setData] = useState<SonarrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceUrl, setServiceUrl] = useState<string | null>(null);
  const refreshInterval = useRefreshInterval();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch overview data
        const res = await fetch(`/api/services/sonarr/overview?instance=${instanceId}`);
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
          <h2 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">Error Loading Sonarr Data</h2>
          <p className="text-fd-muted-foreground">{error || 'Unknown error occurred'}</p>
        </div>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${bytes.toFixed(2)} ${units[i]}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Image
          src="/icons/sonarr.svg"
          alt="Sonarr"
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
            Version: {data.system.status?.version} • Branch: {data.system.status?.branch} • Platform: {data.system.status?.osName || 'Unknown'}
          </p>
        </div>
      </div>

      {/* System Health */}
      {data.system.health && data.system.health.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">System Health Issues</h2>
          <div className="space-y-2">
            {data.system.health.map((issue, i) => (
              <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="font-semibold">{issue.message}</p>
                {issue.wikiUrl && (
                  <a href={issue.wikiUrl} className="text-fd-primary hover:underline">
                    Learn more
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Total Series</div>
          <div className="text-2xl font-bold">{data.stats.totalShows}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Total Episodes</div>
          <div className="text-2xl font-bold">{data.stats.totalEpisodes}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Downloaded</div>
          <div className="text-2xl font-bold text-green-500">{data.stats.downloadedEpisodes}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Missing</div>
          <div className="text-2xl font-bold text-yellow-500">{data.stats.missingEpisodes}</div>
        </div>
      </div>

      {/* Activity Queue */}
      {data.activity.queue.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Download Queue</h2>
          <div className="bg-fd-card border border-fd-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-fd-muted/50">
                <tr>
                  <th className="text-left p-4">Episode</th>
                  <th className="text-left p-4">Quality</th>
                  <th className="text-left p-4">Progress</th>
                  <th className="text-left p-4">Time Left</th>
                </tr>
              </thead>
              <tbody>
                {data.activity.queue.map((item) => (
                  <tr key={item.id} className="border-t border-fd-border">
                    <td className="p-4">{item.title}</td>
                    <td className="p-4">{item.quality?.quality?.name}</td>
                    <td className="p-4">
                      <div className="w-full bg-fd-muted rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${item.sizeleft > 0 ? ((item.size - item.sizeleft) / item.size) * 100 : 0}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-4">{item.timeleft || 'Unknown'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Shows */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Recently Added</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data.series.recent.slice(0, 10).map((show) => (
            <div key={show.id} className="bg-fd-card border border-fd-border rounded-lg overflow-hidden hover:bg-fd-accent transition-colors">
              <div className="aspect-[2/3] relative">
                {show.images?.find((img) => img.coverType === 'poster')?.url ? (
                  <img
                    src={show.images.find((img) => img.coverType === 'poster')?.url}
                    alt={show.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-fd-muted flex items-center justify-center">
                    <span className="text-fd-muted-foreground">No Poster</span>
                  </div>
                )}
                {show.statistics && show.statistics.percentOfEpisodes === 100 && (
                  <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold truncate">{show.title}</h3>
                <p className="text-sm text-fd-muted-foreground">{show.year}</p>
                {show.statistics && (
                  <p className="text-xs text-fd-muted-foreground mt-1">
                    {show.statistics.episodeFileCount}/{show.statistics.totalEpisodeCount} episodes
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Episodes */}
      {data.series.upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Upcoming Episodes</h2>
          <div className="space-y-2">
            {data.series.upcoming.map((episode) => (
              <div key={episode.id} className="bg-fd-card border border-fd-border rounded-lg p-4 flex items-center gap-4">
                <div className="flex-shrink-0">
                  {episode.series?.images?.find((img) => img.coverType === 'poster')?.url ? (
                    <img
                      src={episode.series.images.find((img) => img.coverType === 'poster')?.url}
                      alt={episode.series?.title || 'Episode poster'}
                      className="w-16 h-24 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-24 bg-fd-muted rounded flex items-center justify-center">
                      <span className="text-fd-muted-foreground text-xs">No Poster</span>
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold">{episode.series?.title}</h3>
                  <p className="text-sm text-fd-muted-foreground">
                    S{String(episode.seasonNumber).padStart(2, '0')}E{String(episode.episodeNumber).padStart(2, '0')} - {episode.title}
                  </p>
                  {episode.airDateUtc && (
                    <p className="text-sm text-fd-muted-foreground">
                      Airs: {formatDate(episode.airDateUtc)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {data.activity.recentHistory.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="bg-fd-card border border-fd-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-fd-muted/50">
                <tr>
                  <th className="text-left p-4 w-16">Show</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Episode</th>
                  <th className="text-left p-4">Event</th>
                  <th className="text-left p-4">Quality</th>
                </tr>
              </thead>
              <tbody>
                {data.activity.recentHistory.slice(0, 10).map((item) => (
                  <tr key={item.id} className="border-t border-fd-border">
                    <td className="p-2">
                      <div className="w-12 h-18">
                        {item.series?.images?.find((img) => img.coverType === 'poster')?.url ? (
                          <img
                            src={item.series.images.find((img) => img.coverType === 'poster')?.url}
                            alt={item.series?.title || 'Show poster'}
                            className="w-12 h-18 object-cover rounded"
                            title={item.series?.title}
                          />
                        ) : (
                          <div className="w-12 h-18 bg-fd-muted rounded flex items-center justify-center">
                            <span className="text-fd-muted-foreground text-xs">?</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm">{formatDate(item.date)}</td>
                    <td className="p-4">{item.sourceTitle}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        item.eventType === 'downloadFolderImported' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                        item.eventType === 'grabbed' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                        'bg-fd-muted'
                      }`}>
                        {item.eventType}
                      </span>
                    </td>
                    <td className="p-4">{item.quality?.quality?.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Configuration Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Indexers</div>
          <div className="text-xl font-bold">{data.configuration.indexers?.length || 0}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Download Clients</div>
          <div className="text-xl font-bold">{data.configuration.downloadClients?.length || 0}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Queue</div>
          <div className="text-xl font-bold text-blue-500">{data.stats.queuedItems}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Total Size</div>
          <div className="text-xl font-bold">{formatBytes(data.stats.totalFileSize)}</div>
        </div>
      </div>
    </div>
  );
}