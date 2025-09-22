/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '../logger';
import { getServiceInstancesByType } from '../config-db';
import { ServiceInstance } from '../config/multi-instance-types';
import { SonarrCollector, SonarrMetrics } from './sonarr-collector';
import { RadarrCollector, RadarrMetrics } from './radarr-collector';
import { ProwlarrCollector, ProwlarrMetrics } from './prowlarr-collector';
import { TautulliCollector, TautulliMetrics } from './tautulli-collector';
import { SABnzbdCollector, SABnzbdMetrics } from './sabnzbd-collector';
import { QBittorrentCollector, QBittorrentMetrics } from './qbittorrent-collector';
import { OverseerrCollector, OverseerrMetrics } from './overseerr-collector';
import { JellyseerrCollector, JellyseerrMetrics } from './jellyseerr-collector';
import { JellyfinCollector, JellyfinMetrics } from './jellyfin-collector';
import { db } from '../database';
import { OverseerrAPI } from '../api/overseerr';
import { createJellyseerrClient } from '../api/jellyseerr';
import { metricsMemoryManager } from './memory-manager';

export interface AllServiceMetrics {
  [instanceId: string]: SonarrMetrics | RadarrMetrics | ProwlarrMetrics | TautulliMetrics | SABnzbdMetrics | QBittorrentMetrics | OverseerrMetrics | JellyseerrMetrics | JellyfinMetrics | string | number | null;
  timestamp: string;
  collection_duration_ms: number;
}

export class MetricsCollector {
  private isCollecting: boolean = false;

  constructor() {
    // Use the shared logger instance
  }

