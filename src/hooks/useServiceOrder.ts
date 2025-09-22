'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

export interface ServiceInfo {
  id: string;
  name: string;
  icon: string;
  href?: string;
  configured: boolean;
  apiEndpoint?: string;
}

const STORAGE_KEY = 'dasharr-service-order';

// These are all available services - configured status will be checked dynamically
const allServices: ServiceInfo[] = [
  {
    id: 'plex',
    name: 'Plex',
    icon: '/icons/plex.svg',
    href: '/plex',
    configured: false,
    apiEndpoint: '/api/services/plex/overview',
  },
  {
    id: 'jellyfin',
    name: 'Jellyfin',
    icon: '/icons/jellyfin.svg',
    href: '/jellyfin',
    configured: false,
    apiEndpoint: '/api/services/jellyfin/overview',
  },
  {
    id: 'jellyseerr',
    name: 'Jellyseerr',
    icon: '/icons/jellyseerr.svg',
    href: '/jellyseerr',
    configured: false,
    apiEndpoint: '/api/services/jellyseerr/overview',
  },
  {
    id: 'tautulli',
    name: 'Tautulli',
    icon: '/icons/tautulli.svg',
    href: '/tautulli',
    configured: false,
    apiEndpoint: '/api/services/tautulli/overview',
  },
  {
    id: 'overseerr',
    name: 'Overseerr',
    icon: '/icons/overseerr.svg',
    href: '/overseerr',
    configured: false,
    apiEndpoint: '/api/services/overseerr/overview',
  },
  {
    id: 'radarr',
    name: 'Radarr',
    icon: '/icons/radarr.svg',
    href: '/radarr',
    configured: false,
    apiEndpoint: '/api/services/radarr/overview',
  },
  {
    id: 'sonarr',
    name: 'Sonarr',
    icon: '/icons/sonarr.svg',
    href: '/sonarr',
    configured: false,
    apiEndpoint: '/api/services/sonarr/overview',
  },
  {
    id: 'prowlarr',
    name: 'Prowlarr',
    icon: '/icons/prowlarr.svg',
    href: '/prowlarr',
    configured: false,
    apiEndpoint: '/api/services/prowlarr/overview',
  },
  {
    id: 'sabnzbd',
    name: 'SABnzbd',
    icon: '/icons/sabnzbd.svg',
    href: '/sabnzbd',
    configured: false,
    apiEndpoint: '/api/services/sabnzbd/overview',
  },
  {
    id: 'qbittorrent',
    name: 'qBittorrent',
    icon: '/icons/qbittorrent.svg',
    href: '/qbittorrent',
    configured: false,
    apiEndpoint: '/api/services/qbittorrent/overview',
  },
  {
    id: 'unifi',
    name: 'UniFi',
    icon: '/icons/unifi.svg',
    href: '/unifi',
    configured: false,
    apiEndpoint: '/api/services/unifi/overview',
  },
];

export function useServiceOrder() {
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
    
    // Check configuration status for all services
    const checkConfigurations = async () => {
      try {
        // Use the new check endpoint that considers both env vars and web config
        const response = await fetch('/api/admin/check');
        if (!response.ok) {
          throw new Error('Failed to check configurations');
        }
        
        const { configuredServices: configuredServiceIds } = await response.json();
        logger.debug('[Dasharr] Configured services from API:', configuredServiceIds);
        
        // Filter services to only include configured ones
        const configuredServices = allServices
          .filter(service => configuredServiceIds.includes(service.id))
          .map(service => ({ ...service, configured: true }));
      
      // Load saved order from localStorage
      const savedOrder = localStorage.getItem(STORAGE_KEY);
      if (savedOrder) {
        try {
          const parsedOrder = JSON.parse(savedOrder) as string[];
          // Reorder services based on saved order
          const orderedServices = parsedOrder
            .map(id => configuredServices.find(s => s.id === id))
            .filter((s): s is ServiceInfo => s !== undefined);
          
          // Add any new configured services that aren't in the saved order
          const missingServices = configuredServices.filter(
            s => !parsedOrder.includes(s.id)
          );
          
          setServices([...orderedServices, ...missingServices]);
        } catch (error) {
          logger.error('Failed to parse saved service order:', error);
          setServices(configuredServices);
        }
      } else {
        setServices(configuredServices);
      }
      } catch (error) {
        logger.error('Failed to check service configurations:', error);
        setServices([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkConfigurations();
  }, []);

  const saveOrder = (newServices: ServiceInfo[]) => {
    setServices(newServices);
    const orderIds = newServices.map(s => s.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orderIds));
  };

  return { services, saveOrder, isClient, isLoading };
}