import { fetchWithTimeout, handleApiError } from './utils';
import { logger } from '@/lib/logger';

interface UnifiConfig {
  url?: string; // Legacy support
  siteManagerApiKey?: string;
  [key: string]: string | undefined; // Allow dynamic apiKeyN and urlSiteN properties
}

interface UnifiSite {
  id: string;
  name: string;
  description?: string;
}

interface UnifiDevice {
  id: string;
  name: string;
  type?: string;
  model: string;
  state: string; // ONLINE, OFFLINE, etc.
  status?: string;
  uptime?: number;
  cpu_usage?: number;
  memory_usage?: number;
  macAddress?: string;
  ipAddress?: string;
  features?: string[];
}

interface UnifiClient {
  id?: string;
  name?: string;
  hostname?: string;
  ip: string;
  mac: string;
  network: string;
  type: 'WIRED' | 'WIRELESS';
  signal?: number;
  rx_bytes: number;
  tx_bytes: number;
}

interface UnifiStats {
  total_clients: number;
  wired_clients: number;
  wireless_clients: number;
  wan_download: number;
  wan_upload: number;
  total_rx_bytes: number;
  total_tx_bytes: number;
}

interface SiteManagerHost {
  id: string;
  name: string;
  status: string;
  version: string;
  sites_count: number;
}

export class UnifiApi {
  private config: UnifiConfig;

  constructor(config: UnifiConfig) {
    this.config = config;
  }

  // Network Integration API endpoints (for individual sites)
  async getSites(apiKey: string, siteUrl?: string): Promise<UnifiSite[]> {
    const url = siteUrl || this.config.url;
    if (!url) throw new Error('UniFi URL not configured');
    
    const response = await fetchWithTimeout(
      `${url}/proxy/network/integration/v1/sites`,
      {
        headers: {
          'X-API-KEY': apiKey,
          'Accept': 'application/json',
        },
      } as RequestInit
    );

    if (!response.ok) {
      throw await handleApiError(response, 'UniFi');
    }

    const data = await response.json();
    return data.data || data; // Handle Site Manager API response format
  }

  async getDevices(apiKey: string, siteId: string, siteUrl?: string): Promise<UnifiDevice[]> {
    const url = siteUrl || this.config.url;
    if (!url) throw new Error('UniFi URL not configured');
    
    const response = await fetchWithTimeout(
      `${url}/proxy/network/integration/v1/sites/${siteId}/devices`,
      {
        headers: {
          'X-API-KEY': apiKey,
          'Accept': 'application/json',
        },
      } as RequestInit
    );

    if (!response.ok) {
      throw await handleApiError(response, 'UniFi');
    }

    const data = await response.json();
    return data.data || data; // Handle Site Manager API response format
  }

  // Get UniFi infrastructure clients (access points, switches, etc.)
  async getClients(apiKey: string, siteId: string, siteUrl?: string): Promise<UnifiClient[]> {
    const url = siteUrl || this.config.url;
    if (!url) throw new Error('UniFi URL not configured');
    
    const response = await fetchWithTimeout(
      `${url}/proxy/network/integration/v1/sites/${siteId}/clients`,
      {
        headers: {
          'X-API-KEY': apiKey,
          'Accept': 'application/json',
        },
      } as RequestInit
    );

    if (!response.ok) {
      throw await handleApiError(response, 'UniFi');
    }

    const data = await response.json();
    return data.data || data;
  }

