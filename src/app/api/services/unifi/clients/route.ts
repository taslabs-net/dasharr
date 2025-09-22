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
    
    // Get active clients from the integration API
    const clients = await api.getClients(apiKey, sites[0].id, siteUrl);
    
    // Filter clients based on type if provided
    let filteredClients = clients;
    if (type === 'wired') {
      filteredClients = clients.filter(c => c.type === 'WIRED');
    } else if (type === 'wireless') {
      filteredClients = clients.filter(c => c.type === 'WIRELESS');
    }
    
    // Return more detailed client information with proper field mapping
    const detailedClients = filteredClients.map(client => {
      const clientData = client as unknown as Record<string, unknown>;
      
      return {
        id: client.id || client.mac,
        name: client.name || client.hostname || (clientData.display_name as string) || 'Unknown Device',
        hostname: client.hostname || (clientData.hostname as string),
        ip: client.ip || (clientData.ip as string),
        mac: client.mac || (clientData.mac as string),
        network: client.network || (clientData.network as string) || 'Default',
        type: client.type || (clientData.connection_type as string),
        signal: client.signal || (clientData.signal as number) || (clientData.rssi as number),
        rxBytes: client.rx_bytes || (clientData.rx_bytes as number) || 0,
        txBytes: client.tx_bytes || (clientData.tx_bytes as number) || 0
      };
    });
    
    return NextResponse.json({ 
      clients: detailedClients,
      total: detailedClients.length,
      note: 'This shows currently active/connected clients only. Historical or disconnected clients may not be included.'
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

export const GET = withErrorHandler(handler);