  async collectAll(): Promise<AllServiceMetrics> {
    if (this.isCollecting) {
      logger.warn('Metrics collection already in progress - request rejected');
      throw new Error('Metrics collection already in progress');
    }

    const startTime = Date.now();
    this.isCollecting = true;
    
    logger.info('=== Starting Comprehensive Metrics Collection ===');
    
    try {
      const results: AllServiceMetrics = {
        timestamp: new Date().toISOString(),
        collection_duration_ms: 0
      };
      
      logger.info('Gathering service instances from all configured types...');

      // Collect from all service instances in parallel
      const collectionPromises: Promise<void>[] = [];

      // Collect Sonarr instances
      const sonarrInstances = getServiceInstancesByType('sonarr');
      const sonarrCount = Object.keys(sonarrInstances).length;
      if (sonarrCount > 0) {
        logger.info(`Found ${sonarrCount} Sonarr instance(s) to collect metrics from`);
        Object.entries(sonarrInstances).forEach(([instanceId, instance]) => {
          logger.debug(`Queuing metrics collection for Sonarr instance: ${instanceId} (${instance.displayName})`);
          collectionPromises.push(
            this.collectSonarrInstance(instanceId, instance).then(metrics => {
              if (metrics) {
                results[instanceId] = metrics;
                logger.debug(`Successfully collected metrics for Sonarr ${instanceId}`);
              }
            }).catch(error => {
              logger.error(`Failed to collect Sonarr metrics for ${instanceId}:`, error);
            })
          );
        });
      } else {
        logger.debug('No Sonarr instances configured');
      }

      // Collect Radarr instances
      const radarrInstances = getServiceInstancesByType('radarr');
      const radarrCount = Object.keys(radarrInstances).length;
      if (radarrCount > 0) {
        logger.info(`Found ${radarrCount} Radarr instance(s) to collect metrics from`);
        Object.entries(radarrInstances).forEach(([instanceId, instance]) => {
          logger.debug(`Queuing metrics collection for Radarr instance: ${instanceId} (${instance.displayName})`);
          collectionPromises.push(
            this.collectRadarrInstance(instanceId, instance).then(metrics => {
              if (metrics) {
                results[instanceId] = metrics;
                logger.debug(`Successfully collected metrics for Radarr ${instanceId}`);
              }
            }).catch(error => {
              logger.error(`Failed to collect Radarr metrics for ${instanceId}:`, error);
            })
          );
        });
      } else {
        logger.debug('No Radarr instances configured');
      }

      // Collect Prowlarr instances
      const prowlarrInstances = getServiceInstancesByType('prowlarr');
      const prowlarrCount = Object.keys(prowlarrInstances).length;
      if (prowlarrCount > 0) {
        logger.info(`Found ${prowlarrCount} Prowlarr instance(s) to collect metrics from`);
        Object.entries(prowlarrInstances).forEach(([instanceId, instance]) => {
          logger.debug(`Queuing metrics collection for Prowlarr instance: ${instanceId} (${instance.displayName})`);
          collectionPromises.push(
            this.collectProwlarrInstance(instanceId, instance).then(metrics => {
              if (metrics) {
                results[instanceId] = metrics;
                logger.debug(`Successfully collected metrics for Prowlarr ${instanceId}`);
              }
            }).catch(error => {
              logger.error(`Failed to collect Prowlarr metrics for ${instanceId}:`, error);
            })
          );
        });
      } else {
        logger.debug('No Prowlarr instances configured');
      }

      // Collect Tautulli instances
      const tautulliInstances = getServiceInstancesByType('tautulli');
      const tautulliCount = Object.keys(tautulliInstances).length;
      if (tautulliCount > 0) {
        logger.info(`Found ${tautulliCount} Tautulli instance(s) to collect metrics from`);
        Object.entries(tautulliInstances).forEach(([instanceId, instance]) => {
          logger.debug(`Queuing metrics collection for Tautulli instance: ${instanceId} (${instance.displayName})`);
          collectionPromises.push(
            this.collectTautulliInstance(instanceId, instance).then(metrics => {
              if (metrics) {
                results[instanceId] = metrics;
                logger.debug(`Successfully collected metrics for Tautulli ${instanceId}`);
              }
            }).catch(error => {
              logger.error(`Failed to collect Tautulli metrics for ${instanceId}:`, error);
            })
          );
        });
      } else {
        logger.debug('No Tautulli instances configured');
      }

      // Collect SABnzbd instances
      const sabnzbdInstances = getServiceInstancesByType('sabnzbd');
      const sabnzbdCount = Object.keys(sabnzbdInstances).length;
      if (sabnzbdCount > 0) {
        logger.info(`Found ${sabnzbdCount} SABnzbd instance(s) to collect metrics from`);
        Object.entries(sabnzbdInstances).forEach(([instanceId, instance]) => {
          logger.debug(`Queuing metrics collection for SABnzbd instance: ${instanceId} (${instance.displayName})`);
          collectionPromises.push(
            this.collectSABnzbdInstance(instanceId, instance).then(metrics => {
              if (metrics) {
                results[instanceId] = metrics;
                logger.debug(`Successfully collected metrics for SABnzbd ${instanceId}`);
              }
            }).catch(error => {
              logger.error(`Failed to collect SABnzbd metrics for ${instanceId}:`, error);
            })
          );
        });
      } else {
        logger.debug('No SABnzbd instances configured');
      }

      // Collect qBittorrent instances
      const qbittorrentInstances = getServiceInstancesByType('qbittorrent');
      const qbittorrentCount = Object.keys(qbittorrentInstances).length;
      if (qbittorrentCount > 0) {
        logger.info(`Found ${qbittorrentCount} qBittorrent instance(s) to collect metrics from`);
        Object.entries(qbittorrentInstances).forEach(([instanceId, instance]) => {
          logger.debug(`Queuing metrics collection for qBittorrent instance: ${instanceId} (${instance.displayName})`);
          collectionPromises.push(
            this.collectQBittorrentInstance(instanceId, instance).then(metrics => {
              if (metrics) {
                results[instanceId] = metrics;
                logger.debug(`Successfully collected metrics for qBittorrent ${instanceId}`);
              }
            }).catch(error => {
              logger.error(`Failed to collect qBittorrent metrics for ${instanceId}:`, error);
            })
          );
        });
      } else {
        logger.debug('No qBittorrent instances configured');
      }

      // Collect Overseerr instances
      const overseerrInstances = getServiceInstancesByType('overseerr');
      const overseerrCount = Object.keys(overseerrInstances).length;
      if (overseerrCount > 0) {
        logger.info(`Found ${overseerrCount} Overseerr instance(s) to collect metrics from`);
        Object.entries(overseerrInstances).forEach(([instanceId, instance]) => {
          logger.debug(`Queuing metrics collection for Overseerr instance: ${instanceId} (${instance.displayName})`);
          collectionPromises.push(
            this.collectOverseerrInstance(instanceId, instance).then(metrics => {
              if (metrics) {
                results[instanceId] = metrics;
                logger.debug(`Successfully collected metrics for Overseerr ${instanceId}`);
              }
            }).catch(error => {
              logger.error(`Failed to collect Overseerr metrics for ${instanceId}:`, error);
            })
          );
        });
      } else {
        logger.debug('No Overseerr instances configured');
      }

      // Collect Jellyseerr instances
      const jellyseerrInstances = getServiceInstancesByType('jellyseerr');
      const jellyseerrCount = Object.keys(jellyseerrInstances).length;
      if (jellyseerrCount > 0) {
        logger.info(`Found ${jellyseerrCount} Jellyseerr instance(s) to collect metrics from`);
        Object.entries(jellyseerrInstances).forEach(([instanceId, instance]) => {
          logger.debug(`Queuing metrics collection for Jellyseerr instance: ${instanceId} (${instance.displayName})`);
          collectionPromises.push(
            this.collectJellyseerrInstance(instanceId, instance).then(metrics => {
              if (metrics) {
                results[instanceId] = metrics;
                logger.debug(`Successfully collected metrics for Jellyseerr ${instanceId}`);
              }
            }).catch(error => {
              logger.error(`Failed to collect Jellyseerr metrics for ${instanceId}:`, error);
            })
          );
        });
      } else {
        logger.debug('No Jellyseerr instances configured');
      }

      // Collect Jellyfin instances
      const jellyfinInstances = getServiceInstancesByType('jellyfin');
      const jellyfinCount = Object.keys(jellyfinInstances).length;
      if (jellyfinCount > 0) {
        logger.info(`Found ${jellyfinCount} Jellyfin instance(s) to collect metrics from`);
        Object.entries(jellyfinInstances).forEach(([instanceId, instance]) => {
          logger.debug(`Queuing metrics collection for Jellyfin instance: ${instanceId} (${instance.displayName})`);
          collectionPromises.push(
            this.collectJellyfinInstance(instanceId, instance).then(metrics => {
              if (metrics) {
                results[instanceId] = metrics;
                logger.debug(`Successfully collected metrics for Jellyfin ${instanceId}`);
              }
            }).catch(error => {
              logger.error(`Failed to collect Jellyfin metrics for ${instanceId}:`, error);
            })
          );
        });
      } else {
        logger.debug('No Jellyfin instances configured');
      }

      // Wait for all collections to complete
      const totalQueued = collectionPromises.length;
      logger.info(`Executing ${totalQueued} parallel metric collection requests...`);
      
      await Promise.all(collectionPromises);

      const duration = Date.now() - startTime;
      results.collection_duration_ms = duration;

      // Count successful collections
      const successfulCollections = Object.keys(results).filter(
        key => key !== 'timestamp' && key !== 'collection_duration_ms'
      ).length;
      
      logger.info('=== Metrics Collection Summary ===');
      logger.info(`Total instances queried: ${totalQueued}`);
      logger.info(`Successful collections: ${successfulCollections}`);
      logger.info(`Failed collections: ${totalQueued - successfulCollections}`);
      logger.info(`Total duration: ${duration}ms`);
      logger.info(`Average per instance: ${totalQueued > 0 ? Math.round(duration / totalQueued) : 0}ms`);
      
      // Log collected metrics summary
      if (successfulCollections > 0) {
        const summary: Record<string, number> = {};
        Object.entries(results).forEach(([key, value]) => {
          if (key !== 'timestamp' && key !== 'collection_duration_ms' && value && typeof value === 'object') {
            const metricCount = Object.keys(value).length;
            const serviceType = key.replace(/[0-9]+$/, '');
            summary[serviceType] = (summary[serviceType] || 0) + metricCount;
          }
        });
        logger.debug('Metrics collected by service type:', summary);
      }
      
      // Save metrics to database
      if (successfulCollections > 0) {
        try {
          logger.info('Saving collected metrics to database...');
          await db.insertMetrics(results);
          logger.info('✓ Metrics successfully saved to database');
        } catch (dbError) {
          logger.error('✗ Failed to save metrics to database:', dbError);
        }
      } else {
        logger.warn('No metrics collected - nothing to save to database');
      }
      
      // Store metrics in memory manager with automatic cleanup
      const cacheKey = `metrics_${new Date().toISOString()}`;
      metricsMemoryManager.store(cacheKey, results);
      
      // Get memory stats periodically
      if (Math.random() < 0.1) { // 10% chance
        const memStats = metricsMemoryManager.getStats();
        logger.info('Metrics memory cache status:', memStats);
      }
      
      logger.info('=== Metrics Collection Complete ===');
      return results;
      
    } finally {
      this.isCollecting = false;
      
      // Trigger cleanup if memory is getting high
      const memUsage = process.memoryUsage();
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      if (heapUsedMB > 400) { // If heap usage > 400MB
        logger.info('High memory usage detected, triggering metrics cache cleanup');
        metricsMemoryManager.performCleanup();
      }
    }
  }

