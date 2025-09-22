/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRefreshInterval } from '@/hooks/use-refresh-interval';

interface MediaRequest {
  id: number;
  status: number;
  media: {
    id: number;
    tmdbId: number;
    title: string;
    posterPath?: string;
    backdropPath?: string;
    releaseDate?: string;
    mediaType: 'movie' | 'tv';
  };
  requestedBy: {
    displayName: string;
    avatar?: string;
  };
  createdAt: string;
  type: 'movie' | 'tv';
  is4k: boolean;
}

interface MediaItem {
  id: number;
  mediaType: 'movie' | 'tv';
  tmdbId: number;
  title: string;
  posterPath?: string;
  releaseDate?: string;
  createdAt: string;
}

interface OverseerrData {
  system: {
    version: string;
    commitTag?: string;
    updateAvailable: boolean;
    commitsBehind: number;
    applicationTitle: string;
    initialized: boolean;
  };
  stats: {
    totalRequests: number;
    movieRequests: number;
    tvRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    declinedRequests: number;
    processingRequests: number;
    availableRequests: number;
    totalIssues: number;
    openIssues: number;
  };
  activity: {
    recentRequests: MediaRequest[];
    recentlyAdded: MediaItem[];
  };
}

interface OverseerrOverviewProps {
  instanceId: string;
  instanceName: string;
}

export default function OverseerrOverview({ instanceId, instanceName }: OverseerrOverviewProps) {
  const [data, setData] = useState<OverseerrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceUrl, setServiceUrl] = useState<string | null>(null);
  const refreshInterval = useRefreshInterval();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch overview data
        const res = await fetch(`/api/services/overseerr/overview?instance=${instanceId}`);
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
          <h2 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">Error Loading Overseerr Data</h2>
          <p className="text-fd-muted-foreground">{error || 'Unknown error occurred'}</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'text-yellow-500'; // Pending
      case 2: return 'text-green-500'; // Approved
      case 3: return 'text-red-500'; // Declined
      case 4: 
      case 5: return 'text-blue-500'; // Processing/Partially Available
      default: return 'text-fd-muted-foreground';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 1: return 'Pending';
      case 2: return 'Approved';
      case 3: return 'Declined';
      case 4: return 'Processing';
      case 5: return 'Partially Available';
      default: return 'Unknown';
    }
  };

  const getTmdbImageUrl = (path: string | undefined, size: string = 'w500') => {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Image
          src="/icons/overseerr.svg"
          alt="Overseerr"
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
            Version: {data.system.version} • 
            {data.system.updateAvailable && (
              <span className="text-yellow-500"> Update Available ({data.system.commitsBehind} commits behind) • </span>
            )}
            Status: {data.system.initialized ? '✅ Initialized' : '❌ Not Initialized'}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Total Requests</div>
          <div className="text-2xl font-bold">{data.stats.totalRequests}</div>
          <div className="text-xs text-fd-muted-foreground mt-1">
            Movies: {data.stats.movieRequests}, TV: {data.stats.tvRequests}
          </div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Pending Requests</div>
          <div className="text-2xl font-bold text-yellow-500">{data.stats.pendingRequests}</div>
          <div className="text-xs text-fd-muted-foreground mt-1">
            Approved: {data.stats.approvedRequests}, Declined: {data.stats.declinedRequests}
          </div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Processing</div>
          <div className="text-2xl font-bold text-blue-500">{data.stats.processingRequests}</div>
          <div className="text-xs text-fd-muted-foreground mt-1">
            Available: {data.stats.availableRequests}
          </div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Open Issues</div>
          <div className="text-2xl font-bold text-orange-500">{data.stats.openIssues}</div>
          <div className="text-xs text-fd-muted-foreground mt-1">
            Total Issues: {data.stats.totalIssues}
          </div>
        </div>
      </div>

      {/* Recent Requests */}
      {data.activity.recentRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Recent Requests</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {data.activity.recentRequests.slice(0, 10).map((request) => (
              <div key={request.id} className="bg-fd-card border border-fd-border rounded-lg overflow-hidden">
                <div className="aspect-[2/3] relative">
                  {request.media.posterPath ? (
                    <img
                      src={getTmdbImageUrl(request.media.posterPath, 'w300') || ''}
                      alt={request.media.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-fd-muted flex items-center justify-center">
                      <span className="text-fd-muted-foreground">No Image</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/70 rounded px-2 py-1 text-xs">
                    {request.type === 'movie' ? '🎬' : '📺'} {request.is4k ? '4K' : 'HD'}
                  </div>
                  <div className={`absolute top-2 left-2 bg-black/70 rounded px-2 py-1 text-xs ${getStatusColor(request.status)}`}>
                    {getStatusText(request.status)}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate" title={request.media.title}>
                    {request.media.title}
                  </h3>
                  <p className="text-xs text-fd-muted-foreground">
                    {request.media.releaseDate && formatDate(request.media.releaseDate)}
                  </p>
                  <p className="text-xs text-fd-muted-foreground mt-1">
                    by {request.requestedBy.displayName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Added */}
      {data.activity.recentlyAdded.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Recently Added to Library</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {data.activity.recentlyAdded.slice(0, 10).map((item) => (
              <div key={item.id} className="bg-fd-card border border-fd-border rounded-lg overflow-hidden">
                <div className="aspect-[2/3] relative">
                  {item.posterPath ? (
                    <img
                      src={getTmdbImageUrl(item.posterPath, 'w300') || ''}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-fd-muted flex items-center justify-center">
                      <span className="text-fd-muted-foreground">No Image</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/70 rounded px-2 py-1 text-xs">
                    {item.mediaType === 'movie' ? '🎬 Movie' : '📺 TV Show'}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate" title={item.title}>
                    {item.title}
                  </h3>
                  <p className="text-xs text-fd-muted-foreground">
                    {item.releaseDate && formatDate(item.releaseDate)}
                  </p>
                  <p className="text-xs text-green-500 mt-1">
                    ✓ Available
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Activity Message */}
      {data.activity.recentRequests.length === 0 && data.activity.recentlyAdded.length === 0 && (
        <div className="bg-fd-card border border-fd-border rounded-lg p-8 text-center">
          <p className="text-fd-muted-foreground">No recent activity to display</p>
        </div>
      )}
    </div>
  );
}