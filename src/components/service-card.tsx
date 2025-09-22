'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRefreshInterval } from '@/hooks/use-refresh-interval';

interface ServiceCardProps {
  name: string;
  type?: string;
  icon: string;
  href?: string;
  configured: boolean;
  apiEndpoint?: string;
  isDragging?: boolean;
}

interface ServiceStats {
  stats?: {
    totalMovies?: number;
    missingMovies?: number;
    totalFileSize?: number;
    totalShows?: number;
    totalEpisodes?: number;
    missingEpisodes?: number;
    activeStreams?: number;
    totalBandwidth?: number;
    userCount?: number;
    activeDownloads?: number;
    downloadSpeed?: number;
    completedToday?: number;
    failedJobs?: number;
    totalIndexers?: number;
    enabledIndexers?: number;
    healthyIndexers?: number;
    searchesToday?: number;
    movieCount?: number;
    showCount?: number;
    totalDownloaded?: string;
    monthDownloaded?: string;
    weekDownloaded?: string;
    todayDownloaded?: string;
    totalTorrents?: number;
    activeTorrents?: number;
    uploadSpeed?: number;
    totalRequests?: number;
    pendingRequests?: number;
    processingRequests?: number;
    availableRequests?: number;
  };
  // Jellyfin specific
  itemCounts?: {
    MovieCount?: number;
    SeriesCount?: number;
    EpisodeCount?: number;
    BoxSetCount?: number;
  };
  activeSessions?: Array<unknown>;
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(2)} ${units[i]}`;
};

export function ServiceCard({ name, type, icon, href, configured, apiEndpoint, isDragging }: ServiceCardProps) {
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const refreshInterval = useRefreshInterval();

  useEffect(() => {
    const fetchData = async () => {
      if (configured && apiEndpoint) {
        try {
          const res = await fetch(apiEndpoint);
          const data = await res.json();
          setStats(data);
        } catch {
          setStats(null);
        }
      }
    };

    // Initial fetch
    if (configured && apiEndpoint) {
      setLoading(true);
      fetchData().finally(() => setLoading(false));
    }

    // Set up polling
    if (configured && apiEndpoint && refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [configured, apiEndpoint, refreshInterval]);

  const content = (
    <div className="rounded-lg border border-fd-border bg-fd-card p-6 hover:bg-fd-accent transition-colors h-full flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <Image 
          src={icon} 
          alt={name} 
          width={32} 
          height={32}
          className="rounded"
        />
        <h3 className="text-lg font-semibold">{name}</h3>
      </div>
      <div className="flex-grow flex flex-col justify-between min-h-[80px]">
        {!configured && (
          <div className="space-y-1">
            <p className="text-sm text-fd-muted-foreground">Not configured</p>
            <div className="h-4"></div>
            <div className="h-4"></div>
          </div>
        )}
        
        {configured && loading && (
          <div className="space-y-1">
            <div className="h-4 bg-fd-muted rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-fd-muted rounded animate-pulse w-1/2"></div>
            <div className="h-4 bg-fd-muted rounded animate-pulse w-2/3"></div>
          </div>
        )}
        
        {configured && !loading && stats && type === 'radarr' && (
          <div className="space-y-1 text-sm">
            <p>Movies: <span className="font-medium">{stats.stats?.totalMovies || 0}</span></p>
            <p>Monitored: <span className="font-medium text-blue-500">{(stats.stats?.totalMovies || 0) - (stats.stats?.missingMovies || 0)}</span></p>
            <p>Missing: <span className="font-medium text-yellow-500">{stats.stats?.missingMovies || 0}</span></p>
            <p>Size: <span className="font-medium">{formatBytes(stats.stats?.totalFileSize || 0)}</span></p>
            <p className="text-xs text-fd-muted-foreground mt-2">Click to view dashboard →</p>
          </div>
        )}
        
        {configured && !loading && stats && type === 'sonarr' && (
          <div className="space-y-1 text-sm">
            <p>Shows: <span className="font-medium">{stats.stats?.totalShows || 0}</span></p>
            <p>Episodes: <span className="font-medium">{stats.stats?.totalEpisodes || 0}</span></p>
            <p>Missing: <span className="font-medium text-yellow-500">{stats.stats?.missingEpisodes || 0}</span></p>
            <p>Size: <span className="font-medium">{formatBytes(stats.stats?.totalFileSize || 0)}</span></p>
            <p className="text-xs text-fd-muted-foreground mt-2">Click to view dashboard →</p>
          </div>
        )}
        
        {configured && !loading && stats && type === 'tautulli' && (
          <div className="space-y-1 text-sm">
            <p>Active: <span className="font-medium text-green-500">{stats.stats?.activeStreams || 0}</span> streams</p>
            <p>Bandwidth: <span className="font-medium">{stats.stats?.totalBandwidth ? `${(stats.stats.totalBandwidth / 1000).toFixed(2)} Mbps` : '0 Mbps'}</span></p>
            <p>Users: <span className="font-medium">{stats.stats?.userCount || 0}</span></p>
            <p>History: <span className="font-medium text-blue-500">Available</span></p>
            <p className="text-xs text-fd-muted-foreground mt-2">Click to view dashboard →</p>
          </div>
        )}
        
        {configured && !loading && stats && type === 'sabnzbd' && (
          <div className="space-y-1 text-sm">
            <p>Active: <span className="font-medium text-green-500">{stats.stats?.activeDownloads || 0}</span> downloads</p>
            <p>Speed: <span className="font-medium">{stats.stats?.downloadSpeed ? `${stats.stats.downloadSpeed.toFixed(1)} MB/s` : '0 MB/s'}</span></p>
            <p>Today: <span className="font-medium text-blue-500">{stats.stats?.completedToday || 0}</span> completed</p>
            <p>All-time: <span className="font-medium text-dasharr-purple">{stats.stats?.totalDownloaded || '0 B'}</span></p>
            <p className="text-xs text-fd-muted-foreground mt-2">Click to view dashboard →</p>
          </div>
        )}
        
        
        {configured && !loading && stats && type === 'prowlarr' && (
          <div className="space-y-1 text-sm">
            <p>Indexers: <span className="font-medium">{stats.stats?.enabledIndexers || 0}</span>/<span className="font-medium">{stats.stats?.totalIndexers || 0}</span></p>
            <p>Healthy: <span className="font-medium text-green-500">{stats.stats?.healthyIndexers || 0}</span></p>
            <p>Today: <span className="font-medium text-blue-500">{stats.stats?.searchesToday || 0}</span> searches</p>
            <p>Status: <span className="font-medium text-green-500">Active</span></p>
            <p className="text-xs text-fd-muted-foreground mt-2">Click to view dashboard →</p>
          </div>
        )}
        
        {configured && !loading && stats && type === 'plex' && (
          <div className="space-y-1 text-sm">
            <p>Movies: <span className="font-medium">{stats.stats?.movieCount || 0}</span></p>
            <p>TV Shows: <span className="font-medium">{stats.stats?.showCount || 0}</span></p>
            <p>Active: <span className="font-medium text-green-500">{stats.stats?.activeStreams || 0}</span> streams</p>
            <p>Users: <span className="font-medium">{stats.stats?.userCount || 0}</span></p>
            <p className="text-xs text-fd-muted-foreground mt-2">Click to view dashboard →</p>
          </div>
        )}
        
        {configured && !loading && stats && type === 'qbittorrent' && (
          <div className="space-y-1 text-sm">
            <p>Torrents: <span className="font-medium">{stats.stats?.totalTorrents || 0}</span></p>
            <p>Active: <span className="font-medium text-green-500">{stats.stats?.activeTorrents || 0}</span></p>
            <p>DL: <span className="font-medium text-blue-500">{stats.stats?.downloadSpeed ? `${(stats.stats.downloadSpeed / 1024 / 1024).toFixed(1)} MB/s` : '0 MB/s'}</span></p>
            <p>UL: <span className="font-medium text-green-500">{stats.stats?.uploadSpeed ? `${(stats.stats.uploadSpeed / 1024 / 1024).toFixed(1)} MB/s` : '0 MB/s'}</span></p>
            <p className="text-xs text-fd-muted-foreground mt-2">Click to view dashboard →</p>
          </div>
        )}
        
        {configured && !loading && stats && type === 'overseerr' && (
          <div className="space-y-1 text-sm">
            <p>Requests: <span className="font-medium">{stats.stats?.totalRequests || 0}</span></p>
            <p>Pending: <span className="font-medium text-yellow-500">{stats.stats?.pendingRequests || 0}</span></p>
            <p>Processing: <span className="font-medium text-blue-500">{stats.stats?.processingRequests || 0}</span></p>
            <p>Available: <span className="font-medium text-green-500">{stats.stats?.availableRequests || 0}</span></p>
            <p className="text-xs text-fd-muted-foreground mt-2">Click to view dashboard →</p>
          </div>
        )}
        
        {configured && !loading && stats && type === 'jellyseerr' && (
          <div className="space-y-1 text-sm">
            <p>Requests: <span className="font-medium">{stats.stats?.totalRequests || 0}</span></p>
            <p>Pending: <span className="font-medium text-yellow-500">{stats.stats?.pendingRequests || 0}</span></p>
            <p>Processing: <span className="font-medium text-blue-500">{stats.stats?.processingRequests || 0}</span></p>
            <p>Available: <span className="font-medium text-green-500">{stats.stats?.availableRequests || 0}</span></p>
            <p className="text-xs text-fd-muted-foreground mt-2">Click to view dashboard →</p>
          </div>
        )}
        
        {configured && !loading && stats && type === 'jellyfin' && (
          <div className="space-y-1 text-sm">
            <p>Movies: <span className="font-medium">{stats.itemCounts?.MovieCount || 0}</span></p>
            <p>Shows: <span className="font-medium">{stats.itemCounts?.SeriesCount || 0}</span></p>
            <p>Episodes: <span className="font-medium text-blue-500">{stats.itemCounts?.EpisodeCount || 0}</span></p>
            <p>Active: <span className="font-medium text-green-500">{stats.activeSessions?.length || 0}</span> streams</p>
            <p className="text-xs text-fd-muted-foreground mt-2">Click to view dashboard →</p>
          </div>
        )}
        
        {configured && !loading && stats && type === 'unifi' && (() => {
          const unifiStats = stats as {
            sites?: { 
              [key: string]: {
                available: boolean; 
                name?: string;
                devices?: { active: number; total: number }; 
                connectedDevices?: { total: number; wired: number; wireless: number };
                stats?: { wan_download: number; wan_upload: number };
              }
            };
            siteManager?: { available: boolean; totalSites?: number; totalDevices?: number };
          };
          
          let activeDevices = 0;
          let totalDevices = 0;
          let totalConnectedDevices = 0;
          let wiredDevices = 0;
          let wirelessDevices = 0;
          let siteCount = 0;
          
          if (unifiStats.sites) {
            Object.values(unifiStats.sites).forEach(site => {
              if (site.available) {
                siteCount++;
                activeDevices += site.devices?.active || 0;
                totalDevices += site.devices?.total || 0;
                totalConnectedDevices += site.connectedDevices?.total || 0;
                wiredDevices += site.connectedDevices?.wired || 0;
                wirelessDevices += site.connectedDevices?.wireless || 0;
              }
            });
          }
          
          // Include Site Manager sites in count if available
          if (unifiStats.siteManager?.available && unifiStats.siteManager.totalSites) {
            // Don't double count if sites are already included
            const siteManagerCount = unifiStats.siteManager.totalSites || 0;
            if (siteManagerCount > siteCount) {
              siteCount = siteManagerCount;
            }
          }
          
          // Don't show anything if no sites are configured
          if (totalDevices === 0 && !unifiStats.siteManager?.available) {
            return (
              <div className="space-y-1 text-sm">
                <p className="text-sm text-yellow-500">No sites configured</p>
                <p className="text-xs text-fd-muted-foreground mt-2">Click to configure →</p>
              </div>
            );
          }
          
          return (
            <div className="space-y-1 text-sm">
              <p>Sites: <span className="font-medium">{siteCount}</span> • Devices: <span className="font-medium">{activeDevices}</span>/<span className="font-medium">{totalDevices}</span></p>
              <p>Connected: <span className="font-medium text-blue-500">{totalConnectedDevices}</span> devices</p>
              <p>Network: <span className="font-medium">{wiredDevices}</span> wired • <span className="font-medium">{wirelessDevices}</span> wifi</p>
              <p>Status: <span className="font-medium text-green-500">Online</span></p>
              <p className="text-xs text-fd-muted-foreground mt-2">Click to view dashboard →</p>
            </div>
          );
        })()}
        
        {configured && !loading && stats && type === 'bazarr' && ((() => {
          const bazarrStats = stats as {
            statistics?: {
              episodes?: { total: number; with_subtitles: number; completion_rate: number };
              movies?: { total: number; with_subtitles: number; completion_rate: number };
              providers?: { total: number; enabled: number };
              tasks?: { total: number; active: number };
            };
            server?: {
              health?: { healthy: boolean; issues: number };
            };
          };
          
          const episodes = bazarrStats.statistics?.episodes;
          const movies = bazarrStats.statistics?.movies;
          const providers = bazarrStats.statistics?.providers;
          const isHealthy = bazarrStats.server?.health?.healthy ?? true;
          const healthIssues = bazarrStats.server?.health?.issues ?? 0;
          
          return (
            <div className="space-y-1 text-sm">
              <p>Episodes: <span className="font-medium">{episodes?.with_subtitles || 0}</span>/<span className="font-medium">{episodes?.total || 0}</span> • <span className="text-green-500">{episodes?.completion_rate || 0}%</span></p>
              <p>Movies: <span className="font-medium">{movies?.with_subtitles || 0}</span>/<span className="font-medium">{movies?.total || 0}</span> • <span className="text-green-500">{movies?.completion_rate || 0}%</span></p>
              <p>Providers: <span className="font-medium text-blue-500">{providers?.enabled || 0}</span>/<span className="font-medium">{providers?.total || 0}</span> active</p>
              <p>Health: <span className={`font-medium ${isHealthy ? 'text-green-500' : 'text-red-500'}`}>{isHealthy ? 'Healthy' : `${healthIssues} issues`}</span></p>
              <p className="text-xs text-fd-muted-foreground mt-2">Click to view dashboard →</p>
            </div>
          );
        })())}
        
        {configured && !loading && (!stats || (type !== 'radarr' && type !== 'sonarr' && type !== 'bazarr' && type !== 'tautulli' && type !== 'sabnzbd' && type !== 'prowlarr' && type !== 'plex' && type !== 'qbittorrent' && type !== 'overseerr' && type !== 'jellyseerr' && type !== 'jellyfin' && type !== 'unifi')) && (
          <div className="space-y-1">
            <p className="text-sm text-green-500">✅ Configured</p>
            <div className="h-4"></div>
            <div className="h-4"></div>
            <p className="text-xs text-fd-muted-foreground mt-2">Dashboard available soon</p>
          </div>
        )}
      </div>
    </div>
  );

  return href && !isDragging ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}