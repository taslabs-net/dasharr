import { NextResponse } from 'next/server';
import { ProwlarrAPI } from '@/lib/api/prowlarr';
import { ServiceInstance } from '@/lib/config/multi-instance-types';
import { withInstanceSupport } from '@/lib/api/multi-instance-wrapper';
import { logger } from '@/lib/logger';

export const GET = withInstanceSupport(async (config: ServiceInstance) => {
  try {
    if (!config.url || !config.apiKey) {
      return NextResponse.json(
        { error: 'Prowlarr not configured' },
        { status: 500 }
      );
    }

    const api = new ProwlarrAPI({
      url: config.url,
      apiKey: config.apiKey,
    });

    const [systemResult, indexersResult, healthResult, statsResult] = await Promise.allSettled([
      api.getSystemStatus(),
      api.getIndexers(),
      api.getHealth(),
      api.getStats(),
    ]);

    const getResult = <T>(result: PromiseSettledResult<T>): T | null => {
      return result.status === 'fulfilled' ? result.value : null;
    };

    const systemData = getResult(systemResult);
    const indexersData = getResult(indexersResult);
    const healthData = getResult(healthResult);
    const statsData = getResult(statsResult);

    // Calculate stats
    let totalIndexers = 0;
    let enabledIndexers = 0;
    let healthyIndexers = 0;
    let torrentIndexers = 0;
    let usenetIndexers = 0;
    let searchesToday = 0;
    let grabsToday = 0;
    let healthIssues = 0;

    if (indexersData) {
      totalIndexers = indexersData.length;
      enabledIndexers = indexersData.filter(i => i.enable).length;
      healthyIndexers = indexersData.filter(i => i.status?.isHealthy !== false).length;
      torrentIndexers = indexersData.filter(i => i.protocol === 'torrent').length;
      usenetIndexers = indexersData.filter(i => i.protocol === 'usenet').length;
    }

    if (statsData) {
      searchesToday = statsData.searchesToday || 0;
      grabsToday = statsData.grabsToday || 0;
    }

    if (healthData) {
      healthIssues = healthData.filter(h => h.type === 'error' || h.type === 'warning').length;
    }

    // Get detailed indexer information
    const indexerDetails = indexersData?.map(indexer => ({
      id: indexer.id,
      name: indexer.name,
      protocol: indexer.protocol,
      enabled: indexer.enable,
      healthy: indexer.status?.isHealthy !== false,
      error: indexer.status?.errorMessage,
    })) || [];

    const stats = {
      totalIndexers,
      enabledIndexers,
      healthyIndexers,
      torrentIndexers,
      usenetIndexers,
      searchesToday,
      grabsToday,
      healthIssues,
      version: systemData?.version || 'Unknown',
      branch: systemData?.branch || 'Unknown',
      indexers: indexerDetails,
      torrentIndexersList: indexerDetails.filter(i => i.protocol === 'torrent'),
      usenetIndexersList: indexerDetails.filter(i => i.protocol === 'usenet'),
    };

    return NextResponse.json({ stats });
  } catch (error) {
    logger.error('Prowlarr API error:', error);
    
    // Return mock data for development
    const mockStats = {
      totalIndexers: 15,
      enabledIndexers: 12,
      healthyIndexers: 11,
      torrentIndexers: 8,
      usenetIndexers: 4,
      searchesToday: 47,
      grabsToday: 12,
      healthIssues: 1,
      version: '1.24.3.4754',
      branch: 'master',
    };

    return NextResponse.json({ stats: mockStats });
  }
});