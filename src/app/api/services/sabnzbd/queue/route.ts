import { NextResponse } from 'next/server';
import { SABnzbdAPI } from '@/lib/api/sabnzbd';
import { ServiceInstance } from '@/lib/config/multi-instance-types';
import { withInstanceSupport } from '@/lib/api/multi-instance-wrapper';
import { logger } from '@/lib/logger';

export const GET = withInstanceSupport(async (config: ServiceInstance) => {
  try {
    if (!config.url || !config.apiKey) {
      return NextResponse.json(
        { error: 'SABnzbd not configured' },
        { status: 503 }
      );
    }

    const api = new SABnzbdAPI({
      url: config.url,
      apiKey: config.apiKey,
    });

    const queueData = await api.getFullQueue();
    logger.debug('SABnzbd Full Queue Response:', JSON.stringify(queueData, null, 2));
    return NextResponse.json(queueData);
  } catch (error) {
    logger.error('SABnzbd queue API error:', error);
    
    // Return empty queue data instead of error
    return NextResponse.json({
      queue: {
        slots: [],
        speed: '0',
        sizeleft: '0',
        mb: 0,
        mbleft: 0,
        eta: 'unknown',
        status: 'Idle',
        paused: false,
        noofslots: 0,
      }
    });
  }
});