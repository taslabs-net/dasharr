import { NextRequest, NextResponse } from 'next/server';
import { getServiceInstancesByType } from '@/lib/config-db';
import { UnifiApi } from '@/lib/api/unifi';
import { withErrorHandler } from '@/lib/api/utils';

async function handler(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const siteIndex = parseInt(searchParams.get('site') || '1', 10);
  const status = searchParams.get('status'); // 'online' or 'offline'
  
  const unifiInstances = getServiceInstancesByType('unifi');
  const firstUnifi = Object.values(unifiInstances)[0];
  
  const apiKeyRaw = firstUnifi?.[`apiKey${siteIndex}`] || process.env[`UNIFI_API_KEY_${siteIndex}`];
  const apiKey = typeof apiKeyRaw === 'string' ? apiKeyRaw : String(apiKeyRaw);
  const siteUrlRaw = firstUnifi?.[`urlSite${siteIndex}`] || process.env[`UNIFI_URL_SITE_${siteIndex}`];
  const siteUrl = typeof siteUrlRaw === 'string' ? siteUrlRaw : String(siteUrlRaw);
  
  if (!apiKey || !siteUrl) {
    return NextResponse.json({ error: 'UniFi not configured for this site' }, { status: 400 });
  }
  
  const api = new UnifiApi({ url: siteUrl });
  
  try {
    const sites = await api.getSites(apiKey, siteUrl);
    if (sites.length === 0) {
      return NextResponse.json({ error: 'No sites found' }, { status: 404 });
    }
    
    const devices = await api.getDevices(apiKey, sites[0].id, siteUrl);
    
    // Filter devices based on status if provided
    let filteredDevices = devices;
    if (status === 'online') {
      filteredDevices = devices.filter(d => d.state === 'ONLINE');
    } else if (status === 'offline') {
      filteredDevices = devices.filter(d => d.state !== 'ONLINE');
    }
    
    // Return more detailed device information with proper field mapping
    const detailedDevices = filteredDevices.map(device => {
      const deviceData = device as unknown as Record<string, unknown>;
      const systemStats = deviceData.system_stats as Record<string, unknown> | undefined;
      
      return {
        id: device.id,
        name: device.name || device.model || 'Unknown Device',
        model: device.model,
        type: device.type,
        state: device.state,
        status: device.status,
        ipAddress: (deviceData.ipAddress as string) || (deviceData.ip as string) || 'N/A',
        macAddress: (deviceData.macAddress as string) || (deviceData.mac as string) || 'N/A',
        uptime: undefined, // Uptime not available in Integration API
        cpu: (systemStats?.cpu as number) || (deviceData.cpu as number),
        memory: (systemStats?.mem as number) || (systemStats?.memory as number) || (deviceData.mem as number),
        features: device.features || []
      };
    });
    
    return NextResponse.json({ 
      devices: detailedDevices,
      total: detailedDevices.length 
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch devices' },
      { status: 500 }
    );
  }
}

export const GET = withErrorHandler(handler);