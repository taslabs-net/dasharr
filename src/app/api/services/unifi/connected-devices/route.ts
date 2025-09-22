import { NextRequest, NextResponse } from 'next/server';
import { getServiceInstancesByType } from '@/lib/config-db';
import { UnifiApi } from '@/lib/api/unifi';
import { withErrorHandler } from '@/lib/api/utils';

async function handler(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const siteIndex = parseInt(searchParams.get('site') || '1', 10);
  const type = searchParams.get('type'); // 'wired' or 'wireless'
  
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
    
    // Get connected user devices from the active clients API
    const connectedDevices = await api.getConnectedDevices(apiKey, sites[0].id, siteUrl);
    
    // Filter devices based on type if provided
    let filteredDevices = connectedDevices;
    if (type === 'wired') {
      filteredDevices = connectedDevices.filter(d => d.type === 'WIRED');
    } else if (type === 'wireless') {
      filteredDevices = connectedDevices.filter(d => d.type === 'WIRELESS');
    }
    
    // Return detailed connected device information
    const detailedDevices = filteredDevices.map(device => ({
        id: device.id || device.mac,
        name: device.name || device.hostname || 'Unknown Device',
        hostname: device.hostname,
        ip: device.ip,
        mac: device.mac,
        network: device.network || 'Default',
        type: device.type,
        signal: device.signal,
        rxBytes: device.rx_bytes || 0,
        txBytes: device.tx_bytes || 0
      }));
    
    return NextResponse.json({ 
      devices: detailedDevices,
      total: detailedDevices.length,
      note: 'Currently active/connected user devices only. This shows laptops, phones, IoT devices, etc. connected to your network.'
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch connected devices' },
      { status: 500 }
    );
  }
}

export const GET = withErrorHandler(handler);