  private async collectSonarrInstance(instanceId: string, instance: ServiceInstance): Promise<SonarrMetrics | null> {
    try {
      if (!instance.url || !instance.apiKey) {
        logger.warn(`Sonarr instance ${instanceId} (${instance.displayName}) is not fully configured - missing ${!instance.url ? 'URL' : 'API key'}`);
        return null;
      }
      
      logger.debug(`Connecting to Sonarr instance ${instanceId} at ${instance.url}...`);
      const collector = new SonarrCollector(instance.url, instance.apiKey);
      const startTime = Date.now();
      
      const metrics = await collector.collect();
      const duration = Date.now() - startTime;
      
      logger.debug(`Sonarr ${instanceId} metrics collected in ${duration}ms:`, {
        series: metrics.series.total,
        episodes: metrics.episodes.total,
        queue: metrics.queue.total
      });
      
      return metrics;
    } catch (error) {
      logger.error(`Failed to collect Sonarr metrics for ${instanceId} (${instance.displayName}):`, error);
      return null;
    }
  }

  private async collectRadarrInstance(instanceId: string, instance: ServiceInstance): Promise<RadarrMetrics | null> {
    try {
      if (!instance.url || !instance.apiKey) {
        logger.warn(`Radarr instance ${instanceId} not fully configured, skipping`);
        return null;
      }
      
      const collector = new RadarrCollector(instance.url, instance.apiKey);
      return await collector.collect();
    } catch (error) {
      logger.error(`Failed to collect Radarr metrics for ${instanceId}:`, error);
      return null;
    }
  }

