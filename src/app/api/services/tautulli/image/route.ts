import { NextResponse, NextRequest } from 'next/server';
import { withInstanceSupport } from '@/lib/api/multi-instance-wrapper';
import { logger } from '@/lib/logger';
import { ServiceInstance } from '@/lib/config/multi-instance-types';

export const GET = withInstanceSupport(async (config: ServiceInstance, instanceId: string, request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const img = searchParams.get('img');
    const ratingKey = searchParams.get('rating_key');
    const width = searchParams.get('width');
    const height = searchParams.get('height');

    if (!img) {
      return NextResponse.json({ error: 'Missing image parameter' }, { status: 400 });
    }

    if (!config.url || !config.apiKey) {
      return NextResponse.json({ error: 'Tautulli not configured' }, { status: 503 });
    }

    // Build the Tautulli pms_image_proxy URL
    const proxyUrl = new URL(`${config.url}/api/v2`);
    proxyUrl.searchParams.append('apikey', config.apiKey);
    proxyUrl.searchParams.append('cmd', 'pms_image_proxy');
    proxyUrl.searchParams.append('img', img);
    
    if (ratingKey) proxyUrl.searchParams.append('rating_key', ratingKey);
    if (width) proxyUrl.searchParams.append('width', width);
    if (height) proxyUrl.searchParams.append('height', height);

    // Fetch the image from Tautulli
    const response = await fetch(proxyUrl.toString());
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image from Tautulli' },
        { status: response.status }
      );
    }

    // Get the image data and content type
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await response.arrayBuffer();

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    logger.error('Tautulli image proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    );
  }
});