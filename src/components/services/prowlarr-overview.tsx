/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRefreshInterval } from '@/hooks/use-refresh-interval';

interface Indexer {
  id: number;
  name: string;
  protocol: 'torrent' | 'usenet';
  enabled: boolean;
  healthy: boolean;
  error?: string;
}

interface ProwlarrData {
  stats: {
    totalIndexers: number;
    enabledIndexers: number;
    healthyIndexers: number;
    torrentIndexers: number;
    usenetIndexers: number;
    searchesToday: number;
    grabsToday: number;
    healthIssues: number;
    version: string;
    branch: string;
    indexers: Indexer[];
    torrentIndexersList: Indexer[];
    usenetIndexersList: Indexer[];
  };
}

interface ProwlarrOverviewProps {
  instanceId: string;
  instanceName: string;
}

export default function ProwlarrOverview({ instanceId, instanceName }: ProwlarrOverviewProps) {
  const [data, setData] = useState<ProwlarrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyEnabled, setShowOnlyEnabled] = useState(false);
  const [serviceUrl, setServiceUrl] = useState<string | null>(null);
  const refreshInterval = useRefreshInterval();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch overview data
        const res = await fetch(`/api/services/prowlarr/overview?instance=${instanceId}`);
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
          <h2 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">Error Loading Prowlarr Data</h2>
          <p className="text-fd-muted-foreground">{error || 'Unknown error occurred'}</p>
        </div>
      </div>
    );
  }

  const getHealthColor = (healthy: boolean, enabled: boolean) => {
    if (!enabled) return 'text-fd-muted-foreground';
    return healthy ? 'text-green-500' : 'text-red-500';
  };

  const getHealthIcon = (healthy: boolean, enabled: boolean) => {
    if (!enabled) return '⏸️';
    return healthy ? '✅' : '❌';
  };

  const filteredIndexers = showOnlyEnabled 
    ? data.stats.indexers.filter(indexer => indexer.enabled)
    : data.stats.indexers;

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Image
          src="/icons/prowlarr.svg"
          alt="Prowlarr"
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
            Branch: {data.stats.branch} • 
            Health: {data.stats.healthIssues === 0 ? '✅ All Good' : `⚠️ ${data.stats.healthIssues} Issues`}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Total Indexers</div>
          <div className="text-2xl font-bold">{data.stats.totalIndexers}</div>
          <div className="text-xs text-fd-muted-foreground mt-1">
            Enabled: {data.stats.enabledIndexers}, Healthy: {data.stats.healthyIndexers}
          </div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">By Protocol</div>
          <div className="text-2xl font-bold">
            <span className="text-blue-500">{data.stats.torrentIndexers}</span>
            <span className="text-fd-muted-foreground mx-2">/</span>
            <span className="text-green-500">{data.stats.usenetIndexers}</span>
          </div>
          <div className="text-xs text-fd-muted-foreground mt-1">
            Torrent / Usenet
          </div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Searches Today</div>
          <div className="text-2xl font-bold text-purple-500">{data.stats.searchesToday}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Grabs Today</div>
          <div className="text-2xl font-bold text-dasharr-purple">{data.stats.grabsToday}</div>
        </div>
      </div>

      {/* Indexers */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Indexers</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showOnlyEnabled}
              onChange={(e) => setShowOnlyEnabled(e.target.checked)}
              className="rounded"
            />
            Show only enabled
          </label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Torrent Indexers */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-blue-500">🌊 Torrent Indexers</h3>
            <div className="space-y-2">
              {filteredIndexers
                .filter(indexer => indexer.protocol === 'torrent')
                .map((indexer) => (
                  <div key={indexer.id} className="bg-fd-card border border-fd-border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={getHealthColor(indexer.healthy, indexer.enabled)}>
                          {getHealthIcon(indexer.healthy, indexer.enabled)}
                        </span>
                        <span className={`font-medium ${!indexer.enabled ? 'text-fd-muted-foreground' : ''}`}>
                          {indexer.name}
                        </span>
                      </div>
                      {!indexer.enabled && (
                        <span className="text-xs text-fd-muted-foreground">Disabled</span>
                      )}
                    </div>
                    {indexer.error && indexer.enabled && (
                      <p className="text-xs text-red-500 mt-1 truncate" title={indexer.error}>
                        {indexer.error}
                      </p>
                    )}
                  </div>
                ))}
              {filteredIndexers.filter(i => i.protocol === 'torrent').length === 0 && (
                <p className="text-fd-muted-foreground text-sm">No torrent indexers configured</p>
              )}
            </div>
          </div>

          {/* Usenet Indexers */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-green-500">📰 Usenet Indexers</h3>
            <div className="space-y-2">
              {filteredIndexers
                .filter(indexer => indexer.protocol === 'usenet')
                .map((indexer) => (
                  <div key={indexer.id} className="bg-fd-card border border-fd-border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={getHealthColor(indexer.healthy, indexer.enabled)}>
                          {getHealthIcon(indexer.healthy, indexer.enabled)}
                        </span>
                        <span className={`font-medium ${!indexer.enabled ? 'text-fd-muted-foreground' : ''}`}>
                          {indexer.name}
                        </span>
                      </div>
                      {!indexer.enabled && (
                        <span className="text-xs text-fd-muted-foreground">Disabled</span>
                      )}
                    </div>
                    {indexer.error && indexer.enabled && (
                      <p className="text-xs text-red-500 mt-1 truncate" title={indexer.error}>
                        {indexer.error}
                      </p>
                    )}
                  </div>
                ))}
              {filteredIndexers.filter(i => i.protocol === 'usenet').length === 0 && (
                <p className="text-fd-muted-foreground text-sm">No usenet indexers configured</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-fd-card border border-fd-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">System Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-fd-muted-foreground mb-1">Indexer Health</p>
            <div className="flex items-center gap-2">
              <div className="w-full bg-fd-muted rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(data.stats.healthyIndexers / data.stats.enabledIndexers) * 100}%` }}
                />
              </div>
              <span className="text-xs whitespace-nowrap">
                {Math.round((data.stats.healthyIndexers / data.stats.enabledIndexers) * 100)}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-fd-muted-foreground mb-1">Activity Today</p>
            <p className="font-semibold">
              {data.stats.searchesToday} searches, {data.stats.grabsToday} grabs
            </p>
          </div>
          <div>
            <p className="text-fd-muted-foreground mb-1">Protocol Distribution</p>
            <p className="font-semibold">
              {Math.round((data.stats.torrentIndexers / data.stats.totalIndexers) * 100)}% Torrent,{' '}
              {Math.round((data.stats.usenetIndexers / data.stats.totalIndexers) * 100)}% Usenet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}