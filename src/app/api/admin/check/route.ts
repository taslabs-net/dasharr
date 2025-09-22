import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config-db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  logger.request('GET', '/api/config/check');
  
  try {
    // Get fresh config data
    const config = await getConfig();
    
    // Check which services are configured (either via env vars or web config)
    const configuredServices: string[] = [];
    
    // Log what we're checking
    logger.debug('Checking service configurations...');
    
    // Check each service
    const services = {
      plex: config.services.plex,
      radarr: config.services.radarr,
      sonarr: config.services.sonarr,
      tautulli: config.services.tautulli,
      sabnzbd: config.services.sabnzbd,
      prowlarr: config.services.prowlarr,
      qbittorrent: config.services.qbittorrent,
      overseerr: config.services.overseerr,
      jellyfin: config.services.jellyfin,
      jellyseerr: config.services.jellyseerr,
      unifi: config.services.unifi,
    };
    
    // Check Plex separately since it uses token instead of apiKey
    if (services.plex.url && services.plex.token) {
      configuredServices.push('plex');
      logger.debug(`Plex configured: URL=${services.plex.url}, Token=***`);
    } else {
      logger.debug(`Plex NOT configured: URL=${services.plex.url || 'missing'}, Token=${services.plex.token ? '***' : 'missing'}`);
    }
    
    // Check qBittorrent separately since it uses username/password
    if (services.qbittorrent.url && services.qbittorrent.username && services.qbittorrent.password) {
      configuredServices.push('qbittorrent');
      logger.debug(`qBittorrent configured: URL=${services.qbittorrent.url}, Username=${services.qbittorrent.username}`);
    } else {
      logger.debug(`qBittorrent NOT configured: URL=${services.qbittorrent.url || 'missing'}, Username=${services.qbittorrent.username || 'missing'}, Password=${services.qbittorrent.password ? '***' : 'missing'}`);
    }
    
    // Check UniFi separately since it uses multiple API keys and site-specific URLs
    const hasUnifiConfig = (services.unifi.url || services.unifi.urlSite1 || services.unifi.urlSite2) && 
                          (services.unifi.apiKey1 || services.unifi.apiKey2 || services.unifi.siteManagerApiKey);
    if (hasUnifiConfig) {
      configuredServices.push('unifi');
      logger.debug(`UniFi configured: URLs or Keys configured`);
    } else {
      logger.debug(`UniFi NOT configured: No valid URL or API key combination found`);
    }
    
    // Check other services that use apiKey
    const apiKeyServices = ['radarr', 'sonarr', 'tautulli', 'sabnzbd', 'prowlarr', 'overseerr', 'jellyfin', 'jellyseerr'] as const;
    for (const serviceName of apiKeyServices) {
      const serviceConfig = services[serviceName];
      if (serviceConfig.url && serviceConfig.apiKey) {
        configuredServices.push(serviceName);
      }
    }
    
    logger.info('Configured services:', configuredServices.join(', ') || 'none');
    return NextResponse.json({ configuredServices });
  } catch (error) {
    logger.error('Failed to check configurations:', error);
    return NextResponse.json(
      { error: 'Failed to check configurations' },
      { status: 500 }
    );
  }
}