import { NextResponse } from 'next/server';
import { withInstanceSupport } from '@/lib/api/multi-instance-wrapper';
import { ServiceInstance } from '@/lib/config/multi-instance-types';
import { createJellyseerrClient } from '@/lib/api/jellyseerr';
import { logger } from '@/lib/logger';

export const GET = withInstanceSupport(async (config: ServiceInstance) => {
  try {
    if (!config.url || !config.apiKey) {
      return NextResponse.json(
        { error: 'Jellyseerr not configured' },
        { status: 503 }
      );
    }

    const jellyseerr = createJellyseerrClient({
      url: config.url,
      apiKey: config.apiKey,
    });

    // Fetch all data in parallel
    const [
      status,
      settings,
      requestCount,
      requests,
      recentlyAdded,
      issueCount,
    ] = await Promise.allSettled([
      jellyseerr.getStatus(),
      jellyseerr.getSettings(),
      jellyseerr.getRequestCount(),
      jellyseerr.getRequests(10),
      jellyseerr.getRecentlyAdded(10),
      jellyseerr.getIssueCount(),
    ]);

    // Process results
    const getResult = (result: PromiseSettledResult<unknown>) => 
      result.status === 'fulfilled' ? result.value : null;

    const statusData = getResult(status) as Awaited<ReturnType<typeof jellyseerr.getStatus>> | null;
    const settingsData = getResult(settings) as Awaited<ReturnType<typeof jellyseerr.getSettings>> | null;
    const requestCountData = getResult(requestCount) as Awaited<ReturnType<typeof jellyseerr.getRequestCount>> | null;
    const requestsData = getResult(requests) as Awaited<ReturnType<typeof jellyseerr.getRequests>> | null;
    const recentlyAddedData = getResult(recentlyAdded) as Awaited<ReturnType<typeof jellyseerr.getRecentlyAdded>> | null;
    const issueCountData = getResult(issueCount) as Awaited<ReturnType<typeof jellyseerr.getIssueCount>> | null;

    // Enrich requests with poster paths
    let enrichedRequests = requestsData?.results || [];
    if (enrichedRequests.length > 0) {
      const mediaDetailsPromises = enrichedRequests.map(async (request) => {
        try {
          if (request.media.tmdbId) {
            if (request.type === 'movie') {
              const movieDetails = await jellyseerr.getMovieDetails(request.media.tmdbId) as {
                title: string;
                posterPath?: string;
                backdropPath?: string;
                releaseDate?: string;
              };
              return {
                ...request,
                media: {
                  ...request.media,
                  title: movieDetails.title,
                  posterPath: movieDetails.posterPath,
                  backdropPath: movieDetails.backdropPath,
                  releaseDate: movieDetails.releaseDate,
                }
              };
            } else {
              const tvDetails = await jellyseerr.getTvDetails(request.media.tmdbId) as {
                name: string;
                posterPath?: string;
                backdropPath?: string;
                firstAirDate?: string;
              };
              return {
                ...request,
                media: {
                  ...request.media,
                  title: tvDetails.name,
                  posterPath: tvDetails.posterPath,
                  backdropPath: tvDetails.backdropPath,
                  releaseDate: tvDetails.firstAirDate,
                }
              };
            }
          }
        } catch (err) {
          logger.error(`Failed to fetch details for ${request.media.tmdbId}:`, err);
        }
        return request;
      });

      enrichedRequests = await Promise.all(mediaDetailsPromises);
    }

    // Enrich recently added items with poster paths and titles
    let enrichedRecentlyAdded = recentlyAddedData?.results || [];
    if (enrichedRecentlyAdded.length > 0) {
      const recentlyAddedDetailsPromises = enrichedRecentlyAdded.map(async (item) => {
        try {
          if (item.tmdbId) {
            if (item.mediaType === 'movie') {
              const movieDetails = await jellyseerr.getMovieDetails(item.tmdbId) as {
                title: string;
                posterPath?: string;
                backdropPath?: string;
                releaseDate?: string;
              };
              return {
                ...item,
                title: movieDetails.title,
                posterPath: movieDetails.posterPath,
                backdropPath: movieDetails.backdropPath,
                releaseDate: movieDetails.releaseDate,
              };
            } else {
              const tvDetails = await jellyseerr.getTvDetails(item.tmdbId) as {
                name: string;
                posterPath?: string;
                backdropPath?: string;
                firstAirDate?: string;
              };
              return {
                ...item,
                title: tvDetails.name,
                posterPath: tvDetails.posterPath,
                backdropPath: tvDetails.backdropPath,
                releaseDate: tvDetails.firstAirDate,
              };
            }
          }
        } catch (err) {
          logger.error(`Failed to fetch details for recently added ${item.tmdbId}:`, err);
        }
        return item;
      });

      enrichedRecentlyAdded = await Promise.all(recentlyAddedDetailsPromises);
    }

    return NextResponse.json({
      system: {
        version: statusData?.version || 'Unknown',
        commitTag: statusData?.commitTag,
        updateAvailable: statusData?.updateAvailable || false,
        commitsBehind: statusData?.commitsBehind || 0,
        applicationTitle: settingsData?.main?.applicationTitle || 'Jellyseerr',
        initialized: settingsData?.main?.initialized || false,
      },
      stats: {
        totalRequests: requestCountData?.total || 0,
        movieRequests: requestCountData?.movie || 0,
        tvRequests: requestCountData?.tv || 0,
        pendingRequests: requestCountData?.pending || 0,
        approvedRequests: requestCountData?.approved || 0,
        declinedRequests: requestCountData?.declined || 0,
        processingRequests: requestCountData?.processing || 0,
        availableRequests: requestCountData?.available || 0,
        totalIssues: issueCountData?.total || 0,
        openIssues: issueCountData?.open || 0,
      },
      activity: {
        recentRequests: enrichedRequests,
        recentlyAdded: enrichedRecentlyAdded,
      },
    });
  } catch (error) {
    logger.error('Jellyseerr API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Jellyseerr data' },
      { status: 500 }
    );
  }
});