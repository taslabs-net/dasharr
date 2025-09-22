import { NextResponse } from 'next/server';
import { getServiceInstancesByType } from '@/lib/config-db';
import { UnifiApi } from '@/lib/api/unifi';
import { withErrorHandler } from '@/lib/api/utils';
import { logger } from '@/lib/logger';

async function handler(): Promise<NextResponse> {
  const unifiInstances = getServiceInstancesByType('unifi');
  const firstUnifi = Object.values(unifiInstances)[0];
  const unifiUrlRaw = firstUnifi?.url || process.env.UNIFI_URL;
  const unifiUrl = typeof unifiUrlRaw === 'string' ? unifiUrlRaw : String(unifiUrlRaw);
  const apiKey1Raw = firstUnifi?.apiKey1 || process.env.UNIFI_API_KEY_1;
  const apiKey1 = typeof apiKey1Raw === 'string' ? apiKey1Raw : String(apiKey1Raw);
  const apiKey2Raw = firstUnifi?.apiKey2 || process.env.UNIFI_API_KEY_2;
  const apiKey2 = typeof apiKey2Raw === 'string' ? apiKey2Raw : String(apiKey2Raw);
  const siteManagerKeyRaw = firstUnifi?.siteManagerApiKey || process.env.UNIFI_SITE_MANAGER_API_KEY;
  const siteManagerKey = typeof siteManagerKeyRaw === 'string' ? siteManagerKeyRaw : String(siteManagerKeyRaw);

  interface TestResults {
    configuration: {
      url: string;
      apiKey1: string;
      apiKey2: string;
      siteManagerKey: string;
    };
    tests: {
      [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    };
  }

  const testResults: TestResults = {
    configuration: {
      url: unifiUrl ? '✓ Configured' : '✗ Not configured',
      apiKey1: apiKey1 ? '✓ Configured' : '✗ Not configured',
      apiKey2: apiKey2 ? '✓ Configured' : '✗ Not configured',
      siteManagerKey: siteManagerKey ? '✓ Configured' : '✗ Not configured',
    },
    tests: {},
  };

  if (!unifiUrl) {
    return NextResponse.json({
      error: 'UniFi URL not configured',
      ...testResults,
    });
  }

  const api = new UnifiApi({
    url: unifiUrl,
    apiKey1,
    apiKey2,
    siteManagerApiKey: siteManagerKey,
  });

  // Test Site 1
  if (apiKey1) {
    try {
      const sites = await api.getSites(apiKey1);
      testResults.tests.site1 = {
        connection: '✓ Connected',
        sites: sites,
      };

      // Get detailed data for first site
      if (sites.length > 0) {
        const siteId = sites[0].id;
        const [devices, clients, stats] = await Promise.all([
          api.getDevices(apiKey1, siteId).catch(e => ({ error: e.message })),
          api.getClients(apiKey1, siteId).catch(e => ({ error: e.message })),
          api.getStats(apiKey1, siteId).catch(e => ({ error: e.message })),
        ]);

        testResults.tests.site1.sampleData = {
          devices: Array.isArray(devices) ? devices.slice(0, 2) : devices,
          clients: Array.isArray(clients) ? clients.slice(0, 2) : clients,
          stats,
        };
      }
    } catch (error) {
      testResults.tests.site1 = {
        connection: '✗ Failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Test Site Manager API
  if (siteManagerKey) {
    try {
      logger.info('Testing Site Manager API...');
      
      // Test hosts endpoint
      const hosts = await api.getSiteManagerHosts();
      testResults.tests.siteManager = {
        connection: '✓ Connected',
        hosts: hosts,
      };

      // Test sites endpoint
      try {
        const sites = await api.getSiteManagerSites();
        testResults.tests.siteManager.sites = sites;
        testResults.tests.siteManager.totalSites = sites.length;
      } catch (error) {
        testResults.tests.siteManager.sitesError = error instanceof Error ? error.message : 'Failed to fetch sites';
      }

      // Test ISP metrics for first host
      if (hosts.length > 0) {
        try {
          const ispMetrics = await api.getSiteManagerISPMetrics(hosts[0].id);
          testResults.tests.siteManager.ispMetrics = ispMetrics;
        } catch (error) {
          testResults.tests.siteManager.ispMetricsError = error instanceof Error ? error.message : 'Failed to fetch ISP metrics';
        }
      }

      // Test additional endpoints
      try {
        // Test devices endpoint
        const devicesResponse = await fetch('https://api.ui.com/v1/devices', {
          headers: {
            'X-API-KEY': siteManagerKey,
            'Accept': 'application/json',
          },
        });
        if (devicesResponse.ok) {
          const devices = await devicesResponse.json();
          testResults.tests.siteManager.devices = devices.slice(0, 5); // First 5 devices
          testResults.tests.siteManager.totalDevices = devices.length;
        }
      } catch {
        testResults.tests.siteManager.devicesError = 'Failed to fetch devices';
      }

    } catch (error) {
      logger.error('Site Manager API test failed:', error);
      testResults.tests.siteManager = {
        connection: '✗ Failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  return NextResponse.json(testResults);
}

export const GET = withErrorHandler(handler);