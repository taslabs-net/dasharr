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
    const type = searchParams.get('type') || 'trending'; // trending, popular, upcoming, movies, tv
    const page = parseInt(searchParams.get('page') || '1', 10);

    const jellyseerr = createJellyseerrClient({
      url: config.url,
      apiKey: config.apiKey,
    });

    let results;
    switch (type) {
      case 'movies':
        results = await jellyseerr.discoverMovies(page);
        break;
      case 'tv':
        results = await jellyseerr.discoverTv(page);
        break;
      case 'trending':
        results = await jellyseerr.discoverTrending();
        break;
      case 'popular':
        results = await jellyseerr.discoverPopular();
        break;
      case 'upcoming':
        results = await jellyseerr.discoverUpcoming();
        break;
      default:
        results = await jellyseerr.discoverTrending();
    }

    return NextResponse.json(results);
  } catch (error) {
    logger.error('Jellyseerr discover error:', error);
    return NextResponse.json(
      { error: 'Failed to discover media from Jellyseerr' },
      { status: 500 }
    );
  }
});