  // Get actual connected user devices (laptops, phones, IoT devices)
  async getConnectedDevices(apiKey: string, siteId: string, siteUrl?: string): Promise<UnifiClient[]> {
    const url = siteUrl || this.config.url;
    if (!url) throw new Error('UniFi URL not configured');
    
    // Try the active clients endpoint for currently connected user devices
    try {
      const response = await fetchWithTimeout(
        `${url}/proxy/network/api/s/default/stat/sta`,
        {
          headers: {
            'X-API-KEY': apiKey,
            'Accept': 'application/json',
          },
        } as RequestInit
      );

      if (response.ok) {
        const data = await response.json();
        if (data.meta?.rc === 'ok' && data.data) {
          // Map the legacy API format to our UnifiClient interface
          return data.data.map((client: Record<string, unknown>) => ({
            id: client._id as string,
            name: (client.name as string) || (client.hostname as string) || (client.display_name as string) || 'Unknown Device',
            hostname: (client.hostname as string) || (client.name as string),
            ip: (client.ip as string) || (client.fixed_ip as string) || (client.use_fixedip as string) || 'N/A',
            mac: (client.mac as string) || (client.oui as string),
            network: (client.network as string) || (client.essid as string) || (client.vlan as string) || 'default',
            type: client.is_wired ? 'WIRED' : 'WIRELESS' as 'WIRED' | 'WIRELESS',
            signal: (client.signal as number) || (client.rssi as number),
            rx_bytes: (client.rx_bytes as number) || (client['rx_bytes-r'] as number) || (client.wired_rx_bytes as number) || (client['wired-rx_bytes'] as number) || (client.bytes_r as number) || 0,
            tx_bytes: (client.tx_bytes as number) || (client['tx_bytes-r'] as number) || (client.wired_tx_bytes as number) || (client['wired-tx_bytes'] as number) || (client.bytes_t as number) || 0,
          }));
        }
      }
    } catch {
      logger.debug('Active clients endpoint failed');
    }
    
    // Return empty array if no active clients endpoint available
    return [];
  }

  async getStats(apiKey: string, siteId: string, siteUrl?: string): Promise<UnifiStats> {
    const url = siteUrl || this.config.url;
    if (!url) throw new Error('UniFi URL not configured');
    
    // The integration API doesn't have a stats endpoint, so we'll return empty stats
    // Real stats will come from getHealthStats
    return {
      total_clients: 0,
      wired_clients: 0,
      wireless_clients: 0,
      wan_download: 0,
      wan_upload: 0,
      total_rx_bytes: 0,
      total_tx_bytes: 0,
    };
  }

  async getHealthStats(apiKey: string, siteUrl?: string): Promise<{ wan_download: number; wan_upload: number }> {
    const url = siteUrl || this.config.url;
    if (!url) throw new Error('UniFi URL not configured');
    
    try {
      const response = await fetchWithTimeout(
        `${url}/proxy/network/api/s/default/stat/health`,
        {
          headers: {
            'X-API-KEY': apiKey,
            'Accept': 'application/json',
          },
        } as RequestInit
      );

      if (response.ok) {
        const data = await response.json();
        if (data.meta?.rc === 'ok' && data.data) {
          const wanStats = data.data.find((subsystem: { subsystem: string; [key: string]: unknown }) => subsystem.subsystem === 'wan');
          if (wanStats) {
            return {
              wan_download: wanStats['rx_bytes-r'] || 0, // RX is download from WAN perspective
              wan_upload: wanStats['tx_bytes-r'] || 0,   // TX is upload from WAN perspective
            };
          }
        }
      }
    } catch (error) {
      logger.error('Failed to fetch UniFi health stats:', error);
    }

    return { wan_download: 0, wan_upload: 0 };
  }

