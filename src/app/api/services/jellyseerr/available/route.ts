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
    const tmdbId = searchParams.get('tmdbId');
    const mediaType = searchParams.get('type'); // movie or tv

    if (!tmdbId || !mediaType) {
      return NextResponse.json(
        { error: 'tmdbId and type parameters are required' },
        { status: 400 }
      );
    }

    const jellyseerr = createJellyseerrClient({
      url: config.url,
      apiKey: config.apiKey,
    });

    const result = mediaType === 'movie'
      ? await jellyseerr.checkMovieAvailability(parseInt(tmdbId, 10))
      : await jellyseerr.checkTvAvailability(parseInt(tmdbId, 10));

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Jellyseerr availability check error:', error);
    return NextResponse.json(
      { error: 'Failed to check media availability' },
      { status: 500 }
    );
  }
});