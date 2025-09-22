/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRefreshInterval } from '@/hooks/use-refresh-interval';

interface RequestMedia {
  id: number;
  tmdbId: number;
  tvdbId?: number;
  status: number;
  status4k?: number;
  mediaType: 'movie' | 'tv';
  title?: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: string;
}

interface Request {
  id: number;
  type: 'movie' | 'tv';
  media: RequestMedia;
  status: number;
  createdAt: string;
  updatedAt: string;
  requestedBy: {
    id: number;
    displayName: string;
    avatar?: string;
  };
  modifiedBy?: {
    id: number;
    displayName: string;
  };
}

interface RecentlyAddedItem {
  id: number;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  addedAt: string;
  title?: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: string;
}

interface JellyseerrData {
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
    recentRequests: Request[];
    recentlyAdded: RecentlyAddedItem[];
  };
}

interface JellyseerrOverviewProps {
  instanceId: string;
  instanceName: string;
}

export default function JellyseerrOverview({ instanceId, instanceName }: JellyseerrOverviewProps) {
  const [data, setData] = useState<JellyseerrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceUrl, setServiceUrl] = useState<string | null>(null);
  const refreshInterval = useRefreshInterval();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch overview data
        const res = await fetch(`/api/services/jellyseerr/overview?instance=${instanceId}`);
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
          <h2 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">Error Loading Jellyseerr Data</h2>
          <p className="text-fd-muted-foreground">{error || 'Unknown error occurred'}</p>
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

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1: return { label: 'Pending', className: 'text-yellow-500' };
      case 2: return { label: 'Approved', className: 'text-green-500' };
      case 3: return { label: 'Declined', className: 'text-red-500' };
      case 4: return { label: 'Available', className: 'text-blue-500' };
      case 5: return { label: 'Partially Available', className: 'text-orange-500' };
      default: return { label: 'Unknown', className: 'text-fd-muted-foreground' };
    }
  };

  const getTmdbImageUrl = (path?: string, size: string = 'w500') => {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Image
          src="/icons/jellyseerr.svg"
          alt="Jellyseerr"
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
              <span className="text-yellow-500"> Update available ({data.system.commitsBehind} commits behind) • </span>
            )}
            {data.system.initialized ? ' Initialized' : ' Not initialized'}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Total Requests</div>
          <div className="text-2xl font-bold">{data.stats.totalRequests}</div>
          <div className="text-xs text-fd-muted-foreground mt-1">
            {data.stats.movieRequests} movies, {data.stats.tvRequests} TV
          </div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Pending</div>
          <div className="text-2xl font-bold text-yellow-500">{data.stats.pendingRequests}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Approved</div>
          <div className="text-2xl font-bold text-green-500">{data.stats.approvedRequests}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Available</div>
          <div className="text-2xl font-bold text-blue-500">{data.stats.availableRequests}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Open Issues</div>
          <div className="text-2xl font-bold text-orange-500">{data.stats.openIssues}</div>
          <div className="text-xs text-fd-muted-foreground mt-1">
            of {data.stats.totalIssues} total
          </div>
        </div>
      </div>

      {/* Recent Requests */}
      {data.activity.recentRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Recent Requests</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.activity.recentRequests.map((request) => {
              const status = getStatusLabel(request.status);
              const posterUrl = getTmdbImageUrl(request.media.posterPath, 'w342');
              
              return (
                <div key={request.id} className="bg-fd-card border border-fd-border rounded-lg overflow-hidden hover:bg-fd-accent transition-colors">
                  <div className="aspect-[2/3] relative">
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={request.media.title || 'Media poster'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-fd-muted flex items-center justify-center">
                        <span className="text-fd-muted-foreground">No Poster</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium bg-black/50 ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-black/50 text-white">
                        {request.type === 'movie' ? '🎬' : '📺'} {request.type}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold truncate">{request.media.title || 'Unknown Title'}</h3>
                    <p className="text-sm text-fd-muted-foreground">by {request.requestedBy.displayName}</p>
                    <p className="text-xs text-fd-muted-foreground mt-1">{formatDate(request.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recently Added */}
      {data.activity.recentlyAdded.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Recently Added to Media Server</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.activity.recentlyAdded.map((item) => {
              const posterUrl = getTmdbImageUrl(item.posterPath, 'w342');
              
              return (
                <div key={item.id} className="bg-fd-card border border-fd-border rounded-lg overflow-hidden hover:bg-fd-accent transition-colors">
                  <div className="aspect-[2/3] relative">
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={item.title || 'Media poster'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-fd-muted flex items-center justify-center">
                        <span className="text-fd-muted-foreground">No Poster</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-black/50 text-white">
                        {item.mediaType === 'movie' ? '🎬' : '📺'} {item.mediaType}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold truncate">{item.title || 'Unknown Title'}</h3>
                    <p className="text-xs text-fd-muted-foreground mt-1">Added {formatDate(item.addedAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Request Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Processing</div>
          <div className="text-xl font-bold text-purple-500">{data.stats.processingRequests}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Declined</div>
          <div className="text-xl font-bold text-red-500">{data.stats.declinedRequests}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">Movie Requests</div>
          <div className="text-xl font-bold">{data.stats.movieRequests}</div>
        </div>
        <div className="bg-fd-card border border-fd-border rounded-lg p-4">
          <div className="text-fd-muted-foreground text-sm">TV Requests</div>
          <div className="text-xl font-bold">{data.stats.tvRequests}</div>
        </div>
      </div>
    </div>
  );
}