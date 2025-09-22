import { NextRequest, NextResponse } from 'next/server';
import { getServiceInstance } from '@/lib/config-db';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceType: string; instanceId: string }> }
) {
  // Public endpoint - no auth required for read access
  try {
    const { instanceId } = await params;
    const instance = await getServiceInstance(instanceId);
    
    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      );
    }
    
    // Return only non-sensitive information
    const publicInstance = {
      id: instance.id,
      type: instance.type,
      displayName: instance.displayName,
      url: instance.url,
      enabled: instance.enabled,
      order: instance.order,
      // Exclude sensitive fields like apiKey, token, username, password
    };
    
    return NextResponse.json({ instance: publicInstance });
  } catch (error) {
    logger.error('Failed to fetch instance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instance' },
      { status: 500 }
    );
  }
}