import { NextResponse } from 'next/server';
import { withInstanceSupport } from '@/lib/api/multi-instance-wrapper';
import { ServiceInstance } from '@/lib/config/multi-instance-types';

export const dynamic = 'force-dynamic';

export const GET = withInstanceSupport(async (config: ServiceInstance) => {
  try {
    if (!config.url || !config.token) {
      return NextResponse.json({ error: 'Plex not configured' }, { status: 503 });
    }

    // Test comprehensive list of Plex API endpoints based on PlexAPI documentation
    const endpoints = [
      // Server
      { path: '/', name: 'Server Capabilities' },
      { path: '/identity', name: 'Server Identity' },
      { path: '/prefs', name: 'Server Preferences' },
      { path: '/servers', name: 'Available Servers' },
      
      // Libraries
      { path: '/library/sections', name: 'All Libraries' },
      { path: '/library/sections/2/all', name: 'Movies Library Items' },
      { path: '/library/sections/1/all', name: 'TV Shows Library Items' },
      { path: '/library/recentlyAdded', name: 'Recently Added' },
      { path: '/library/onDeck', name: 'On Deck' },
      { path: '/library/metadata/popular', name: 'Popular Items' },
      
      // Statistics
      { path: '/statistics/media', name: 'Media Statistics' },
      { path: '/statistics/resources', name: 'Resource Statistics' },
      { path: '/statistics/bandwidth', name: 'Bandwidth Statistics' },
      
      // Sessions & Activity
      { path: '/status/sessions', name: 'Active Sessions' },
      { path: '/status/sessions/history/all', name: 'Session History' },
      { path: '/activities', name: 'Server Activities' },
      { path: '/transcode/sessions', name: 'Transcode Sessions' },
      
      // Users
      { path: '/accounts', name: 'User Accounts' },
      { path: '/users', name: 'Users List' },
      { path: '/friends', name: 'Friends' },
      
      // Devices
      { path: '/devices', name: 'Registered Devices' },
      { path: '/clients', name: 'Connected Clients' },
      
      // Playlists
      { path: '/playlists', name: 'All Playlists' },
      { path: '/playlists/all', name: 'Playlists Details' },
      
      // System
      { path: '/system', name: 'System Information' },
      { path: '/system/agents', name: 'Metadata Agents' },
      { path: '/system/scanner', name: 'Library Scanners' },
      
      // Hubs
      { path: '/hubs', name: 'Global Hubs' },
      { path: '/library/sections/2/hubs', name: 'Movies Hubs' },
      { path: '/library/sections/1/hubs', name: 'TV Shows Hubs' },
      
      // Search
      { path: '/hubs/search?query=test', name: 'Search Test' },
    ];

    const results: Record<string, {
      name: string;
      status?: number;
      success: boolean;
      hasData?: boolean;
      sampleData?: string | null;
      error?: string;
    }> = {};
    
    for (const endpoint of endpoints) {
      try {
        const url = `${config.url}${endpoint.path}`;
        const response = await fetch(url, {
          headers: { 
            'X-Plex-Token': config.token,
            'Accept': 'application/json',
          },
        });
        
        let data = null;
        let error = null;
        
        if (response.ok) {
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch {
            data = { rawText: text.substring(0, 100) + '...' };
          }
        } else {
          error = `${response.status} ${response.statusText}`;
        }
        
        results[endpoint.path] = {
          name: endpoint.name,
          status: response.status,
          success: response.ok,
          hasData: !!data,
          sampleData: data ? JSON.stringify(data).substring(0, 200) + '...' : undefined,
          error: error || undefined,
        };
      } catch (error) {
        results[endpoint.path] = {
          name: endpoint.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return NextResponse.json({
      plexUrl: config.url,
      timestamp: new Date().toISOString(),
      endpointResults: results,
    }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to test endpoints', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});