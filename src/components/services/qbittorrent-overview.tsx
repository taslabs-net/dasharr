'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRefreshInterval } from '@/hooks/use-refresh-interval';

interface TorrentInfo {
  hash: string;
  name: string;
  size: number;
  progress: number;
  dlspeed: number;
  upspeed: number;
  priority: number;
  num_seeds: number;
  num_leechs: number;
  ratio: number;
  eta: number;
  state: string;
  category: string;
  tags: string;
  save_path: string;
  added_on: number;
  completion_on: number;
  downloaded: number;
  uploaded: number;
  amount_left: number;
  time_active: number;
}

interface QBittorrentData {
  system: {
    version: string | null;
    preferences: {
      web_ui_port: number;
      dht: boolean;
      pex: boolean;
      lsd: boolean;
      encryption: number;
      queueing_enabled: boolean;
      max_active_downloads: number;
      max_active_uploads: number;
      max_active_torrents: number;
      dl_limit: number;
      up_limit: number;
    } | null;
    serverState: {
      alltime_dl: number;
      alltime_ul: number;
      average_time_queue: number;
      connection_status: string;
      dht_nodes: number;
      dl_info_data: number;
      dl_info_speed: number;
      free_space_on_disk: number;
      global_ratio: string;
      up_info_data: number;
      up_info_speed: number;
    } | null;
  };
  stats: {
    totalTorrents: number;
    activeTorrents: number;
    pausedTorrents: number;
    completedTorrents: number;
    downloadingTorrents: number;
    downloadSpeed: number;
    uploadSpeed: number;
    totalDownloaded: number;
    totalUploaded: number;
    sessionDownloaded: number;
    sessionUploaded: number;
    freeSpace: number;
    dhtNodes: number;
    totalSize: number;
    totalDownloadedData: number;
    totalUploadedData: number;
    globalRatio: string;
  };
  activity: {
    torrents: TorrentInfo[];
    recentTorrents: TorrentInfo[];
    activeDownloads: TorrentInfo[];
    categories: { [key: string]: { name: string; savePath: string } };
    tags: string[];
  };
  transfer: {
    connectionStatus: string;
    dhtNodes: number;
    downloadData: number;
    downloadSpeed: number;
    uploadData: number;
    uploadSpeed: number;
  };
}

interface QBittorrentOverviewProps {
  instanceId: string;
  instanceName: string;
}

