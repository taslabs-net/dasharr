import { NextRequest, NextResponse } from 'next/server';
import { createJellyseerrClient } from '@/lib/api/jellyseerr';
import { withInstanceSupportDynamic } from '@/lib/api/multi-instance-wrapper';
import { logger } from '@/lib/logger';

export const PUT = withInstanceSupportDynamic(async (
  config,
  instanceId,
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) => {
  try {
    if (!config.url || !config.apiKey) {
      return NextResponse.json(
        { error: 'Jellyseerr not configured' },
        { status: 503 }
      );
    }

    const { requestId: requestIdString } = await params;
    const requestId = parseInt(requestIdString, 10);
    const body = await request.json();
    
    const jellyseerr = createJellyseerrClient({
      url: config.url,
      apiKey: config.apiKey,
    });

    const result = await jellyseerr.updateRequest(requestId, body);
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Jellyseerr update request error:', error);
    return NextResponse.json(
      { error: 'Failed to update request in Jellyseerr' },
      { status: 500 }
    );
  }
});

export const DELETE = withInstanceSupportDynamic(async (
  config,
  instanceId,
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) => {
  try {
    if (!config.url || !config.apiKey) {
      return NextResponse.json(
        { error: 'Jellyseerr not configured' },
        { status: 503 }
      );
    }

    const { requestId: requestIdString } = await params;
    const requestId = parseInt(requestIdString, 10);
    
    const jellyseerr = createJellyseerrClient({
      url: config.url,
      apiKey: config.apiKey,
    });

    await jellyseerr.deleteRequest(requestId);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Jellyseerr delete request error:', error);
    return NextResponse.json(
      { error: 'Failed to delete request in Jellyseerr' },
      { status: 500 }
    );
  }
});