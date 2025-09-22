/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { ServiceInstance } from '@/lib/config/multi-instance-types';
import { createSonarrClient } from '@/lib/api/sonarr';
import { withInstanceSupport, createInstanceLogger } from '@/lib/api/multi-instance-wrapper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withInstanceSupport(async (config: ServiceInstance, instanceId: string) => {
  const instanceLogger = createInstanceLogger(instanceId, 'sonarr');
  try {
    if (!config.url || !config.apiKey) {
      return NextResponse.json(
        { error: 'Sonarr not configured' },
        { status: 503 }
      );
    }

    const sonarr = createSonarrClient({
      url: config.url,
      apiKey: config.apiKey,
    });

    // Fetch all available data in parallel
    const [
      systemStatus,
      health,
      series,
      queue,
      queueStatus,
      recentHistory,
      calendar,
      wantedMissing,
      commands,
      tasks,
      indexers,
      downloadClients,
      rootFolders,
      qualityProfiles,
      updates,
      backups,
    ] = await Promise.allSettled([
      sonarr.getSystemStatus(),
      sonarr.getHealth(),
      sonarr.getSeries(),
      sonarr.getQueue(),
      sonarr.getQueueStatus(),
      sonarr.getHistory(50, 1),
      sonarr.getCalendar(
        new Date(),
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
      ),
      sonarr.getWantedMissing(50, 1),
      sonarr.getCommands(),
      sonarr.getTasks(),
      sonarr.getIndexers(),
      sonarr.getDownloadClients(),
      sonarr.getRootFolders(),
      sonarr.getQualityProfiles(),
      sonarr.getUpdates(),
      sonarr.getBackups(),
    ]);

    // Process results and handle errors gracefully
    const getResult = (result: PromiseSettledResult<unknown>) => 
      result.status === 'fulfilled' ? result.value : null;

    // Calculate statistics
    const seriesData = (getResult(series) as any[]) || [];
    const queueData = (getResult(queue) as { records: any[] }) || { records: [] };
    const historyData = (getResult(recentHistory) as { records: any[] }) || { records: [] };
    const calendarData = (getResult(calendar) as any[]) || [];
    const wantedData = (getResult(wantedMissing) as { records: any[] }) || { records: [] };
    
    instanceLogger.info(`Found ${seriesData.length} series and ${calendarData.length} calendar entries`);
    
    // Log first calendar entry to debug
    if (calendarData.length > 0) {
      instanceLogger.debug('First calendar entry:', JSON.stringify({
        title: calendarData[0].title,
        seriesId: calendarData[0].seriesId,
        hasSeries: !!calendarData[0].series
      }));
    }
    
    // Log series IDs for debugging
    const seriesIds = seriesData.map(s => s.id);
    instanceLogger.debug('Available series IDs:', seriesIds.slice(0, 10));

    // Calculate episode statistics
    let totalEpisodes = 0;
    let downloadedEpisodes = 0;
    let missingEpisodes = 0;

    seriesData.forEach((show) => {
      if (show.statistics) {
        totalEpisodes += show.statistics.totalEpisodeCount || 0;
        downloadedEpisodes += show.statistics.episodeFileCount || 0;
        if (show.monitored) {
          missingEpisodes += (show.statistics.totalEpisodeCount || 0) - (show.statistics.episodeFileCount || 0);
        }
      }
    });

    const stats = {
      totalShows: seriesData.length,
      monitoredShows: seriesData.filter((s) => s.monitored).length,
      totalEpisodes,
      downloadedEpisodes,
      missingEpisodes: Math.max(0, missingEpisodes),
      queuedItems: queueData.records?.length || 0,
      upcomingEpisodes: calendarData.length,
      totalFileSize: seriesData.reduce((sum, s) => sum + (s.statistics?.sizeOnDisk || 0), 0),
    };

    const response = NextResponse.json({
      system: {
        status: getResult(systemStatus),
        health: getResult(health),
        updates: getResult(updates),
      },
      stats,
      activity: {
        queue: queueData.records || [],
        queueStatus: getResult(queueStatus),
        recentHistory: (historyData.records || []).map((item: any) => {
          // Find the series data for this history item
          const series = seriesData.find((s: any) => s.id === item.seriesId);
          return {
            ...item,
            series: series ? {
              id: series.id,
              title: series.title,
              images: series.images?.map((img: any) => ({
                ...img,
                url: img.url ? (img.url.startsWith('http') ? img.url : `${config.url}${img.url}`) : null
              }))
            } : null
          };
        }),
        calendar: calendarData,
        wantedMissing: wantedData.records || [],
        commands: getResult(commands),
        tasks: getResult(tasks),
      },
      configuration: {
        indexers: getResult(indexers),
        downloadClients: getResult(downloadClients),
        rootFolders: getResult(rootFolders),
        qualityProfiles: getResult(qualityProfiles),
      },
      maintenance: {
        backups: getResult(backups),
      },
      series: {
        recent: seriesData
          .sort((a, b) => new Date(b.added).getTime() - new Date(a.added).getTime())
          .slice(0, 10)
          .map((show) => ({
            ...show,
            images: show.images?.map((img: any) => ({
              ...img,
              url: img.url ? (img.url.startsWith('http') ? img.url : `${config.url}${img.url}`) : null
            }))
          })),
        upcoming: calendarData.slice(0, 10)
          .map((episode: any) => {
            // Always prefer series data from our seriesData array since it has processed URLs
            const seriesInfo = seriesData.find((s: any) => s.id === episode.seriesId) || episode.series;
            
            // Debug logging
            if (!seriesInfo && episode.seriesId) {
              instanceLogger.warn(`Series not found for episode ${episode.title} with seriesId ${episode.seriesId}`);
              instanceLogger.debug('Episode has series?', !!episode.series);
              instanceLogger.debug('Series lookup result:', !!seriesData.find((s: any) => s.id === episode.seriesId));
            }
            
            return {
              ...episode,
              series: seriesInfo ? {
                id: seriesInfo.id,
                title: seriesInfo.title,
                images: seriesInfo.images?.map((img: any) => ({
                  ...img,
                  url: img.url ? (img.url.startsWith('http') ? img.url : `${config.url}${img.url}`) : null
                }))
              } : null
            };
          }),
        active: seriesData
          .filter((s) => s.monitored && s.status === 'continuing')
          .slice(0, 10)
          .map((show) => ({
            ...show,
            images: show.images?.map((img: any) => ({
              ...img,
              url: img.url ? (img.url.startsWith('http') ? img.url : `${config.url}${img.url}`) : null
            }))
          })),
      },
    });
    
    // Disable caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    instanceLogger.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Sonarr data' },
      { status: 500 }
    );
  }
});