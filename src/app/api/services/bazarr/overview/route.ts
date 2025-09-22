/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createBazarrClient } from '@/lib/api/bazarr';
import { withInstanceSupport, createInstanceLogger } from '@/lib/api/multi-instance-wrapper';
import { ServiceInstance } from '@/lib/config/multi-instance-types';
import axios from 'axios';

interface BazarrConfig {
  url: string;
  apiKey: string;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withInstanceSupport(async (config: ServiceInstance, instanceId: string) => {
  const instanceLogger = createInstanceLogger(instanceId, 'bazarr');
  try {
    if (!config.url || !config.apiKey) {
      return NextResponse.json(
        { error: 'Bazarr not configured' },
        { status: 503 }
      );
    }

    const bazarr = createBazarrClient({
      url: config.url,
      apiKey: config.apiKey,
    });

    instanceLogger.info('Fetching Bazarr overview data...');

    // Fetch all available data in parallel
    const [
      systemStatusResult,
      systemHealthResult,
      badgesResult,
      historyStatsResult,
      providersStatusResult,
      episodesResult,
      moviesResult,
      systemTasksResult,
      systemLanguagesResult,
      systemLanguageProfilesResult,
      providersResult,
      seriesResult,
      webhooksResult
    ] = await Promise.allSettled([
      bazarr.getSystemStatus(),
      bazarr.getSystemHealth(),
      bazarr.getBadges(),
      bazarr.getHistoryStats('week'),
      bazarr.getProvidersStatus(),
      bazarr.getEpisodes(),
      bazarr.getMovies(),
      bazarr.getSystemTasks(),
      bazarr.getSystemLanguages(),
      bazarr.getSystemLanguageProfiles(),
      bazarr.getProviders(),
      bazarr.getSeries(),
      bazarr.getWebhooks()
    ]);

    const getResult = <T>(result: PromiseSettledResult<T>): T | null => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        instanceLogger.debug('API call failed:', result.reason);
        return null;
      }
    };

    const systemStatus = getResult(systemStatusResult);
    const systemHealth = getResult(systemHealthResult);
    const badges = getResult(badgesResult);
    const historyStats = getResult(historyStatsResult);
    const providersStatus = getResult(providersStatusResult);
    const episodes = getResult(episodesResult) || [];
    const movies = getResult(moviesResult) || [];
    const systemTasks = getResult(systemTasksResult) || [];
    const systemLanguages = getResult(systemLanguagesResult) || [];
    const systemLanguageProfiles = getResult(systemLanguageProfilesResult) || [];
    const providers = getResult(providersResult) || [];
    const series = getResult(seriesResult) || [];
    const webhooks = getResult(webhooksResult) || [];

    // Calculate statistics
    const totalEpisodes = Array.isArray(episodes) ? episodes.length : 0;
    const totalMovies = Array.isArray(movies) ? movies.length : 0;
    const totalSeries = Array.isArray(series) ? series.length : 0;
    
    // Count episodes and movies with/without subtitles
    const episodesWithSubtitles = Array.isArray(episodes) ? 
      episodes.filter((ep: any) => ep.subtitles && ep.subtitles.length > 0).length : 0;
    const episodesWithoutSubtitles = totalEpisodes - episodesWithSubtitles;
    
    const moviesWithSubtitles = Array.isArray(movies) ? 
      movies.filter((movie: any) => movie.subtitles && movie.subtitles.length > 0).length : 0;
    const moviesWithoutSubtitles = totalMovies - moviesWithSubtitles;

    // Provider statistics
    const enabledProviders = Array.isArray(providers) ? 
      providers.filter((provider: any) => provider.enabled === true).length : 0;
    const totalProviders = Array.isArray(providers) ? providers.length : 0;

    // Health issues count
    const healthIssues = Array.isArray(systemHealth) ? systemHealth.length : 0;

    // Tasks statistics
    const activeTasks = Array.isArray(systemTasks) ? 
      systemTasks.filter((task: any) => task.status === 'running').length : 0;
    const totalTasks = Array.isArray(systemTasks) ? systemTasks.length : 0;

    // Language statistics
    const totalLanguages = Array.isArray(systemLanguages) ? systemLanguages.length : 0;
    const totalLanguageProfiles = Array.isArray(systemLanguageProfiles) ? systemLanguageProfiles.length : 0;

    const response = NextResponse.json({
      server: {
        status: systemStatus || null,
        health: {
          issues: healthIssues,
          healthy: healthIssues === 0
        },
        version: systemStatus?.bazarr_version || 'unknown',
        platform: systemStatus?.operating_system || 'unknown',
        uptime: systemStatus ? {
          start_time: systemStatus.start_time,
          uptime: systemStatus.uptime
        } : null
      },
      statistics: {
        // Content statistics
        episodes: {
          total: totalEpisodes,
          with_subtitles: episodesWithSubtitles,
          without_subtitles: episodesWithoutSubtitles,
          completion_rate: totalEpisodes > 0 ? Math.round((episodesWithSubtitles / totalEpisodes) * 100) : 0
        },
        movies: {
          total: totalMovies,
          with_subtitles: moviesWithSubtitles,
          without_subtitles: moviesWithoutSubtitles,
          completion_rate: totalMovies > 0 ? Math.round((moviesWithSubtitles / totalMovies) * 100) : 0
        },
        series: {
          total: totalSeries
        },
        // Provider statistics
        providers: {
          total: totalProviders,
          enabled: enabledProviders,
          disabled: totalProviders - enabledProviders
        },
        // System statistics
        tasks: {
          total: totalTasks,
          active: activeTasks,
          idle: totalTasks - activeTasks
        },
        languages: {
          total: totalLanguages,
          profiles: totalLanguageProfiles
        },
        webhooks: Array.isArray(webhooks) ? webhooks.length : 0
      },
      badges: badges || {},
      history: {
        stats: historyStats || null
      },
      providers: {
        status: providersStatus || [],
        list: providers.map((provider: any) => ({
          name: provider.name || provider.id,
          enabled: provider.enabled === true,
          status: provider.status || 'unknown'
        }))
      },
      tasks: systemTasks.map((task: any) => ({
        name: task.name || task.job_id,
        status: task.status || 'unknown',
        next_run: task.next_run_time,
        last_run: task.last_run_time
      })),
      languages: {
        available: systemLanguages.length,
        profiles: systemLanguageProfiles.map((profile: any) => ({
          name: profile.name,
          id: profile.profileId,
          languages: profile.items ? profile.items.length : 0
        }))
      }
    });

    instanceLogger.info('Bazarr overview data fetched successfully');
    return response;

  } catch (error) {
    instanceLogger.error('Failed to fetch Bazarr overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Bazarr overview' },
      { status: 500 }
    );
  }
});