  private async collectProwlarrInstance(instanceId: string, instance: ServiceInstance): Promise<ProwlarrMetrics | null> {
    try {
      if (!instance.url || !instance.apiKey) {
        logger.warn(`Prowlarr instance ${instanceId} not fully configured, skipping`);
        return null;
      }
      
      const collector = new ProwlarrCollector(instance.url, instance.apiKey);
      return await collector.collect();
    } catch (error) {
      logger.error(`Failed to collect Prowlarr metrics for ${instanceId}:`, error);
      return null;
    }
  }

  private async collectTautulliInstance(instanceId: string, instance: ServiceInstance): Promise<TautulliMetrics | null> {
    try {
      if (!instance.url || !instance.apiKey) {
        logger.warn(`Tautulli instance ${instanceId} (${instance.displayName}) is not fully configured - missing ${!instance.url ? 'URL' : 'API key'}`);
        return null;
      }
      
      logger.debug(`Connecting to Tautulli instance ${instanceId} at ${instance.url}...`);
      const collector = new TautulliCollector({ url: instance.url, apiKey: instance.apiKey });
      const startTime = Date.now();
      
      const metrics = await collector.collect();
      const duration = Date.now() - startTime;
      
      logger.debug(`Tautulli ${instanceId} metrics collected in ${duration}ms`);
      return metrics;
    } catch (error) {
      logger.error(`Failed to collect Tautulli metrics for ${instanceId} (${instance.displayName}):`, error);
      return null;
    }
  }

  private async collectSABnzbdInstance(instanceId: string, instance: ServiceInstance): Promise<SABnzbdMetrics | null> {
    try {
      if (!instance.url || !instance.apiKey) {
        logger.warn(`SABnzbd instance ${instanceId} (${instance.displayName}) is not fully configured - missing ${!instance.url ? 'URL' : 'API key'}`);
        return null;
      }
      
      logger.debug(`Connecting to SABnzbd instance ${instanceId} at ${instance.url}...`);
      const collector = new SABnzbdCollector({ url: instance.url, apiKey: instance.apiKey });
      const startTime = Date.now();
      
      const metrics = await collector.collect();
      const duration = Date.now() - startTime;
      
      logger.debug(`SABnzbd ${instanceId} metrics collected in ${duration}ms`);
      return metrics;
    } catch (error) {
      logger.error(`Failed to collect SABnzbd metrics for ${instanceId} (${instance.displayName}):`, error);
      return null;
    }
  }