export default function QBittorrentOverview({ instanceId, instanceName }: QBittorrentOverviewProps) {
  const [data, setData] = useState<QBittorrentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceUrl, setServiceUrl] = useState<string | null>(null);
  const refreshInterval = useRefreshInterval();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch overview data
        const res = await fetch(`/api/services/qbittorrent/overview?instance=${instanceId}`);
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
          <h2 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">Error Loading qBittorrent Data</h2>
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

  const formatSpeed = (bytesPerSec: number) => {
    return `${formatBytes(bytesPerSec)}/s`;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 0 || seconds === 8640000) return '∞';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
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

  const getStateColor = (state: string) => {
    switch (state) {
      case 'downloading':
      case 'forcedDL':
        return 'text-blue-500';
      case 'uploading':
      case 'forcedUP':
        return 'text-green-500';
      case 'pausedDL':
      case 'pausedUP':
        return 'text-yellow-500';
      case 'error':
      case 'missingFiles':
        return 'text-red-500';
      case 'stalledDL':
      case 'stalledUP':
        return 'text-orange-500';
      case 'queuedDL':
      case 'queuedUP':
        return 'text-dasharr-purple';
      default:
        return 'text-fd-muted-foreground';
    }
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'downloading': return 'Downloading';
      case 'forcedDL': return 'Force Download';
      case 'uploading': return 'Seeding';
      case 'forcedUP': return 'Force Seed';
      case 'pausedDL': return 'Paused';
      case 'pausedUP': return 'Paused';
      case 'error': return 'Error';
      case 'missingFiles': return 'Missing Files';
      case 'stalledDL': return 'Stalled';
      case 'stalledUP': return 'Stalled';
      case 'queuedDL': return 'Queued';
      case 'queuedUP': return 'Queued';
      case 'metaDL': return 'Downloading Metadata';
      case 'allocating': return 'Allocating';
      case 'queuedForChecking': return 'Queued for Check';
      case 'checkingDL': return 'Checking';
      case 'checkingUP': return 'Checking';
      case 'checkingResumeData': return 'Checking Resume Data';
      case 'moving': return 'Moving';
      default: return state;
    }
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Image
          src="/icons/qbittorrent.svg"
          alt="qBittorrent"
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
            Version: {data.system.version || 'Unknown'} • 
            Connection: <span className={data.transfer.connectionStatus === 'connected' ? 'text-green-500' : 'text-red-500'}>
              {data.transfer.connectionStatus}
            </span> • 
            DHT: {data.stats.dhtNodes} nodes
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Total Torrents</div>
          <div className="text-2xl font-bold">{data.stats.totalTorrents}</div>
          <div className="text-xs text-fd-muted-foreground mt-1">
            {data.stats.completedTorrents} completed
          </div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Active</div>
          <div className="text-2xl font-bold text-green-500">{data.stats.activeTorrents}</div>
          <div className="text-xs text-fd-muted-foreground mt-1">
            {data.stats.downloadingTorrents} downloading
          </div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Download Speed</div>
          <div className="text-2xl font-bold text-blue-500">{formatSpeed(data.stats.downloadSpeed)}</div>
          <div className="text-xs text-fd-muted-foreground mt-1">
            {formatBytes(data.stats.sessionDownloaded)} this session
          </div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Upload Speed</div>
          <div className="text-2xl font-bold text-green-500">{formatSpeed(data.stats.uploadSpeed)}</div>
          <div className="text-xs text-fd-muted-foreground mt-1">
            {formatBytes(data.stats.sessionUploaded)} this session
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">All-time Downloaded</div>
          <div className="text-xl font-bold">{formatBytes(data.stats.totalDownloaded)}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">All-time Uploaded</div>
          <div className="text-xl font-bold">{formatBytes(data.stats.totalUploaded)}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Global Ratio</div>
          <div className="text-xl font-bold">{parseFloat(data.stats.globalRatio).toFixed(2)}</div>
        </div>
      </div>

      {/* Active Downloads */}
      {data.activity.activeDownloads.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Active Downloads</h2>
          <div className="bg-fd-card border border-fd-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-fd-muted/50">
                <tr>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Size</th>
                  <th className="text-left p-4">Progress</th>
                  <th className="text-left p-4">Speed</th>
                  <th className="text-left p-4">ETA</th>
                  <th className="text-left p-4">Seeds/Peers</th>
                </tr>
              </thead>
              <tbody>
                {data.activity.activeDownloads.map((torrent) => (
                  <tr key={torrent.hash} className="border-t border-fd-border">
                    <td className="p-4">
                      <div className="truncate max-w-md" title={torrent.name}>
                        {torrent.name}
                      </div>
                      <div className="text-xs text-fd-muted-foreground">
                        {torrent.category && <span className="mr-2">📁 {torrent.category}</span>}
                        {torrent.tags && <span>🏷️ {torrent.tags}</span>}
                      </div>
                    </td>
                    <td className="p-4 text-sm">{formatBytes(torrent.size)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-fd-muted rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${torrent.progress * 100}%` }}
                          />
                        </div>
                        <span className="text-sm">{(torrent.progress * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      <div className="text-blue-500">↓ {formatSpeed(torrent.dlspeed)}</div>
                      <div className="text-green-500 text-xs">↑ {formatSpeed(torrent.upspeed)}</div>
                    </td>
                    <td className="p-4 text-sm">{formatTime(torrent.eta)}</td>
                    <td className="p-4 text-sm">
                      <span className="text-green-500">{torrent.num_seeds}</span> / 
                      <span className="text-orange-500"> {torrent.num_leechs}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Torrents */}
      {data.activity.recentTorrents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Recent Torrents</h2>
          <div className="bg-fd-card border border-fd-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-fd-muted/50">
                <tr>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Size</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Ratio</th>
                  <th className="text-left p-4">Added</th>
                </tr>
              </thead>
              <tbody>
                {data.activity.recentTorrents.map((torrent) => (
                  <tr key={torrent.hash} className="border-t border-fd-border">
                    <td className="p-4">
                      <div className="truncate max-w-md" title={torrent.name}>
                        {torrent.name}
                      </div>
                    </td>
                    <td className="p-4 text-sm">{formatBytes(torrent.size)}</td>
                    <td className="p-4">
                      <span className={`text-sm font-medium ${getStateColor(torrent.state)}`}>
                        {getStateLabel(torrent.state)}
                      </span>
                    </td>
                    <td className="p-4 text-sm">{torrent.ratio.toFixed(2)}</td>
                    <td className="p-4 text-sm">{formatDate(torrent.added_on)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* System Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Free Space</div>
          <div className="text-xl font-bold">{formatBytes(data.stats.freeSpace)}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Total Size</div>
          <div className="text-xl font-bold">{formatBytes(data.stats.totalSize)}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Categories</div>
          <div className="text-xl font-bold">{Object.keys(data.activity.categories).length}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Tags</div>
          <div className="text-xl font-bold">{data.activity.tags.length}</div>
        </div>
      </div>
    </div>
  );
}