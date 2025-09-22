import { NextRequest, NextResponse } from 'next/server';
import { withInstanceSupportDynamic } from '@/lib/api/multi-instance-wrapper';
import https from 'https';
import { logger } from '@/lib/logger';

const agent = new https.Agent({
  rejectUnauthorized: false
});

type Params = {
  params: Promise<{ itemId: string }>;
};

export const GET = withInstanceSupportDynamic(async (config, instanceId, request: NextRequest, props: Params) => {
  const params = await props.params;
  
  try {
    if (!config.url || !config.apiKey) {
      return new NextResponse('Jellyfin not configured', { status: 503 });
    }
    
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    
    const imageUrl = `${config.url}/Items/${params.itemId}/Images/Primary${tag ? `?tag=${tag}` : ''}`;
    
    const response = await fetch(imageUrl, {
      headers: {
        'X-Emby-Token': config.apiKey,
      },
      // @ts-expect-error - agent option exists but not in types
      agent: imageUrl.startsWith('https') ? agent : undefined,
    });
    
    if (!response.ok) {
      return new NextResponse('Image not found', { status: 404 });
    }
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await response.arrayBuffer();
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    logger.error('Failed to fetch Jellyfin image:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
});