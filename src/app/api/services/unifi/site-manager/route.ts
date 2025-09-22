import { NextResponse } from 'next/server';
import { getServiceInstancesByType } from '@/lib/config-db';
import { UnifiApi } from '@/lib/api/unifi';
import { withErrorHandler } from '@/lib/api/utils';
import { logger } from '@/lib/logger';

async function handler() {
  const unifiInstances = getServiceInstancesByType('unifi');
  const firstUnifi = Object.values(unifiInstances)[0];
  
  // Check if Site Manager is enabled
  const siteManagerEnabled = firstUnifi?.siteManager === 'true' || process.env.UNIFI_SITE_MANAGER === 'true';
  const siteManagerApiKeyRaw = firstUnifi?.siteManagerApiKey || process.env.UNIFI_SITE_MANAGER_API_KEY;
  const siteManagerApiKey = typeof siteManagerApiKeyRaw === 'string' ? siteManagerApiKeyRaw : String(siteManagerApiKeyRaw);
  
  if (!siteManagerEnabled || !siteManagerApiKey) {
    return NextResponse.json({ 
      enabled: false,
      error: 'UniFi Site Manager not configured' 
    }, { status: 400 });
  }
  
  logger.debug('Site Manager configuration:', {
    enabled: siteManagerEnabled,
    apiKeyPresent: !!siteManagerApiKey,
    apiKeyLength: siteManagerApiKey?.length
  });
  
  const api = new UnifiApi({ siteManagerApiKey });
  
  try {
    // Fetch hosts, sites, and devices from Site Manager
    const [hosts, sites, devices] = await Promise.all([
      api.getSiteManagerHosts().catch((err) => {
        logger.error('Failed to get Site Manager hosts:', err);
        return [];
      }),
      api.getSiteManagerSites().catch((err) => {
        logger.error('Failed to get Site Manager sites:', err);
        return [];
      }),
      api.getSiteManagerDevices().catch((err) => {
        logger.error('Failed to get Site Manager devices:', err);
        return [];
      })
    ]);
    
    // Get ISP metrics for each host
    const hostsWithMetrics = await Promise.all(
      hosts.map(async (host) => {
        try {
          const metrics = await api.getSiteManagerISPMetrics(host.id);
          return { ...host, metrics };
        } catch {
          return { ...host, metrics: null };
        }
      })
    );
    
    // Calculate totals
    const totalSites = sites.length;
    const totalDevices = devices.length || sites.reduce((sum, site) => sum + (site.devices_count || 0), 0);
    const onlineHosts = hosts.filter(h => h.status === 'ONLINE').length;
    
    return NextResponse.json({
      enabled: true,
      stats: {
        totalHosts: hosts.length,
        onlineHosts,
        offlineHosts: hosts.length - onlineHosts,
        totalSites,
        totalDevices,
      },
      hosts: hostsWithMetrics,
      sites: sites.map(site => ({
        id: site.id,
        name: site.name,
        deviceCount: site.devices_count || 0
      })),
      devices: devices
    });
  } catch (error) {
    return NextResponse.json(
      { 
        enabled: true,
        error: error instanceof Error ? error.message : 'Failed to fetch Site Manager data' 
      },
      { status: 500 }
    );
  }
}

export const GET = withErrorHandler(handler);