  private async collectQBittorrentInstance(instanceId: string, instance: ServiceInstance): Promise<QBittorrentMetrics | null> {
    try {
      const requiredFields = ['url', 'username', 'password'];
      const missingFields = requiredFields.filter(field => !(instance as any)[field]);
      
      if (missingFields.length > 0) {
        logger.warn(`qBittorrent instance ${instanceId} (${instance.displayName}) is not fully configured - missing: ${missingFields.join(', ')}`);
        return null;
      }
      
      logger.debug(`Connecting to qBittorrent instance ${instanceId} at ${instance.url}...`);
      const collector = new QBittorrentCollector({
        url: instance.url || '',
        username: (instance as any).username || '',
        password: (instance as any).password || ''
      });
      const startTime = Date.now();
      
      const metrics = await collector.collect();
      const duration = Date.now() - startTime;
      
      logger.debug(`qBittorrent ${instanceId} metrics collected in ${duration}ms`);
      return metrics;
    } catch (error) {
      logger.error(`Failed to collect qBittorrent metrics for ${instanceId} (${instance.displayName}):`, error);
      return null;
    }
  }

  private async collectOverseerrInstance(instanceId: string, instance: ServiceInstance): Promise<OverseerrMetrics | null> {
    try {
      if (!instance.url || !instance.apiKey) {
        logger.warn(`Overseerr instance ${instanceId} (${instance.displayName}) is not fully configured - missing ${!instance.url ? 'URL' : 'API key'}`);
        return null;
      }
      
      logger.debug(`Connecting to Overseerr instance ${instanceId} at ${instance.url}...`);
      const api = new OverseerrAPI({ url: instance.url, apiKey: instance.apiKey });
      const collector = new OverseerrCollector(api);
      const startTime = Date.now();
      
      const metrics = await collector.collect();
      const duration = Date.now() - startTime;
      
      logger.debug(`Overseerr ${instanceId} metrics collected in ${duration}ms`);
      return metrics;
    } catch (error) {
      logger.error(`Failed to collect Overseerr metrics for ${instanceId} (${instance.displayName}):`, error);
      return null;
    }
  }

  private async collectJellyseerrInstance(instanceId: string, instance: ServiceInstance): Promise<JellyseerrMetrics | null> {
    try {
      if (!instance.url || !instance.apiKey) {
        logger.warn(`Jellyseerr instance ${instanceId} (${instance.displayName}) is not fully configured - missing ${!instance.url ? 'URL' : 'API key'}`);
        return null;
      }
      
      logger.debug(`Connecting to Jellyseerr instance ${instanceId} at ${instance.url}...`);
      const api = createJellyseerrClient({ url: instance.url, apiKey: instance.apiKey });
      const collector = new JellyseerrCollector(api);
      const startTime = Date.now();
      
      const metrics = await collector.collect();
      const duration = Date.now() - startTime;
      
      logger.debug(`Jellyseerr ${instanceId} metrics collected in ${duration}ms`);
      return metrics;
    } catch (error) {
      logger.error(`Failed to collect Jellyseerr metrics for ${instanceId} (${instance.displayName}):`, error);
      return null;
    }
  }

  private async collectJellyfinInstance(instanceId: string, instance: ServiceInstance): Promise<JellyfinMetrics | null> {
    try {
      if (!instance.url || !instance.apiKey) {
        logger.warn(`Jellyfin instance ${instanceId} (${instance.displayName}) is not fully configured - missing ${!instance.url ? 'URL' : 'API key'}`);
        return null;
      }
      
      logger.debug(`Connecting to Jellyfin instance ${instanceId} at ${instance.url}...`);
      const collector = new JellyfinCollector(instance.url, instance.apiKey);
      const startTime = Date.now();
      
      const metrics = await collector.collect();
      const duration = Date.now() - startTime;
      
      logger.debug(`Jellyfin ${instanceId} metrics collected in ${duration}ms`);
      return metrics;
    } catch (error) {
      logger.error(`Failed to collect Jellyfin metrics for ${instanceId} (${instance.displayName}):`, error);
      return null;
    }
  }


  isCurrentlyCollecting(): boolean {
    return this.isCollecting;
  }

  // Method to get a summary of what services are configured
  async getConfiguredServices(): Promise<string[]> {
    try {
      const { getServiceInstances } = await import('@/lib/config-db');
      const instances = getServiceInstances();
      
      const serviceTypes = new Set<string>();
      Object.values(instances).forEach(instance => {
        if (instance.enabled && instance.url && (instance.apiKey || instance.token)) {
          serviceTypes.add(instance.type);
        }
      });
      
      return Array.from(serviceTypes);
    } catch (error) {
      logger.error('Failed to get configured services:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const metricsCollector = new MetricsCollector();