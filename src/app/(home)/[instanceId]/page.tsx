/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SonarrOverview from '@/components/services/sonarr-overview';
import RadarrOverview from '@/components/services/radarr-overview';
import PlexOverview from '@/components/services/plex-overview';
import TautulliOverview from '@/components/services/tautulli-overview';
import SabnzbdOverview from '@/components/services/sabnzbd-overview';
import ProwlarrOverview from '@/components/services/prowlarr-overview';
import QbittorrentOverview from '@/components/services/qbittorrent-overview';
import OverseerrOverview from '@/components/services/overseerr-overview';
import JellyfinOverview from '@/components/services/jellyfin-overview';
import JellyseerrOverview from '@/components/services/jellyseerr-overview';

interface ServiceInstance {
  id: string;
  type: string;
  displayName: string;
  url: string;
  apiKey?: string;
  token?: string;
  username?: string;
  password?: string;
  enabled: boolean;
}

const serviceComponents: Record<string, React.ComponentType<{ instanceId: string; instanceName: string }>> = {
  sonarr: SonarrOverview,
  radarr: RadarrOverview,
  plex: PlexOverview,
  tautulli: TautulliOverview,
  sabnzbd: SabnzbdOverview,
  prowlarr: ProwlarrOverview,
  qbittorrent: QbittorrentOverview,
  overseerr: OverseerrOverview,
  jellyfin: JellyfinOverview,
  jellyseerr: JellyseerrOverview,
};

export default function ServiceInstancePage() {
  const params = useParams();
  const instanceId = params.instanceId as string;
  const [instance, setInstance] = useState<ServiceInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstance = async () => {
      try {
        // Extract service type from instanceId (e.g., sonarr1 -> sonarr)
        const serviceType = instanceId.replace(/\d+$/, '');
        
        const res = await fetch(`/api/public/instances/${serviceType}/${instanceId}`);
        if (!res.ok) {
          throw new Error('Instance not found');
        }
        
        const data = await res.json();
        setInstance(data.instance);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load instance');
      } finally {
        setLoading(false);
      }
    };

    fetchInstance();
  }, [instanceId]);

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

  if (error || !instance) {
    return (
      <div className="min-h-screen p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">Error</h2>
          <p className="text-fd-muted-foreground">{error || 'Unknown error occurred'}</p>
        </div>
      </div>
    );
  }

  if (!instance.enabled) {
    return (
      <div className="min-h-screen p-8">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-2 text-yellow-600 dark:text-yellow-400">Instance Disabled</h2>
          <p className="text-fd-muted-foreground">This instance is currently disabled.</p>
        </div>
      </div>
    );
  }

  const ServiceComponent = serviceComponents[instance.type];
  
  if (!ServiceComponent) {
    return (
      <div className="min-h-screen p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">Unsupported Service</h2>
          <p className="text-fd-muted-foreground">Service type &quot;{instance.type}&quot; is not yet supported.</p>
        </div>
      </div>
    );
  }

  return <ServiceComponent instanceId={instanceId} instanceName={instance.displayName} />;
}