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

    const historyData = await api.getFullHistory();
    return NextResponse.json(historyData);
  } catch (error) {
    logger.error('SABnzbd history API error:', error);
    
    // Return empty history data instead of error
    return NextResponse.json({
      history: {
        slots: [],
        noofslots: 0,
        total_size: '0',
        month_size: '0',
        week_size: '0',
        day_size: '0',
      }
    });
  }
});