  // Site Manager API endpoints
  async getSiteManagerHosts(): Promise<SiteManagerHost[]> {
    if (!this.config.siteManagerApiKey) {
      logger.error('Site Manager API key not configured');
      throw new Error('Site Manager API key not configured');
    }

    logger.debug('Fetching Site Manager hosts');
    
    const response = await fetchWithTimeout(
      'https://api.ui.com/v1/hosts',
      {
        headers: {
          'X-API-KEY': this.config.siteManagerApiKey,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw await handleApiError(response, 'UniFi Site Manager');
    }

    const data = await response.json();
    logger.debug(`Site Manager hosts response: ${data.data?.length || 0} hosts found`);
    return data.data || data; // Handle Site Manager API response format
  }

  async getSiteManagerSites(): Promise<Array<{
    id: string;
    name: string;
    devices_count?: number;
  }>> {
    if (!this.config.siteManagerApiKey) {
      throw new Error('Site Manager API key not configured');
    }

    const response = await fetchWithTimeout(
      'https://api.ui.com/v1/sites',
      {
        headers: {
          'X-API-KEY': this.config.siteManagerApiKey,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw await handleApiError(response, 'UniFi Site Manager');
    }

    const data = await response.json();
    return data.data || data; // Handle Site Manager API response format
  }

  async getSiteManagerISPMetrics(hostId: string): Promise<unknown> {
    if (!this.config.siteManagerApiKey) {
      throw new Error('Site Manager API key not configured');
    }

    const response = await fetchWithTimeout(
      `https://api.ui.com/v1/hosts/${hostId}/isp-metrics`,
      {
        headers: {
          'X-API-KEY': this.config.siteManagerApiKey,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw await handleApiError(response, 'UniFi Site Manager');
    }

    const data = await response.json();
    return data.data || data; // Handle Site Manager API response format
  }

  async getSiteManagerDevices(): Promise<Array<{
    id: string;
    name: string;
    model: string;
    type: string;
    site_id?: string;
    host_id?: string;
  }>> {
    if (!this.config.siteManagerApiKey) {
      throw new Error('Site Manager API key not configured');
    }

    const response = await fetchWithTimeout(
      'https://api.ui.com/v1/devices',
      {
        headers: {
          'X-API-KEY': this.config.siteManagerApiKey,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw await handleApiError(response, 'UniFi Site Manager');
    }

    const data = await response.json();
    return data.data || [];
  }

  // Get specific host by ID
  async getSiteManagerHostById(hostId: string): Promise<SiteManagerHost> {
    if (!this.config.siteManagerApiKey) {
      throw new Error('Site Manager API key not configured');
    }

    const response = await fetchWithTimeout(
      `https://api.ui.com/v1/hosts/${hostId}`,
      {
        headers: {
          'X-API-KEY': this.config.siteManagerApiKey,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw await handleApiError(response, 'UniFi Site Manager');
    }

    const data = await response.json();
    return data.data || data;
  }

  // Query ISP Metrics with parameters
  async querySiteManagerISPMetrics(type: string, sites: Array<{
    beginTimestamp: string;
    hostId: string;
    endTimestamp: string;
    siteId: string;
  }>): Promise<unknown> {
    if (!this.config.siteManagerApiKey) {
      throw new Error('Site Manager API key not configured');
    }

    const response = await fetchWithTimeout(
      `https://api.ui.com/ea/isp-metrics/${type}/query`,
      {
        method: 'POST',
        headers: {
          'X-API-KEY': this.config.siteManagerApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ sites }),
      }
    );

    if (!response.ok) {
      throw await handleApiError(response, 'UniFi Site Manager');
    }

    const data = await response.json();
    return data.data || data;
  }

  // List SD-WAN Configs
  async getSiteManagerSDWANConfigs(): Promise<Array<{
    id: string;
    name: string;
    status?: string;
  }>> {
    if (!this.config.siteManagerApiKey) {
      throw new Error('Site Manager API key not configured');
    }

    const response = await fetchWithTimeout(
      'https://api.ui.com/ea/sd-wan-configs',
      {
        headers: {
          'X-API-KEY': this.config.siteManagerApiKey,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw await handleApiError(response, 'UniFi Site Manager');
    }

    const data = await response.json();
    return data.data || [];
  }

  // Get SD-WAN Config by ID
  async getSiteManagerSDWANConfigById(configId: string): Promise<unknown> {
    if (!this.config.siteManagerApiKey) {
      throw new Error('Site Manager API key not configured');
    }

    const response = await fetchWithTimeout(
      `https://api.ui.com/ea/sd-wan-configs/${configId}`,
      {
        headers: {
          'X-API-KEY': this.config.siteManagerApiKey,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw await handleApiError(response, 'UniFi Site Manager');
    }

    const data = await response.json();
    return data.data || data;
  }

  // Get SD-WAN Config Status
  async getSiteManagerSDWANConfigStatus(configId: string): Promise<unknown> {
    if (!this.config.siteManagerApiKey) {
      throw new Error('Site Manager API key not configured');
    }

    const response = await fetchWithTimeout(
      `https://api.ui.com/ea/sd-wan-configs/${configId}/status`,
      {
        headers: {
          'X-API-KEY': this.config.siteManagerApiKey,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw await handleApiError(response, 'UniFi Site Manager');
    }

    const data = await response.json();
    return data.data || data;
  }

  // Get system information
  async getSystemInfo(apiKey: string, siteUrl?: string): Promise<{ version?: string; consoleVersion?: string; deviceType?: string }> {
    const url = siteUrl || this.config.url;
    if (!url) throw new Error('UniFi URL not configured');
    
    try {
      // Try to get system info from the controller sysinfo endpoint
      const response = await fetchWithTimeout(
        `${url}/proxy/network/api/s/default/stat/sysinfo`,
        {
          headers: {
            'X-API-KEY': apiKey,
            'Accept': 'application/json',
          },
        } as RequestInit
      );

      if (response.ok) {
        const data = await response.json();
        if (data.meta?.rc === 'ok' && data.data?.[0]) {
          const sysinfo = data.data[0];
          return { 
            version: sysinfo.version,
            consoleVersion: sysinfo.console_display_version,
            deviceType: sysinfo.ubnt_device_type
          };
        }
      }
    } catch (error) {
      // Log error but don't throw
      logger.error('Failed to fetch UniFi system info:', error);
    }

    // If sysinfo fails, we'll return empty versions
    return { version: undefined, consoleVersion: undefined, deviceType: undefined };
  }

  // Test connection methods
  async testConnection(apiKey: string, siteUrl?: string): Promise<boolean> {
    try {
      logger.debug(`Testing UniFi connection to ${siteUrl || this.config.url}`);
      await this.getSites(apiKey, siteUrl);
      logger.info(`UniFi connection successful to ${siteUrl || this.config.url}`);
      return true;
    } catch (error) {
      logger.error(`UniFi connection failed to ${siteUrl || this.config.url}:`, error);
      return false;
    }
  }

  async testSiteManagerConnection(): Promise<boolean> {
    try {
      logger.debug('Testing Site Manager connection');
      await this.getSiteManagerHosts();
      logger.info('Site Manager connection successful');
      return true;
    } catch (error) {
      logger.error('Site Manager connection failed:', error);
      return false;
    }
  }
}

// Helper to get overview data for a site
export async function getUnifiSiteOverview(api: UnifiApi, apiKey: string, siteId: string, siteUrl?: string) {
  const results = await Promise.allSettled([
    api.getDevices(apiKey, siteId, siteUrl),
    api.getConnectedDevices(apiKey, siteId, siteUrl),
    api.getHealthStats(apiKey, siteUrl),
  ]);

  const devices = results[0].status === 'fulfilled' ? results[0].value : [];
  const connectedDevices = results[1].status === 'fulfilled' ? results[1].value : [];
  const healthStats = results[2].status === 'fulfilled' ? results[2].value : { wan_download: 0, wan_upload: 0 };

  const activeDevices = devices.filter(d => d.state === 'ONLINE').length;
  const totalConnectedDevices = connectedDevices.length;
  const wiredConnectedDevices = connectedDevices.filter(c => c.type === 'WIRED').length;
  const wirelessConnectedDevices = connectedDevices.filter(c => c.type === 'WIRELESS').length;

  return {
    devices: {
      total: devices.length,
      active: activeDevices,
      offline: devices.length - activeDevices,
    },
    connectedDevices: {
      total: totalConnectedDevices,
      wired: wiredConnectedDevices,
      wireless: wirelessConnectedDevices,
    },
    stats: {
      total_clients: totalConnectedDevices,
      wired_clients: wiredConnectedDevices,
      wireless_clients: wirelessConnectedDevices,
      wan_download: healthStats.wan_download,
      wan_upload: healthStats.wan_upload,
      total_rx_bytes: 0,
      total_tx_bytes: 0,
    },
  };
}