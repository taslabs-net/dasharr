import { NextResponse } from 'next/server';
import { PlexAPI } from '@/lib/api/plex';
import { ServiceInstance } from '@/lib/config/multi-instance-types';
import { withInstanceSupport } from '@/lib/api/multi-instance-wrapper';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = withInstanceSupport(async (config: ServiceInstance) => {
  try {
    if (!config.url || !config.token) {
      return NextResponse.json({ error: 'Plex not configured' }, { status: 503 });
    }

    const api = new PlexAPI({
      url: config.url,
      token: config.token,
    });

    const results: Record<string, {
      success: boolean;
      duration?: string;
      dataReceived?: boolean;
      sampleData?: string | null;
      error?: string;
    }> = {};

    // Test each endpoint individually
    const endpoints = [
      { name: 'serverIdentity', fn: () => api.getServerIdentity() },
      { name: 'serverCapabilities', fn: () => api.getServerCapabilities() },
      { name: 'libraries', fn: () => api.getLibraries() },
      { name: 'users', fn: () => api.getUsers() },
      { name: 'sessions', fn: () => api.getSessions() },
      { name: 'devices', fn: () => api.getDevices() },
      { name: 'activities', fn: () => api.getActivities() },
      { name: 'recentlyAdded', fn: () => api.getRecentlyAdded() },
    ];

    for (const endpoint of endpoints) {
      try {
        logger.debug(`Testing ${endpoint.name}...`);
        const startTime = Date.now();
        const result = await endpoint.fn();
        const duration = Date.now() - startTime;
        
        results[endpoint.name] = {
          success: true,
          duration: `${duration}ms`,
          dataReceived: !!result,
          sampleData: result ? JSON.stringify(result).substring(0, 200) + '...' : null,
        };
      } catch (error) {
        results[endpoint.name] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // Test raw endpoints
    const rawEndpoints = [
      '/identity',
      '/',
      '/library/sections',
      '/accounts',
      '/status/sessions',
      '/devices',
      '/activities',
      '/library/recentlyAdded',
    ];

    const rawResults: Record<string, {
      status?: number;
      statusText?: string;
      success: boolean;
      headers?: Record<string, string>;
      responseSize?: number;
      isJson?: boolean;
      error?: string;
    }> = {};
    
    for (const endpoint of rawEndpoints) {
      try {
        const url = `${config.url}${endpoint}?X-Plex-Token=${config.token}`;
        const response = await fetch(url, {
          headers: { 'Accept': 'application/json' },
        });
        
        rawResults[endpoint] = {
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
        };
        
        if (response.ok) {
          const text = await response.text();
          rawResults[endpoint].responseSize = text.length;
          rawResults[endpoint].isJson = text.startsWith('{') || text.startsWith('[');
        }
      } catch (error) {
        rawResults[endpoint] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return NextResponse.json({
      config: {
        url: config.url,
        hasToken: !!config.token,
      },
      apiResults: results,
      rawEndpointTests: rawResults,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    logger.error('Plex test error:', error);
    return NextResponse.json(
      { error: 'Failed to test Plex endpoints', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});