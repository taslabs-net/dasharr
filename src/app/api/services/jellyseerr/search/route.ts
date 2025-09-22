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
    const query = searchParams.get('query');
    const type = searchParams.get('type') || 'multi'; // multi, movie, tv
    const page = parseInt(searchParams.get('page') || '1', 10);

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const jellyseerr = createJellyseerrClient({
      url: config.url,
      apiKey: config.apiKey,
    });

    let results;
    switch (type) {
      case 'movie':
        results = await jellyseerr.searchMovies(query, page);
        break;
      case 'tv':
        results = await jellyseerr.searchTv(query, page);
        break;
      default:
        results = await jellyseerr.searchMulti(query, page);
    }

    return NextResponse.json(results);
  } catch (error) {
    logger.error('Jellyseerr search error:', error);
    return NextResponse.json(
      { error: 'Failed to search Jellyseerr' },
      { status: 500 }
    );
  }
});