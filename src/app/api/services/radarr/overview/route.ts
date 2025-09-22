/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { ServiceInstance } from '@/lib/config/multi-instance-types';
import { createRadarrClient } from '@/lib/api/radarr';
import { withInstanceSupport, createInstanceLogger } from '@/lib/api/multi-instance-wrapper';

export const GET = withInstanceSupport(async (config: ServiceInstance, instanceId: string) => {
  const instanceLogger = createInstanceLogger(instanceId, 'radarr');
  try {
    if (!config.url || !config.apiKey) {
      return NextResponse.json(
        { error: 'Radarr not configured' },
        { status: 503 }
      );
    }

    const radarr = createRadarrClient({
      url: config.url,
      apiKey: config.apiKey,
    });

    // Fetch all available data in parallel
    const [
      systemStatus,
      health,
      diskSpace,
      movies,
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
      radarr.getSystemStatus(),
      radarr.getHealth(),
      radarr.getDiskSpace(),
      radarr.getMovies(),
      radarr.getQueue(),
      radarr.getQueueStatus(),
      radarr.getHistory(50, 1),
      radarr.getCalendar(
        new Date(),
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
      ),
      radarr.getWantedMissing(50, 1),
      radarr.getCommands(),
      radarr.getTasks(),
      radarr.getIndexers(),
      radarr.getDownloadClients(),
      radarr.getRootFolders(),
      radarr.getQualityProfiles(),
      radarr.getUpdates(),
      radarr.getBackups(),
    ]);

    // Process results and handle errors gracefully
    const getResult = (result: PromiseSettledResult<unknown>) => 
      result.status === 'fulfilled' ? result.value : null;

    // Calculate statistics
    const moviesData = (getResult(movies) as any[]) || [];
    const queueData = (getResult(queue) as { records: any[] }) || { records: [] };
    const historyData = (getResult(recentHistory) as { records: any[] }) || { records: [] };
    const calendarData = (getResult(calendar) as any[]) || [];
    const wantedData = (getResult(wantedMissing) as { records: any[] }) || { records: [] };

    const stats = {
      totalMovies: moviesData.length,
      monitoredMovies: moviesData.filter((m) => m.monitored).length,
      downloadedMovies: moviesData.filter((m) => m.hasFile).length,
      missingMovies: moviesData.filter((m) => m.monitored && !m.hasFile).length,
      queuedItems: queueData.records?.length || 0,
      upcomingReleases: calendarData.length,
      totalFileSize: moviesData.reduce((sum, m) => sum + (m.sizeOnDisk || 0), 0),
    };

    // Process history items to include movie information
    const processedHistory = historyData.records?.map((historyItem: any) => {
      // If the history item has a movieId, find the corresponding movie
      if (historyItem.movieId) {
        const movie = moviesData.find((m: any) => m.id === historyItem.movieId);
        if (movie) {
          return {
            ...historyItem,
            movie: {
              id: movie.id,
              title: movie.title,
              images: movie.images?.map((img: any) => ({
                ...img,
                url: img.url ? `${config.url}${img.url}` : img.url
              }))
            }
          };
        }
      }
      return historyItem;
    }) || [];

    return NextResponse.json({
      system: {
        status: getResult(systemStatus),
        health: getResult(health),
        diskSpace: getResult(diskSpace),
        updates: getResult(updates),
      },
      stats,
      activity: {
        queue: queueData.records || [],
        queueStatus: getResult(queueStatus),
        recentHistory: processedHistory,
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
      movies: {
        recent: moviesData
          .sort((a, b) => new Date(b.added).getTime() - new Date(a.added).getTime())
          .slice(0, 10)
          .map((movie) => ({
            ...movie,
            images: movie.images?.map((img: any) => ({
              ...img,
              url: img.url ? `${config.url}${img.url}` : img.url
            }))
          })),
        upcoming: calendarData.slice(0, 10)
          .map((movie: any) => ({
            ...movie,
            images: movie.images?.map((img: any) => ({
              ...img,
              url: img.url ? `${config.url}${img.url}` : img.url
            }))
          })),
        topRated: moviesData
          .filter((m) => m.ratings?.imdb?.value)
          .sort((a, b) => (b.ratings?.imdb?.value || 0) - (a.ratings?.imdb?.value || 0))
          .slice(0, 10)
          .map((movie) => ({
            ...movie,
            images: movie.images?.map((img: any) => ({
              ...img,
              url: img.url ? `${config.url}${img.url}` : img.url
            }))
          })),
        // Include all movies for history matching (not sent to client)
        all: moviesData,
      },
    });
  } catch (error) {
    instanceLogger.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Radarr data' },
      { status: 500 }
    );
  }
});