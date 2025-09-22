import { NextResponse } from 'next/server';
import { getServiceInstancesByType } from '@/lib/config-db';
import { UnifiApi, getUnifiSiteOverview } from '@/lib/api/unifi';
import { withErrorHandler } from '@/lib/api/utils';
import { logger } from '@/lib/logger';

interface SiteData {
  available: boolean;
  name?: string;
  version?: string;
  consoleVersion?: string;
  deviceType?: string;
  devices?: {
    total: number;
    active: number;
    offline: number;
  };
  connectedDevices?: {
    total: number;
    wired: number;
    wireless: number;
  };
  stats?: {
    wan_download: number;
    wan_upload: number;
  };
  error?: string;
}

interface UnifiOverviewData {
  sites: { [key: string]: SiteData };
  siteManager?: {
    available: boolean;
    hosts?: Array<{
      id: string;
      name: string;
      status: string;
      version: string;
      sites_count: number;
    }>;
    totalSites?: number;
    totalDevices?: number;
    error?: string;
  };
}

async function handler(): Promise<NextResponse> {
  // const appConfig = getConfig(); // Reserved for future use
  const unifiInstances = getServiceInstancesByType('unifi');
  const firstUnifi = Object.values(unifiInstances)[0];
  const unifiUrlRaw = firstUnifi?.url || process.env.UNIFI_URL;
  const unifiUrl = typeof unifiUrlRaw === 'string' ? unifiUrlRaw : String(unifiUrlRaw);
  const siteManagerKeyRaw = firstUnifi?.siteManagerApiKey || process.env.UNIFI_SITE_MANAGER_API_KEY;
  const siteManagerKey = typeof siteManagerKeyRaw === 'string' ? siteManagerKeyRaw : String(siteManagerKeyRaw);
  const siteCount = parseInt(process.env.UNIFI_SITES || '0', 10);

  logger.info('UniFi handler - siteCount:', siteCount);
  logger.info('UniFi handler - unifiUrl:', unifiUrl);
  logger.info('UniFi handler - env vars:', {
    UNIFI_SITES: process.env.UNIFI_SITES,
    UNIFI_URL_SITE_1: process.env.UNIFI_URL_SITE_1,
    UNIFI_API_KEY_1: process.env.UNIFI_API_KEY_1 ? 'present' : 'missing',
  });

  const overview: UnifiOverviewData = {
    sites: {}
  };

  // Don't require a base URL anymore, check for site-specific URLs
  let hasAnyConfig = false;
  for (let i = 1; i <= siteCount; i++) {
    const siteUrlRaw = firstUnifi?.[`urlSite${i}`] || process.env[`UNIFI_URL_SITE_${i}`];
    const siteUrl = typeof siteUrlRaw === 'string' ? siteUrlRaw : String(siteUrlRaw);
    if (siteUrl) {
      hasAnyConfig = true;
      break;
    }
  }
  
  if (!hasAnyConfig && !unifiUrl) {
    logger.info('No UniFi configuration found');
    return NextResponse.json(overview);
  }

  // Build dynamic API keys object
  const apiKeys: { [key: string]: string | undefined } = {};
  for (let i = 1; i <= siteCount; i++) {
    const keyName = `apiKey${i}`;
    const apiKeyRaw = firstUnifi?.[keyName] || process.env[`UNIFI_API_KEY_${i}`];
    apiKeys[keyName] = typeof apiKeyRaw === 'string' ? apiKeyRaw : String(apiKeyRaw);
  }

  const api = new UnifiApi({
    url: unifiUrl,
    ...apiKeys,
    siteManagerApiKey: siteManagerKey,
  });

  // Fetch data for each configured site with timeout
  const sitePromises = [];
  for (let i = 1; i <= siteCount; i++) {
    const apiKey = apiKeys[`apiKey${i}`];
    const siteUrlRaw = firstUnifi?.[`urlSite${i}`] || process.env[`UNIFI_URL_SITE_${i}`] || unifiUrl;
    const siteUrl = typeof siteUrlRaw === 'string' ? siteUrlRaw : String(siteUrlRaw);
    const siteKey = `site${i}`;
    
    logger.info(`UniFi Site ${i}: apiKey=${apiKey ? 'present' : 'missing'}, url=${siteUrl}`);
    
    if (apiKey && siteUrl) {
      const sitePromise = (async () => {
        try {
        const sites = await api.getSites(apiKey, siteUrl);
        if (sites.length > 0) {
          const [siteData, systemInfo] = await Promise.allSettled([
            getUnifiSiteOverview(api, apiKey, sites[0].id, siteUrl),
            api.getSystemInfo(apiKey, siteUrl)
          ]);
          
          const siteDataResult = siteData.status === 'fulfilled' ? siteData.value : {};
          const systemInfoResult = systemInfo.status === 'fulfilled' ? systemInfo.value : { version: undefined, consoleVersion: undefined, deviceType: undefined };
          
          // Use configured site name, fallback to API name, then to default
          const configuredNameRaw = firstUnifi?.[`siteName${i}`] || process.env[`UNIFI_SITE_NAME_${i}`];
          const configuredName = typeof configuredNameRaw === 'string' ? configuredNameRaw : String(configuredNameRaw);
          return {
            siteKey,
            data: {
              available: true,
              name: configuredName || sites[0].name || `Site ${i}`,
              version: systemInfoResult.version,
              consoleVersion: systemInfoResult.consoleVersion,
              deviceType: systemInfoResult.deviceType,
              ...siteDataResult,
            }
          };
        } else {
          return {
            siteKey,
            data: {
              available: false,
              error: 'No sites found',
            }
          };
        }
        } catch (error) {
          logger.error(`Failed to fetch UniFi Site ${i} data:`, error);
          return {
            siteKey,
            data: {
              available: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            }
          };
        }
      })();
      
      sitePromises.push(sitePromise);
    }
  }
  
  // Wait for all sites to complete with a timeout
  const siteResults = await Promise.allSettled(sitePromises);
  
  // Process results
  siteResults.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      overview.sites[result.value.siteKey] = result.value.data;
    }
  });

  // Fetch Site Manager data only if enabled
  const siteManagerEnabled = firstUnifi?.siteManager === 'true' || process.env.UNIFI_SITE_MANAGER === 'true';
  if (siteManagerKey && siteManagerEnabled) {
    try {
      const [hostsResult, sitesResult] = await Promise.allSettled([
        api.getSiteManagerHosts(),
        api.getSiteManagerSites(),
      ]);
      
      const hosts = hostsResult.status === 'fulfilled' ? hostsResult.value : [];
      const sites = sitesResult.status === 'fulfilled' ? sitesResult.value : [];

      // Calculate total devices across all sites
      let totalDevices = 0;
      for (const site of sites) {
        if (site.devices_count) {
          totalDevices += site.devices_count;
        }
      }

      overview.siteManager = {
        available: true,
        hosts: hosts.map(host => ({
          id: host.id,
          name: host.name,
          status: host.status,
          version: host.version,
          sites_count: host.sites_count,
        })),
        totalSites: sites.length,
        totalDevices,
      };

      // Try to get ISP metrics for the first host
      if (hosts.length > 0) {
        try {
          const ispMetrics = await api.getSiteManagerISPMetrics(hosts[0].id);
          logger.info('Site Manager ISP Metrics:', ispMetrics);
        } catch (error) {
          logger.error('Failed to fetch ISP metrics:', error);
        }
      }
    } catch (error) {
      logger.error('Failed to fetch Site Manager data:', error);
      overview.siteManager = {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  return NextResponse.json(overview);
}

export const GET = withErrorHandler(handler);