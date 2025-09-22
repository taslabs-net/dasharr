/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRefreshInterval } from '@/hooks/use-refresh-interval';

interface SABnzbdStats {
  activeDownloads: number;
  totalQueueSize: number;
  downloadSpeed: number;
  completedToday: number;
  failedJobs: number;
  isPaused: boolean;
  diskSpace: string;
  version: string;
  uptime: string;
  totalDownloaded: string;
  monthDownloaded: string;
  weekDownloaded: string;
  todayDownloaded: string;
}

interface QueueItem {
  nzo_id: string;
  filename: string;
  mb: string;
  mbleft: string;
  percentage: string;
  cat: string;
  eta: string;
  status: string;
  timeleft: string;
}

interface HistoryItem {
  nzo_id: string;
  name: string;
  size: string;
  category: string;
  status: string;
  completed: number;
  download_time: string;
  fail_message?: string;
}

interface SABnzbdData {
  stats: SABnzbdStats;
  queue?: {
    slots: QueueItem[];
  };
  history?: {
    slots: HistoryItem[];
  };
}

interface SABnzbdOverviewProps {
  instanceId: string;
  instanceName: string;
}

export default function SABnzbdOverview({ instanceId, instanceName }: SABnzbdOverviewProps) {
  const [data, setData] = useState<SABnzbdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queueData, setQueueData] = useState<QueueItem[]>([]);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [serviceUrl, setServiceUrl] = useState<string | null>(null);
  const refreshInterval = useRefreshInterval();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch overview stats
        const res = await fetch(`/api/services/sabnzbd/overview?instance=${instanceId}`);
        if (!res.ok) throw new Error('Failed to fetch data');
        const overviewData = await res.json();
        setData(overviewData);

        // Fetch instance config to get URL
        const serviceType = instanceId.replace(/\d+$/, '');
        const configRes = await fetch(`/api/public/instances/${serviceType}/${instanceId}`);
        if (configRes.ok) {
          const configData = await configRes.json();
          setServiceUrl(configData.instance.url);
        }

        // Fetch queue data
        try {
          const queueRes = await fetch(`/api/services/sabnzbd/queue?instance=${instanceId}`);
          if (queueRes.ok) {
            const queueJson = await queueRes.json();
            setQueueData(queueJson.queue?.slots || []);
          }
        } catch {
          // Queue fetch failed, continue without it
        }

        // Fetch history data
        try {
          const historyRes = await fetch(`/api/services/sabnzbd/history?instance=${instanceId}&limit=10`);
          if (historyRes.ok) {
            const historyJson = await historyRes.json();
            setHistoryData(historyJson.history?.slots || []);
          }
        } catch {
          // History fetch failed, continue without it
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
          <h2 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">Error Loading SABnzbd Data</h2>
          <p className="text-fd-muted-foreground">{error || 'Unknown error occurred'}</p>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'downloading': return 'text-blue-500';
      case 'queued': return 'text-yellow-500';
      case 'paused': return 'text-orange-500';
      default: return 'text-fd-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Image
          src="/icons/sabnzbd.svg"
          alt="SABnzbd"
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
            Version: {data.stats.version} • 
            Status: <span className={data.stats.isPaused ? 'text-orange-500' : 'text-green-500'}>
              {data.stats.isPaused ? 'Paused' : 'Active'}
            </span> • 
            Uptime: {data.stats.uptime}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Active Downloads</div>
          <div className="text-2xl font-bold text-blue-500">{data.stats.activeDownloads}</div>
          <div className="text-xs text-fd-muted-foreground mt-1">
            Speed: {data.stats.downloadSpeed.toFixed(1)} MB/s
          </div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Completed Today</div>
          <div className="text-2xl font-bold text-green-500">{data.stats.completedToday}</div>
          <div className="text-xs text-fd-muted-foreground mt-1">
            Downloaded: {data.stats.todayDownloaded}
          </div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Failed Jobs</div>
          <div className="text-2xl font-bold text-red-500">{data.stats.failedJobs}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Disk Space</div>
          <div className="text-2xl font-bold">{data.stats.diskSpace}</div>
        </div>
      </div>

      {/* Download Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Today</div>
          <div className="text-xl font-bold">{data.stats.todayDownloaded}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">This Week</div>
          <div className="text-xl font-bold">{data.stats.weekDownloaded}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">This Month</div>
          <div className="text-xl font-bold">{data.stats.monthDownloaded}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">All-Time</div>
          <div className="text-xl font-bold">{data.stats.totalDownloaded}</div>
        </div>
      </div>

      {/* Download Queue */}
      {queueData.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Download Queue</h2>
          <div className="bg-fd-card border border-fd-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-fd-muted/50">
                <tr>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Size</th>
                  <th className="text-left p-4">Progress</th>
                  <th className="text-left p-4">Time Left</th>
                  <th className="text-left p-4">Category</th>
                </tr>
              </thead>
              <tbody>
                {queueData.map((item) => (
                  <tr key={item.nzo_id} className="border-t border-fd-border">
                    <td className="p-4">
                      <div className="truncate max-w-md" title={item.filename}>
                        {item.filename}
                      </div>
                      <div className="text-xs text-fd-muted-foreground">
                        Status: <span className={getStatusColor(item.status)}>{item.status}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{item.mb} MB</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-fd-muted rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm">{item.percentage}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{item.timeleft || 'N/A'}</td>
                    <td className="p-4 text-sm">{item.cat || 'None'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent History */}
      {historyData.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Recent Downloads</h2>
          <div className="bg-fd-card border border-fd-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-fd-muted/50">
                <tr>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Size</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Completed</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((item) => (
                  <tr key={item.nzo_id} className="border-t border-fd-border">
                    <td className="p-4">
                      <div className="truncate max-w-md" title={item.name}>
                        {item.name}
                      </div>
                      {item.fail_message && (
                        <div className="text-xs text-red-500">{item.fail_message}</div>
                      )}
                    </td>
                    <td className="p-4 text-sm">{item.size}</td>
                    <td className="p-4 text-sm">{item.category || 'None'}</td>
                    <td className="p-4">
                      <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm">{formatDate(item.completed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Activity Message */}
      {queueData.length === 0 && historyData.length === 0 && (
        <div className="bg-fd-card border border-fd-border rounded-lg p-8 text-center">
          <p className="text-fd-muted-foreground">No recent activity to display</p>
        </div>
      )}
    </div>
  );
}