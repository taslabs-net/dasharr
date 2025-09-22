import { NextResponse, NextRequest } from 'next/server';
import { createJellyseerrClient } from '@/lib/api/jellyseerr';
import { withInstanceSupport } from '@/lib/api/multi-instance-wrapper';
import { logger } from '@/lib/logger';
import { ServiceInstance } from '@/lib/config/multi-instance-types';

export const GET = withInstanceSupport(async (config: ServiceInstance, instanceId: string, request: NextRequest) => {
  try {
    if (!config.url || !config.apiKey) {
      return NextResponse.json(
        { error: 'Jellyseerr not configured' },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const take = parseInt(searchParams.get('take') || '20', 10);

    const jellyseerr = createJellyseerrClient({
      url: config.url,
      apiKey: config.apiKey,
    });

    const results = await jellyseerr.getRequests(take);
    return NextResponse.json(results);
  } catch (error) {
    logger.error('Jellyseerr requests error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests from Jellyseerr' },
      { status: 500 }
    );
  }
});

export const POST = withInstanceSupport(async (config: ServiceInstance, instanceId: string, request: NextRequest) => {
  try {
    if (!config.url || !config.apiKey) {
      return NextResponse.json(
        { error: 'Jellyseerr not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    
    const jellyseerr = createJellyseerrClient({
      url: config.url,
      apiKey: config.apiKey,
    });

    const result = await jellyseerr.createRequest(body);
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Jellyseerr create request error:', error);
    return NextResponse.json(
      { error: 'Failed to create request in Jellyseerr' },
      { status: 500 }
    );
  }
});