'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRefreshInterval } from '@/hooks/use-refresh-interval';

interface ServicePlaceholderProps {
  instanceId: string;
  instanceName: string;
  serviceName: string;
  apiPath: string;
  iconPath: string;
}

export default function ServicePlaceholder({ 
  instanceId, 
  instanceName, 
  serviceName,
  apiPath,
  iconPath 
}: ServicePlaceholderProps) {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshInterval = useRefreshInterval();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${apiPath}?instance=${instanceId}`);
        if (!res.ok) throw new Error('Failed to fetch data');
        const data = await res.json();
        setData(data);
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
  }, [refreshInterval, instanceId, apiPath]);

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
          <h2 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">Error Loading {serviceName} Data</h2>
          <p className="text-fd-muted-foreground">{error || 'Unknown error occurred'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Image
          src={iconPath}
          alt={serviceName}
          width={48}
          height={48}
          className="rounded"
        />
        <div>
          <h1 className="text-3xl font-bold">{instanceName}</h1>
          <p className="text-fd-muted-foreground">
            {serviceName} Instance
          </p>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="bg-fd-card border border-fd-border rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Full {serviceName} Overview Coming Soon</h2>
        <p className="text-fd-muted-foreground mb-4">
          The detailed overview for {serviceName} is currently being developed.
        </p>
        <p className="text-sm text-fd-muted-foreground">
          API Response Available: {JSON.stringify(data).slice(0, 100)}...
        </p>
      </div>
    </div>
  );
}