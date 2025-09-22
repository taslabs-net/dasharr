import { NextResponse } from 'next/server';
import { withInstanceSupport } from '@/lib/api/multi-instance-wrapper';
import { ServiceInstance } from '@/lib/config/multi-instance-types';
import { getJellyfinOverview } from '@/lib/api/jellyfin';
import { createInstanceLogger } from '@/lib/api/multi-instance-wrapper';

export const GET = withInstanceSupport(async (config: ServiceInstance, instanceId: string) => {
  const instanceLogger = createInstanceLogger(instanceId, 'jellyfin');
  const jellyfinUrl = config.url;
  const apiKey = config.apiKey;

  if (!jellyfinUrl || !apiKey) {
    return NextResponse.json(
      { error: 'Jellyfin configuration missing' },
      { status: 500 }
    );
  }

  try {
    const overview = await getJellyfinOverview(jellyfinUrl, apiKey);
    return NextResponse.json(overview);
  } catch (error) {
    instanceLogger.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Jellyfin data' },
      { status: 500 }
    );
  }
});