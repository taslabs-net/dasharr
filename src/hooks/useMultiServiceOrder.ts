'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { ServiceInstance } from '@/lib/config/multi-instance-types';

export interface ServiceInstanceInfo {
  id: string; // Instance ID like "sonarr1", "sonarr2"
  type: string; // Service type like "sonarr", "radarr"
  displayName: string; // Custom name like "Tim's TV Shows"
  icon: string;
  href: string;
  configured: boolean;
  apiEndpoint: string;
  instance: ServiceInstance;
}

const STORAGE_KEY = 'dasharr-service-order-v2';

// Service type to icon mapping
const serviceIcons: Record<string, string> = {
  plex: '/icons/plex.svg',
  jellyfin: '/icons/jellyfin.svg',
  jellyseerr: '/icons/jellyseerr.svg',
  tautulli: '/icons/tautulli.svg',
  overseerr: '/icons/overseerr.svg',
  radarr: '/icons/radarr.svg',
  sonarr: '/icons/sonarr.svg',
  prowlarr: '/icons/prowlarr.svg',
  sabnzbd: '/icons/sabnzbd.svg',
  qbittorrent: '/icons/qbittorrent.svg',
  unifi: '/icons/unifi.svg',
};

export function useMultiServiceOrder() {
  const [services, setServices] = useState<ServiceInstanceInfo[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
    
    const loadServices = async () => {
      try {
        // Fetch all configured instances
        const response = await fetch('/api/public/instances');
        if (!response.ok) {
          throw new Error('Failed to fetch instances');
        }
        
        const { instances } = await response.json();
        logger.debug('[Dasharr] Loaded instances:', instances);
        
        // Convert instances to ServiceInstanceInfo format
        const serviceInfos: ServiceInstanceInfo[] = Object.entries(instances)
          .filter(([, instance]) => (instance as ServiceInstance).enabled !== false)
          .map(([instanceId, instance]) => {
            const inst = instance as ServiceInstance;
            return {
              id: instanceId,
              type: inst.type,
              displayName: inst.displayName,
              icon: serviceIcons[inst.type] || '/icons/default.svg',
              // Always use instance-aware routes for consistency
              href: `/${instanceId}`,
              configured: !!(inst.url && (inst.apiKey || inst.token || inst.username)),
              apiEndpoint: `/api/services/${inst.type}/overview?instance=${instanceId}`,
              instance: inst
            };
          });
        
        // Load saved order from localStorage
        const savedOrder = localStorage.getItem(STORAGE_KEY);
        if (savedOrder) {
          try {
            const parsedOrder = JSON.parse(savedOrder) as string[];
            // Reorder services based on saved order
            const orderedServices = parsedOrder
              .map(id => serviceInfos.find(s => s.id === id))
              .filter((s): s is ServiceInstanceInfo => s !== undefined);
            
            // Add any new services that aren't in the saved order
            const missingServices = serviceInfos.filter(
              s => !parsedOrder.includes(s.id)
            );
            
            setServices([...orderedServices, ...missingServices]);
          } catch (error) {
            logger.error('Failed to parse saved service order:', error);
            // Sort by type then by instance number
            setServices(serviceInfos.sort((a, b) => {
              if (a.type !== b.type) {
                return a.type.localeCompare(b.type);
              }
              return a.id.localeCompare(b.id);
            }));
          }
        } else {
          // Sort by order property if available, otherwise by type
          setServices(serviceInfos.sort((a, b) => {
            const orderA = a.instance.order || 99;
            const orderB = b.instance.order || 99;
            if (orderA !== orderB) {
              return orderA - orderB;
            }
            return a.id.localeCompare(b.id);
          }));
        }
      } catch (error) {
        logger.error('Failed to load service instances:', error);
        setServices([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadServices();
  }, []);

  const saveOrder = (newServices: ServiceInstanceInfo[]) => {
    setServices(newServices);
    const orderIds = newServices.map(s => s.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orderIds));
  };

  return { services, saveOrder, isClient, isLoading };
}