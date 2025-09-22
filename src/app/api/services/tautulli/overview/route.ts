/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { ServiceInstance } from '@/lib/config/multi-instance-types';
import { createTautulliClient } from '@/lib/api/tautulli';
import { withInstanceSupport } from '@/lib/api/multi-instance-wrapper';
import { logger } from '@/lib/logger';

export const GET = withInstanceSupport(async (config: ServiceInstance, instanceId: string) => {
  try {
    if (!config.url || !config.apiKey) {
      return NextResponse.json(
        { error: 'Tautulli not configured' },
        { status: 503 }
      );
    }

    const tautulli = createTautulliClient({
      url: config.url,
      apiKey: config.apiKey,
    });

    // Fetch all available data in parallel
    const results = await Promise.allSettled([
      tautulli.getActivity(),
      tautulli.getHomeStats(30, 'plays', 10),
      tautulli.getLibraries(),
      tautulli.getHistory(50),
      tautulli.getRecentlyAdded(25),
      tautulli.getServerInfo(),
      tautulli.getServerIdentity(),
      tautulli.getUsers(),
      tautulli.getPlaysByDate(30),
      tautulli.getPlaysByDayOfWeek(30),
      tautulli.getPlaysByHourOfDay(30),
      tautulli.getPlaysByStreamType(30),
      tautulli.getPlaysPerMonth(12),
      tautulli.getActivitySummary().catch(() => null), // This endpoint seems to fail
      tautulli.getDevices().catch(() => null), // This endpoint seems to fail
      tautulli.getTautulliInfo(),
    ]);

    // Process results and handle errors gracefully
    const getResult = (result: PromiseSettledResult<unknown>) => 
      result.status === 'fulfilled' ? result.value : null;

    // Get data with defaults
    const activityData = getResult(results[0]) as any || { stream_count: 0, sessions: [] };
    const homeStatsData = getResult(results[1]) as any[] || [];
    const librariesData = getResult(results[2]) as any[] || [];
    const historyData = getResult(results[3]) as any || { data: [] };
    const recentlyAddedData = getResult(results[4]) as any || { recently_added: [] };
    const serverInfoData = getResult(results[5]) as any || {};
    const serverIdentityData = getResult(results[6]) as any || {};
    const usersData = getResult(results[7]) as any[] || [];
    const playsByDateData = getResult(results[8]);
    const playsByDayOfWeekData = getResult(results[9]);
    const playsByHourOfDayData = getResult(results[10]);
    const playsByStreamTypeData = getResult(results[11]);
    const playsPerMonthData = getResult(results[12]);
    // results[13] is activitySummary (unused)
    const devicesData = getResult(results[14]);
    const tautulliInfoData = getResult(results[15]);

    // Calculate statistics
    const stats = {
      activeStreams: parseInt(activityData.stream_count) || 0,
      totalBandwidth: activityData.total_bandwidth || 0,
      libraryCount: librariesData.length,
      userCount: usersData.length,
      totalPlays: historyData.recordsTotal || 0,
      transcodeStreams: activityData.stream_count_transcode || 0,
      directPlayStreams: activityData.stream_count_direct_play || 0,
      directStreams: activityData.stream_count_direct_stream || 0,
    };

    // Process home stats by category
    const homeStatsProcessed = homeStatsData.reduce((acc: any, statGroup: any) => {
      if (statGroup && statGroup.stat_id) {
        acc[statGroup.stat_id] = statGroup.rows || [];
      }
      return acc;
    }, {});

    // Format recently added with proxy URLs
    const formatRecentlyAdded = (items: any[]) => {
      return items.map((item: any) => ({
        ...item,
        thumb: item.thumb ? `/api/services/tautulli/image?instance=${instanceId}&img=${encodeURIComponent(item.thumb)}&rating_key=${item.rating_key}` : null,
        art: item.art ? `/api/services/tautulli/image?instance=${instanceId}&img=${encodeURIComponent(item.art)}&rating_key=${item.rating_key}` : null,
      }));
    };

    // Format history items with proxy URLs
    const formatHistory = (items: any[]) => {
      return items.map((item: any) => ({
        ...item,
        thumb: item.thumb ? `/api/services/tautulli/image?instance=${instanceId}&img=${encodeURIComponent(item.thumb)}&rating_key=${item.rating_key}` : null,
        art: item.art ? `/api/services/tautulli/image?instance=${instanceId}&img=${encodeURIComponent(item.art)}&rating_key=${item.rating_key}` : null,
      }));
    };

    return NextResponse.json({
      system: {
        serverInfo: serverInfoData,
        serverIdentity: serverIdentityData,
        tautulliInfo: tautulliInfoData,
      },
      stats,
      activity: {
        current: activityData.sessions || [],
        recentHistory: formatHistory(historyData.data || []),
        recentlyAdded: formatRecentlyAdded(recentlyAddedData.recently_added || recentlyAddedData.data || []),
      },
      libraries: librariesData.map((lib: any) => ({
        ...lib,
        thumb: lib.thumb ? `/api/services/tautulli/image?instance=${instanceId}&img=${encodeURIComponent(lib.thumb)}` : null,
        art: lib.art ? `/api/services/tautulli/image?instance=${instanceId}&img=${encodeURIComponent(lib.art)}` : null,
      })),
      users: usersData.map((user: any) => ({
        ...user,
        thumb: user.thumb ? `/api/services/tautulli/image?instance=${instanceId}&img=${encodeURIComponent(user.thumb)}` : null,
      })),
      homeStats: homeStatsProcessed,
      analytics: {
        playsByDate: playsByDateData,
        playsByDayOfWeek: playsByDayOfWeekData,
        playsByHourOfDay: playsByHourOfDayData,
        playsByStreamType: playsByStreamTypeData,
        playsPerMonth: playsPerMonthData,
      },
      configuration: {
        devices: devicesData || [],
      },
    });
  } catch (error) {
    logger.error('Tautulli API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Tautulli data' },
      { status: 500 }
    );
  }
});