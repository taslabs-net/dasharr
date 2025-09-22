import { NextResponse } from 'next/server';
import { createOverseerrClient } from '@/lib/api/overseerr';
import { withInstanceSupport } from '@/lib/api/multi-instance-wrapper';
import { ServiceInstance } from '@/lib/config/multi-instance-types';
import { logger } from '@/lib/logger';

export const GET = withInstanceSupport(async (config: ServiceInstance) => {
  try {
    if (!config.url || !config.apiKey) {
      return NextResponse.json(
        { error: 'Overseerr not configured' },
        { status: 503 }
      );
    }

    const overseerr = createOverseerrClient({
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
      overseerr.getStatus(),
      overseerr.getSettings(),
      overseerr.getRequestCount(),
      overseerr.getRequests(10),
      overseerr.getRecentlyAdded(10),
      overseerr.getIssueCount(),
    ]);

    // Process results
    const getResult = (result: PromiseSettledResult<unknown>) => {
      if (result.status === 'rejected') {
        logger.error('Promise rejected:', result.reason);
      }
      return result.status === 'fulfilled' ? result.value : null;
    };

    const statusData = getResult(status) as Awaited<ReturnType<typeof overseerr.getStatus>> | null;
    const settingsData = getResult(settings) as Awaited<ReturnType<typeof overseerr.getSettings>> | null;
    const requestCountData = getResult(requestCount) as Awaited<ReturnType<typeof overseerr.getRequestCount>> | null;
    const requestsData = getResult(requests) as Awaited<ReturnType<typeof overseerr.getRequests>> | null;
    const recentlyAddedData = getResult(recentlyAdded) as Awaited<ReturnType<typeof overseerr.getRecentlyAdded>> | null;
    const issueCountData = getResult(issueCount) as Awaited<ReturnType<typeof overseerr.getIssueCount>> | null;

    // Enrich requests with poster paths
    let enrichedRequests = requestsData?.results || [];
    if (enrichedRequests.length > 0) {
      const mediaDetailsPromises = enrichedRequests.map(async (request) => {
        try {
          if (request.media.tmdbId) {
            if (request.type === 'movie') {
              const movieDetails = await overseerr.getMovieDetails(request.media.tmdbId);
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
              const tvDetails = await overseerr.getTvDetails(request.media.tmdbId);
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

    return NextResponse.json({
      system: {
        version: statusData?.version || 'Unknown',
        commitTag: statusData?.commitTag,
        updateAvailable: statusData?.updateAvailable || false,
        commitsBehind: statusData?.commitsBehind || 0,
        applicationTitle: settingsData?.applicationTitle || 'Overseerr',
        initialized: settingsData ? true : false,
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
        recentlyAdded: recentlyAddedData?.results || [],
      },
    });
  } catch (error) {
    logger.error('Overseerr API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Overseerr data' },
      { status: 500 }
    );
  }
});